// Copyright 2015 Olaf Frohn https://github.com/ofrohn, see LICENSE
!(function() {
var Celestial = {
  version: '0.5.0',
  container: null,
  data: []
};

var cfg, projection, projOl, zoom, map, outline;

// Show it all, with the given config, otherwise with default settings
Celestial.display = function(config) {
  var circle, par, container = Celestial.container;
  
  //Mash config with default settings
  cfg = settings.set(config); 
  cfg.stars.size = cfg.stars.size || 7;  // Nothing works without these
  cfg.center = cfg.center || [0,0];      
  
  var parent = $(cfg.container);
  if (parent) { 
    par = "#"+cfg.container;
    var st = window.getComputedStyle(parent, null);
    //parent.style.width = stl.width;
    if (!parseInt(st.width) && !cfg.width) parent.style.width = px(window.innerWidth);    
  } else { 
    par = "body"; 
    parent = null; 
  }
  
  if (!has(projections, cfg.projection)) return; 
  
  var proj = projections[cfg.projection],
      trans = cfg.transform || "equatorial",
      ratio = proj.ratio || 2,
      margin = [16,16],
      width = getWidth(),
      height = width / ratio,
      scale = proj.scale * width/1024, // Projection dependent scale prop. to width
      base = cfg.stars.size, 
      exp = -0.28, //Object size base & exponent
      adapt = 1,
      rotation = getAngles(cfg.center),
      center = [-rotation[0], -rotation[1]],
      path = cfg.datapath || "";
      path = path.replace(/([^\/]$)/, "$1\/");
  
      
  if (par != "body") $(cfg.container).style.height = px(height);
  
  projection = Celestial.projection(cfg.projection).rotate(rotation).translate([width/2, height/2]).scale([scale]);
  projOl = Celestial.projection(cfg.projection).translate([width/2, height/2]).scale([scale]); //projected non moving outline
  
  if (proj.clip) {
    projection.clipAngle(90);
    circle = d3.geo.circle().angle([90]);
  }
  
  zoom = d3.geo.zoom().projection(projection).center([width/2, height/2]).scaleExtent([scale, scale*5]).on("zoom.redraw", redraw);

  var canvas = d3.selectAll("canvas");
  if (canvas[0].length === 0) canvas = d3.select(par).append("canvas");
  canvas.attr("width", width).attr("height", height);
  var context = canvas.node().getContext("2d");  
  
  var graticule = d3.geo.graticule().minorStep([15,10]);
  
  map = d3.geo.path().projection(projection).context(context);
  outline = d3.geo.path().projection(projOl).context(context);
   
  //parent div with id #map or body
  if (container) container.selectAll("*").remove();
  else container = d3.select(par).append("container");

  if (cfg.interactive) canvas.call(zoom);
  else canvas.attr("style", "cursor: default!important");
  
  if (circle) {
    container.append("path").datum(circle).attr("class", "outline"); 
  } else {
    container.append("path").datum(graticule.outline).attr("class", "outline"); 
  }

  //Celestial planes
  for (var key in cfg.lines) {
    if (!has(cfg.lines, key)) continue;
    if (key === "graticule"/* || cfg.lines[key].show === false*/) {
      container.append("path").datum(graticule).attr("class", "graticule"); 
    } else {
    container.append("path")
      .datum(d3.geo.circle().angle([90]).origin(transformDeg(poles[key], euler[trans])) )
      .attr("class", key);
    }
  }
  
  //Milky way outline
  d3.json(path + "mw.json", function(error, json) {
    if (error) { 
      window.alert("Your Browser doesn't support local file loading or the file doesn't exist. See readme.md");
      return console.warn(error);  
    }

    var mw = getData(json, trans);

    container.selectAll(".mway")
       .data(mw.features)
       .enter().append("path")
       .attr("class", "mw");
    redraw();
  }); 

  //Constellation names or designation
  d3.json(path + "constellations.json", function(error, json) {
    if (error) return console.warn(error);
    
    var con = getData(json, trans);
    
    container.selectAll(".constnames")
       .data(con.features)
       .enter().append("text")
       .attr("class", "constname");
    redraw();
  });

  //Constellation boundaries
  d3.json(path + "constellations.bounds.json", function(error, json) {
    if (error) return console.warn(error);

    var conb = getData(json, trans);

    container.selectAll(".bounds")
       .data(conb.features)
       .enter().append("path")
       .attr("class", "boundaryline");
    redraw();
  });

  //Constellation lines
  d3.json(path + "constellations.lines.json", function(error, json) {
    if (error) return console.warn(error);

    var conl = getData(json, trans);

    container.selectAll(".lines")
       .data(conl.features)
       .enter().append("path")
       .attr("class", "constline");
    redraw();
  });
  
  //Stars
  d3.json(path + cfg.stars.data, function(error, json) {
    if (error) return console.warn(error);

    var st = getData(json, trans);

    container.selectAll(".stars")
       .data(st.features)
       .enter().append("path")
       .attr("class", "star");

    redraw();
  });

  //Deep space objects
  d3.json(path + cfg.dsos.data, function(error, json) {
    if (error) return console.warn(error);
    
    var ds = getData(json, trans);

    container.selectAll(".dsos")
       .data(ds.features)
       .enter().append("path")
       .attr("class", "dso" );

    redraw();
  });

  if (this.data.length > 0) { 
    this.data.forEach( function(d) {
      if (has(d, "file")) d3.json(d.file, d.callback);
      else setTimeout(d.callback, 0);
    }, this);
  }
    
  d3.select(window).on('resize', resize);

  if (cfg.controls === true && $("zoomin") === null) {
    d3.select(par).append("input").attr("type", "button").attr("id", "zoomin").attr("value", "\u002b").on("click", function() { zoomBy(1.111); });
    d3.select(par).append("input").attr("type", "button").attr("id", "zoomout").attr("value", "\u2212").on("click", function() { zoomBy(0.9); });
  }
  
  if (cfg.form === true && $("params") === null) form(cfg);

  
  function zoomBy(factor) {
    var scale = projection.scale() * factor; 
    projection.scale([scale]); 
    zoom.scale([scale]); 
    redraw(); 
  }  
  
  function apply(config) {
    cfg = settings.set(config); 
    redraw();
  }


  function rotate(config) {
    cfg = settings.set(config);
    var rot = projection.rotate();
    rotation = getAngles(cfg.center);
    rotation[2] = rot[2];
    center = [-rotation[0], -rotation[1]];
    projection.rotate(rotation);
    redraw();
  }
  
  function resize() {
    if (cfg.width && cfg.width > 0) return;
    width = getWidth();
    height = width/ratio;
    var scale = proj.scale * width/1024;
    canvas.attr("width", width).attr("height", height);
    zoom.scale([scale]);
    projection.translate([width/2, height/2]).scale([scale]);
    projOl.translate([width/2, height/2]);
    if (parent) parent.style.height = px(height);
    redraw();
  }
  
  function redraw() {  
    var rot = projection.rotate();
    projOl.scale(projection.scale());
    
    if (cfg.adaptable) adapt = Math.sqrt(projection.scale()/scale);
    base = cfg.stars.size * adapt;
    center = [-rot[0], -rot[1]];
    
    setCenter(center, cfg.transform);
    clear();
    
    setStyle(cfg.background);
    container.selectAll(".outline").attr("d", outline);      
    context.fill();
    
    //Draw all types of objects on the canvas
    if (cfg.mw.show) { 
      container.selectAll(".mw").each(function(d) { setStyle(cfg.mw.style); map(d); context.fill(); });
    }
    
    for (var key in cfg.lines) {
      if (!has(cfg.lines, key)) continue;
      if (cfg.lines[key].show !== true) continue;
      setStyle(cfg.lines[key]);
      container.selectAll("."+key).attr("d", map);  
      context.stroke();    
    }

    if (cfg.constellations.names) { 
      setTextStyle(cfg.constellations.namestyle);
      container.selectAll(".constname").each( function(d) { 
        if (clip(d.geometry.coordinates)) {
          var pt = projection(d.geometry.coordinates);
          context.fillText(constName(d), pt[0], pt[1]); 
        }
      });
    }

    if (cfg.constellations.lines) { 
      container.selectAll(".constline").each(function(d) { setStyle(cfg.constellations.linestyle); map(d); context.stroke(); });
    }
    
    if (cfg.constellations.bounds) { 
      container.selectAll(".boundaryline").each(function(d) { setStyle(cfg.constellations.boundstyle); map(d); context.stroke(); });
    }
    
    if (cfg.stars.show) { 
      setStyle(cfg.stars.style);
      container.selectAll(".star").each(function(d) {
        if (clip(d.geometry.coordinates) && d.properties.mag <= cfg.stars.limit) {
          var pt = projection(d.geometry.coordinates),
              r = starSize(d);
          context.fillStyle = starColor(d); 
          context.beginPath();
          context.arc(pt[0], pt[1], r, 0, 2 * Math.PI);
          context.closePath();
          context.fill();
          if (cfg.stars.names && d.properties.mag <= cfg.stars.namelimit*adapt) {
            setTextStyle(cfg.stars.namestyle);
            context.fillText(starName(d), pt[0]+r, pt[1]+r);         
          }
        }
      });
    }
    
    if (cfg.dsos.show) { 
      container.selectAll(".dso").each(function(d) {
        if (clip(d.geometry.coordinates) && dsoDisplay(d.properties, cfg.dsos.limit)) {
          var node = d3.select(this),
              pt = projection(d.geometry.coordinates),
              type = d.properties.type;
          setStyle(cfg.dsos.symbols[type]);
          var r = dsoSymbol(d, pt);
          if (has(cfg.dsos.symbols[type], "stroke")) context.stroke();
          else context.fill();
          
          if (cfg.dsos.names && dsoDisplay(d.properties, cfg.dsos.namelimit)) {
            setTextStyle(cfg.dsos.namestyle);
            context.fillStyle = cfg.dsos.symbols[type].fill;
            context.fillText(dsoName(d), pt[0]+r, pt[1]+r);         
          }         
        }
      });
    }
    
    if (Celestial.data.length > 0) { 
      Celestial.data.forEach( function(d) {
        d.redraw();
      });
    }
    setStyle(cfg.background);
    container.selectAll(".outline").attr("d", outline);      
    context.stroke();
    
    if (cfg.controls) { 
      zoomState(projection.scale());
    }
  }
    
  // Exported objects and functions for adding data
  this.container = container;
  this.clip = clip;
  this.map = map;
  this.mapProjection = projection;
  this.resize = function() { resize(); }; 
  this.apply = function(config) { apply(config); }; 
  this.rotate = function(config) { rotate(config); }; 
  
  // Helper functions -------------------------------------------------
  
  function clip(coords) {
    return proj.clip && d3.geo.distance(center, coords) > halfπ ? 0 : 1;
  }

  function setStyle(s) {
    context.fillStyle = s.fill;
    context.strokeStyle = s.stroke || null;
    context.lineWidth = s.width || null;
    context.globalAlpha = s.opacity || 1;  
    context.font = s.font;
    if (has(s, "dash")) context.setLineDash(s.dash); else context.setLineDash([]);
    context.beginPath();
  }

  function setTextStyle(s) {
    context.fillStyle = s.fill;
    context.textAlign = s.align || "left";
    context.textBaseline = s.baseline || "bottom";
    context.globalAlpha = s.opacity || 1;  
    context.font = s.font;
  }
    
  function zoomState(sc) {
    $("zoomin").disabled = sc > scale*4.5;
    $("zoomout").disabled = sc < scale*1.111;    
  }
  
  function dsoDisplay(prop, limit) {
    return prop.mag === 999 && Math.sqrt(parseInt(prop.dim)) > limit ||
           prop.mag !== 999 && prop.mag <= limit;
  }
  
  function dsoSymbol(d, pt) {
    var prop = d.properties;
    var size = dsoSize(prop) || 9,
        type = dsoShape(prop.type);
    Canvas.symbol().type(type).size(size).position(pt)(context);
    return Math.sqrt(size)/2;
  }

  function dsoShape(type) {
    if (!type || !has(cfg.dsos.symbols, type)) return "circle"; 
    else return cfg.dsos.symbols[type].shape; 
  }

  function dsoSize(prop) {
    if (!prop.mag || prop.mag == 999) return Math.pow(parseInt(prop.dim) * base / 7, 0.5); 
    return Math.pow(2 * base-prop.mag, 1.4);
  }
 

  function dsoName(d) {
    var prop = d.properties;
    if (prop.name === "") return; 
    if (cfg.dsos.desig && prop.desig) return prop.desig; 
    return prop.name;
  }
  
  /*n=true, p=false, d=false non-hd/hip desig
            p=true,  d=false proper name || non-hd/hip desig
            p=false, d=true  any desig
            p=true,  d=true  proper name || any desig  */
  function starName(d) {
    var name = d.properties.desig;
    if (cfg.stars.proper && d.properties.name !== "") name = d.properties.name;
    if (!cfg.stars.desig) return name.replace(/^H(D|IP).+/, ""); 
    
    return name; 
  }
  
  function starSize(d) {
    var mag = d.properties.mag;
    if (mag === null) return 0.1; 
    var r = base * Math.exp(exp * (mag+2));
    return Math.max(r, 0.1);
  }
  
  function starColor(d) {
    var bv = d.properties.bv;
    if (!cfg.stars.colors || isNaN(bv)) {return cfg.stars.style.fill; }
    return bvcolor(bv);
  }
  
  function constName(d) { 
    return cfg.constellations.desig ? d.properties.desig : d.properties.name; 
  }
  
  function clear() {
    context.clearRect(0,0,width+margin[0],height+margin[1]);
  }
  
  function getWidth() {
    if (cfg.width && cfg.width > 0) return cfg.width;
    if (parent && parent.style.width !== "" && parent.style.width !== "100%") return parent.clientWidth - margin[0];
    return window.innerWidth - margin[0]*2;
  }
  
  function getAngles(coords) {
    if (coords === null) return [0,0];
    var rot = eulerAngles.equatorial; //, rp = projection.rotate(); //, ctr = 0;
    //if (!coords || trans !== 'equatorial') {
      //if (trans === 'equatorial' || trans === 'ecliptic') ctr = 180;
      //return [rot[0], rot[1], rot[2]];
    //}
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

//load data and transform coordinates

function getData(d, trans) {
  if (trans === "equatorial") return d;

  var leo = euler[trans],
      coll = d.features;

  for (var i=0; i<coll.length; i++)
    coll[i].geometry.coordinates = translate(coll[i], leo);
  
  return d;
}

function translate(d, leo) {
  var res = [];
  switch (d.geometry.type) {
    case "Point": res = transformDeg(d.geometry.coordinates, leo); break;
    case "LineString": res.push(transLine(d.geometry.coordinates, leo)); break;
    case "MultiLineString": res = transMultiLine(d.geometry.coordinates, leo); break;
    case "Polygon": res.push(transLine(d.geometry.coordinates[0], leo)); break;
    case "MultiPolygon": res.push(transMultiLine(d.geometry.coordinates[0], leo)); break;
  }
  
  return res;
}

function transLine(c, leo) {
  var line = [];
  
  for (var i=0; i<c.length; i++)
    line.push(transformDeg(c[i], leo));
  
  return line;
}

function transMultiLine(c, leo) {
  var lines = [];
  
  for (var i=0; i<c.length; i++)
    lines.push(transLine(c[i], leo));
  
  return lines;
}



//Defaults
var settings = { 
  width: 0,     // Default width; height is determined by projection
  projection: "aitoff",  // Map projection used: airy, aitoff, armadillo, august, azimuthalEqualArea, azimuthalEquidistant, baker, berghaus, boggs, bonne, bromley, collignon, craig, craster, cylindricalEqualArea, cylindricalStereographic, eckert1, eckert2, eckert3, eckert4, eckert5, eckert6, eisenlohr, equirectangular, fahey, foucaut, ginzburg4, ginzburg5, ginzburg6, ginzburg8, ginzburg9, gringorten, hammer, hatano, healpix, hill, homolosine, kavrayskiy7, lagrange, larrivee, laskowski, loximuthal, mercator, miller, mollweide, mtFlatPolarParabolic, mtFlatPolarQuartic, mtFlatPolarSinusoidal, naturalEarth, nellHammer, orthographic, patterson, polyconic, rectangularPolyconic, robinson, sinusoidal, stereographic, times, twoPointEquidistant, vanDerGrinten, vanDerGrinten2, vanDerGrinten3, vanDerGrinten4, wagner4, wagner6, wagner7, wiechel, winkel3
  transform: "equatorial", // Coordinate transformation: equatorial (default), ecliptic, galactic, supergalactic
  center: null,       // Initial center coordinates in equatorial transformation only [hours, degrees], null = default center
  background: { fill: "#000000", stroke: "#000000", opacity: 1 }, // Background style
  adaptable: true,    // Sizes are increased with higher zoom-levels
  interactive: true,  // Enable zooming and rotation with mousewheel and dragging
  form: false,        // Display settings form
  controls: true,      // Display zoom controls
  container: "map",   // ID of parent element, e.g. div
  datapath: "data/",  // Path/URL to data files, empty = subfolder 'data'
  stars: {
    show: true,    // Show stars
    limit: 6,      // Show only stars brighter than limit magnitude
    colors: true,  // Show stars in spectral colors, if not use fill-style
    style: { fill: "#ffffff", opacity: 1 }, // Default style for stars
    names: true,   // Show star names (Bayer, Flamsteed, Variable star, Gliese, whichever applies first)
    proper: false, // Show proper name (if present)
    desig: false,   // Show all names, including Draper and Hipparcos
    namestyle: { fill: "#ddddbb", font: "11px Georgia, Times, 'Times Roman', serif", align: "left", baseline: "top" },
    namelimit: 2.5,  // Show only names for stars brighter than namelimit
    size: 7,       // Maximum size (radius) of star circle in pixels
    data: "stars.6.json" // Data source for stellar data
  },
  dsos: {
    show: true,    // Show Deep Space Objects 
    limit: 6,      // Show only DSOs brighter than limit magnitude
    names: true,   // Show DSO names
    desig: true,   // Show short DSO names
    namestyle: { fill: "#cccccc", font: "11px Helvetica, Arial, serif", align: "left", baseline: "top" },
    namelimit: 4,  // Show only names for DSOs brighter than namelimit
    data: "dsos.bright.json",  // Data source for DSOs
    symbols: {  //DSO symbol styles
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
      rn: {shape: "square", fill: "#00ooff"},                                 // Reflection nebula
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
    namestyle: { fill:"#cccc99", font: "12px Helvetica, Arial, sans-serif", align: "center", baseline: "middle" },
    lines: true,   // Show constellation lines 
    linestyle: { stroke: "#cccccc", width: 1.5, opacity: 0.6 },
    bounds: false,  // Show constellation boundaries 
    boundstyle: { stroke: "#ccff00", width: 1, opacity: 0.8, dash: [2, 4] }
  },
  mw: {
    show: true,    // Show Milky Way as filled polygons 
    style: { fill: "#ffffff", opacity: "0.15" }
  },
  lines: {
    graticule: { show: true, stroke: "#cccccc", width: 0.6, opacity: 0.8 },     // Show graticule lines 
    equatorial: { show: true, stroke: "#aaaaaa", width: 1.3, opacity: 0.7 },    // Show equatorial plane 
    ecliptic: { show: true, stroke: "#66cc66", width: 1.3, opacity: 0.7 },      // Show ecliptic plane 
    galactic: { show: false, stroke: "#cc6666", width: 1.3, opacity: 0.7 },     // Show galactic plane 
    supergalactic: { show: false, stroke: "#cc66cc", width: 1.3, opacity: 0.7 } // Show supergalactic plane 
   //mars: { show: false, stroke:"#cc0000", width:1.3, opacity:.7 }
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
  "airy": {n:"Airy’s Minimum Error", arg:Math.PI/2, scale:360, ratio:1.0, clip:true},
  "aitoff": {n:"Aitoff", arg:null, scale:162},
  "armadillo": {n:"Armadillo", arg:0, scale:250}, 
  "august": {n:"August", arg:null, scale:94, ratio:1.4},
  "azimuthalEqualArea": {n:"Azimuthal Equal Area", arg:null, scale:340, ratio:1.0, clip:true},
  "azimuthalEquidistant": {n:"Azimuthal Equidistant", arg:null, scale:320, ratio:1.0, clip:true},
  "baker": {n:"Baker Dinomic", arg:null, scale:160, ratio:1.4},
  "berghaus": {n:"Berghaus Star", arg:1, scale:320, ratio:1.0, clip:true},
  "boggs": {n:"Boggs Eumorphic", arg:null, scale:170},
  "bonne": {n:"Bonne", arg:Math.PI/4, scale:230, ratio:0.88},
  "bromley": {n:"Bromley", arg:null, scale:162},
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
  "homolosine": {n:"Goode Homolosine", arg:null, scale:160, ratio:2.2},
  "hammer": {n:"Hammer", arg:2, scale:180},
  "hatano": {n:"Hatano", arg:null, scale:186},
  "healpix": {n:"HEALPix", arg:1, scale:320, ratio:1.2},
  "hill": {n:"Hill Eucyclic", arg:2, scale:195, ratio:1.5},
  "kavrayskiy VII": {n:"Kavrayskiy 7", arg:null, scale:185, ratio:1.75},
  "lagrange": {n:"Lagrange", arg:Math.PI/4, scale:88, ratio:2, clip:false},
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

Celestial.projections = function() { return projections; };


var Canvas = {}; 

Canvas.symbol = function() {
  // parameters and default values
  var type = d3.functor("circle"), 
      size = d3.functor(64), 
      color = d3.functor("#fff"),  
      text = d3.functor(""),  
      padding = d3.functor([2,2]),  
      pos;
  
  function canvas_symbol(context) {
    draw_symbol[type()](context);
  }
  
  var draw_symbol = {
    "circle": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/2;
      ctx.arc(pos[0], pos[1], r, 0, 2 * Math.PI);
      return r;
    },
    "square": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/2;
      ctx.moveTo(pos[0]-r, pos[1]-r);
      ctx.lineTo(pos[0]+r, pos[1]-r);
      ctx.lineTo(pos[0]+r, pos[1]+r);
      ctx.lineTo(pos[0]-r, pos[1]+r);
      ctx.closePath();
      return r;
    },
    "diamond": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/2;
      ctx.moveTo(pos[0], pos[1]-r);
      ctx.lineTo(pos[0]+r, pos[1]);
      ctx.lineTo(pos[0], pos[1]+r);
      ctx.lineTo(pos[0]-r, pos[1]);
      ctx.closePath();
      return r;
    },
    "ellipse": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/2;
      ctx.save();
      ctx.translate(pos[0], pos[1]);
      ctx.scale(1.6, 0.8); 
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 2 * Math.PI); 
      ctx.closePath();
      ctx.restore();      
      return r;
    },
    "marker": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/2;
      ctx.moveTo(pos[0], pos[1]-s);
      ctx.lineTo(pos[0], pos[1]+s);
      ctx.moveTo(pos[0]-s, pos[1]);
      ctx.lineTo(pos[0]+s, pos[1]);
      ctx.closePath();
      return r;
    },
    "cross-circle": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/2;
      ctx.moveTo(pos[0], pos[1]-s);
      ctx.lineTo(pos[0], pos[1]+s);
      ctx.moveTo(pos[0]-s, pos[1]);
      ctx.lineTo(pos[0]+s, pos[1]);
      ctx.moveTo(pos[0], pos[1]);
      ctx.arc(pos[0], pos[1], r, 0, 2 * Math.PI);    
      ctx.closePath();
      return r;
    },
    "stroke-circle": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/2;
      ctx.moveTo(pos[0], pos[1]-s);
      ctx.lineTo(pos[0], pos[1]+s);
      ctx.moveTo(pos[0], pos[1]);
      ctx.arc(pos[0], pos[1], r, 0, 2 * Math.PI);    
      ctx.closePath();
      return r;
    } 
  };

  
  canvas_symbol.type = function(_) {
    if (!arguments.length) return type; 
    type = d3.functor(_);
    return canvas_symbol;
  };
  canvas_symbol.size = function(_) {
    if (!arguments.length) return size; 
    size = d3.functor(_);
    return canvas_symbol;
  };
  canvas_symbol.text = function(_) {
    if (!arguments.length) return text; 
    text = d3.functor(_);
    return canvas_symbol;
  };
  canvas_symbol.position = function(_) {
    if (!arguments.length) return; 
    pos = _;
    return canvas_symbol;
  };

  return canvas_symbol;
};




