
const socketioJwt = require('socketio-jwt');

const User = require('../models/User');

const activeUsers = [];
const activeVideoCall = [];

const TeacherClient = require('./TeacherClient')
const StudentClient = require('./StudentClient')

module.exports = class IoSocket {
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