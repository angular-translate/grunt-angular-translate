/**
 * grunt-angular-translate
 * https://github.com/firehist/grunt-angular-translate
 *
 * Copyright (c) 2013 "firehist" Benjamin Longearet, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

  grunt.registerMultiTask('i18nextract', 'Generate json language file(s) for angular-translate project', function () {

    // Shorcuts!
    var Translations = require('./lib/translations.js');
    var stringify = require('json-stable-stringify');
    var _ = require('lodash');
    var _log = grunt.log;
    var _file = grunt.file;

    // Check lang parameter
    if (!_.isArray(this.data.lang) || !this.data.lang.length) {
      grunt.fail('lang parameter is required.');
    }

    // Declare all var from configuration
    var files = _file.expand(this.data.src),
      dest = this.data.dest || '.',
      jsonSrc = _file.expand(this.data.jsonSrc || []),
      jsonSrcName = _.union(this.data.jsonSrcName || [], ['label']),
      defaultLang = this.data.defaultLang || '.',
      interpolation = this.data.interpolation || {startDelimiter: '{{', endDelimiter: '}}'},
      source = this.data.source || '',
      nullEmpty = this.data.nullEmpty || false,
      namespace = this.data.namespace || false,
      prefix = this.data.prefix || '',
      safeMode = this.data.safeMode ? true : false,
      suffix = this.data.suffix || '.json',
      customRegex = _.isArray(this.data.customRegex) ? this.data.customRegex : [],
      stringify_options = this.data.stringifyOptions || null,
      results = {};

    var customStringify = function (val) {
      if (stringify_options) {
        return stringify(val, _.isObject(stringify_options) ? stringify_options : {
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

    // Use to escape some char into regex patterns
    var escapeRegExp = function (str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    // Extract regex strings from content and feed results object
    var _extractTranslation = function (regexName, regex, content, results) {
      var r;
      _log.debug("---------------------------------------------------------------------------------------------------");
      _log.debug('Process extraction with regex : "' + regexName + '"');
      _log.debug(regex);
      regex.lastIndex = 0;
      while ((r = regex.exec(content)) !== null) {

        // Result expected [STRING, KEY, SOME_REGEX_STUF]
        // Except for plural hack [STRING, KEY, ARRAY_IN_STRING]
        if (r.length >= 2) {
          var translationKey, evalString;
          var translationDefaultValue = "";

          switch (regexName) {
            case 'HtmlDirectivePluralFirst':
              var tmp = r[1];
              r[1] = r[2];
              r[2] = tmp;
            case 'HtmlDirectivePluralLast':
              evalString = eval(r[2]);
              if (_.isArray(evalString) && evalString.length >= 2) {
                translationDefaultValue = "{NB, plural, one{" + evalString[0] + "} other{" + evalString[1] + "}" + (evalString[2] ? ' ' + evalString[2] : '');
              }
              translationKey = r[1].trim();
              break;
            default:
              translationKey = r[1].trim();
          }

          // Avoid empty translation
          if (translationKey === "") {
            return;
          }

          switch (regexName) {
            case "commentSimpleQuote":
            case "HtmlFilterSimpleQuote":
            case "JavascriptServiceSimpleQuote":
            case "JavascriptServiceInstantSimpleQuote":
            case "JavascriptFilterSimpleQuote":
            case "HtmlNgBindHtml":
              translationKey = translationKey.replace(/\\\'/g, "'");
              break;
            case "commentDoubleQuote":
            case "HtmlFilterDoubleQuote":
            case "JavascriptServiceDoubleQuote":
            case "JavascriptServiceInstantDoubleQuote":
            case "JavascriptFilterDoubleQuote":
              translationKey = translationKey.replace(/\\\"/g, '"');
              break;
            case "JavascriptServiceArraySimpleQuote":
            case "JavascriptServiceArrayDoubleQuote":
              var key;

              if(regexName === "JavascriptServiceArraySimpleQuote") {
                key = translationKey.replace(/'/g, '');
              } else {
                key = translationKey.replace(/"/g, '');
              }
              key = key.replace(/[\][]/g, '');
              key = key.split(',');

              key.forEach(function(item){
                item = item.replace(/\\\"/g, '"').trim();
                results[item] = translationDefaultValue;
              });
              break;
          }

          if( regexName !== "JavascriptServiceArraySimpleQuote" &&
              regexName !== "JavascriptServiceArrayDoubleQuote") {
            results[ translationKey ] = translationDefaultValue;
          }


        }
      }
    };

    // Regexs that will be executed on files
    var regexs = {
      commentSimpleQuote: '\\/\\*\\s*i18nextract\\s*\\*\\/\'((?:\\\\.|[^\'\\\\])*)\'',
      commentDoubleQuote: '\\/\\*\\s*i18nextract\\s*\\*\\/"((?:\\\\.|[^"\\\\])*)"',
      HtmlFilterSimpleQuote: escapeRegExp(interpolation.startDelimiter) + '\\s*\'((?:\\\\.|[^\'\\\\])*)\'\\s*\\|\\s*translate(:.*?)?\\s*' + escapeRegExp(interpolation.endDelimiter),
      HtmlFilterDoubleQuote: escapeRegExp(interpolation.startDelimiter) + '\\s*"((?:\\\\.|[^"\\\\\])*)"\\s*\\|\\s*translate(:.*?)?\\s*' + escapeRegExp(interpolation.endDelimiter),
      HtmlDirective: '<[^>]*translate[^{>]*>([^<]*)<\/[^>]*>',
      HtmlDirectiveStandalone: 'translate="((?:\\\\.|[^"\\\\])*)"',
      HtmlDirectivePluralLast: 'translate="((?:\\\\.|[^"\\\\])*)".*angular-plural-extract="((?:\\\\.|[^"\\\\])*)"',
      HtmlDirectivePluralFirst: 'angular-plural-extract="((?:\\\\.|[^"\\\\])*)".*translate="((?:\\\\.|[^"\\\\])*)"',
      HtmlNgBindHtml: 'ng-bind-html="\\s*\'((?:\\\\.|[^\'\\\\])*)\'\\s*\\|\\s*translate(:.*?)?\\s*"',
      JavascriptServiceSimpleQuote: '\\$translate\\(\\s*\'((?:\\\\.|[^\'\\\\])*)\'[^\\)]*\\)',
      JavascriptServiceDoubleQuote: '\\$translate\\(\\s*"((?:\\\\.|[^"\\\\])*)"[^\\)]*\\)',
      JavascriptServiceArraySimpleQuote: '\\$translate\\((?:\\s*(\\[\\s*(?:(?:\'(?:(?:\\.|[^.*\'\\\\])*)\')\\s*,*\\s*)+\\s*\\])\\s*)\\)',
      JavascriptServiceArrayDoubleQuote: '\\$translate\\((?:\\s*(\\[\\s*(?:(?:"(?:(?:\\.|[^.*\'\\\\])*)")\\s*,*\\s*)+\\s*\\])\\s*)\\)',
      JavascriptServiceInstantSimpleQuote: '\\$translate\\.instant\\(\\s*\'((?:\\\\.|[^\'\\\\])*)\'[^\\)]*\\)',
      JavascriptServiceInstantDoubleQuote: '\\$translate\\.instant\\(\\s*"((?:\\\\.|[^"\\\\])*)"[^\\)]*\\)',
      JavascriptFilterSimpleQuote: '\\$filter\\(\\s*\'translate\'\\s*\\)\\s*\\(\\s*\'((?:\\\\.|[^\'\\\\])*)\'[^\\)]*\\)',
      JavascriptFilterDoubleQuote: '\\$filter\\(\\s*"translate"\\s*\\)\\s*\\(\\s*"((?:\\\\.|[^"\\\\\])*)"[^\\)]*\\)'
    };

    _.forEach(customRegex, function (regex, key) {
      regexs['others_' + key] = regex;
    });


    /**
     * Recurse an object to retrieve as an array all the value of named parameters
     * INPUT: {"myLevel1": [{"val": "myVal1", "label": "MyLabel1"}, {"val": "myVal2", "label": "MyLabel2"}], "myLevel12": {"new": {"label": "myLabel3é}}}
     * OUTPUT: ["MyLabel1", "MyLabel2", "MyLabel3"]
     * @param data
     * @returns {Array}
     * @private
     */
    var _recurseObject = function (data) {
      var currentArray = new Array();
      if (_.isObject(data) || _.isArray(data['attr'])) {
        for (var attr in data) {
          if (_.isString(data[attr]) && _.indexOf(jsonSrcName, attr) !== -1) {
            currentArray.push(data[attr]);
          } else if (_.isObject(data[attr]) || _.isArray(data['attr'])) {
            var recurse = _recurseObject(data[attr]);
            currentArray = _.union(currentArray, recurse);
          }
        }
      }
      return currentArray;
    };

    /**
     * Recurse feed translation object (utility for namespace)
     * INPUT: {"NS1": {"NS2": {"VAL1": "", "VAL2": ""} } }
     * OUTPUT: {"NS1": {"NS2": {"VAL1": "NS1.NS2.VAL1", "VAL2": "NS1.NS2.VAL2"} } }
     * @param {Object} data
     * @param {string?} path
     * @private
     */
    var _recurseFeedDefaultNamespace = function (data, path) {
      var path = path || '';
      if (_.isObject(data)) {
        for (var key in data) {
          if (_.isObject(data)) {
            data[ key ] = _recurseFeedDefaultNamespace(data[ key ], path != '' ? path + '.' + key : key);
          }
        }
        return data;
      } else {
        if (data == null && data == "") {
          // return default data if empty/null
          return path;
        } else {

          return data;
        }
      }
    };

    /**
     * Start extraction of translations
     */

    // Check directory exist
    if (!_file.exists(dest)) {
      _file.mkdir(dest);
    }

    // Parse all files to extract translations with defined regex
    files.forEach(function (file) {

      _log.debug("Process file: " + file);
      var content = _file.read(file), _regex;

      // Execute all regex defined at the top of this file
      for (var i in regexs) {
        _regex = new RegExp(regexs[i], "gi");
        switch (i) {
          // Case filter HTML simple/double quoted
          case "HtmlFilterSimpleQuote":
          case "HtmlFilterDoubleQuote":
          case "HtmlDirective":
          case "HtmlDirectivePluralLast":
          case "HtmlDirectivePluralFirst":
          case "JavascriptFilterSimpleQuote":
          case "JavascriptFilterDoubleQuote":
            // Match all occurences
            var matches = content.match(_regex);
            if (_.isArray(matches) && matches.length) {
              // Through each matches, we'll execute regex to get translation key
              for (var index in matches) {
                if (matches[index] !== "") {
                  _extractTranslation(i, _regex, matches[index], results);
                }
              }

            }
            break;
          // Others regex
          default:
            _extractTranslation(i, _regex, content, results);

        }
      }

    });

    // Parse all extra files to extra
    jsonSrc.forEach(function (file) {
      _log.debug("Process extra file: " + file);
      var content = _file.readJSON(file);
      var recurseData = _recurseObject(content);
      for (var i in recurseData) {
        if (_.isString(recurseData[i])) {
          results[ recurseData[i].trim() ] = '';
        }
      }
    });

    // Create translation object
    var _translation = new Translations({
      "safeMode": safeMode,
      "tree": namespace,
      "nullEmpty": nullEmpty
    }, results);

    // Build all output langage files
    this.data.lang.forEach(function (lang) {

      var destFilename = dest + '/' + prefix + lang + suffix,
        filename = source,
        translations = {},
        json = {};

      // Test source filename
      if (filename === '' || !_file.exists(filename)) {
        filename = destFilename;
      }

      _log.subhead('Process ' + lang + ' : ' + filename);

      var isDefaultLang = (defaultLang === lang);
      if (!_file.exists(filename)) {
        _log.debug('File doesn\'t exist');
        
        _log.writeln('Create file: ' + destFilename + (isDefaultLang ? ' (' + lang + ' is the default language)' : ''));
        translations = _translation.getMergedTranslations({}, isDefaultLang);

      } else {
        _log.debug('File exist');
        json = _file.readJSON(filename);
        translations = _translation.getMergedTranslations(Translations.flatten(json), isDefaultLang);
      }

      var stats = _translation.getStats();
      var statEmptyType = nullEmpty ? "null" : "empty";
      var statPercentage =  Math.round(stats[statEmptyType] / stats["total"] * 100);
      statPercentage = isNaN(statPercentage) ? 100 : statPercentage;
      var statsString = "Statistics : " +
        statEmptyType + ": " + stats[statEmptyType] + " (" + statPercentage + "%)" +
        " / Updated: " + stats["updated"] +
        " / Deleted: " + stats["deleted"] +
        " / New: " + stats["new"];

      _log.writeln(statsString);

      // Write JSON file for lang
      _file.write(destFilename, customStringify(translations));

    });

  });

};