/*var color = "#fff", angle = 0, align = "center", baseline = "middle", font = "10px sans-serif", padding = [0,0], aPos, sText;

canvas.text = function() {

  function txt(ctx){
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    
    //var pt = projection(d.geometry.coordinates);
    if (angle) {
      canvas.save();     
      canvas.translate(aPos[0], aPos[1]);
      canvas.rotate(angle); 
      canvas.fillText(sText, 0, 0);
      canvas.restore();     
    } else
      canvas.fillText(sText, aPos[0], aPos[1]);
  }
  
  txt.angle = function(x) {
    if (!arguments.length) return angle * 180 / Math.PI;
    color = x  * Math.PI / 180;
    return txt;
  };  
  txt.color = function(s) {
    if (!arguments.length) return color;
    color = s;
    return txt;
  };  
  txt.align = function(s) {
    if (!arguments.length) return align;
    align = s;
    return txt;
  };
  txt.baseline = function(s) {
    if (!arguments.length) return baseline;
    baseline = s;
    return txt;
  };
  txt.padding = function(a) {
    if (!arguments.length) return padding;
    padding = a;
    return txt;
  };
  txt.text = function(s) {
    if (!arguments.length) return sText;
    sText = s;
    return txt;
  };
  txt.font = function(s) {
    if (!arguments.length) return font;
    font = s;
    return txt;
  };
  txt.style = function(o) {
    if (!arguments.length) return;
    if (o.fill) color = o.fill;
    if (o.font) font = o.font;
    return txt;
  }; 
  
}

  function ctxPath(d) {
    var pt;
    //d.map( function(axe, i) {
    context.beginPath();
    for (var i = 0; i < d.length; i++) {
      pt = projection(d[i]);
      if (i === 0)
        context.moveTo(pt[0], pt[1]);
      else
        context.lineTo(pt[0], pt[1]);
    }
    context.fill();
  }
  

  function ctxText(d, ang) {
    var pt = projection(d.geometry.coordinates);
    if (ang) {
      canvas.save();     
      canvas.translate(pt[0], pt[1]);
      canvas.rotate(Math.PI/2); 
      canvas.fillText(txt, 0, 0);
      canvas.restore();     
    } else
      canvas.fillText(d.properties.txt, pt[0], pt[1]);
  }
  

*/

