//Celestial.js main file
var Celestial = {};

Celestial.display = function(config) {
  var cfg, circle, par;
  
  cfg = settings.set(config); 
  
  par = $("map") ? "#map" : "body";
  
  if (!projections.hasOwnProperty(cfg.projection)) { return; }
  
  var proj = projections[cfg.projection],
      trans = cfg.transform || "equatorial",
      ratio = proj.ratio || 2,
      width = cfg.width,
      height = width / ratio,
      base = 7, exp = -0.3, //Object size base & exponent
      center = trans == "galactic" ? [0,0,0] : [180, 0, 0];
    
  var projection = Celestial.projection(cfg.projection).rotate(eulerAngles[trans]).translate([width/2, height/2]).scale([proj.scale]);
  //var projC = Celestial.projection(cfg.projection).rotate(eulerAngles[trans]).translate([width/2, height/2]).scale([proj.scale]);
  var projOl = Celestial.projection(cfg.projection).translate([width/2, height/2]).scale([proj.scale]); //projected non moving outline

  if (proj.clip) {
    projection.clipAngle(90);
    circle = d3.geo.circle().angle([90]);
  }

  var zoom = d3.geo.zoom().projection(projection).center([width/2, height/2]).scaleExtent([proj.scale, proj.scale*4]).on("zoom.redraw", redraw);
  
  var graticule = d3.geo.graticule().minorStep([15,10]);
  
  var path = d3.geo.path().projection(projection);
  //var conP = d3.geo.path().projection(projC);
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
  
  //redraw();
  
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
    
    svg.selectAll(".constname")
       .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); });
    svg.selectAll(".constline").attr("d", path);  
    svg.selectAll(".boundaryline").attr("d", path);  
    
    svg.selectAll(".star")
       .attr("d", path.pointRadius( function(d, i) { return d.properties ? starsize(d.properties.mag) : 1; } )); 
    svg.selectAll(".starname")
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); });
    
    svg.selectAll(".dso")
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .attr("d", function(d, i) { return dsosymbol(d.properties); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); })
       .style("stroke-opacity", function(d, i) { return clip(d.geometry.coordinates); });
    svg.selectAll(".dsoname")
       .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); });
    
    svg.selectAll(".outline").attr("d", olP);  
    svg.selectAll(".gridline").attr("d", path);  

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
    if (!mag || mag == 999) { return Math.pow(parseInt(dim)*base/7, 0.5); }
    return Math.pow(2*base-mag, 1.4);
  }

  function dsoname(prop) {
    if (prop.mag == 999 && Math.sqrt(parseInt(prop.dim)) < cfg.dsos.namelimit || 
        prop.mag != 999 && prop.mag > cfg.dsos.namelimit || 
        prop.name === "") { return; }
    if (cfg.dsos.desig && prop.desig) { return prop.desig; }
    return prop.name;
  }
  
  function starname(prop) {
    if (prop.mag > cfg.stars.namelimit || 
       (cfg.stars.desig === false && prop.name === "")) { return; }
    if (cfg.stars.proper && prop.name !== "") { return prop.name; }
    if (cfg.stars.desig) { return prop.desig; }
  }
  
  function starsize(mag) {
    if (mag === null) { return 0.2; }
    var d = base * Math.exp(exp * (mag+2));
    return d>0.2 ? d : 0.2;
  }
  
  function starcolor(prop) {
    if (prop.mag > cfg.stars.limit) { return "rgba(0,0,0,0)"; }
    if (!cfg.stars.colors) { return cfg.stars.color; }
    return bvcolor(prop.bv);
  }
  
};

function $(id) {
  return document.getElementById(id);
}
