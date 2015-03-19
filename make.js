var shell = require('shelljs/global'),
    ug = require('uglify-js'),
    fs = require('fs'),
    tar = require('tar-fs'),
    zlib = require('zlib');


cat([
  './src/config.js', 
  './src/celestial.js', 
  './src/projection.js', 
  './src/transform.js', 
  './src/symbol.js' 
]).to('./celestial.js');


//jshint linting
if (exec('jshint ./celestial.js').code !== 0) {
  echo('JSHINT FAILED');
  exit(0);
}

echo('JSHint tests passed');

//run tests
cd('test');
/*ls("*-test.js").forEach(function(file) {
  if (exec('node ' + file).code !== 123) {
    echo('TEST FAILED for ' + file);
    exit(0);  
  }
});*/

echo('Unit tests passed');

cd('..');

var out = ug.minify('./celestial.js');
fs.writeFileSync('./celestial.min.js', out.code);
//console.log(out.map);

echo('Writing data');

// zip data + prod. code + css
tar.pack('./', {
     entries: ['viewer.html', 'style.css', 'readme.md', 'LICENSE', 'celestial.min.js', 'data', 'lib/d3.min.js', 'lib/d3.geo.projection.min.js', 'lib/d3.geo.zoom.js'] 
   })
   .pipe(zlib.createGzip())
   .pipe(fs.createWriteStream('./celestial-data.tar.gz'))

echo('Done');
