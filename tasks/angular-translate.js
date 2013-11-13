/**
 * grunt-angular-translate
 * https://github.com/firehist/grunt-angular-translate
 *
 * Copyright (c) 2013 "firehist" Benjamin Longearet, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

  grunt.registerMultiTask('i18nextract', 'Generate json language file for angular-translate project', function () {

    var _ = grunt.util._;

    // Require lang array with length >= 1
    if (!this.data.lang || !this.data.lang.length) {
      grunt.fail('No lang set for i18nextract');
    }

    var files = grunt.file.expand(this.data.src),
      dest = this.data.dest || '.',
      extraSrc = grunt.file.expand(this.data.extraSrc || ''),
      extraSrcName = grunt.util._.union(this.data.extraSrcName || [], ['label']),
      defaultLang = this.data.defaultLang || '.',
      source = this.data.source || '',
      prefix = this.data.prefix || '',
      safeMode = this.data.safeMode ? true : false,
      suffix = this.data.suffix || '.json',
      results = {};

    if (!grunt.file.exists(dest)) {
      grunt.file.mkdir(dest);
    }

    // Parse all files to extract translations
    files.forEach(function (file) {

      grunt.log.debug("Process file: " + file);

      var content = grunt.file.read(file), r;

      for (var i in regexs) {
        while ((r = regexs[i].exec(content)) !== null) {
          if (r.length === 2) {
            results[ grunt.util._(r[1]).strip() ] = '';
          }
        }
      }

    });

    var _recurseObject = function (data) {
      var currentArray = new Array();
      if (_.isObject(data) || _.isArray(data['attr'])) {
        for (var attr in data) {
          if (_.isString(data[attr]) && _.indexOf(extraSrcName, attr) !== -1) {
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
    extraSrc.forEach(function (file) {

      grunt.log.debug("Process extra file: " + file);

      var content = grunt.file.readJSON(file);
      var extractValues = _recurseObject(content);
      for (var i in extractValues) {
        results[ _(extractValues[i]).strip() ] = '';
      }

    });

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
      if (filename === '' || !grunt.file.exists(filename)) {
        filename = destFilename;
      }

      grunt.log.subhead('Process ' + lang + ' : ' + filename);

      if (!grunt.file.exists(filename)) {
        grunt.log.debug('File doesn\'t exist');
        translations = results;
      } else {
        grunt.log.debug('File exist');
        json = grunt.file.readJSON(filename);

        grunt.util._.extend((translations = grunt.util._.clone(results) ), json);
      }
      // Make some stats
      for (var key in translations) {
        var translation = translations[ key ],
          isJson = grunt.util.kindOf(json[key]) === 'string',
          isResults = grunt.util.kindOf(results[key]) === 'string';

        nbTra++;

        if (translation === '') {       // Case empty translation
          if (lang === defaultLang) {
            translations[ key ] = key;
          } else {
            nbEmpty++;
          }
        }
        if (!isJson && isResults) {   // Case new translation (exist into src files but not in json file)
          nbNew++;
        }
        if (isJson && !isResults) {   // Case deleted translation (exist in json file but not into src files)
          nbDel++;
          if (!safeMode) {
            delete translations[ key ];
          }
        }
      }
      // Some information for the output
      if (!grunt.file.exists(destFilename)) {
        grunt.log.subhead('Create file: ' + destFilename);
      }

      grunt.log.writeln('Empty: ' + nbEmpty + ' (' + Math.round(nbEmpty / nbTra * 100) + '%) / New: ' + nbNew + ' / Deleted: ' + nbDel);
      // Write JSON file for lang
      grunt.file.write(destFilename, JSON.stringify(translations, null, 4));

    });

    var nbLang = this.data.lang.length || 0;
    grunt.log.ok(nbLang + ' file' + (nbLang ? 's' : '') + ' updated');

  });

  var path = require('path');
  var regexs = {
    // Use to match {{'TRANSLATION' | translate}}
    filterRegexDouble: /{{\s*"((?:\\.|[^"\\])*)"\s*\|\s*translate(?:[^}]*)}}/gi,
    filterRegexSimple: /{{\s*'((?:\\.|[^'\\])*)'\s*\|\s*translate(?:[^}]*)}}/gi,
    filterRegexPlural: /angular-plural-extract=\"((?:\\.|[^"\\])*)\"/gi,
    // Use to match <a href="#" translate>TRANSLATION</a>
    directiveRegex: /<[^>]*translate[^{>]*>([^<]*)<\/[^>]*>/gi,
    // Use to match $translate('TRANSLATION')
    javascriptRegex: /\$translate\([^'"]['"]([^'"]*)['"][^'"]*\)/gi,
    // Used to match $filter("translate")("TRANSLATION")
    javascriptRegex2: /\$filter\(\s*['"]translate['"]\s*\)\s*\(\s*['"](.*[\S].*)['"]\s*\)/gi
  };
};
