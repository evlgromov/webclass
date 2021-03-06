const Lesson = require('../models/Lesson');

exports.getLessons = async (req, res, next) => {
  // const reverseRole = req.user.role === 'student' ? 'teacher' : 'student';
  // const lessons = await Lesson.find({ [req.user.role]: req.user._id }).select(`-${req.user.role}`).populate(reverseRole).sort('-start');

  const lessons = await Lesson.find({ [req.user]: req.user._id }).select(`-${req.user}`).populate(req.user).sort('-start');


  res.status(200).json({ success: true, data: lessons });
}