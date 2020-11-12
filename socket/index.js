
const socket = require('socket.io');
const socketioJwt = require('socketio-jwt');

const User = require('../models/User');

const activeUsers = [];
const activeVideoCall = [];

const TeacherClient = require('./TeacherClient')
const StudentClient = require('./StudentClient')

module.exports = (server, app) => {
  const io = require('socket.io')(server);
  const clients = {};
  const videocalls = {};
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
     * Приглашение от учителя посетить видео звонок, 
     * принятие этого предложение студентом.
     * Прослушки, логика, связанная с webrtc и Videocall моделью.
     */
    require('./lesson')(client, clients, videocalls);

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
}
class IoSocket {
  constructor(io) {
    this.io = io;
    this.authorize = socketioJwt.authorize({
      secret: process.env.JWT_SECRET,
      timeout: 1500
    });

    this.onAuthenticated = this.onAuthenticated.bind(this);

    this.init();
  }

  init() {
    this.io
      .on("connection", this.authorize)
      .on('authenticated', this.onAuthenticated);
  }

  async onAuthenticated(socket) {
    const id = socket.decoded_token._id;
    if (!id) return;

    const user = (await User.findById(id)).toObject()
    if (!user) return;

    user.socketId = socket.id;

    activeUsers.push(user);

    if (user.role === 'student') {
      new StudentClient(this.io, socket, user, activeUsers, activeVideoCall);
    } else {
      new TeacherClient(this.io, socket, user, activeUsers, activeVideoCall);
    }
  }
}