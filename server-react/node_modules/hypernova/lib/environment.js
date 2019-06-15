'use strict';

require('airbnb-js-shims');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

/* eslint func-names:0 no-extra-parens:0  */
var es6methods = ['then', 'catch', 'constructor'];
var es6StaticMethods = ['all', 'race', 'resolve', 'reject', 'cast'];

function isNotMethod(name) {
  return !(es6methods.includes(name) || es6StaticMethods.includes(name) || name.charAt(0) === '_');
}

function del(obj) {
  /* eslint no-param-reassign: 0 */
  return function (key) {
    delete obj[key];
  };
}

function toFastProperties(obj) {
  (function () {}).prototype = obj;
}

Object.keys(_bluebird2['default'].prototype).filter(isNotMethod).forEach(del(_bluebird2['default'].prototype));
Object.keys(_bluebird2['default']).filter(isNotMethod).forEach(del(_bluebird2['default']));
toFastProperties(_bluebird2['default']);
toFastProperties(_bluebird2['default'].prototype);

global.Promise = _bluebird2['default'];