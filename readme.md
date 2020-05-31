# Celestial map with D3.js

Interactive, adaptable celestial map done with the [D3.js](http://d3js.org/) visualization library. So, GeoJSON for sky stuff. Which surprisingly nobody has done yet, it seems.  

Features display of stars and deep sky objects (DSOs) with a selectable magnitude limit up to 6, or choose different GeoJSON data source for higher magnitudes. Also shows constellations with names, lines and/or boundaries, the Milky Way band and grid lines. Alternate coordinate spaces e.g. ecliptc, galactic or supergalactic are also possible. Full support for zoom and rotation with mouse or gestures.

Since it uses D3.js and HTML5 canvas, it needs a modern browser with canvas support, so any recent flavor of Chrome/Firefox/Safari/Opera or IE 9 and above should suffice. Check out the demo at <a href="http://armchairastronautics.blogspot.com/p/skymap.html">armchairastronautics.blogspot.com</a> or clone/download it for local usage, which works with Chrome if it is started with command line parameter  `--allow-file-access-from-files` to load local json files. Or use a local web server environment, quite easy to do with node.js.

__Demos__:  
[Simple map](https://ofrohn.github.io/celestial-demo/map.html) with editable configuration  
[Interactive form](https://ofrohn.github.io/celestial-demo/viewer.html) map viewer with all config options  
[Wall map](https://ofrohn.github.io/celestial-demo/wallmap.html) for printing  
[Setting time/location](https://ofrohn.github.io/celestial-demo/location.html) and see the current sky  
[Animated planets](https://ofrohn.github.io/celestial-demo/planets-animation.html) moving about the ecliptic  
[Starry sky](https://ofrohn.github.io/celestial-demo/sky.html) just the stars  
[Alternative Stars](https://ofrohn.github.io/celestial-demo/altstars.html) different way to display stars  
[Summer triangle](https://ofrohn.github.io/celestial-demo/triangle.html) adding data  
[Supernova remnants](https://ofrohn.github.io/celestial-demo/snr.html) adding point data  
[Traditional Chinese constellation](https://ofrohn.github.io/celestial-demo/chinese.html) a different culture altogether    
\([Source files on github](./demo/)\)  

__Some more examples__:  
[Embedded interactive form](https://armchairastronautics.blogspot.com/p/skymap.html)  
[Spinning sky globe](https://armchairastronautics.blogspot.com/2016/04/interactive-skymap-version-05.html)  
[The Milky Way halo, globular clusters & satellite galaxies](https://armchairastronautics.blogspot.com/p/milky-way-halo.html)  
[The Local Group of galaxies](https://armchairastronautics.blogspot.com/p/local-group.html)  
[Asterisms with locations & time selection](https://armchairastronautics.blogspot.com/p/asterisms.html)  
[Asterisms with zoom & pan](https://armchairastronautics.blogspot.com/2016/05/asterisms-interactive-and-with.html)  
[Zoom & pan animations](https://armchairastronautics.blogspot.com/2016/06/and-here-is-d3-celestial-057-with.html)  
[A different kind of Messier marathon](https://armchairastronautics.blogspot.com/2016/07/a-different-kind-of-messier-marathon.html)  
[Show coordinates, DSO colors, Download button](https://armchairastronautics.blogspot.com/2019/08/d3-celestial-showboating_25.html)  
[Geolocator gadget part I: Geolocator globe](https://armchairastronautics.blogspot.com/2019/11/d3-celestial-geolocator.html) - [Part II: Daylight sky](https://armchairastronautics.blogspot.com/2019/12/d3-celestial-sky-color.html) - [Part III: Geomarker](https://armchairastronautics.blogspot.com/2019/12/d3-celestial-geomarker.html) - [Part IV: Night sky](http://armchairastronautics.blogspot.com/2020/01/d3-celestial-gelolocator-night-sky.html)


### Usage

* On your HTML add a div with some id, e.g.: `<div id="celestial-map"></div>`.

* Optionally add a div with the id "celestial-form" if you are going to use some of the built-in forms: `<div id="celestial-form"></div>`.

* Include the d3-celestial script, available as `celestial.js` or `celestial.min.js`.

* Include the necessary d3 scripts: `d3.min.js` and `d3.geo.projection.min.js`. Available on the `lib` subfolder in this repository or from the official d3.js server `http://d3js.org/`.

* On your script display the map with `Celestial.display(config)`. Remember to indicate the id of the div where the map will be shown. Check and edit the following default configuration file.

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
  geopos: null,       // optional initial geographic position [lat,lon] in degrees, 
                      // overrides center
  follow: "zenith",   // on which coordinates to center the map, default: zenith, if location enabled, 
                      // otherwise center
  zoomlevel: null,    // initial zoom level 0...zoomextend; 0|null = default, 1 = 100%, 0 < x <= zoomextend
  zoomextend: 10,     // maximum zoom level
  adaptable: true,    // Sizes are increased with higher zoom-levels
  interactive: true,  // Enable zooming and rotation with mousewheel and dragging
  form: true,         // Display form for interactive settings. Needs a div with
                      // id="celestial-form", created automatically if not present
  location: false,    // Display location settings. Deprecated, use formFields below
  formFields: {"location": true,  // Set visiblity for each group of fields with the respective id
               "general": true,  
               "stars": true,  
               "dsos": true,  
               "constellations": true,  
               "lines": true,  
               "other": true,  
               "download": false},  
  advanced: true,     // Display fewer form fields if false 
  daterange: [],      // Calender date range; null: displaydate-+10; [n<100]: displaydate-+n; [yr]: yr-+10; 
                      // [yr, n<100]: [yr-n, yr+n]; [yr0, yr1]  
  controls: true,     // Display zoom controls
  lang: "",           // Global language override for names, any name setting that has the chosen language available
                      // Default: desig or empty string for designations, other languages as used anywhere else
  culture: "",        // Source of constellations and star names, default "iau", other: "cn" Traditional Chinese
  container: "map",   // ID of parent element, e.g. div, null = html-body
  datapath: "data/",  // Path/URL to data files, empty = subfolder 'data'
  stars: {
    show: true,    // Show stars
    limit: 6,      // Show only stars brighter than limit magnitude
    colors: true,  // Show stars in spectral colors, if not use default color
    style: { fill: "#ffffff", opacity: 1 }, // Default style for stars
    designation: true, // Show star names (Bayer, Flamsteed, Variable star, Gliese or designation, 
                       // i.e. whichever of the previous applies first); may vary with culture setting
    designationType: "desig",  // Which kind of name is displayed as designation (fieldname in starnames.json)
    designationStyle: { fill: "#ddddbb", font: "11px 'Palatino Linotype', Georgia, Times, 'Times Roman', serif", align: "left", baseline: "top" },
    designationLimit: 2.5,  // Show only names for stars brighter than nameLimit
    propername: false,   // Show proper name (if present)
    propernameType: "name", // Languge for proper name, default IAU name; may vary with culture setting 
                            // (see list below of languages codes available for stars)
    propernameStyle: { fill: "#ddddbb", font: "13px 'Palatino Linotype', Georgia, Times, 'Times Roman', serif", align: "right", baseline: "bottom" },
    propernameLimit: 1.5,  // Show proper names for stars brighter than propernameLimit
    size: 7,       // Maximum size (radius) of star circle in pixels
    exponent: -0.28, // Scale exponent for star size, larger = more linear
    data: 'stars.6.json' // Data source for stellar data, 
                         // number indicates limit magnitude
  },
  dsos: {
    show: true,    // Show Deep Space Objects 
    limit: 6,      // Show only DSOs brighter than limit magnitude
    colors: true,  // // Show DSOs in symbol colors if true, use style setting below if false
    style: { fill: "#cccccc", stroke: "#cccccc", width: 2, opacity: 1 }, // Default style for dsos
    names: true,   // Show DSO names
    namesType: "name",  // Type of DSO ('desig' or language) name shown
                        // (see list below for languages codes available for dsos)
    nameStyle: { fill: "#cccccc", font: "11px Helvetica, Arial, serif", 
                 align: "left", baseline: "top" }, // Style for DSO names
    nameLimit: 6,  // Show only names for DSOs brighter than namelimit
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
  planets: {  //Show planet locations, if date-time is set
    show: false,
    // List of all objects to show
    which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"],
    // Font styles for planetary symbols
    symbols: {  // Character and color for each symbol in 'which', simple circle \u25cf
      "sol": {symbol: "\u2609", letter:"Su", fill: "#ffff00"},
      "mer": {symbol: "\u263f", letter:"Me", fill: "#cccccc"},
      "ven": {symbol: "\u2640", letter:"V", fill: "#eeeecc"},
      "ter": {symbol: "\u2295", letter:"T", fill: "#00ccff"},
      "lun": {symbol: "\u25cf", letter:"L", fill: "#ffffff"}, // overridden by generated crecent, except letter
      "mar": {symbol: "\u2642", letter:"Ma", fill: "#ff6600"},
      "cer": {symbol: "\u26b3", letter:"C", fill: "#cccccc"},
      "ves": {symbol: "\u26b6", letter:"Ma", fill: "#cccccc"},
      "jup": {symbol: "\u2643", letter:"J", fill: "#ffaa33"},
      "sat": {symbol: "\u2644", letter:"Sa", fill: "#ffdd66"},
      "ura": {symbol: "\u2645", letter:"U", fill: "#66ccff"},
      "nep": {symbol: "\u2646", letter:"N", fill: "#6666ff"},
      "plu": {symbol: "\u2647", letter:"P", fill: "#aaaaaa"},
      "eri": {symbol: "\u26aa", letter:"E", fill: "#eeeeee"}
    },
    symbolStyle: { fill: "#00ccff", font: "bold 17px 'Lucida Sans Unicode', Consolas, sans-serif", 
             align: "center", baseline: "middle" },
    symbolType: "symbol",  // Type of planet symbol: 'symbol' graphic planet sign, 'disk' filled circle scaled by magnitude
                           // 'letter': 1 or 2 letters S Me V L Ma J S U N     
    names: false,          // Show name in nameType language next to symbol
    nameStyle: { fill: "#00ccff", font: "14px 'Lucida Sans Unicode', Consolas, sans-serif", align: "right", baseline: "top" },
    namesType: "desig"     // Language of planet name (see list below of language codes available for planets), 
                           // or desig = 3-letter designation
  },
  constellations: {
    names: true,      // Show constellation names 
    namesType: "iau", // Type of name Latin (iau, default), 3 letter designation (desig) or other language (see list below)
    nameStyle: { fill:"#cccc99", align: "center", baseline: "middle", 
                 font: ["14px Helvetica, Arial, sans-serif",  // Style for constellations
                        "12px Helvetica, Arial, sans-serif",  // Different fonts for diff.
                        "11px Helvetica, Arial, sans-serif"]},// ranked constellations
    lines: true,   // Show constellation lines, style below
    lineStyle: { stroke: "#cccccc", width: 1, opacity: 0.6 }, 
    bounds: false, // Show constellation boundaries, style below
    boundStyle: { stroke: "#cccc00", width: 0.5, opacity: 0.8, dash: [2, 4] }
  },  
  mw: {
    show: true,     // Show Milky Way as filled multi-polygon outlines 
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
    stroke: "#cccccc", // Line
    width: 1.0, 
    fill: "#000000",   // Area below horizon
    opacity: 0.5
  },  
  daylight: {  //Show day sky as a gradient, if location is set and map projection is hemispheric
    show: false
  }
};

// Display map with the configuration above or any subset thereof
Celestial.display(config);
```

__Supported projections:__ Airy, Aitoff, Armadillo, August, Azimuthal Equal Area, Azimuthal Equidistant, Baker, Berghaus, Boggs, Bonne, Bromley, Cassini, Collignon, Craig, Craster, Cylindrical Equal Area, Cylindrical Stereographic, Eckert 1, Eckert 2, Eckert 3, Eckert 4, Eckert 5, Eckert 6, Eisenlohr, Equirectangular, Fahey, Foucaut, Ginzburg 4, Ginzburg 5, Ginzburg 6, Ginzburg 8, Ginzburg 9, Hammer, Hatano, HEALPix, Hill, Homolosine, Kavrayskiy 7, Lagrange, l'Arrivee, Laskowski, Loximuthal, Mercator, Miller, Mollweide, Flat Polar Parabolic, Flat Polar Quartic, Flat Polar Sinusoidal, Natural Earth, Nell Hammer, Orthographic, Patterson, Polyconic, Rectangular Polyconic, Robinson, Sinusoidal, Stereographic, Times, 2 Point Equidistant, van der Grinten, van der Grinten 2, van der Grinten 3, van der Grinten 4, Wagner 4, Wagner 6, Wagner 7, Wiechel and Winkel Tripel. Most of these need the extension [d3.geo.projections](https://github.com/d3/d3-geo-projection/)  

__Supported languages for constellation, star and planet name display:__  (name) Official IAU name, (desig) 3-Letter-Designation, (la) Latin, (en) English, (ar) Arabic,  (zh) Chinese, (cz) Czech, (ee) Estonian, (fi) Finnish, (fr) French, (de) German, (el) Greek, (he) Hebrew, (it) Italian, (ja) Japanese, (ko) Korean, (hi) Hindi, (fa) Persian, (ru) Russian, (es) Spanish, (tr) Turkish  


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
`symbol`: unicode charcter to represent solar system object.

### Getting Info

__Exposed functions & objects__ 
* `Celestial.metrics()`  
   Return object literal with current map dimensions in pixels
   {width, height, margin, scale}

### Adding Data

__Exposed functions & objects__  
* `Celestial.add({file:string, type:json|raw, callback:function, redraw:function, save: function)`  
   Add data in json-format (json) or directly (raw) to the display  
   The redraw function is added to the internal call stack of the main display routine  
   _file_: complete url/path to json data file (type:json)  
   _type_: type of data being added  
   _callback_: callback function to call when json is loaded (json)  
               or to directly add elements to the path (raw)  
   _redraw_: for interactive display, callback when view changes (optional)  
   _save_:   for display svg-style, callback when saving as svg (optional)  

* `Celestial.clear()`  
   Deletes all previously added functions from the display call stack  
   
* `Celestial.getData(geojson, transform)`  
   Function to convert geojson coordinates to transformation  
   (equatorial, ecliptic, galactic, supergalactic)  
   Returns geojson-object with transformed coordinates  
   
* `Celestial.getPoint(coordinates, transform)`  
   Function to convert a single coordinate to transformation  
   (equatorial, ecliptic, galactic, supergalactic)  
   Returns transformed coordinates  

* `Celestial.getPlanet(id, date)`  
   Function to get solar system object specified with id  
   (available ids in config.planets.which array)  
   Returns planet object with coordinates at specified date 
   
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


### Adding Behaviour
  
* `Celestial.addCallback(func)`  
   Add a callback function that is executed every time the map is redrawn.
   func: function that is execured in the client context 
     
### Manipulating the Map

__Exposed functions__  

* `Celestial.rotate({center:[long,lat,orient]})`  
   Turn the map to the given _center_ coordinates, without parameter returns the current center

* `Celestial.zoomBy(factor)`  
   Zoom the map by the given _factor_ - &lt; 1 zooms out, > 1 zooms in, without parameter returns the 
   current zoom level

* `Celestial.apply(config)`  
   Apply configuration changes without reloading the complete map. Any parameter of the above 
   _config_-object can be set except width, projection, transform, and \*.data, which need a reload
   and interactive, form, controls, container, which control page structure & behaviour and should
   only be set on the initial load.
   
* `Celestial.resize({width:px|0|null}|number)`  
   Change the overall size of the map, canvas object needs a complete reload
   Optional {_width_: number} or _number_: new size in pixels, or 0 = full parent width

* `Celestial.redraw()`  
   Just redraw the whole map. 

* `Celestial.reload(config)`  
   Load all the data and redraw the whole map.  
   Optional _config_: change any configuration parameter before reloading  

* `Celestial.reproject({projection:<see above>})`  
   Change the map projection.  
   _projection_: new projection to set  

* `Celestial.date(<date object>, timezone)`  
   Change the set date, return current date w/o parameter.  
   _date_: javascript date-object  
   _timezone_: offset from UTC in minutes (optional)  
  
* `Celestial.location([lat, lon])`  
   Change the current geolocation and set the time zone automatically, 
   called w/o parameter returns current location  
   _location_: [latitude, longitude] array in degrees  

* `Celestial.skyview({date:<date object>, location:[lat, lon], timezone: offset})`  
   Show the current celestial view for one specific date and/or location,  
   independent of form fields, all parameters are optional  
   if location and no time zone is given, sets time zone automatically
   called w/o parameter returns {date, location, timezone} in same format.  
   _date_: javascript date-object  
   _location_: [latitude, longitude] array in degrees  
   _timezone_: offset from UTC in minutes  

* `Celestial.showConstellation(id)`  
   Zoom in and focus on the constellaion given by id.  
   id: string with valid IAU 3-letter constellation identifier, case-insensitive  

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

### HowTo

__1. Add your own data__

First of all, whatever you add needs to be valid geoJSON. The various types of objects are described in the readme of the [data folder](./data/). This can be a separate file or a JSON object filled at runtime or defined inline. Like so:  

```js
var jsonLine = {
  "type":"FeatureCollection",
  // this is an array, add as many objects as you want
  "features":[
    {"type":"Feature",
     "id":"SummerTriangle",
     "properties": {
       // Name
       "n":"Summer Triangle",
       // Location of name text on the map
       "loc": [-67.5, 52]
     }, "geometry":{
       // the line object as an array of point coordinates, 
       // always as [ra -180..180 degrees, dec -90..90 degrees]
       "type":"MultiLineString",
       "coordinates":[[
         [-80.7653, 38.7837],
         [-62.3042, 8.8683],
         [-49.642, 45.2803],
         [-80.7653, 38.7837]
       ]]
     }
    }  
  ]
}; 
```

As you can see, this defines the Summer Triangle asterism, consisting of the bright stars Vega (Alpha Lyr), Deneb (Alpha Cyg) and Altair (Alpha Aql).  
*Note:* Since astronomical data is usually given in right ascension from 0 to 24 h and the geoJSON-format used in D3 expects positions in degrees from -180 to 180 deg, you may need this function to convert your data first:  
```js
function hour2degree(ra) { 
  return ra > 12 ? (ra - 24) * 15 : ra * 15;
}
```  

You also need to define how the triangle is going to look like with some styles (see definitions above). The parameters and values usually have the same formats as SVG- or CSS-data:  

```js
var lineStyle = { 
      stroke: "#f00", 
      fill: "rgba(255, 204, 204, 0.4)",
      width: 3 
    };
var textStyle = { 
      fill: "#f00", 
      font: "bold 15px Helvetica, Arial, sans-serif", 
      align: "center", 
      baseline: "bottom" 
    };
```

Now we can get to work, with the function

`Celestial.add({file:string, type:json|raw, callback:function, redraw:function)`

The file argument is optional for providing an external geoJSON file; since we already defined our data, we don't need it. Type is 'json' for JSON-Formatted data. That leaves two function definitions, the first one gets called on loading, this is where we add our data to the d3-celestial data container, and redraw is called on every redraw event for the map, this is where you define how to display the added object(s).  

```js
callback: function(error, json) {
  if (error) return console.warn(error);
  // Load the geoJSON file and transform to correct coordinate system, if necessary
  var asterism = Celestial.getData(jsonLine, config.transform);

  // Add to celestial objects container in d3
  Celestial.container.selectAll(".asterisms")
    .data(asterism.features)
    .enter().append("path")
    .attr("class", "ast"); 
  // Trigger redraw to display changes
  Celestial.redraw();
}
```

The callback funtion is pretty straight forward: Load the data with Celestial.getData, add to Celestial.container in the usual d3 manner, and redraw. It also provides a json parameter that contains the parsed JSON if a file property is given, but we already have defined jsonLine above, so we use that.

```js
redraw: function() {   
  // Select the added objects by class name as given previously
  Celestial.container.selectAll(".ast").each(function(d) {
    // Set line styles 
    Celestial.setStyle(lineStyle);
    // Project objects on map
    Celestial.map(d);
    // draw on canvas
    Celestial.context.fill();
    Celestial.context.stroke();
    
    // If point is visible (this doesn't work automatically for points)
    if (Celestial.clip(d.properties.loc)) {
      // get point coordinates
      pt = Celestial.mapProjection(d.properties.loc);
      // Set text styles       
      Celestial.setTextStyle(textStyle);
      // and draw text on canvas
      Celestial.context.fillText(d.properties.n, pt[0], pt[1]);
    }      
  })
}
```

And the redraw function with the actual display of the elements, contained in a d3.selectAll call on the previously set class property of the added objects. Celestial.setStyle applies the predefined canvas styles, Celestial.map projects each line on the map. However, that doesn't work for points, so that is done manually with Celestial.clip (true if point is currently visible) and Celestial.mapProjection. and the rest are standard canvas fill and stroke operations. The beginPath and closePath commands are done automatically.

```js
Celestial.display();
```

Finally, the whole map is displayed. The complete sample code is in the file [triangle.html](demo/triangle.html) in the demo folder

__2. Add point sources__

First we have to define the objects as valid geoJSON data again, as described in the readme of the [data folder](./data/). Since we're dealing with point sources, the definition is quite simple, the geometry only needs single points. If distinct point sizes are desired, a size criterion in the properties section is required, like the magnitude or extension of each object, and also a name if you want to label the objects on the map. This example uses supernova remnants filtered from the main deep space objects data file that comes with d3-celestial, but you can define your own data as below:
    
```js
var jsonSN = {
  "type":"FeatureCollection",
  // this is an array, add as many objects as you want
  "features":[
    {"type":"Feature",
     "id":"SomeDesignator",
     "properties": {
       // Name
       "name":"Some Name",
       // magnitude, dimension in arcseconds or any other size criterion
       "mag": 10,
       "dim": 30
     }, "geometry":{
       // the location of the object as a [ra, dec] array in degrees [-180..180, -90..90]
       "type":"Point",
       "coordinates": [-80.7653, 38.7837]
     }
    }  
  ]};
```

Next we define the appearance of the objects and labels as they will appear on the map. The values are equivalent to CSS-formats. Fill and stroke colors are only necessary if the objects should appear solid (fill) or as an outline (stroke), or an outline with a semitransparent filling as below. Width gives the line width for outlines.  

```js
var pointStyle = { 
      stroke: "#f0f", 
      width: 3,
      fill: "rgba(255, 204, 255, 0.4)"
    };
var textStyle = { 
      fill:"#f0f", 
      font: "bold 15px Helvetica, Arial, sans-serif", 
      align: "left", 
      baseline: "bottom" 
    };
```

Now we are ready to add the functions that do the real work of putting the data on the map.

```js
Celestial.add({file:string, type:json|raw, callback:function, redraw:function)
```

The file argument is optional for providing an external geoJSON file; since we already defined our data, we don't need it. Type is 'line', that leaves two function definitions: the first one is called at loading, this is where we add our data to the d3-celestial data container, while the second function 'redraw' is called at every redraw event for the map. So here you need to define how to display the added object(s). Here are two different possibilities to add data to the D3 data container. Either add the data defined as a JSON-Object in-page, as below with the jsonSN object we defined before. 

```js
callback: function(error, json) {
  if (error) return console.warn(error);
  // Load the geoJSON file and transform to correct coordinate system, if necessary
  var dsn = Celestial.getData(jsonSN, config.transform);

  // Add to celestial objects container in d3
  Celestial.container.selectAll(".snrs")
    .data(asterism.features)
    .enter().append("path")
    .attr("class", "snr"); 
  // Trigger redraw to display changes
  Celestial.redraw();
}
```

Or add data from an external file with optional filtering, as shown below. In this case the file parameter of the Celsestial.add() function needs to give a valid url to the data file, while the filter function returns true for every object that meets the intended criteria.  

```js
callback: function(error, json) {
  if (error) return console.warn(error);
  // Load the geoJSON file and transform to correct coordinate system, if necessary
  var dsos = Celestial.getData(json, config.transform);

  // Filter SNRs and add to celestial objects container in d3
  Celestial.container.selectAll(".snrs")
    .data(dsos.features.filter(function(d) {
      return d.properties.type === 'snr'
    }))
    .enter().append("path")
    .attr("class", "snr"); 
  // Trigger redraw to display changes
  Celestial.redraw();
}
```

However you add the data, as long as they receive the same class name - 'snr' in the examples above - the display method is the same, as shown below. With point data we can't rely on the map function to do all the work, we need to paint on the canvas step by step. First, check if the point is currently displayed (clip), then get the location (mapProjection), size (whatever scaling formula you like) and styling.  
  
Now we are ready to throw pixels at the canvas: set the styles (fill color, stroke color & width), followed by whatever canvas commands are required to draw the object shape, here a filled circle outline. And then the same for the adjacent object name offset by the previously calculated radius.  

```js
redraw: function() {
  // Select the added objects by class name as given previously
  Celestial.container.selectAll(".snr").each(function(d) {
    // If point is visible (this doesn't work automatically for points)
    if (Celestial.clip(d.geometry.coordinates)) {
      // get point coordinates
      var pt = Celestial.mapProjection(d.geometry.coordinates);
      // object radius in pixel, could be varable depending on e.g. dimension or magnitude 
      var r = Math.pow(20 - prop.mag, 0.7); // replace 20 with dimmest magnitude in the data
   
      // draw on canvas
      //  Set object styles fill color, line color & width etc.
      Celestial.setStyle(pointStyle);
      // Start the drawing path
      Celestial.context.beginPath();
      // Thats a circle in html5 canvas
      Celestial.context.arc(pt[0], pt[1], r, 0, 2 * Math.PI);
      // Finish the drawing path
      Celestial.context.closePath();
      // Draw a line along the path with the prevoiusly set stroke color and line width      
      Celestial.context.stroke();
      // Fill the object path with the prevoiusly set fill color
      Celestial.context.fill();     

      // Set text styles       
      Celestial.setTextStyle(textStyle);
      // and draw text on canvas
      Celestial.context.fillText(d.properties.name, pt[0] + r - 1, pt[1] - r + 1);
    }      
  }); 
}});
```

Finally, the whole map can be displayed.   

```js
Celestial.display();
```
 

__Bonus: Avoid overlapping labels__  

You will note that there is a lot of overlap between distinct labels. Fortunately, d3 already has a solution for this: d3.geom.quadtree, which builds a hiearchical data structure ordered by proximity.
First we set the closest allowed distance between two labels in pixels, get the map dimensions from Celestial.metrics, and create a quadtree object with the extent of those dimensions.

```js
var PROXIMITY_LIMIT = 20,
    m = Celestial.metrics(), 
    quadtree = d3.geom.quadtree().extent([[-1, -1], [m.width + 1, m. height + 1]])([]);
```

After proceeding as above - get the projected map position in pixelspace (pt) and draw the snr symbol - we use the quadtree.find() function to find the nearest neighbor relative to this position, and if it is more distant than our limit above, add it to quadtree and draw the label, otherwise don't.

```js
var nearest = quadtree.find(pt);

if (!nearest || distance(nearest, pt) > PROXIMITY_LIMIT) { 
  quadtree.add(pt)
  // draw the label as above
}
```

This will only draw non-overlapping labels and scales with zoom-level, since it checks in pixel-space and not in coordinate-space.  
  
Now we need just one more thing, the distance function used above, which is the standard Pythagorean square root of the sum of the differences squared function.  


```js
// Simple point distance function
function distance(p1, p2) {
  var d1 = p2[0] - p1[0],
      d2 = p2[1] - p1[1];
  return Math.sqrt(d1 * d1 + d2 * d2);
}
```
  
The complete sample code is in the file [snr.html](demo/snr.html) in the demo folder.  

### Files

__GeoJSON data files__  
(See format specification in the readme for the [data folder](./data/))  

* `stars.6.json` Stars down to 6th magnitude \[1\]
* `stars.8.json` Stars down to 8.5th magnitude \[1\]
* `stars.14.json` Stars down to 14th magnitude (large) \[1\]
* `starnames.json` Star names and designations \[1b\]\[1c\]
* `dsos.6.json` Deep space objects down to 6th magnitude \[2\]
* `dsos.14.json` Deep space objects down to 14th magnitude \[2\]
* `dsos.20.json` Deep space objects down to 20th magnitude \[2\]
* `dsos.bright.json` Some of the brightest showpiece DSOs of my own choosing
* `messier.json` Messier objects \[8\]
* `lg.json` Local group and Milky Way halo galaxies/globiular clusters. My own compilation \[6\]
* `constellations.json` Constellation data  \[3\] 
* `constellations.bounds.json` Constellation boundaries \[4\]
* `constellations.lines.json` Constellation lines \[3\]
* `asterisms.json` Asterism data  \[7\]
* `mw.json` Milky Way outlines in 5 brightness steps \[5\]
* `planets.json` Keplerian Elements for Approximate Positions of the Major Planets \[9\]  
__Traditional Chinese Constellations & Stars__ 
* `constellations.cn.json` Constellation data  \[10\] 
* `constellations.bounds.cn.json` Constellation boundaries \[10\]
* `constellations.lines.cn.json` Constellation lines \[10\]
* `starnames.cn.json` Star names and designations \[10\]

__Sources__

* \[1\] XHIP: An Extended Hipparcos Compilation; Anderson E., Francis C. (2012) [VizieR V/137D](http://cdsarc.u-strasbg.fr/viz-bin/Cat?V/137D)  
* \[1b\] _Star names & designations:_  
    HD-DM-GC-HR-HIP-Bayer-Flamsteed Cross Index (Kostjuk, 2002) [VizieR IV/27A](http://cdsarc.u-strasbg.fr/viz-bin/Cat?IV/27A)  
 FK5-SAO-HD-Common Name Cross Index (Smith 1996) [VizieR IV/22](http://cdsarc.u-strasbg.fr/viz-bin/Cat?IV/22)  
 General Catalogue of Variable Stars (Samus et.al. 2007-2013) [VizieR B/gcvs](http://cdsarc.u-strasbg.fr/viz-bin/Cat?B/gcvs)  
 Preliminary Version of the Third Catalogue of Nearby Stars (Gliese+ 1991) [VizieR V/70A](http://cdsarc.u-strasbg.fr/viz-bin/Cat?V/70A)  
* \[1c\] [Stellarium skycultures data](https://github.com/Stellarium/stellarium/tree/master/po/stellarium-skycultures)  for star name translations  
* \[2\] [Saguaro Astronomy Club Database version 8.1](http://www.saguaroastro.org/sac-downloads/)  
* \[3\] [IAU Constellation page](http://www.iau.org/public/themes/constellations/), name positions and some line modifications by me, names in other languages from [Wikipedia](https://wiki2.org/en/88_modern_constellations_in_different_languages)  
* \[4\] Catalogue of Constellation Boundary Data; Davenhall A.C., Leggett S.K. (1989) [VizieR VI/49](http://vizier.cfa.harvard.edu/viz-bin/Cat?VI/49)  
* \[5\] [Milky Way Outline Catalog](http://www.skymap.com/milkyway_cat.htm), Jose R. Vieira  
* \[6\] Lots of sources, see [blog](http://armchairastronautics.blogspot.com/p/milky-way-halo.html) [pages](http://armchairastronautics.blogspot.com/p/local-group.html) for complete list  
* \[7\] [Saguaro Astronomy Club Asterisms](http://saguaroastro.org/sac-downloads/) \(scroll down\)  
* \[8\] [Messier Objects with Data](http://messier.seds.org/data.html), H.Frommert/seds.org  
* \[9\] [Keplerian Elements for Approximate Positions of the Major Planets](https://ssd.jpl.nasa.gov/?planet_pos)  
* \[10\] [Stellarium skycultures data](https://github.com/Stellarium/stellarium/tree/master/skycultures/chinese) for traditional Chinese constellations  
  
All data converted to GeoJSON at J2000 epoch, positions converted from 0...24h right ascension to -180...180 degrees longitude as per GeoJSON requirements, so 0...12h becomes 0...180 degrees, and 12...24h becomes -180...0 degrees.  

__Other files__

* `celestial.js` main javascript object
* `celestial.min.js`  minified javascript
* `celestial.tar.gz`  data, minified script and viewer, all you need for local display 
* `LICENSE`
* `readme.md` this file
* `celestial.css` stylesheet
* `lib/d3.*.js`  necessary d3 libraries
* `src/*.js` source code for all modules

Thanks to Mike Bostock and Jason Davies for [D3.js](http://d3js.org/) and [d3.geo.projections](https://github.com/d3/d3-geo-projection).
And also thanks to Jason Davies for [d3.geo.zoom](http://www.jasondavies.com/maps/rotate/), which saved me some major headaches in figuring out how to rotate/zoom the map.

Released under [BSD License](LICENSE)
