var shell = require('shelljs/global'),
    ug = require('uglify-js'),
    fs = require('fs'),
    tar = require('tar-fs'),
    zlib = require('zlib'),
    copy = "Copyright 2015 Olaf Frohn https://github.com/ofrohn, see LICENSE\n";


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
ls("*-test.js").forEach(function(file) {
  if (exec('node ' + file).code !== 123) {
    echo('TEST FAILED for ' + file);
    exit(0);  
  }
});

echo('Unit tests passed');

cd('..');

var out = ug.minify('./celestial.js');
fs.writeFileSync('./celestial.min.js', copy + out.code);
/*var read = ug.parse(fs.readFileSync('./celestial.js', "utf8"));
read.figure_out_scope();

var comp = read.transform( UglifyJS.Compressor(); );
comp.figure_out_scope();
comp.compute_char_frequency();
comp.mangle_names();

var out = comp.print_to_string();
fs.writeFileSync('./celestial.min.js', out);
*/

echo('Writing data');

// zip data + prod. code + css
tar.pack('./', {
     entries: ['viewer.html', 'style.css', 'readme.md', 'LICENSE', 'celestial.min.js', 'data', 'lib/d3.min.js', 'lib/d3.geo.projection.min.js', 'lib/d3.geo.zoom.js'] 
   })
   .pipe(zlib.createGzip())
   .pipe(fs.createWriteStream('./celestial-data.tar.gz'))

echo('Done');
