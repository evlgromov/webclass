module.exports = (model, field = 'owner', reqField = model.toLowerCase()) => async (req, res, next) => {
  req[reqField] = await model.find({[field]: req.user._id});

  next();
}