function $(id) { return document.getElementById(id); }
function px(n) { return n + "px"; } 
function Round(x, dg) { return(Math.round(Math.pow(10,dg)*x)/Math.pow(10,dg)); }
function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }

function has(o, key) { return o !== null && hasOwnProperty.call(o, key); }
function when(o, key, val) { return o !== null && hasOwnProperty.call(o, key) ? o[key] : val; }
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



//display settings form

//test with onchange and set cfg
function form(cfg) {
  var prj = Celestial.projections(), leo = Celestial.eulerAngles();
  var ctrl = d3.select("#form").append("div").attr("class", "ctrl");
  var frm = ctrl.append("form").attr("id", "params").attr("name", "params").attr("method", "get").attr("action" ,"#");
  
  //Map parameters    
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("title", "Map width, 0 indicates full width").attr("for", "width").html("Width ");
  col.append("input").attr("type", "number").attr("maxlength", "4").attr("max", "9999").attr("min", "0").attr("title", "Map width").attr("id", "width").attr("value", cfg.width).on("change", redraw);
  col.append("span").html("px");

  col.append("label").attr("title", "Map projection, (hemi) indicates hemispherical projection").attr("for", "projection").html("Projection");
  var sel = col.append("select").attr("id", "projection").on("change", redraw);
  var selected = 0;
  var list = Object.keys(prj).map( function (key, i) { 
    var n = prj[key].clip && prj[key].clip === true ? prj[key].n + " (hemi)" : prj[key].n; 
    if (key === cfg.projection) selected = i;
    return {o:key, n:n};
  });
  sel.selectAll('option').data(list).enter().append('option')
     .attr("value", function (d) { return d.o; })
     .text(function (d) { return d.n; });
  sel.property("selectedIndex", selected);
  
  selected = 0;
  col.append("label").attr("title", "Coordinate space in which the map is displayed").attr("for", "transform").html("Coordinates");
  sel = col.append("select").attr("id", "transform").on("change", redraw);
  list = Object.keys(leo).map(function (key, i) {
    if (key === cfg.transform) selected = i;    
    return {o:key, n:key.replace(/^([a-z])/, function(s, m) { return m.toUpperCase(); } )}; 
  });
  sel.selectAll("option").data(list).enter().append('option')
     .attr("value", function (d) { return d.o; })
     .text(function (d) { return d.n; });
  sel.property("selectedIndex", selected);
  col.append("br");
  
  col.append("label").attr("title", "Center coordinates long/lat in selected coordinate space").attr("for", "centerx").html("Center");
  col.append("input").attr("type", "number").attr("id", "centerx").attr("title", "Center right ascension/lngitude").attr("max", "24").attr("min", "0").attr("step", "0.1").on("change", turn);
  col.append("span").attr("id", "cxunit").html("h");
  
  col.append("input").attr("type", "number").attr("id", "centery").attr("title", "Center declination/latitude").attr("max", "90").attr("min", "-90").attr("step", "0.1").on("change", turn);
  col.append("span").html("\u00b0");
  
  setCenter(cfg.center, cfg.transform);
  
  col.append("input").attr("type", "button").attr("id", "show").attr("value", "Show");
  //col.append("input").attr("type", "button").attr("id", "defaults").attr("value", "Defaults");

  // Stars 
  col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("class", "header").attr("for", "stars-show").html("Stars");
  col.append("input").attr("type", "checkbox").attr("id", "stars-show").property("checked", cfg.stars.show).on("change", apply);
  
  col.append("label").attr("for", "stars-limit").html("down to magnitude");
  col.append("input").attr("type", "number").attr("id", "stars-limit").attr("title", "Star display limit").attr("value", cfg.stars.limit).attr("max", "6").attr("min", "-1").attr("step", "0.1").on("change", apply);
  
  col.append("label").attr("for", "stars-colors").html("with spectral colors");
  col.append("input").attr("type", "checkbox").attr("id", "stars-colors").property("checked", cfg.stars.colors).on("change", apply);
  
  col.append("label").attr("for", "stars-color").html("or default color ");
  col.append("input").attr("type", "color").attr("id", "stars-style-fill").property("value", cfg.stars.style.fill).on("change", apply);
  col.append("br");
  
  col.append("label").attr("for", "stars-names").html("Show names");
  col.append("input").attr("type", "checkbox").attr("id", "stars-names").on("change", apply);
  
  col.append("label").attr("for", "stars-proper").html("proper names (if any)");
  col.append("input").attr("type", "checkbox").attr("id", "stars-proper").property("checked", cfg.stars.proper).on("change", apply);
  
  col.append("label").attr("for", "stars-desig").attr("title", "include HD/HIP designations").html("all designations");
  col.append("input").attr("type", "checkbox").attr("id", "stars-desig").property("checked", cfg.stars.desig).on("change", apply);
  
  col.append("label").attr("for", "stars-namelimit").html("down to mag");
  col.append("input").attr("type", "number").attr("id", "stars-namelimit").attr("title", "Star name display limit").attr("value", cfg.stars.namelimit).attr("max", "6").attr("min", "-1").attr("step", "0.1").on("change", apply);

  enable($("stars-show"));
  
  // DSOs 
  col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("class", "header").attr("title", "Deep Space Objects").attr("for", "dsos-show").html("DSOs");
  col.append("input").attr("type", "checkbox").attr("id", "dsos-show").property("checked", cfg.dsos.show).on("change", apply);
  
  col.append("label").attr("for", "dsos-limit").html("down to mag");
  col.append("input").attr("type", "number").attr("id", "dsos-limit").attr("title", "DSO display limit").attr("value", cfg.dsos.limit).attr("max", "6").attr("min", "0").attr("step", "0.1").on("change", apply);
  
  col.append("label").attr("for", "dsos-names").html("with names");
  col.append("input").attr("type", "checkbox").attr("id", "dsos-names").property("checked", cfg.dsos.names).on("change", apply);
  
  col.append("label").attr("for", "dsos-desig").html("or designations");
  col.append("input").attr("type", "checkbox").attr("id", "dsos-desig").property("checked", cfg.dsos.desig).on("change", apply);
  
  col.append("label").attr("for", "dsos-namelimit").html("down to mag");
  col.append("input").attr("type", "number").attr("id", "dsos-namelimit").attr("title", "DSO name display limit").attr("value", cfg.dsos.namelimit).attr("max", "6").attr("min", "0").attr("step", "0.1").on("change", apply);

  enable($("dsos-show"));

  // Constellations 
  col = frm.append("div").attr("class", "col");
  col.append("label").attr("class", "header").html("Constellations");
  //col.append("input").attr("type", "checkbox").attr("id", "constellations-show").property("checked", cfg.constellations.show).on("change", apply);
  
  col.append("label").attr("for", "constellations-names").html("Show names");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-names").property("checked", cfg.constellations.names).on("change", apply);
  
  col.append("label").attr("for", "constellations-desig").html("abbreviated");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-desig").property("checked", cfg.constellations.desig).on("change", apply);
  
  col.append("label").attr("for", "constellations-lines").html("with lines");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-lines").property("checked", cfg.constellations.lines).on("change", apply);
  
  col.append("label").attr("for", "constellations-bounds").html("with boundaries");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-bounds").property("checked", cfg.constellations.bounds).on("change", apply);

  enable($("constellations-names"));

  // graticules & planes 
  col = frm.append("div").attr("class", "col");
  col.append("label").attr("class", "header").html("Lines");
  
  col.append("label").attr("title", "X/Y grid lines").attr("for", "lines-graticule").html("Graticule");
  col.append("input").attr("type", "checkbox").attr("id", "lines-graticule-show").property("checked", cfg.lines.graticule.show).on("change", apply);
  
  col.append("label").attr("for", "lines-equatorial").html("Equator");
  col.append("input").attr("type", "checkbox").attr("id", "lines-equatorial-show").property("checked", cfg.lines.equatorial.show).on("change", apply);
  
  col.append("label").attr("for", "lines-ecliptic").html("Ecliptic");
  col.append("input").attr("type", "checkbox").attr("id", "lines-ecliptic-show").property("checked", cfg.lines.ecliptic.show).on("change", apply);
  
  col.append("label").attr("for", "lines-galactic").html("Galactic plane");
  col.append("input").attr("type", "checkbox").attr("id", "lines-galactic-show").property("checked", cfg.lines.galactic.show).on("change", apply);
  
  col.append("label").attr("for", "lines-supergalactic").html("Supergalactic plane");
  col.append("input").attr("type", "checkbox").attr("id", "lines-supergalactic-show").property("checked", cfg.lines.supergalactic.show).on("change", apply);

  // Other
  col = frm.append("div").attr("class", "col");
  col.append("label").attr("class", "header").html("Other");
  
  col.append("label").attr("for", "mw-show").html("Milky Way");
  col.append("input").attr("type", "checkbox").attr("id", "mw-show").property("checked", cfg.mw.show).on("change", apply);
  
  col.append("label").attr("for", "background").html("Background color");
  col.append("input").attr("type", "color").attr("id", "background-fill").attr("value", cfg.background.fill).on("change", apply);
  
  col.append("label").attr("title", "Star/DSO sizes are increased with higher zoom-levels").attr("for", "adaptable").html("Adaptable sizes");
  col.append("input").attr("type", "checkbox").attr("id", "adaptable").property("checked", cfg.adaptable).on("change", apply);
 
  ctrl.append("div").attr("id", "error");
  
  $("show").onclick = function(e) {
    var x = $("centerx"),
        y = $("centery");
    //Test params
    if (!isNumber(cfg.width)) { popError($("width"), "Check Width setting"); return false; }

    if (x.value === "" && y.value !== "" || y.value === "" && x.value !== "") {
      popError(x, "Both center coordinates need to be given");
      return false; 
    } 
  
    Celestial.display(cfg);

    return false;
  };

  setLimits();
  setUnit(cfg.transform);
  /* descoped
  $("defaults").onclick = function(e) {
    cfg = Celestial.settings().set({width:0, projection:"aitoff"});
    //fillForm(cfg);
    return false;
  }*/

  function redraw() {
    var src = this;
    switch (src.id) {
      case "width": if (testNumber(src) === false) return; 
                    cfg.width = src.value; break;
      case "projection": cfg.projection = src.options[src.selectedIndex].value; break;
      case "transform": var old = cfg.transform;
                        cfg.transform = src.options[src.selectedIndex].value;
                        setUnit(cfg.transform, old); 
                        cfg.center[0] = $("centerx").value; break;
    }    
    Celestial.display(cfg);
  }
                        
  function turn() {
    var src = this,
        cx = $("centerx"), cy = $("centery");
    switch (src.id) {
      case "centerx": if (testNumber(src) === false) return;
                      if (cfg.transform !== "equatorial") cfg.center[0] = src.value; 
                      else cfg.center[0] = src.value > 12 ? src.value * 15 - 360 : src.value * 15;
                      //if (src.value === )     
                      if (cy.value === "") return; 
                      else cfg.center[1] = cy.value;
                      break;
      case "centery": if (testNumber(src) === false) return;
                      cfg.center[1] = src.value; 
                      if (cx.value === "") return; 
                      else {
                        if (cfg.transform !== "equatorial") cfg.center[0] = cx.value; 
                        else cfg.center[0] = cx.value > 12 ? cx.value * 15 - 360 : cx.value * 15;
                      }
                      break;
    }
    Celestial.rotate(cfg);
  }

  function apply() {
    var value, src = this;

    switch (src.type) {
      case "checkbox": value = src.checked; enable(src); break;
      case "number": if (testNumber(src) === false) return; value = src.value; break;
      case "color": if (testColor(src) === false) return; value = src.value; break;
    }
    set(src.id, value);
    
    Celestial.apply(cfg);
  }

  function set(prop, val) {
    var a = prop.split("-");
    switch (a.length) {
      case 1: cfg[a[0]] = val; break;
      case 2: cfg[a[0]][a[1]] = val; break;
      case 3: cfg[a[0]][a[1]][a[2]] = val; break;
      default: return;
    }
    
  }
}

