/* global d3, Celestial, projections, poles, getData, getPlanet, getMwbackground, getAngles, getWidth, getGridValues, has, isArray, halfπ, symbols, starnames, dsonames, bvcolor, settings, formats, transformDeg, euler, Round */
function exportSVG(fname) {
  var doc = d3.select("body").append("div").attr("id", "d3-celestial-svg").attr("style", "display: none"),
      svg = d3.select("#d3-celestial-svg").append("svg"), //.attr("style", "display: none"),
      m = Celestial.metrics(),
      cfg = settings.set(),
      path = cfg.datapath,
      proj = projections[cfg.projection],
      rotation = getAngles(cfg.center),
      center = [-rotation[0], -rotation[1]],
      scale0 = proj.scale * m.width/1024,
      projection = Celestial.projection(cfg.projection).rotate(rotation).translate([m.width/2, m.height/2]).scale([m.scale]),
      adapt = cfg.adaptable ? Math.sqrt(m.scale/scale0) : 1,
      culture = (cfg.culture !== "" && cfg.culture !== "iau") ? cfg.culture : "",
      circle, id;

  svg.selectAll("*").remove();

  var defs = svg.append("defs");

  if (proj.clip) {
    projection.clipAngle(90);
  }
  circle = d3.geo.circle().angle([179.95]).origin(center);

  svg.attr("width", m.width).attr("height", m.height);
  // .attr("viewBox", " 0 0 " + (m.width) + " " + (m.height));

  var groupNames = ['background', 'milkyWay', 'milkyWayBg', 'gridLines', 'constBoundaries', 
                    'planesequatorial', 'planesecliptic', 'planesgalactic', 'planessupergalactic',
                    'constLines', 'mapBorder','stars', 'dsos', 'planets', 'gridvaluesLon', 'gridvaluesLat', 
                    'constNames', 'starDesignations', 'starNames', 'dsoNames', 'planetNames', 'horizon', 'daylight'],
                groups = {}, styles = {};

  for (var i=0; i<groupNames.length; i++) {
     // inkscape:groupmode="layer", inkscape:label="Ebene 1" 
    groups[groupNames[i]] = svg.append('g').attr({"id": groupNames[i], ":inkscape:groupmode": "layer", ":inkscape:label": groupNames[i]});
    styles[groupNames[i]] = {};
  }

  var graticule = d3.geo.graticule().minorStep([15,10]);
  
  var map = d3.geo.path().projection(projection);

  var q = d3.queue(2);
  
  groups.background.append("path").datum(circle).attr("class", "background").attr("d", map); 
  styles.background.fill = cfg.background.fill;

  if (cfg.lines.graticule.show) {
    if (cfg.transform === "equatorial") {
      groups.gridLines.append("path").datum(graticule)
       .attr("class", "gridLines")
       .attr("d", map);
      styles.gridLines = svgStyle(cfg.lines.graticule);
    } else {
      Celestial.graticule(groups.gridLines, map, cfg.transform);
      styles.gridLines = svgStyle(cfg.lines.graticule);
    }
    if (has(cfg.lines.graticule, "lon") && cfg.lines.graticule.lon.pos.length > 0) {
      var jlon = {type: "FeatureCollection", features: getGridValues("lon", cfg.lines.graticule.lon.pos)};      
      groups.gridvaluesLon.selectAll(".gridvalues_lon")
        .data(jlon.features)
        .enter().append("text")
        .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
        .text( function(d) { return d.properties.value; } )
        .attr({dy: ".5em", dx: "-.75em", class: "gridvaluesLon"});
      styles.gridvaluesLon = svgTextStyle(cfg.lines.graticule.lon); 
    }
    if (has(cfg.lines.graticule, "lat") && cfg.lines.graticule.lat.pos.length > 0) {
      var jlat = {type: "FeatureCollection", features: getGridValues("lat", cfg.lines.graticule.lat.pos)};
      groups.gridvaluesLat.selectAll(".gridvalues_lat")
        .data(jlat.features)
        .enter().append("text")
        .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
        .text( function(d) { return d.properties.value; } )
        .attr({dy: "-.5em", dx: "-.75em", class: "gridvaluesLat"});
       styles.gridvaluesLat = svgTextStyle(cfg.lines.graticule.lat); 
    }
  }

  //Celestial planes
  for (var key in cfg.lines) {
    if (has(cfg.lines, key) && key != "graticule" && cfg.lines[key].show !== false) { 
      id = "planes" + key;
      groups[id].append("path")
         .datum(d3.geo.circle().angle([90]).origin(poles[key]) )
         .attr("class", id)
         .attr("d", map);
      styles[id] = svgStyle(cfg.lines[key]);
    }
  }

  //Milky way outline
  if (cfg.mw.show) {
    q.defer(function(callback) { 
      d3.json(path + "mw.json", function(error, json) {
        if (error) callback(error);
        var mw = getData(json, cfg.transform);
        var mw_back = getMwbackground(mw);
        
        groups.milkyWay.selectAll(".mway")
         .data(mw.features)
         .enter().append("path")
         .attr("class", "milkyWay")
         .attr("d", map);
        styles.milkyWay = svgStyle(cfg.mw.style);
        
        if (!has(cfg.background, "opacity") || cfg.background.opacity > 0.95) {
          groups.milkyWayBg.selectAll(".mwaybg")
           .data(mw_back.features)
           .enter().append("path")
           .attr("class", "milkyWayBg")
           .attr("d", map);
          styles.milkyWayBg = {"fill": cfg.background.fill, 
                   "fill-opacity": cfg.background.opacity };
        }
        callback(null);
      });
    });
  }

  //Constellation boundaries
  if (cfg.constellations.bounds) { 
    q.defer(function(callback) { 
      d3.json(path + filename("constellations", "borders"), function(error, json) {
        if (error) callback(error);

        var conb = getData(json, cfg.transform);
        if (Celestial.constellation) {
          var re = new RegExp("\\b" + Celestial.constellation + "\\b");
        }

        groups.constBoundaries.selectAll(".bounds")
         .data(conb.features)
         .enter().append("path")
         .attr("class", function(d) { return (Celestial.constellation && d.ids.search(re) !== -1) ? "constBoundariesSel" : "constBoundaries"; }) 
         .attr("d", map);

        styles.constBoundaries = svgStyle(cfg.constellations.boundStyle);
        styles.constBoundariesSel = {"fill": "none",
            "stroke": cfg.constellations.boundStyle.stroke, 
            "stroke-width": cfg.constellations.boundStyle.width * 1.5,
            "stroke-opacity": 1,
            "stroke-dasharray": "none"};
        
        callback(null);
      });
    });
  }

  //Constellation lines
  if (cfg.constellations.lines) { 
    q.defer(function(callback) { 
      d3.json(path + filename("constellations", "lines"), function(error, json) {
        if (error) callback(error);

        var conl = getData(json, cfg.transform);
        groups.constLines.selectAll(".lines")
         .data(conl.features)
         .enter().append("path")
         .attr("class", function(d) { return "constLines" + d.properties.rank; })
         .attr("d", map);

        var dasharray = has(cfg.constellations.lineStyle, "dash") ? cfg.constellations.lineStyle.dash.join(" ") : "none";
         
        styles.constLines1 = {"fill": "none", "stroke": cfg.constellations.lineStyle.stroke[0],
                              "stroke-width": cfg.constellations.lineStyle.width[0],
                              "stroke-opacity": cfg.constellations.lineStyle.opacity[0],
                              "stroke-dasharray": dasharray};
        styles.constLines2 = {"fill": "none", "stroke": cfg.constellations.lineStyle.stroke[1],
                              "stroke-width": cfg.constellations.lineStyle.width[1],
                              "stroke-opacity": cfg.constellations.lineStyle.opacity[1],
                              "stroke-dasharray": dasharray};
        styles.constLines3 = {"fill": "none", "stroke": cfg.constellations.lineStyle.stroke[2],
                              "stroke-width": cfg.constellations.lineStyle.width[2],
                              "stroke-opacity": cfg.constellations.lineStyle.opacity[2],
                              "stroke-dasharray": dasharray};
        callback(null);
      });
    });
  }

  // Map border
  q.defer(function(callback) {
    var rot = projection.rotate();
    projection.rotate([0,0,0]);
    groups.mapBorder.append("path")
     .datum(graticule.outline)
     .attr("class", "mapBorder")
     .attr("d", map);
     
    styles.mapBorder = {"fill": "none", "stroke": cfg.background.stroke, "stroke-width": cfg.background.width, "stroke-opacity": 1, "stroke-dasharray": "none" };

    projection.rotate(rot);
    callback(null);
  });  
  
  //Constellation names or designation
  if (cfg.constellations.names) { 
    q.defer(function(callback) { 
      d3.json(path + filename("constellations"), function(error, json) {
        if (error) callback(error);

        var conn = getData(json, cfg.transform);
        groups.constNames.selectAll(".constnames")
         .data(conn.features.filter( function(d) {
            return clip(d.geometry.coordinates) === 1; 
          }))
         .enter().append("text")
         .attr("class", function(d) { return "constNames" + d.properties.rank; })
         .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
         .text( function(d) { return constName(d); } ); 
 
        styles.constNames1 = {"fill": cfg.constellations.nameStyle.fill[0],
                              "fill-opacity": cfg.constellations.nameStyle.opacity[0],
                              "font": cfg.constellations.nameStyle.font[0],
                              "text-anchor": svgAlign(cfg.constellations.nameStyle.align)};
        styles.constNames2 = {"fill": cfg.constellations.nameStyle.fill[1],
                              "fill-opacity": cfg.constellations.nameStyle.opacity[1],
                              "font": cfg.constellations.nameStyle.font[1],
                              "text-anchor": svgAlign(cfg.constellations.nameStyle.align)};
        styles.constNames3 = {"fill": cfg.constellations.nameStyle.fill[2],
                              "fill-opacity": cfg.constellations.nameStyle.opacity[2],
                              "font": cfg.constellations.nameStyle.font[2],
                              "text-anchor": svgAlign(cfg.constellations.nameStyle.align)};
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
        
        groups.stars.selectAll(".stars")
          .data(cons.features.filter( function(d) {
            return d.properties.mag <= cfg.stars.limit; 
          }))
          .enter().append("path")
          .attr("class", function(d) { return "stars" + starColor(d.properties.bv); })
          .attr("d", map.pointRadius( function(d) {
            return d.properties ? starSize(d.properties.mag) : 1;
          }));

        styles.stars = svgStyle(cfg.stars.style);
        var range = bvcolor.domain();
        for (i=Round(range[1],1); i<=Round(range[0],1); i+=0.1) {
          styles["stars" + Math.round(i*10).toString()] = {"fill": bvcolor(i)};
        }
          
        if (cfg.stars.designation) { 
          groups.starDesignations.selectAll(".stardesigs")
            .data(cons.features.filter( function(d) {
              return d.properties.mag <= cfg.stars.designationLimit*adapt && clip(d.geometry.coordinates) === 1; 
            }))
            .enter().append("text")
            .attr("transform", function(d) { return point(d.geometry.coordinates); })
            .text( function(d) { return starDesignation(d.id); })
            .attr({dy: ".85em", dx: ".35em", class: "starDesignations"});
          styles.starDesignations = svgTextStyle(cfg.stars.designationStyle);
        }
        if (cfg.stars.propername) { 
          groups.starNames.selectAll(".starnames")
            .data(cons.features.filter( function(d) {
              return d.properties.mag <= cfg.stars.propernameLimit*adapt && clip(d.geometry.coordinates) === 1; 
            }))
            .enter().append("text")
            .attr("transform", function(d) { return point(d.geometry.coordinates); })
            .text( function(d) { return starPropername(d.id); })
            .attr({dy: "-.5em", dx: "-.35em", class: "starNames"});

          styles.starNames = svgTextStyle(cfg.stars.propernameStyle);
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
        
        groups.dsos.selectAll(".dsos")
          .data(cond.features.filter( function(d) {
            return clip(d.geometry.coordinates) === 1 && 
                   (d.properties.mag === 999 && Math.sqrt(parseInt(d.properties.dim)) > cfg.dsos.limit*adapt ||
                   d.properties.mag !== 999 && d.properties.mag <= cfg.dsos.limit); 
          }))
          .enter().append("path")
          .attr("class", function(d) { return "dsos" + d.properties.type; })
          .attr("transform", function(d) { return point(d.geometry.coordinates); })
          .attr("d", function(d) { return dsoSymbol(d.properties); });

        styles.dsos = svgStyle(cfg.dsos.style);

        for (key in cfg.dsos.symbols) {
          if (!has(cfg.dsos.symbols, key)) continue;
          id = "dsos" + key;
          styles[id] = { "fill-opacity": cfg.dsos.style.opacity, "stroke-opacity": cfg.dsos.style.opacity };
          if (has(cfg.dsos.symbols[key], "stroke")) {
            styles[id].fill = "none"; 
            styles[id].stroke = cfg.dsos.colors ? cfg.dsos.symbols[key].stroke : cfg.dsos.style.stroke;
            styles[id]["stroke-width"] = cfg.dsos.colors ? cfg.dsos.symbols[key].width : cfg.dsos.style.width;
          } else {
            styles[id].stroke = "none"; 
            styles[id].fill = cfg.dsos.colors ? cfg.dsos.symbols[key].fill : cfg.dsos.style.fill;
          }
        }
        
      
        if (cfg.dsos.names) { 
          groups.dsoNames.selectAll(".dsonames")
            .data(cond.features.filter( function(d) {
              return clip(d.geometry.coordinates) === 1 && 
                   (d.properties.mag == 999 && Math.sqrt(parseInt(d.properties.dim)) > cfg.dsos.nameLimit ||
                     d.properties.mag != 999 && d.properties.mag <= cfg.dsos.nameLimit); 
            }))
            .enter().append("text")
            .attr("class", function(d) { return "dsoNames " + d.properties.type; })
            .attr("transform", function(d) { return point(d.geometry.coordinates); })
            .text( function(d) { return dsoName(d); })
            .attr({dy: "-.5em", dx: ".35em"});
               
          styles.dsoNames = {"fill-opacity": cfg.dsos.style.opacity,
                    "font": cfg.dsos.nameStyle.font,
                    "text-anchor": svgAlign(cfg.dsos.nameStyle.align)};
          
          for (key in cfg.dsos.symbols) {
            if (!has(cfg.dsos.symbols, key)) continue;
            styles[key] = {"fill": cfg.dsos.colors ? cfg.dsos.symbols[key].fill : cfg.dsos.style.fill };
          }
        }
        callback(null);
      });
    });
  }

  //Planets
  if ((cfg.location || cfg.formFields.location) && cfg.planets.show && Celestial.origin) {
    q.defer(function(callback) {
      var dt = Celestial.date(),
          o = Celestial.origin(dt).spherical(),
          jp = {type: "FeatureCollection", features: []},
          jlun = {type: "FeatureCollection", features: []};
      Celestial.container.selectAll(".planet").each(function(d) {
        var id = d.id(), r = 12,
            p = d(dt).equatorial(o);
            
        p.ephemeris.pos = transformDeg(p.ephemeris.pos, euler[cfg.transform]);  //transform; 
        if (clip(p.ephemeris.pos) === 1) {
          if (id === "lun")
            jlun.features.push(createEntry(p));
          else
            jp.features.push(createEntry(p));
        }
      });
      if (cfg.planets.symbolType === "disk") {
        groups.planets.selectAll(".planets")
         .data(jp.features)
         .enter().append("path")
         .attr("transform", function(d) { return point(d.geometry.coordinates); })
         .attr("d", function(d) { 
           var r = (has(cfg.planets.symbols[d.id], "size")) ? (cfg.planets.symbols[d.id].size - 1) * adapt : null;
           return planetSymbol(d.properties, r); 
         })
         .attr("class", function(d) { return "planets " + d.id; });
      } else {
        groups.planets.selectAll(".planets")
         .data(jp.features)
         .enter().append("text")
         .attr("transform", function(d) { return point(d.geometry.coordinates); })
         .text( function(d) { return d.properties.symbol; })
         .attr("class", function(d) { return "planets " + d.id; })
         .attr({dy: ".35em"});
      }
      // Special case for Moon crescent
      if (jlun.features.length > 0) {
        if (cfg.planets.symbolType === "letter") {
          groups.planets.selectAll(".moon")
           .data(jlun.features)
           .enter().append("text")
           .attr("transform", function(d) { return point(d.geometry.coordinates); })
           .text( function(d) { return d.properties.symbol; })
           .attr("class", function(d) { return "planets " + d.id; })
           .attr({dy: ".35em"});
        } else {
          var rl = has(cfg.planets.symbols.lun, "size") ? (cfg.planets.symbols.lun.size - 1) * adapt : 11 * adapt; 
          groups.planets.selectAll(".dmoon")
           .data(jlun.features)
           .enter().append("path")
           .attr("class", "darkluna" )
           .attr("transform", function(d) { return point(d.geometry.coordinates); })
           .attr("d", function(d) { return d3.svg.symbol().type("circle").size(rl*rl)(); });
          groups.planets.selectAll(".moon")
           .data(jlun.features)
           .enter().append("path")
           .attr("class", function(d) { return "planets " + d.id; })
           .attr("transform", function(d) { return point(d.geometry.coordinates); })
           .attr("d", function(d) { return moonSymbol(d.properties, rl); });
        }
      } 
      
      styles.planets = svgTextStyle(cfg.planets.symbolStyle);
      styles.planets.font = planetFont(cfg.planets.symbolStyle.font);
      styles.darkluna = {"fill": "#557"};
      for (key in cfg.planets.symbols) {
         if (!has(cfg.planets.symbols, key)) continue;
         styles[key] = {"fill": cfg.planets.symbols[key].fill};
      }
        
      //Planet names
      if (cfg.planets.names) {
        groups.planetNames.selectAll(".planetnames")
         .data(jp.features)
         .enter().append("text")
         .attr("transform", function(d) { return point(d.geometry.coordinates); })
         .text( function(d) { return d.properties.name; })
         .attr({dy: ".85em", dx: "-.35em"})
         .attr("class", function(d) { return "planetNames " + d.id; });
        if (jlun.features.length > 0) {
          groups.planetNames.selectAll(".moonname")
           .data(jlun.features)
           .enter().append("text")
           .attr("transform", function(d) { return point(d.geometry.coordinates); })
           .text( function(d) { return d.properties.name; })
           .attr({dy: ".85em", dx: "-.35em"})
           .attr("class", function(d) { return "planetNames " + d.id; });
        }
      }
      styles.planetNames = svgTextStyle(cfg.planets.nameStyle);
      
      callback(null);
    });  
  }
  
  if ((cfg.location || cfg.formFields.location) && cfg.daylight.show && proj.clip) {
    q.defer(function(callback) {
      var sol = getPlanet("sol");
      if (sol) {
        var up = Celestial.zenith(),
            solpos = sol.ephemeris.pos,
            dist = d3.geo.distance(up, solpos),
            pt = projection(solpos),
            daylight = d3.geo.circle().angle([179.95]).origin(solpos);

        groups.daylight.append("path").datum(daylight)
         .attr("class", "daylight")
         .attr("d", map);
       
        styles.daylight = svgSkyStyle(dist, pt);  

        if (clip(solpos) === 1 && dist < halfπ) {
          groups.daylight.append("circle")
           .attr("cx", pt[0])
           .attr("cy", pt[1])
           .attr("r", 5)
           .style("fill", "#fff");
        }
      }
      callback(null);
    });  
  }

  if ((cfg.location || cfg.formFields.location) && cfg.horizon.show && !proj.clip) {
    q.defer(function(callback) {
      var horizon = d3.geo.circle().angle([90]).origin(Celestial.nadir());
     
      groups.horizon.append("path").datum(horizon)
       .attr("class", "horizon")
       .attr("d", map);
      styles.horizon =  svgStyle(cfg.horizon);  
      callback(null);
    });
  }
  
  if (Celestial.data.length > 0) { 
    Celestial.data.forEach( function(d) {
      if (has(d, "save")) {
       q.defer(function(callback) { 
         d.save(); 
        callback(null);
       });
      }
    });
  }
  
  // Helper functions
  
  function clip(coords) {
    return proj.clip && d3.geo.distance(center, coords) > halfπ ? 0 : 1;
  }

  function point(coords) {
    return "translate(" + projection(coords) + ")";
  }
    
  function filename(what, sub, ext) {
    var cult = (has(formats[what], culture)) ? "." + culture : "";
    ext = ext ? "." + ext : ".json";
    sub = sub ? "." + sub : "";
    return what + sub + cult + ext;
  }

  function svgStyle(s) {
    var res = {};
    res.fill = s.fill || "none";
    res["fill-opacity"] = s.opacity !== null ? s.opacity : 1;  
    res.stroke = s.stroke || "none";
    res["stroke-width"] = s.width !== null ? s.width : 0;
    res["stroke-opacity"] = s.opacity !== null ? s.opacity : 1;  
    if (has(s, "dash")) res["stroke-dasharray"] = s.dash.join(" ");
    else res["stroke-dasharray"] = "none";
    res.font = s.font || null;
    return res;
  }

  function svgTextStyle(s) {
    var res = {};
    res.stroke = "none";
    res.fill = s.fill || "none";
    res["fill-opacity"] = s.opacity !== null ? s.opacity : 1;  
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

  function svgSkyStyle(dist, pt) {
    var factor, color1, color2, color3,
        upper = 1.36, 
        lower = 1.885;
    
    if (dist > lower) return {fill: "transparent"};
    
    if (dist <= upper) { 
      color1 = "#daf1fa";
      color2 = "#93d7f0"; 
      color3 = "#57c0e8"; 
      factor = -(upper-dist) / 10; 
    } else {
      factor = (dist - upper) / (lower - upper);
      color1 = d3.interpolateLab("#daf1fa", "#e8c866")(factor);
      color2 = d3.interpolateLab("#93c7d0", "#ff854a")(factor);
      color3 = d3.interpolateLab("#57b0c8", "#6caae2")(factor);
    }

    var gradient = groups.daylight.append("radialGradient")
     .attr("cx", pt[0])
     .attr("cy", pt[1])
     .attr("fr", "0")
     .attr("r", "300")
     .attr("id", "skygradient")
     .attr("gradientUnits", "userSpaceOnUse");

    gradient.append("stop").attr("offset", "0").attr("stop-color", color1);
    gradient.append("stop").attr("offset", 0.2+0.4*factor).attr("stop-color", color2);
    gradient.append("stop").attr("offset", "1").attr("stop-color", color3);

    return {"fill": "url(#skygradient)", "fill-opacity": skyTransparency(factor, 1.4)};
  }

  function skyTransparency(t, a) {
    return 0.9 * (1 - ((Math.pow(Math.E, t*a) - 1) / (Math.pow(Math.E, a) - 1)));
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
 
  function dsoName(d) {
    //return p[cfg.dsos.namesType]; 
    var lang = cfg.dsos.namesType, id = d.id;
    if (lang === "desig" || !has(dsonames, id)) return d.properties.desig;
    return has(dsonames[id], lang) ? dsonames[id][lang] : d.properties.desig; 
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
    var lang = cfg.stars.propernameType;
    if (!has(starnames, id)) return "";
    return has(starnames[id], lang) ? starnames[id][lang] : starnames[id].name; 
  }

  function starSize(mag) {
    if (mag === null) return 0.1; 
    var d = cfg.stars.size * adapt * Math.exp(cfg.stars.exponent * (mag + 2));
    return Math.max(d, 0.1);
  }
  
  function starColor(bv) {
    if (!cfg.stars.colors || isNaN(bv)) return ""; 
    return Math.round(bv*10).toString();
  }
  
  function constName(d) { 
    return d.properties[cfg.constellations.namesType]; 
  }

  function moonSymbol(p, r) { 
    var size = r ? r*r : 121;
    return d3.svg.customSymbol().type("crescent").size(size).ratio(p.age)();
  }

  function planetSymbol(p, r) { 
    var size = r ? r*r : planetSize(p.mag);
    return d3.svg.symbol().type("circle").size(size)();
  }

  function planetFont(s) {
    var size = s.replace(/(^\D*)(\d+)(\D.+$)/i,'$2');
    size = Math.round(adapt * size);
    return s.replace(/(^\D*)(\d+)(\D.+$)/i,'$1' + size + '$3');
  }

  function planetSize(m) {
    var mag = m || 2; 
    var r = 4 * adapt * Math.exp(-0.05 * (mag+2));
    return Math.max(r, 2);
  }

  function createEntry(o) {
    var res = {type: "Feature", "id":o.id, properties: {}, geometry:{}};
    res.properties.name = o[cfg.planets.namesType];
    if (cfg.planets.symbolType === "symbol" || cfg.planets.symbolType === "letter")
      res.properties.symbol = cfg.planets.symbols[res.id][cfg.planets.symbolType];
    res.properties.mag = o.ephemeris.mag || 10;
    if (res.id === "lun") {
      res.properties.age = o.ephemeris.age;
      res.properties.phase = o.ephemeris.phase;
    }
    res.geometry.type = "Point";
    res.geometry.coordinates = o.ephemeris.pos;
    return res;
  }

  function createStyles() {
    var res = "";
    for (var key in styles) {
      if (!has(styles, key)) continue;
      res += " ." + key + stringifyStyle(styles[key]);
    }
    return "/*\u003c![CDATA[*/\n" + res + "\n/*]]\u003e*/";
  }

  function stringifyStyle(s) {
    var res = " {";
    for (var key in s) {
      if (!has(s, key)) continue;
      res += key + ":" + s[key] + "; ";
    }
    return res + "} ";
  }

  q.await(function(error) {
    if (error) throw error;
    var svg = d3.select("#d3-celestial-svg svg")
      .attr("title", "D3-Celestial")
      .attr("version", 1.1)
      .attr("encoding", "UTF-8")
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
      .attr("xmlns:sodipodi", "http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd")
      .attr("xmlns:inkscape", "http://www.inkscape.org/namespaces/inkscape")
      .attr("viewBox", " 0 0 " + (m.width) + " " + (m.height));

    defs.append("style")
     .attr("type", "text\/css")
     .text(createStyles());
    /*defs.append(":sodipodi:namedview")
     .attr(":inkscape:window-width", m.width+200)
     .attr(":inkscape:window-height", m.height)
     .attr(":inkscape:window-maximized", "1");*/
    if (fname) {
      var blob = new Blob([svg.node().outerHTML], {type:"image/svg+xml;charset=utf-8"});
    
      var a = d3.select("body").append("a").node(); 
      a.download = fname || "d3-celestial.svg";
      a.rel = "noopener";
      a.href = URL.createObjectURL(blob);
      a.click();
      d3.select(a).remove();
    } else if (exportCallback !== null) {
      exportCallback(svg.node().outerHTML);
    }
    d3.select("#d3-celestial-svg").remove();
  });

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
        ph = 0.5 * (1 - Math.cos(ratio)),
        e = 1.6 * Math.abs(ph - 0.5) + 0.01,
        dir = ratio > Math.PI ? 0 : 1,
        termdir = Math.abs(ph) > 0.5 ? dir : Math.abs(dir-1); 
    return 'M ' + (-1) + ',' + (-1) +
    ' m 1,' + (-r+1) + 
    ' a' + r + ',' + r + ' 0 1 ' + dir + ' 0,' + (r * 2) +
    ' a' + (r*e) + ',' + r + ' 0 1 ' + termdir + ' 0,' + (-(r * 2)) + 'z';
  } 
});

d3.svg.customSymbol = function() {
  var type, size = 64, ratio = d3.functor(1);
  
  function symbol(d,i) {
    return customSvgSymbols.get(type.call(this,d,i))(size.call(this,d,i), ratio.call(this,d,i));
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

var exportCallback = null;

Celestial.exportSVG = function(callback) {
  if (!callback) return;
  exportCallback = callback;
  exportSVG();
};