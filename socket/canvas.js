const { cli } = require('webpack');
const Canvas = require('../models/Canvas');
const Shape = require('../models/Shape');

module.exports = (client, clients, canvases) => {
  /**
   * @param {Object} data - Данные, которые поступили от юзера
   * @param {Object} data.shape - фигура
   * @param {string} data.canvasId - id холста
   * @description Юзер передал фигуру, которая сохраняется в бд 
   * и передаётся другим участникам холста
   */
  client.on('canvas-add-shape', async (data) => {
    const canvas = canvases[data.canvasId];
    if (canvas && canvas[client.request.user._id] && canvas[client.request.user._id].canChange) {
      const shape = await Shape.create({
        ...data.shape,
        canvas: data.canvasId,
      });
      client.to(data.canvasId).emit("canvas-added-shape", shape);
    }
  });

  /**
   * @param {string} canvasId - id холста
   * @description Юзер зашёл на холст.
   */
  client.on("canvas-sing-in", async (canvasId) => {
    const canvas = canvases[canvasId];
    let dbCanvas = await Canvas.findById(canvasId);
    if (!dbCanvas) return;
    canvases[canvasId] = {};
    
    switch (dbCanvas.access) {
      case 1:
        console.log(dbCanvas.owner == client.request.user._id)
        if (dbCanvas.owner == client.request.user._id) {
          canvases[canvasId][client.request.user._id] = {canChange: true};
        }
        break;
      case 2:
        if (dbCanvas.owner == client.request.user._id) {
          canvases[canvasId][client.request.user._id] = {canChange: true};
        }
        const user = dbCanvas.accessUsers.find(({_id}) => _id == client.request.user._id);
        if (user) {
          canvases[canvasId][client.request.user._id] = {canChange: user.canChange};
        }
        break;
      case 3:
        canvases[canvasId][client.request.user._id] = {canChange: dbCanvas.owner === client.request.user._id};
        break;
    }

    if (canvases[canvasId][client.request.user._id]) {
      client.join(canvasId);
      client.to(canvasId).emit("canvas-add-user");
      console.log(canvases[canvasId][client.request.user._id].canChange)
      client.emit('canvas-user-info', {canChange: canvases[canvasId][client.request.user._id].canChange});
    } else {
      delete canvases[canvasId];
      client.emit('canvas-user-info', false);
    }
  });

  /**
   * @param {string} canvasId - id холста
   * @description Юзер покинул холст.
   */
  client.on("canvas-sing-out", (canvasId) => {
    const canvas = canvases[canvasId];
    if (canvas && canvas[client.request.user._id]) {
      delete canvas[client.request.user._id];
      client.leave(canvasId);
      client.to(canvasId).emit("canvas-remove-user");
    }
  });
}