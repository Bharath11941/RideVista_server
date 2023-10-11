const bcrypt = require("bcrypt");
const securePassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashed = await bcrypt.hash(password, salt);
    return hashed;
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = securePassword