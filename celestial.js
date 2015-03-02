var settings = { 
  width: 1024,       //Default width
  height: 512,      //Default height, may change depending on projection
  projection: "aitoff",  //Map projection used
  transform: null,   //Coordinate transformation euler angles, e.g. euler.galactic, euler.ecliptic, [0,0,0]
  bgcolor: "#000",  //Background color css value
  stars: {
    show: true,    //Show stars
    limit: 6,      //up to maximum stellar magnitude
    colors: true,  //Show stars spectral colors, if not use "color"
    color: "#fff", //Default color for stars
    names: true,   //Show star names (css-class starname)
    proper: false, //Show proper names (if none shows designation)
    desig: true,   //Show designation (Bayer, Flamsteed, Variable star, Gliese, Draper, Hipparcos, whichever applies first)
    namelimit: 2   //Maximum magnitude with name
  },
  constellations: {
    show: true,    //Show constellations 
    names: true,   //Show constellation names (css-class constname)
    desig: true,   //Show short constellation names (3 letter designations)
    lines: true,   //Show constellation lines (css-class constline)
    bounds: false  //Show constellation boundaries (css-class boundaryline)
  },
  dsos: {
    show: true,    //Show Deep Space Objects
    limit: 6,      //up to maximum magnitude
    names: true,   //Show DSO names
    desig: true,   //Show short DSO names
    namelimit: 4   //Maximum magnitude with name
  },
  mw: {
    show: true,    //Show Milky Way outlines
    opacity: 0.55  //Maximum opacity
  },
  lines: {
    graticule: true,  //Show graticule lines
    ecliptic: true,   //Show ecliptic plane
    galactic: false,  //Show galactic plane
    equatorial: false,  //Show equatorial plane
    supergalactic: false  //Show supergalactic plane
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
      pn: {shape:"diamond", stroke:"#0c0", fill:"#0cc"}, //Planetary nebula cyan diamond
      snr: {shape:"diamond", stroke:"#f0c", fill:"#f0c"}, //Supernova remnant pink diamond
      dn: {shape:"square", stroke:"#999", fill:"none"}    //Dark nebula grey open square
    };

var starcolor =
    d3.scale.quantize().domain([-0.400,3.332]) //main sequence <= 1.7
      .range(["#a5b7ff","#a6b9ff","#a7baff","#a8bbff","#a9bcff","#aabcff","#abbeff","#adc0ff","#afc2ff","#b1c4ff","#b3c5ff","#b5c7ff","#b8c9ff","#bbcbff","#bdcdff","#c0ceff","#c3d1ff","#c5d4ff","#c7d7ff","#cad9ff","#cedcff","#d2dfff","#d7e1ff","#dbe4ff","#e0e7ff","#e5e9ff","#e9ecff","#edefff","#f1f2ff","#f4f4ff","#f8f7ff","#fbf8ff","#fdf9ff","#fffafe","#fffbfd","#fffbfc","#fffbfb","#fffaf7","#fff9f3","#fff8f0","#fff7ec","#fff6e7","#fff5e1","#fff3dc","#fff2d7","#fff0cf","#ffedc8","#ffeac1","#ffe8ba","#ffe5b3","#ffe2ad","#ffe0a6","#ffdda1","#ffda9b","#ffd896","#ffd790","#ffd58c","#ffd387","#ffd183","#ffcf7f","#ffce7c","#ffcd79","#ffcc77","#ffcb75","#ffca74","#ffc870","#ffc76f","#ffc66e","#ffc56d","#ffc46c","#ffc36b","#ffc26a","#ffc169","#ffc068","#ffbf67","#ffbe66","#ffbd65","#ffbc64","#ffbb63","#ffba62","#ffb961","#ffb860","#ffb75f","#ffb65e","#ffb55d","#ffb45c","#ffb35b","#ffb25a","#ffb159","#ffb058","#ffaf57","#ffar56","#ffad55","#ffac54","#ffab53","#ffaa52","#ffa951","#ffa850","#ffa74f","#ffa64e","#ffa54d","#ffa44c","#ffa34b","#ffa24a","#ffa149","#ffa048","#ff9f47","#ff9e46","#ff9d45","#ff9c44","#ff9b43","#ff9a42","#ff9941","#ff983f","#ff973e"]);

var projections = {
//"airy":{arg:Math.PI/2, scale:162},
"aitoff":{arg:null, scale:162},
"armadillo":{arg:0, scale:250}, 
"baker":{arg:null, scale:160, ratio:1.4},
"boggs":{arg:null, scale:170},
"bromley":{arg:null, scale:162},
"collignon":{arg:null, scale:100, ratio:2.6},
"cylindricalEqualArea":{arg:Math.PI/6, scale:180},
"cylindricalStereographic":{arg:Math.PI/4, scale:230, ratio:1.3},
"eckert1":{arg:null, scale:175},
"eckert2":{arg:null, scale:175},
"eckert3":{arg:null, scale:190},
"eckert4":{arg:null, scale:190},
"eckert5":{arg:null, scale:182},
"eckert6":{arg:null, scale:182},
"eisenlohr":{arg:null, scale:102},
"equirectangular":{arg:null, scale:160},
"fahey":{arg:null, scale:196, ratio:1.4},
"foucaut":{arg:null, scale:142},
"ginzburg4":{arg:null, scale:180, ratio:1.7},
"ginzburg5":{arg:null, scale:196, ratio:1.55},
"ginzburg6":{arg:null, scale:190, ratio:1.4},
"ginzburg8":{arg:null, scale:205, ratio:1.3},
"ginzburg9":{arg:null, scale:190, ratio:1.4},
"hammer":{arg:2, scale:180},
"hill":{arg:2, scale:190, ratio:1.6},
"homolosine":{arg:null, scale:160, ratio:2.2},
"kavrayskiy7":{arg:null, scale:185, ratio:1.75},
"larrivee":{arg:null, scale:160, ratio:1.25},
"laskowski":{arg:null, scale:165, ratio:1.7},
"loximuthal":{arg:Math.PI/4, scale:170, ratio:1.8},
"mercator":{arg:null, scale:160, ratio:1.3},
"miller":{arg:null, scale:160, ratio:1.5},
"mollweide":{arg:null, scale:180},
"mtFlatPolarParabolic":{arg:null, scale:175},
"mtFlatPolarQuartic":{arg:null, scale:230, ratio:1.65},
"mtFlatPolarSinusoidal":{arg:null, scale:175, ratio:1.9},
"naturalEarth":{arg:null, scale:185, ratio:1.85},
"nellHammer":{arg:null, scale:160, ratio:2.6},
"patterson":{arg:null, scale:160, ratio:1.75},
"polyconic":{arg:null, scale:160, ratio:1.3},
"rectangularPolyconic":{arg:0, scale:160, ratio:1.65},
"robinson":{arg:null, scale:160},
"times":{arg:null, scale:210, ratio:1.4}, 
"vanDerGrinten":{arg:null, scale:160, ratio:1.0}, 
"vanDerGrinten2":{arg:null, scale:160, ratio:1.0},
"vanDerGrinten3":{arg:null, scale:160, ratio:1.0},
"vanDerGrinten4":{arg:null, scale:160, ratio:1.6},
"wagner4":{arg:null, scale:185},
"wagner6":{arg:null, scale:160},
"wagner7":{arg:null, scale:190, ratio:1.8},
"winkel3":{arg:null, scale:196, ratio:1.7}
};

//Celestial.js main file
var Celestial = {};

Celestial.display = function(config) {
  var set = function() {
    var set, key;
    for (set in settings) {
      if (!config.hasOwnProperty(set)) { continue; }
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

  if (!projections.hasOwnProperty(settings.projection)) { return; }
  
  var proj = projections[settings.projection],
      ratio = proj.ratio || 2,
      width = settings.width,
      height = width / ratio;
  
  var projection = Celestial.projection(settings.projection, settings.transform).translate([width/2, height/2]).scale([proj.scale]);
  var projectionBg = Celestial.projection(settings.projection).translate([width/2, height/2]).scale([proj.scale]);
  
  var graticule = d3.geo.graticule().minorStep([15,10]);
                    
  var path = d3.geo.path().projection(projection);
  var bg = d3.geo.path().projection(projectionBg);
      
  var svg = d3.select("body").append("svg").attr("width", width).attr("height", height);
  
  //svg.selectAll("path").remove();            
      
  svg.append("path").datum(graticule.outline).attr("class", "graticule outline").attr("d", bg);
  svg.append("path").datum(graticule).attr("class", "graticule").attr("d", bg);

  //Milky way outline
  if (settings.mw.show) { d3.json("data/mw.json", function(error, mwjson) {
    svg.selectAll(".mw")
       .data(mwjson.features)
       .enter()
       .append("path")
       .attr("d", path)
       .style("fill", "#fff")
       .style("opacity", settings.mw.opacity/5);
  });}

  //Constellation nemes or designation
  if (settings.constellations.show) { d3.json("data/constellations.json", function(error, conjson) {
    svg.selectAll(".names")
       .data(conjson.features)
       .enter()
       .append("text")
       .attr("transform", function(d, i) {
         return "translate(" + projection(conjson.features[i].geometry.coordinates) + ")";
       })
       .text( function(d, i) { return settings.constellations.desig?conjson.features[i].properties.desig:conjson.features[i].properties.name; })
       .attr("class", "constname"); 
  });}

  //Contellation boundaries
  if (settings.constellations.bounds) { d3.json("data/constellations.bounds.json", function(error, bndjson) {
    svg.selectAll(".bounds")
       .data(bndjson.features)
       .enter()
       .append("path")
       .attr("d", path)
       .attr("class", "boundaryline");        
  });}

  //Constellation lines
  if (settings.constellations.lines) { d3.json("data/constellations.lines.json", function(error, linejson) {
    //console.log(lines);
    svg.selectAll(".lines")
       .data(linejson.features)
       .enter()
       .append("path")
       .attr("d", path)
       .attr("class", "constline");        
  });}

  //Stars
  if (settings.stars.show) { d3.json("data/stars.6.json", function(error, starjson) {
    svg.selectAll(".stars")
       .data(starjson.features)
       .enter()
       .append("circle")
       .attr("r", function(d, i) {
         return starsize(starjson.features[i].properties.mag);
       })
       .attr("transform", function(d, i) {
         return "translate(" + projection(starjson.features[i].geometry.coordinates) + ")";
       })
       .style("fill", function(d, i) {
         if (settings.stars.colors && starjson.features[i].properties.mag < 5) {
           return starcolor(starjson.features[i].properties.bv);
         }
         return settings.stars.color;
       });
    if (settings.stars.names) { svg.selectAll(".starnames")
       .data(starjson.features)
       .enter()
       .append("text")
       .attr("transform", function(d, i) {
         return "translate(" + projection(namepos(starjson.features[i].geometry.coordinates)) + ")";
       })
       .text( function(d, i) { return starname(starjson.features[i].properties); })
       .attr("class", "starname");
    }       
  });}

  //Deep space objects
  if (settings.dsos.show) { d3.json("data/dsos.bright.json", function(error, dsojson) {
    svg.selectAll(".dso")
       .data(dsojson.features)
       .enter()
       .append("path")
       .attr("transform", function(d, i) {
         return "translate(" + projection(dsojson.features[i].geometry.coordinates) + ")";
       })
       .attr("d", function(d, i) { return dsosymbol(dsojson.features[i].properties); })
       .style("stroke", function(d, i) { return dsocolor(dsojson.features[i].properties.type, "stroke"); })
       .style("fill", function(d, i) { return dsocolor(dsojson.features[i].properties.type, "fill"); });
    if (settings.dsos.names) { svg.selectAll(".dsonames")
       .data(dsojson.features)
       .enter()
       .append("text")
       .attr("transform", function(d, i) {
         return "translate(" + projection(namepos(dsojson.features[i].geometry.coordinates)) + ")";
       })
       .text( function(d, i) { return dsoname(dsojson.features[i].properties); } )
       .style("fill", function(d, i) { return dsocolor(dsojson.features[i].properties.type, "stroke"); });
    }
  });}

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
  
  //d3.select(self.frameElement).style("height", height + "px");

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

  function dsocolor(type, which) {
    if (!type || !symbols.hasOwnProperty(type)) { return "none"; }
  else { return symbols[type][which]; }
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
    var d = Math.pow(5.6-mag, 0.66);
    return d>0.5 ? d : 0.3;
  }
  
  function namepos(coords) {
    return [coords[0]-1.5,coords[1]+1.5];
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
      var coords = Celestial.transform(λ, φ);
      coords = raw(-coords[0], coords[1]);
      return coords;
    };
  } else {
    forward = function(λ, φ) {
      var coords = raw(-λ, φ);
      return coords;
    };
  }
  forward.invert = function(x, y) {
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
    for (i=0; i<=pi2; i+=0.05) {
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
  ψ = ((γ + dψ + pi2) % (pi2));
  
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
  
  return [ψ-Math.PI, θ];
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


