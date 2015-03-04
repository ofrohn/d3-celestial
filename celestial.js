// global: d3
var settings = { 
  width: 1024,     //Default width; height is determined by projection
  projection: "aitoff",  //Map projection used: airy, aitoff, armadillo, august, azimuthalEqualArea, azimuthalEquidistant, baker, berghaus, boggs, bonne, bromley, collignon, craig, craster, cylindricalEqualArea, cylindricalStereographic, eckert1, eckert2, eckert3, eckert4, eckert5, eckert6, eisenlohr, equirectangular, fahey, foucaut, ginzburg4, ginzburg5, ginzburg6, ginzburg8, ginzburg9, gringorten, hammer, hatano, healpix, hill, homolosine, kavrayskiy7, lagrange, larrivee, laskowski, loximuthal, mercator, miller, mollweide, mtFlatPolarParabolic, mtFlatPolarQuartic, mtFlatPolarSinusoidal, naturalEarth, nellHammer, orthographic, patterson, polyconic, rectangularPolyconic, robinson, sinusoidal, stereographic, times, twoPointEquidistant, vanDerGrinten, vanDerGrinten2, vanDerGrinten3, vanDerGrinten4, wagner4, wagner6, wagner7, wiechel, winkel3
  transform: null, //*TBI* Coordinate transformation euler angles, euler.ecliptic, euler.galactic, euler.supergalactic, [0,0,0]
  bgcolor: "#000", //Background color css value
  stars: {
    show: true,    //Show stars
    limit: 6,      //up to maximum stellar magnitude
    colors: true,  //Show stars in spectral colors, if not use "color"
    color: "#fff", //Default color for stars
    names: true,   //Show star names (css-class starname)
    proper: false, //Show proper names (if none shows designation)
    desig: true,   //Show designation (Bayer, Flamsteed, Variable star, Gliese, Draper, Hipparcos, whichever applies first)
    namelimit: 2,  //Maximum magnitude with name
    data: 'data/stars.6.json' //Data source for stellar data
  },
  dsos: {
    show: true,    //Show Deep Space Objects
    limit: 6,      //up to maximum magnitude
    names: true,   //Show DSO names
    desig: true,   //Show short DSO names
    namelimit: 6,  //Maximum magnitude with name
    data: 'data/dsos.bright.json'  //Data source for DSOs
  },
  constellations: {
    show: true,    //Show constellations 
    names: true,   //Show constellation names (css-class: constname)
    desig: true,   //Show short constellation names (3 letter designations)
    lines: true,   //Show constellation lines (css-class: constline)
    bounds: false  //Show constellation boundaries (css-class: boundaryline)
  },
  mw: {
    show: true,    //Show Milky Way as filled polygons (css-class: mw)
    opacity: 0.55  //Maximum opacity
  },
  lines: {
    graticule: true,  //Show graticule lines (css-class: gridline)
    equatorial: false,  //Show equatorial plane (css-class: equatorial)
    ecliptic: true,   //Show ecliptic plane (css-class: ecliptic)
    galactic: false,  //Show galactic plane (css-class: galactic)
    supergalactic: false  //Show supergalactic plane (css-class: supergalactic)
  }
};


var symbols = {
  gg: {shape:"circle", stroke:"#f00", fill:"#f00"},  //Galaxy cluster red circle
  g:  {shape:"ellipse", stroke:"#f00", fill:"#f00"}, //Generic galaxy red ellipse
  s:  {shape:"ellipse", stroke:"#f00", fill:"#f00"}, //Spiral galaxy red ellipse
  s0: {shape:"ellipse", stroke:"#f00", fill:"#f00"}, //Lenticular galaxy red ellipse
  sd: {shape:"ellipse", stroke:"#f00", fill:"#f00"}, //Dwarf galaxy red ellipse
  e:  {shape:"ellipse", stroke:"#f00", fill:"#f00"}, //Elliptical galaxy red ellipse
  i:  {shape:"ellipse", stroke:"#f00", fill:"#f00"}, //Irregular galaxy red ellipse
  oc: {shape:"circle", stroke:"#fc0", fill:"none"},  //Open cluster orange open circle
  gc: {shape:"circle", stroke:"#f90", fill:"#f90"},  //Globular cluster dark orange circle
  en: {shape:"square", stroke:"#f0c", fill:"#f0c"},  //Emission nebula pink square
  bn: {shape:"square", stroke:"#f0c", fill:"none"},  //Generic bright nebula pink open square
  sfr: {shape:"square", stroke:"#c0f", fill:"none"}, //Star forming region purple open square
  rn: {shape:"square", stroke:"#00f", fill:"#00f"},  //Reflection nebula blue square
  pn: {shape:"diamond", stroke:"#0cc", fill:"#0cc"}, //Planetary nebula cyan diamond
  snr: {shape:"diamond", stroke:"#f0c", fill:"#f0c"}, //Supernova remnant pink diamond
  dn: {shape:"square", stroke:"#999", fill:"none"}    //Dark nebula grey open square
};

