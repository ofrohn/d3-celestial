var shell = require('shelljs/global'),
    fs = require('fs'),
    assert = require('assert'),
    vm = require('vm'),
    jsdom = require("jsdom").jsdom,
    includes = ['../lib/d3.js', '../lib/d3.geo.projection.js', '../celestial.js'];
   
    
global.document = jsdom("Testing"),
global.window = document.parentWindow;
    
includes.forEach(function(file) {
  vm.runInThisContext(fs.readFileSync(file, 'utf-8'), file);
});

//console.log(Object.getPrototypeOf(Celestial));
assert.ok( Object.getPrototypeOf(Celestial) === Object.prototype);

exit(123);