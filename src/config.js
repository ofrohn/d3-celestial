/* global d3, Celestial */
//Defaults
var settings = { 
  width: 0,     // Default width; height is determined by projection
  projection: "aitoff",  // Map projection used: airy, aitoff, armadillo, august, azimuthalEqualArea, azimuthalEquidistant, baker, berghaus, boggs, bonne, bromley, collignon, craig, craster, cylindricalEqualArea, cylindricalStereographic, eckert1, eckert2, eckert3, eckert4, eckert5, eckert6, eisenlohr, equirectangular, fahey, foucaut, ginzburg4, ginzburg5, ginzburg6, ginzburg8, ginzburg9, gringorten, hammer, hatano, healpix, hill, homolosine, kavrayskiy7, lagrange, larrivee, laskowski, loximuthal, mercator, miller, mollweide, mtFlatPolarParabolic, mtFlatPolarQuartic, mtFlatPolarSinusoidal, naturalEarth, nellHammer, orthographic, patterson, polyconic, rectangularPolyconic, robinson, sinusoidal, stereographic, times, twoPointEquidistant, vanDerGrinten, vanDerGrinten2, vanDerGrinten3, vanDerGrinten4, wagner4, wagner6, wagner7, wiechel, winkel3
  transform: "equatorial", // Coordinate transformation: equatorial (default), ecliptic, galactic, supergalactic
  center: null,       // Initial center coordinates in equatorial transformation only [hours, degrees], null = default center
  background: "#000000", // Background color or gradient  
  adaptable: true,    // Sizes are increased with higher zoom-levels
  interactive: true,  // Enable zooming and rotation with mousewheel and dragging
  container: "map",   // ID of parent element, e.g. div
  datapath: "data/",  // Path/URL to data files, empty = subfolder 'data'
  stars: {
    show: true,    // Show stars
    limit: 6,      // Show only stars brighter than limit magnitude
    colors: true,  // Show stars in spectral colors, if not use "color"
    color: "#ffffff", // Default color for stars
    names: true,   // Show star names (css-class starname)
    proper: false, // Show proper names (if none shows designation)
    desig: true,   // Show designation (Bayer, Flamsteed, Variable star, Gliese, Draper, Hipparcos, whichever applies first)
    namelimit: 2.5,  // Show only names for stars brighter than namelimit
    data: 'stars.6.json' // Data source for stellar data
  },
  dsos: {
    show: true,    // Show Deep Space Objects (css-class per type)
    limit: 6,      // Show only DSOs brighter than limit magnitude
    names: true,   // Show DSO names
    desig: true,   // Show short DSO names
    namelimit: 4,  // Show only names for DSOs brighter than namelimit
    data: 'dsos.bright.json'  // Data source for DSOs
  },
  constellations: {
    show: true,    // Show constellations 
    names: true,   // Show constellation names (css-class: constname)
    desig: true,   // Show short constellation names (3 letter designations)
    lines: true,   // Show constellation lines (css-class: constline)
    bounds: false  // Show constellation boundaries (css-class: boundaryline)
  },
  mw: {
    show: true,    // Show Milky Way as filled polygons (css-class: mw)
  },
  lines: {
    graticule: true,    // Show graticule lines (css-class: gridline)
    equatorial: true,  // Show equatorial plane (css-class: equatorial)
    ecliptic: true,     // Show ecliptic plane (css-class: ecliptic)
    galactic: false,    // Show galactic plane (css-class: galactic)
    supergalactic: false,  // Show supergalactic plane (css-class: supergalactic)
    mars: false
  },
  set: function(cfg) {  // Override defaults with values of cfg
    var prop, key, res = {};
    if (!cfg) return this; 
    for (prop in this) {
      if (!this.hasOwnProperty(prop)) continue; 
      if (typeof(this[prop]) === 'function') continue; 
      if (!cfg.hasOwnProperty(prop) || cfg[prop] === null) { 
        res[prop] = this[prop]; 
      } else if (this[prop] === null || this[prop].constructor != Object ) {
        res[prop] = cfg[prop];
      } else {
        res[prop] = {};
        for (key in this[prop]) {
          if (cfg[prop].hasOwnProperty(key)) {
            res[prop][key] = cfg[prop][key];
          } else {
            res[prop][key] = this[prop][key];
          }            
        }
      }
    }
    return res;
  }
  
};

