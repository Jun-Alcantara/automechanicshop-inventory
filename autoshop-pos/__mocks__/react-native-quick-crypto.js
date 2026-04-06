/**
 * Jest mock for react-native-quick-crypto.
 * Delegates to Node's built-in `crypto` module so pinHash tests run without
 * a native build (the real library requires a linked native module).
 */
const nodeCrypto = require('crypto');

const QuickCrypto = {
  randomBytes: (size) => nodeCrypto.randomBytes(size),

  pbkdf2: (password, salt, iterations, keylen, digest, callback) => {
    nodeCrypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
      callback(err, derivedKey);
    });
  },

  createHash: (algorithm) => nodeCrypto.createHash(algorithm),
};

module.exports = QuickCrypto;
module.exports.default = QuickCrypto;
