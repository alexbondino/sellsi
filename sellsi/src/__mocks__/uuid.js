/**
 * Mock for uuid package
 * Jest will automatically use this file instead of the real uuid package
 */

let counter = 0;

const v4 = () => {
  counter++;
  return `test-uuid-${counter}-${Date.now()}`;
};

const v1 = () => {
  counter++;
  return `test-uuid-v1-${counter}-${Date.now()}`;
};

const validate = (uuid) => {
  return typeof uuid === 'string' && uuid.length > 0;
};

const version = (uuid) => {
  return 4;
};

module.exports = {
  v4,
  v1,
  validate,
  version,
};
