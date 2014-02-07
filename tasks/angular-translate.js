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
    var _ = grunt.util._;
    var _log = grunt.log;
    var _file = grunt.file;


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
      prefix = this.data.prefix || '',
      safeMode = this.data.safeMode ? true : false,
      suffix = this.data.suffix || '.json',
      results = {};

    var escapeRegExp = function (str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

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
              translationKey = _(r[1]).strip();
              break;
            default:
              translationKey = _(r[1]).strip();
          }

          // Avoid empty translation
          if (translationKey === "") {
            return;
          }

          switch (regexName) {
            case "HtmlFilterSimpleQuote":
            case "JavascriptServiceSimpleQuote":
            case "JavascriptFilterSimpleQuote":
            case "HtmlNgBindHtml":
              translationKey = translationKey.replace(/\\\'/g, "'");
              break;
            case "HtmlFilterDoubleQuote":
            case "JavascriptServiceDoubleQuote":
            case "JavascriptFilterDoubleQuote":
              translationKey = translationKey.replace(/\\\"/g, '"');
              break;
          }
          results[ translationKey ] = translationDefaultValue;
        }
      }
    };

    // Regexs that will be executed on files
    var regexs = {
      HtmlFilterSimpleQuote: escapeRegExp(interpolation.startDelimiter) + '\\s*\'((?:\\\\.|[^\'\\\\])*)\'\\s*\\|\\s*translate(:.*?)?\\s*' + escapeRegExp(interpolation.endDelimiter),
      HtmlFilterDoubleQuote: escapeRegExp(interpolation.startDelimiter) + '\\s*"((?:\\\\.|[^"\\\\\])*)"\\s*\\|\\s*translate(:.*?)?\\s*' + escapeRegExp(interpolation.endDelimiter),
      HtmlDirective: '<[^>]*translate[^{>]*>([^<]*)<\/[^>]*>',
      HtmlDirectivePluralLast: 'translate="((?:\\\\.|[^"\\\\])*)".*angular-plural-extract="((?:\\\\.|[^"\\\\])*)"',
      HtmlDirectivePluralFirst: 'angular-plural-extract="((?:\\\\.|[^"\\\\])*)".*translate="((?:\\\\.|[^"\\\\])*)"',
      HtmlNgBindHtml: 'ng-bind-html="\\s*\'((?:\\\\.|[^\'\\\\])*)\'\\s*\\|\\s*translate(:.*?)?\\s*"',
      JavascriptServiceSimpleQuote: '\\$translate\\(\\s*\'((?:\\\\.|[^\'\\\\])*)\'[^\\)]*\\)',
      JavascriptServiceDoubleQuote: '\\$translate\\(\\s*"((?:\\\\.|[^"\\\\])*)"[^\\)]*\\)',
      JavascriptFilterSimpleQuote: '\\$filter\\(\\s*\'translate\'\\s*\\)\\s*\\(\\s*\'((?:\\\\.|[^\'\\\\])*)\'[^\\)]*\\)',
      JavascriptFilterDoubleQuote: '\\$filter\\(\\s*"translate"\\s*\\)\\s*\\(\\s*"((?:\\\\.|[^"\\\\\])*)"[^\\)]*\\)'
    };

    // Check directory exist
    if (!_file.exists(dest)) {
      _file.mkdir(dest);
    }

    // Parse all files to extract translations with defined regex
    files.forEach(function (file) {

      _log.debug("Process file: " + file);
      var content = _file.read(file), _regex, r;

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

    // Parse all extra files to extra
    jsonSrc.forEach(function (file) {
      _log.debug("Process extra file: " + file);
      var content = _file.readJSON(file);
      var recurseData = _recurseObject(content);
      for (var i in recurseData) {
        results[ _(recurseData[i]).strip() ] = '';
      }
    });

    // Build all output langage files
    this.data.lang.forEach(function (lang) {

      var destFilename = dest + '/' + prefix + lang + suffix,
        filename = source,
        translations = {},
        nbTra = 0,
        nbEmpty = 0,
        nbNew = 0,
        nbDel = 0,
        json = {};

      // Test source filename
      if (filename === '' || !_file.exists(filename)) {
        filename = destFilename;
      }

      _log.subhead('Process ' + lang + ' : ' + filename);

      if (!_file.exists(filename)) {
        _log.debug('File doesn\'t exist');
        translations = results;
      } else {
        _log.debug('File exist');
        json = _file.readJSON(filename);
        _.extend((translations = _.clone(results) ), json);
      }

      // Make some stats

      for (var k in translations) {
        var translation = translations[k];
        var isJson = _.isString(json[k]);
        var isResults = _.isString(results[k]);

        nbTra++;

        // Case empty translation
        if (translation === '') {
          if (lang === defaultLang) {
            translations[ k ] = k;
          } else {
            // Test if option to set empty to null
            if (nullEmpty) {
              translations[ k ] = null;
            }
            nbEmpty++;
          }
        }
        // Case new translation (exist into src files but not in json file)
        if (!isJson && isResults) {
          nbNew++;
        }
        // Case deleted translation (exist in json file but not into src files)
        if (isJson && !isResults) {
          nbDel++;
          if (!safeMode) {
            delete translations[ k ];
          }
        }
      };
      // Some information for the output
      if (!_file.exists(destFilename)) {
        _log.subhead('Create file: ' + destFilename);
      }

      _log.writeln('Empty: ' + nbEmpty + ' (' + Math.round(nbEmpty / nbTra * 100) + '%) / New: ' + nbNew + ' / Deleted: ' + nbDel);
      // Write JSON file for lang
      _file.write(destFilename, JSON.stringify(translations, null, 4));

    });

    var nbLang = this.data.lang.length || 0;
    _log.ok(nbLang + ' file' + (nbLang ? 's' : '') + ' updated');

  });

};
