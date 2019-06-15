'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _object = require('object.assign');

var _object2 = _interopRequireDefault(_object);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _has = require('has');

var _has2 = _interopRequireDefault(_has);

var _createVM = require('./createVM');

var _createVM2 = _interopRequireDefault(_createVM);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

// This function takes in an Object of files and an Object that configures the VM. It will return
// a function that can be used as `getComponent` for Hypernova.
// The file's object structure is [componentName]: 'AbsolutePath.js'
exports['default'] = function (files, vmOptions) {
  var fileEntries = Object.entries(files);

  var vm = (0, _createVM2['default'])((0, _object2['default'])({
    cacheSize: fileEntries.length
  }, vmOptions));

  var resolvedFiles = fileEntries.reduce(function (components, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        fileName = _ref2[0],
        filePath = _ref2[1];

    var code = _fs2['default'].readFileSync(filePath, 'utf-8');

    try {
      // Load the bundle on startup so we can cache its exports.
      vm.run(filePath, code);

      // Cache the code as well as the path to it.
      components[fileName] = { // eslint-disable-line no-param-reassign
        filePath: filePath,
        code: code
      };
    } catch (err) {
      // If loading the component failed then we'll skip it.
      // istanbul ignore next
      console.error(err.stack);
    }

    return components;
  }, {});

  return function (name) {
    if ((0, _has2['default'])(resolvedFiles, name)) {
      var _resolvedFiles$name = resolvedFiles[name],
          filePath = _resolvedFiles$name.filePath,
          code = _resolvedFiles$name.code;

      return vm.run(filePath, code);
    }

    // The requested package was not found.
    return null;
  };
};

module.exports = exports['default'];