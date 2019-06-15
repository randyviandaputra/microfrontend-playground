'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports['default'] = hypernova;

var _object = require('object.assign');

var _object2 = _interopRequireDefault(_object);

var _cluster = require('cluster');

var _cluster2 = _interopRequireDefault(_cluster);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

require('./environment');

var _Module = require('./Module');

var _Module2 = _interopRequireDefault(_Module);

var _coordinator = require('./coordinator');

var _coordinator2 = _interopRequireDefault(_coordinator);

var _createGetComponent = require('./createGetComponent');

var _createGetComponent2 = _interopRequireDefault(_createGetComponent);

var _getFiles = require('./getFiles');

var _getFiles2 = _interopRequireDefault(_getFiles);

var _loadModules = require('./loadModules');

var _loadModules2 = _interopRequireDefault(_loadModules);

var _logger = require('./utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _createVM = require('./createVM');

var _createVM2 = _interopRequireDefault(_createVM);

var _worker = require('./worker');

var _worker2 = _interopRequireDefault(_worker);

var _lifecycle = require('./utils/lifecycle');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function createApplication() {
  return (0, _express2['default'])();
}

var defaultConfig = {
  bodyParser: {
    limit: 1024 * 1000
  },
  devMode: false,
  endpoint: '/batch',
  files: [],
  logger: {},
  plugins: [],
  port: 8080,
  host: '0.0.0.0',
  processJobsConcurrent: true,
  listenArgs: null,
  createApplication: createApplication
};

function hypernova(userConfig, onServer) {
  var config = (0, _object2['default'])({}, defaultConfig, userConfig);

  if (typeof config.getComponent !== 'function') {
    throw new TypeError('Hypernova requires a `getComponent` property and it must be a function');
  }

  if (!config.listenArgs) {
    config.listenArgs = [config.port, config.host];
  }

  _logger2['default'].init(config.logger, config.loggerInstance);

  if (typeof config.createApplication !== 'function') {
    throw new TypeError('Hypernova requires a `createApplication` property which must be a function that returns an express instance');
  }

  var app = config.createApplication();

  if (typeof app !== 'function' || typeof app.use !== 'function' || typeof app.post !== 'function' || typeof app.listen !== 'function') {
    throw new TypeError('`createApplication` must return a valid express instance with `use`, `post`, and `listen` methods');
  }

  if (config.devMode) {
    (0, _worker2['default'])(app, config, onServer);
  } else if (_cluster2['default'].isMaster) {
    (0, _coordinator2['default'])(config.getCPUs);
  } else {
    (0, _worker2['default'])(app, config, onServer, _cluster2['default'].worker.id);
  }

  return app;
}

// I'm "exporting" them here because I want to export these but still have a default export.
// And I want it to work on CJS.
// I want my cake and to eat it all.
hypernova.Module = _Module2['default'];
hypernova.createApplication = createApplication;
hypernova.createGetComponent = _createGetComponent2['default'];
hypernova.createVM = _createVM2['default'];
hypernova.getFiles = _getFiles2['default'];
hypernova.loadModules = _loadModules2['default'];
hypernova.worker = _worker2['default'];
hypernova.logger = _logger2['default'];
hypernova.defaultConfig = defaultConfig;
hypernova.raceTo = _lifecycle.raceTo;
module.exports = exports['default'];