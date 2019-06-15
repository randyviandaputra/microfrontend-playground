'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _object = require('object.assign');

var _object2 = _interopRequireDefault(_object);

var _module = require('module');

var _module2 = _interopRequireDefault(_module);

var _has = require('has');

var _has2 = _interopRequireDefault(_has);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _assert = require('assert');

var _vm = require('vm');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NativeModules = process.binding('natives');

// This means that you won't be able to affect VM extensions by mutating require.extensions
// this is cool since we can now have different extensions for VM than for where your program is
// running.
// If you want to add an extension then you can use addExtension defined and exported below.
var moduleExtensions = (0, _object2['default'])({}, _module2['default']._extensions);

function isNativeModule(id) {
  return (0, _has2['default'])(NativeModules, id);
}

// Creates a sandbox so we don't share globals across different runs.
function createContext() {
  var sandbox = {
    Buffer: Buffer,
    clearImmediate: clearImmediate,
    clearInterval: clearInterval,
    clearTimeout: clearTimeout,
    setImmediate: setImmediate,
    setInterval: setInterval,
    setTimeout: setTimeout,
    console: console,
    process: process
  };
  sandbox.global = sandbox;
  return sandbox;
}

// This class should satisfy the Module interface that NodeJS defines in their native module.js
// implementation.

var Module = function () {
  function Module(id, parent) {
    _classCallCheck(this, Module);

    var cache = parent ? parent.cache : null;
    this.id = id;
    this.exports = {};
    this.cache = cache || {};
    this.parent = parent;
    this.filename = null;
    this.loaded = false;
    this.context = parent ? parent.context : createContext();
  }

  _createClass(Module, [{
    key: 'load',
    value: function () {
      function load(filename) {
        (0, _assert.ok)(!this.loaded);
        this.filename = filename;
        this.paths = _module2['default']._nodeModulePaths(_path2['default'].dirname(filename));
      }

      return load;
    }()
  }, {
    key: 'run',
    value: function () {
      function run(filename) {
        var ext = _path2['default'].extname(filename);
        var extension = moduleExtensions[ext] ? ext : '.js';
        moduleExtensions[extension](this, filename);
        this.loaded = true;
      }

      return run;
    }()
  }, {
    key: 'require',
    value: function () {
      function require(filePath) {
        (0, _assert.ok)(typeof filePath === 'string', 'path must be a string');
        return Module.loadFile(filePath, this);
      }

      return require;
    }()
  }, {
    key: '_compile',
    value: function () {
      function _compile(content, filename) {
        var _this = this;

        var self = this;

        function require(filePath) {
          return self.require(filePath);
        }
        require.resolve = function (request) {
          return _module2['default']._resolveFilename(request, _this);
        };
        require.main = process.mainModule;
        require.extensions = moduleExtensions;
        require.cache = this.cache;

        var dirname = _path2['default'].dirname(filename);

        // create wrapper function
        var wrapper = _module2['default'].wrap(content);

        var options = {
          filename: filename,
          displayErrors: true
        };

        var compiledWrapper = (0, _vm.runInNewContext)(wrapper, this.context, options);
        return compiledWrapper.call(this.exports, this.exports, require, this, filename, dirname);
      }

      return _compile;
    }()
  }], [{
    key: 'load',
    value: function () {
      function load(id) {
        var filename = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : id;

        var module = new Module(id);
        module.load(filename);
        module.run(filename);
        return module;
      }

      return load;
    }()
  }, {
    key: 'loadFile',
    value: function () {
      function loadFile(file, parent) {
        var filename = _module2['default']._resolveFilename(file, parent);

        if (parent) {
          var cachedModule = parent.cache[filename];
          if (cachedModule) return cachedModule.exports;
        }

        if (isNativeModule(filename)) {
          // eslint-disable-next-line global-require, import/no-dynamic-require
          return require(filename);
        }

        var module = new Module(filename, parent);

        module.cache[filename] = module;

        var hadException = true;

        try {
          module.load(filename);
          module.run(filename);
          hadException = false;
        } finally {
          if (hadException) {
            delete module.cache[filename];
          }
        }

        return module.exports;
      }

      return loadFile;
    }()
  }, {
    key: 'addExtension',
    value: function () {
      function addExtension(ext, f) {
        moduleExtensions[ext] = f;
      }

      return addExtension;
    }()
  }]);

  return Module;
}();

exports['default'] = Module;
module.exports = exports['default'];