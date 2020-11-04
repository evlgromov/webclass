const User = require('./models/User');

let activeUsers = [];

module.exports = (io) =>
  io.on("connection", async (socket) => {
    const obj = socket.request.session.passport;

    if (!obj || !obj.user) return;

    const user = (await User.findById(obj.user)).toObject();
    user.socketId = socket.id;

    const existingUser = activeUsers.find(
      (existingUser) => existingUser._id === user._id
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

    socket.on("call-user", (data) => {
      console.log(data.to)
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