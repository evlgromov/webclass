const { Socket } = require('socket.io-client');
const Canvas = require('../models/Canvas');
const Layer = require('../models/Layer');
const Shape = require('../models/Shape');

module.exports = (client, io, clients, canvases) => {
  /**
   * @param {Object} id - id холста
   * @description Владелец холста изменяет его
   */
  client.on('canvas-reload', async (id) => {
    const canvas = canvases[id];
    if (!canvas || canvas.owner != client.request.user._id) return;
    const dbCanvas = await Canvas.findById(id);
    canvas.access = dbCanvas.access;
    canvas.title = dbCanvas.title;
    canvas.access = dbCanvas.access;
    switch (canvas.access) {
      case 1:
        Object.values(canvas.accessUsers).forEach((user) => {
          if (user._id !== canvas.owner) {
            client.to(user._id).emit("canvas-reloaded", {access: false});
          }
        })
        canvas.accessUsers = {}
        canvas.accessUsers[canvas.owner] = {canChange: true};
        break;
      case 2:
        dbCanvas.accessUsers = dbCanvas.accessUsers.reduce(function(acc, cur) {acc[cur._id]={...cur, active: false};return acc}, {});
        dbCanvas.accessUsers[canvas.owner] = {canChange: true};
        Object.values(canvas.accessUsers).forEach((user) => {
          if (dbCanvas.accessUsers[user._id]) {
            client.to(user._id).emit("canvas-reloaded", {access: true, ...dbCanvas.accessUsers[user._id]});
          } else {
            client.to(user._id).emit("canvas-reloaded", {access: false});
          }
        });
        canvas.accessUsers = dbCanvas.accessUsers;
        break;
      case 3:
        canvas.accessUsers[canvas.owner] = {canChange: true};
        client.to(user._id).emit("canvas-reloaded", {access: true, ...canvas.accessUsers[user._id]});
        break;
    }
  })

  /**
   * @param {Object} data - Данные, которые поступили от юзера
   * @param {Object} data.shape - фигура
   * @param {string} data.canvasId - id холста
   * @param {string} data.layerId - id слоя
   * @description Юзер передал фигуру, которая сохраняется в бд 
   * и передаётся другим участникам холста
   */
  client.on('canvas-add-shape', async (data) => {
    const canvas = canvases[data.canvasId];
    const layer = canvas.layers.find(({_id}) => _id == data.layerId);
    const id = client.request.user._id;
    if (canvas && canvas.accessUsers[id] && canvas.accessUsers[id].canChange && layer && data.shape) {
      let shape;
      switch (data.shape.type) {
        case 'pencil' :
          shape = await Shape.create({
            type: 'pencil',
            layer: data.layerId,
            points: data.shape.points,
          });
          break;
        case 'img': 
          shape = await Shape.create({
            type: 'img',
            layer: data.layerId,
            x: data.shape.x,
            y: data.shape.y,
            height: data.shape.height,
            width: data.shape.width,
            src: data.shape.src,
          });
          break;
      }
      client.to(data.canvasId).emit("canvas-added-shape", shape);
    }
  });

  /**
   * @param {Object} data - Данные, которые поступили от юзера
   * @param {Object} data.shapes - фигуры
   * @param {string} data.canvasId - id холста
   * @description Юзер передал данные pdf документа
   */
  client.on('canvas-add-pdf', async (data) => {
    console.log('start');
    const canvas = canvases[data.canvasId];
    const id = client.request.user._id;
    if (canvas && canvas.accessUsers[id] && canvas.accessUsers[id].canChange && data.shapes) {
      const layers = [];
      const shapes = [];
      for (shape of data.shapes) {
        if (shape.layer.exists && canvas.layers.find(({_id}) => _id == shape.layer._id)) {
          shape.layer = shape.layer._id;
        } else {
          const layer = await Layer.create({canvas: data.canvasId});
          canvas.layers.push(layer);
          layers.push(layer);
          shape.layer = layer._id;
        }
        shape = await Shape.create({
          type: 'img',
          layer: shape.layer,
          x: shape.x,
          y: shape.y,
          height: shape.height,
          width: shape.width,
          src: shape.src,
        });
        shapes.push(shape);
      }
      io.in(data.canvasId).emit("canvas-added-layers", layers);
      io.in(data.canvasId).emit("canvas-added-shapes", shapes);
      console.log('end')
    }
  });

  /**
   * @param {Object} data - Данные, которые поступили от юзера
   * @param {string} data.canvasId - id холста
   * @param {string} data.layerId - id слоя
   * @param {string} data.shapes - фигуры
   * @description Юзер изменил положение фигур
   */
  client.on('canvas-change-position-shapes', async (data) => {
    const canvas = canvases[data.canvasId];
    const layer = canvas.layers.find(({_id}) => _id == data.layerId);
    const id = client.request.user._id;
    if (canvas && canvas.accessUsers[id] && layer) {
      const shapes = [];
      for (let shape of data.shapes) {
        const res = await Shape.updateOne({_id: shape._id, layer: data.layerId}, {x: shape.x, y: shape.y});
        if (res.n) {
          shapes.push(shape)
        }
      }
      client.to(data.canvasId).emit("canvas-changed-position-shapes", {shapes, layerId: data.layerId});
    }
  })

  /**
   * @param {Object} data - Данные, которые поступили от юзера
   * @param {string} data.canvasId - id холста
   * @param {string} data.layerId - id слоя
   * @description Юзер запросил фигуры
   */
  client.on('canvas-get-shapes', async (data) => {
    const canvas = canvases[data.canvasId];
    const layer = canvas.layers.find(({_id}) => _id == data.layerId);
    const id = client.request.user._id;
    if (canvas && canvas.accessUsers[id] && layer) {
      const shapes = await Shape.find({ layer: data.layerId });
      client.emit("canvas-got-shapes", {shapes, layerId: data.layerId});
    }
  });

  /**
   * @param {string} canvasId - id холста
   * @description Юзер создаёт новый слой на холсте.
   */
  client.on('canvas-add-layer', async (canvasId) => {
    const canvas = canvases[canvasId];
    const id = client.request.user._id;
    if (canvas && canvas.owner == id) {
      const layer = await Layer.create({canvas: canvasId});
      canvas.layers.push(layer);
      io.in(canvasId).emit("canvas-added-layer", layer);
    }
  })

  /**
   * @param {string} canvasId - id холста
   * @description Юзер зашёл на холст.
   */
  client.on("canvas-sing-in", async (canvasId) => {
    const canvas = canvases[canvasId];
    const userId = client.request.user._id;
    if (!canvas) {
      let dbCanvas = await Canvas.findById(canvasId).populate({path: 'layers', options: {sort: {_id: 1}}});
      const layers = dbCanvas.layers;
      if (!dbCanvas) return;
      dbCanvas = await dbCanvas.toObject();
      dbCanvas.layers = layers ? layers : [];
      dbCanvas.accessUsers = dbCanvas.accessUsers.length ? dbCanvas.accessUsers : {};
      switch (dbCanvas.access) {
        case 1:
          if (dbCanvas.owner == userId) {
            canvases[canvasId] = dbCanvas;
            canvases[canvasId].accessUsers[userId] = {canChange: true};
          }
          break;
        case 2:
          dbCanvas.accessUsers = dbCanvas.accessUsers.reduce(function(acc, cur) {acc[cur._id]={...cur, active: false};return acc}, {});
          if (dbCanvas.accessUsers[userId]) {
            canvases[canvasId] = dbCanvas;
          } else if (dbCanvas.owner == userId) {
            canvases[canvasId] = dbCanvas;
            canvases[canvasId].accessUsers[userId] = {canChange: true};
          }
          break;
        case 3:
          canvases[canvasId] = dbCanvas;
          canvases[canvasId].accessUsers[userId] = {canChange: true};
          break;
      }
    } else {
      switch (canvas.access) {
        case 2:
          if (canvas.owner == userId) {
            canvas.accessUsers[userId] = {canChange: true};
          }
          break;
        case 3:
          canvas.accessUsers[userId] = {canChange: true};
          break;
      }
    }
    if (!canvases[canvasId] || !Object.keys(canvases[canvasId].accessUsers).length || !canvases[canvasId].accessUsers[userId]) {
      client.emit('canvas-info', false);
      return;
    }
    canvases[canvasId].accessUsers[userId].active = true;
    client.join(canvasId);
    client.to(canvasId).emit("canvas-add-user");
    client.emit('canvas-info', {
      user: canvases[canvasId].accessUsers[userId],
      layers: canvases[canvasId].layers
    });
  });

  /**
   * @param {string} canvasId - id холста
   * @description Юзер покинул холст.
   */
  client.on("canvas-sing-out", (canvasId) => {
    const canvas = canvases[canvasId];
    if (canvas && canvas.accessUsers[client.request.user._id]) {
      if (Object.values(canvas.accessUsers).filter(({active}) => active).length === 1) {
        delete canvases[canvasId];
      }
      client.leave(canvasId);
      client.to(canvasId).emit("canvas-remove-user");
    }
  });
}