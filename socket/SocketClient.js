module.exports = class SocketClient {
  constructor(io, socket, user, activeUsers, activeVideoCall) {
    this.io = io;
    this.socket = socket;
    this.user = user;
    this.activeUsers = activeUsers;
    this.activeVideoCall = activeVideoCall;
    this.currentVideoCall = null;
    const videoCall = this.activeVideoCall.find((call) => call[user.role]._id.toString() === user._id.toString());
    if (videoCall) {
      this.socket.join(videoCall._id);
      videoCall[user.role].socketId = socket.id;
      this.currentVideoCall = videoCall;
      this.socket.to(videoCall._id).emit("add-user");
    }

    this.onDisconnect = this.onDisconnect.bind(this);
    this.onNewLcecandidate = this.onNewLcecandidate.bind(this);
    this.callUser = this.callUser.bind(this);
    this.onMakeAnswer = this.onMakeAnswer.bind(this);

    this.socket.on("disconnect", this.onDisconnect);
    this.socket.on('new-icecandidate', this.onNewLcecandidate);
    this.socket.on("call-user", this.callUser);
    this.socket.on("make-answer", this.onMakeAnswer);
  }

  onDisconnect() {
    for (let i = 0; i < this.activeUsers.length; i++) {
      if (this.activeUsers[i]._id === this.user._id) {
        this.activeUsers.splice(i, 1);
      }
    }
    this.socket.broadcast.emit("remove-user");
  }

  onNewLcecandidate({ icecandidate }) {
    if (this.currentVideoCall) {
      this.socket.to(this.currentVideoCall._id).emit("add-icecandidate", {
        icecandidate: icecandidate,
      });
    }
  }

  callUser(data) {
    if (!this.currentVideoCall) {
      this.currentVideoCall = this.activeVideoCall.find(({ _id }) => _id.toString() === data.channelId);
    }
    console.log(this.currentVideoCall[this.reverseRole(this.user.role)])
    if (this.currentVideoCall && this.currentVideoCall[this.user.role]._id.toString() === this.user._id.toString()) {
      this.socket.join(data.channelId);
      this.socket.to(this.currentVideoCall[this.reverseRole(this.user.role)].socketId).emit("call-made", {
        offer: data.offer,
        channelId: data.channelId
      });
    } else {
      return;
    }
  }

  onMakeAnswer(data) {
    if (!this.currentVideoCall) {
      this.currentVideoCall = this.activeVideoCall.find(({ _id }) => _id.toString() === data.channelId);
    }
    if (this.currentVideoCall && this.currentVideoCall[this.user.role]._id.toString() === this.user._id.toString()) {
      this.socket.join(data.channelId);
      this.socket.to(data.channelId).emit("answer-made", {
        answer: data.answer
      });
    } else {
      return;
    }
  }

  reverseRole(role) {
    return role === 'student' ? 'teacher' : 'student';
  }
}