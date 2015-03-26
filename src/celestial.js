/* global settings, symbols, bvcolor, projections, poles, eulerAngles, halfπ */
var Celestial = {};

// show it all, with the given config, otherwise with default settings
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
      adapt = 1,
      center = trans == "galactic" ? [0,0,0] : [180, 0, 0]; // most skyviews look better centerd at 180º
    
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
           return d.properties ? starSize(d.properties.mag) : 1;
         }))
         .style("fill", function(d) {
           return starColor(d.properties);
         })
         .style("fill-opacity", function(d) { return starOpacity(d.properties.mag); }); 

      if (cfg.stars.names) { 
        svg.selectAll(".starnames")
           .data(starjson.features)
           .enter()
           .append("text")
           .attr("transform", function(d) { return point(d.geometry.coordinates); })
           .text( function(d) { return starName(d.properties); })
           .attr({dy: "-.5em", dx: ".35em", class: "starname"})
           .style("fill-opacity", function(d) { return clip(d.geometry.coordinates) == 1 && starOpacity(d.properties.mag, true) == 1 ? 1 : 0; }); 
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
         .attr("d", function(d) { return dsoSymbol(d.properties); })
         //.attr("style", function(d) { return dsoColor(d.properties); })
         .attr("style", function(d) { return dsoOpacity(d.geometry.coordinates, d.properties); });
         //.style("fill-opacity", function(d) { return clip(d.geometry.coordinates); })
         //.style("stroke-opacity", function(d) { return clip(d.geometry.coordinates); }); 
    
      if (cfg.dsos.names) { 
        svg.selectAll(".dsonames")
           .data(dsojson.features)
           .enter()
           .append("text")
           .attr("class", function(d) { return "dsoname " + d.properties.type; } )
           .attr("transform", function(d) { return point(d.geometry.coordinates); })
           .text( function(d) { return dsoName(d.properties); } )
           .attr({dy: "-.5em", dx: ".35em"})
           //       style: function(d) { return dsoColor(d.properties, true); } 
            //})
           .attr("style", function(d) { return dsoOpacity(d.geometry.coordinates, d.properties, true); });
           //.style("fill-opacity", function(d) { return clip(d.geometry.coordinates); }); 
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
    if (cfg.adaptable) adapt = Math.sqrt(projection.scale()/proj.scale);
    base = 7 * adapt;
    center = [-rot[0], -rot[1]];

    svg.selectAll("path")
       .attr("d", path.pointRadius( function(d, i) { return d.properties ? starSize(d.properties.mag) : 1; } )); 
    svg.selectAll("text")
       .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); });

    svg.selectAll(".star")
       .style("fill-opacity", function(d) { return starOpacity(d.properties.mag); }); 
    svg.selectAll(".starname")   
      .style("fill-opacity", function(d) { return clip(d.geometry.coordinates) == 1 && starOpacity(d.properties.mag, true) == 1 ? 1 : 0; }); 

    svg.selectAll(".dso")
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .attr("d", function(d, i) { return dsoSymbol(d.properties); })
       .attr("style", function(d) { return dsoOpacity(d.geometry.coordinates, d.properties); });
       //.style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); })
       //.style("stroke-opacity", function(d, i) { return clip(d.geometry.coordinates); });
    svg.selectAll(".dsoname")
       .attr("style", function(d) { return dsoOpacity(d.geometry.coordinates, d.properties, true); });

    svg.selectAll(".outline").attr("d", olP);  
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
    if (!type || !symbols.hasOwnProperty(type)) return "circle"; 
    else return symbols[type].shape; 
  }


  function dsoColor(prop, text) {
    if (!prop.type || !symbols.hasOwnProperty(prop.type) /* || 
        prop.mag == 999 && Math.sqrt(parseInt(prop.dim)) < cfg.dsos.limit || 
        prop.mag != 999 && prop.mag > cfg.dsos.limit*/) { return ''; }
    if (text) {
      return 'fill:' + symbols[prop.type].stroke; 
    } else {
      return 'stroke:' + symbols[prop.type].stroke + '; fill:' + symbols[prop.type].fill; 
    }
  }

  function dsoOpacity(coords, prop, text) {
    var fld = text ? "namelimit" : "limit", opa = 0;
    if (clip(coords) == 1 && 
        prop.mag == 999 && Math.sqrt(parseInt(prop.dim)) > cfg.dsos[fld] * adapt || 
        prop.mag != 999 && prop.mag < cfg.dsos[fld] * adapt) opa = 1;

    return dsoColor(prop, text) + ';stroke-opacity:' + opa + ';fill-opacity:' + opa; 
  }
  
  function dsoSize(mag, dim) {
    if (!mag || mag == 999) return Math.pow(parseInt(dim)*base/7, 0.5); 
    return Math.pow(2*base-mag, 1.4);
  }

  function dsoName(prop) {
    if (/*prop.mag == 999 && Math.sqrt(parseInt(prop.dim)) < cfg.dsos.namelimit || 
        prop.mag != 999 && prop.mag > cfg.dsos.namelimit || */
        prop.name === "") return; 
    if (cfg.dsos.desig && prop.desig) return prop.desig; 
    return prop.name;
  }
  
  function starName(prop) {
    if //(prop.mag > cfg.stars.namelimit || 
       (cfg.stars.desig === false && prop.name === "") return; 
    if (cfg.stars.proper && prop.name !== "") return prop.name; 
    if (cfg.stars.desig)  return prop.desig; 
  }
  
  function starSize(mag) {
    if (mag === null) return 0.2; 
    var d = base * Math.exp(exp * (mag+2));
    return d>0.2 ? d : 0.2;
  }
  
  function starColor(prop) {
    //if (prop.mag > cfg.stars.limit + adapt) return "rgba(0,0,0,0)"; 
    if (!cfg.stars.colors || isNaN(prop.bv)) {return cfg.stars.color; }
    return bvcolor(prop.bv);
  }
  
  function starOpacity(mag, text) {
    if (text)  return (mag > cfg.stars.namelimit * adapt) ? 0 : 1; 
    else return (mag > cfg.stars.limit * adapt) ? 0 : 1; 
  }
  
};

function $(id) {
  return document.getElementById(id);
}

