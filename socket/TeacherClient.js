const Lesson = require('../models/Lesson');

const SocketClient = require('./SocketClient');

module.exports = class TeacherClient extends SocketClient {
  constructor(io, socket, user, activeUsers, activeVideoCall) {
    super(io, socket, user, activeUsers, activeVideoCall);

    this.onInviteCallUser = this.onInviteCallUser.bind(this);
    this.onEndVideoCall = this.onEndVideoCall.bind(this);

    this.initListeners();
  }

  initListeners() {
    this.socket.on('invite-call-user', this.onInviteCallUser);
    this.socket.on('end-video-call', this.onEndVideoCall);
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

  async onEndVideoCall() {
    const lesson = await Lesson.findById(this.currentVideoCall._id).populate('teacher');

    if (lesson.teacher._id.toString() !== this.user._id.toString()) return;

    lesson.end = Date.now();

    lesson.save();

    for (let i = 0; i < this.activeVideoCall.length; i++) {
      if (this.activeVideoCall[i]._id.toString() === this.currentVideoCall._id.toString()) {
        this.activeVideoCall.splice(i, 1);
        break
      }
    }

    this.socket.to(this.currentVideoCall._id).emit('ended-video-call');

    this.socket.leave(this.currentVideoCall._id);

    this.currentVideoCall = null;
  }
}