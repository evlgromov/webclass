const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const { ErrorResponse } = require('../utils/ErrorResponse');

exports.getChats = async (req, res, next) => {
  let chats;
  if (req.query.studentId) {
    chats = (await Chat.find({ student: req.query.studentId, teacher: req.user._id }))[0];
  } else if (req.query.teacherId) {
    chats = (await Chat.find({ teacher: req.query.teacherId, student: req.user._id }))[0];
  } else {
    chats = await Chat.find({ [req.user.role]: req.user._id });
  }

  res.status(200).json({ success: true, data: chats });
}

exports.getMessages = async (req, res, next) => {
  const chatId = req.params.id;

  const chat = await Chat.find({ id: chatId, [req.user.role]: req.user._id });
  if (!chat) {
    return next(new ErrorResponse('Такого чата не существует', 400));
  }

  const messages = await Message.find({ chat: chat._id });

  res.status(200).json({ success: true, data: messages });
}

exports.createChat = async (req, res, next) => {
  if (req.user.role == 'student') {
    return next(new ErrorResponse('Только учителя могут создавать чаты', 403));
  }

  const student = await User.findById(req.body.studentId);
  if (!student) {
    return next(new ErrorResponse('Такого студента не существует', 400));
  }

  let chat = (await Chat.find({ student: req.body.studentId, teacher: req.user._id }))[0];
  console.log(chat)
  if (!chat) {
    chat = await Chat.create({
      student: req.body.studentId,
      teacher: req.user._id
    });
  }

  res.status(200).json({ success: true, data: chat });
}