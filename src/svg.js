/* global d3, Celestial, projections, poles, getData, getAngles, getWidth, has, halfπ, symbols, starnames, bvcolor
*/
function saveSVG(cfg) {
  var doc = document.createDocumentFragment(),
      svg = d3.select(doc).append("svg"),
      m = Celestial.metrics(),
      path = cfg.datapath,
      proj = projections[cfg.projection],
      rotation = getAngles(cfg.center),
      center = [-rotation[0], -rotation[1]],
      adapt = 1,
      projection = Celestial.projection(cfg.projection).rotate(rotation).translate([m.width/2, m.height/2]).scale([m.scale]);

  if (proj.clip) {
    projection.clipAngle(90);
    var circle = d3.geo.circle().angle([90]);
  }
  
  var graticule = d3.geo.graticule().minorStep([15,10]);
  
  var map = d3.geo.path().projection(projection);
  
  if (cfg.lines.graticule) {
    if (cfg.transform === "equatorial") {
      svg.append("path").datum(graticule).attr("class", "gridline").attr("d", map);
    } else {
      Celestial.graticule(svg, map, cfg.transform);
    }
  }

  svg.attr("width", m.width).attr("height", m.height);
  
  svg.append("path").datum(graticule.outline).attr("class", "outline").attr("d", map).style("fill", cfg.background);

  //Celestial planes
  for (var key in cfg.lines) {
    if (has(cfg.lines, key) && key != "graticule" && cfg.lines[key] !== false) { 
      svg.append("path")
         .datum(d3.geo.circle().angle([90]).origin(poles[key]) )
         .attr("class", key)
         .style({"fill-opacity": cfg.mw.style.opacity, "fill": cfg.mw.style.fill})
         .attr("d", map);
    }
  }

  
  //Milky way outline
  if (cfg.mw.show) {
    d3.json(path + "mw.json", function(error, json) {
      var mw = getData(json, cfg.transform);
      //var mw_back = getMwbackground(mw);
      
      svg.selectAll(".mway")
       .data(mw.features)
       .enter().append("path")
       .attr("class", "mw")
       .attr("d", map);
    });
  }
/*
  //Constellation nemes or designation
  if (cfg.constellations.names) { 
    c.selectAll(".constname").each(function(d) { 
      svg.selectAll(".constnames")
        .data(d)
        .enter().append("text")
        .attr("class", "constname")
        .attr("transform", function(d, i) {  
          return point(d.geometry.coordinates); })
        .text( function(d) { if (cfg.constellations.names) { return cfg.constellations.desig?d.properties.desig:d.properties.name; }})
        .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); }); 
    })
  }

  //Constellation boundaries
  if (cfg.constellations.bounds) { 
    svg.selectAll(".bounds")
      .data(c.selectAll("boundaryline").data())
      .enter().append("path")
      .attr("class", "boundaryline")
      .attr("d", map);
  }

  //Constellation lines
  if (cfg.constellations.lines) { 
    svg.selectAll(".lines")
      .data(c.selectAll("constline").data())
      .enter().append("path")
      .attr("class", "constline")
      .attr("d", map);
  }
  
  //Stars
  if (cfg.stars.show) { 
    svg.selectAll(".stars")
      .data(c.selectAll("star").data().filter( function(d) {
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
        .data(c.selectAll("starname").data().filter( function(d) {
          return d.properties.mag <= cfg.stars.designationLimit; 
        }))
        .enter().append("text")
        .attr("transform", function(d) { return point(d.geometry.coordinates); })
        .text( function(d) { return starDesignation(d.id); })
        .attr({dy: "-.5em", dx: ".35em", class: "starname"})
        .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); });
    }
  }

  //Deep space objects
  if (cfg.dsos.show) { 
    svg.selectAll(".dsos")
      .data(c.selectAll("dso").data().filter( function(d) {
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
        .data(c.selectAll("dsoname").data().filter( function(d) {
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
  }
*/
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
    if (!type || !has(cfg.dsos.symbols, type)) return "circle"; 
    else return cfg.dsos.symbols[type]; 
  }

  function dsoSize(mag, dim) {
    if (!mag || mag === 999) return Math.pow(parseInt(dim) * cfg.dsos.size * adapt / 7, 0.5); 
    return Math.pow(2 * cfg.dsos.size * adapt - mag, cfg.dsos.exponent);
  }
 

  function dsoName(prop) {
    return prop[cfg.dsos.namesType]; 
  }
  
  function starDesignation(id) {
    if (!has(starnames, id)) return "";
    return starnames[id][cfg.stars.designationType]; 
  }

  function starPropername(id) {
    if (!has(starnames, id)) return "";
    return starnames[id][cfg.stars.propernameType]; 
  }

  function starSize(mag) {
    if (mag === null) return 0.1; 
    var d = cfg.stars.size * adapt * Math.exp(cfg.stars.exponent * (mag + 2));
    return Math.max(d, 0.1);
  }
  
  function starColor(prop) {
    if (!cfg.stars.colors || isNaN(prop.bv)) {return cfg.stars.color; }
    return bvcolor(prop.bv);
  }
  
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

  var html = d3.select("svg")
      .attr("title", "D3-Celestial")
      .attr("version", 1.1)
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .node().parentNode.innerHTML;
  var blob = new Blob([html], {type:"image/svg+xml;charset=utf-8"});
  return URL.createObjectURL(blob);

}