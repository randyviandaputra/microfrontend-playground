'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _object = require('object.assign');

var _object2 = _interopRequireDefault(_object);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var noHTMLError = new TypeError('HTML was not returned to Hypernova, this is most likely an error within your application. Check your logs for any uncaught errors and/or rejections.');
noHTMLError.stack = null;

function errorToSerializable(error) {
  // istanbul ignore next
  if (error === undefined) throw new TypeError('No error was passed');

  // make sure it is an object that is Error-like so we can serialize it properly
  // if it's not an actual error then we won't create an Error so that there is no stack trace
  // because no stack trace is better than a stack trace that is generated here.
  var err = Object.prototype.toString.call(error) === '[object Error]' && typeof error.stack === 'string' ? error : { name: 'Error', type: 'Error', message: error, stack: '' };

  return {
    type: err.type,
    name: err.name,
    message: err.message,
    stack: err.stack.split('\n    ')
  };
}

function notFound(name) {
  var error = new ReferenceError('Component "' + String(name) + '" not registered');
  var stack = error.stack.split('\n');

  error.stack = [stack[0]].concat('    at YOUR-COMPONENT-DID-NOT-REGISTER_' + String(name) + ':1:1', stack.slice(1)).join('\n');

  return error;
}

function msSince(start) {
  var diff = process.hrtime(start);
  return diff[0] * 1e3 + diff[1] / 1e6;
}

function now() {
  return process.hrtime();
}

/**
 * The BatchManager is a class that is instantiated once per batch, and holds a lot of the
 * key data needed throughout the life of the request. This ends up cleaning up some of the
 * management needed for plugin lifecycle, and the handling of rendering multiple jobs in a
 * batch.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {Object} jobs - a map of token => Job
 * @param {Object} config
 * @constructor
 */

var BatchManager = function () {
  function BatchManager(request, response, jobs, config) {
    var _this = this;

    _classCallCheck(this, BatchManager);

    var tokens = Object.keys(jobs);

    this.config = config;
    this.plugins = config.plugins;
    this.error = null;
    this.statusCode = 200;

    // An object that all of the contexts will inherit from... one per instance.
    this.baseContext = {
      request: request,
      response: response,
      batchMeta: {}
    };

    // An object that will be passed into the context for batch-level methods, but not for job-level
    // methods.
    this.batchContext = {
      tokens: tokens,
      jobs: jobs
    };

    // A map of token => JobContext, where JobContext is an object of data that is per-job,
    // and will be passed into plugins and used for the final result.
    this.jobContexts = tokens.reduce(function (obj, token) {
      var _jobs$token = jobs[token],
          name = _jobs$token.name,
          data = _jobs$token.data,
          metadata = _jobs$token.metadata;
      /* eslint no-param-reassign: 1 */

      obj[token] = {
        name: name,
        token: token,
        props: data,
        metadata: metadata,
        statusCode: 200,
        duration: null,
        html: null,
        returnMeta: {}
      };
      return obj;
    }, {});

    // Each plugin receives it's own little key-value data store that is scoped privately
    // to the plugin for the life time of the request. This is achieved simply through lexical
    // closure.
    this.pluginContexts = new Map();
    this.plugins.forEach(function (plugin) {
      _this.pluginContexts.set(plugin, { data: new Map() });
    });
  }

  /**
   * Returns a context object scoped to a specific plugin and job (based on the plugin and
   * job token passed in).
   */


  _createClass(BatchManager, [{
    key: 'getRequestContext',
    value: function () {
      function getRequestContext(plugin, token) {
        return (0, _object2['default'])({}, this.baseContext, this.jobContexts[token], this.pluginContexts.get(plugin));
      }

      return getRequestContext;
    }()

    /**
     * Returns a context object scoped to a specific plugin and batch.
     */

  }, {
    key: 'getBatchContext',
    value: function () {
      function getBatchContext(plugin) {
        return (0, _object2['default'])({}, this.baseContext, this.batchContext, this.pluginContexts.get(plugin));
      }

      return getBatchContext;
    }()
  }, {
    key: 'contextFor',
    value: function () {
      function contextFor(plugin, token) {
        return token ? this.getRequestContext(plugin, token) : this.getBatchContext(plugin);
      }

      return contextFor;
    }()

    /**
     * Renders a specific job (from a job token). The end result is applied to the corresponding
     * job context. Additionally, duration is calculated.
     */

  }, {
    key: 'render',
    value: function () {
      function render(token) {
        var start = now();
        var context = this.jobContexts[token];
        var name = context.name;
        var getComponent = this.config.getComponent;


        var result = getComponent(name, context);

        return Promise.resolve(result).then(function (renderFn) {
          // ensure that we have this component registered
          if (!renderFn || typeof renderFn !== 'function') {
            // component not registered
            context.statusCode = 404;
            return Promise.reject(notFound(name));
          }

          return renderFn(context.props);
        }).then(function (html) {
          // eslint-disable-line consistent-return
          if (!html) {
            return Promise.reject(noHTMLError);
          }
          context.html = html;
          context.duration = msSince(start);
        })['catch'](function (err) {
          context.duration = msSince(start);
          return Promise.reject(err);
        });
      }

      return render;
    }()
  }, {
    key: 'recordError',
    value: function () {
      function recordError(error, token) {
        if (token && this.jobContexts[token]) {
          var context = this.jobContexts[token];
          context.statusCode = context.statusCode === 200 ? 500 : context.statusCode;
          context.error = error;
        } else {
          this.error = error;
          this.statusCode = 500;
        }
      }

      return recordError;
    }()
  }, {
    key: 'getResult',
    value: function () {
      function getResult(token) {
        var context = this.jobContexts[token];
        return {
          name: context.name,
          html: context.html,
          meta: context.returnMeta,
          duration: context.duration,
          statusCode: context.statusCode,
          success: context.html !== null,
          error: context.error ? errorToSerializable(context.error) : null
        };
      }

      return getResult;
    }()
  }, {
    key: 'getResults',
    value: function () {
      function getResults() {
        var _this2 = this;

        return {
          success: this.error === null,
          error: this.error,
          results: Object.keys(this.jobContexts).reduce(function (result, token) {
            /* eslint no-param-reassign: 1 */
            result[token] = _this2.getResult(token);
            return result;
          }, {})
        };
      }

      return getResults;
    }()
  }]);

  return BatchManager;
}();

exports['default'] = BatchManager;
module.exports = exports['default'];