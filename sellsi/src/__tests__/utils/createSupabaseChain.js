function createChain(payload) {
  // payload can be: raw data (object/array) OR an object { data, error } OR null
  const obj = {};
  obj.select = (..._args) => obj;
  obj.eq = (..._args) => obj;
  obj.order = (..._args) => obj;

  const singleResult = (inner) => {
    if (inner && (Object.prototype.hasOwnProperty.call(inner, 'data') || Object.prototype.hasOwnProperty.call(inner, 'error'))) {
      return inner;
    }
    return { data: inner, error: null };
  };

  obj.single = async () => singleResult(payload);
  obj.maybeSingle = async () => singleResult(payload);

  // prevent objects from being treated as thenables/promises in some libs
  Object.defineProperty(obj, 'then', { value: undefined, configurable: true });
  return obj;
}

module.exports = { createChain };