Celestial.settings = function() { return settings; };

//DSO symbol shapes
var symbols = {
  gg: "circle",   // Galaxy cluster
  g:  "ellipse",  // Generic galaxy
  s:  "ellipse",  // Spiral galaxy
  s0: "ellipse",  // Lenticular galaxy
  sd: "ellipse",  // Dwarf galaxy
  e:  "ellipse",  // Elliptical galaxy
  i:  "ellipse",  // Irregular galaxy
  oc: "circle",   // Open cluster
  gc: "circle",   // Globular cluster
  en: "square",   // Emission nebula
  bn: "square",   // Generic bright nebula
  sfr: "square",  // Star forming region
  rn: "square",   // Reflection nebula
  pn: "diamond",  // Planetary nebula 
  snr: "diamond", // Supernova remnant
  dn: "square",   // Dark nebula grey
  pos: "marker"   // Generic marker
};

//b-v color index to rgb color value scale
var bvcolor = 
  d3.scale.quantize().domain([3.347, -0.335]) //main sequence <= 1.7
    .range([ '#ff4700', '#ff4b00', '#ff4f00', '#ff5300', '#ff5600', '#ff5900', '#ff5b00', '#ff5d00', '#ff6000', '#ff6300', '#ff6500', '#ff6700', '#ff6900', '#ff6b00', '#ff6d00', '#ff7000', '#ff7300', '#ff7500', '#ff7800', '#ff7a00', '#ff7c00', '#ff7e00', '#ff8100', '#ff8300', '#ff8506', '#ff870a', '#ff8912', '#ff8b1a', '#ff8e21', '#ff9127', '#ff932c', '#ff9631', '#ff9836', '#ff9a3c', '#ff9d3f', '#ffa148', '#ffa34b', '#ffa54f', '#ffa753', '#ffa957', '#ffab5a', '#ffad5e', '#ffb165', '#ffb269', '#ffb46b', '#ffb872', '#ffb975', '#ffbb78', '#ffbe7e', '#ffc184', '#ffc489', '#ffc78f', '#ffc892', '#ffc994', '#ffcc99', '#ffce9f', '#ffd1a3', '#ffd3a8', '#ffd5ad', '#ffd7b1', '#ffd9b6', '#ffdbba', '#ffddbe', '#ffdfc2', '#ffe1c6', '#ffe3ca', '#ffe4ce', '#ffe8d5', '#ffe9d9', '#ffebdc', '#ffece0', '#ffefe6', '#fff0e9', '#fff2ec', '#fff4f2', '#fff5f5', '#fff6f8', '#fff9fd', '#fef9ff', '#f9f6ff', '#f6f4ff', '#f3f2ff', '#eff0ff', '#ebeeff', '#e9edff', '#e6ebff', '#e3e9ff', '#e0e7ff', '#dee6ff', '#dce5ff', '#d9e3ff', '#d7e2ff', '#d3e0ff', '#c9d9ff', '#bfd3ff', '#b7ceff', '#afc9ff', '#a9c5ff', '#a4c2ff', '#9fbfff', '#9bbcff']);
 
