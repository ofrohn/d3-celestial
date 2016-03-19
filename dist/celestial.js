// Copyright 2015 Olaf Frohn https://github.com/ofrohn, see LICENSE
!(function() {
var Celestial = {
  version: '0.4.3',
  svg: null,
  data: []
};


// Show it all, with the given config, otherwise with default settings
Celestial.display = function(config) {
  var circle, par, svg = Celestial.svg;
  
  //Mash config with default settings
  var cfg = settings.set(config); 
  cfg.stars.size = cfg.stars.size || 7;
  
  var parent = $(cfg.container);
  if (parent) { 
    par = "#"+cfg.container;
    var stl = window.getComputedStyle(parent, null);
    if (!stl.width && !cfg.width) parent.style.width = px(parent.parentNode.clientWidth);    
  } else { 
    par = "body"; 
    parent = null; 
  }
  
  if (!has(projections, cfg.projection)) return; 
  
  var proj = projections[cfg.projection],
      trans = cfg.transform || "equatorial",
      ratio = proj.ratio || 2,
      width = getWidth(),
      height = width / ratio,
      scale = proj.scale * width/1024,
      base = cfg.stars.size, 
      exp = -0.3, //Object size base & exponent
      adapt = 1,
      rotation = getAngles(cfg.center),
      center = [-rotation[0], -rotation[1]],
      path = cfg.datapath || "";
      path = path.replace(/([^\/]$)/, "$1\/");
  
      
  if (par != "body") $(cfg.container).style.height = px(height);
  
  var projection = Celestial.projection(cfg.projection).rotate(rotation).translate([width/2, height/2]).scale([scale]);
  var projOl = Celestial.projection(cfg.projection).translate([width/2, height/2]).scale([scale]); //projected non moving outline

  
  if (proj.clip) {
    projection.clipAngle(90);
    circle = d3.geo.circle().angle([90]);
  }

  var zoom = d3.geo.zoom().projection(projection).center([width/2, height/2]).scaleExtent([scale, scale*5]).on("zoom.redraw", redraw);
  
  var graticule = d3.geo.graticule().minorStep([15,10]);
  
  var map = d3.geo.path().projection(projection);
  var outline = d3.geo.path().projection(projOl);
   
  //parent div with id #map or body
  if (svg) svg.selectAll("*").remove();
  else svg = d3.select(par).append("svg");

  svg.attr("width", width).attr("height", height);
 
  if (cfg.interactive) svg.call(zoom);
  else svg.attr("style", "cursor: default!important");
    
  if (circle) {
    svg.append("path").datum(circle).attr("class", "outline").attr("d", outline).style("fill", cfg.background);
  } else {
    svg.append("path").datum(graticule.outline).attr("class", "outline").attr("d", outline).style("fill", cfg.background);
  }

  if (cfg.lines.graticule) {
    if (trans == "equatorial") {
      svg.append("path").datum(graticule).attr("class", "gridline").attr("d", map);
    } else {
      Celestial.graticule(svg, map, trans);
    }
  }

  //Celestial planes
  for (var key in cfg.lines) {
    if (has(cfg.lines, key) && key != "graticule" && cfg.lines[key] !== false) { 
      svg.append("path")
         .datum(d3.geo.circle().angle([90]).origin(poles[key]) )
         .attr("class", key)
         .attr("d", map);
    }
  }
  
  //Milky way outline
  if (cfg.mw.show) { d3.json(path + "mw.json", function(error, json) {
    if (error) { 
      window.alert("Your Browser doesn't support local file loading or the file doesn't exist. See readme.md");
      return console.warn(error);  
    }
    svg.selectAll(".mway")
       .data(json.features)
       .enter().append("path")
       .attr("class", "mw")
       .attr("d", map);
  });}

  //Constellation nemes or designation
  if (cfg.constellations.show) { 
    d3.json(path + "constellations.json", function(error, json) {
      if (error) return console.warn(error);
      svg.selectAll(".constnames")
         .data(json.features)
         .enter().append("text")
         .attr("class", "constname")
         .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
         .text( function(d) { if (cfg.constellations.names) { return cfg.constellations.desig?d.properties.desig:d.properties.name; }})
         .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); }); 
    });

    //Constellation boundaries
    if (cfg.constellations.bounds) { 
      d3.json(path + "constellations.bounds.json", function(error, json) {
        if (error) return console.warn(error);
        svg.selectAll(".bounds")
           .data(json.features)
           .enter().append("path")
           .attr("class", "boundaryline")
           .attr("d", map);
      });
    }

    //Constellation lines
    if (cfg.constellations.lines) { 
      d3.json(path + "constellations.lines.json", function(error, json) {
        if (error) return console.warn(error);
        svg.selectAll(".lines")
           .data(json.features)
           .enter().append("path")
           .attr("class", "constline")
           .attr("d", map);
      });
    }
  }
  
  //Stars
  if (cfg.stars.show) { 
    d3.json(path + cfg.stars.data, function(error, json) {
      if (error) return console.warn(error);
      svg.selectAll(".stars")
         .data(json.features.filter( function(d) {
           return d.properties.mag <= cfg.stars.limit; 
         }))
         .enter().append("path")
         .attr("class", "star")
         .attr("d", map.pointRadius( function(d) {
           return d.properties ? starSize(d.properties.mag) : 1;
         }))
         .style("fill", function(d) {
           return starColor(d.properties);
         });

      if (cfg.stars.names) { 
        svg.selectAll(".starnames")
           .data(json.features.filter( function(d) {
             return d.properties.mag <= cfg.stars.namelimit; 
           }))
           .enter().append("text")
           .attr("transform", function(d) { return point(d.geometry.coordinates); })
           .text( function(d) { return starName(d.properties); })
           .attr({dy: "-.5em", dx: ".35em", class: "starname"})
           .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); });
      }
    });
  }

  //Deep space objects
  if (cfg.dsos.show) { 
    d3.json(path + cfg.dsos.data, function(error, json) {
      if (error) return console.warn(error);
      svg.selectAll(".dsos")
         .data(json.features.filter( function(d) {
           return d.properties.mag == 999 && Math.sqrt(parseInt(d.properties.dim)) > cfg.dsos.limit ||
                  d.properties.mag != 999 && d.properties.mag <= cfg.dsos.limit; 
         }))
         .enter().append("path")
         .attr("class", function(d) { return "dso " + d.properties.type; } )
         .attr("transform", function(d) { return point(d.geometry.coordinates); })
         .attr("d", function(d) { return dsoSymbol(d.properties); })
         .attr("style", function(d) { return opacity(d.geometry.coordinates); });
    
      if (cfg.dsos.names) { 
        svg.selectAll(".dsonames")
           .data(json.features.filter( function(d) {
             return d.properties.mag == 999 && Math.sqrt(parseInt(d.properties.dim)) > cfg.dsos.namelimit ||
                    d.properties.mag != 999 && d.properties.mag <= cfg.dsos.namelimit; 
           }))
           .enter().append("text")
           .attr("class", function(d) { return "dsoname " + d.properties.type; } )
           .attr("transform", function(d) { return point(d.geometry.coordinates); })
           .text( function(d) { return dsoName(d.properties); } )
           .attr({dy: "-.5em", dx: ".35em"})
           .attr("style", function(d) { return opacity(d.geometry.coordinates); });
      }
    });
  }

  if (this.data.length > 0) { 
    this.data.forEach( function(d) {
      if (has(d, "file")) d3.json(d.file, d.callback);
      else setTimeout(d.callback, 0);
    }, this);
  }
  
  d3.select(window).on('resize', resize);
  
  
  function resize() {
    if (cfg.width && cfg.width > 0) return;
    width = getWidth();
    height = width/ratio;
    var scale = proj.scale * width/1024;
    svg.attr("width", width).attr("height", height);
    zoom.scale([scale]);
    projection.translate([width/2, height/2]).scale([scale]);
    projOl.translate([width/2, height/2]);
    if (parent) parent.style.height = px(height);
    redraw();
  }
  
  // Exported objects and functions for adding data
  this.svg = svg;
  this.clip = clip;
  this.point = point;
  this.opacity = opacity;
  this.map = map;
  this.mapProjection = projection;
  this.resize = function() { resize(); }; 
  
  // Helper functions
  
  function clip(coords) {
    return proj.clip && d3.geo.distance(center, coords) > halfπ ? 0 : 1;
  }

  function point(coords) {
    return "translate(" + projection(coords) + ")";
  }
    
  function opacity(coords) {
    var opa = clip(coords);
    return 'stroke-opacity:' + opa + ';fill-opacity:' + opa; 
  }

  function redraw() {
    //if (!d3.event) return; 
    //d3.event.preventDefault();
    
    var rot = projection.rotate();
    projOl.scale(projection.scale());
    
    if (cfg.adaptable) adapt = Math.sqrt(projection.scale()/scale);
    base = cfg.stars.size * adapt;
    center = [-rot[0], -rot[1]];

    //All different types of objects need separate updates
    svg.selectAll(".outline").attr("d", outline);  

    svg.selectAll(".star")
       .attr("d", map.pointRadius( function(d) { return d.properties ? starSize(d.properties.mag) : 1; } ));
    
    svg.selectAll(".starname")   
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); }); 

    svg.selectAll(".dso")
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .attr("d", function(d) { return dsoSymbol(d.properties); })
       .attr("style", function(d) { return opacity(d.geometry.coordinates); });
    svg.selectAll(".dsoname")
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .attr("style", function(d) { return opacity(d.geometry.coordinates); });

    svg.selectAll(".constname")
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); });
    svg.selectAll(".constline").attr("d", map);  
    svg.selectAll(".boundaryline").attr("d", map);  

    svg.selectAll(".mw").attr("d", map);  
    svg.selectAll(".ecliptic").attr("d", map);  
    svg.selectAll(".equatorial").attr("d", map);  
    svg.selectAll(".galactic").attr("d", map);  
    svg.selectAll(".supergalactic").attr("d", map);  
    svg.selectAll(".gridline").attr("d", map);  
    
    if (Celestial.data.length > 0) { 
      Celestial.data.forEach( function(d) {
        d.redraw();
      });
    }
    
  }

  function dsoSymbol(prop) {
    var size = dsoSize(prop.mag, prop.dim) || 9,
        type = dsoShape(prop.type);
    if (d3.svg.symbolTypes.indexOf(type) !== -1) {
      return d3.svg.symbol().type(type).size(size)();
    } else {
      return d3.svg.customSymbol().type(type).size(size)();
    }
  }

  function dsoShape(type) {
    if (!type || !has(symbols, type)) return "circle"; 
    else return symbols[type]; 
  }

  function dsoSize(mag, dim) {
    if (!mag || mag == 999) return Math.pow(parseInt(dim)*base/7, 0.5); 
    return Math.pow(2*base-mag, 1.4);
  }
 

  function dsoName(prop) {
    if (prop.name === "") return; 
    if (cfg.dsos.desig && prop.desig) return prop.desig; 
    return prop.name;
  }
  
  function starName(prop) {
    if (cfg.stars.desig === false && prop.name === "") return; 
    if (cfg.stars.proper && prop.name !== "") return prop.name; 
    if (cfg.stars.desig)  return prop.desig; 
  }
  
  function starSize(mag) {
    if (mag === null) return 0.1; 
    var d = base * Math.exp(exp * (mag+2));
    return Math.max(d, 0.1);
  }
  
  function starColor(prop) {
    if (!cfg.stars.colors || isNaN(prop.bv)) {return cfg.stars.color; }
    return bvcolor(prop.bv);
  }
  
  function getWidth() {
    if (cfg.width && cfg.width > 0) return cfg.width;
    return parent ? parent.clientWidth - 16 : window.innerWidth - 24;
  }
  
  function getAngles(coords) {
    var rot = eulerAngles[trans], ctr = 0;
    if (!coords || trans !== 'equatorial') {
      if (trans === 'equatorial' || trans === 'ecliptic') ctr = 180;
      return [rot[0] - ctr, rot[1], rot[2]];
    }
    //ctr = transformDeg(coords, euler["inverse " + trans]);
    return [rot[0] - coords[0], rot[1] - coords[1], rot[2]];
  }
};