//b-v color index to rgb color value scale
var bvcolor = 
  d3.scale.quantize().domain([3.347, -0.335]) //main sequence <= 1.7
    .range([ '#ff4700', '#ff4b00', '#ff4f00', '#ff5300', '#ff5600', '#ff5900', '#ff5b00', '#ff5d00', '#ff6000', '#ff6300', '#ff6500', '#ff6700', '#ff6900', '#ff6b00', '#ff6d00', '#ff7000', '#ff7300', '#ff7500', '#ff7800', '#ff7a00', '#ff7c00', '#ff7e00', '#ff8100', '#ff8300', '#ff8506', '#ff870a', '#ff8912', '#ff8b1a', '#ff8e21', '#ff9127', '#ff932c', '#ff9631', '#ff9836', '#ff9a3c', '#ff9d3f', '#ffa148', '#ffa34b', '#ffa54f', '#ffa753', '#ffa957', '#ffab5a', '#ffad5e', '#ffb165', '#ffb269', '#ffb46b', '#ffb872', '#ffb975', '#ffbb78', '#ffbe7e', '#ffc184', '#ffc489', '#ffc78f', '#ffc892', '#ffc994', '#ffcc99', '#ffce9f', '#ffd1a3', '#ffd3a8', '#ffd5ad', '#ffd7b1', '#ffd9b6', '#ffdbba', '#ffddbe', '#ffdfc2', '#ffe1c6', '#ffe3ca', '#ffe4ce', '#ffe8d5', '#ffe9d9', '#ffebdc', '#ffece0', '#ffefe6', '#fff0e9', '#fff2ec', '#fff4f2', '#fff5f5', '#fff6f8', '#fff9fd', '#fef9ff', '#f9f6ff', '#f6f4ff', '#f3f2ff', '#eff0ff', '#ebeeff', '#e9edff', '#e6ebff', '#e3e9ff', '#e0e7ff', '#dee6ff', '#dce5ff', '#d9e3ff', '#d7e2ff', '#d3e0ff', '#c9d9ff', '#bfd3ff', '#b7ceff', '#afc9ff', '#a9c5ff', '#a4c2ff', '#9fbfff', '#9bbcff']);
 /* d3.scale.quantize().domain([-0.400,3.332]) //main sequence <= 1.7
.range(["#a5b7ff","#a6b9ff","#a7baff","#a8bbff","#a9bcff","#aabcff","#abbeff","#adc0ff","#afc2ff","#b1c4ff","#b3c5ff","#b5c7ff","#b8c9ff","#bbcbff","#bdcdff","#c0ceff","#c3d1ff","#c5d4ff","#c7d7ff","#cad9ff","#cedcff","#d2dfff","#d7e1ff","#dbe4ff","#e0e7ff","#e5e9ff","#e9ecff","#edefff","#f1f2ff","#f4f4ff","#f8f7ff","#fbf8ff","#fdf9ff","#fffafe","#fffbfd","#fffbfc","#fffbfb","#fffaf7","#fff9f3","#fff8f0","#fff7ec","#fff6e7","#fff5e1","#fff3dc","#fff2d7","#fff0cf","#ffedc8","#ffeac1","#ffe8ba","#ffe5b3","#ffe2ad","#ffe0a6","#ffdda1","#ffda9b","#ffd896","#ffd790","#ffd58c","#ffd387","#ffd183","#ffcf7f","#ffce7c","#ffcd79","#ffcc77","#ffcb75","#ffca74","#ffc870","#ffc76f","#ffc66e","#ffc56d","#ffc46c","#ffc36b","#ffc26a","#ffc169","#ffc068","#ffbf67","#ffbe66","#ffbd65","#ffbc64","#ffbb63","#ffba62","#ffb961","#ffb860","#ffb75f","#ffb65e","#ffb55d","#ffb45c","#ffb35b","#ffb25a","#ffb159","#ffb058","#ffaf57","#ffar56","#ffad55","#ffac54","#ffab53","#ffaa52","#ffa951","#ffa850","#ffa74f","#ffa64e","#ffa54d","#ffa44c","#ffa34b","#ffa24a","#ffa149","#ffa048","#ff9f47","#ff9e46","#ff9d45","#ff9c44","#ff9b43","#ff9a42","#ff9941","#ff983f","#ff973e"]);
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

//Celestial.js main file
var Celestial = {};

Celestial.display = function(config) {
  var circle;
  
  var set = function() {
    var set, key;
    for (set in settings) {
    if (!config.hasOwnProperty(set)) { continue; }
    if (config[set] === null) { continue; }
      if (settings[set].constructor != Object ) {
        settings[set] = config[set];
      } else {
        for (key in settings[set]) {
          if (config[set].hasOwnProperty(key)) {
            settings[set][key] = config[set][key];
          }
        }
      }
    }
  };

  if (config) { set(config); }
  
  if (!projections.hasOwnProperty(settings.projection)) { return; }
  
  var proj = projections[settings.projection],
      ratio = proj.ratio || 2,
      width = settings.width,
      height = width / ratio,
      sc = width / 180,
      center = [180, 0, 0];
    
  var projection = Celestial.projection(settings.projection, settings.transform).rotate(center).translate([width/2, height/2]).scale([proj.scale]);
  var projBg = Celestial.projection(settings.projection).rotate(center).translate([width/2, height/2]).scale([proj.scale]);
  var projOl = Celestial.projection(settings.projection).translate([width/2, height/2]).scale([proj.scale]);

  if (proj.clip) {
    projection.clipAngle(90);
    projBg.clipAngle(90);
    circle = d3.geo.circle().angle([90]);
  }

  var zoom = d3.geo.zoom().projection(projection).center([width/2, height/2]).scaleExtent([proj.scale*0.8, proj.scale*4]).on("zoom", zoomed);
  
  var graticule = d3.geo.graticule().minorStep([15,10]);
                    
  var path = d3.geo.path().projection(projection);
  var bg = d3.geo.path().projection(projBg);
  var ol = d3.geo.path().projection(projOl);
      
  var svg = d3.select("body").append("svg").attr("width", width).attr("height", height).call(zoom);
  
  if (circle) {
    svg.append("path").datum(circle).attr("class", "outline").attr("d", ol); //.style("fill", settings.bgcolor);
  } else {
    svg.append("path").datum(graticule.outline).attr("class", "outline").attr("d", bg); //.style("fill", settings.bgcolor);
  }
  if (settings.lines.graticule) {
    svg.append("path").datum(graticule).attr("class", "gridline").attr("d", bg);
  }
  
  //d3.select("body").style("background-color", "black");
  
  //Milky way outline
  if (settings.mw.show) { d3.json("data/mw.json", function(error, mwjson) {
    svg.selectAll(".mway")
       .data(mwjson.features)
       .enter()
       .append("path")
       .attr("class", "mw")
       .attr("d", path);
       //.style("fill", settings.mw.color)
       //.style("opacity", settings.mw.opacity/5);
  });}

  //Constellation nemes or designation
  if (settings.constellations.show) { 
    d3.json("data/constellations.json", function(error, conjson) {
      svg.selectAll(".constnames")
         .data(conjson.features)
         .enter()
         .append("text")
         .attr("class", "constname")
         .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
         .text( function(d, i) { if (settings.constellations.names) { return settings.constellations.desig?d.properties.desig:d.properties.name; }})
         .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); }); 
    });

    //Constellation boundaries
    if (settings.constellations.bounds) { 
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
    if (settings.constellations.lines) { 
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
  if (settings.stars.show) { 
    d3.json(settings.stars.data, function(error, starjson) {
      svg.selectAll(".stars")
         .data(starjson.features)
         .enter()
         .append("path")
         .attr("class", "star")
         .attr("d", path.pointRadius( function(d, i) {
           return starsize(d.properties.mag);
         } ))
         .style("fill", function(d, i) {
           return starcolor(d.properties);
         });

      if (settings.stars.names) { 
        svg.selectAll(".starnames")
           .data(starjson.features)
           .enter()
           .append("text")
           .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
           .text( function(d, i) { return starname(d.properties); })
           .attr("dy", "-.5em")
           .attr("dx", ".35em")
           .attr("class", "starname")
           .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); }); 
      }       
    });
  }

  //Deep space objects
  if (settings.dsos.show) { 
    d3.json(settings.dsos.data, function(error, dsojson) {
      svg.selectAll(".dsos")
         .data(dsojson.features)
         .enter()
         .append("path")
         .attr("class", "dso")
         .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
         .attr("d", function(d, i) { return dsosymbol(d.properties); })
         .style("stroke", function(d, i) { return dsocolor(d.properties, "stroke"); })
         .style("fill", function(d, i) { return dsocolor(d.properties, "fill"); })
         .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); })
         .style("stroke-opacity", function(d, i) { return clip(d.geometry.coordinates); }); 
    
      if (settings.dsos.names) { 
        svg.selectAll(".dsonames")
           .data(dsojson.features)
           .enter()
           .append("text")
           .attr("class", "dsoname")
           .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
           .text( function(d, i) { return dsoname(d.properties); } )
           .attr("dy", "-.5em")
           .attr("dx", ".35em")
           .style("fill", function(d, i) { return dsocolor(d.properties, "stroke"); })
           .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); }); 
      }
    });
  }

  //Celestial planes
  for (var key in settings.lines) {
    if (settings.lines.hasOwnProperty(key) && key != "graticule" && settings.lines[key] !== false) { 
      var pl = Celestial.plane(key);  

      svg.selectAll(".pl" + key)
         .data(pl.features)
         .enter()
         .append("path")
         .attr("d", path)
         .attr("class", key);
    }
  }
  
   
  //-- Helper functions

  function clip(coords) {
    return proj.clip && d3.geo.distance(center, coords) > pi_2 ? 0 : 1;
  }

  function point(coords) {
    return "translate(" + projection(coords) + ")";
  }
  
  function zoomed() {
    if (!d3.event) { return; }
    var rot = projection.rotate();
    projBg.scale(projection.scale());
    projBg.rotate(projection.rotate());
    projOl.scale(projection.scale());
    
    center = [-rot[0], -rot[1]];
    
    svg.selectAll(".constname")
       .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); });
    svg.selectAll(".constline").attr("d", path);  
    svg.selectAll(".boundaryline").attr("d", path);  

    svg.selectAll(".star")
       .attr("d", path.pointRadius( function(d, i) { return starsize(d.properties.mag); } )); 
    svg.selectAll(".starname")
       .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); });
       
    svg.selectAll(".dso")
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .attr("d", function(d, i) { return dsosymbol(d.properties); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); })
       .style("stroke-opacity", function(d, i) { return clip(d.geometry.coordinates); });
    svg.selectAll(".dsoname")
       .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); });
    
    svg.selectAll(".outline").attr("d", ol);  
    svg.selectAll(".gridline").attr("d", bg);  

    svg.selectAll(".mw").attr("d", path);  
    svg.selectAll(".ecliptic").attr("d", path);  
    svg.selectAll(".equatorial").attr("d", path);  
    svg.selectAll(".galactic").attr("d", path);  
    svg.selectAll(".supergalactic").attr("d", path);  
       
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
    if (!type || !symbols.hasOwnProperty(type)) { return "circle"; }
    else { return symbols[type].shape; }
  }

  function dsocolor(prop, which) {
    if (!prop.type || 
        !symbols.hasOwnProperty(prop.type) || 
        prop.mag == 999 && Math.sqrt(parseInt(prop.dim)) < settings.dsos.limit || 
        prop.mag != 999 && prop.mag > settings.dsos.limit) { return "none"; }
    return symbols[prop.type][which]; 
  }

  function dsosize(mag, dim) {
    if (!mag || mag == 999) { return Math.pow(parseInt(dim), 0.5); }
    return Math.pow(14-mag, 1.4);
  }

  function dsoname(prop) {
    if (prop.mag == 999 && Math.sqrt(parseInt(prop.dim)) < settings.dsos.namelimit || 
        prop.mag != 999 && prop.mag > settings.dsos.namelimit || 
        prop.name === "") { return; }
    if (settings.dsos.desig && prop.desig) { return prop.desig; }
    return prop.name;
  }
  
  function starname(prop) {
    if (prop.mag > settings.stars.namelimit || 
       (settings.stars.desig === false && prop.name === "")) { return; }
    if (settings.stars.proper && prop.name !== "") { return prop.name; }
    if (settings.stars.desig) { return prop.desig; }
  }
  
  function starsize(mag) {
    if (mag === null) { return 0.3; }
    var d = Math.pow(6-mag, 0.66);
    return d>0.5 ? d : 0.5;
  }
  
  function starcolor(prop) {
    if (prop.mag > settings.stars.limit) { return "rgba(0,0,0,0)"; }
    if (!settings.stars.colors || prop.mag > 5) { return settings.stars.color; }
    return bvcolor(prop.bv);
  }
  
};

Celestial.projection = function(projection, euler) {
  var p, trans, raw, forward;
  
  if (!projections.hasOwnProperty(projection)) { throw new Error("Projection not supported: " + projection); }
  p = projections[projection];
    
  if (p.arg !== null) {
    raw = d3.geo[projection].raw(p.arg);
  } else {
    raw = d3.geo[projection].raw;  
  }
  
  if (euler) {
    forward = function(λ, φ) {
      var coords = Celestial.transform([-λ, φ],euler);
      coords = raw(coords[0], coords[1]);
      return coords;
    };
  } else {
    forward = function(λ, φ) {
      var coords = raw(-λ, φ);
      return coords;
    };
  }
  forward.invert = function(x, y) {
    //Needs tranform
    var coords = raw.invert(x, y);
    coords[0] *= -1;
    return coords;
  };

  return d3.geo.projection(forward);
};

var pi2 = Math.PI*2,
    pi_2 = Math.PI/2,
    deg2rad = Math.PI/180;

Celestial.plane = function(transformation) {
  var i, coords = [], tr,
  planeJson = function(id, coords) {
    var res = {type:"FeatureCollection", features:[]};
    res.features[0] = {type:"Feature", "id":id, properties:{}, geometry:{}};
    res.features[0].geometry.type = "LineString";
    res.features[0].geometry.coordinates = coords;
    return res;
  };
  
  if (transformation == "equatorial") {
    for (i=-180; i<=180; i+=1) { coords.push([i,0]); }
  } else {
    tr = "inverse " + transformation;
    if (!euler.hasOwnProperty(tr)) { return null; }
    for (i=-Math.PI; i<=Math.PI; i+=0.01) {
      coords.push( Celestial.transform([i,0], euler[tr]).map( function(rad) { return rad / deg2rad; }));
    }
  }
  return planeJson(transformation, coords);
};

//Transform equatorial into any coordinates
Celestial.transform = function(c, euler) {
  var x, y, z, β, γ, λ, φ, dψ, ψ, θ,
      ε = 1.0e-5;

  if (!euler) { return c; }

  λ = c[0];  // celestial longitude 0..2pi
  if (λ < 0) { λ += pi2; }
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
  ψ = (γ + dψ); //+ pi2) % (pi2));
  if (ψ > Math.PI) { ψ -= pi2; } 
  
  if (λ % Math.PI === 0) {
    θ = φ + Math.cos(λ) * β;
    if (θ > pi_2) { θ = Math.PI - θ; }
    if (θ < -pi_2) { θ = -Math.PI - θ; }
  } else {
    z = Math.sin(φ) * Math.cos(β) + Math.cos(φ) * Math.sin(β) * Math.cos(λ);
    if (Math.abs(z) > 0.99) {
      θ = Math.abs(Math.acos(Math.sqrt(x*x+y*y)));
      if (z < 0) { θ *= -1; }
    } else {
      θ = Math.asin(z);
    }
  }
  
  return [ψ, θ];
};


var euler = {
  "ecliptic": [270.0, 23.4393, 90.0],
  "inverse ecliptic": [90.0, 23.4393, 270.0],
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
    if (!ang || !name || ang.length !== 3 || this.hasOwnProperty(name)) { return; }
    this[name] = ang.map( function(val) { return val * deg2rad; } );
    return this[name];
  }
};

euler.init();

var customSymbolTypes = d3.map({
  'ellipse': function(size) {
    var s = Math.sqrt(size), 
        rx = s*0.666, ry = s/3;
    return 'M' + (-rx) + ',' + (-ry) +
    ' m' + (-rx) + ',0' +
    ' a' + rx + ',' + ry + ' 0 1,0' + (rx * 2) + ',0' +
    ' a' + rx + ',' + ry + ' 0 1,0' + (-(rx * 2)) + ',0';
  }      
});

d3.svg.customSymbol = function() {
  var type, size = 64;
  
  function symbol(d,i) {
    return customSymbolTypes.get(type.call(this,d,i))(size.call(this,d,i));
  }
  symbol.type = function(_) {
    if (!arguments.length) { return type; }
    type = d3.functor(_);
    return symbol;
  };
  symbol.size = function(_) {
    if (!arguments.length) { return size; }
    size = d3.functor(_);
    return symbol;
  };
  return symbol;
};


