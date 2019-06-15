'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _BatchManager = require('./BatchManager');

var _BatchManager2 = _interopRequireDefault(_BatchManager);

var _lifecycle = require('./lifecycle');

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

exports['default'] = function (config, isClosing) {
  return function (req, res) {
    // istanbul ignore if
    if (isClosing()) {
      _logger2['default'].info('Starting request when closing!');
    }
    var jobs = req.body;

    var manager = new _BatchManager2['default'](req, res, jobs, config);

    return (0, _lifecycle.processBatch)(jobs, config.plugins, manager, config.processJobsConcurrently).then(function () {
      // istanbul ignore if
      if (isClosing()) {
        _logger2['default'].info('Ending request when closing!');
      }
      return res.status(manager.statusCode).json(manager.getResults()).end();
    })['catch'](function () {
      return res.status(manager.statusCode).end();
    });
  };
};

module.exports = exports['default'];