// Dependend fields relations
var depends = {
  "stars-show": ["stars-limit", "stars-colors", "stars-style-fill", "stars-names"],
  "stars-names": ["stars-proper", "stars-desig", "stars-namelimit"],
  "dsos-show": ["dsos-limit", "dsos-names"],
  "dsos-names": ["dsos-desig", "dsos-namelimit"],
  "constellations-names": ["constellations-desig"]
};

// De/activate fields depending on selection of dependencies
function enable(source) {
  var fld = source.id, off;
  
  switch (fld) {
    case "stars-show": 
      off = !$(fld).checked;
      for (var i=0; i< depends[fld].length; i++) { fldEnable(depends[fld][i], off); }
      /* falls through */
    case "stars-names": 
      off = !$("stars-names").checked || !$("stars-show").checked;      
      for (i=0; i< depends["stars-names"].length; i++) { fldEnable(depends["stars-names"][i], off); }
      break;
    case "dsos-show": 
      off = !$(fld).checked;
      for (i=0; i< depends[fld].length; i++) { fldEnable(depends[fld][i], off); }
      /* falls through */
    case "dsos-names": 
      off = !$("dsos-names").checked || !$("dsos-show").checked;      
      for (i=0; i< depends["dsos-names"].length; i++) { fldEnable(depends["dsos-names"][i], off); }
      break;
    case "constellations-show": 
      off = !$(fld).checked;
      for (i=0; i< depends[fld].length; i++) { fldEnable(depends[fld][i], off); }
      break;
  }  
}

