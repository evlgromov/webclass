
const socketioJwt = require('socketio-jwt');

const User = require('./models/User');
const Lesson = require('./models/Lesson');

let activeUsers = [];
let activeVideoCall = [];

class SocketClient {
  constructor(io, socket, user) {
    this.io = io;
    this.socket = socket;
    this.user = user;
    this.currentVideoCall = null;

    this.socket.on("disconnect", () => {
      activeUsers = activeUsers.filter(
        existingUser => existingUser._id !== user._id
      );
      this.socket.broadcast.emit("remove-user", {
        userId: user._id
      });
    });

    this.onNewLcecandidate = this.onNewLcecandidate.bind(this);
    this.callUser = this.callUser.bind(this);
    this.onMakeAnswer = this.onMakeAnswer.bind(this);

    this.socket.on('new-icecandidate', this.onNewLcecandidate);
    this.socket.on("call-user", this.callUser);
    this.socket.on("make-answer", this.onMakeAnswer);
  }

  onNewLcecandidate({ icecandidate }) {
    console.log('icecandidate')
    if (this.currentVideoCall) {
      this.socket.to(this.currentVideoCall._id).emit("add-icecandidate", {
        icecandidate: icecandidate,
      });
    }
  }

  callUser(data) {
    if (!this.currentVideoCall) {
      this.currentVideoCall = activeVideoCall.find(({ _id }) => _id.toString() === data.channelId);
    }
    if (this.currentVideoCall && this.currentVideoCall[this.user.role]._id === this.user._id) {
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
      this.currentVideoCall = activeVideoCall.find(({ _id }) => _id.toString() === data.channelId);
    }
    if (this.currentVideoCall && this.currentVideoCall[this.user.role]._id === this.user._id) {
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

class TeacherClient extends SocketClient {
  constructor(io, socket, user) {
    super(io, socket, user);

    this.onInviteCallUser = this.onInviteCallUser.bind(this);

    this.initListeners();
  }

  initListeners() {
    this.socket.on('invite-call-user', this.onInviteCallUser);
  }

  onInviteCallUser(userId) {
    const student = activeUsers.find(({ _id }) => _id.toString() === userId);

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

class StudentClient extends SocketClient {
  constructor(io, socket, user) {
    super(io, socket, user);

    this.onAcceptInviteCallUser = this.onAcceptInviteCallUser.bind(this);
    this.onRefuseInviteCallUser = this.onRefuseInviteCallUser.bind(this);

    this.initListeners()
  }

  initListeners() {
    this.socket.on('accept-invite-call-user', this.onAcceptInviteCallUser);
    this.socket.on('refuse-invite-call-user', this.onRefuseInviteCallUser);
  }

  async onAcceptInviteCallUser(socketId) {
    const teacher = activeUsers.find((user) => user.socketId === socketId);
    const lesson = await Lesson.create({
      student: this.user._id,
      teacher: teacher._id,
      start: Date.now()
    });
    activeVideoCall.push({
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
}

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
      new StudentClient(this.io, socket, user);
    } else {
      new TeacherClient(this.io, socket, user);
    }
  }
}

/*
const b = (io) => {
  io.on("connection", socketioJwt.authorize({
    secret: process.env.JWT_SECRET,
    timeout: 1500
  })).on('authenticated', async (socket) => {
    const id = socket.decoded_token._id;

    if (!id) return;

    const user = (await User.findById(id)).toObject();
    user.socketId = socket.id;

    const existingUser = activeUsers.find(
      (existingUser) => existingUser._id.toString() === id
    );

    if (!existingUser) {
      activeUsers.push(user);

      socket.emit("update-user-list", {
        users: activeUsers
          .filter(
            existingUser => existingUser._id !== user._id
          )
      });

      socket.broadcast.emit("add-user", {
        user: user
      });
    }
    // else {
    //   socket.emit("user-already-exist");
    //   return;
    // }

    socket.on('invite-call-user', (userId) => {
      const student = activeUsers.find(({ _id }) => _id.toString() === userId);

      if (student) {
        socket.to(student.socketId).emit("invited-call-user", {
          user: user
        });
      } else {
        socket.emit('invited-call-user-offline', {
          studentId: userId
        })
      }
    })

    socket.on('accept-invite-call-user', (socketId) => {
      socket.to(socketId).emit('accept-invited-call-user', {
        student: user
      });
    })

    socket.on('refuse-invite-call-user', (socketId) => {
      socket.to(socketId).emit('refuse-invited-call-user', {
        student: user
      })
    })

    socket.on("new-icecandidate", (data) => {
      socket.to(data.to).emit("add-icecandidate", {
        icecandidate: data.icecandidate,
        user: user
      });
    });

    socket.on("call-user", (data) => {
      socket.to(data.to).emit("call-made", {
        offer: data.offer,
        user: user
      });
    });

    socket.on("make-answer", (data) => {
      socket.to(data.to).emit("answer-made", {
        user: user,
        answer: data.answer
      });
    });

    socket.on("reject-call", (data) => {
      socket.to(data.from).emit("call-rejected", {
        user: user
      });
    });

    socket.on("disconnect", () => {
      activeUsers = activeUsers.filter(
        existingUser => existingUser._id !== user._id
      );
      socket.broadcast.emit("remove-user", {
        userId: user._id
      });
    });
  });
}
*/