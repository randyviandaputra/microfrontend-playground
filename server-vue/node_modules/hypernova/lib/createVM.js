'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lruCache = require('lru-cache');

var _lruCache2 = _interopRequireDefault(_lruCache);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _Module = require('./Module');

var _Module2 = _interopRequireDefault(_Module);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function defaultGetKey(name, code) {
  var hash = _crypto2['default'].createHash('sha1').update(code).digest('hex');
  return String(name) + '::' + String(hash);
}

exports['default'] = function () {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  // This is to cache the entry point of all bundles which makes running on a vm blazing fast.
  // Everyone gets their own sandbox to play with and nothing is leaked between requests.
  // We're caching with `code` as the key to ensure that if the code changes we break the cache.
  var exportsCache = (0, _lruCache2['default'])({
    max: options.cacheSize
  });

  var getKey = options.getKey || defaultGetKey;

  return {
    exportsCache: exportsCache,

    run: function () {
      function run(name, code) {
        var key = getKey(name, code);

        if (exportsCache.has(key)) return exportsCache.get(key);

        var environment = options.environment && options.environment(name);

        var module = new _Module2['default'](name, environment);
        module.load(name);
        module._compile(code, name);

        exportsCache.set(key, module.exports);

        return module.exports;
      }

      return run;
    }()
  };
};

module.exports = exports['default'];