/* Default parameters for each supported projection
     arg: constructor argument, if any 
     scale: scale parameter so that they all have ~equal width
     ratio: width/height ration, 2.0 if none
     clip: projection clipped to 90 degrees from center
*/
var projections = {
  "airy": {arg:Math.PI/2, scale:360, ratio:1.0, clip:true},
  "aitoff": {arg:null, scale:162},
  "armadillo": {arg:0, scale:250}, 
  "august": {arg:null, scale:94, ratio:1.4},
  "azimuthalEqualArea": {arg:null, scale:340, ratio:1.0, clip:true},
  "azimuthalEquidistant": {arg:null, scale:320, ratio:1.0, clip:true},
  "baker": {arg:null, scale:160, ratio:1.4},
  "berghaus": {arg:1, scale:320, ratio:1.0, clip:true},
  "boggs": {arg:null, scale:170},
  "bonne": {arg:Math.PI/4, scale:230, ratio:0.88},
  "bromley": {arg:null, scale:162},
  "collignon": {arg:null, scale:100, ratio:2.6},
  "craig": {arg:0, scale:310, ratio:1.5, clip:true},
  "craster": {arg:null, scale:160},
  "cylindricalEqualArea": {arg:Math.PI/6, scale:190, ratio:2.3},
  "cylindricalStereographic": {arg:Math.PI/4, scale:230, ratio:1.3},
  "eckert1": {arg:null, scale:175},
  "eckert2": {arg:null, scale:175},
  "eckert3": {arg:null, scale:190},
  "eckert4": {arg:null, scale:190},
  "eckert5": {arg:null, scale:182},
  "eckert6": {arg:null, scale:182},
  "eisenlohr": {arg:null, scale:102},
  "equirectangular": {arg:null, scale:165},
  "fahey": {arg:null, scale:196, ratio:1.4},
  "foucaut": {arg:null, scale:142},
  "ginzburg4": {arg:null, scale:180, ratio:1.7},
  "ginzburg5": {arg:null, scale:196, ratio:1.55},
  "ginzburg6": {arg:null, scale:190, ratio:1.4},
  "ginzburg8": {arg:null, scale:205, ratio:1.3},
  "ginzburg9": {arg:null, scale:190, ratio:1.4},
//  "gringorten": {arg:null, scale:360, ratio:1.0, clip:true},
  "hammer": {arg:2, scale:180},
  "hatano": {arg:null, scale:186},
  "healpix": {arg:1, scale:320, ratio:1.2},
  "hill": {arg:2, scale:195, ratio:1.5},
  "homolosine": {arg:null, scale:160, ratio:2.2},
  "kavrayskiy7": {arg:null, scale:185, ratio:1.75},
  "lagrange": {arg:Math.PI/4, scale:88, ratio:2, clip:false},
  "larrivee": {arg:null, scale:160, ratio:1.25},
  "laskowski": {arg:null, scale:165, ratio:1.7},
  "loximuthal": {arg:Math.PI/4, scale:175, ratio:1.8},
  "mercator": {arg:null, scale:160, ratio:1.3},
  "miller": {arg:null, scale:160, ratio:1.5},
  "mollweide": {arg:null, scale:180},
  "mtFlatPolarParabolic": {arg:null, scale:175},
  "mtFlatPolarQuartic": {arg:null, scale:230, ratio:1.65},
  "mtFlatPolarSinusoidal": {arg:null, scale:175, ratio:1.9},
  "naturalEarth": {arg:null, scale:185, ratio:1.85},
  "nellHammer": {arg:null, scale:160, ratio:2.6},
  "orthographic": {arg:null, scale:480, ratio:1.0, clip:true},
  "patterson": {arg:null, scale:160, ratio:1.75},
  "polyconic": {arg:null, scale:160, ratio:1.3},
  "rectangularPolyconic": {arg:0, scale:160, ratio:1.65},
  "robinson": {arg:null, scale:160},
  "sinusoidal": {arg:null, scale:160, ratio:2},
  "stereographic": {arg:null, scale:500, ratio:1.0, clip:true},
  "times": {arg:null, scale:210, ratio:1.4}, 
  "twoPointEquidistant": {arg:Math.PI/2, scale:320, ratio:1.15, clip:true},
  "vanDerGrinten": {arg:null, scale:160, ratio:1.0}, 
  "vanDerGrinten2": {arg:null, scale:160, ratio:1.0},
  "vanDerGrinten3": {arg:null, scale:160, ratio:1.0},
  "vanDerGrinten4": {arg:null, scale:160, ratio:1.6},
  "wagner4": {arg:null, scale:185},
  "wagner6": {arg:null, scale:160},
  "wagner7": {arg:null, scale:190, ratio:1.8},
  "wiechel": {arg:null, scale:360, ratio:1.0, clip:true},
  "winkel3": {arg:null, scale:196, ratio:1.7}
};

Celestial.projections = function() { return projections; };

