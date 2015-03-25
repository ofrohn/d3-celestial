// Copyright 2015 Olaf Frohn https://github.com/ofrohn, see LICENSE
!(function() {
// celestial.js main file
var Celestial = {};


Celestial.display = function(config) {
  var cfg, circle, par;
  
  cfg = settings.set(config); 
  
  par = $("map") ? "#map" : "body";
  
  if (!projections.hasOwnProperty(cfg.projection)) return; 
  
  var proj = projections[cfg.projection],
      trans = cfg.transform || "equatorial",
      ratio = proj.ratio || 2,
      width = cfg.width,
      height = width / ratio,
      base = 7, exp = -0.3, //Object size base & exponent
      center = trans == "galactic" ? [0,0,0] : [180, 0, 0];
    
  var projection = Celestial.projection(cfg.projection).rotate(eulerAngles[trans]).translate([width/2, height/2]).scale([proj.scale]);
  var projOl = Celestial.projection(cfg.projection).translate([width/2, height/2]).scale([proj.scale]); //projected non moving outline

  if (proj.clip) {
    projection.clipAngle(90);
    circle = d3.geo.circle().angle([90]);
  }

  var zoom = d3.geo.zoom().projection(projection).center([width/2, height/2]).scaleExtent([proj.scale, proj.scale*4]).on("zoom.redraw", redraw);
  
  var graticule = d3.geo.graticule().minorStep([15,10]);
  
  var path = d3.geo.path().projection(projection);
  var olP = d3.geo.path().projection(projOl);
      
  //div with id #map or body
  var svg = d3.select(par).append("svg").attr("width", width).attr("height", height).call(zoom);
  
  if (circle) {
    svg.append("path").datum(circle).attr("class", "outline").attr("d", olP).style("fill", cfg.background);
  } else {
    svg.append("path").datum(graticule.outline).attr("class", "outline").attr("d", olP).style("fill", cfg.background);
  }

  if (cfg.lines.graticule) {
    if (trans == "equatorial") {
      svg.append("path").datum(graticule).attr("class", "gridline").attr("d", path);
    } else {
      Celestial.graticule(svg, path, trans);
    }
  }
  
  //d3.select("body").style("background-color", "black");
  
  //Milky way outline
  if (cfg.mw.show) { d3.json("data/mw.json", function(error, mwjson) {
    svg.selectAll(".mway")
       .data(mwjson.features)
       .enter()
       .append("path")
       .attr("class", "mw")
       .attr("d", path);
       //.style("fill", cfg.mw.color)
       //.style("opacity", cfg.mw.opacity/5);
  });}

  //Constellation nemes or designation
  if (cfg.constellations.show) { 
    d3.json("data/constellations.json", function(error, conjson) {
      svg.selectAll(".constnames")
         .data(conjson.features)
         .enter()
         .append("text")
         .attr("class", "constname")
         .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
         .text( function(d) { if (cfg.constellations.names) { return cfg.constellations.desig?d.properties.desig:d.properties.name; }})
         .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); }); 
    });

    //Constellation boundaries
    if (cfg.constellations.bounds) { 
      d3.json("data/constellations.bounds.json", function(error, bndjson) {
        svg.selectAll(".bounds")
           .data(bndjson.features)
           .enter()
           .append("path")
           .attr("class", "boundaryline")
           .attr("d", path);
      });
    }

    //Constellation lines
    if (cfg.constellations.lines) { 
      d3.json("data/constellations.lines.json", function(error, linejson) {
        svg.selectAll(".lines")
           .data(linejson.features)
           .enter()
           .append("path")
           .attr("class", "constline")
           .attr("d", path);
      });
    }
  }
  
  //Stars
  if (cfg.stars.show) { 
    d3.json(cfg.stars.data, function(error, starjson) {
      svg.selectAll(".stars")
         .data(starjson.features)
         .enter()
         .append("path")
         .attr("class", "star")
         .attr("d", path.pointRadius( function(d) {
           return d.properties ? starsize(d.properties.mag) : 1;
         }))
         .style("fill", function(d) {
           return starcolor(d.properties);
         });

      if (cfg.stars.names) { 
        svg.selectAll(".starnames")
           .data(starjson.features)
           .enter()
           .append("text")
           .attr("transform", function(d) { return point(d.geometry.coordinates); })
           .text( function(d) { return starname(d.properties); })
           .attr({dy: "-.5em", dx: ".35em", class: "starname"})
           .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); }); 
      }       
    });
  }

  //Deep space objects
  if (cfg.dsos.show) { 
    d3.json(cfg.dsos.data, function(error, dsojson) {
      svg.selectAll(".dsos")
         .data(dsojson.features)
         .enter()
         .append("path")
         .attr("class", function(d) { return "dso " + d.properties.type; } )
         .attr("transform", function(d) { return point(d.geometry.coordinates); })
         .attr("d", function(d) { return dsosymbol(d.properties); })
         .attr("style", function(d) { return dsocolor(d.properties); })
         .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); })
         .style("stroke-opacity", function(d) { return clip(d.geometry.coordinates); }); 
    
      if (cfg.dsos.names) { 
        svg.selectAll(".dsonames")
           .data(dsojson.features)
           .enter()
           .append("text")
           .attr("class", function(d) { return "dsoname " + d.properties.type; } )
           //.attr("class", "dsoname")
           .attr("transform", function(d) { return point(d.geometry.coordinates); })
           .text( function(d) { return dsoname(d.properties); } )
           .attr({dy: "-.5em", dx: ".35em", 
                  style: function(d) { return dsocolor(d.properties, true); } 
            })
           .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); }); 
      }
    });
  }

  //Celestial planes
  for (var key in cfg.lines) {
    if (cfg.lines.hasOwnProperty(key) && key != "graticule" && cfg.lines[key] !== false) { 
      svg.append("path")
         .datum(d3.geo.circle().angle([90]).origin(poles[key]) )
         .attr("class", key)
         .attr("d", path);
    }
  }
    
  //-- Helper functions

  function clip(coords) {
    return proj.clip && d3.geo.distance(center, coords) > halfπ ? 0 : 1;
  }

  function point(coords) {
    return "translate(" + projection(coords) + ")";
  }
  
  function redraw() {
    if (!d3.event) { return; }
    //d3.event.sourceEvent.preventDefault();
    var rot = projection.rotate();
    projOl.scale(projection.scale());
    base = 7 * Math.sqrt(projection.scale()/proj.scale);
    center = [-rot[0], -rot[1]];

    svg.selectAll("path")
       .attr("d", path.pointRadius( function(d, i) { return d.properties ? starsize(d.properties.mag) : 1; } )); 
    svg.selectAll("text")
       .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); });
   
