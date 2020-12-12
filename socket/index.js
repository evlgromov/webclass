const jwtAuth = require('socketio-jwt-auth');
const { cli } = require('webpack');
const User = require('../models/User');

module.exports = (server, app) => {
  const io = require('socket.io')(server);
  const clients = {};
  const videocalls = {};
  const canvases = {};
  io.use(jwtAuth.authenticate({
    secret: process.env.JWT_SECRET,
    algorithm: 'HS256',
    succeedWithoutToken: true
  },  async (payload, done) => {
    if(payload && payload._id) {
      try {
        const user = await (await User.findById(payload._id)).toObject();
        if(!user) return done(null, false, 'user does not exist');
        
        user._id = user._id.toString();
        done(null, user);
      } catch (error) {
        done(error);
      }
    } else {
      return done();
    }
  }));
  io.on('connection', (client) => {
    if (clients[client.request.user._id]) {
      return;
    }
    clients[client.request.user._id] = {
      clientId: client.id,
      role: client.request.user.role,
    };

    /**
     * Видеозвонки, уроки
     * Приглашение от учителя посетить видеозвонок, 
     * принятие этого предложение студентом.
     * Прослушки, логика, связанная с webrtc и Videocall моделью.
     */
    require('./lesson')(client, clients, videocalls);

    /**
     * Чаты
     * Переписка, сохранение сообщений, создание чатов
     */
    require('./chat')(client, clients);

    require('./canvas')(client, clients, canvases);

    client.on('disconnect', () => {
      for (let key in videocalls) {
        if (videocalls[key][client.request.user.role] === client.request.user._id) {
          client.to(key).emit("videocall-remove-user");
          break;
        }
      }
      for (let key in canvases) {
        if (canvases[key][client.request.user._id]) {
          delete canvases[key][client.request.user._id]
          client.to(key).emit("canvas-remove-user");
          if(!Object.keys(canvases[key]).length) {
            delete canvases[key];
          }
          break;
        }
      }
      delete clients[client.request.user._id];
    })
  });
}