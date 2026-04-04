const nodeCrypto = require('crypto');

const CryptoDigestAlgorithm = {
  SHA1: 'SHA-1',
  SHA256: 'SHA-256',
  SHA384: 'SHA-384',
  SHA512: 'SHA-512',
  MD5: 'MD5',
};

const CryptoEncoding = {
  HEX: 'hex',
  BASE64: 'base64',
};

const algorithmMap = {
  'SHA-1': 'sha1',
  'SHA-256': 'sha256',
  'SHA-384': 'sha384',
  'SHA-512': 'sha512',
  MD5: 'md5',
};

const digestStringAsync = async (algorithm, data, options = { encoding: CryptoEncoding.HEX }) => {
  const nodeAlgo = algorithmMap[algorithm] ?? 'sha256';
  const encoding = options.encoding === CryptoEncoding.BASE64 ? 'base64' : 'hex';
  return nodeCrypto.createHash(nodeAlgo).update(data, 'utf8').digest(encoding);
};

const getRandomBytesAsync = async (byteCount) => {
  return new Uint8Array(nodeCrypto.randomBytes(byteCount));
};

module.exports = {
  CryptoDigestAlgorithm,
  CryptoEncoding,
  digestStringAsync,
  getRandomBytesAsync,
};