/*    svg.selectAll(".constname")
       .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); });
    svg.selectAll(".constline").attr("d", path);  
    svg.selectAll(".boundaryline").attr("d", path);  
*/  
/*    svg.selectAll(".star")
       .attr("d", path.pointRadius( function(d, i) { return d.properties ? starsize(d.properties.mag) : 1; } )); 
    svg.selectAll(".starname")
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); });
*/    
    svg.selectAll(".dso")
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .attr("d", function(d, i) { return dsosymbol(d.properties); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); })
       .style("stroke-opacity", function(d, i) { return clip(d.geometry.coordinates); });
/*    svg.selectAll(".dsoname")
       .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); });
*/    
    svg.selectAll(".outline").attr("d", olP);  
/*    svg.selectAll(".gridline").attr("d", path);  

    svg.selectAll(".mw").attr("d", path);  
    svg.selectAll(".ecliptic").attr("d", path);  
    svg.selectAll(".equatorial").attr("d", path);  
    svg.selectAll(".galactic").attr("d", path);  
    svg.selectAll(".supergalactic").attr("d", path);  
    svg.selectAll(".mars").attr("d", path);  
*/    
  }

  function dsosymbol(prop) {
    var size = dsosize(prop.mag, prop.dim) || 9,
        type = dsoshape(prop.type);
    if (d3.svg.symbolTypes.indexOf(type) !== -1) {
      return d3.svg.symbol().type(type).size(size)();
    } else {
      return d3.svg.customSymbol().type(type).size(size)();
    }
  }

  function dsoshape(type) {
    if (!type || !symbols.hasOwnProperty(type)) return "circle"; 
    else return symbols[type].shape; 
  }


  function dsocolor(prop, text) {
    if (!prop.type || !symbols.hasOwnProperty(prop.type) || 
        prop.mag == 999 && Math.sqrt(parseInt(prop.dim)) < cfg.dsos.limit || 
        prop.mag != 999 && prop.mag > cfg.dsos.limit) { return ''; }
    if (text) {
      return 'fill:' + symbols[prop.type].stroke; 
    } else {
      return 'stroke:' + symbols[prop.type].stroke + '; fill:' + symbols[prop.type].fill; 
    }
  }

  function dsosize(mag, dim) {
    if (!mag || mag == 999) return Math.pow(parseInt(dim)*base/7, 0.5); 
    return Math.pow(2*base-mag, 1.4);
  }

  function dsoname(prop) {
    if (prop.mag == 999 && Math.sqrt(parseInt(prop.dim)) < cfg.dsos.namelimit || 
        prop.mag != 999 && prop.mag > cfg.dsos.namelimit || 
        prop.name === "") return; 
    if (cfg.dsos.desig && prop.desig) return prop.desig; 
    return prop.name;
  }
  
  function starname(prop) {
    if (prop.mag > cfg.stars.namelimit || 
       (cfg.stars.desig === false && prop.name === "")) return; 
    if (cfg.stars.proper && prop.name !== "") return prop.name; 
    if (cfg.stars.desig)  return prop.desig; 
  }
  
  function starsize(mag) {
    if (mag === null) return 0.2; 
    var d = base * Math.exp(exp * (mag+2));
    return d>0.2 ? d : 0.2;
  }
  
  function starcolor(prop) {
    if (prop.mag > cfg.stars.limit) return "rgba(0,0,0,0)"; 
    if (!cfg.stars.colors) {return cfg.stars.color; }
    return bvcolor(prop.bv);
  }
  
};

