/**
 * grunt-angular-translate
 * https://github.com/firehist/grunt-angular-translate 
 *
 * Copyright (c) 2013 "firehist" Benjamin Longearet, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function ( grunt ) {

  var path            = require('path'),
      // Use to match {{'TRANSLATION' | translate}}
      filterRegex     = /{{\s*['"]([^\']*)['"]\s*\|\s*translate\s*}}/gi,
      // Use to match <a href="#" translate>TRANSLATION</a>
      directiveRegex  = /<[^>]*translate[^>]*>([^<]*)<\/[^>]*>/gi,
      // Use to match $translate('TRANSLATION')
      javascriptRegex = /\$translate\([^'"]['"]([^'"]*)['"][^'"]*\)/gi;

  grunt.registerMultiTask('i18nextract', 'Generate json language file for angular-translate project', function() {
    // Require lang array with length >= 1
    if (!this.data.lang || !this.data.lang.length) {
      grunt.fail('No lang set for i18nextract');
    }

    var files     = grunt.file.expand( this.data.src ),
        dest      = this.data.dest || '.',
        source    = this.data.source || '',
        prefix    = this.data.prefix || '',
        safeMode  = this.data.safeMode ? true : false,
        suffix    = this.data.suffix || '.json',
        results   = {};

    if (!grunt.file.exists(dest)) {
      grunt.file.mkdir( dest );
    }

    // Parse all files to extract translations
    files.forEach(function(file) {

      grunt.log.debug("Process file: " + file);

      var content = grunt.file.read(file), r;

      while ((r = filterRegex.exec(content)) !== null) {
        if (r.length === 2) {
          results[ grunt.util._(r[1]).strip() ] = '';
        }
      }
      while ((r = javascriptRegex.exec(content)) !== null) {
        if (r.length === 2) {
          results[ grunt.util._(r[1]).strip() ] = '';
        }
      }
      while ((r = directiveRegex.exec(content)) !== null) {
        if (r.length === 2) {
          results[ grunt.util._(r[1]).strip() ] = '';
        }
      }

    });

    this.data.lang.forEach(function(lang) {

      var destFilename  = dest + '/' + prefix + lang + suffix,
          filename   = source,
          translations  = {},
          nbTra         = 0,
          nbEmpty       = 0,
          nbNew         = 0,
          nbDel         = 0,
          json          = {};

      // Test source filename
      if ( filename === '' || !grunt.file.exists( filename ) ) {
        filename = destFilename;
      }

      grunt.log.subhead('Process ' + lang + ' : ' + filename);

      if ( !grunt.file.exists( filename ) ) {
        grunt.log.debug('File doesn\'t exist');
        translations = results;
      } else {
        grunt.log.debug('File exist');
        json = grunt.file.readJSON( filename );

        grunt.util._.extend( (translations = grunt.util._.clone(results) ), json );
      }
      // Make some stats
      for (var key in translations) {
        var translation = translations[ key ],
            isJson      = grunt.util.kindOf( json[key] ) === 'string',
            isResults   = grunt.util.kindOf( results[key] ) === 'string';

        nbTra++;

        if (translation === '') {       // Case empty translation
          nbEmpty++;
        }
        if ( !isJson && isResults ) {   // Case new translation (exist into src files but not in json file)
          nbNew++;
        }
        if ( isJson && !isResults ) {   // Case deleted translation (exist in json file but not into src files)
          nbDel++;
          if ( !safeMode ) {
            delete translations[ key ];
          }
        }
      }
      // Some information for the output
      if ( !grunt.file.exists( destFilename ) ) {
        grunt.log.subhead('Create file: ' + destFilename);
      }
      
      grunt.log.writeln('Empty: ' + nbEmpty + ' (' + Math.round( nbEmpty / nbTra * 100 ) + '%) / New: ' + nbNew + ' / Deleted: ' + nbDel);
      // Write JSON file for lang
      grunt.file.write( destFilename, JSON.stringify( translations, null, 4 ) );

    });

    var nbLang = this.data.lang.length || 0;
    grunt.log.ok(nbLang + ' file' + (nbLang ? 's' : '') + ' updated');

  });
};
