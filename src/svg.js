/* global d3, Celestial, projections, poles, getData, getAngles, getWidth, getGridValues, has, isArray, halfπ, symbols, starnames, bvcolor, settings, formats, transformDeg, euler */
function saveSVG() {
  var doc = d3.select("body").append("div").attr("id", "d3-celestial-svg").attr("style", "display: none"),
      svg = d3.select("#d3-celestial-svg").append("svg"), //.attr("style", "display: none"),
      m = Celestial.metrics(),
      cfg = settings.set(),
      path = cfg.datapath,
      proj = projections[cfg.projection],
      rotation = getAngles(cfg.center),
      center = [-rotation[0], -rotation[1]],
      adapt = 1,
      projection = Celestial.projection(cfg.projection).rotate(rotation).translate([m.width/2, m.height/2]).scale([m.scale]),
      factor = projection.scale() / m.scale,
      culture = (cfg.culture !== "" && cfg.culture !== "iau") ? cfg.culture : "",
      extConstellations = (has(formats.constellations, culture)) ? "." + culture : "",
      circle;

  svg.selectAll("*").remove();

  if (proj.clip) {
    projection.clipAngle(90);
    circle = d3.geo.circle().angle([179.9]);
  }

  svg.attr("width", m.width).attr("height", m.height);
  // .attr("viewBox", " 0 0 " + (m.width) + " " + (m.height));

  var background = svg.append('g'),
      objects = svg.append('g'),
      foreground = svg.append('g');

  var graticule = d3.geo.graticule().minorStep([15,10]);
  
  var map = d3.geo.path().projection(projection);

  var q = d3.queue(2);
  
  if (circle) {
    background.append("path").datum(circle).attr("class", "outline").attr("d", map).style("fill", cfg.background.fill);
  } else {
    background.append("path").datum(graticule.outline).attr("class", "outline").attr("d", map).style("fill", cfg.background.fill);
  }
  
  if (cfg.lines.graticule.show) {
    if (cfg.transform === "equatorial") {
      background.append("path").datum(graticule)
       .attr("class", "gridline")
       .style( svgStyle(cfg.lines.graticule) )
       .attr("d", map);
    } else {
      Celestial.graticule(background, map, cfg.transform);
    }
    if (has(cfg.lines.graticule, "lon") && cfg.lines.graticule.lon.pos.length > 0) {
      var jlon = {type: "FeatureCollection", features: getGridValues("lon", cfg.lines.graticule.lon.pos)};      
      background.selectAll(".gridvalues_lon")
        .data(jlon.features)
        .enter().append("text")
        .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
        .text( function(d) { return d.properties.value; } )
        .attr({dy: ".5em", dx: "-.75em", class: "graticule_lon"})
        .style( svgTextStyle(cfg.lines.graticule.lon) ); 
    }
    if (has(cfg.lines.graticule, "lat") && cfg.lines.graticule.lat.pos.length > 0) {
      var jlat = {type: "FeatureCollection", features: getGridValues("lat", cfg.lines.graticule.lat.pos)};      
      background.selectAll(".gridvalues_lat")
        .data(jlat.features)
        .enter().append("text")
        .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
        .text( function(d) { return d.properties.value; } )
        .attr({dy: "-.5em", dx: "-.75em", class: "graticule_lat"})
        .style( svgTextStyle(cfg.lines.graticule.lat) ); 
    }
  }

  //Celestial planes
  for (var key in cfg.lines) {
    if (has(cfg.lines, key) && key != "graticule" && cfg.lines[key].show !== false) { 
      background.append("path")
         .datum(d3.geo.circle().angle([90]).origin(poles[key]) )
         .attr("class", key)
         .style( svgStyle(cfg.lines[key]) )
         .attr("d", map);
    }
  }

  //Milky way outline
  if (cfg.mw.show) {
    q.defer(function(callback) { 
      d3.json(path + "mw.json", function(error, json) {
        if (error) callback(error);
        var mw = getData(json, cfg.transform);
        //var mw_back = getMwbackground(mw);
        
        background.selectAll(".mway")
         .data(mw.features)
         .enter().append("path")
         .attr("class", "mw")
         .style( svgStyle(cfg.mw.style) )
         .attr("d", map);
        callback(null);
      });
    });
  }


  //Constellation boundaries
  if (cfg.constellations.bounds) { 
    q.defer(function(callback) { 
      d3.json(path + "constellations.bounds" + extConstellations + ".json", function(error, json) {
        if (error) callback(error);

        var conb = getData(json, cfg.transform);
   
        background.selectAll(".bounds")
         .data(conb.features)
         .enter().append("path")
         .attr("class", "boundaryline")
         .style( svgStyle(cfg.constellations.boundStyle) )
         .attr("d", map);
        callback(null);
      });
    });
  }

  //Constellation lines
  if (cfg.constellations.lines) { 
    q.defer(function(callback) { 
      d3.json(path + "constellations.lines" + extConstellations + ".json", function(error, json) {
        if (error) callback(error);

        var conl = getData(json, cfg.transform);
        background.selectAll(".lines")
         .data(conl.features)
         .enter().append("path")
         .attr("class", "constline")
         .style({
            "fill": "none",
            "stroke": function(d) { return isArray(cfg.constellations.lineStyle.stroke) ? cfg.constellations.lineStyle.stroke[d.properties.rank-1] : null; },
            "stroke-width": function(d) { return isArray(cfg.constellations.lineStyle.width) ? cfg.constellations.lineStyle.width[d.properties.rank-1] : 0; },
            "stroke-opacity": function(d) { return isArray(cfg.constellations.lineStyle.opacity) ? cfg.constellations.lineStyle.opacity[d.properties.rank-1] : 0; }
          })
         .attr("d", map);
        callback(null);
      });
    });
  }

  // Map border
  q.defer(function(callback) {
    background.append("path")
     .datum(graticule.outline)
     .attr("class", "outline")
     .style({"fill": "none", "stroke": cfg.background.stroke, "stroke-width": cfg.background.width, "stroke-opacity": 1, "stroke-dasharray": "none" })
     .attr("d", map);
    callback(null);
  });  
  
  //Constellation nemes or designation
  if (cfg.constellations.names) { 
    q.defer(function(callback) { 
      d3.json(path + "constellations" + extConstellations + ".json", function(error, json) {
        if (error) callback(error);

        var conn = getData(json, cfg.transform);
        objects.selectAll(".constnames")
         .data(conn.features.filter( function(d) {
            return clip(d.geometry.coordinates) === 1; 
          }))
         .enter().append("text")
         .attr("class", "constname")
         // vertical-align  dy=-0.4em if middle, -1em top
         .style({
            "fill": function(d) { return isArray(cfg.constellations.nameStyle.fill) ? cfg.constellations.nameStyle.fill[d.properties.rank-1] : "#ffffff"; },
            "fill-opacity": function(d) { return isArray(cfg.constellations.nameStyle.opacity) ? cfg.constellations.nameStyle.opacity[d.properties.rank-1] : 1; },
            "font": function(d) { return isArray(cfg.constellations.nameStyle.font) ? cfg.constellations.nameStyle.font[d.properties.rank-1] : "14px sans-serif"; },
            "text-anchor": svgAlign(cfg.constellations.nameStyle.align)
          })
         .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
         .text( function(d) { return constName(d); } ); 
        callback(null);
      });
    });
  }

  
  //Stars
  if (cfg.stars.show) { 
    q.defer(function(callback) { 
      d3.json(path +  cfg.stars.data, function(error, json) {
        if (error) callback(error);

        var cons = getData(json, cfg.transform);
        
        objects.selectAll(".stars")
          .data(cons.features.filter( function(d) {
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
        
        if (cfg.stars.designation) { 
          objects.selectAll(".stardesigs")
            .data(cons.features.filter( function(d) {
              return d.properties.mag <= cfg.stars.designationLimit && clip(d.geometry.coordinates) === 1; 
            }))
            .enter().append("text")
            .attr("transform", function(d) { return point(d.geometry.coordinates); })
            .text( function(d) { return starDesignation(d.id); })
            .attr({dy: ".85em", dx: ".35em", class: "stardesig"})
            .style( svgTextStyle(cfg.stars.designationStyle) );
        }
        if (cfg.stars.propername) { 
          objects.selectAll(".starnames")
            .data(cons.features.filter( function(d) {
              return d.properties.mag <= cfg.stars.propernameLimit && clip(d.geometry.coordinates) === 1; 
            }))
            .enter().append("text")
            .attr("transform", function(d) { return point(d.geometry.coordinates); })
            .text( function(d) { return starPropername(d.id); })
            .attr({dy: "-.5em", dx: "-.35em", class: "starname"})
            .style( svgTextStyle(cfg.stars.propernameStyle) );
        }
        callback(null);
      });
    });
  }

  //Deep space objects
  if (cfg.dsos.show) { 
    q.defer(function(callback) { 
      d3.json(path +  cfg.dsos.data, function(error, json) {
        if (error) callback(error);

        var cond = getData(json, cfg.transform);
        
        objects.selectAll(".dsos")
          .data(cond.features.filter( function(d) {
            return clip(d.geometry.coordinates) === 1 && 
                   (d.properties.mag === 999 && Math.sqrt(parseInt(d.properties.dim)) > cfg.dsos.limit ||
                   d.properties.mag !== 999 && d.properties.mag <= cfg.dsos.limit); 
          }))
          .enter().append("path")
          .attr("class", function(d) { return "dso " + d.properties.type; })
          .style({"fill": function(d) {  if (has(cfg.dsos.symbols[d.properties.type], "stroke")) return "none";
                    return cfg.dsos.colors ? cfg.dsos.symbols[d.properties.type].fill : cfg.dsos.style.fill; },
                  "fill-opacity": cfg.dsos.style.opacity,
                  "stroke": function(d) { if (!has(cfg.dsos.symbols[d.properties.type], "stroke")) return "none";
                     return cfg.dsos.colors ? cfg.dsos.symbols[d.properties.type].stroke : cfg.dsos.style.stroke; },
                  "stroke-width": function(d) { if (!has(cfg.dsos.symbols[d.properties.type], "width")) return 1;
                     return cfg.dsos.colors ? cfg.dsos.symbols[d.properties.type].width : cfg.dsos.style.width; },
                  "stroke-opacity": cfg.dsos.style.opacity,
          })
          .attr("transform", function(d) { return point(d.geometry.coordinates); })
          .attr("d", function(d) { return dsoSymbol(d.properties); });
      
        if (cfg.dsos.names) { 
          objects.selectAll(".dsonames")
            .data(cond.features.filter( function(d) {
              return clip(d.geometry.coordinates) === 1 && 
                   (d.properties.mag == 999 && Math.sqrt(parseInt(d.properties.dim)) > cfg.dsos.nameLimit ||
                     d.properties.mag != 999 && d.properties.mag <= cfg.dsos.nameLimit); 
            }))
            .enter().append("text")
            .attr("class", function(d) { return "dsoname " + d.properties.type; } )
            .attr("transform", function(d) { return point(d.geometry.coordinates); })
            .text( function(d) { return dsoName(d.properties); } )
            .attr({dy: "-.5em", dx: ".35em"})
            .style({"fill": function(d) { return cfg.dsos.colors ? cfg.dsos.symbols[d.properties.type].fill : cfg.dsos.style.fill; },
                    "fill-opacity": cfg.dsos.style.opacity,
                    "font": cfg.dsos.nameStyle.font,
                    "text-anchor": svgAlign(cfg.dsos.nameStyle.align)
            });
        }
        callback(null);
      });
    });
  }

  if ((cfg.location || cfg.formFields.location) && cfg.planets.show && Celestial.origin) {
    q.defer(function(callback) {
      var dt = Celestial.date(),
          o = Celestial.origin(dt).spherical(),
          jp = {type: "FeatureCollection", features: []};
      Celestial.container.selectAll(".planet").each(function(d) {
        var id = d.id(), r = 6,
            p = d(dt).equatorial(o);
            
        p.ephemeris.pos = transformDeg(p.ephemeris.pos, euler[cfg.transform]);  //transform; 
        if (clip(p.ephemeris.pos) === 1) {
          jp.features.push(createEntry(p));
        }
      });
      if (cfg.planets.symbolType === "disk") {
        objects.selectAll(".planets")
         .data(jp.features)
         .enter().append("path")
         .attr("transform", function(d) { return point(d.geometry.coordinates); })
         .attr("d", function(d) { return planetSymbol(d.properties); })
         .attr("class", "planet")
         .style ( svgTextStyle(cfg.planets.symbolStyle) )
         .style("fill", function(d) { return cfg.planets.symbols[d.id].fill; });
      } else {
        objects.selectAll(".planets")
         .data(jp.features)
         .enter().append("text")
         .attr("transform", function(d) { return point(d.geometry.coordinates); })
         .text( function(d) { return d.properties.symbol; })
         .attr("class", "planet")
         .style ( svgTextStyle(cfg.planets.symbolStyle) )
         .style("fill", function(d) { return cfg.planets.symbols[d.id].fill; });
      }
        
        // "lun" svgCustomSymbol().type("crescent").size(144).age(p.ephemeris.age);

      //name
      if (cfg.planets.names) {
        objects.selectAll(".planetnames")
         .data(jp.features)
         .enter().append("text")
         .attr("transform", function(d) { return point(d.geometry.coordinates); })
         .text( function(d) { return d.properties.name; })
         .attr({dy: ".75em", dx: "-.35em", class: "planetname"})
         .style ( svgTextStyle(cfg.planets.nameStyle) )
         .style("fill", function(d) { return cfg.planets.symbols[d.id].fill; });
      }
      callback(null);
    });  
  }
  
  if ((cfg.location || cfg.formFields.location) && cfg.horizon.show && !proj.clip) {
    q.defer(function(callback) {
      var horizon = d3.geo.circle().angle([90]).origin(Celestial.nadir());
     
      foreground.append("path").datum(horizon)
       .attr("class", "horizon")
       .attr("d", map)
       .style( svgStyle(cfg.horizon) );  
      callback(null);
    });
  }
  
  
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

  function svgStyle(s) {
    var res = {};
    res.fill = s.fill || "none";
    res["fill-opacity"] = s.opacity || 1;  
    res.stroke = s.stroke || "none";
    res["stroke-width"] = s.width || null;
    res["stroke-opacity"] = s.opacity || 1;  
    if (has(s, "dash")) res["stroke-dasharray"] = s.dash.join(" ");
    else res["stroke-dasharray"] = "none";
    res.font = s.font || null;
    return res;
  }

  function svgTextStyle(s) {
    var res = {};
    res.stroke = "none";
    res.fill = s.fill || "none";
    res["fill-opacity"] = s.opacity || 1;  
    //res.textBaseline = s.baseline || "bottom";
    res["text-anchor"] = svgAlign(s.align);
    res.font = s.font || null;
    return res;
  }

  function svgStyleA(rank, s) {
    var res = {};
    rank = rank || 1;
    res.fill = isArray(s.fill) ? s.fill[rank-1] : null;
    res["fill-opacity"] = isArray(s.opacity) ? s.opacity[rank-1] : 1;  
    res.stroke = isArray(s.stroke) ? s.stroke[rank-1] : null;
    res["stroke-width"] = isArray(s.width) ? s.width[rank-1] : null;
    res["stroke-opacity"] = isArray(s.opacity) ? s.opacity[rank-1] : 1;  
    res["text-anchor"] = svgAlign(s.align);
    res.font = isArray(s.font) ? s.font[rank-1] : null;
    //res.textBaseline = s.baseline || "bottom";
    return res;
  }

  function svgAlign(s) {
    if (!s) return "start";
    if (s === "center") return "middle"; 
    if (s === "right") return "end";
    return "start";
  }

  function dsoSymbol(p) {
    var size = dsoSize(p.mag, p.dim) || 9,
        type = dsoShape(p.type);
    if (d3.svg.symbolTypes.indexOf(type) !== -1) {
      return d3.svg.symbol().type(type).size(size)();
    } else {
      return d3.svg.customSymbol().type(type).size(size)();
    }
  }

  function dsoShape(type) {
    if (!type || !has(cfg.dsos.symbols, type)) return "circle"; 
    else return cfg.dsos.symbols[type].shape; 
  }

  function dsoSize(mag, dim) {
    if (!mag || mag === 999) return Math.pow(parseInt(dim) * cfg.dsos.size * adapt / 7, 0.5); 
    return Math.pow(2 * cfg.dsos.size * adapt - mag, cfg.dsos.exponent);
  }
 
  function dsoName(p) {
    return p[cfg.dsos.namesType]; 
  }

  function dsoColor(p) {
    if (cfg.dsos.colors === true) return svgStyle(cfg.dsos.symbols[p.type]);
    return svgStyle(cfg.dsos.style);
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
  
  function constName(d) { 
    return d.properties[cfg.constellations.namesType]; 
  }

  function planetSymbol(p) { 
    var size = planetSize(p.mag) || 2;
    return d3.svg.symbol().type("circle").size(size)();
  }

  function planetSize(m) {
    var mag = m || 2; 
    var r = 4 * adapt * Math.exp(-0.05 * (mag+2));
    return Math.max(r, 2);
  }

  function createEntry(o) {
    var res = {type: "Feature", "id":o.desig.toLowerCase(), properties: {}, geometry:{}};
    res.properties.name = o[cfg.planets.namesType];
    if (cfg.planets.symbolType === "symbol" || cfg.planets.symbolType === "letter")
      res.properties.symbol = cfg.planets.symbols[res.id][cfg.planets.symbolType];
    res.properties.mag = o.ephemeris.mag || 10;
    if (res.id === "lun")
      res.properties.age = o.ephemeris.age;
    res.geometry.type = "MultiLineString";
    res.geometry.coordinates = o.ephemeris.pos;
    return res;
  }

  var customSvgSymbols = d3.map({
    'ellipse': function(size, ratio) {
      var s = Math.sqrt(size), 
          rx = s*0.666, ry = s/3;
      return 'M' + (-rx) + ',' + (-ry) +
      ' m' + (-rx) + ',0' +
      ' a' + rx + ',' + ry + ' 0 1,0' + (rx * 2) + ',0' +
      ' a' + rx + ',' + ry + ' 0 1,0' + (-(rx * 2)) + ',0';
    },
    'marker': function(size, ratio) {
      var s =  size > 48 ? size / 4 : 12,
          r = s/2, l = r-3;
      return 'M ' + (-r) + ' 0 h ' + l + 
             ' M 0 ' + (-r) + ' v ' + l + 
             ' M ' + r + ' 0 h ' + (-l) +  
             ' M 0 ' + r + ' v ' + (-l);
    },
    'cross-circle': function(size, ratio) {
      var s = Math.sqrt(size), 
          r = s/2;
      return 'M' + (-r) + ',' + (-r) +
      ' m' + (-r) + ',0' +
      ' a' + r + ',' + r + ' 0 1,0' + (r * 2) + ',0' +
      ' a' + r + ',' + r + ' 0 1,0' + (-(r * 2)) + ',0' +
      ' M' + (-r) + ' 0 h ' + (s) + 
      ' M 0 ' + (-r) + ' v ' + (s);
          
    },
    'stroke-circle': function(size, ratio) {
      var s = Math.sqrt(size), 
          r = s/2;
      return 'M' + (-r) + ',' + (-r) +
      ' m' + (-r) + ',0' +
      ' a' + r + ',' + r + ' 0 1,0' + (r * 2) + ',0' +
      ' a' + r + ',' + r + ' 0 1,0' + (-(r * 2)) + ',0' +
      ' M' + (-s-2) + ',' + (-s-2) + ' l' + (s+4) + ',' + (s+4);

    }, 
    "crescent": function(size, ratio) {
      var s = Math.sqrt(size), 
          r = s/2,
          age = ratio,
          ph = 0.5 * (1 - Math.cos(age)),
          e = 1.6 * Math.abs(ph - 0.5) + 0.01,
          dir = age > Math.PI,
          termdir = Math.abs(ph) > 0.5 ? dir : !dir; 

      return 'M' + (-r) + ',' + (-r) +
      ' m 0,' + (-r) + 
      ' a' + r + ',' + r + ' 0 1,0 0,' + (r * 2) +
      ' a' + (r*e) + ',' + r + ' 0 1,0 0,' + (-(r * 2)) + 'z';
    } 
  });

  d3.svg.customSymbol = function() {
    var type, size = 64, ratio = 1;
    
    function symbol(d,i) {
      return customSvgSymbols.get(type.call(this,d,i))(size.call(this,d,i), ratio);
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
    symbol.ratio = function(_) {
      if (!arguments.length) return ratio; 
      ratio = d3.functor(_);
      return symbol;
    };
    return symbol;
  };

  q.await(function(error) {
    if (error) throw error;
    var svg = d3.select("svg")
      .attr("title", "D3-Celestial")
      .attr("version", 1.1)
      .attr("xmlns", "http://www.w3.org/2000/svg");

    var blob = new Blob([svg.node().outerHTML], {type:"image/svg+xml;charset=utf-8"});
    
    var a = d3.select("body").append("a").node(); 
    a.download = "d3-celestial.svg";
    a.rel = "noopener";
    a.href = URL.createObjectURL(blob);
    a.click();
    d3.select(a).remove();
    d3.select("#d3-celestial-svg").remove();
  });

}