function $(id) {
  return document.getElementById(id);
}



//Flipped projection generated on the fly
Celestial.projection = function(projection) {
  var p, trans, raw, forward;
  
  if (!projections.hasOwnProperty(projection)) { throw new Error("Projection not supported: " + projection); }
  p = projections[projection];
    
  if (p.arg !== null) {
    raw = d3.geo[projection].raw(p.arg);
  } else {
    raw = d3.geo[projection].raw;  
  }
  
  forward = function(λ, φ) {
    var coords = raw(-λ, φ);
    return coords;
  };

  forward.invert = function(x, y) {
    var coords = raw.invert(x, y);
    coords[0] *= -1;
    return coords;
  };

  return d3.geo.projection(forward);
};

var eulerAngles = {
  "equatorial": [180.0, 0.0, 0.0],
  "ecliptic": [180.0, 0.0, 23.4393],
  "galactic": [93.5949, 28.9362, -58.5988],
  "supergalactic": [137.3100, 59.5283, 57.7303],
  "mars": [97.5,23.5,29]
};

var poles = {
  "equatorial": [0.0, 90.0],
  "ecliptic": [-90.0, 66.5607],
  "galactic": [-167.1405, 27.1283],
  "supergalactic": [-76.2458, 15.7089],
  "mars": [-42.3186, 52.8865]
};

Celestial.eulerAngles = function() { return eulerAngles; };
Celestial.poles = function() { return poles; };


var τ = Math.PI*2,
    halfπ = Math.PI/2,
    deg2rad = Math.PI/180;

