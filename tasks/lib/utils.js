(function() {
  'use strict';

  var _ = require('lodash');
  var stringify = require('json-stable-stringify');

  function Utils() {
  }

  Utils.prototype.customStringify = function(val, options) {
    if (options) {
      return stringify(val, _.isObject(options) ? options : {
        space: '    ',
        cmp: function (a, b) {
          var lower = function (a) {
            return a.toLowerCase();
          };
          return lower(a.key) < lower(b.key) ? -1 : 1;
        }
      });
    }
    return JSON.stringify(val, null, 4);
  };

  module.exports = Utils;
}());