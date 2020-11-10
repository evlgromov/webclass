
const socketioJwt = require('socketio-jwt');

const User = require('./models/User');

let activeUsers = [];

module.exports = (io) => {
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
      const user = activeUsers.find(({ _id }) => _id.toString() === userId);
      console.log(user)
      if (user) {
        socket.to(user.socketId).emit("invited-call-user", {
          user: user
        });
      }
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