Celestial.graticule = function(svg, path, trans) {
  //d3.geo.circle graticule [0,90]/10..170deg + [0..180,0]/90deg

  var i;
  
  if (!trans || trans == "equatorial") return; 
  for (i=10; i<=170; i+=10) {
    svg.append("path")
       .datum( d3.geo.circle().angle([i]).origin(poles[trans]) )
       .attr("class", 'gridline')
       .attr("d", path);
  }
  for (i=10; i<=180; i+=10) {
    svg.append("path")
       .datum( d3.geo.circle().angle([90]).origin(transformDeg([i,0], euler["inverse " + trans])) )
       .attr("class", 'gridline')
       .attr("d", path);    
  }  
};

function transformDeg(c, euler) {
  var res = transform( c.map( function(d) { return d * deg2rad; } ), euler);
  return res.map( function(d) { return d / deg2rad; } );
}

//Transform equatorial into any coordinates
function transform(c, euler) {
  var x, y, z, β, γ, λ, φ, dψ, ψ, θ,
      ε = 1.0e-5;

  if (!euler) return c; 

  λ = c[0];  // celestial longitude 0..2pi
  if (λ < 0) λ += τ; 
  φ = c[1];  // celestial latitude  -pi/2..pi/2
  
  λ -= euler[0];  // celestial longitude - celestial coordinates of the native pole
  β = euler[1];  // inclination between the poles (colatitude)
  γ = euler[2];  // native coordinates of the celestial pole
  
  x = Math.sin(φ) * Math.sin(β) - Math.cos(φ) * Math.cos(β) * Math.cos(λ);
  if (Math.abs(x) < ε) {
    x = -Math.cos(φ + β) + Math.cos(φ) * Math.cos(β) * (1 - Math.cos(λ));
  }
  y = -Math.cos(φ) * Math.sin(λ);
  
  if (x !== 0 || y !== 0) {
    dψ = Math.atan2(y, x);
  } else {
    dψ = λ - Math.PI;
  }
  ψ = (γ + dψ); 
  if (ψ > Math.PI) ψ -= τ; 
  
  if (λ % Math.PI === 0) {
    θ = φ + Math.cos(λ) * β;
    if (θ > halfπ) θ = Math.PI - θ; 
    if (θ < -halfπ) θ = -Math.PI - θ; 
  } else {
    z = Math.sin(φ) * Math.cos(β) + Math.cos(φ) * Math.sin(β) * Math.cos(λ);
    if (Math.abs(z) > 0.99) {
      θ = Math.abs(Math.acos(Math.sqrt(x*x+y*y)));
      if (z < 0) θ *= -1; 
    } else {
      θ = Math.asin(z);
    }
  }
  
  return [ψ, θ];
}


var euler = {
  "ecliptic": [-90.0, 23.4393, 90.0],
  "inverse ecliptic": [90.0, 23.4393, -90.0],
  "galactic": [192.8595, 62.8717, 122.9319], 
  "inverse galactic": [238.9319, 62.8717, 192.8595],
  "supergalactic": [283.7542, 74.2911, 26.4504],
  "inverse supergalactic": [334.4504, 74.2911, 283.7542],
  "init": function() {
    for (var key in this) {
      if (this[key].constructor == Array) { 
        this[key] = this[key].map( function(val) { return val * deg2rad; } );
      }
    }
  },
  "add": function(name, ang) {
    if (!ang || !name || ang.length !== 3 || this.hasOwnProperty(name)) return; 
    this[name] = ang.map( function(val) { return val * deg2rad; } );
    return this[name];
  }
};

euler.init();
Celestial.euler = function() { return euler; };


