/**
 * grunt-angular-translate
 * https://github.com/firehist/grunt-angular-translate
 *
 * Copyright (c) 2013 "firehist" Benjamin Longearet, contributors
 * Licensed under the MIT license.
 *
 * @example

  var results = FLATTEN_TRANSLATIONS_OBJECT;
  var translation = new Translations({
    "safeMode": true,
    "tree": true,
    "nullEmpty": true
  }, results);

  console.log(translation.toString());
  console.log(translation.getDefaultTranslations());

  console.log(translation.getMergedTranslations({
    "SUB": "My first txt",
    "SUB.NAMESPACE.VAL 1": "Okay val 1!",
    "SUB.NAMESPACE.VAL 33": "Okay val 1!",
    "SUB.NAMESPACE.VAL 44": "Okay val 1!"
  }));
  console.log(translation.getStats());

 */

'use strict';

var _ = require('lodash');
var flat = require('flat');

/**
 * Helper to know if key is a valid translation or an empty one
 * @param key
 * @returns {boolean}
 * @private
 */
var __isValidTranslation = function (key) {
  return _.isString(key) && key !== "";
}

/**
 * Create an instance of Translations with params and translations (OPT)
 * @param {Object} params Allow tree, safeMode & nullEmpty
 * @param {Object} translations
 * @constructor
 */
function Translations (params, translations) {

  /** @type {Object} Store current translations source */
  this._translations = {};
  /** @type {Object} Store current stats for latest merge request */
  this._stats = {};
  /** @type {Object} Set default parameters */
  this.params = _.defaults(params, {
    "tree": false,
    "safeMode": false,
    "nullEmpty": false
  });
  // Set translations if given as parameter
  this.setTranslations(translations);
  // Initialize statistics
  this.initStats();

}

/**
 * Compute merged translations from extracted translations and given obj
 * It can feed result if useDefault is true
 * @param {Object?} obj
 * @param {Boolean?} useDefault
 * @returns {boolean}
 */
Translations.prototype.getMergedTranslations = function (obj, useDefault) {
  var _returnTranslations = false;
  if (_.isUndefined(obj) || !_.isPlainObject(obj)) {
    obj = {};
  }

  var self = this;
  var _translations = _.clone(this.getFlatTranslations());

  _returnTranslations = {};

  // Case safeMode: Dont delete unused value if true
  if (this.params.safeMode) {
    _returnTranslations = _.extend(_translations, obj);
    _.forEach(_returnTranslations, function (v, k) {
      if (__isValidTranslation(v)) {
        _returnTranslations[k] = v;
      } else {
        _returnTranslations[k] = self.params.nullEmpty ? null : "";
      }
    });
  } else {
    _returnTranslations = {};
    _.forEach(_translations, function (v, k) {
      if (__isValidTranslation(obj[k])) {     // Get from old translations
        _returnTranslations[k] = obj[k];
      } else if (__isValidTranslation(v)) {   // Get from extracted translations
        _returnTranslations[k] = v;
      } else {                                // Feed empty translation (null or "")
        _returnTranslations[k] = self.params.nullEmpty ? null : "";
      }
    });
  }

  if (!_.isUndefined(useDefault) && useDefault) {
    _returnTranslations = this.getDefaultTranslations(_returnTranslations);
  }

  this.computeStats(obj, this.getFlatTranslations(), _returnTranslations);

  // Case namespace (tree representation)
  if (this.params.tree) {
    // We need to remove parent NS
    _returnTranslations = flat.unflatten(Translations.cleanParents(_returnTranslations));
  }
  return _returnTranslations;
}

/**
 * Feed translation object values with the related key value
 * @returns {Object}
 */
Translations.prototype.getDefaultTranslations = function (obj) {
  var _translations = _.clone(obj ? obj : this.getFlatTranslations());
  _.forEach(_translations, function (v, k) {
    _translations[k] = __isValidTranslation(v) ? v : k;
  });
  return _translations;
}

/**
 * Format empty translation by using config about nullEmpty (null or "")
 * @returns {Object}
 */
Translations.prototype.formatTranslationsEmpty = function () {
  var self = this;
  var _isolatedTranslations = {};
  _.forEach(self._translations, function (v, k) {
    _isolatedTranslations[k] = (v && v === "" && self.params.nullEmpty ? null : v)
  });
  return _isolatedTranslations;
};
/**
 * Return a flat version of extracted translations
 * @returns {Object}
 */
