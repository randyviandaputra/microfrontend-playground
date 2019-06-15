'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _object = require('object.assign');

var _object2 = _interopRequireDefault(_object);

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var logger = null;

var OPTIONS = {
  level: 'info',
  colorize: true,
  timestamp: true,
  prettyPrint: process.env.NODE_ENV !== 'production'
};

var loggerInterface = {
  init: function () {
    function init(config, loggerInstance) {
      if (loggerInstance) {
        logger = loggerInstance;
      } else {
        var options = (0, _object2['default'])({}, OPTIONS, config);

        logger = new _winston2['default'].Logger({
          transports: [new _winston2['default'].transports.Console(options)]
        });
      }

      delete loggerInterface.init;
    }

    return init;
  }(),
  error: function () {
    function error(message, meta) {
      return logger.log('error', message, meta);
    }

    return error;
  }(),
  info: function () {
    function info(message, meta) {
      return logger.log('info', message, meta);
    }

    return info;
  }()
};

exports['default'] = loggerInterface;
module.exports = exports['default'];