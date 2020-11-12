const Lesson = require('../models/Lesson');

const SocketClient = require('./SocketClient');

module.exports = class StudentClient extends SocketClient {
  constructor(io, socket, user, activeUsers, activeVideoCall) {
    super(io, socket, user, activeUsers, activeVideoCall);

    this.onAcceptInviteCallUser = this.onAcceptInviteCallUser.bind(this);
    this.onRefuseInviteCallUser = this.onRefuseInviteCallUser.bind(this);
    this.onCloseVideoCall = this.onCloseVideoCall.bind(this);

    this.initListeners();
    this.socket.emit('inited-socket');
  }

  initListeners() {
    this.socket.on('accept-invite-call-user', this.onAcceptInviteCallUser);
    this.socket.on('refuse-invite-call-user', this.onRefuseInviteCallUser);
    this.socket.on('close-video-call', this.onCloseVideoCall);
  }

  async onAcceptInviteCallUser(socketId) {
    const teacher = this.activeUsers.find((user) => user.socketId === socketId);
    const lesson = await Lesson.create({
      student: this.user._id,
      teacher: teacher._id,
      start: Date.now()
    });
    this.activeVideoCall.push({
      student: this.user,
      teacher: teacher,
      _id: lesson._id
    })
    this.socket.to(socketId).emit('accept-invited-call-user', {
      student: this.user,
      lessonId: lesson._id,
    });
    this.socket.emit('return-accept-invited-call-user', {
      teacher,
      lessonId: lesson._id,
    });
  }

  onRefuseInviteCallUser(socketId) {
    this.socket.to(socketId).emit('refuse-invited-call-user', {
      student: this.user
    });
  }

  onCloseVideoCall() {
    if (!this.activeVideoCall.find(({ _id }) => _id === this.currentVideoCall._id)) {
      this.socket.leave(this.currentVideoCall._id);

      this.currentVideoCall = null;

    }
  }
}