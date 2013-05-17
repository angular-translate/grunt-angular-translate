'use strict';

var grunt = require('grunt');

exports.i18nextract = {

  default_options: function(test) {
    test.expect(1);

    var actual = grunt.file.read('tmp/00_fr_FR.json');
    var expected = grunt.file.read('test/expected/00_fr_FR.json');
    test.equal(actual, expected, 'should describe what the default behavior is.');

    test.done();
  },

  exists_i18n: function(test) {
    test.expect(1);

    var actual = grunt.file.read( 'tmp/01_fr_FR.json' );
    var expected = grunt.file.read( 'test/expected/01_fr_FR.json' );
    test.equal( actual, expected, 'should describe what the default behavior is when lang file already exist.' );

    test.done();
  },

  deleted_i18n: function(test) {
    test.expect(1);

    var actual = grunt.file.read( 'tmp/02_fr_FR.json' );
    var expected = grunt.file.read( 'test/expected/02_fr_FR.json' );
    test.equal( actual, expected, 'should describe what the default behavior is when lang file already exist.' );

    test.done();
  }

};
