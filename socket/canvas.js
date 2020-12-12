const Canvas = require('../models/Canvas');
const Layer = require('../models/Layer');
const Shape = require('../models/Shape');

module.exports = (client, io, clients, canvases) => {
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
    if (canvas && canvas.accessUsers[id] && canvas.accessUsers[id].canChange && layer) {
      const shape = await Shape.create({
        ...data.shape,
        layer: data.layerId,
      });
      client.to(data.canvasId).emit("canvas-added-shape", shape);
    }
  });

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
      let dbCanvas = await Canvas.findById(canvasId).populate('layers');
      const layers = dbCanvas.layers;
      if (!dbCanvas) return;
      dbCanvas = await dbCanvas.toObject();
      dbCanvas.layers = layers ? layers : [];
      switch (dbCanvas.access) {
        case 1:
          if (dbCanvas.owner == userId) {
            canvases[canvasId] = dbCanvas;
            canvases[canvasId].accessUsers[userId] = {canChange: true};
          }
          break;
        case 2:
          if (dbCanvas.owner == userId) {
            canvases[canvasId] = dbCanvas;
            break;
          }
          dbCanvas.accessUsers = dbCanvas.accessUsers.reduce((acc, cur) => {acc[cur._id] = {...cur, active: false};return acc}, {});
          if (dbCanvas.accessUsers[userId]) {
            canvases[canvasId] = dbCanvas;
          }
          break;
        case 3:
          canvases[canvasId] = dbCanvas;
          canvases[canvasId].accessUsers[userId] = {canChange: dbCanvas.owner == userId};
          break;
      }
    } else {
      if (canvas.access = 3) {
        canvas.accessUsers[userId] = {canChange: canvas.owner == userId};
      }
    }
    if (!canvases[canvasId] && !canvases[canvasId].accessUsers[userId]) {
      client.emit('canvas-info', false);
      return;
    }

    canvases[canvasId].accessUsers[userId].active = true;
    client.join(canvasId);
    client.to(canvasId).emit("canvas-add-user");
    client.emit('canvas-info', {
      user: {canChange: canvases[canvasId].accessUsers[userId]},
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