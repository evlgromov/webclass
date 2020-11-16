const kurento = require('kurento-client');
const socketioJwt = require('socketio-jwt');
module.exports = (server) => {
  kurento(process.env.WS_URI).then((kurentoClient) => {
    const io = require('socket.io')(server);
    const clients = {};
    const videocalls = {};
    const candidatesQueue = {};
    io.on('connect', socketioJwt.authorize({
      secret: process.env.JWT_SECRET,
      timeout: 1500
    })).on('authenticated', (client) => {
      client.emit('authorized');

      if (clients[client.decoded_token._id]) {
        return;
      }
      clients[client.decoded_token._id] = {
        clientId: client.id,
        role: client.decoded_token.role,
      };

      /**
       * Видеозвонки, уроки
       * Приглашение от учителя посетить видеозвонок, 
       * принятие этого предложение студентом.
       * Прослушки, логика, связанная с webrtc и Videocall моделью.
       */
      require('./lesson')(client, clients, videocalls, kurentoClient, candidatesQueue);

      /**
       * Чаты
       * Переписка, сохранение сообщений, создание чатов
       */
      require('./chat')(client, clients);

      client.on('disconnect', () => {
        for (let key in videocalls) {
          if (videocalls[key][client.decoded_token.role] === client.decoded_token._id) {
            client.to(key).emit("videocall-remove-user");
            break;
          }
        }
        delete clients[client.decoded_token._id];
      })
    });
  })
}