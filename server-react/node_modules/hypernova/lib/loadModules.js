'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports['default'] = loadModules;

var _Module = require('./Module');

var _Module2 = _interopRequireDefault(_Module);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function load(file, parent) {
  if (!file) return parent;

  var module = new _Module2['default'](file, parent);
  module.load(file);
  module.run(file);
  return module;
}

function resolve(require, name) {
  try {
    return require.resolve(name);
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') return null;
    throw e;
  }
}

function loadModules(require, files) {
  return function () {
    return files.reduce(function (module, file) {
      return load(resolve(require, file), module);
    }, null);
  };
}
module.exports = exports['default'];