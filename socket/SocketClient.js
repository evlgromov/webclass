const Chat = require('../models/Chat');
const User = require('../models/User');

module.exports = class SocketClient {
  constructor(io, socket, user, activeUsers, activeVideoCall) {
    this.io = io;
    this.socket = socket;
    this.user = user;
    this.activeUsers = activeUsers;

    // Chats
    this.currentChat = null;

    // Video Calls
    this.activeVideoCall = activeVideoCall;
    this.currentVideoCall = null;

    // Chats
    this.onChatSingIn = this.onChatSingIn.bind(this);
    this.onChatSingOut = this.onChatSingOut.bind(this);
    this.onSendMessage = this.onSendMessage.bind(this);

    this.socket.on("chat-sing-in", this.onChatSingIn);
    this.socket.on("chat-sing-out", this.onChatSingOut);
    this.socket.on("send-message", this.onSendMessage)

    // Video Calls
    this.onVideoSingIn = this.onVideoSingIn.bind(this);
    this.onVideoSingOut = this.onVideoSingOut.bind(this);
    this.onDisconnect = this.onDisconnect.bind(this);
    this.onNewLcecandidate = this.onNewLcecandidate.bind(this);
    this.callUser = this.callUser.bind(this);
    this.onMakeAnswer = this.onMakeAnswer.bind(this);

    this.socket.on("video-sing-in", this.onVideoSingIn);
    this.socket.on("video-sing-out", this.onVideoSingOut);
    this.socket.on('new-icecandidate', this.onNewLcecandidate);
    this.socket.on("call-user", this.callUser);
    this.socket.on("make-answer", this.onMakeAnswer);

    this.socket.on("disconnect", this.onDisconnect);
  }

  onSendMessage(message) {
    if (this.currentChat) {
      this.socket.to(this.currentChat._id).emit("sended-message", message);
    }
  }

  async onChatSingIn(chatId) {
    const chat = (await Chat.find({ _id: chatId, [this.user.role]: this.user._id }))[0];
    if (chat) {
      this.currentChat = chat.toObject();
      const secondUserId = this.currentChat[this.reverseRole(this.user.role)];
      this.socket.join(this.currentChat._id);
      this.socket.emit("get-second-user",
        ...(await User.findById(secondUserId)).toObject()
      );
    }
  }

  onChatSingOut() {
    if (this.currentChat) {
      this.socket.leave(this.currentChat._id)
    }
  }

  // Video Calls
  onVideoSingIn() {
    console.log('kurento')
    const videoCall = this.activeVideoCall.find((call) => call[this.user.role]._id.toString() === this.user._id.toString());
    if (videoCall) {
      this.socket.join(videoCall._id);
      videoCall[this.user.role].socketId = this.socket.id;
      this.currentVideoCall = videoCall;
      this.socket.to(videoCall._id).emit("video-add-user");
    }
  }

  onVideoSingOut() {
    if (this.currentVideoCall) {
      this.socket.to(this.currentVideoCall._id).emit("video-remove-user");
    }
  }

  onDisconnect() {
    for (let i = 0; i < this.activeUsers.length; i++) {
      if (this.activeUsers[i]._id.toString() === this.user._id.toString()) {
        this.activeUsers.splice(i, 1);
        break;
      }
    }
    if (this.currentVideoCall) {
      this.socket.to(this.currentVideoCall._id).emit("video-remove-user");
    }
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