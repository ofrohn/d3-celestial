var shell = require('shelljs/global'),
    fs = require('fs'),
    assert = require('assert'),
    vm = require('vm'),
    jsdom = require("jsdom").jsdom,
    includes = ['../lib/d3.js', '../lib/d3.geo.zoom.js', '../lib/d3.geo.projection.js', '../src/celestial.js',   '../src/projection.js', '../src/transform.js', '../src/config.js', '../src/symbol.js'];
   
    
global.document = jsdom("Testing"),
global.window = document.parentWindow;
    
includes.forEach(function(file) {
  vm.runInThisContext(fs.readFileSync(file, 'utf-8'), file);
});

//console.log(Object.getPrototypeOf(Celestial));
assert.ok( Object.getPrototypeOf(Celestial) === Object.prototype);

//TODO: figure out how to test d3-apps with node

exit(123);