var settings = { 
  width: 1024,     // Default width; height is determined by projection
  projection: "aitoff",  //Map projection used: airy, aitoff, armadillo, august, azimuthalEqualArea, azimuthalEquidistant, baker, berghaus, boggs, bonne, bromley, collignon, craig, craster, cylindricalEqualArea, cylindricalStereographic, eckert1, eckert2, eckert3, eckert4, eckert5, eckert6, eisenlohr, equirectangular, fahey, foucaut, ginzburg4, ginzburg5, ginzburg6, ginzburg8, ginzburg9, gringorten, hammer, hatano, healpix, hill, homolosine, kavrayskiy7, lagrange, larrivee, laskowski, loximuthal, mercator, miller, mollweide, mtFlatPolarParabolic, mtFlatPolarQuartic, mtFlatPolarSinusoidal, naturalEarth, nellHammer, orthographic, patterson, polyconic, rectangularPolyconic, robinson, sinusoidal, stereographic, times, twoPointEquidistant, vanDerGrinten, vanDerGrinten2, vanDerGrinten3, vanDerGrinten4, wagner4, wagner6, wagner7, wiechel, winkel3
  transform: "equatorial", // Coordinate transformation euler angles; equatorial, ecliptic, galactic, supergalactic
  background: "#000", //Background color or gradient  
  stars: {
    show: true,    // Show stars
    limit: 6,      // down to maximum stellar magnitude
    colors: true,  // Show stars in spectral colors, if not use "color"
    color: "#fff", // Default color for stars
    names: true,   // Show star names (css-class starname)
    proper: false, // Show proper names (if none shows designation)
    desig: true,   // Show designation (Bayer, Flamsteed, Variable star, Gliese, Draper, Hipparcos, whichever applies first)
    namelimit: 2,  // Maximum magnitude with name
    data: 'data/stars.6.json' // Data source for stellar data
  },
  dsos: {
    show: true,    // Show Deep Space Objects (css-class per type)
    limit: 6,      // down to maximum magnitude
    names: true,   // Show DSO names
    desig: true,   // Show short DSO names
    namelimit: 4,  // Maximum magnitude with name
    data: 'data/dsos.bright.json'  // Data source for DSOs
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
    equatorial: false,  // Show equatorial plane (css-class: equatorial)
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
      if (typeof(this[prop]) == 'function') continue; 
      if (!cfg.hasOwnProperty(prop) || cfg[prop] === null) { 
        res[prop] = this[prop]; 
      } else if (this[prop].constructor != Object ) {
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

var symbols = {
  gg: {shape:"circle", stroke:"#f00", fill:"#f00"},   // Galaxy cluster red circle
  g:  {shape:"ellipse", stroke:"#f00", fill:"#f00"},  // Generic galaxy red ellipse
  s:  {shape:"ellipse", stroke:"#f00", fill:"#f00"},  // Spiral galaxy red ellipse
  s0: {shape:"ellipse", stroke:"#f00", fill:"#f00"},  // Lenticular galaxy red ellipse
  sd: {shape:"ellipse", stroke:"#f00", fill:"#f00"},  // Dwarf galaxy red ellipse
  e:  {shape:"ellipse", stroke:"#f00", fill:"#f00"},  // Elliptical galaxy red ellipse
  i:  {shape:"ellipse", stroke:"#f00", fill:"#f00"},  // Irregular galaxy red ellipse
  oc: {shape:"circle", stroke:"#fc0", fill:"none"},   // Open cluster orange open circle
  gc: {shape:"circle", stroke:"#f90", fill:"#f90"},   // Globular cluster dark orange circle
  en: {shape:"square", stroke:"#f0c", fill:"#f0c"},   // Emission nebula pink square
  bn: {shape:"square", stroke:"#f0c", fill:"none"},   // Generic bright nebula pink open square
  sfr: {shape:"square", stroke:"#c0f", fill:"none"},  // Star forming region purple open square
  rn: {shape:"square", stroke:"#00f", fill:"#00f"},   // Reflection nebula blue square
  pn: {shape:"diamond", stroke:"#0cc", fill:"#0cc"},  // Planetary nebula cyan diamond
  snr: {shape:"diamond", stroke:"#f0c", fill:"#f0c"}, // Supernova remnant pink diamond
  dn: {shape:"square", stroke:"#999", fill:"none"},   // Dark nebula grey open square
  pos: {shape:"marker", stroke:"#ccc", fill:"none"}   // Generic marker light grey open cross
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
  "azimuthalEqualArea": {arg:null, scale:220, ratio:1.0, clip:true},
  "azimuthalEquidistant": {arg:null, scale:150, ratio:1.0, clip:true},
  "baker": {arg:null, scale:160, ratio:1.4},
  "berghaus": {arg:1, scale:320, ratio:1.0, clip:true},
  "boggs": {arg:null, scale:170},
  "bonne": {arg:Math.PI/4, scale:230, ratio:0.88},
  "bromley": {arg:null, scale:162},
  "collignon": {arg:null, scale:100, ratio:2.6},
  "craig": {arg:0, scale:310, ratio:1.5, clip:true},
  "craster": {arg:null, scale:160},
  "cylindricalEqualArea": {arg:Math.PI/6, scale:180},
  "cylindricalStereographic": {arg:Math.PI/4, scale:230, ratio:1.3},
  "eckert1": {arg:null, scale:175},
  "eckert2": {arg:null, scale:175},
  "eckert3": {arg:null, scale:190},
  "eckert4": {arg:null, scale:190},
  "eckert5": {arg:null, scale:182},
  "eckert6": {arg:null, scale:182},
  "eisenlohr": {arg:null, scale:102},
  "equirectangular": {arg:null, scale:160},
  "fahey": {arg:null, scale:196, ratio:1.4},
  "foucaut": {arg:null, scale:142},
  "ginzburg4": {arg:null, scale:180, ratio:1.7},
  "ginzburg5": {arg:null, scale:196, ratio:1.55},
  "ginzburg6": {arg:null, scale:190, ratio:1.4},
  "ginzburg8": {arg:null, scale:205, ratio:1.3},
  "ginzburg9": {arg:null, scale:190, ratio:1.4},
  "gringorten": {arg:null, scale:360, ratio:1.0, clip:true},
  "hammer": {arg:2, scale:180},
  "hatano": {arg:null, scale:186},
  "healpix": {arg:1, scale:300, ratio:1.2},
  "hill": {arg:2, scale:190, ratio:1.6},
  "homolosine": {arg:null, scale:160, ratio:2.2},
  "kavrayskiy7": {arg:null, scale:185, ratio:1.75},
  "lagrange": {arg:Math.PI/2, scale:88, ratio:1.7, clip:true},
  "larrivee": {arg:null, scale:160, ratio:1.25},
  "laskowski": {arg:null, scale:165, ratio:1.7},
  "loximuthal": {arg:Math.PI/4, scale:170, ratio:1.8},
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
  "stereographic": {arg:null, scale:480, ratio:1.0, clip:true},
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


//Thanks to stackoverflow user jshanley for the custom symbol class
var customSymbolTypes = d3.map({
  'ellipse': function(size) {
    var s = Math.sqrt(size), 
        rx = s*0.666, ry = s/3;
    return 'M' + (-rx) + ',' + (-ry) +
    ' m' + (-rx) + ',0' +
    ' a' + rx + ',' + ry + ' 0 1,0' + (rx * 2) + ',0' +
    ' a' + rx + ',' + ry + ' 0 1,0' + (-(rx * 2)) + ',0';
  },
  'marker': function(size) {
    var s =  size > 48 ? size / 4 : 12,
        r = s/2, l = r-3;
    return 'M ' + (-r) + ' 0 h ' + l + 
           ' M 0 ' + (-r) + ' v ' + l + 
           ' M ' + r + ' 0 h ' + (-l) +  
           ' M 0 ' + r + ' v ' + (-l);
  }
});

d3.svg.customSymbol = function() {
  var type, size = 64;
  
  function symbol(d,i) {
    return customSymbolTypes.get(type.call(this,d,i))(size.call(this,d,i));
  }
  symbol.type = function(_) {
    if (!arguments.length) return type; 
    type = d3.functor(_);
    return symbol;
  };
  symbol.size = function(_) {
    if (!arguments.length) return size; 
    size = d3.functor(_);
    return symbol;
  };
  return symbol;
};


this.Celestial = Celestial;
})();