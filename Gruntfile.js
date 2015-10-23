/**
 * grunt-angular-translate
 * https://github.com/firehist/grunt-angular-translate
 *
 * Copyright (c) 2013 "firehist" Benjamin Longearet, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/**/*.js',
        '<%= nodeunit.tests %>'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp']
    },

    /**
     * Increments the version number, etc.
     */
    bump: {
      options: {
        files: [
          "package.json"
        ],
        commit: true,
        commitMessage: 'chore(release): v%VERSION%',
        commitFiles: [
          "package.json"
        ],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin'
      }
    },

    /**
     * i18nextract build json lang files
     */
    i18nextract: {

      // Provide fr_FR language
      default_options: {
        prefix:   '00_',
        suffix:   '.json',
        src:      [ 'test/fixtures/*.html', 'test/fixtures/*.js', '!test/fixtures/links.js', '!test/fixtures/index_key_as_text.html'  ],
        lang:     ['fr_FR'],
        dest:     'tmp'
      },

      default_exists_i18n : {
        prefix:   '01_',
        suffix:   '.json',
        nullEmpty: true,
        src:      [ 'test/fixtures/*.html', 'test/fixtures/*.js', '!test/fixtures/links.js', '!test/fixtures/index_key_as_text.html'  ],
        lang:     ['fr_FR'],
        dest:     'tmp',
        source:   'test/fixtures/default_exists_i18n.json' // Use to generate different output file
      },

      default_deleted_i18n : {
        prefix:   '02_',
        suffix:   '.json',
        src:      [ 'test/fixtures/*.html', 'test/fixtures/*.js', '!test/fixtures/links.js', '!test/fixtures/index_key_as_text.html'  ],
        lang:     ['fr_FR'],
        dest:     'tmp',
        source:   'test/fixtures/default_deleted_i18n.json' // Use to generate different output file
      },

      interpolation_bracket: {
        prefix:   '03_',
        suffix:   '.json',
        interpolation: {
          startDelimiter: '[[',
          endDelimiter: ']]'
        },
        src:      [ 'test/fixtures/*.html', 'test/fixtures/*.js', '!test/fixtures/links.js', '!test/fixtures/index_key_as_text.html'  ],
        lang:     ['fr_FR'],
        dest:     'tmp'
      },

      default_language: {
        prefix:   '04_',
        suffix:   '.json',
        src:      [ 'test/fixtures/*.html', 'test/fixtures/*.js', '!test/fixtures/links.js', '!test/fixtures/index_key_as_text.html'  ],
        lang:     ['fr_FR', 'en_US'],
        dest:     'tmp',
        defaultLang: 'en_US'
      },

      json_extract: {
        prefix:   '05_',
        suffix:   '.json',
        src:      [ 'test/fixtures/*.html', 'test/fixtures/*.js', '!test/fixtures/links.js', '!test/fixtures/index_key_as_text.html'  ],
        jsonSrc:  [ 'test/fixtures/*.json' ],
        jsonSrcName: ['label'],
        lang:     ['en_US'],
        dest:     'tmp',
        defaultLang: 'en_US'
      },

      sub_namespace: {
        prefix:   '06_',
        suffix:   '.json',
        src:      [ 'test/fixtures/index_namespace.html' ],
        lang:     ['fr_FR'],
        namespace: true,
        dest:     'tmp'
      },

      /**
       * Test case: Feed
       */
      sub_namespace_default_language: {
        prefix:   '07_',
        suffix:   '.json',
        src:      [ 'test/fixtures/index_namespace.html' ],
        lang:     ['fr_FR', 'en_US'],
        defaultLang: 'fr_FR',
        nullEmpty: true,
        namespace: true,
        dest:     'tmp'
      },

      /**
       * Test case: Feed
       */
      sub_namespace_default_language_source: {
        prefix:   '08_',
        suffix:   '.json',
        src:      [ 'test/fixtures/index_namespace.html' ],
        lang:     ['fr_FR'],
        defaultLang: 'fr_FR',
        safeMode: true,
        nullEmpty: true,
        namespace: true,
        dest:     'tmp',
        source:   'test/fixtures/default_exists_i18n_namespace.json' // Use to generate different output file
      },

      /**
       * Test case: Use consistent output to be able to merge easily
       */
      consistent_stringify: {
        prefix:   '09_A_',
        suffix:   '.json',
        src:      [ 'test/fixtures/index_namespace_consistent_output.html' ],
        lang:     ['fr_FR'],
        defaultLang: 'fr_FR',
        safeMode: true,
        nullEmpty: true,
        namespace: true,
        stringifyOptions: true,
        dest:     'tmp',
        source:   'test/fixtures/default_exists_i18n_namespace.json' // Use to generate different output file
      },

      /**
       * Test case: Use consistent output with options
       */
      consistent_stringify_options: {
        prefix:   '09_B_',
        suffix:   '.json',
        src:      [ 'test/fixtures/index_namespace_consistent_output.html' ],
        lang:     ['fr_FR'],
        defaultLang: 'fr_FR',
        safeMode: true,
        nullEmpty: true,
        namespace: true,
        stringifyOptions: {
          space: '  '
        },
        dest:     'tmp',
        source:   'test/fixtures/default_exists_i18n_namespace.json' // Use to generate different output file
      },

      /**
       * Test case: Use consistent output with options
       */
      extra_regexs: {
        prefix:   '10_',
        suffix:   '.json',
        src:      [ 'test/fixtures/*.html', 'test/fixtures/*.js', '!test/fixtures/links.js', '!test/fixtures/index_key_as_text.html'  ],
        lang:     ['fr_FR'],
        customRegex: [
          'tt-default="\'((?:\\\\.|[^\'\\\\])*)\'\\|translate"'
        ],
        dest:     'tmp'
      },

      /**
       * Test case: Preserve translation links
       */
      keep_translation_links: {
        prefix:    '11_',
        suffix:    '.json',
        src:       [ 'test/fixtures/links.js' ],
        lang:      ['en_US'],
        dest:      'test/existing',
        namespace: true
      },

      /**
       * Test case: Allow text as keys
       */
      key_as_text: {
        prefix:   '12_',
        suffix:   '.json',
        src: ['test/fixtures/index_key_as_text.html'],
        lang: ['en_US'],
        dest: 'tmp',
        keyAsText: true
      }

    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    },

    markdox: {
      all: {
        files: [
          {src: 'tasks/*.js', dest: 'DOCUMENTATION.md'}
        ]
      }
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-markdox');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'i18nextract', 'nodeunit', 'clean']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['test']);

};
