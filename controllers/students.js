const User = require('../models/User');
const { ErrorResponse } = require('../utils/ErrorResponse');

exports.getStudents = async (req, res, next) => {
  const users = await User.find({ role: 'student', email: new RegExp(req.query.email) });

  res.status(200).json({ success: true, data: users });
}