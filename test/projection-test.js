var shell = require('shelljs/global'),
    fs = require('fs'),
    assert = require('assert'),
    vm = require('vm'),
    shell = require('shelljs'),
    jsdom = require("jsdom").jsdom,
    includes = ['../lib/d3.js', '../lib/d3.geo.projection.js', '../src/config.js', '../src/util.js', '../src/projection.js'];
   
    
global.document = jsdom("Testing"),
global.window = document.parentWindow;
global.Celestial = {};

includes.forEach(function(file) {
  vm.runInThisContext(fs.readFileSync(file, 'utf-8'), file);
});

//Method exists
assert.ok(Celestial.hasOwnProperty("projection"));

//Returns valid projection
assert.ok(Celestial.projection("aitoff"));

//Returns error
//assert.throws(Celestial.projection(), Error);

shell.exit(123);

