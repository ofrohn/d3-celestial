/* global d3, Celestial, has */
//Defaults
var settings = { 
  width: 0,     // Default width; height is determined by projection
  projection: "aitoff",  // Map projection used: airy, aitoff, armadillo, august, azimuthalEqualArea, azimuthalEquidistant, baker, berghaus, boggs, bonne, bromley, collignon, craig, craster, cylindricalEqualArea, cylindricalStereographic, eckert1, eckert2, eckert3, eckert4, eckert5, eckert6, eisenlohr, equirectangular, fahey, foucaut, ginzburg4, ginzburg5, ginzburg6, ginzburg8, ginzburg9, gringorten, hammer, hatano, healpix, hill, homolosine, kavrayskiy7, lagrange, larrivee, laskowski, loximuthal, mercator, miller, mollweide, mtFlatPolarParabolic, mtFlatPolarQuartic, mtFlatPolarSinusoidal, naturalEarth, nellHammer, orthographic, patterson, polyconic, rectangularPolyconic, robinson, sinusoidal, stereographic, times, twoPointEquidistant, vanDerGrinten, vanDerGrinten2, vanDerGrinten3, vanDerGrinten4, wagner4, wagner6, wagner7, wiechel, winkel3
  transform: "equatorial", // Coordinate transformation: equatorial (default), ecliptic, galactic, supergalactic
  center: null,       // Initial center coordinates in equatorial transformation [hours, degrees, degrees], 
                      // otherwise [degrees, degrees, degrees], 3rd parameter is orientation, null = default center
  geopos: null,       // optional initial geographic position [lat,lon] in degrees, overrides center
  follow: "zenith",   // on which coordinates to center the map, default: zenith, if location enabled, otherwise center
  orientationfixed: true,  // Keep orientation angle the same as center[2]
  zoomlevel: null,    // initial zoom level 0...zoomextend; 0|null = default, 1 = 100%, 0 < x <= zoomextend
  zoomextend: 10,     // maximum zoom level
  adaptable: true,    // Sizes are increased with higher zoom-levels
  interactive: true,  // Enable zooming and rotation with mousewheel and dragging
  form: false,        // Display settings form
  location: false,    // Display location settings
  daterange: [],      // Calender date range; null: displaydate-+10; [n<100]: displaydate-+n; [yr]: yr-+10; 
                      // [yr, n<100]: [yr-n, yr+n]; [yr0, yr1]
  controls: true,     // Display zoom controls
  lang: "",           // Language for names, so far only for constellations: de: german, es: spanish
                      // Default:en or empty string for english
  container: "celestial-map",   // ID of parent element, e.g. div
  datapath: "data/",  // Path/URL to data files, empty = subfolder 'data'
  stars: {
    show: true,    // Show stars
    limit: 6,      // Show only stars brighter than limit magnitude
    colors: true,  // Show stars in spectral colors, if not use fill-style
    style: { fill: "#ffffff", opacity: 1 }, // Default style for stars
    names: true,   // Show star names (Bayer, Flamsteed, Variable star, Gliese, whichever applies first)
    proper: false, // Show proper name (if present)
    desig: false,  // Show all names, including Draper and Hipparcos
    namestyle: { fill: "#ddddbb", font: "11px 'Palatino Linotype', Georgia, Times, 'Times Roman', serif", align: "left", baseline: "top" },
    namelimit: 2.5,  // Show only names for stars brighter than namelimit
    propernamestyle: { fill: "#ddddbb", font: "13px 'Palatino Linotype', Georgia, Times, 'Times Roman', serif", align: "right", baseline: "bottom" },
    propernamelimit: 1.5,  // Show proper names for stars brighter than propernamelimit
    size: 7,       // Scale size (radius) of star circle in pixels
    exponent: -0.28, // Scale exponent for star size, larger = more linear
    data: "stars.6.json" // Data source for stellar data
  },
  dsos: {
    show: true,    // Show Deep Space Objects 
    limit: 6,      // Show only DSOs brighter than limit magnitude
    colors: true,  // Show DSOs in symbol colors if true, use style setting below if false
    style: { fill: "#cccccc", stroke: "#cccccc", width: 2, opacity: 1 }, // Default style for dsos
    names: true,   // Show DSO names
    desig: true,   // Show short DSO names
    namestyle: { fill: "#cccccc", font: "11px 'Lucida Sans Unicode', Helvetica, Arial, serif", align: "left", baseline: "top" },
    namelimit: 4,  // Show only names for DSOs brighter than namelimit
    size: null,    // Optional seperate scale size for DSOs, null = stars.size
    exponent: 1.4, // Scale exponent for DSO size, larger = more non-linear
    data: "dsos.bright.json",  // Data source for DSOs
    symbols: {  // DSO symbol styles
      gg: {shape: "circle", fill: "#ff0000"},                                 // Galaxy cluster
      g:  {shape: "ellipse", fill: "#ff0000"},                                // Generic galaxy
      s:  {shape: "ellipse", fill: "#ff0000"},                                // Spiral galaxy
      s0: {shape: "ellipse", fill: "#ff0000"},                                // Lenticular galaxy
      sd: {shape: "ellipse", fill: "#ff0000"},                                // Dwarf galaxy
      e:  {shape: "ellipse", fill: "#ff0000"},                                // Elliptical galaxy
      i:  {shape: "ellipse", fill: "#ff0000"},                                // Irregular galaxy
      oc: {shape: "circle", fill: "#ff9900", stroke: "#ff9900", width: 2},    // Open cluster
      gc: {shape: "circle", fill: "#ff9900"},                                 // Globular cluster
      en: {shape: "square", fill: "#ff00cc"},                                 // Emission nebula
      bn: {shape: "square", fill: "#ff00cc"},                                 // Generic bright nebula
      sfr:{shape: "square", fill: "#cc00ff"},                                 // Star forming region
      rn: {shape: "square", fill: "#0000ff"},                                 // Reflection nebula
      pn: {shape: "diamond", fill: "#00cccc"},                                // Planetary nebula 
      snr:{shape: "diamond", fill: "#ff00cc"},                                // Supernova remnant
      dn: {shape: "square", fill: "#999999", stroke: "#999999", width: 2},    // Dark nebula 
      pos:{shape: "marker", fill: "#cccccc", stroke: "#cccccc", width: 1.5}   // Generic marker
    }
  },
  constellations: {
    show: true,    // Show constellations 
    names: true,   // Show constellation names 
    desig: true,   // Show short constellation names (3 letter designations)
    namestyle: { fill:"#cccc99", align: "center", baseline: "middle", opacity:0.8, 
		             font: ["14px 'Lucida Sans Unicode', Helvetica, Arial, sans-serif",  // Different fonts for brighter &
								        "12px 'Lucida Sans Unicode', Helvetica, Arial, sans-serif",  // sdarker constellations
												"11px 'Lucida Sans Unicode', Helvetica, Arial, sans-serif"]},
    lines: true,   // Show constellation lines 
    linestyle: { stroke: "#cccccc", width: 1.5, opacity: 0.6 },
    bounds: false,  // Show constellation boundaries 
    boundstyle: { stroke: "#ccff00", width: 1, opacity: 0.8, dash: [2, 4] }
  },
  mw: {
    show: true,    // Show Milky Way as filled polygons 
    style: { fill: "#ffffff", opacity: "0.15" } // style for each MW-layer (5 on top of each other)
  },
  lines: {
    graticule: { show: true, stroke: "#cccccc", width: 0.6, opacity: 0.8,      // Show graticule lines 
			// grid values: "outline", "center", or [lat,...] specific position
      lon: {pos: [""], fill: "#eee", font: "10px 'Lucida Sans Unicode', Helvetica, Arial, sans-serif"}, 
			// grid values: "outline", "center", or [lon,...] specific position
		  lat: {pos: [""], fill: "#eee", font: "10px 'Lucida Sans Unicode', Helvetica, Arial, sans-serif"}},
    equatorial: { show: true, stroke: "#aaaaaa", width: 1.3, opacity: 0.7 },    // Show equatorial plane 
    ecliptic: { show: true, stroke: "#66cc66", width: 1.3, opacity: 0.7 },      // Show ecliptic plane 
    galactic: { show: false, stroke: "#cc6666", width: 1.3, opacity: 0.7 },     // Show galactic plane 
    supergalactic: { show: false, stroke: "#cc66cc", width: 1.3, opacity: 0.7 } // Show supergalactic plane 
   //mars: { show: false, stroke:"#cc0000", width:1.3, opacity:.7 }
  }, // Background style
  background: { 
    fill: "#000000", 
    opacity: 1, 
    stroke: "#000000", // Outline
    width: 1.5 
  }, 
  horizon: {  //Show horizon marker, if geo-position and date-time is set
    show: false, 
    stroke: "#000099", // Line
    width: 1.0, 
    fill: "#000000", // Area below horizon
    opacity: 0.5
  },  
  planets: {  //Show planet locations, if date-time is set
    show: false,
    which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"],
    style: { fill: "#00ccff", font: "bold 17px 'Lucida Sans Unicode', Consolas, sans-serif", align: "center", baseline: "middle" },
    symbols: {
      "sol": {symbol: "\u2609", fill: "#ffff00"},
      "mer": {symbol: "\u263f", fill: "#cccccc"},
      "ven": {symbol: "\u2640", fill: "#eeeecc"},
      "ter": {symbol: "\u2295", fill: "#00ffff"},
      "lun": {symbol: "\u25cf", fill: "#ffffff"},
      "mar": {symbol: "\u2642", fill: "#ff9999"},
      "cer": {symbol: "\u26b3", fill: "#cccccc"},
      "ves": {symbol: "\u26b6", fill: "#cccccc"},
      "jup": {symbol: "\u2643", fill: "#ff9966"},
      "sat": {symbol: "\u2644", fill: "#ffcc66"},
      "ura": {symbol: "\u2645", fill: "#66ccff"},
      "nep": {symbol: "\u2646", fill: "#6666ff"},
      "plu": {symbol: "\u2647", fill: "#aaaaaa"},
      "eri": {symbol: "\u26aa", fill: "#eeeeee"}
    }
  },
  daylight: {  // Show daylight marker (tbi)
    show: false, 
    fill: "#fff", 
    opacity: 0.4 
  },  
  set: function(cfg) {  // Override defaults with values of cfg
    var prop, key, res = {};
    if (!cfg) return this; 
    for (prop in this) {
      if (!has(this, prop)) continue; 
      //if (typeof(this[prop]) === 'function'); 
      if (!has(cfg, prop) || cfg[prop] === null) { 
        res[prop] = this[prop]; 
      } else if (this[prop] === null || this[prop].constructor != Object ) {
        res[prop] = cfg[prop];
      } else {
        res[prop] = {};
        for (key in this[prop]) {
          if (has(cfg[prop], key)) {
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

Celestial.settings = function () { return settings; };

//b-v color index to rgb color value scale
var bvcolor = 
  d3.scale.quantize().domain([3.347, -0.335]) //main sequence <= 1.7
    .range([ '#ff4700', '#ff4b00', '#ff4f00', '#ff5300', '#ff5600', '#ff5900', '#ff5b00', '#ff5d00', '#ff6000', '#ff6300', '#ff6500', '#ff6700', '#ff6900', '#ff6b00', '#ff6d00', '#ff7000', '#ff7300', '#ff7500', '#ff7800', '#ff7a00', '#ff7c00', '#ff7e00', '#ff8100', '#ff8300', '#ff8506', '#ff870a', '#ff8912', '#ff8b1a', '#ff8e21', '#ff9127', '#ff932c', '#ff9631', '#ff9836', '#ff9a3c', '#ff9d3f', '#ffa148', '#ffa34b', '#ffa54f', '#ffa753', '#ffa957', '#ffab5a', '#ffad5e', '#ffb165', '#ffb269', '#ffb46b', '#ffb872', '#ffb975', '#ffbb78', '#ffbe7e', '#ffc184', '#ffc489', '#ffc78f', '#ffc892', '#ffc994', '#ffcc99', '#ffce9f', '#ffd1a3', '#ffd3a8', '#ffd5ad', '#ffd7b1', '#ffd9b6', '#ffdbba', '#ffddbe', '#ffdfc2', '#ffe1c6', '#ffe3ca', '#ffe4ce', '#ffe8d5', '#ffe9d9', '#ffebdc', '#ffece0', '#ffefe6', '#fff0e9', '#fff2ec', '#fff4f2', '#fff5f5', '#fff6f8', '#fff9fd', '#fef9ff', '#f9f6ff', '#f6f4ff', '#f3f2ff', '#eff0ff', '#ebeeff', '#e9edff', '#e6ebff', '#e3e9ff', '#e0e7ff', '#dee6ff', '#dce5ff', '#d9e3ff', '#d7e2ff', '#d3e0ff', '#c9d9ff', '#bfd3ff', '#b7ceff', '#afc9ff', '#a9c5ff', '#a4c2ff', '#9fbfff', '#9bbcff']);
 
/* Default parameters for each supported projection
     arg: constructor argument, if any 
     scale: scale parameter so that they all have ~equal width, normalized to 1024 pixels
     ratio: width/height ratio, 2.0 if none
     clip: projection clipped to 90 degrees from center, otherwise to antimeridian
*/
var projections = {
  "airy": {n:"Airy’s Minimum Error", arg:Math.PI/2, scale:360, ratio:1.0, clip:true},
  "aitoff": {n:"Aitoff", arg:null, scale:162},
  "armadillo": {n:"Armadillo", arg:0, scale:250}, 
  "august": {n:"August", arg:null, scale:94, ratio:1.4},
  "azimuthalEqualArea": {n:"Azimuthal Equal Area", arg:null, scale:340, ratio:1.0, clip:true},
  "azimuthalEquidistant": {n:"Azimuthal Equidistant", arg:null, scale:320, ratio:1.0, clip:true},
  "baker": {n:"Baker Dinomic", arg:null, scale:160, ratio:1.4},
  "berghaus": {n:"Berghaus Star", arg:0, scale:320, ratio:1.0, clip:true},
  "boggs": {n:"Boggs Eumorphic", arg:null, scale:170},
  "bonne": {n:"Bonne", arg:Math.PI/2.5, scale:225, ratio:0.88},
  "bromley": {n:"Bromley", arg:null, scale:162},
//  "butterfly": {n:"Butterfly", arg:null, scale:31, ratio:1.1, clip:true},
  "cassini": {n:"Cassini", arg:null, scale:325, ratio:1.0, clip:true},
  "collignon": {n:"Collignon", arg:null, scale:100, ratio:2.6},
  "craig": {n:"Craig Retroazimuthal", arg:0, scale:310, ratio:1.5, clip:true},
  "craster": {n:"Craster Parabolic", arg:null, scale:160},
  "cylindricalEqualArea": {n:"Cylindrical Equal Area", arg:Math.PI/6, scale:190, ratio:2.3},
  "cylindricalStereographic": {n:"Cylindrical Stereographic", arg:Math.PI/4, scale:230, ratio:1.3},
  "eckert1": {n:"Eckert I", arg:null, scale:175},
  "eckert2": {n:"Eckert II", arg:null, scale:175},
  "eckert3": {n:"Eckert III", arg:null, scale:190},
  "eckert4": {n:"Eckert IV", arg:null, scale:190},
  "eckert5": {n:"Eckert V", arg:null, scale:182},
  "eckert6": {n:"Eckert VI", arg:null, scale:182},
  "eisenlohr": {n:"Eisenlohr", arg:null, scale:102},
  "equirectangular": {n:"Equirectangular", arg:null, scale:165},
  "fahey": {n:"Fahey", arg:null, scale:196, ratio:1.4},
  "mtFlatPolarParabolic": {n:"Flat Polar Parabolic", arg:null, scale:175},
  "mtFlatPolarQuartic": {n:"Flat Polar Quartic", arg:null, scale:230, ratio:1.65},
  "mtFlatPolarSinusoidal": {n:"Flat Polar Sinusoidal", arg:null, scale:175, ratio:1.9},
  "foucaut": {n:"Foucaut", arg:null, scale:142},
  "ginzburg4": {n:"Ginzburg IV", arg:null, scale:180, ratio:1.7},
  "ginzburg5": {n:"Ginzburg V", arg:null, scale:196, ratio:1.55},
  "ginzburg6": {n:"Ginzburg VI", arg:null, scale:190, ratio:1.4},
  "ginzburg8": {n:"Ginzburg VIII", arg:null, scale:205, ratio:1.3},
  "ginzburg9": {n:"Ginzburg IX", arg:null, scale:190, ratio:1.4},
  //"guyou": {n:"Guyou", arg:null, scale:160, ratio:2, clip:true},
  //"bonne": {n:"Heart", arg:Math.PI/2.5, scale:225, ratio:0.88},
  "homolosine": {n:"Goode Homolosine", arg:null, scale:160, ratio:2.2},
  "hammer": {n:"Hammer", arg:2, scale:180},
  "hatano": {n:"Hatano", arg:null, scale:186},
  "healpix": {n:"HEALPix", arg:1, scale:320, ratio:1.2},
  "hill": {n:"Hill Eucyclic", arg:2, scale:190, ratio:1.1},
  "kavrayskiy7": {n:"Kavrayskiy VII", arg:null, scale:185, ratio:1.75},
  "lagrange": {n:"Lagrange", arg:Math.PI/4, scale:88, ratio:1.6, clip:false},
  "larrivee": {n:"l'Arrivée", arg:null, scale:160, ratio:1.25},
  "laskowski": {n:"Laskowski Tri-Optimal", arg:null, scale:165, ratio:1.7},
  "loximuthal": {n:"Loximuthal", arg:Math.PI/4, scale:175, ratio:1.8},
  "mercator": {n:"Mercator", arg:null, scale:160, ratio:1.3},
  "miller": {n:"Miller", arg:null, scale:160, ratio:1.5},
  "mollweide": {n:"Mollweide", arg:null, scale:180},
  "naturalEarth": {n:"Natural Earth", arg:null, scale:185, ratio:1.85},
  "nellHammer": {n:"Nell Hammer", arg:null, scale:160, ratio:2.6},
  "orthographic": {n:"Orthographic", arg:null, scale:480, ratio:1.0, clip:true},
  "patterson": {n:"Patterson Cylindrical", arg:null, scale:160, ratio:1.75},
  "polyconic": {n:"Polyconic", arg:null, scale:160, ratio:1.3},
  "quincuncial": {n:"Quincuncial", arg:null, scale:160, ratio:1.3},
  "rectangularPolyconic": {n:"Rectangular Polyconic", arg:0, scale:160, ratio:1.65},
  "robinson": {n:"Robinson", arg:null, scale:160},
  "sinusoidal": {n:"Sinusoidal", arg:null, scale:160, ratio:2},
  "stereographic": {n:"Stereographic", arg:null, scale:500, ratio:1.0, clip:true},
  "times": {n:"Times", arg:null, scale:210, ratio:1.4}, 
  "twoPointEquidistant": {n:"Two-Point Equidistant", arg:Math.PI/2, scale:320, ratio:1.15, clip:true},
  "vanDerGrinten": {n:"van Der Grinten", arg:null, scale:160, ratio:1.0}, 
  "vanDerGrinten2": {n:"van Der Grinten II", arg:null, scale:160, ratio:1.0},
  "vanDerGrinten3": {n:"van Der Grinten III", arg:null, scale:160, ratio:1.0},
  "vanDerGrinten4": {n:"van Der Grinten IV", arg:null, scale:160, ratio:1.6},
  "wagner4": {n:"Wagner IV", arg:null, scale:185},
  "wagner6": {n:"Wagner VI", arg:null, scale:160},
  "wagner7": {n:"Wagner VII", arg:null, scale:190, ratio:1.8},
  "wiechel": {n:"Wiechel", arg:null, scale:360, ratio:1.0, clip:true},
  "winkel3": {n:"Winkel Tripel", arg:null, scale:196, ratio:1.7}
};

Celestial.projections = function () { return projections; };

