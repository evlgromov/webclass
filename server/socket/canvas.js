const { Socket } = require('socket.io-client');
const Canvas = require('../models/Canvas');
const Layer = require('../models/Layer');
const Shape = require('../models/Shape');

module.exports = (client, io, clients, canvases) => {
  /**
   * @param {Object} id - id холста
   * @description Владелец холста изменяет настройки
   */
  client.on('canvas-reload', async (id) => {
    const canvas = await Canvas.findById(id).populate({path: 'layers', options: {sort: {_id: 1}}})
    canvases[id] = canvas
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
    if (canvas && layer && data.shape) {
      let shape;
      switch (data.shape.type) {
        case 'pencil' :
          shape = await Shape.create({
            type: 'pencil',
            layer: data.layerId,
            x: data.shape.x,
            y: data.shape.y,
            points: data.shape.points,
            width: data.shape.width,
            height: data.shape.height
          });
          break;
        case 'eraser' :
          shape = await Shape.create({
            type: 'eraser',
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
      io.to(data.canvasId).emit("canvas-added-shape", shape);
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
    if (canvas && data.shapes) {
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
    if (canvas && layer) {
      const shapes = [];
      for (let shape of data.shapes) {
        const res = await Shape.updateOne({_id: shape._id, layer: data.layerId}, {
          x: shape.x,
          y: shape.y,
          points: shape.points
        });
        if (res.n) {
          shapes.push(shape)
        }
      }
      io.to(data.canvasId).emit("canvas-changed-position-shapes", {shapes, layerId: data.layerId});
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
    if (canvas && layer) {
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
    if (canvas) {
      const layer = await Layer.create({canvas: canvasId});
      canvas.layers.push(layer);
      io.to(canvasId).emit("canvas-added-layer", layer);
    }
  })

  /**
   * @param {Object} payload - данные, поступившие от юзера
   * * @param {string} payload.canvasId - id холста
   * @param {string} payload.shapes - шейпы, которые нужно удалить
   * @description Юзер удаляет объекты на холсте.
   */
  client.on('canvas-delete-layer', async (payload) => {
    await Layer.deleteOne({
      _id: payload.layerId
    });
    canvases[payload.canvasId].layers = canvases[payload.canvasId].layers.filter(layer => layer._id !== payload.layerId)
    io.to(payload.canvasId).emit("canvas-deleted-layer", {
      canvas: payload.canvasId,
      layerId: payload.layerId,
      layers: canvases[payload.canvasId].layers
    });
  })

  client.on('canvas-delete-shape', (payload) => {
     payload.shapes.forEach(async shape => {
       await Shape.deleteOne({
         _id: shape._id
       })
    })
    client.to(payload.canvasId).emit("canvas-deleted-shapes", payload.shapes);
  })

  /**
   * @param {string} canvasId - id холста
   * @description Юзер зашёл на холст.
   */
  client.on("canvas-sing-in", async (canvasId) => {
    let canvas = canvases[canvasId];
    const user = client.request.user;
    if (!canvas) {
      let dbCanvas = await Canvas.findById(canvasId).populate({path: 'layers', options: {sort: {_id: 1}}});
      if (!dbCanvas) return;
      canvas = dbCanvas;
      canvases[canvasId] = canvas
    }

    let accessUsersArray = [...canvas.accessUsers]
    accessUsersArray = accessUsersArray.reduce((acc, cur) => {
      acc[cur.email] = cur
      return acc
    }, {});

    if(user._id == canvas.owner || canvas.access == 3) {
      client.emit('canvas-info', {
        canChange: true,
        layers: canvas.layers
      });
    } else if(Object.keys(accessUsersArray).includes(user.email)) {
      client.emit('canvas-info', {
        canChange: accessUsersArray[user.email].canChange,
        layers: canvas.layers
      });
    } else {
      switch (canvas.access) {
        case 1:
          client.emit('canvas-info', {
            canChange: false,
            layers: []
          });
          break;
        case 2:
          client.emit('canvas-info', {
            canChange: false,
            layers: canvas.layers
          });
          break;
      }
    }
    client.join(canvasId);
    client.to(canvasId).emit("canvas-add-user");
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