const { json } = require('express');
const User = require('../models/User');

exports.getUsers = async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({ success: true, data: users });
}