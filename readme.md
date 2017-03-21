# Celestial map with D3.js

Interactive, adaptable celestial map done with the [D3.js](http://d3js.org/) visualization library. So, GeoJSON for sky stuff. Which surprisingly nobody has done yet, it seems.  

Features display of stars and deep sky objects (DSOs) with a selectable magnitude limit up to 6, or choose different GeoJSON data source for higher magnitudes. Also shows constellations with names, lines and/or boundaries, the Milky Way band and grid lines. Alternate coordinate spaces e.g. ecliptc, galactic or supergalactic are also possible. Full support for zoom and rotation with mouse or gestures.

Since it uses D3.js and HTML5 canvas, it needs a modern browser with canvas support, so any recent flavor of Chrome/Firefox/Safari/Opera or IE 9 and above should suffice. Check out the demo at <a href="http://armchairastronautics.blogspot.com/p/skymap.html">armchairastronautics.blogspot.com</a> or download the tarball `celestial.tar.gz` containing everything for local usage, which works with Firefox; Chrome needs to be started with command line parameter  `--allow-file-access-from-files` to load local json files. Or use a local web server environment, quite easy to do with node.js.

__Demos__:  
[Simple map](./demo/map.html)  
[Interactive form](./demo/viewer.html)  
[Wall map](./demo/wallmap.html)  
[Setting time/location](./demo/location.html)  
[Starry sky](./demo/sky.html)  


__Some more examples__:  
[Embedded interactive form](http://armchairastronautics.blogspot.com/p/skymap.html)  
[Spinning sky globe](http://armchairastronautics.blogspot.com/2016/04/interactive-skymap-version-05.html)  
[The Milky Way halo, globular clusters & satellite galaxies](http://armchairastronautics.blogspot.com/p/milky-way-halo.html)  
[The Local Group of galaxies](http://armchairastronautics.blogspot.com/p/local-group.html)  
[Asterisms with locations & time selection](http://armchairastronautics.blogspot.com/p/asterisms.html)  
[Asterisms with zoom & pan](http://armchairastronautics.blogspot.com/2016/05/asterisms-interactive-and-with.html)  
[Zoom & pan animations](http://armchairastronautics.blogspot.com/2016/06/and-here-is-d3-celestial-057-with.html)  
[A different kind of Messier marathon](http://armchairastronautics.blogspot.com/2016/07/a-different-kind-of-messier-marathon.html)  

### Usage

Include the necessary scripts d3.min.js, d3.geo.projection.min.js and celestial.js from the `lib` subfolder or the first two alternatively from the official d3.js server `http://d3js.org/`, and then simply edit the default options and display the map with `Celestial.display(config)`.

```js
var config = { 
  width: 0,           // Default width, 0 = full parent element width; 
                      // height is determined by projection
  projection: "aitoff",    // Map projection used: see below
  transform: "equatorial", // Coordinate transformation: equatorial (default),
                           // ecliptic, galactic, supergalactic
  center: null,       // Initial center coordinates in set transform
                      // [longitude, latitude, orientation] all in degrees 
                      // null = default center [0,0,0]
  orientationfixed: true,  // Keep orientation angle the same as center[2]
  adaptable: true,    // Sizes are increased with higher zoom-levels
  interactive: true,  // Enable zooming and rotation with mousewheel and dragging
  form: true,         // Display form for interactive settings
  location: false,    // Display location settings (no center setting on form)
  controls: true,     // Display zoom controls
  container: "map",   // ID of parent element, e.g. div, null = html-body
  datapath: "data/",  // Path/URL to data files, empty = subfolder 'data'
  stars: {
    show: true,    // Show stars
    limit: 6,      // Show only stars brighter than limit magnitude
    colors: true,  // Show stars in spectral colors, if not use default color
    style: { fill: "#ffffff", opacity: 1 }, // Style for stars
    names: true,   // Show star designation (Bayer, Flamsteed, Variable star, Gliese, 
                      whichever applies first in that order)
    proper: false, // Show proper name (if one exists)
    desig: false,  // Show all designations, including Draper and Hipparcos
    namelimit: 2.5,  // Show only names/designations for stars brighter than namelimit
    namestyle: { fill: "#ddddbb", font: "11px Georgia, Times, 'Times Roman', serif", 
                 align: "left", baseline: "top" },  // Style for star designations
    propernamestyle: { fill: "#ddddbb", font: "11px Georgia, Times, 'Times Roman', serif", 
                       align: "right", baseline: "bottom" }, // Styles for star names
    propernamelimit: 1.5,  // Show proper names for stars brighter than propernamelimit
    size: 7,       // Maximum size (radius) of star circle in pixels
    exponent: -0.28, // Scale exponent for star size, larger = more linear
    data: 'stars.6.json' // Data source for stellar data, 
                         // number indicates limit magnitude
  },
  dsos: {
    show: true,    // Show Deep Space Objects 
    limit: 6,      // Show only DSOs brighter than limit magnitude
    names: true,   // Show DSO names
    desig: true,   // Show short DSO names
    namestyle: { fill: "#cccccc", font: "11px Helvetica, Arial, serif", 
                 align: "left", baseline: "top" }, // Style for DSO names
    namelimit: 6,  // Show only names for DSOs brighter than namelimit
    size: null,    // Optional seperate scale size for DSOs, null = stars.size
    exponent: 1.4, // Scale exponent for DSO size, larger = more non-linear
    data: 'dsos.bright.json', // Data source for DSOs, 
                              // opt. number indicates limit magnitude
    symbols: {  //DSO symbol styles, 'stroke'-parameter present = outline
      gg: {shape: "circle", fill: "#ff0000"},          // Galaxy cluster
      g:  {shape: "ellipse", fill: "#ff0000"},         // Generic galaxy
      s:  {shape: "ellipse", fill: "#ff0000"},         // Spiral galaxy
      s0: {shape: "ellipse", fill: "#ff0000"},         // Lenticular galaxy
      sd: {shape: "ellipse", fill: "#ff0000"},         // Dwarf galaxy
      e:  {shape: "ellipse", fill: "#ff0000"},         // Elliptical galaxy
      i:  {shape: "ellipse", fill: "#ff0000"},         // Irregular galaxy
      oc: {shape: "circle", fill: "#ffcc00", 
           stroke: "#ffcc00", width: 1.5},             // Open cluster
      gc: {shape: "circle", fill: "#ff9900"},          // Globular cluster
      en: {shape: "square", fill: "#ff00cc"},          // Emission nebula
      bn: {shape: "square", fill: "#ff00cc", 
           stroke: "#ff00cc", width: 2},               // Generic bright nebula
      sfr:{shape: "square", fill: "#cc00ff", 
           stroke: "#cc00ff", width: 2},               // Star forming region
      rn: {shape: "square", fill: "#00ooff"},          // Reflection nebula
      pn: {shape: "diamond", fill: "#00cccc"},         // Planetary nebula 
      snr:{shape: "diamond", fill: "#ff00cc"},         // Supernova remnant
      dn: {shape: "square", fill: "#999999", 
           stroke: "#999999", width: 2},               // Dark nebula grey
      pos:{shape: "marker", fill: "#cccccc", 
           stroke: "#cccccc", width: 1.5}              // Generic marker
    }
  },
  constellations: {
    show: true,    // Show constellations 
    names: true,   // Show constellation names 
    desig: true,   // Show short constellation names (3 letter designations)
    namestyle: { fill:"#cccc99", align: "center", baseline: "middle", 
                 font: ["14px Helvetica, Arial, sans-serif",  // Style for constellations
                        "12px Helvetica, Arial, sans-serif",  // Different fonts for diff.
                        "11px Helvetica, Arial, sans-serif"]},// ranked constellations
    lines: true,   // Show constellation lines, style below
    linestyle: { stroke: "#cccccc", width: 1, opacity: 0.6 }, 
    bounds: false, // Show constellation boundaries, style below
    boundstyle: { stroke: "#cccc00", width: 0.5, opacity: 0.8, dash: [2, 4] }
  },
  mw: {
    show: true     // Show Milky Way as filled multi-polygon outlines 
    style: { fill: "#ffffff", opacity: 0.15 }  // Style for MW layers
  },
  lines: {  // Display & styles for graticule & some planes
    graticule: { show: true, stroke: "#cccccc", width: 0.6, opacity: 0.8,   
      // grid values: "outline", "center", or [lat,...] specific position
      lon: {pos: [""], fill: "#eee", font: "10px Helvetica, Arial, sans-serif"}, 
      // grid values: "outline", "center", or [lon,...] specific position
      lat: {pos: [""], fill: "#eee", font: "10px Helvetica, Arial, sans-serif"}},    
    equatorial: { show: true, stroke: "#aaaaaa", width: 1.3, opacity: 0.7 },  
    ecliptic: { show: true, stroke: "#66cc66", width: 1.3, opacity: 0.7 },     
    galactic: { show: false, stroke: "#cc6666", width: 1.3, opacity: 0.7 },    
    supergalactic: { show: false, stroke: "#cc66cc", width: 1.3, opacity: 0.7 }
  },
  background: {        // Background style
    fill: "#000000",   // Area fill
    opacity: 1, 
    stroke: "#000000", // Outline
    width: 1.5
  }, 
  horizon: {  //Show horizon marker, if location is set and map projection is all-sky
    show: false, 
    stroke: null, // Line
    width: 1.0, 
    fill: "#000000", // Area below horizon
    opacity: 0.5
  }
};

// Display map with the configuration above or any subset therof
Celestial.display(config);
```

__Supported projections:__ Airy, Aitoff, Armadillo, August, Azimuthal Equal Area, Azimuthal Equidistant, Baker, Berghaus, Boggs, Bonne, Bromley, Collignon, Craig, Craster, Cylindrical Equal Area, Cylindrical Stereographic, Eckert 1, Eckert 2, Eckert 3, Eckert 4, Eckert 5, Eckert 6, Eisenlohr, Equirectangular, Fahey, Foucaut, Ginzburg 4, Ginzburg 5, Ginzburg 6, Ginzburg 8, Ginzburg 9, Hammer, Hatano, HEALPix, Hill, Homolosine, Kavrayskiy 7, Lagrange, l'Arrivee, Laskowski, Loximuthal, Mercator, Miller, Mollweide, Flat Polar Parabolic, Flat Polar Quartic, Flat Polar Sinusoidal, Natural Earth, Nell Hammer, Orthographic, Patterson, Polyconic, Rectangular Polyconic, Robinson, Sinusoidal, Stereographic, Times, 2 Point Equidistant, van der Grinten, van der Grinten 2, van der Grinten 3, van der Grinten 4, Wagner 4, Wagner 6, Wagner 7, Wiechel and Winkel Tripel. Most of these need the extension [d3.geo.projections](https://github.com/d3/d3-geo-projection/)  

__Style settings__   
`fill`: fill color [(css color value)](https://developer.mozilla.org/en-US/docs/Web/CSS/color)  
`opacity`: opacity (number 0..1)  
_Line styles_  
`stroke`: outline color [(css color value)](https://developer.mozilla.org/en-US/docs/Web/CSS/color)    
`width`: line width in pixels (number 0..)  
`dash`: line dash ([line length, gap length])  
_Text styles_  
`font`: well, the font [(css font property)](https://developer.mozilla.org/en-US/docs/Web/CSS/font)  
`align`: horizontal align (left|center|right|start|end)  
`baseline`: vertical align (alphabetic|top|hanging|middle|ideographic|bottom)  
_Symbol style_  
`shape`: symbol shape (circle|square|diamond|ellipse|marker or whatever else is defined in canvas.js)  

### Adding Data

__Exposed functions & objects__  
* `Celestial.add({file:string, type:dso|line, callback:function, redraw:function)`  
   Function to add data in json-format (dso) or directly (line) to the display  
   _file_: complete url/path to json data file (type:dso)  
   _type_: type of data being added  
   _callback_: callback function to call when json is loaded (dso)  
               or to directly add elements to the path (line)  
   _redraw_: for interactive display, call when view changes (optional)  

* `Celestial.getData(geojson, transform)`  
   Function to convert geojson coordinates to transformation  
   (equatorial, ecliptic, galactic, supergalactic)  
   Returns geojson-object with transformed coordinates  
   
* `Celestial.getPoint(coordinates, transform)`  
   Function to convert single coordinate to transformation  
   (equatorial, ecliptic, galactic, supergalactic)  
   Returns transformed coordinates  
   
* `Celestial.container`  
   The object to add data to in the callback. See D3.js documentation  

* `Celestial.context` 
   The HTML5-canvas context object to draw on in the callback. Also see D3.js documentation  
  
* `Celestial.map`  
   The d3.geo.path object to apply projection to data. Also see D3.js documentation  
  
* `Celestial.mapProjection`  
   The projection object for access to its properties and functions. Also D3.js documentation  

* `Celestial.clip(coordinates)`  
   Function to check if the object is visible, and set its visiblility  
   _coordinates_: object coordinates in radians, normally supplied by D3 as geometry.coordinates array  

* `Celestial.setStyle(<style object>)`  
* `Celestial.setTextStyle(<style object>)`  
   Set the canvas styles as documented above under __style settings__. Seperate functions for graphic/text  
   _&lt;style object>_: object literal listing all styles to set  

* `Celestial.Canvas.symbol()`  
   Draw symbol shapes directly on canvas context: circle, square, diamond, triangle, ellipse, marker,  
   stroke-circle, cross-circle
   
### Manipulating the Map

__Exposed functions__  

* `Celestial.rotate({center:[long,lat,orient]})` 
   Turn the map to the given center coordinates, without parameter returns the current center

* `Celestial.zoomBy(factor)` 
   Zoom the map by the given factor - &lt; 1 zooms out, > 1 zooms in, without parameter returns the 
   current zoom level

* `Celestial.apply(config)` 
   Apply configuration changes without reloading the complete map. Any parameter of the above 
   config-object can be set except width, projection, transform, and \*.data, which need a reload
   and interactive, form, controls, container, which control page structure & behaviour and shouls
   only be set on the initial load
   
* `Celestial.resize({width:px|0|null})` 
   Change the overall size of the map, canvas object needs a complete reload
   Optional width: new size in pixels, null or 0 = full parent width

* `Celestial.redraw({transform:equatorial|ecliptic|galactic|supergalactic})`
  Load all the data and redraw the whole map. 
  Optional transform: change the coordinate space transformation

* `Celestial.reproject({projection:<see above>})`
  Change the map projection. 
  projection: new projection to set

### Animations  

__Exposed functions__  

* `Celestial.animate(anims, dorepeat)`  
  Set the anmation sequence and start it.  
  _anims_: sequence data (see below)  
  _dorepeat_: repeat sequence in endless loop  
  
* `Celestial.stop(wipe)`  
  Stop the animation after the current step finishes.  
  _wipe_: if true, delete the list of animation steps as well  

* `Celestial.go(index)`  
  Continue the animation, if animation steps set.  
  _index_: if given, continue at step #index in the anims arrray,  
  if not, continue where the animation was stopped  

  
__Animation sequence format:__  
 [  
 {_param_: Animated parameter projection|center|zoom  
   _value_: Adequate value for each parameter  
   _duration_: in milliseconds, 0 = exact length of transition  
   _callback_: optional callback function called at the end of the transition   
 }, ...]   
  
### Files

__GeoJSON data files__  
(See format specification in readme.md for the [data folder](./data/))  

* `stars.6.json` Stars down to 6th magnitude \[1\]
* `stars.8.json` Stars down to 8.5th magnitude \[1\]
* `dsos.6.json` Deep space objects down to 6th magnitude \[2\]
* `dsos.14.json` Deep space objects down to 14th magnitude \[2\]
* `dsos.bright.json` Some of the brightest showpiece DSOs of my own choosing
* `messier.json` Messier objects \[8\]
* `lg.json` Local group and Milky Way halo galaxies/globiular clusters. My own compilation \[6\]
* `constellations.json` Constellation data  \[3\] 
* `constellations.bounds.json` Constellation boundaries \[4\]
* `constellations.lines.json` Constellation lines \[3\]
* `asterisms.json` Asterism data  \[7\]
* `mw.json` Milky Way outlines in 5 brightness steps \[5\]
* `templ.json` GeoJSON templates for all the different object types used
  
__Sources__

* \[1\] XHIP: An Extended Hipparcos Compilation; Anderson E., Francis C. (2012) [VizieR V/137D](http://cdsarc.u-strasbg.fr/viz-bin/Cat?V/137D)  
    _Star names & designations:_  
    HD-DM-GC-HR-HIP-Bayer-Flamsteed Cross Index (Kostjuk, 2002) [VizieR IV/27A](http://cdsarc.u-strasbg.fr/viz-bin/Cat?IV/27A)  
 FK5-SAO-HD-Common Name Cross Index (Smith 1996) [VizieR IV/22](http://cdsarc.u-strasbg.fr/viz-bin/Cat?IV/22)  
 General Catalogue of Variable Stars (Samus et.al. 2007-2013) [VizieR B/gcvs](http://cdsarc.u-strasbg.fr/viz-bin/Cat?B/gcvs)  
 Preliminary Version of the Third Catalogue of Nearby Stars (Gliese+ 1991) [VizieR V/70A](http://cdsarc.u-strasbg.fr/viz-bin/Cat?V/70A)  
* \[2\] [Saguaro Astronomy Club Database version 8.1](http://www.saguaroastro.org/content/downloads.htm)  
* \[3\] [IAU Constellation page](http://www.iau.org/public/themes/constellations/), name positions and some line modifications by me  
* \[4\] Catalogue of Constellation Boundary Data; Davenhall A.C., Leggett S.K. (1989) [VizieR VI/49](http://vizier.cfa.harvard.edu/viz-bin/Cat?VI/49)  
* \[5\] [Milky Way Outline Catalog](http://www.skymap.com/milkyway_cat.htm), Jose R. Vieira  
* \[6\] Lots of sources, see [blog](http://armchairastronautics.blogspot.com/p/milky-way-halo.html) [pages](http://armchairastronautics.blogspot.com/p/local-group.html) for complete list  
* \[7\] [Saguaro Astronomy Club Asterisms](http://www.saguaroastro.org/content/downloads.htm) \(scroll down\)  
* \[8\] [Messier Objects with Data](http://messier.seds.org/data.html), H.Frommert/seds.org  
All data converted to GeoJSON at J2000 epoch, positions converted from 0...24h right ascension to -180...180 degrees longitude as per GeoJSON requirements, 0...12h -> 0...180º; 12...24h -> -180...0º

__Other files__

* `celestial.js` main javascript object
* `celestial.min.js`  minified javascript
* `celestial.tar.gz`  data, minified script and viewer, all you need for local display 
* `LICENSE`
* `readme.md` this file
* `style.css` stylesheet
* `demo/map.html` simple map with editable configuration
* `demo/viewer.html` interactive map viewer/demo
* `demo/location.html` map with location/time setting
* `demo/wallmap.html` wall map for print
* `demo/sky.html` just the stars
* `lib/d3.*.js`  necessary d3 libraries
* `src/*.js` source code for all modules

Thanks to Mike Bostock and Jason Davies for [D3.js](http://d3js.org/) and [d3.geo.projections](https://github.com/d3/d3-geo-projection).
And also thanks to Jason Davies for [d3.geo.zoom](http://www.jasondavies.com/maps/rotate/), which saved me some major headaches in figuring out how to rotate/zoom the map.

Released under [BSD License](LICENSE)