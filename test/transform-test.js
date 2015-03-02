var shell = require('shelljs/global'),
    fs = require('fs'),
    assert = require('assert'),
    vm = require('vm'),
    shell = require('shelljs'),
    jsdom = require("jsdom").jsdom,
    includes = ['../lib/d3.js', '../lib/d3.geo.projection.js', '../celestial.js'],
    result;
   

var Round = function(val) { return (Math.round(val*1000)/1000); }; 
    
global.document = jsdom("Testing"),
global.window = document.parentWindow;
    
includes.forEach(function(file) {
  vm.runInThisContext(fs.readFileSync(file, 'utf-8'), file);
});



//Euler angles in radians
assert.deepEqual(euler.galactic.map(Round), [3.366, 1.097, 2.146]);


assert.deepEqual(euler.add("test", [10,10,10]).map(Round), [10*deg2rad, 10*deg2rad, 10*deg2rad].map(Round));


//Method exists
assert.ok(Celestial.hasOwnProperty("transform"));

//Zero case without euler angles, return unchanged
assert.deepEqual(Celestial.transform([0,0]).map(Round), [0,0]);

assert.deepEqual(Celestial.transform([75*deg2rad,40*deg2rad]).map(Round), [75*deg2rad,40*deg2rad].map(Round));

//Transform to galactic coordinates
assert.deepEqual(Celestial.transform([0,0], euler.galactic).map(Round), [96.337 * deg2rad, -60.189 * deg2rad].map(Round));

//Transform to galactic coordinates 2
assert.deepEqual(Celestial.transform([75*deg2rad,40*deg2rad], euler.galactic).map(Round), [165.579*deg2rad, -1.461*deg2rad].map(Round));

//Transform to ecliptic coordinates 
assert.deepEqual(Celestial.transform([75*deg2rad,40*deg2rad], euler.ecliptic).map(Round), [78.022*deg2rad, 17.182*deg2rad].map(Round));

//Transform to supergalactic coordinates 
assert.deepEqual(Celestial.transform([75*deg2rad,40*deg2rad], euler.supergalactic).map(Round), [1.735*deg2rad, -28.195*deg2rad].map(Round));


//Method exists
assert.ok(Celestial.hasOwnProperty("plane"));




shell.exit(123);

