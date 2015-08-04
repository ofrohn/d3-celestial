/* global settings, symbols, bvcolor, projections, poles, eulerAngles, halfπ, $, px, has */
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

  if (Celestial.data.length > 0) { 
    Celestial.data.every( function(d) {
       d3.json(d.file, d.callback);
    });
  }
  
  d3.select(window).on('resize', function() {
    if (cfg.width) return;
    width = getWidth();
    height = width/ratio;
    var scale = proj.scale * width/1024;
    svg.attr("width", width).attr("height", height);
    zoom.scale([scale]);
    projection.translate([width/2, height/2]).scale([scale]);
    projOl.translate([width/2, height/2]);
    if (parent) parent.style.height = px(height);
    redraw();
  });
  
  Celestial.svg = svg;
  
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

  Celestial.clip = clip;
  Celestial.point = point;
  Celestial.opacity = opacity;
  Celestial.map = map;
  Celestial.mapProjection = projection;

  function redraw() {
    if (!d3.event) return; 
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
      Celestial.data.every( function(d) {
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
    if (cfg.width) return cfg.width;
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
