'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

require('./environment');

var _logger = require('./utils/logger');

var _logger2 = _interopRequireDefault(_logger);

var _renderBatch = require('./utils/renderBatch');

var _renderBatch2 = _interopRequireDefault(_renderBatch);

var _lifecycle = require('./utils/lifecycle');

var _BatchManager = require('./utils/BatchManager');

var _BatchManager2 = _interopRequireDefault(_BatchManager);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var attachMiddleware = function attachMiddleware(app, config) {
  app.use(_bodyParser2['default'].json(config.bodyParser));
};

var attachEndpoint = function attachEndpoint(app, config, callback) {
  app.post(config.endpoint, (0, _renderBatch2['default'])(config, callback));
};

function exit(code) {
  return function () {
    return process.exit(code);
  };
}

var Server = function () {
  function Server(app, config, callback) {
    _classCallCheck(this, Server);

    this.server = null;
    this.app = app;
    this.config = config;
    this.callback = callback;

    this.closing = false;

    this.close = this.close.bind(this);
    this.errorHandler = this.errorHandler.bind(this);
    this.shutDownSequence = this.shutDownSequence.bind(this);
  }

  _createClass(Server, [{
    key: 'close',
    value: function () {
      function close() {
        var _this = this;

        return new Promise(function (resolve) {
          if (!_this.server) {
            resolve();
            return;
          }

          try {
            _this.closing = true;
            _this.server.close(function (e) {
              if (e) {
                _logger2['default'].info('Ran into error during close', { stack: e.stack });
              }
              resolve();
            });
          } catch (e) {
            _logger2['default'].info('Ran into error on close', { stack: e.stack });
            resolve();
          }
        });
      }

      return close;
    }()
  }, {
    key: 'shutDownSequence',
    value: function () {
      function shutDownSequence(error, req) {
        var _this2 = this;

        var code = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;

        if (error) {
          _logger2['default'].info(error.stack);
        }

        (0, _lifecycle.raceTo)(this.close(), 1000, 'Closing the worker took too long.').then(function () {
          return (0, _lifecycle.runAppLifecycle)('shutDown', _this2.config.plugins, _this2.config, error, req);
        }).then(exit(code))['catch'](exit(code));
      }

      return shutDownSequence;
    }()
  }, {
    key: 'errorHandler',
    value: function () {
      function errorHandler(err, req, res, next) {
        var _this3 = this;

        // eslint-disable-line no-unused-vars
        // If there is an error with body-parser and the status is set then we can safely swallow
        // the error and report it.
        // Here are a list of errors https://github.com/expressjs/body-parser#errors
        if (err.status && err.status >= 400 && err.status < 600) {
          _logger2['default'].info('Non-fatal error encountered.');
          _logger2['default'].info(err.stack);

          res.status(err.status).end();

          // In a promise in case one of the plugins throws an error.
          new Promise(function () {
            // eslint-disable-line no-new
            var manager = new _BatchManager2['default'](req, res, req.body, _this3.config);
            (0, _lifecycle.errorSync)(err, _this3.config.plugins, manager);
          });

          return;
        }
        this.shutDownSequence(err, req, 1);
      }

      return errorHandler;
    }()
  }, {
    key: 'initialize',
    value: function () {
      function initialize() {
        var _this4 = this;

        // run through the initialize methods of any plugins that define them
        (0, _lifecycle.runAppLifecycle)('initialize', this.config.plugins, this.config).then(function () {
          var _app;

          _this4.server = (_app = _this4.app).listen.apply(_app, _toConsumableArray(_this4.config.listenArgs).concat([_this4.callback]));
          return null;
        })['catch'](this.shutDownSequence);
      }

      return initialize;
    }()
  }]);

  return Server;
}();

var initServer = function initServer(app, config, callback) {
  var server = new Server(app, config, callback);

  // Middleware
  app.use(server.errorHandler);

  // Last safety net
  process.on('uncaughtException', server.errorHandler);

  // if all the workers are ready then we should be good to start accepting requests
  process.on('message', function (msg) {
    if (msg === 'kill') {
      server.shutDownSequence(null, null, 0);
    }
  });

  server.initialize();

  return server;
};

var worker = function worker(app, config, onServer, workerId) {
  // ===== Middleware =========================================================
  attachMiddleware(app, config);

  if (onServer) {
    onServer(app, process);
  }

  var server = void 0;

  // ===== Routes =============================================================
  // server.closing
  attachEndpoint(app, config, function () {
    return server && server.closing;
  });

  function registerSignalHandler(sig) {
    process.on(sig, function () {
      _logger2['default'].info('Hypernova worker got ' + String(sig) + '. Going down');
      server.shutDownSequence(null, null, 0);
    });
  }

  // Gracefully shutdown the worker when not running in a cluster (devMode = true)
  if (config.devMode) {
    ['SIGTERM', 'SIGINT'].map(registerSignalHandler);
  }

  // ===== initialize server's nuts and bolts =================================
  server = initServer(app, config, function () {
    if (process.send) {
      // tell our coordinator that we're ready to start receiving requests
      process.send({ workerId: workerId, ready: true });
    }

    _logger2['default'].info('Connected', { listen: config.listenArgs });
  });
};

worker.attachMiddleware = attachMiddleware;
worker.attachEndpoint = attachEndpoint;
worker.initServer = initServer;
worker.Server = Server;

exports['default'] = worker;
module.exports = exports['default'];