// Enable/disable field d to status off
function fldEnable(d, off) {
  var node = $(d);
  node.disabled = off;
  node.previousSibling.style.color = off ? "#999" : "#000";  
}

// Error notification
function popError(nd, err) {
  //var p = nd.getBoundingClientRect();
  d3.select("#error").html(err).style( {top:px(nd.offsetTop+nd.offsetHeight+1), left:px(nd.offsetLeft), opacity:1} );
}

//Check numeric field
function testNumber(node) {
  var v = node.value;
  //if (v === "") return true;
  if (!isNumber(v)) { popError(node, node.title + ": check field value"); return false; }
  v = parseFloat(v);
  if (v < node.min || v > node.max ) { popError(node, node.title + " must be between " + node.min + " anode " + node.max); return false; }
  d3.select("#error").style( {top:"-9999px", left:"-9999px", opacity:0} );
  return true;
}

//Check color field
function testColor(node) {
  var v = node.value;
  if (v === "") return true;
  if (v.search(/^#[0-9A-F]{6}$/i) === -1) { popError(node, node.title + ": not a color value"); return false; }
  d3.select("#error").style( {top:"-9999px", left:"-9999px", opacity:0} );
  return true;
}

function setUnit(trans, old) {
  var cx = $("centerx");
  
  if (old) {
    if (trans === "equatorial" && old !== "equatorial") {
      cx.value = Round(cx.value/15, 1);
      if (cx.value < 0) cx.value += 24;
    } else if (trans !== "equatorial" && old === "equatorial") {
      cx.value = Round(cx.value * 15, 1);
      if (cx.value > 180) cx.value -= 360;
    }
  }
  if (trans === 'equatorial') {
    cx.min = "0";
    cx.max = "24";
    $("cxunit").innerHTML = "h";
  } else {
    cx.min = "-180";
    cx.max = "180";
    $("cxunit").innerHTML = "\u00b0";
  }
}

function setCenter(ctr, trans) {
  var cx = $("centerx"), cy = $("centery");
  if (!cx || !cy) return;
  
  if (ctr === null) ctr = [0,0]; 
  //cfg.center = ctr; 
  if (trans !== "equatorial") cx.value = Round(ctr[0], 1); 
  else cx.value = ctr[0] < 0 ? Round(ctr[0] / 15 + 24, 1) : Round(ctr[0] / 15, 1); 
  
  cy.value = Round(ctr[1], 1);
}

// Set max input limits depending on data
function setLimits() {
  var t, rx = /\d+(\.\d+)?/g,
      s, d, res = {s:6, d:6},
      cfg =  Celestial.settings();

  d = cfg.dsos.data;
  
  //test dso limit
  t = d.match(rx);
  if (t !== null) {
    res.d = parseFloat(t[t.length-1]);
  }

  if (res.d != 6) {
    $("dsos-limit").max = res.d;
    $("dsos-namelimit").max = res.d;
  }
   
   s = cfg.stars.data;
  
  //test star limit
  t = s.match(rx);
  if (t !== null) {
    res.s = parseFloat(t[t.length-1]);
  }

  if (res.s != 6) {
    $("stars-limit").max = res.s;
    $("stars-namelimit").max = res.s;
  }

  return res;
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