Translations.prototype.getFlatTranslations = function () {
  return this.formatTranslationsEmpty();
}
/**
 * Return a translations formated as a tree or in as a flat object
 * @returns {Object}
 */
Translations.prototype.getTranslations = function () {
  var _isolatedTranslations = this.formatTranslationsEmpty();
  return this.params.tree ? flat.unflatten(_isolatedTranslations) : _isolatedTranslations;
}
/**
 * Set translation object to work on
 * @param {Object} translations
 */
Translations.prototype.setTranslations = function (translations) {
  this._translations = {};
  if (!_.isUndefined(translations) && _.isPlainObject(translations)) {
    this._translations = translations;
  } else {
    console.log('Translations should be a plain Object')
  }
}
/**
 * Clean useless ROOT level for given obj
 * @param obj
 * @returns {{}}
 *
 * @example
  obj = {
    "NS": "My NS sentence",
    "NS.HEADER_LABEL": "My Header Label",
    "NS.HEADER_ICON": "My Header icon"
  }
  In a tree view, there are conflicts between NS as a string and NS as an object with HEADER_LABEL et HEADER_ICON as child
  return = {
    "NS.HEADER_LABEL": "My Header Label",
    "NS.HEADER_ICON": "My Header icon"
  }
 */
Translations.cleanParents = function (obj) {
  var keys = _.sortBy(_.keys(obj));
  var keepKeys = [];
  _.forEach(keys, function (v) {
    var splitted = v.split('.');
    var splittedNS = _.reduce(splitted, function (m, v, k, l) {
      return (k < splitted.length - 1) ? m + '.' + v : m;
    });
    keepKeys.push(v);
    _.remove(keepKeys, function (v) {
      return v === splittedNS;
    });
  });
  var cleanedObject = {};
  _.forEach(obj, function (v,k) {
    if (_.indexOf(keepKeys, k) !== -1) {
      cleanedObject[k] = v;
    }
  });
  return cleanedObject;
}

/**
 * Initialize statistics object with 0 value
 */
Translations.prototype.initStats = function () {
  this._stats = {
    "total": 0,
    "updated": 0,
    "deleted": 0,
    "new": 0,
    "empty": 0,
    "null": 0
  };
}
/**
 * Getter for stats object
 * @returns {Object}
 */
Translations.prototype.getStats = function () { return this._stats; }
/**
 * Compute statistics from old, new and merged translations results
 * @param {Object} oldVal Flat translations source
 * @param {Object} newVal Flat translations new
 * @param {Object} mergedVal
 * @returns {Object}
 */
Translations.prototype.computeStats = function (oldVal, newVal, mergedVal) {
  this.initStats();
  var self = this;
  var _numFromNew = 0;
  // Compute deleted and updated stats
  _.forEach(oldVal, function (v, k) {
    if (_.isUndefined(newVal[k])) {   // If not in new array, deleted
      self.incStat("deleted");
    } else {                          // If in new array
      _numFromNew++;
      if(v !== newVal[k]) {             // If updated value
        self.incStat("updated");
      }
    }
  });
  // Compute new stat
  this.setStat("new", _.keys(newVal).length - _numFromNew);
  // Compute empty/null stats
  _.forEach(mergedVal, function (v, k) {
    self.incStat("total");
    if (_.isNull(v)) {
      self.incStat("null");
    } else if (v === "") {
      self.incStat("empty");
    }
  });
  return this.getStats();
}
/**
 * Check if type statistic is available
 * @param {String} type Statistic name
 * @returns {boolean}
 */
Translations.prototype.existStats = function (type) {
  return _.indexOf(["updated", "deleted", "new", "null", "empty", "total"], type) !== -1;
}
/**
 * Set num for type statistic
 * @param {String} type Statistic name
 * @param {Number} num Number to set
 */
Translations.prototype.setStat = function (type, num) {
  if (this.existStats(type)) {
    this._stats[type] = num;
  }
}
/**
 * Increment type statistic by one
 * @param {String} type Statistic name
 */
Translations.prototype.incStat = function (type) {
  if (this.existStats(type)) {
    this._stats[type]++;
  }
}
/**
 * Wrap of flat.flatten method
 * @type {Function}
 */
Translations.flatten = flat.flatten;
/**
 * Wrap of flat.unflatten method
 * @type {Function}
 */
Translations.unflatten = flat.unflatten;

module.exports = Translations;