//Flipped projection generated on the fly
Celestial.projection = function(projection) {
  var p, trans, raw, forward;
  
  if (!has(projections, projection)) { throw new Error("Projection not supported: " + projection); }
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
  "equatorial": [0.0, 0.0, 0.0],
  "ecliptic": [0.0, 0.0, 23.4393],
  "galactic": [93.5949, 28.9362, -58.5988],
  "supergalactic": [137.3100, 59.5283, 57.7303]
//  "mars": [97.5,23.5,29]
};

var poles = {
  "equatorial": [0.0, 90.0],
  "ecliptic": [-90.0, 66.5607],
  "galactic": [-167.1405, 27.1283],
  "supergalactic": [-76.2458, 15.7089]
//  "mars": [-42.3186, 52.8865]
};

Celestial.eulerAngles = function() { return eulerAngles; };
Celestial.poles = function() { return poles; };


var τ = Math.PI*2,
    halfπ = Math.PI/2,
    deg2rad = Math.PI/180;

Celestial.graticule = function(svg, path, trans) {
  //d3.geo.circle graticule for coordinate spaces other than equatorial
  //circles center [0º,90º] / angle 10..170º and  center [0..180º,0º] / angle 90º

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

//Transform equatorial into any coordinates, degrees
function transformDeg(c, euler) {
  var res = transform( c.map( function(d) { return d * deg2rad; } ), euler);
  return res.map( function(d) { return d / deg2rad; } );
}

//Transform equatorial into any coordinates, radians
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
  "galactic": [-167.1405, 62.8717, 122.9319], 
  "inverse galactic": [122.9319, 62.8717, -167.1405],
  "supergalactic": [283.7542, 74.2911, 26.4504],
  "inverse supergalactic": [26.4504, 74.2911, 283.7542],
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


//Add more JSON data to the map

Celestial.add = function(dat) {
  var res = {};
  //dat: {file: path, type:'dso|line', callback: func(), redraw: func()} 
  //or {file:file, size:null, shape:null, color:null}  TBI
  //  with size,shape,color: "prop=val:result;.." || function(prop) { .. return res; } 
  if (!has(dat, "type")) return console.log("Missing type");
  
  if (dat.type === "dso" && (!has(dat, "file") || !has(dat, "callback"))) return console.log("Can't add data file");
  if (dat.type === "line" && !has(dat, "callback")) return console.log("Can't add line");
  
  if (has(dat, "file")) res.file = dat.file;
  res.type = dat.type;
  if (has(dat, "callback")) res.callback = dat.callback;
  if (has(dat, "redraw")) res.redraw = dat.redraw;
  Celestial.data.push(res);
};

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
    size: 7,       // Maximum size (radius) of star circle in pixels
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
      if (!has(this, prop)) continue; 
      if (typeof(this[prop]) === 'function') continue; 
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
  },
  'cross-circle': function(size) {
    var s = Math.sqrt(size), 
        r = s/2;
    return 'M' + (-r) + ',' + (-r) +
    ' m' + (-r) + ',0' +
    ' a' + r + ',' + r + ' 0 1,0' + (r * 2) + ',0' +
    ' a' + r + ',' + r + ' 0 1,0' + (-(r * 2)) + ',0' +
    ' M' + (-r) + ' 0 h ' + (s) + 
    ' M 0 ' + (-r) + ' v ' + (s);
        
  },
  'stroke-circle': function(size) {
    var s = Math.sqrt(size), 
        r = s/2;
    return 'M' + (-r) + ',' + (-r) +
    ' m' + (-r) + ',0' +
    ' a' + r + ',' + r + ' 0 1,0' + (r * 2) + ',0' +
    ' a' + r + ',' + r + ' 0 1,0' + (-(r * 2)) + ',0' +
    ' M' + (-s-2) + ',' + (-s-2) + ' l' + (s+4) + ',' + (s+4);

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




function $(id) { return document.getElementById(id); }
function px(n) { return n + "px"; } 
function Round(x, dg) { return(Math.round(Math.pow(10,dg)*x)/Math.pow(10,dg)); }
function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }

function has(o, key) { return o !== null && hasOwnProperty.call(o, key); }
function isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n); }
function isArray(o) { return Object.prototype.toString.call(o) === "[object Array]"; }
function isObject(o) { var type = typeof o;  return type === 'function' || type === 'object' && !!o; }
function isFunction(o) { return typeof o == 'function' || false; }


function attach(node, event, func) {
  if (node.addEventListener) node.addEventListener(event, func, false);
  else node.attachEvent("on" + event, func); 
}

function stopPropagation(e) {
  if (typeof e.stopPropagation != "undefined") e.stopPropagation();
  else e.cancelBubble = true;
}


// Copyright 2014, Jason Davies, http://www.jasondavies.com
// See LICENSE.txt for details.
(function() {

var radians = Math.PI / 180,
    degrees = 180 / Math.PI;

// TODO make incremental rotate optional

d3.geo.zoom = function() {
  var projection,
      duration;

  var zoomPoint,
      zooming = 0,
      event = d3_eventDispatch(zoom, "zoomstart", "zoom", "zoomend"),
      zoom = d3.behavior.zoom()
        .on("zoomstart", function() {
          var mouse0 = d3.mouse(this),
              rotate = quaternionFromEuler(projection.rotate()),
              point = position(projection, mouse0);
          if (point) zoomPoint = point;

          zoomOn.call(zoom, "zoom", function() {
                projection.scale(view.k = d3.event.scale);
                var mouse1 = d3.mouse(this),
                    between = rotateBetween(zoomPoint, position(projection, mouse1));
                projection.rotate(view.r = eulerFromQuaternion(rotate = between
                    ? multiply(rotate, between)
                    : multiply(bank(projection, mouse0, mouse1), rotate)));
                mouse0 = mouse1;
                zoomed(event.of(this, arguments));
              });
          zoomstarted(event.of(this, arguments));
        })
        .on("zoomend", function() {
          zoomOn.call(zoom, "zoom", null);
          zoomended(event.of(this, arguments));
        }),
      zoomOn = zoom.on,
      view = {r: [0, 0, 0], k: 1};

  zoom.rotateTo = function(location) {
    var between = rotateBetween(cartesian(location), cartesian([-view.r[0], -view.r[1]]));
    return eulerFromQuaternion(multiply(quaternionFromEuler(view.r), between));
  };

  zoom.projection = function(_) {
    if (!arguments.length) return projection;
    projection = _;
    view = {r: projection.rotate(), k: projection.scale()};
    return zoom.scale(view.k);
  };

  zoom.duration = function(_) {
    return arguments.length ? (duration = _, zoom) : duration;
  };

  zoom.event = function(g) {
    g.each(function() {
      var g = d3.select(this),
          dispatch = event.of(this, arguments),
          view1 = view,
          transition = d3.transition(g);
      if (transition !== g) {
        transition
            .each("start.zoom", function() {
              if (this.__chart__) { // pre-transition state
                view = this.__chart__;
              }
              projection.rotate(view.r).scale(view.k);
              zoomstarted(dispatch);
            })
            .tween("zoom:zoom", function() {
              var width = zoom.size()[0],
                  i = interpolateBetween(quaternionFromEuler(view.r), quaternionFromEuler(view1.r)),
                  d = d3.geo.distance(view.r, view1.r),
                  smooth = d3.interpolateZoom([0, 0, width / view.k], [d, 0, width / view1.k]);
              if (duration) transition.duration(duration(smooth.duration * .001)); // see https://github.com/mbostock/d3/pull/2045
              return function(t) {
                var uw = smooth(t);
                this.__chart__ = view = {r: eulerFromQuaternion(i(uw[0] / d)), k: width / uw[2]};
                projection.rotate(view.r).scale(view.k);
                zoom.scale(view.k);
                zoomed(dispatch);
              };
            })
            .each("end.zoom", function() {
              zoomended(dispatch);
            });
        try { // see https://github.com/mbostock/d3/pull/1983
          transition
              .each("interrupt.zoom", function() {
                zoomended(dispatch);
              });
        } catch (e) { console.log(e); }
      } else {
        this.__chart__ = view;
        zoomstarted(dispatch);
        zoomed(dispatch);
        zoomended(dispatch);
      }
    });
  };

  function zoomstarted(dispatch) {
    if (!zooming++) dispatch({type: "zoomstart"});
  }

  function zoomed(dispatch) {
    dispatch({type: "zoom"});
  }

  function zoomended(dispatch) {
    if (!--zooming) dispatch({type: "zoomend"});
  }

  return d3.rebind(zoom, event, "on");
};

function bank(projection, p0, p1) {
  var t = projection.translate(),
      angle = Math.atan2(p0[1] - t[1], p0[0] - t[0]) - Math.atan2(p1[1] - t[1], p1[0] - t[0]);
  return [Math.cos(angle / 2), 0, 0, Math.sin(angle / 2)];
}

function position(projection, point) {
  var spherical = projection.invert(point);
  return spherical && isFinite(spherical[0]) && isFinite(spherical[1]) && cartesian(spherical);
}

function quaternionFromEuler(euler) {
  var λ = .5 * euler[0] * radians,
      φ = .5 * euler[1] * radians,
      γ = .5 * euler[2] * radians,
      sinλ = Math.sin(λ), cosλ = Math.cos(λ),
      sinφ = Math.sin(φ), cosφ = Math.cos(φ),
      sinγ = Math.sin(γ), cosγ = Math.cos(γ);
  return [
    cosλ * cosφ * cosγ + sinλ * sinφ * sinγ,
    sinλ * cosφ * cosγ - cosλ * sinφ * sinγ,
    cosλ * sinφ * cosγ + sinλ * cosφ * sinγ,
    cosλ * cosφ * sinγ - sinλ * sinφ * cosγ
  ];
}

function multiply(a, b) {
  var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
      b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
  return [
    a0 * b0 - a1 * b1 - a2 * b2 - a3 * b3,
    a0 * b1 + a1 * b0 + a2 * b3 - a3 * b2,
    a0 * b2 - a1 * b3 + a2 * b0 + a3 * b1,
    a0 * b3 + a1 * b2 - a2 * b1 + a3 * b0
  ];
}

function rotateBetween(a, b) {
  if (!a || !b) return;
  var axis = cross(a, b),
      norm = Math.sqrt(dot(axis, axis)),
      halfγ = .5 * Math.acos(Math.max(-1, Math.min(1, dot(a, b)))),
      k = Math.sin(halfγ) / norm;
  return norm && [Math.cos(halfγ), axis[2] * k, -axis[1] * k, axis[0] * k];
}

// Interpolate between two quaternions (slerp).
function interpolateBetween(a, b) {
  var d = Math.max(-1, Math.min(1, dot(a, b))),
      s = d < 0 ? -1 : 1,
      θ = Math.acos(s * d),
      sinθ = Math.sin(θ);
  return sinθ ? function(t) {
    var A = s * Math.sin((1 - t) * θ) / sinθ,
        B = Math.sin(t * θ) / sinθ;
    return [
      a[0] * A + b[0] * B,
      a[1] * A + b[1] * B,
      a[2] * A + b[2] * B,
      a[3] * A + b[3] * B
    ];
  } : function() { return a; };
}

function eulerFromQuaternion(q) {
  return [
    Math.atan2(2 * (q[0] * q[1] + q[2] * q[3]), 1 - 2 * (q[1] * q[1] + q[2] * q[2])) * degrees,
    Math.asin(Math.max(-1, Math.min(1, 2 * (q[0] * q[2] - q[3] * q[1])))) * degrees,
    Math.atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] * q[2] + q[3] * q[3])) * degrees
  ];
}

