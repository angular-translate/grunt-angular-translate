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
     * i18nextract build json lang files
     */
    i18nextract: {

      default_options: {
        src:      [ 'test/fixtures/*.html', 'test/fixtures/*.js' ],
        lang:     ['fr_FR'],
        prefix:   '00_',
        suffix:   '.json',
        dest:     'tmp'
      },

      exists_i18n : {
        src:      [ 'test/fixtures/*.html', 'test/fixtures/*.js' ],
        lang:     ['fr_FR'],
        prefix:   '01_',
        suffix:   '.json',   
        dest:     'tmp',
        source:   'test/fixtures/exists_i18n.json' // Use to generate different output file
      },

      deleted_i18n : {
        src:      [ 'test/fixtures/*.html', 'test/fixtures/*.js' ],
        lang:     ['fr_FR'],
        prefix:   '02_',
        suffix:   '.json',   
        dest:     'tmp',
        source:   'test/fixtures/deleted_i18n.json' // Use to generate different output file
      }

    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js']
    }

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'i18nextract', 'nodeunit', 'clean']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};