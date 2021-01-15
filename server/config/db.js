const mongoose = require('mongoose');
const autoIncrement = require('mongoose-auto-increment');

module.exports = async function () {
  const connection = await mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });

  autoIncrement.initialize(connection);
  console.log('initialized')
}