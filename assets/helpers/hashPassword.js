const bcrypt = require("bcrypt");

function createHash(password) {
 bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return err;
    }
    return hash;
  });
}

function checkHash(hashedPassword, plainPassword) {
  bcrypt.compare(plainPassword, hashedPassword, (err, result) => {
    if (err) {
      return err;
    }
    return { compare: result }

  });
}

module.exports = { createHash, checkHash }
