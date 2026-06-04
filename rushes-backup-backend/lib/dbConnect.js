const { connectDB } = require("./mongodb");

module.exports = {
  connectDB,
  default: connectDB
};
