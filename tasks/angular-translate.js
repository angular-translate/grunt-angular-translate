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
      prefix = this.data.prefix || '',
      safeMode = this.data.safeMode ? true : false,
      suffix = this.data.suffix || '.json',
      results = {};

    var escapeRegExp = function (str) {
      return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    // Regexs that will be executed on files
    var regexs = {
      // @TODO Improve this one...
      // Match: {{'TRANSLATION' | translate}}

      //(new RegExp(pid, "g")).exec(p.join(',')) !== null
      //[^{}]*(?:{{\s*'([^']*)'\s*\|\s*translate(?:.*?)?\s*}})[^{}]*
      HtmlFilterSimpleQuote: new RegExp(escapeRegExp(interpolation.startDelimiter) + "\\s*'((?:\\\\.|[^'\\\\])*)'\\s*\\|\\s*translate(?:.*)" + escapeRegExp(interpolation.endDelimiter), "gi"),
      HtmlFilterDoubleQuote: new RegExp(escapeRegExp(interpolation.startDelimiter) + '\\s*"((?:\\\\.|[^"\\\\])*)"\\s*\\|\\s*translate(?:.*)' + escapeRegExp(interpolation.endDelimiter), "gi"),
      // Match: <span translate="TRANSLATION_KEY" angular-plural-extract="['TEXT FOR ONE','# TEXT FOR OTHER']" translate-values="{NB: X}" translate-interpolation="messageformat"></span>
      HtmlDirectivePlural: /translate=\"((?:\\.|[^"\\])*)\".*angular-plural-extract=\"((?:\\.|[^"\\])*)\"/gi,
      // Match: <a href="#" translate>TRANSLATION</a>
      HtmlDirective: /<[^>]*translate[^{>]*>([^<]*)<\/[^>]*>/gi,
      // Match: $translate('TRANSLATION')
      JavascriptService: /\$translate\([^'"]['"]([^'"]*)['"][^'"]*\)/gi,
      // Match: $filter("translate")("TRANSLATION")
      JavascriptFilter: /\$filter\(\s*['"]translate['"]\s*\)\s*\(\s*['"](.*[\S].*)['"]\s*\)/gi
    };

    // Check directory exist
    if (!_file.exists(dest)) {
      _file.mkdir(dest);
    }

    // Parse all files to extract translations with defined regex
    files.forEach(function (file) {

      _log.debug("Process file: " + file);
      var content = _file.read(file), r;

      // Execute all regex defined at the top of this file
      for (var i in regexs) {

        while ((r = regexs[i].exec(content)) !== null) {
          // Result expected [STRING, KEY, SOME_REGEX_STUF]
          // Except for plural hack [STRING, KEY, ARRAY_IN_STRING]
          if (r.length >= 2) {
            var translationKey = _(r[1]).strip();
            var translationDefaultValue = "";

            // Avoid emptu translation
            if (translationKey === "") {
              return;
            }

            // Particular case for plural
            // Build default key by attribute in HTML code
            if (i == "HtmlDirectivePlural") {
              var evalString = eval(r[2]);
              if (_.isArray(evalString) && evalString.length >= 2) {
                translationDefaultValue = "{NB, plural, one{" + evalString[0] + "} other{" + evalString[1] + "}" + (evalString[2] ? ' ' + evalString[2] : '');
              }
            }
            results[ translationKey ] = translationDefaultValue;
          }
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
