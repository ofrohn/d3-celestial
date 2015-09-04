# Celestial map with D3.js

Interactive, adaptable celestial map done with the [D3.js](http://d3js.org/) visualization library. So, GeoJSON for sky stuff. Which surprisingly nobody has done yet, it seems.  

Features display of stars and deep sky objects (DSOs) with a selectable magnitude limit up to 6, or choose different GeoJSON data source for higher magnitudes. Also shows constellations with names, lines and/or boundaries, the Milky Way band and grid lines. Alternate coordinate spaces e.g. ecliptc, galactic or supergalactic are also possible. Full support for zoom and rotation with mouse or gestures.

Since it uses D3 and therefore SVG, it needs a modern browser with svg support, so any recent flavor of Chrome/Firefox/Safari/Opera or IE 9 and above should suffice. Check out the demo at <a href="http://armchairastronautics.blogspot.com/p/skymap.html">armchairastronautics.blogspot.com</a> or download the tarball `celestial.tar.gz` containing everything for local usage, which works with Firefox; Chrome needs to be started with command line parameter  `--allow-file-access-from-files` to load local json files. Or use a local web server environment.

### Usage

Include the necessary scripts d3.min.js, d3.geo.projection.min.js and celestial.js from the `lib` subfolder or the first two alternatively from the official d3.js server `http://d3js.org/`, and then simply edit the default options and display the map with `Celestial.display(config)`.

```js
var config = { 
  width: 0,           // Default width, 0 = full parent element width; 
                      // height is determined by projection
  projection: "aitoff",    // Map projection used: see below
  transform: "equatorial", // Coordinate transformation: equatorial (default),
                           // ecliptic, galactic, supergalactic
  center: null,       // Initial center coordinates in equatorial transformation only
                      // [hours, degrees], null = default center
  background: "#000", // Background color or gradient  
  adaptable: true,    // Sizes are increased with higher zoom-levels
  interactive: true,  // Enable zooming and rotation with mousewheel and dragging
  container: "map",   // ID of parent element, e.g. div
  datapath: "data/",  // Path/URL to data files, empty = subfolder 'data'
  stars: {
    show: true,    // Show stars
    limit: 6,      // Show only stars brighter than limit magnitude
    colors: true,  // Show stars in spectral colors, if not use default color
    color: "#fff", // Default color for stars
    names: true,   // Show star names (css-class starname)
    proper: false, // Show proper names (if none shows designation)
    desig: true,   // Show designation (Bayer, Flamsteed, variable star, Gliese, Draper,
                   // Hipparcos, whichever applies first in the given order)
    namelimit: 2.5,  // Show only names/designations for stars brighter than namelimit
    data: 'stars.6.json' // Data source for stellar data, 
                         // number indicates limit magnitude
  },
  dsos: {
    show: true,    // Show Deep Space Objects (css-classes per object type)
    limit: 6,      // Show only DSOs brighter than limit magnitude
    names: true,   // Show DSO names
    desig: true,   // Show short DSO names
    namelimit: 6,  // Show only names for DSOs brighter than namelimit
    data: 'dsos.bright.json'  // Data source for DSOs, 
                              // opt. number indicates limit magnitude
  },
  constellations: {
    show: true,    // Show constellations 
    names: true,   // Show constellation names (css-class: constname)
    desig: true,   // Show short constellation names (3 letter designations)
    lines: true,   // Show constellation lines (css-class: constline)
    bounds: false  // Show constellation boundaries (css-class: boundaryline)
  },
  mw: {
    show: true     // Show Milky Way as filled multi-polygon outlines (css-class: mw)
  },
  lines: {
    graticule: true,   // Show graticule lines (css-class: gridline)
    equatorial: false, // Show equatorial plane (css-class: equatorial)
    ecliptic: true,    // Show ecliptic plane (css-class: ecliptic)
    galactic: false,   // Show galactic plane (css-class: galactic)
    supergalactic: false  // Show supergalactic plane (css-class: supergalactic)
  }
};

// Display map with the configuration above
Celestial.display(config);
```

__Supported projections:__ airy, aitoff, armadillo, august, azimuthalEqualArea, azimuthalEquidistant, baker, berghaus, boggs, bonne, bromley, collignon, craig, craster, cylindricalEqualArea, cylindricalStereographic, eckert1, eckert2, eckert3, eckert4, eckert5, eckert6, eisenlohr, equirectangular, fahey, foucaut, ginzburg4, ginzburg5, ginzburg6, ginzburg8, ginzburg9, gringorten, hammer, hatano, healpix, hill, homolosine, kavrayskiy7, lagrange, larrivee, laskowski, loximuthal, mercator, miller, mollweide, mtFlatPolarParabolic, mtFlatPolarQuartic, mtFlatPolarSinusoidal, naturalEarth, nellHammer, orthographic, patterson, polyconic, rectangularPolyconic, robinson, sinusoidal, stereographic, times, twoPointEquidistant, vanDerGrinten, vanDerGrinten2, vanDerGrinten3, vanDerGrinten4, wagner4, wagner6, wagner7, wiechel, winkel3  
most of these need the extension [d3.geo.projections](https://github.com/d3/d3-geo-projection/)  


### Adding Data

__Exposed functions & objects__  
* `Celestial.add({file:string, type:dso|line, callback:function, redraw:function)`  
   Function to add data in json-format (dso) or directly (line) to the display
   _file_: complete url/path to json data file (type:dso)
   _type_: type of data being added
   _callback_: callback function to call when json is loaded (dso)
               or to directly add elements to the path (line)
   _redraw_: for interactive display, call when view changes (optional) 
  
* `Celestial.svg`  
   The svg object to add data to in the callback. See D3.js documentation 

* `Celestial.map` 
   The svg path object to add svg-objects to in the callback. Also see D3.js documentation 
  
* `Celestial.mapProjection`  
   The projection object for access to its properties and functions. Also D3.js documentation

* `Celestial.point(coordinates)`  
  `Celestial.clip(coordinates)`  
  `Celestial.opacity(coordinates)`  
   Functions to transform coordinates and check if the object is visible, and set its visiblility  
   _coordinates_: object coordinates in radians, normally supplied by D3 as geometry.coordinates array
   
### Files

__GeoJSON data files__

* `stars.6.json` Stars down to 6th magnitude \[1\]
* `stars.8.json` Stars down to 8.5th magnitude \[1\]
  
* `dsos.6.json` Deep space objects down to 6th magnitude \[2\]
* `dsos.14.json` Deep space objects down to 14th magnitude \[2\]
* `dsos.bright.json` Some of the brightest showpiece DSOs of my own choosing
* `lg.json` Local group and Milky Way halo galaxies/globiular clusters. My own compilation \[6\]
  
* `constellations.json` Constellation data  \[3\]
* `constellations.bounds.json` Constellation boundaries \[4\]
* `constellations.lines.json` Constellation lines \[3\]
  
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
* \[4\] Catalogue of Constellation Boundary Data; Davenhall A.C., Leggett S.K. (1989) [VizieR VI/49/](http://vizier.cfa.harvard.edu/viz-bin/Cat?VI/49)  
* \[5\] [Milky Way Outline Catalog](http://www.skymap.com/milkyway_cat.htm), Jose R. Vieira  
* \[6\] Lots of sources, see [blog](http://armchairastronautics.blogspot.com/p/milky-way-halo.html) [pages](http://armchairastronautics.blogspot.com/p/local-group.html) for complete list

All data converted to GeoJSON at J2000 epoch, positions converted from 0...24h right ascension to -180...180 degrees longitude as per GeoJSON requirements, 0...12h -> 0...180º; 12...24h -> -180...0º

__Other files__

* `celestial.js` main javascript object
* `celestial.min.js`  minified javascript
* `celestial.tar.gz`  data, minified script and viewer, all you need for local display 
* `LICENSE`
* `readme.md` this file
* `style.css` stylesheet
* `map.html` simple map viewer with editable configuration
* `viewer.html` interactive map viewer/demo
* `lib/d3.*.js`  necessary d3 libraries
* `src/*.js` source code for all modules

Thanks to Mike Bostock and Jason Davies for [D3.js](http://d3js.org/) and [d3.geo.projections](https://github.com/d3/d3-geo-projection).
And also thanks to Jason Davies for [d3.geo.zoom](http://www.jasondavies.com/maps/rotate/), which saved me some major headaches in figuring out how to rotate/zoom the map.

Released under [BSD License](LICENSE)