function cartesian(spherical) {
  var λ = spherical[0] * radians,
      φ = spherical[1] * radians,
      cosφ = Math.cos(φ);
  return [
    cosφ * Math.cos(λ),
    cosφ * Math.sin(λ),
    Math.sin(φ)
  ];
}

function dot(a, b) {
  for (var i = 0, n = a.length, s = 0; i < n; ++i) s += a[i] * b[i];
  return s;
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

// Like d3.dispatch, but for custom events abstracting native UI events. These
// events have a target component (such as a brush), a target element (such as
// the svg:g element containing the brush) and the standard arguments `d` (the
// target element's data) and `i` (the selection index of the target element).
function d3_eventDispatch(target) {
  var i = 0,
      n = arguments.length,
      argumentz = [];

  while (++i < n) argumentz.push(arguments[i]);

  var dispatch = d3.dispatch.apply(null, argumentz);

  // Creates a dispatch context for the specified `thiz` (typically, the target
  // DOM element that received the source event) and `argumentz` (typically, the
  // data `d` and index `i` of the target element). The returned function can be
  // used to dispatch an event to any registered listeners; the function takes a
  // single argument as input, being the event to dispatch. The event must have
  // a "type" attribute which corresponds to a type registered in the
  // constructor. This context will automatically populate the "sourceEvent" and
  // "target" attributes of the event, as well as setting the `d3.event` global
  // for the duration of the notification.
  dispatch.of = function(thiz, argumentz) {
    return function(e1) {
      try {
        var e0 =
        e1.sourceEvent = d3.event;
        e1.target = target;
        d3.event = e1;
        dispatch[e1.type].apply(thiz, argumentz);
      } finally {
        d3.event = e0;
      }
    };
  };

  return dispatch;
}

})();
this.Celestial = Celestial;
})();