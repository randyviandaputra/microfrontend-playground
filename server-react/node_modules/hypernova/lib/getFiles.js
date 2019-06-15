'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports['default'] = getFiles;

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function getFiles(fullPathStr) {
  return _glob2['default'].sync(_path2['default'].join(fullPathStr, '**', '*.js')).map(function (file) {
    var name = _path2['default'].relative(fullPathStr, file);
    return {
      name: name,
      path: file
    };
  });
}
module.exports = exports['default'];