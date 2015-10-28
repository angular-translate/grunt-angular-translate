/**
 * grunt-angular-translate
 * https://github.com/firehist/grunt-angular-translate
 *
 * Copyright (c) 2015 "originof" Manuel Mazzuola, contributors
 * Licensed under the MIT license.
 *
 */

(function() {
  'use strict';

  var _file;
  var Po = require('pofile');

  function PotObject(id, msg, ctx) {
    this.id = id;
    this.msg = msg || '';
    this.ctx = ctx || '';
  }

  PotObject.prototype.toString = function() {
    return "" +
      "msgctxt \"" + String(this.ctx).replace(/"/g, '\\"') + "\"\n" +
      "msgid \"" + String(this.id).replace(/"/g, '\\"') + "\"\n" +
      "msgstr \"" + String(this.msg).replace(/"/g, '\\"') + "\"";
  };

  function PotAdapter(grunt) {
    _file = grunt.file;
  }

  PotAdapter.prototype.init = function(params) {
    this.dest = params.dest || '.';
    this.prefix = params.prefix;
    this.suffix = params.suffix || '.pot';
  };

  PotAdapter.prototype.persist = function(_translation) {
    var translations = _translation.getMergedTranslations({});
    var catalog = new Po();

    catalog.headers = {
      'Content-Type': 'text/plain; charset=UTF-8',
      'Content-Transfer-Encoding': '8bit',
      'Project-Id-Version': ''
    };

    for (var msg in translations) {
      catalog.items.push(new PotObject(msg, translations[msg]));
    }

    catalog.items.sort(function(a, b) {
      return a.id.toLowerCase().localeCompare(b.id.toLowerCase());
    });

    _file.write(this.dest + '/' + this.prefix + this.suffix, catalog.toString());
  };

  module.exports = PotAdapter;
}());

