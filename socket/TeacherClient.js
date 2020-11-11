const SocketClient = require('./SocketClient');

module.exports = class TeacherClient extends SocketClient {
  constructor(io, socket, user, activeUsers, activeVideoCall) {
    super(io, socket, user, activeUsers, activeVideoCall);

    this.onInviteCallUser = this.onInviteCallUser.bind(this);

    this.initListeners();
  }

  initListeners() {
    this.socket.on('invite-call-user', this.onInviteCallUser);
  }

  onInviteCallUser(userId) {
    const student = this.activeUsers.find(({ _id }) => _id.toString() === userId);

    if (student) {
      this.socket.to(student.socketId).emit("invited-call-user", {
        user: this.user
      });
    } else {
      this.socket.emit('invited-call-user-offline', {
        studentId: userId
      })
    }
  }
}