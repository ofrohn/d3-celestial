// Copyright 2015-2019 Olaf Frohn https://github.com/ofrohn, see LICENSE
!(function() {
var Celestial = {
  version: '0.6.20',
  container: null,
  data: []
};

var ANIMDISTANCE = 0.035,  // Rotation animation threshold, ~2deg in radians
    ANIMSCALE = 1.4,       // Zoom animation threshold, scale factor
    ANIMINTERVAL_R = 2000, // Rotation duration scale in ms
    ANIMINTERVAL_P = 2500, // Projection duration in ms
    ANIMINTERVAL_Z = 1500, // Zoom duration scale in ms
    zoomextent = 10,       // Default maximum extent of zoom (max/min)
    zoomlevel = 1;      // Default zoom level, 1 = 100%

var cfg, prjMap, zoom, map, circle, daylight;

// Show it all, with the given config, otherwise with default settings
Celestial.display = function(config) {
  var parentElement, animationID,
      container = Celestial.container,
      animations = [], 
      current = 0, 
      repeat = false;
  
  //Mash config with default settings
  cfg = settings.set(config); 
  cfg.stars.size = cfg.stars.size || 7;  // Nothing works without these
  cfg.stars.exponent = cfg.stars.exponent || -0.28;
  cfg.center = cfg.center || [0,0];
  if (!cfg.lang || cfg.lang.search(/^de|es$/) === -1) cfg.lang = "name";
  if (isNumber(cfg.zoomextend)) zoomextent = cfg.zoomextend;
  if (isNumber(cfg.zoomlevel)) zoomlevel = cfg.zoomlevel;

  var parent = $(cfg.container);
  if (parent) { 
    parentElement = "#"+cfg.container;
    var st = window.getComputedStyle(parent, null);
    if (!parseInt(st.width) && !cfg.width) parent.style.width = px(parent.parentNode.clientWidth); 
  } else { 
    parentElement = "body"; 
    parent = null; 
  }
   
  var margin = [16, 16],
      width = getWidth(),
      pixelRatio = window.devicePixelRatio || 1,
      proj = getProjection(cfg.projection);
  if (cfg.lines.graticule.lat && cfg.lines.graticule.lat.pos[0] === "outline") proj.scale -= 2;
  
  if (!proj) return;
      
  var trans = cfg.transform || "equatorial",
      ratio = proj.ratio,
      height = width / ratio,
      scale = proj.scale * width/1024,
      starbase = cfg.stars.size, 
      dsobase = cfg.dsos.size || starbase,
      starexp = cfg.stars.exponent,
      dsoexp = cfg.dsos.exponent || starexp, //Object size base & exponent
      adapt = 1,
      rotation = getAngles(cfg.center),
      path = cfg.datapath || "";
      path = path.replace(/([^\/]$)/, "$1\/");
  
      
  if (parentElement != "body") $(cfg.container).style.height = px(height);
  
  prjMap = Celestial.projection(cfg.projection).rotate(rotation).translate([width/2, height/2]).scale(scale * zoomlevel);
    
  zoom = d3.geo.zoom().projection(prjMap).center([width/2, height/2]).scaleExtent([scale, scale * zoomextent]).on("zoom.redraw", redraw);
  // Set initial zoom level
  scale *= zoomlevel;

  var canvas = d3.select(parentElement).selectAll("canvas");
  if (canvas[0].length === 0) canvas = d3.select(parentElement).append("canvas");
  //canvas.attr("width", width).attr("height", height);
  canvas.style("width", px(width)).style("height", px(height)).attr("width", width * pixelRatio).attr("height", height * pixelRatio);
  var context = canvas.node().getContext("2d");  
  context.setTransform(pixelRatio,0,0,pixelRatio,0,0);

  var graticule = d3.geo.graticule().minorStep([15,10]);
  
  map = d3.geo.path().projection(prjMap).context(context);
   
  //parent div with id #celestial-map or body
  if (container) container.selectAll("*").remove();
  else container = d3.select(parentElement).append("container");

  if (cfg.interactive) {
    canvas.call(zoom);
    d3.select(parentElement).on('dblclick', function () { zoomBy(1.5625); return false; });
  } else {
    canvas.attr("style", "cursor: default!important");
  }

  setClip(proj.clip);

  d3.select(window).on('resize', resize);

  if (cfg.controls === true && $("celestial-zoomin") === null) {
    d3.select(parentElement).append("input").attr("type", "button").attr("id", "celestial-zoomin").attr("value", "\u002b").on("click", function () { zoomBy(1.25); return false; });
    d3.select(parentElement).append("input").attr("type", "button").attr("id", "celestial-zoomout").attr("value", "\u2212").on("click", function () { zoomBy(0.8); return false; });
  }
  
  circle = d3.geo.circle().angle([90]);  
  container.append("path").datum(circle).attr("class", "horizon");
  daylight = d3.geo.circle().angle([179.9]);
  container.append("path").datum(daylight).attr("class", "daylight");

  form(cfg);
  if ($("error") === null) d3.select("body").append("div").attr("id", "error");

  if ($("loc") === null) geo(cfg);
  else if (cfg.location === true && cfg.follow === "zenith") rotate({center: Celestial.zenith()});

  if (cfg.location === true) {
    d3.select("#location").style("display", "inline-block");
    fldEnable("horizon-show", proj.clip);
    fldEnable("daylight-show", !proj.clip);
  }
  


  function load() {
    //Celestial planes
    for (var key in cfg.lines) {
      if (!has(cfg.lines, key)) continue;
      if (key === "graticule") {
        container.append("path").datum(graticule).attr("class", "graticule"); 
        if (has(cfg.lines.graticule, "lon") && cfg.lines.graticule.lon.pos.length > 0) 
          container.selectAll(".gridvalues_lon")
            .data(getGridValues("lon", cfg.lines.graticule.lon.pos))
            .enter().append("path")
            .attr("class", "graticule_lon"); 
        if (has(cfg.lines.graticule, "lat") && cfg.lines.graticule.lat.pos.length > 0) 
          container.selectAll(".gridvalues_lat")
            .data(getGridValues("lat", cfg.lines.graticule.lat.pos))
            .enter().append("path")
            .attr("class", "graticule_lat"); 
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
      var mw_back = getMwbackground(mw);

      container.selectAll(".mway")
         .data(mw.features)
         .enter().append("path")
         .attr("class", "mw");
      container.selectAll(".mwaybg")
         .data(mw_back.features)
         .enter().append("path")
         .attr("class", "mwbg");
    }); 

    //Constellation names or designation
    d3.json(path + "constellations.json", function(error, json) {
      if (error) return console.warn(error);
      
      var con = getData(json, trans);
      
      container.selectAll(".constnames")
         .data(con.features)
         .enter().append("text")
         .attr("class", "constname");

      var l = getConstellationList(json, trans);
      if ($("constellation")) {
        var sel = d3.select("#constellation"),
            selected = 0,
            list = Object.keys(l).map( function (key, i) { 
              if (key === config.constellation) selected = i;
              return {o:key, n:l[key].name};
            });
        list = [{o:"", n:"(Select constellation)"}].concat(list);
        
        sel.selectAll('option').data(list).enter().append('option')
           .attr("value", function (d) { return d.o; })
           .text(function (d) { return d.n; });
        sel.property("selectedIndex", selected);
        //$("constellation").firstChild.disabled = true;
      }
      Celestial.constellations = l;
    });

    //Constellation boundaries
    d3.json(path + "constellations.bounds.json", function(error, json) {
      if (error) return console.warn(error);

      var conb = getData(json, trans);
      
      container.selectAll(".bounds")
         .data(conb.features)
         .enter().append("path")
         .attr("class", "boundaryline");
    });

    //Constellation lines
    d3.json(path + "constellations.lines.json", function(error, json) {
      if (error) return console.warn(error);

      var conl = getData(json, trans);

      container.selectAll(".lines")
         .data(conl.features)
         .enter().append("path")
         .attr("class", "constline");
    });
    
    //Stars
    d3.json(path + cfg.stars.data, function(error, json) {
      if (error) return console.warn(error);

      var st = getData(json, trans);

      container.selectAll(".stars")
         .data(st.features)
         .enter().append("path")
         .attr("class", "star");
    });

    //Deep space objects
    d3.json(path + cfg.dsos.data, function(error, json) {
      if (error) return console.warn(error);
      
      var ds = getData(json, trans);

      container.selectAll(".dsos")
         .data(ds.features)
         .enter().append("path")
         .attr("class", "dso" );
    });

    //Planets, Sun & Moon
    d3.json(path + "planets.json", function(error, json) {
      if (error) return console.warn(error);
      
      var pl = getPlanets(json, trans);

      container.selectAll(".planets")
         .data(pl)
         .enter().append("path")
         .attr("class", "planet");
    });

    if (Celestial.data.length > 0) { 
      Celestial.data.forEach( function(d) {
        if (has(d, "file")) d3.json(d.file, d.callback);
        else setTimeout(d.callback, 0);
      }, this);
    }
    redraw();
  }
  
  // Zoom by factor; >1 larger <1 smaller 
  function zoomBy(factor) {
    if (!factor || factor === 1) return;
    var sc0 = prjMap.scale(),
        sc1 = sc0 * factor,
        ext = zoom.scaleExtent(),
        interval = ANIMINTERVAL_Z * Math.sqrt(Math.abs(1-factor));
        
    if (sc1 < ext[0]) sc1 = ext[0];
    if (sc1 > ext[1]) sc1 = ext[1];
    var zTween = d3.interpolateNumber(sc0, sc1);
    d3.select({}).transition().duration(interval).tween("scale", function () {
        return function(t) {
          var z = zTween(t);
          prjMap.scale(z); 
          redraw(); 
        };   
    }).transition().duration(0).tween("scale", function () {
      zoom.scale(sc1); 
      redraw(); 
    });
    return interval;
  }  
  
  function apply(config) {
    cfg = cfg.set(config); 
    redraw();
  }


  function rotate(config) {
    var cFrom = cfg.center, 
        rot = prjMap.rotate(),
        sc = prjMap.scale(),
        interval = ANIMINTERVAL_R,
        keep = false, 
        cTween, zTween, oTween,
        oof = cfg.orientationfixed;
    
    if (Round(rot[1], 1) === -Round(config.center[1], 1)) keep = true; //keep lat fixed if equal
    cfg = cfg.set(config);
    var d = Round(d3.geo.distance(cFrom, cfg.center), 2);
    var o = d3.geo.distance([cFrom[2],0], [cfg.center[2],0]);
    if (d < ANIMDISTANCE && o < ANIMDISTANCE) {  
      rotation = getAngles(cfg.center);
      prjMap.rotate(rotation);
      redraw();
    } else {
      // Zoom interpolator
      if (sc > scale * ANIMSCALE) zTween = d3.interpolateNumber(sc, scale);
      else zTween = function () { return sc; };
      // Orientation interpolator
      if (o === 0) oTween = function () { return rot[2]; };
      else oTween = interpolateAngle(cFrom[2], cfg.center[2]);
      if (d > 3.14) cfg.center[0] -= 0.01; //180deg turn doesn't work well
      cfg.orientationfixed = false;  
      // Rotation interpolator
      if (d === 0) cTween = function () { return cfg.center; };
      else cTween = d3.geo.interpolate(cFrom, cfg.center);
      interval = (d !== 0) ? interval * d : interval * o; // duration scaled by ang. distance
      d3.select({}).transition().duration(interval).tween("center", function () {
        return function(t) {
          var c = getAngles(cTween(t));
          c[2] = oTween(t);
          var z = t < 0.5 ? zTween(t) : zTween(1-t);
          if (keep) c[1] = rot[1]; 
          prjMap.scale(z);
          prjMap.rotate(c);
          redraw();
        };
      }).transition().duration(0).tween("center", function () {
        cfg.orientationfixed = oof;
        rotation = getAngles(cfg.center);
        prjMap.rotate(rotation);
        redraw();
      });
    }
    return interval;
  }
  
  function resize(set) {
    width = getWidth();
    if (cfg.width === width && !set) return;
    height = width/ratio;
    scale = proj.scale * width/1024;
    //canvas.attr("width", width).attr("height", height);
    canvas.style("width", px(width)).style("height", px(height)).attr("width", width * pixelRatio).attr("height", height * pixelRatio);
    zoom.scaleExtent([scale, scale * zoomextent]).scale(scale * zoomlevel);
    prjMap.translate([width/2, height/2]).scale(scale * zoomlevel);
    if (parent) parent.style.height = px(height);
    scale *= zoomlevel;
    redraw();
  }

  function reproject(config) {
    var prj = getProjection(config.projection);
    if (!prj) return;
    
    var rot = prjMap.rotate(), ctr = prjMap.center(), sc = prjMap.scale(), ext = zoom.scaleExtent(),
        prjFrom = Celestial.projection(cfg.projection).center(ctr).translate([width/2, height/2]).scale([ext[0]]),
        interval = ANIMINTERVAL_P, 
        delay = 0, 
        rTween = d3.interpolateNumber(ratio, prj.ratio);

    if (proj.clip != prj.clip) interval = 0;// Different clip = no transition
    
    var prjTo = Celestial.projection(config.projection).center(ctr).translate([width/2, width/prj.ratio/2]).scale([prj.scale * width/1024]);
    var bAdapt = cfg.adaptable;

    if (sc > ext[0]) {
      delay = zoomBy(0.1);
      setTimeout(reproject, delay, config);
      return delay + interval;
    }
    
    if (cfg.location) { 
      fldEnable("horizon-show", prj.clip);
      fldEnable("daylight-show", !prj.clip);
    }
    
    prjMap = projectionTween(prjFrom, prjTo);
    cfg.adaptable = false;

    d3.select({}).transition().duration(interval).tween("projection", function () {
      return function(_) {
        prjMap.alpha(_).rotate(rot);
        map.projection(prjMap);
        setClip(prj.clip);
        ratio = rTween(_);
        height = width/ratio;
        //canvas.attr("width", width).attr("height", height);
        canvas.style("width", px(width)).style("height", px(height)).attr("width", width * pixelRatio).attr("height",  height * pixelRatio);
        if (parent) parent.style.height = px(height);
        redraw();
      };
    }).transition().duration(0).tween("projection", function () {
      proj = prj;
      ratio = proj.ratio;
      height = width / proj.ratio;
      scale = proj.scale * width/1024;
      //canvas.attr("width", width).attr("height", height);
      canvas.style("width", px(width)).style("height", px(height)).attr("width", width * pixelRatio).attr("height", height * pixelRatio);
      if (parent) parent.style.height = px(height);
      cfg.projection = config.projection;
      prjMap = Celestial.projection(config.projection).rotate(rot).translate([width/2, height/2]).scale(scale * zoomlevel);
      map.projection(prjMap);
      setClip(proj.clip); 
      zoom.projection(prjMap).scaleExtent([scale, scale * zoomextent]).scale(scale * zoomlevel);
      cfg.adaptable = bAdapt;
      scale *= zoomlevel;
      redraw();
    });
    return interval;
  }

  
  function redraw() {  
    var rot = prjMap.rotate();
    
    context.setTransform(pixelRatio,0,0,pixelRatio,0,0);
    if (cfg.adaptable) adapt = Math.sqrt(prjMap.scale()/scale);
    if (!adapt) adapt = 1;
    starbase = cfg.stars.size;
    starexp = cfg.stars.exponent;
    dsobase = cfg.dsos.size || starbase;
    dsoexp = cfg.dsos.exponent;
    
    if (cfg.orientationfixed) {
      rot[2] = cfg.center[2]; 
      prjMap.rotate(rot);
    }
    cfg.center = [-rot[0], -rot[1], rot[2]];
    
    setCenter(cfg.center, cfg.transform);
    clear();
    
    drawOutline();
    
    //Draw all types of objects on the canvas
    if (cfg.mw.show) { 
      container.selectAll(".mw").each(function(d) { setStyle(cfg.mw.style); map(d); context.fill(); });
      // paint mw-outside in background color
      if (cfg.transform !== "supergalactic")
        container.selectAll(".mwbg").each(function(d) { setStyle(cfg.background); map(d); context.fill(); });
    }
    
    for (var key in cfg.lines) {
      if (!has(cfg.lines, key)) continue;
      if (cfg.lines[key].show !== true) continue;
      setStyle(cfg.lines[key]);
      container.selectAll("."+key).attr("d", map);  
      context.stroke(); 
    }

    if (has(cfg.lines.graticule, "lon")) {
      setTextStyle(cfg.lines.graticule.lon);
      container.selectAll(".graticule_lon").each(function(d, i) { 
        if (clip(d.geometry.coordinates)) {
          var pt = prjMap(d.geometry.coordinates);
          gridOrientation(pt, d.properties.orientation);
          context.fillText(d.properties.value, pt[0], pt[1]); 
        }
      });
    }
    
    if (has(cfg.lines.graticule, "lat")) {
      setTextStyle(cfg.lines.graticule.lat);
      container.selectAll(".graticule_lat").each(function(d, i) { 
        if (clip(d.geometry.coordinates)) {
          var pt = prjMap(d.geometry.coordinates);
          gridOrientation(pt, d.properties.orientation);
          context.fillText(d.properties.value, pt[0], pt[1]); 
        }
      });
    }
    
    drawOutline(true);

    if (cfg.constellations.show) {     
      if (cfg.constellations.bounds) { 
        container.selectAll(".boundaryline").each(function(d) { 
          setStyle(cfg.constellations.boundstyle); 
          if (Celestial.constellation && Celestial.constellation === d.id) {
            context.lineWidth *= 1.5;
            context.setLineDash([]);
          }
          map(d); 
          context.stroke(); 
        });
        drawOutline(true);
      }

      if (cfg.constellations.names) { 
        setTextStyle(cfg.constellations.namestyle);
        container.selectAll(".constname").each( function(d) { 
          if (clip(d.geometry.coordinates)) {
            setConstStyle(d.properties.rank, cfg.constellations.namestyle.font);
            var pt = prjMap(d.geometry.coordinates);
            context.fillText(constName(d), pt[0], pt[1]); 
          }
        });
      }

      if (cfg.constellations.lines) { 
        container.selectAll(".constline").each(function(d) { 
          setStyle(cfg.constellations.linestyle); 
          map(d); 
          context.stroke(); 
        });
      }
      
    }
      

    if (cfg.stars.show) { 
      setStyle(cfg.stars.style);
      container.selectAll(".star").each(function(d) {
        if (clip(d.geometry.coordinates) && d.properties.mag <= cfg.stars.limit) {
          var pt = prjMap(d.geometry.coordinates),
              r = starSize(d);
          context.fillStyle = starColor(d); 
          context.beginPath();
          context.arc(pt[0], pt[1], r, 0, 2 * Math.PI);
          context.closePath();
          context.fill();
          if (cfg.stars.names && d.properties.mag <= cfg.stars.namelimit*adapt) {
            setTextStyle(cfg.stars.namestyle);
            context.fillText(starName(d), pt[0]+r, pt[1]);      
          }
          if (cfg.stars.proper && d.properties.mag <= cfg.stars.propernamelimit*adapt) {
            setTextStyle(cfg.stars.propernamestyle);
            context.fillText(starProperName(d), pt[0]-r, pt[1]);      
          }
        }
      });
    }
    
    if (cfg.dsos.show) { 
      container.selectAll(".dso").each(function(d) {
        if (clip(d.geometry.coordinates) && dsoDisplay(d.properties, cfg.dsos.limit)) {
          var pt = prjMap(d.geometry.coordinates),
              type = d.properties.type;
          if (cfg.dsos.colors === true) setStyle(cfg.dsos.symbols[type]);
          else setStyle(cfg.dsos.style);
          var r = dsoSymbol(d, pt);
          if (has(cfg.dsos.symbols[type], "stroke")) context.stroke();
          else context.fill();
          
          if (cfg.dsos.names && dsoDisplay(d.properties, cfg.dsos.namelimit)) {
            setTextStyle(cfg.dsos.namestyle);
            if (cfg.dsos.colors === true) context.fillStyle = cfg.dsos.symbols[type].fill;
            context.fillText(dsoName(d), pt[0]+r, pt[1]-r);      
          }         
        }
      });
    }

    if (cfg.location && cfg.transform === "equatorial" && cfg.planets.show && Celestial.origin) { 
      var dt = Celestial.date(),
          o = Celestial.origin(dt).spherical();
      container.selectAll(".planet").each(function(d) {
        var id = d.id();
        var p = d(dt).equatorial(o);
        if (clip(p.pos)) {
          var pt = prjMap(p.pos),
              sym = cfg.planets.symbols[id];
          if (id !== "lun") {
            setTextStyle(cfg.planets.style);
            context.fillStyle = sym.fill;
            context.fillText(sym.symbol, pt[0], pt[1]);
          } else {
            Canvas.symbol().type("crescent").size(144).age(p.age).position(pt)(context);
          }
        }
      });
    }
    
    if (Celestial.data.length > 0) { 
      Celestial.data.forEach( function(d) {
        d.redraw();
      });
    }
    
//    drawOutline(true);
    
    if (cfg.location && cfg.daylight.show && proj.clip) {
      var sol = getPlanet("sol");
      if (sol) {
        var up = Celestial.zenith(),
            dist = d3.geo.distance(up, sol.pos),
            pt = prjMap(sol.pos);

        daylight.origin(sol.pos);
        setSkyStyle(dist, pt);
        container.selectAll(".daylight").datum(daylight).attr("d", map);
        context.fill();    
        context.fillStyle = "#fff"; 
        if (clip(sol.pos)) {
          context.beginPath();
          context.arc(pt[0], pt[1], 6, 0, 2 * Math.PI);
          context.closePath();
          context.fill();
        }
      }
    }

    if (cfg.location && cfg.horizon.show && !proj.clip) {
      circle.origin(Celestial.nadir());
      setStyle(cfg.horizon);
      container.selectAll(".horizon").datum(circle).attr("d", map);  
      context.fill(); 
      if (cfg.horizon.stroke) context.stroke(); 
    }

    if (cfg.controls) { 
      zoomState(prjMap.scale());
    }
    
    if (hasCallback) { 
      Celestial.runCallback();
    }
  }
    

  function drawOutline(stroke) {
    var rot = prjMap.rotate(),
        prj = getProjection(cfg.projection);
    
    prjMap.rotate([0,0]);
    setStyle(cfg.background);
    container.selectAll(".outline").attr("d", map);
    if (stroke === true) 
      context.stroke(); 
    else {
      //container.selectAll(".outline").remove();
      //container.append("path").datum(d3.geo.circle().angle([179.9])).attr("class", "outline");
      //setClip(false);
      context.fill();
      //setClip(prj.clip);    
    }
    prjMap.rotate(rot);
  }

  // Helper functions -------------------------------------------------
  
  function clip(coords) {
    return proj.clip && d3.geo.distance(cfg.center, coords) > halfπ ? 0 : 1;
  }

  function setStyle(s) {
    context.fillStyle = s.fill || null;
    context.strokeStyle = s.stroke || null;
    context.lineWidth = s.width || null;
    context.globalAlpha = s.opacity || 1;  
    context.font = s.font || null;
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

  function setConstStyle(rank, font) {
    if (!isArray(font)) context.font = font;
    else if (font.length === 1) context.font = font[0];
    else if (rank > font.length) context.font = font[font.length-1];
    else context.font = font[rank-1];
  }

  function setSkyStyle(dist, pt) {
    var factor, color1, color2, color3,
        upper = 1.36, 
        lower = 1.885;
    
    if (dist > lower) {
      context.fillStyle = "transparent"; 
      context.globalAlpha = 0;
      return;
    }
    
    if (dist <= upper) { 
      color1 = "#daf1fa";
      color2 = "#93d7f0"; 
      color3 = "#57c0e8"; 
      factor = -(upper-dist) / 10; 
    } else {
      factor = (dist - upper) / (lower - upper);
      color1 = d3.interpolateLab("#daf1fa", "#e8c866")(factor);
      color2 = d3.interpolateLab("#93d7d0", "#ff854a")(factor);
      color3 = d3.interpolateLab("#57c0c8", "#6caae2")(factor);
    }
    var grad = context.createRadialGradient(pt[0],pt[1],0, pt[0],pt[1],300);
    grad.addColorStop(0, color1);
    grad.addColorStop(0.2+0.4*factor, color2);
    grad.addColorStop(1, color3);
    context.fillStyle = grad;
    context.globalAlpha = 0.9 * (1 - expF(factor, 1.5));
  }
  
  function expF(t, a) {
    return (Math.pow(Math.E, t*a) - 1) / (Math.pow(Math.E, a) - 1);
  }
  
  function zoomState(sc) {
    var czi = $("celestial-zoomin"),
        czo = $("celestial-zoomout"),
        defscale = proj.scale * width/1024;
    if (!czi || !czo) return;
    czi.disabled = sc >= defscale * zoomextent * 0.99;
    czo.disabled = sc <= defscale; 
  }
  
  function setClip(setit) {
    if (setit) {
      prjMap.clipAngle(90);
      container.selectAll(".outline").remove();
      container.append("path").datum(d3.geo.circle().angle([179.9])).attr("class", "outline");
    } else {
      prjMap.clipAngle(null);
      container.selectAll(".outline").remove();
      container.append("path").datum(graticule.outline).attr("class", "outline"); 
    }        
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
    if (!prop.mag || prop.mag === 999) return Math.pow(parseInt(prop.dim) * dsobase * adapt / 7, 0.5); 
    return Math.pow(2 * dsobase * adapt - prop.mag, dsoexp);
  }
 

  function dsoName(d) {
    var prop = d.properties;
    if (prop.name === "") return; 
    if (cfg.dsos.desig && prop.desig) return prop.desig; 
    return prop.name;
  }
  
  /*Star designation, if desig = false, no long desigs  */
  function starName(d) {
    var name = d.properties.desig;
    if (!cfg.stars.desig) return name.replace(/^(HD|HIP|V\d{3}).+/, ""); 
    return name; 
  }

  function starProperName(d) {
    var name = d.properties.name;
    
    return name; 
  }
  
  function starSize(d) {
    var mag = d.properties.mag;
    if (mag === null) return 0.1; 
    var r = starbase * adapt * Math.exp(starexp * (mag+2));
    return Math.max(r, 0.1);
  }
  
  function starColor(d) {
    var bv = d.properties.bv;
    if (!cfg.stars.colors || isNaN(bv)) {return cfg.stars.style.fill; }
    return bvcolor(bv);
  }
  
  function constName(d) { 
    return cfg.constellations.desig ? d.properties.desig : d.properties[cfg.lang]; 
  }

  function gridOrientation(pos, orient) {
    var o = orient.split(""), h = "center", v = "middle"; 
    for (var i = o.length-1; i >= 0; i--) {
      switch(o[i]) {
        case "N": v = "bottom"; break;
        case "S": v = "top"; break;
        case "E": h = "left"; pos[0] += 2; break;
        case "W": h = "right";  pos[0] -= 2; break;
      }
    }
    context.textAlign = h;
    context.textBaseline = v;
    return pos;
  }
  
  function clear() {
    context.clearRect(0, 0, width + margin[0], height + margin[1]);
  }
  
  function getWidth() {
    if (cfg.width && cfg.width > 0) return cfg.width;
    if (parent) return parent.getBoundingClientRect().width - margin[0];
    return window.getBoundingClientRect().width - margin[0]*2;
  }
  
  function getProjection(p) {
    if (!has(projections, p)) return;
    var res = projections[p];
    if (!has(res, "ratio")) res.ratio = 2;  // Default w/h ratio 2:1    
    return res;
  }
  
  function getAngles(coords) {
    if (coords === null) return [0,0,0];
    var rot = eulerAngles.equatorial; 
    if (!coords[2]) coords[2] = 0;
    return [rot[0] - coords[0], rot[1] - coords[1], rot[2] + coords[2]];
  }
  
  
  function animate() {
    if (!animations || animations.length < 1) return;

    var d, a = animations[current];
    
    switch (a.param) {
      case "projection": d = reproject({projection:a.value}); break;
      case "center": d = rotate({center:a.value}); break;
      case "zoom": d = zoomBy(a.value);
    }
    if (a.callback) setTimeout(a.callback, d);
    current++;
    if (repeat === true && current === animations.length) current = 0;
    d = a.duration === 0 || a.duration < d ? d : a.duration;
    if (current < animations.length) animationID = setTimeout(animate, d);
  }
  
  function stop() {
    clearTimeout(animationID);
    //current = 0;
    //repeat = false;
  }

  
  // Exported objects and functions for adding data
  this.container = container;
  this.clip = clip;
  this.map = map;
  this.mapProjection = prjMap;
  this.context = context;
  this.metrics = function() {
    return {"width": width, "height": height, "margin": margin};
  };
  this.setStyle = setStyle;
  this.setTextStyle = setTextStyle;
  this.setConstStyle = setConstStyle;
  this.dsoSymbol = dsoSymbol;
  this.redraw = redraw; 
  this.resize = function(config) { 
    if (config && has(config, "width")) cfg.width = config.width; 
    resize(true); 
  }; 
  this.reload = function(config) { 
    if (!config || !has(config, "transform")) return;
    trans = cfg.transform = config.transform; 
    if (trans === "equatorial") graticule.minorStep([15,10]);
    else  graticule.minorStep([10,10]);
    container.selectAll("*").remove(); 
    setClip();
    container.append("path").datum(circle).attr("class", "horizon");
    load(); 
  }; 
  this.apply = function(config) { apply(config); }; 
  this.reproject = function(config) { return reproject(config); }; 
  this.rotate = function(config) { if (!config) return cfg.center; return rotate(config); }; 
  this.zoomBy = function(factor) { if (!factor) return prjMap.scale()/scale; return zoomBy(factor); };
  this.color = function(type) {
    if (!type) return "#000";
    if (has(cfg.dsos.symbols, type)) return cfg.dsos.symbols[type].fill;
    return "#000";
  };
  this.animate = function(anims, dorepeat) { 
    if (!anims) return; 
    animations = anims; 
    current = 0; 
    repeat = dorepeat ? true : false; 
    animate(); 
  };
  this.stop  = function(wipe) {
    stop();
    if (wipe === true) animations = [];
  };
  this.go = function(index) {
    if (animations.length < 1) return;
    if (index && index < animations.length) current = index;
    animate(); 
  };

  /* obsolete
  if (!has(this, "date"))
    this.date = function() { console.log("Celestial.date() needs config.location = true to work." ); };
  */
  load();
};
 
//Export entire object if invoked by require
if (typeof module === "object" && module.exports) {
  var d3js = require('./lib/d3.js'),
      d3_geo_projection = require('./lib/d3.geo.projection.js');
  module.exports = {
    Celestial: function() { return Celestial; },
    d3: function() { return d3js; },
    "d3.geo.projection": function() { return d3_geo_projection; }
  };
}

//Flipped projection generated on the fly
Celestial.projection = function(projection) {
  var p, raw, forward;
  
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
    try {
      var coords = raw.invert(x, y);
      coords[0] = coords && -coords[0];
      return coords;
    } catch(e) { console.log(e); }
  };

  return d3.geo.projection(forward);
};


function projectionTween(a, b) {
  var prj = d3.geo.projection(raw).scale(1),
      center = prj.center,
      translate = prj.translate,
      α;

  function raw(λ, φ) {
    var pa = a([λ *= 180 / Math.PI, φ *= 180 / Math.PI]), pb = b([λ, φ]);
    return [(1 - α) * pa[0] + α * pb[0], (α - 1) * pa[1] - α * pb[1]];
  }

  prj.alpha = function(_) {
    if (!arguments.length) return α;
    α = +_;
    var ca = a.center(), cb = b.center(),
        ta = a.translate(), tb = b.translate();
    
    center([(1 - α) * ca[0] + α * cb[0], (1 - α) * ca[1] + α * cb[1]]);
    translate([(1 - α) * ta[0] + α * tb[0], (1 - α) * ta[1] + α * tb[1]]);
    return prj;
  };

  delete prj.translate;
  delete prj.center;
  return prj.alpha(0);
}

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

Celestial.eulerAngles = function () { return eulerAngles; };
Celestial.poles = function () { return poles; };

var τ = Math.PI*2,
    halfπ = Math.PI/2,
    deg2rad = Math.PI/180;


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
  "init": function () {
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
Celestial.euler = function () { return euler; };

var horizontal = function(dt, pos, loc) {
  //dt: datetime, pos: celestial coordinates [lat,lng], loc: location [lat,lng]  
  var ha = getMST(dt, loc[1]) - pos[0];
  if (ha < 0) ha = ha + 360;
  
  ha  = ha * deg2rad;
  var dec = pos[1] * deg2rad;
  var lat = loc[0] * deg2rad;

  var alt = Math.asin(Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha));
  var az = Math.acos((Math.sin(dec) - Math.sin(alt) * Math.sin(lat)) / (Math.cos(alt) * Math.cos(lat)));

  if (Math.sin(ha) > 0) az = Math.PI * 2 - az;
  
  return [alt / deg2rad, az / deg2rad, 0];
};

horizontal.inverse = function(dt, hor, loc) {
  
  var alt = hor[0] * deg2rad;
  var az = hor[1] * deg2rad;
  var lat = loc[0] * deg2rad;
   
  var dec = Math.asin((Math.sin(alt) * Math.sin(lat)) + (Math.cos(alt) * Math.cos(lat) * Math.cos(az)));
  var ha = ((Math.sin(alt) - (Math.sin(dec) * Math.sin(lat))) / (Math.cos(dec) * Math.cos(lat))).toFixed(6);
  
  ha = Math.acos(ha);
  ha  = ha / deg2rad;
  
  var ra = getMST(dt, loc[1]) - ha;
  //if (ra < 0) ra = ra + 360;
    
  return [ra, dec / deg2rad, 0];
};

function getMST(dt, lng)
{
    var yr = dt.getUTCFullYear();
    var mo = dt.getUTCMonth() + 1;
    var dy = dt.getUTCDate();
    var h = dt.getUTCHours();
    var m = dt.getUTCMinutes();
    var s = dt.getUTCSeconds();

    if ((mo == 1)||(mo == 2)) {
        yr  = yr - 1;
        mo = mo + 12;
    }

    var a = Math.floor(yr / 100);
    var b = 2 - a + Math.floor(a / 4);
    var c = Math.floor(365.25 * yr);
    var d = Math.floor(30.6001 * (mo + 1));

    // days since J2000.0
    var jd = b + c + d - 730550.5 + dy + (h + m/60.0 + s/3600.0)/24.0;
    
    // julian centuries since J2000.0
    var jt = jd/36525.0;

    // the mean sidereal time in degrees
    var mst = 280.46061837 + 360.98564736629*jd + 0.000387933*jt*jt - jt*jt*jt/38710000 + lng;

    // in degrees modulo 360.0
    if (mst > 0.0) 
        while (mst > 360.0) mst = mst - 360.0;
    else
        while (mst < 0.0)   mst = mst + 360.0;
        
    return mst;
}

Celestial.horizontal = horizontal;
//Add more JSON data to the map
var hasCallback = false;

Celestial.add = function(dat) {
  var res = {};
  //dat: {file: path, type:'json|raw', callback: func(), redraw: func()} 
  //or {file:file, size:null, shape:null, color:null}  TBI
  //  with size,shape,color: "prop=val:result;.." || function(prop) { .. return res; } 
  if (!has(dat, "type")) return console.log("Missing type");
  
  if ((dat.type === "dso" || dat.type === "json") && (!has(dat, "file") || !has(dat, "callback"))) return console.log("Can't add data file");
  if ((dat.type === "line" || dat.type === "raw") && !has(dat, "callback")) return console.log("Can't add data");
  
  if (has(dat, "file")) res.file = dat.file;
  res.type = dat.type;
  if (has(dat, "callback")) res.callback = dat.callback;
  if (has(dat, "redraw")) res.redraw = dat.redraw;
  Celestial.data.push(res);
};

Celestial.remove = function(i) {
  if (i !== null && i < Celestial.data.length) {
    return Celestial.data.splice(i,1);
  }
};

Celestial.clear = function() {
  Celestial.data = [];
};

Celestial.addCallback = function(dat) {
  Celestial.callback = dat;
  hasCallback = (dat !== null);
};

Celestial.runCallback = function(dat) {
  hasCallback = false; // avoid recursion
  Celestial.callback();
  hasCallback = true;
};
//load data and transform coordinates


function getPoint(coords, trans) {
  return transformDeg(coords, euler[trans]);
}
 
function getData(d, trans) {
  if (trans === "equatorial") return d;

  var leo = euler[trans],
      f = d.features;

  for (var i=0; i<f.length; i++)
    f[i].geometry.coordinates = translate(f[i], leo);
  
  return d;
}

function getPlanets(d) {
  var res = [];
  
  for (var key in d) {
    if (!has(d, key)) continue;
    if (cfg.planets.which.indexOf(key) === -1) continue;
    var dat = Kepler().id(key);
    if (has(d[key], "parent")) dat.parentBody(d[key].parent);
    dat.elements(d[key].elements[0]);
  
    if (key === "ter") 
      Celestial.origin = dat;
    else res.push(dat);
  }
  res.push(Kepler().id("sol"));
  res.push(Kepler().id("lun"));
  return res;
}


function getPlanet(id, dt) {
  dt = dt || Celestial.date();
  if (!Celestial.origin) return;

  var o = Celestial.origin(dt).spherical(), res;
     
  Celestial.container.selectAll(".planet").each(function(d) {
    if (id === d.id()) {
      res = d(dt).equatorial(o);
    }
  });
  return res;
}

function getConstellationList(d, trans) {
  var res = {},
      leo = euler[trans],
      f = d.features;
      
  for (var i=0; i<f.length; i++) {
    res[f[i].id] = {
      name: f[i].properties.name,
      center: f[i].properties.display.slice(0,2),
      scale: f[i].properties.display[2]
    };
  }
  return res;
}

function getMwbackground(d) {
  // geoJson object to darken the mw-outside, prevent greying of whole map in some orientations 
  var res = {'type': 'FeatureCollection', 'features': [ {'type': 'Feature', 
              'geometry': { 'type': 'MultiPolygon', 'coordinates' : [] }
            }]};

  // reverse the polygons, inside -> outside
  var l1 = d.features[0].geometry.coordinates[0];
  res.features[0].geometry.coordinates[0] = [];
  for (var i=0; i<l1.length; i++) {
    res.features[0].geometry.coordinates[0][i] = l1[i].slice().reverse();
  }

  return res;
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

function getGridValues(type, loc) {
  var lines = [];
  if (!loc) return [];
  if (!isArray(loc)) loc = [loc];
  //center, outline, values
  for (var i=0; i < loc.length; i++) {
    switch (loc[i]) {
      case "center": 
        if (type === "lat")
          lines = lines.concat(getLine(type, cfg.center[0], "N"));
        else
          lines = lines.concat(getLine(type, cfg.center[1], "S")); 
        break;
      case "outline": 
        if (type === "lon") { 
          lines = lines.concat(getLine(type, cfg.center[1]-89.99, "S"));
          lines = lines.concat(getLine(type, cfg.center[1]+89.99), "N");
        } else {
					// TODO: hemi
          lines = lines.concat(getLine(type, cfg.center[0]-179.99, "E"));
          lines = lines.concat(getLine(type, cfg.center[0]+179.99, "W"));
        }
        break;
      default: if (isNumber(loc[i])) {
        if (type === "lat")
          lines = lines.concat(getLine(type, loc[i], "N"));
        else
          lines = lines.concat(getLine(type, loc[i], "S")); 
        break;        
      }
    }
  }
  //return [{coordinates, value, orientation}, ...]
  return jsonGridValues(lines);
}

function jsonGridValues(lines) {
  var res = [];
  for (var i=0; i < lines.length; i++) {
    var f = {type: "Feature", "id":i, properties: {}, geometry:{type:"Point"}};
    f.properties.value = lines[i].value;
    f.properties.orientation = lines[i].orientation;
    f.geometry.coordinates = lines[i].coordinates;
    res.push(f);
  }
  return res;
}

function getLine(type, loc, orient) {
  var min, max, step, val, coord,
      tp = type,
      res = [],
      lr = loc;
  if (cfg.transform === "equatorial" && tp === "lon") tp = "ra";
  
  if (tp === "ra") {
    min = 0; max = 23; step = 1;
  } else if (tp === "lon") {
    min = 0; max = 350; step = 10;    
  } else {
    min = -80; max = 80; step = 10;    
  }
  for (var i=min; i<=max; i+=step) {
    var o = orient;
    if (tp === "lat") {
      coord = [lr, i];
      val = i.toString() + "\u00b0";
      if (i < 0) o += "S"; else o += "N";
    } else if (tp === "ra") {
      coord = [i * 15, lr];
      val = i.toString() + "\u02b0";
    } else {
      coord = [i, lr];
      val = i.toString() + "\u00b0";
    }
  
    res.push({coordinates: coord, value: val, orientation: o});
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

Celestial.getData = getData;
Celestial.getPoint = getPoint;
Celestial.getPlanet = getPlanet;
//Defaults
var settings = { 
  width: 0,     // Default width; height is determined by projection
  projection: "aitoff",  // Map projection used: airy, aitoff, armadillo, august, azimuthalEqualArea, azimuthalEquidistant, baker, berghaus, boggs, bonne, bromley, collignon, craig, craster, cylindricalEqualArea, cylindricalStereographic, eckert1, eckert2, eckert3, eckert4, eckert5, eckert6, eisenlohr, equirectangular, fahey, foucaut, ginzburg4, ginzburg5, ginzburg6, ginzburg8, ginzburg9, gringorten, hammer, hatano, healpix, hill, homolosine, kavrayskiy7, lagrange, larrivee, laskowski, loximuthal, mercator, miller, mollweide, mtFlatPolarParabolic, mtFlatPolarQuartic, mtFlatPolarSinusoidal, naturalEarth, nellHammer, orthographic, patterson, polyconic, rectangularPolyconic, robinson, sinusoidal, stereographic, times, twoPointEquidistant, vanDerGrinten, vanDerGrinten2, vanDerGrinten3, vanDerGrinten4, wagner4, wagner6, wagner7, wiechel, winkel3
  transform: "equatorial", // Coordinate transformation: equatorial (default), ecliptic, galactic, supergalactic
  center: null,       // Initial center coordinates in equatorial transformation [hours, degrees, degrees], 
                      // otherwise [degrees, degrees, degrees], 3rd parameter is orientation, null = default center
  geopos: null,       // optional initial geographic position [lat,lon] in degrees, overrides center
  follow: "zenith",   // on which coordinates to center the map, default: zenith, if location enabled, otherwise center
  orientationfixed: true,  // Keep orientation angle the same as center[2]
  zoomlevel: null,    // initial zoom level 0...zoomextend; 0|null = default, 1 = 100%, 0 < x <= zoomextend
  zoomextend: 10,     // maximum zoom level
  adaptable: true,    // Sizes are increased with higher zoom-levels
  interactive: true,  // Enable zooming and rotation with mousewheel and dragging
  form: false,        // Display settings form
  location: false,    // Display location settings, deprecated, use formFields
  // Set visiblity for each group of fields of the form
  formFields: {"location": true, "general": true, "stars": true, "dsos": true, "constellations": true, "lines": true, "other": true},
  daterange: [],      // Calender date range; null: displaydate-+10; [n<100]: displaydate-+n; [yr]: yr-+10; 
                      // [yr, n<100]: [yr-n, yr+n]; [yr0, yr1]
  controls: true,     // Display zoom controls
  lang: "",           // Language for names, so far only for constellations: de: german, es: spanish
                      // Default:en or empty string for english
  culture: "",        // Constellation lines, default "iau"
  container: "celestial-map",   // ID of parent element, e.g. div
  datapath: "data/",  // Path/URL to data files, empty = subfolder 'data'
  stars: {
    show: true,    // Show stars
    limit: 6,      // Show only stars brighter than limit magnitude
    colors: true,  // Show stars in spectral colors, if not use fill-style
    style: { fill: "#ffffff", opacity: 1 }, // Default style for stars
    names: true,   // Show star names (Bayer, Flamsteed, Variable star, Gliese, whichever applies first)
    proper: false, // Show proper name (if present)
    desig: false,  // Show all names, including Draper and Hipparcos
    namestyle: { fill: "#ddddbb", font: "11px 'Palatino Linotype', Georgia, Times, 'Times Roman', serif", align: "left", baseline: "top" },
    namelimit: 2.5,  // Show only names for stars brighter than namelimit
    propernamestyle: { fill: "#ddddbb", font: "13px 'Palatino Linotype', Georgia, Times, 'Times Roman', serif", align: "right", baseline: "bottom" },
    propernamelimit: 1.5,  // Show proper names for stars brighter than propernamelimit
    size: 7,       // Scale size (radius) of star circle in pixels
    exponent: -0.28, // Scale exponent for star size, larger = more linear
    data: "stars.6.json" // Data source for stellar data
  },
  dsos: {
    show: true,    // Show Deep Space Objects 
    limit: 6,      // Show only DSOs brighter than limit magnitude
    colors: true,  // Show DSOs in symbol colors if true, use style setting below if false
    style: { fill: "#cccccc", stroke: "#cccccc", width: 2, opacity: 1 }, // Default style for dsos
    names: true,   // Show DSO names
    desig: true,   // Show short DSO names
    namestyle: { fill: "#cccccc", font: "11px 'Lucida Sans Unicode', Helvetica, Arial, serif", align: "left", baseline: "top" },
    namelimit: 4,  // Show only names for DSOs brighter than namelimit
    size: null,    // Optional seperate scale size for DSOs, null = stars.size
    exponent: 1.4, // Scale exponent for DSO size, larger = more non-linear
    data: "dsos.bright.json",  // Data source for DSOs
    symbols: {  // DSO symbol styles
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
      rn: {shape: "square", fill: "#0000ff"},                                 // Reflection nebula
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
    namestyle: { fill:"#cccc99", align: "center", baseline: "middle", opacity:0.8, 
		             font: ["14px 'Lucida Sans Unicode', Helvetica, Arial, sans-serif",  // Different fonts for brighter &
								        "12px 'Lucida Sans Unicode', Helvetica, Arial, sans-serif",  // sdarker constellations
												"11px 'Lucida Sans Unicode', Helvetica, Arial, sans-serif"]},
    lines: true,   // Show constellation lines 
    linestyle: { stroke: "#cccccc", width: 1.5, opacity: 0.6 },
    bounds: false,  // Show constellation boundaries 
    boundstyle: { stroke: "#ccff00", width: 1, opacity: 0.8, dash: [2, 4] }
  },
  mw: {
    show: true,    // Show Milky Way as filled polygons 
    style: { fill: "#ffffff", opacity: "0.15" } // style for each MW-layer (5 on top of each other)
  },
  lines: {
    graticule: { show: true, stroke: "#cccccc", width: 0.6, opacity: 0.8,      // Show graticule lines 
			// grid values: "outline", "center", or [lat,...] specific position
      lon: {pos: [""], fill: "#eee", font: "10px 'Lucida Sans Unicode', Helvetica, Arial, sans-serif"}, 
			// grid values: "outline", "center", or [lon,...] specific position
		  lat: {pos: [""], fill: "#eee", font: "10px 'Lucida Sans Unicode', Helvetica, Arial, sans-serif"}},
    equatorial: { show: true, stroke: "#aaaaaa", width: 1.3, opacity: 0.7 },    // Show equatorial plane 
    ecliptic: { show: true, stroke: "#66cc66", width: 1.3, opacity: 0.7 },      // Show ecliptic plane 
    galactic: { show: false, stroke: "#cc6666", width: 1.3, opacity: 0.7 },     // Show galactic plane 
    supergalactic: { show: false, stroke: "#cc66cc", width: 1.3, opacity: 0.7 } // Show supergalactic plane 
   //mars: { show: false, stroke:"#cc0000", width:1.3, opacity:.7 }
  }, // Background style
  background: { 
    fill: "#000000", 
    opacity: 1, 
    stroke: "#000000", // Outline
    width: 1.5 
  }, 
  horizon: {  //Show horizon marker, if geo-position and date-time is set
    show: false, 
    stroke: "#cccccc", // Line
    width: 1.0, 
    fill: "#000000", // Area below horizon
    opacity: 0.5
  },  
  daylight: {  //Show approximate stae of sky at selected time
    show: false
  },
  planets: {  //Show planet locations, if date-time is set
    show: false,
    which: ["sol", "mer", "ven", "ter", "lun", "mar", "jup", "sat", "ura", "nep"],
    style: { fill: "#00ccff", font: "bold 17px 'Lucida Sans Unicode', Consolas, sans-serif", align: "center", baseline: "middle" },
    symbols: {
      "sol": {symbol: "\u2609", fill: "#ffff00"},
      "mer": {symbol: "\u263f", fill: "#cccccc"},
      "ven": {symbol: "\u2640", fill: "#eeeecc"},
      "ter": {symbol: "\u2295", fill: "#00ffff"},
      "lun": {symbol: "\u25cf", fill: "#ffffff"},
      "mar": {symbol: "\u2642", fill: "#ff9999"},
      "cer": {symbol: "\u26b3", fill: "#cccccc"},
      "ves": {symbol: "\u26b6", fill: "#cccccc"},
      "jup": {symbol: "\u2643", fill: "#ff9966"},
      "sat": {symbol: "\u2644", fill: "#ffcc66"},
      "ura": {symbol: "\u2645", fill: "#66ccff"},
      "nep": {symbol: "\u2646", fill: "#6666ff"},
      "plu": {symbol: "\u2647", fill: "#aaaaaa"},
      "eri": {symbol: "\u26aa", fill: "#eeeeee"}
    }
  },
  set: function(cfg) {  // Override defaults with values of cfg
    var prop, key, res = {};
    if (!cfg) return this; 
    for (prop in this) {
      if (!has(this, prop)) continue; 
      //if (typeof(this[prop]) === 'function'); 
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

Celestial.settings = function () { return settings; };

//b-v color index to rgb color value scale
var bvcolor = 
  d3.scale.quantize().domain([3.347, -0.335]) //main sequence <= 1.7
    .range([ '#ff4700', '#ff4b00', '#ff4f00', '#ff5300', '#ff5600', '#ff5900', '#ff5b00', '#ff5d00', '#ff6000', '#ff6300', '#ff6500', '#ff6700', '#ff6900', '#ff6b00', '#ff6d00', '#ff7000', '#ff7300', '#ff7500', '#ff7800', '#ff7a00', '#ff7c00', '#ff7e00', '#ff8100', '#ff8300', '#ff8506', '#ff870a', '#ff8912', '#ff8b1a', '#ff8e21', '#ff9127', '#ff932c', '#ff9631', '#ff9836', '#ff9a3c', '#ff9d3f', '#ffa148', '#ffa34b', '#ffa54f', '#ffa753', '#ffa957', '#ffab5a', '#ffad5e', '#ffb165', '#ffb269', '#ffb46b', '#ffb872', '#ffb975', '#ffbb78', '#ffbe7e', '#ffc184', '#ffc489', '#ffc78f', '#ffc892', '#ffc994', '#ffcc99', '#ffce9f', '#ffd1a3', '#ffd3a8', '#ffd5ad', '#ffd7b1', '#ffd9b6', '#ffdbba', '#ffddbe', '#ffdfc2', '#ffe1c6', '#ffe3ca', '#ffe4ce', '#ffe8d5', '#ffe9d9', '#ffebdc', '#ffece0', '#ffefe6', '#fff0e9', '#fff2ec', '#fff4f2', '#fff5f5', '#fff6f8', '#fff9fd', '#fef9ff', '#f9f6ff', '#f6f4ff', '#f3f2ff', '#eff0ff', '#ebeeff', '#e9edff', '#e6ebff', '#e3e9ff', '#e0e7ff', '#dee6ff', '#dce5ff', '#d9e3ff', '#d7e2ff', '#d3e0ff', '#c9d9ff', '#bfd3ff', '#b7ceff', '#afc9ff', '#a9c5ff', '#a4c2ff', '#9fbfff', '#9bbcff']);
 
/* Default parameters for each supported projection
     arg: constructor argument, if any 
     scale: scale parameter so that they all have ~equal width, normalized to 1024 pixels
     ratio: width/height ratio, 2.0 if none
     clip: projection clipped to 90 degrees from center, otherwise to antimeridian
*/
var projections = {
  "airy": {n:"Airy’s Minimum Error", arg:Math.PI/2, scale:360, ratio:1.0, clip:true},
  "aitoff": {n:"Aitoff", arg:null, scale:162},
  "armadillo": {n:"Armadillo", arg:0, scale:250}, 
  "august": {n:"August", arg:null, scale:94, ratio:1.4},
  "azimuthalEqualArea": {n:"Azimuthal Equal Area", arg:null, scale:340, ratio:1.0, clip:true},
  "azimuthalEquidistant": {n:"Azimuthal Equidistant", arg:null, scale:320, ratio:1.0, clip:true},
  "baker": {n:"Baker Dinomic", arg:null, scale:160, ratio:1.4},
  "berghaus": {n:"Berghaus Star", arg:0, scale:320, ratio:1.0, clip:true},
  "boggs": {n:"Boggs Eumorphic", arg:null, scale:170},
  "bonne": {n:"Bonne", arg:Math.PI/2.5, scale:225, ratio:0.88},
  "bromley": {n:"Bromley", arg:null, scale:162},
//  "butterfly": {n:"Butterfly", arg:null, scale:31, ratio:1.1, clip:true},
  "cassini": {n:"Cassini", arg:null, scale:325, ratio:1.0, clip:true},
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
  //"guyou": {n:"Guyou", arg:null, scale:160, ratio:2, clip:true},
  //"bonne": {n:"Heart", arg:Math.PI/2.5, scale:225, ratio:0.88},
  "homolosine": {n:"Goode Homolosine", arg:null, scale:160, ratio:2.2},
  "hammer": {n:"Hammer", arg:2, scale:180},
  "hatano": {n:"Hatano", arg:null, scale:186},
  "healpix": {n:"HEALPix", arg:1, scale:320, ratio:1.2},
  "hill": {n:"Hill Eucyclic", arg:2, scale:190, ratio:1.1},
  "kavrayskiy7": {n:"Kavrayskiy VII", arg:null, scale:185, ratio:1.75},
  "lagrange": {n:"Lagrange", arg:Math.PI/4, scale:88, ratio:1.6, clip:false},
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
  "quincuncial": {n:"Quincuncial", arg:null, scale:160, ratio:1.3},
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

Celestial.projections = function () { return projections; };


var Canvas = {}; 

Canvas.symbol = function () {
  // parameters and default values
  var type = d3.functor("circle"), 
      size = d3.functor(64), 
      age = d3.functor(Math.PI), //crescent shape 0..2Pi
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
          r = s/1.7;
      ctx.moveTo(pos[0]-r, pos[1]-r);
      ctx.lineTo(pos[0]+r, pos[1]-r);
      ctx.lineTo(pos[0]+r, pos[1]+r);
      ctx.lineTo(pos[0]-r, pos[1]+r);
      ctx.closePath();
      return r;
    },
    "diamond": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/1.5;
      ctx.moveTo(pos[0], pos[1]-r);
      ctx.lineTo(pos[0]+r, pos[1]);
      ctx.lineTo(pos[0], pos[1]+r);
      ctx.lineTo(pos[0]-r, pos[1]);
      ctx.closePath();
      return r;
    },
    "triangle": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/Math.sqrt(3);
      ctx.moveTo(pos[0], pos[1]-r);
      ctx.lineTo(pos[0]+r, pos[1]+r);
      ctx.lineTo(pos[0]-r, pos[1]+r);
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
      ctx.moveTo(pos[0], pos[1]-r);
      ctx.lineTo(pos[0], pos[1]+r);
      ctx.moveTo(pos[0]-r, pos[1]);
      ctx.lineTo(pos[0]+r, pos[1]);
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
      ctx.stroke();
      ctx.beginPath();
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
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos[0], pos[1]);
      ctx.arc(pos[0], pos[1], r, 0, 2 * Math.PI);    
      ctx.closePath();
      return r;
    }, 
    "crescent": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/2,
          ag = age(),
          ph = 0.5 * (1 - Math.cos(ag)),
          e = 1.6 * Math.abs(ph - 0.5) + 0.01,
          dir = ag > Math.PI,
          termdir = Math.abs(ph) > 0.5 ? dir : !dir; 

      ctx.save();
      ctx.fillStyle = "#557";
      ctx.moveTo(pos[0], pos[1]);
      ctx.arc(pos[0], pos[1], r, 0, 2 * Math.PI);    
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#eee";
      ctx.beginPath();
      ctx.moveTo(pos[0], pos[1]);
      ctx.arc(pos[0], pos[1], r, -Math.PI/2, Math.PI/2, dir); 
      ctx.scale(e, 1);
      ctx.arc(pos[0]/e, pos[1], r, Math.PI/2, -Math.PI/2, termdir); 
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      
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
  canvas_symbol.age = function(_) {
    if (!arguments.length) return age; 
    age = d3.functor(_);
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

Celestial.Canvas = Canvas;


/*var color = "#fff", angle = 0, align = "center", baseline = "middle", font = "10px sans-serif", padding = [0,0], aPos, sText;

canvas.text = function () {

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
function pad(n) { return n < 10 ? '0' + n : n; }


function has(o, key) { return o !== null && hasOwnProperty.call(o, key); }
function when(o, key, val) { return o !== null && hasOwnProperty.call(o, key) ? o[key] : val; }
function isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n); }
function isArray(o) { return Object.prototype.toString.call(o) === "[object Array]"; }
function isObject(o) { var type = typeof o;  return type === 'function' || type === 'object' && !!o; }
function isFunction(o) { return typeof o == 'function' || false; }
function isValidDate(d) { return d instanceof Date && !isNaN(d); }
function fileExists(url) {
  var http = new XMLHttpRequest();
  http.open('HEAD', url, false);
  http.send();
  return http.status != 404;
}

function findPos(o) {
  var l = 0, t = 0;
  if (o.offsetParent) {
    do {
      l += o.offsetLeft;
      t += o.offsetTop;
    } while ((o = o.offsetParent) !== null);
  }
  return [l, t];
}

function hasParent(t, id){
  while(t.parentNode){
    if(t.id === id) return true;
    t = t.parentNode;
  }
  return false;
}

function attach(node, event, func) {
  if (node.addEventListener) node.addEventListener(event, func, false);
  else node.attachEvent("on" + event, func); 
}

function stopPropagation(e) {
  if (typeof e.stopPropagation != "undefined") e.stopPropagation();
  else e.cancelBubble = true;
}

function dateDiff(dt1, dt2, type) {
  var diff = dt2.valueOf() - dt1.valueOf(),
      tp = type || "d";
  switch (tp) {
    case 'y': case 'yr': diff /= 31556926080; break;
    case 'm': case 'mo': diff /= 2629800000; break;
    case 'd': case 'dy': diff /= 86400000; break;
    case 'h': case 'hr': diff /= 3600000; break;
    case 'n': case 'mn': diff /= 60000; break;
    case 's': case 'sec': diff /= 1000; break;
    case 'ms': break;    
  }
  return Math.floor(diff);
}

function dateParse(s) {
  if (!s) return; 
  var t = s.split(".");
  if (t.length < 1) return; 
  t = t[0].split("-");
  t[0] = t[0].replace(/\D/g, "");
  if (!t[0]) return; 
  t[1] = t[1] ? t[1].replace(/\D/g, "") : "1";
  t[2] = t[2] ? t[2].replace(/\D/g, "") : "1";
  //Fraction -> h:m:s
  return new Date(Date.UTC(t[0], t[1]-1, t[2]));
}


function interpolateAngle(a1, a2, t) {
  a1 = (a1*deg2rad +τ) % τ;
  a2 = (a2*deg2rad + τ) % τ;
  if (Math.abs(a1 - a2) > Math.PI) {
    if (a1 > a2) a1 = a1 - τ;
    else if (a2 > a1) a2 = a2 - τ;
  }
  return d3.interpolateNumber(a1/deg2rad, a2/deg2rad);
}

var Trig = {
  sinh: function (val) { return (Math.pow(Math.E, val)-Math.pow(Math.E, -val))/2; },
  cosh: function (val) { return (Math.pow(Math.E, val)+Math.pow(Math.E, -val))/2; },
  tanh: function (val) { return 2.0 / (1.0 + Math.exp(-2.0 * val)) - 1.0; },
  asinh: function (val) { return Math.log(val + Math.sqrt(val * val + 1)); },
  acosh: function (val) { return Math.log(val + Math.sqrt(val * val - 1)); },
  normalize0: function(val) {  return ((val + Math.PI*3) % (Math.PI*2)) - Math.PI; },
  normalize: function(val) {  return ((val + Math.PI*2) % (Math.PI*2)); },  
  cartesian: function(p) {
    var ϕ = p[0], θ = halfπ - p[1], r = p[2];
    return {"x": r * Math.sin(θ) * Math.cos(ϕ), "y": r * Math.sin(θ) * Math.sin(ϕ), "z": r * Math.cos(θ)};
  },
  spherical: function(p) {
    var r = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z),
        θ = Math.atan(p.y / p.x),
        ϕ = Math.acos(p.z / r);
    return  [θ / deg2rad, ϕ / deg2rad, r];
  },
  distance: function(p1, p2) {
    return Math.acos(Math.sin(p1[1])*Math.sin(p2[1]) + Math.cos(p1[1])*Math.cos(p2[1])*Math.cos(p1[0]-p2[0]));
  }
};


//display settings form in div with id "celestial-form"
function form(cfg) {
  var config = settings.set(cfg); 

  var prj = Celestial.projections(), leo = Celestial.eulerAngles();
  var div = d3.select("#celestial-form");
  //if div doesn't exist, create it
  if (div.size() < 1) {
    var container = (config.container || "celestial-map");
    div = d3.select("#" + container).select(function() { return this.parentNode; }).append("div").attr("id", "celestial-form");
  }
  var ctrl = div.append("div").attr("class", "ctrl");
  var frm = ctrl.append("form").attr("id", "params").attr("name", "params").attr("method", "get").attr("action" ,"#");
  
  //Map parameters    
  var col = frm.append("div").attr("class", "col").attr("id", "general");
  
  col.append("label").attr("title", "Map width in pixel, 0 indicates full width").attr("for", "width").html("Width ");
  col.append("input").attr("type", "number").attr("maxlength", "4").attr("max", "20000").attr("min", "0").attr("title", "Map width").attr("id", "width").attr("value", config.width).on("change", resize);
  col.append("span").html("px");

  col.append("label").attr("title", "Map projection, (hemi) indicates hemispherical projection").attr("for", "projection").html("Projection");
  var sel = col.append("select").attr("id", "projection").on("change", reproject);
  var selected = 0;
  var list = Object.keys(prj).map( function (key, i) { 
    var n = prj[key].clip && prj[key].clip === true ? prj[key].n + " (hemi)" : prj[key].n; 
    if (key === config.projection) selected = i;
    return {o:key, n:n};
  });
  sel.selectAll('option').data(list).enter().append('option')
     .attr("value", function (d) { return d.o; })
     .text(function (d) { return d.n; });
  sel.property("selectedIndex", selected);
  
  selected = 0;
  col.append("label").attr("title", "Coordinate space in which the map is displayed").attr("for", "transform").html("Coordinates");
  sel = col.append("select").attr("id", "transform").on("change", reload);
  list = Object.keys(leo).map(function (key, i) {
    if (key === config.transform) selected = i;    
    return {o:key, n:key.replace(/^([a-z])/, function(s, m) { return m.toUpperCase(); } )}; 
  });
  sel.selectAll("option").data(list).enter().append('option')
     .attr("value", function (d) { return d.o; })
     .text(function (d) { return d.n; });
  sel.property("selectedIndex", selected);

  col.append("br");
  col.append("label").attr("title", "Center coordinates long/lat in selected coordinate space").attr("for", "centerx").html("Center");
  col.append("input").attr("type", "number").attr("id", "centerx").attr("title", "Center right ascension/longitude").attr("max", "24").attr("min", "0").attr("step", "0.1").on("change", turn);
  col.append("span").attr("id", "cxunit").html("h");
  //addList("centerx", "ra");
  
  col.append("input").attr("type", "number").attr("id", "centery").attr("title", "Center declination/latitude").attr("max", "90").attr("min", "-90").attr("step", "0.1").on("change", turn);
  col.append("span").html("\u00b0");

  col.append("label").attr("title", "Orientation").attr("for", "centerz").html("Orientation");
  col.append("input").attr("type", "number").attr("id", "centerz").attr("title", "Center orientation").attr("max", "180").attr("min", "-180").attr("step", "0.1").on("change", turn);
  col.append("span").html("\u00b0");

  col.append("label").attr("for", "orientationfixed").html("Fixed");
  col.append("input").attr("type", "checkbox").attr("id", "orientationfixed").property("checked", config.orientationfixed).on("change", apply);    

  col.append("label").attr("title", "Center and zoom in on this constellation").attr("for", "constellation").html("Show");
  col.append("select").attr("id", "constellation").on("change", showConstellation);

  setCenter(config.center, config.transform);

  // Stars 
  col = frm.append("div").attr("class", "col").attr("id", "stars");
  
  col.append("label").attr("class", "header").attr("for", "stars-show").html("Stars");
  col.append("input").attr("type", "checkbox").attr("id", "stars-show").property("checked", config.stars.show).on("change", apply);
  
  col.append("label").attr("for", "stars-limit").html("down to magnitude");
  col.append("input").attr("type", "number").attr("id", "stars-limit").attr("title", "Star display limit (magnitude)").attr("value", config.stars.limit).attr("max", "6").attr("min", "-1").attr("step", "0.1").on("change", apply);
  
  col.append("label").attr("for", "stars-colors").html("with spectral colors");
  col.append("input").attr("type", "checkbox").attr("id", "stars-colors").property("checked", config.stars.colors).on("change", apply);
  
  col.append("label").attr("for", "stars-color").html("or default color ");
  col.append("input").attr("type", "color").attr("autocomplete", "off").attr("id", "stars-style-fill").attr("title", "Star color").property("value", config.stars.style.fill).on("change", apply);

  col.append("br");
  
  col.append("label").attr("for", "stars-names").html("Show designations");
  col.append("input").attr("type", "checkbox").attr("id", "stars-names").property("checked", config.stars.names).on("change", apply);

  col.append("label").attr("for", "stars-namelimit").html("down to mag");
  col.append("input").attr("type", "number").attr("id", "stars-namelimit").attr("title", "Star designaton display limit (magnitude)").attr("value", config.stars.namelimit).attr("max", "6").attr("min", "-1").attr("step", "0.1").on("change", apply);
  
  col.append("label").attr("for", "stars-desig").attr("title", "include HD/HIP designations").html("all");
  col.append("input").attr("type", "checkbox").attr("id", "stars-desig").property("checked", config.stars.desig).on("change", apply);

  col.append("label").attr("for", "stars-proper").html("proper names");
  col.append("input").attr("type", "checkbox").attr("id", "stars-proper").property("checked", config.stars.proper).on("change", apply);
  
  col.append("label").attr("for", "stars-propernamelimit").html("down to mag");
  col.append("input").attr("type", "number").attr("id", "stars-propernamelimit").attr("title", "Star name display limit (magnitude)").attr("value", config.stars.propernamelimit).attr("max", "6").attr("min", "-1").attr("step", "0.1").on("change", apply);

  col.append("br");

  col.append("label").attr("for", "stars-size").html("Stellar disk size: base");
  col.append("input").attr("type", "number").attr("id", "stars-size").attr("title", "Size of the displayed star disk; base").attr("value", config.stars.size).attr("max", "100").attr("min", "0").attr("step", "0.1").on("change", apply);

  col.append("label").attr("for", "stars-exponent").html(" * e ^ (exponent");
  col.append("input").attr("type", "number").attr("id", "stars-exponent").attr("title", "Size of the displayed star disk; exponent").attr("value", config.stars.exponent).attr("max", "3").attr("min", "-1").attr("step", "0.01").on("change", apply);
  col.append("span").text(" * (magnitude + 2))  [* adaptation]");
  
  enable($("stars-show"));
  
  // DSOs 
  col = frm.append("div").attr("class", "col").attr("id", "dsos");
  
  col.append("label").attr("class", "header").attr("title", "Deep Space Objects").attr("for", "dsos-show").html("DSOs");
  col.append("input").attr("type", "checkbox").attr("id", "dsos-show").property("checked", config.dsos.show).on("change", apply);
  
  col.append("label").attr("for", "dsos-limit").html("down to mag");
  col.append("input").attr("type", "number").attr("id", "dsos-limit").attr("title", "DSO display limit (magnitude)").attr("value", config.dsos.limit).attr("max", "6").attr("min", "0").attr("step", "0.1").on("change", apply);


  col.append("label").attr("for", "dsos-colors").html("with symbol colors");
  col.append("input").attr("type", "checkbox").attr("id", "dsos-colors").property("checked", config.dsos.colors).on("change", apply);
  
  col.append("label").attr("for", "dsos-color").html("or default color ");
  col.append("input").attr("type", "color").attr("autocomplete", "off").attr("id", "dsos-style-fill").attr("title", "DSO color").property("value", config.dsos.style.fill).on("change", apply);

  col.append("br");
  
  col.append("label").attr("for", "dsos-names").html("Show names");
  col.append("input").attr("type", "checkbox").attr("id", "dsos-names").property("checked", config.dsos.names).on("change", apply);
  
  col.append("label").attr("for", "dsos-desig").html("or designations");
  col.append("input").attr("type", "checkbox").attr("id", "dsos-desig").property("checked", config.dsos.desig).on("change", apply);
  
  col.append("label").attr("for", "dsos-namelimit").html("down to mag");
  col.append("input").attr("type", "number").attr("id", "dsos-namelimit").attr("title", "DSO name display limit (magnitude)").attr("value", config.dsos.namelimit).attr("max", "6").attr("min", "0").attr("step", "0.1").on("change", apply);
  col.append("br");

  col.append("label").attr("for", "dsos-size").html("DSO symbol size: (base");
  col.append("input").attr("type", "number").attr("id", "dsos-size").attr("title", "Size of the displayed symbol: base").attr("value", config.dsos.size).attr("max", "100").attr("min", "0").attr("step", "0.1").on("change", apply);

  col.append("label").attr("for", "dsos-exponent").html(" * 2 [* adaptation] - magnitude) ^ exponent");
  col.append("input").attr("type", "number").attr("id", "dsos-exponent").attr("title", "Size of the displayed symbol; exponent").attr("value", config.dsos.exponent).attr("max", "3").attr("min", "-1").attr("step", "0.01").on("change", apply);

  enable($("dsos-show"));

  // Constellations 
  col = frm.append("div").attr("class", "col").attr("id", "constellations");
  col.append("label").attr("class", "header").html("Constellations");
  //col.append("input").attr("type", "checkbox").attr("id", "constellations-show").property("checked", config.constellations.show).on("change", apply);
  
  col.append("label").attr("for", "constellations-names").html("Show names");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-names").property("checked", config.constellations.names).on("change", apply);
  
  col.append("label").attr("for", "constellations-desig").html("abbreviated");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-desig").property("checked", config.constellations.desig).on("change", apply);
  
  col.append("label").attr("for", "constellations-lines").html("with lines");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-lines").property("checked", config.constellations.lines).on("change", apply);
  
  col.append("label").attr("for", "constellations-bounds").html("with boundaries");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-bounds").property("checked", config.constellations.bounds).on("change", apply);

  enable($("constellations-names"));

  // graticules & planes 
  col = frm.append("div").attr("class", "col").attr("id", "lines");
  col.append("label").attr("class", "header").html("Lines");
  
  col.append("label").attr("title", "Laitudet/longitude grid lines").attr("for", "lines-graticule").html("Graticule");
  col.append("input").attr("type", "checkbox").attr("id", "lines-graticule-show").property("checked", config.lines.graticule.show).on("change", apply);
  
  col.append("label").attr("for", "lines-equatorial").html("Equator");
  col.append("input").attr("type", "checkbox").attr("id", "lines-equatorial-show").property("checked", config.lines.equatorial.show).on("change", apply);
  
  col.append("label").attr("for", "lines-ecliptic").html("Ecliptic");
  col.append("input").attr("type", "checkbox").attr("id", "lines-ecliptic-show").property("checked", config.lines.ecliptic.show).on("change", apply);
  
  col.append("label").attr("for", "lines-galactic").html("Galactic plane");
  col.append("input").attr("type", "checkbox").attr("id", "lines-galactic-show").property("checked", config.lines.galactic.show).on("change", apply);
  
  col.append("label").attr("for", "lines-supergalactic").html("Supergalactic plane");
  col.append("input").attr("type", "checkbox").attr("id", "lines-supergalactic-show").property("checked", config.lines.supergalactic.show).on("change", apply);

  // Other
  col = frm.append("div").attr("class", "col").attr("id", "other");
  col.append("label").attr("class", "header").html("Other");
  
  col.append("label").attr("for", "mw-show").html("Milky Way");
  col.append("input").attr("type", "checkbox").attr("id", "mw-show").property("checked", config.mw.show).on("change", apply);
  
  col.append("label").attr("for", "mw-style-fill").html(" color");
  col.append("input").attr("type", "color").attr("id", "mw-style-fill").attr("title", "Milky Way color").attr("value", config.mw.style.fill).on("change", apply);

  col.append("label").attr("for", "mw-style-opacity").html(" opacity");
  col.append("input").attr("type", "number").attr("id", "mw-style-opacity").attr("title", "Transparency of each Milky Way layer").attr("value", config.mw.style.opacity).attr("max", "1").attr("min", "0").attr("step", "0.01").on("change", apply);
  col.append("br");
  
  col.append("label").attr("for", "background").html("Background color");
  col.append("input").attr("type", "color").attr("id", "background-fill").attr("title", "Background color").attr("value", config.background.fill).on("change", apply);
  
  col.append("label").attr("title", "Star/DSO sizes are increased with higher zoom-levels").attr("for", "adaptable").html("Adaptable object sizes");
  col.append("input").attr("type", "checkbox").attr("id", "adaptable").property("checked", config.adaptable).on("change", apply);
   
  setLimits();
  setUnit(config.transform);
  setVisibility(cfg);
  
  function resize() {
    var src = this,
        w = src.value;
    if (testNumber(src) === false) return; 
    config.width = w;
    Celestial.resize({width:w});
  }
  
  function reload() {
    var src = this,
        trans = src.value,
        cx = setUnit(trans, config.transform); 
    if (cx !== null) config.center[0] = cx; 
    config.transform = trans;
    Celestial.reload(config);
  }  
  
  function reproject() {
    var src = this;
    if (!src) return;
    config.projection = src.value; 
    Celestial.reproject(config);
  }
  
  function turn() {
    if (testNumber(this) === false) return;   
    if (getCenter() === false) return;
    Celestial.rotate(config);
  }

  function getCenter() {
    var cx = $("centerx"), cy = $("centery"), cz = $("centerz"),
        rot = [];

    if (!cx || !cy) return;

    if (config.transform !== "equatorial") config.center[0] = parseFloat(cx.value); 
    else { 
      var vx = parseFloat(cx.value);
      config.center[0] = vx > 12 ? vx * 15 - 360 : vx * 15;
    }
    config.center[1] = parseFloat(cy.value); 
    
    var vz = parseFloat(cz.value); 
    config.center[2] = isNaN(vz) ? 0 : vz;
    
    return cx.value !== "" && cy.value !== "";
  }
  
  function showConstellation() {
    var id = this.value, anims = [];
    if (id === "") { 
      Celestial.constellation = null;
      Celestial.redraw();
      return;
    }
    var con = Celestial.constellations[id];
    config.center = con.center;
    setCenter(config.center, config.transform);
    //config.lines.graticule.lat.pos = [Round(con.center[0])];
    //config.lines.graticule.lon.pos = [Round(con.center[1])];
    //Celestial.apply(config);

    //if zoomed, zoom out
    var z = Celestial.zoomBy();
    if (z !== 1) anims.push({param:"zoom", value:1/z, duration:0});
    //rotate
    anims.push({param:"center", value:con.center, duration:0});
    //and zoom in
    var sc = con.scale > 10 ? 10 : con.scale;
    anims.push({param:"zoom", value:sc, duration:0});
    Celestial.constellation = id;
    Celestial.animate(anims, false);    
  }
  
  function apply() {
    var value, src = this;

    switch (src.type) {
      case "checkbox": value = src.checked; enable(src); break;
      case "number": if (testNumber(src) === false) return; 
                     value = parseFloat(src.value); break;
      case "color": if (testColor(src) === false) return; 
                    value = src.value; break;
      case "text": if (src.id.search(/fill$/) === -1) return;
                   if (testColor(src) === false) return; 
                   value = src.value; break;
    }
    if (value === null) return;
    set(src.id, value);
    if (src.id === "dsos-style-fill") {
      set("dsos-style-stroke", value);
      set("dsos-namestyle-fill", value);
    }
    getCenter();
    Celestial.apply(config);
  }

  function set(prop, val) {
    var a = prop.split("-");
    switch (a.length) {
      case 1: config[a[0]] = val; break;
      case 2: config[a[0]][a[1]] = val; break;
      case 3: config[a[0]][a[1]][a[2]] = val; break;
      default: return;
    }   
  }
}

// Dependend fields relations
var depends = {
  "stars-show": ["stars-limit", "stars-colors", "stars-style-fill", "stars-names", "stars-size", "stars-exponent"],
  "stars-names": ["stars-proper", "stars-desig", "stars-namelimit"],
  "stars-proper": ["stars-propernamelimit"],
  "dsos-show": ["dsos-limit", "dsos-colors", "dsos-style-fill", "dsos-names", "dsos-size", "dsos-exponent"],
  "dsos-names": ["dsos-desig", "dsos-namelimit"],
   "mw-show": ["mw-style-opacity", "mw-style-fill"],
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
      /* falls through */
    case "stars-proper": 
      off = !$("stars-names").checked || !$("stars-show").checked || !$("stars-proper").checked;
      for (i=0; i< depends["stars-proper"].length; i++) { fldEnable(depends["stars-proper"][i], off); }
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
    case "mw-show": 
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
  var p = findPos(nd);
  d3.select("#error").html(err).style( {top:px(p[1] + nd.offsetHeight + 1), left:px(p[0]), opacity:1} );
  nd.focus();
}

//Check numeric field
function testNumber(node) {
  var v, adj = node.id === "hr" || node.id === "min" || node.id === "sec" ? 1 : 0;
  if (node.validity) {
    v = node.validity;
    if (v.typeMismatch || v.badInput) { popError(node, node.title + ": check field value"); return false; }
    if (v.rangeOverflow || v.rangeUnderflow) { popError(node, node.title + " must be between " + (parseInt(node.min) + adj) + " and " + (parseInt(node.max) - adj)); return false; }
  } else {
    v = node.value;
    if (!isNumber(v)) { popError(node, node.title + ": check field value"); return false; }
    v = parseFloat(v);
    if (v < node.min || v > node.max ) { popError(node, node.title + " must be between " + (node.min + adj) + " and " + (+node.max - adj)); return false; }
  }
  d3.select("#error").style( {top:"-9999px", left:"-9999px", opacity:0} ); 
  return true; 
}

//Check color field
function testColor(node) {
  var v;
  if (node.validity) {
    v = node.validity;
    if (v.typeMismatch || v.badInput) { popError(node, node.title + ": check field value"); return false; }
    if (node.value.search(/^#[0-9A-F]{6}$/i) === -1) { popError(node, node.title + ": not a color value"); return false; }
  } else {
    v = node.value;
    if (v === "") return true;
    if (v.search(/^#[0-9A-F]{6}$/i) === -1) { popError(node, node.title + ": not a color value"); return false; }
  }
  d3.select("#error").style( {top:"-9999px", left:"-9999px", opacity:0} );
  return true;
}

function setUnit(trans, old) {
  var cx = $("centerx");
  if (!cx) return null;
  
  if (old) {
    if (trans === "equatorial" && old !== "equatorial") {
      cx.value = (cx.value/15).toFixed(1);
      if (cx.value < 0) cx.value += 24;
    } else if (trans !== "equatorial" && old === "equatorial") {
      cx.value = (cx.value * 15).toFixed(1);
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
  return cx.value;
}

function setCenter(ctr, trans) {
  var cx = $("centerx"), cy = $("centery"), cz = $("centerz");
  if (!cx || !cy) return;
  
  if (ctr === null) ctr = [0,0,0]; 
  if (ctr.length <= 2) ctr[2] = 0;
  //config.center = ctr; 
  if (trans !== "equatorial") cx.value = ctr[0].toFixed(1); 
  else cx.value = ctr[0] < 0 ? (ctr[0] / 15 + 24).toFixed(1) : (ctr[0] / 15).toFixed(1); 
  
  cy.value = ctr[1].toFixed(1);
  cz.value = ctr[2] !== null ? ctr[2].toFixed(1) : 0;
}

// Set max input limits depending on data
function setLimits() {
  var t, rx = /\d+(\.\d+)?/g,
      s, d, res = {s:6, d:6},
      config =  Celestial.settings();

  d = config.dsos.data;
  
  //test dso limit
  t = d.match(rx);
  if (t !== null) {
    res.d = parseFloat(t[t.length-1]);
  }

  if (res.d != 6) {
    $("dsos-limit").max = res.d;
    $("dsos-namelimit").max = res.d;
  }
   
   s = config.stars.data;
  
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

function setVisibility(cfg, which) {
   var vis, fld;
   if (!has(cfg, "formFields")) return;
   if (which && has(cfg.formFields, which)) {
     d3.select("#" + which).style( {"display": "none"} );
     return;
   }
   // Special case for backward compatibility
   if (cfg.form === false && cfg.location === true) {
     d3.select("#celestial-form").style("display", "inline-block");
     for (fld in cfg.formFields) {
      if (!has(cfg.formFields, fld)) continue;
       if (fld === "location") continue;
       d3.select("#" + fld).style( {"display": "none"} );     
     }
     return;
   }
   // hide if not desired
   if (cfg.form === false) d3.select("#celestial-form").style("display", "none"); 

   for (fld in cfg.formFields) {
     if (!has(cfg.formFields, fld)) continue;
     if (fld === "location") continue;
     vis = cfg.formFields[fld] === false ? "none" : "block";
     d3.select("#" + fld).style( {"display": vis} );     
   }
  
}

function geo(cfg) {
  var frm = d3.select("#celestial-form form").insert("div", "div#general").attr("id", "loc"),
      dtFormat = d3.time.format("%Y-%m-%d %H:%M:%S"),
      zenith = [0,0],
      geopos = [0,0], 
      date = new Date(),
      zone = date.getTimezoneOffset();

  var dtpick = new datetimepicker(cfg, function(date, tz) { 
    $("datetime").value = dateFormat(date, tz); 
    zone = tz;
    go(); 
  });
  
  if (has(cfg, "geopos") && cfg.geopos !== null && cfg.geopos.length === 2) geopos = cfg.geopos;
  var col = frm.append("div").attr("class", "col").attr("id", "location").style("display", "none");
  //Latitude & longitude fields
  col.append("label").attr("title", "Location coordinates long/lat").attr("for", "lat").html("Location");
  col.append("input").attr("type", "number").attr("id", "lat").attr("title", "Latitude").attr("placeholder", "Latitude").attr("max", "90").attr("min", "-90").attr("step", "0.0001").attr("value", geopos[0]).on("change",  function () {
    if (testNumber(this) === true) go(); 
  });
  col.append("span").html("\u00b0");
  col.append("input").attr("type", "number").attr("id", "lon").attr("title", "Longitude").attr("placeholder", "Longitude").attr("max", "180").attr("min", "-180").attr("step", "0.0001").attr("value", geopos[1]).on("change",  function () { 
    if (testNumber(this) === true) go(); 
  });
  col.append("span").html("\u00b0");
  //Here-button if supported
  if ("geolocation" in navigator) {
    col.append("input").attr("type", "button").attr("value", "Here").attr("id", "here").on("click", here);
  }
  //Datetime field with dtpicker-button
  col.append("label").attr("title", "Local date/time").attr("for", "datetime").html(" Date/time");
  col.append("input").attr("type", "button").attr("id", "day-left").attr("title", "One day back").on("click", function () {
    date.setDate(date.getDate() - 1); 
    $("datetime").value = dateFormat(date, zone); 
    go(); 
  });
  col.append("input").attr("type", "text").attr("id", "datetime").attr("title", "Date and time").attr("value", dateFormat(date, zone))
  .on("click", showpick, true).on("input", function () { 
    this.value = dateFormat(date, zone); 
    if (!dtpick.isVisible()) showpick(); 
  });
  col.append("div").attr("id", "datepick").on("click", showpick);
  col.append("input").attr("type", "button").attr("id", "day-right").attr("title", "One day forward").on("click", function () { 
    date.setDate(date.getDate() + 1); 
    $("datetime").value = dateFormat(date, zone); 
    go(); 
  });
  //Now -button sets current time & date of device  
  col.append("input").attr("type", "button").attr("value", "Now").attr("id", "now").on("click", now);
  //Horizon marker
  col.append("br");
  col.append("label").attr("title", "Show horizon marker").attr("for", "horizon-show").html(" Horizon marker");
  col.append("input").attr("type", "checkbox").attr("id", "horizon-show").property("checked", cfg.horizon.show).on("change", go);    
  //Daylight
  col.append("label").attr("title", "Show daylight").attr("for", "daylight-show").html("Daylight sky");
  col.append("input").attr("type", "checkbox").attr("id", "daylight-show").property("checked", cfg.daylight.show).on("change", go);    
  //Show planets
  col.append("label").attr("title", "Show solar system objects").attr("for", "planets-show").html(" Planets, Sun & Moon");
  col.append("input").attr("type", "checkbox").attr("id", "planets-show").property("checked", cfg.planets.show).on("change", go);    
  
  d3.select(document).on("mousedown", function () { 
    if (!hasParent(d3.event.target, "celestial-date") && dtpick.isVisible()) dtpick.hide(); 
  });
  
  function now() {
    date.setTime(Date.now());
    $("datetime").value = dateFormat(date, zone);
    go();
  }

  function here() {
    navigator.geolocation.getCurrentPosition( function(pos) {
      geopos = [Round(pos.coords.latitude, 4), Round(pos.coords.longitude, 4)];
      $("lat").value = geopos[0];
      $("lon").value = geopos[1];
      go();
    });  
  }
  
  function showpick() {
    dtpick.show(date);
  }
  
  function dateFormat(dt, tz) {
    var tzs;
    if (!tz || tz === "0") tzs = " ±0000";
    else {
      var h = Math.floor(Math.abs(tz) / 60),
          m = Math.abs(tz) - (h * 60),
          s = tz < 0 ? " +" : " −";
      tzs = s + pad(h) + pad(m);
    }
    return dtFormat(dt) + tzs;
  }  
  

  function isValidLocation(loc) {
    //[lat, lon] expected
    if (!loc || !isArray(loc) || loc.length < 2) return false;
    if (!isNumber(loc[0]) || loc[0] < -90 || loc[0] > 90)  return false;
    if (!isNumber(loc[1]) || loc[1] < -180 || loc[1] > 180)  return false;
    return true;
  }

  function go() {
    var lon = $("lon").value,
        lat = $("lat").value;

    date = dtFormat.parse($("datetime").value.slice(0,-6));

    var tz = date.getTimezoneOffset();
    var dtc = new Date(date.valueOf() + (zone - tz) * 60000);

    cfg.horizon.show = !!$("horizon-show").checked;
    cfg.daylight.show = !!$("daylight-show").checked;
    cfg.planets.show = !!$("planets-show").checked;
    
    if (lon !== "" && lat !== "") {
      geopos = [parseFloat(lat), parseFloat(lon)];
      zenith = Celestial.getPoint(horizontal.inverse(dtc, [90, 0], geopos), cfg.transform);
      zenith[2] = 0;
      if (cfg.follow === "zenith") {
        Celestial.rotate({center:zenith, horizon:cfg.horizon});
      } else {
        Celestial.apply({horizon:cfg.horizon});
      }
    }
  }

  Celestial.getPosition = function (p) {
    
  };

  Celestial.date = function (dt, tz) { 
    if (!dt) return date;  
    zone = tz || zone;
    if (dtpick.isVisible()) dtpick.hide();
    date.setTime(dt.valueOf());
    $("datetime").value = dateFormat(dt, zone); 
    Celestial.redraw();
  };
  Celestial.timezone = function (tz) { 
    if (!tz) return zone;  
    zone = tz || zone;
    if (dtpick.isVisible()) dtpick.hide();
    $("datetime").value = dateFormat(date, zone); 
    Celestial.redraw();
  };
  Celestial.position = function () { return geopos; };
  Celestial.location = function (loc) {
    if (!loc || loc.length < 2) return geopos;
    if (isValidLocation(cfg.location)) {
      geopos = cfg.location.slice();
      $("lat").value = geopos[0];
      $("lon").value = geopos[1];
      go();
    }
  };
  //{"date":dt, "location":loc, "timezone":tz}
  Celestial.skyview = function (cfg) {
    var valid = false;
    if (dtpick.isVisible()) dtpick.hide();
    if (isValidDate(cfg.date)) {
      date.setTime(cfg.date.valueOf());
      $("datetime").value = dateFormat(cfg.date, zone); 
      valid = true;
    }
    zone = cfg.timezone || zone;
    if (isValidLocation(cfg.location)) {
      geopos = cfg.location.slice();
      $("lat").value = geopos[0];
      $("lon").value = geopos[1];
      valid = true;
    }
    if (valid === true) go();
    else return {"date": date, "location": geopos};
  };  
  Celestial.dtLoc = Celestial.skyview;
  Celestial.zenith = function () { return zenith; };
  Celestial.nadir = function () {
    var b = -zenith[1],
        l = zenith[0] + 180;
    if (l > 180) l -= 360;    
    return [l, b-0.001]; 
  };

  if (has(cfg, "formFields") && (cfg.location === true || cfg.formFields.location === true)) {
    d3.select("#location").style( {"display": "inline-block"} );
  }
  //only if appropriate
  if (cfg.location === true && cfg.formFields.location === true)
    setTimeout(go, 1000); 
 
}
﻿
var gmdat = {
  "sol": 0.0002959122082855911025,  // AU^3/d^2
  "mer": 164468599544771, //km^3/d^2
  "ven": 2425056445892137,
  "ter": 2975536307796296,
  "lun": 36599199229256,
  "mar": 319711652803400,
  "cer": 467549107200,
  "ves": 129071530155,
  "jup": 945905718740635000,
  "sat": 283224952705891000,
  "ura": 43256077238632300,
  "nep": 51034401552155700,
  "plu": 7327611364884,
  "eri": 8271175680000
},


symbols = {
  "sol":"\u2609", "mer":"\u263f", "ven":"\u2640", "ter":"\u2295", "lun":"\u25cf", "mar":"\u2642", "cer":"\u26b3", 
  "ves":"\u26b6", "jup":"\u2643", "sat":"\u2644", "ura":"\u2645", "nep":"\u2646", "plu":"\u2647", "eri":"\u26aa"
}, 

ε = 23.43928 * deg2rad,
sinε = Math.sin(ε),
cosε = Math.cos(ε),
kelements = ["a","e","i","w","M","L","W","N","n","ep","ref","lecl","becl","Tilt"];
/*
    ep = epoch (iso-date)
    N = longitude of the ascending node (deg) Ω
    i = inclination to the refrence plane, default:ecliptic (deg) 
    w = argument of periapsis (deg)  ω
    a = semi-major axis, or mean distance from parent body (AU,km)
    e = eccentricity (0=circle, 0-1=ellipse, 1=parabola, >1=hyperbola ) (-)
    M = mean anomaly (0 at periapsis; increases uniformly with time) (deg)
    n = mean daily motion = 360/P (deg/day)
    
    W = N + w  = longitude of periapsis ϖ
    L = M + W  = mean longitude
    q = a*(1-e) = periapsis distance
    Q = a*(1+e) = apoapsis distance
    P = 2π * sqrt(a^3/GM) = orbital period (years)
    T = Epoch_of_M - (M(deg)/360_deg) / P  = time of periapsis
    v = true anomaly (angle between position and periapsis) ν
    E = eccentric anomaly
    
    Mandatory: a, e, i, N, w|W, M|L, dM|n
    
*/

var Kepler = function () {
  var gm = gmdat.sol, 
      parentBody = "sol", 
      elem = {}, dat = {},
      id, name, symbol;


  function kepler(date) {
    dates(date);
    if (id === "sol") {
      dat.x = 0;
      dat.y = 0;
      dat.z = 0;
      return kepler;
    }
    coordinates();
    return kepler;
  }

  var dates = function(date) {
    var dt;
    dat = [];
    if (date) {
      if (date instanceof Date) { dt = new Date(date.valueOf()); }
      else { dt = dateParse(date); }
    }
    if (!dt) { dt = new Date(); }
    dat.jd = JD(dt);
      
    dt = dateParse(elem.ep);
    if (!dt) dt = dateParse("2000-01-01");
    dat.jd0 = JD(dt);
    dat.d = dat.jd - dat.jd0;
    dat.cy = dat.d / 36525;
  };

  var coordinates = function() {
    var key;
    if (id === "lun") {
      dat = moon_elements(dat);
      if (!dat) return;
    } else {
      for (var i=0; i<kelements.length; i++) {
        key = kelements[i];
        if (!has(elem, key)) continue; 
        if (has(elem, "d"+key)) {
          dat[key] = elem[key] + elem["d"+key] * dat.cy;
        } else if (has(elem, key)) {
          dat[key] = elem[key];
        }
      }
      if (has(dat, "M") && !has(dat, "dM") && has(dat, "n")) {
        dat.M += (dat.n * dat.d);
      }
    }
    derive();
    trueAnomaly();
    cartesian();    
  };

  kepler.cartesian = function() {
    return dat;    
  };

  kepler.spherical = function() {
    spherical();
    return dat;    
  };

  kepler.equatorial = function(pos) {
    equatorial(pos);
    return dat;    
  };

  kepler.transpose = function() {
    transpose(dat);
    return dat;    
  };
  
  kepler.elements = function(_) {
    var key;
    
    if (!arguments.length) return elem;
    
    for (var i=0; i<kelements.length; i++) {
      key = kelements[i];
      if (!has(_, key)) continue; 
      elem[key] = _[key];
      
      if (key === "a" || key === "e") elem[key] *= 1.0; 
      else if (key !== "ref" && key !== "ep") elem[key] *= deg2rad;

      if (has(_, "d" + key)) {
        key = "d" + key;
        elem[key] = _[key];
        if (key === "da" || key === "de") elem[key] *= 1.0; 
        else elem[key] *= deg2rad;
      } 
    }
    return kepler;
  };

  kepler.parentBody = function(_) {
    if (!arguments.length) return parentBody; 
    parentBody = _;
    gm = gmdat[parentBody];
    return kepler;
  };

  kepler.id = function(_) {
    if (!arguments.length) return id; 
    id = _;
    symbol = symbols[_];
    return kepler;
  };

  kepler.Name = function(_) {
    if (!arguments.length) return name; 
    name = _;
    return kepler;
  };

  kepler.symbol = function(_) {
    if (!arguments.length) return symbol; 
    symbol = symbols[_];
    return kepler;
  };

  
  function near_parabolic(E, e) {
    var anom2 = e > 1.0 ? E*E : -E*E,
        term = e * anom2 * E / 6.0,
        rval = (1.0 - e) * E - term,
        n = 4;

    while(Math.abs(term) > 1e-15) {
      term *= anom2 / (n * (n + 1));
      rval -= term;
      n += 2;
    }
    return(rval);
  }

  function anomaly() {
    var curr, err, trial, tmod,
        e = dat.e, M = dat.M,
        thresh = 1e-8,
        offset = 0.0, 
        delta_curr = 1.9, 
        is_negative = false, 
        n_iter = 0;

    if (!M) return(0.0); 

    if (e < 1.0) {
      if (M < -Math.PI || M > Math.PI) {
        tmod = Trig.normalize0(M);
        offset = M - tmod;
        M = tmod;
      }

      if (e < 0.9) {   
        curr = Math.atan2(Math.sin(M), Math.cos(M) - e);
        do {
          err = (curr - e * Math.sin(curr) - M) / (1.0 - e * Math.cos(curr));
          curr -= err;
        } while (Math.abs(err) > thresh);
        return curr; // + offset;
      }
    }

    if ( M < 0.0) {
      M = -M;
      is_negative = true;
    }

    curr = M;
    thresh = thresh * Math.abs(1.0 - e);
               /* Due to roundoff error,  there's no way we can hope to */
               /* get below a certain minimum threshhold anyway:        */
    if ( thresh < 1e-15) { thresh = 1e-15; }
    if ( (e > 0.8 && M < Math.PI / 3.0) || e > 1.0) {   /* up to 60 degrees */
      trial = M / Math.abs( 1.0 - e);

      if (trial * trial > 6.0 * Math.abs(1.0 - e)) {  /* cubic term is dominant */
        if (M < Math.PI) {
          trial = Math.pow(6.0 * M, 1/3);
        } else {       /* hyperbolic w/ 5th & higher-order terms predominant */
          trial = Trig.asinh( M / e);
        }
      }
      curr = trial;
    }
    if (e > 1.0 && M > 4.0) {   /* hyperbolic, large-mean-anomaly case */
      curr = Math.log(M);
    }
    if (e < 1.0) {
      while(Math.abs(delta_curr) > thresh) {
        if ( n_iter++ > 8) {
          err = near_parabolic(curr, e) - M;
        } else {
          err = curr - e * Math.sin(curr) - M;
        }
        delta_curr = -err / (1.0 - e * Math.cos(curr));
        curr += delta_curr;
      }
    } else {
      while (Math.abs(delta_curr) > thresh) {
        if (n_iter++ > 7) {
          err = -near_parabolic(curr, e) - M;
        } else {
          err = e * Trig.sinh(curr) - curr - M;
        }
        delta_curr = -err / (e * Trig.cosh(curr) - 1.0);
        curr += delta_curr;
      }
    }
    return( is_negative ? offset - curr : offset + curr);
  }

  function trueAnomaly() {
    var x, y, r0, g, t;

    if (dat.e === 1.0) {   /* parabolic */
      t = dat.jd0 - dat.T;
      g = dat.w0 * t * 0.5;

      y = Math.pow(g + Math.sqrt(g * g + 1.0), 1/3);
      dat.v = 2.0 * Math.atan(y - 1.0 / y);
    } else {          /* got the mean anomaly;  compute eccentric,  then true */
      dat.E = anomaly();
      if (dat.e > 1.0) {    /* hyperbolic case */
        x = (dat.e - Trig.cosh(dat.E));
        y = Trig.sinh(dat.E);
      } else {          /* elliptical case */
        x = (Math.cos(dat.E) - dat.e);
        y =  Math.sin(dat.E);
      }
      y *= Math.sqrt(Math.abs(1.0 - dat.e * dat.e));
      dat.v = Math.atan2(y, x);
    }

    r0 = dat.q * (1.0 + dat.e);
    dat.r = r0 / (1.0 + dat.e * Math.cos(dat.v));
  }

  function derive() {
    if (!dat.hasOwnProperty("w")) {
      dat.w = dat.W - dat.N;
    }
    if (!dat.hasOwnProperty("M")) {
      dat.M = dat.L - dat.W;
    }
    if (dat.e < 1.0) { dat.M = Trig.normalize0(dat.M); }
    //dat.P = Math.pow(Math.abs(dat.a), 1.5);
    dat.P = τ * Math.sqrt(Math.pow(dat.a, 3) / gm) / 365.25;
    dat.T = dat.jd0 - (dat.M / halfπ) / dat.P;

    if (dat.e !== 1.0) {   /* for non-parabolic orbits: */
     dat.q = dat.a * (1.0 - dat.e);
     dat.t0 = dat.a * Math.sqrt(Math.abs(dat.a) / gm);
    } else {
     dat.w0 = (3.0 / Math.sqrt(2)) / (dat.q * Math.sqrt(dat.q / gm));
     dat.a = 0.0;
     dat.t0 = 0.0;
    }
    dat.am = Math.sqrt(gm * dat.q * (1.0 + dat.e));
  }

  function transpose() {
    if (!dat.ref || dat.ref === "ecl") {
      dat.tx = dat.x;
      dat.ty = dat.y;
      dat.tz = dat.z;
      return;
    }
    var a0 = dat.lecl,// - Math.PI/2,
        a1 = Math.PI/2 - dat.becl,
        angles = [0, a1, -a0];
    transform(dat, angles);
    var tp =  Trig.cartesian([dat.tl, dat.tb, dat.r]);
    dat.tx = tp.x;
    dat.ty = tp.y;
    dat.tz = tp.z;
  }

  function equatorial(pos) {
    ε = (23.439292 - 0.0130042 * dat.cy - 1.667e-7 * dat.cy * dat.cy + 5.028e-7 * dat.cy * dat.cy * dat.cy) * deg2rad;
    sinε = Math.sin(ε);
    cosε = Math.cos(ε);
    var o = (id === "lun") ? {x:0, y:0, z:0} : {x:pos.x, y:pos.y, z:pos.z};
    dat.xeq = dat.x - o.x;
    dat.yeq = (dat.y - o.y) * cosε - (dat.z - o.z) * sinε;
    dat.zeq = (dat.y - o.y) * sinε + (dat.z - o.z) * cosε;

    dat.ra = Trig.normalize(Math.atan2(dat.yeq, dat.xeq));
    dat.dec = Math.atan2(dat.zeq, Math.sqrt(dat.xeq*dat.xeq + dat.yeq*dat.yeq));
    if (id === "lun") dat = moon_corr(dat, pos);
    dat.pos = [dat.ra / deg2rad, dat.dec / deg2rad];
    dat.rt = Math.sqrt(dat.xeq*dat.xeq + dat.yeq*dat.yeq + dat.zeq*dat.zeq);
  }

  function cartesian() {
    var u = dat.v + dat.w;
    dat.x = dat.r * (Math.cos(dat.N) * Math.cos(u) - Math.sin(dat.N) * Math.sin(u) * Math.cos(dat.i));
    dat.y = dat.r * (Math.sin(dat.N) * Math.cos(u) + Math.cos(dat.N) * Math.sin(u) * Math.cos(dat.i));
    dat.z = dat.r * (Math.sin(u) * Math.sin(dat.i));
    return dat;
  }

  function spherical() {
    var lon = Math.atan2(dat.y, dat.x),
        lat = Math.atan2(dat.z, Math.sqrt(dat.x*dat.x + dat.y*dat.y));
    dat.l = Trig.normalize(lon);
    dat.b = lat;
    return dat; 
  }

  function polar2cart(pos) {
    var rclat = Math.cos(pos.lat) * pos.r;
    pos.x = rclat * Math.cos(pos.lon);
    pos.y = rclat * Math.sin(pos.lon);
    pos.z = pos.r * Math.sin(pos.lat);
    return pos;
  }

  
  function JD(dt) {  
    var yr = dt.getUTCFullYear(),
        mo = dt.getUTCMonth() + 1,
        dy = dt.getUTCDate(),
        frac = (dt.getUTCHours() - 12 + dt.getUTCMinutes()/60.0 + dt.getUTCSeconds()/3600.0) / 24, 
        IYMIN = -4799;        /* Earliest year allowed (4800BC) */

    if (yr < IYMIN) return -1; 
    var a = Math.floor((14 - mo) / 12),
        y = yr + 4800 - a,
        m = mo + (12 * a) - 3;
    var jdn = dy + Math.floor((153 * m + 2)/5) + (365 * y) + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    return jdn + frac;   
  }

  function mst(lon) {
    var l = lon || 0;  // lon=0 -> gmst
    return (18.697374558 + 24.06570982441908 * dat.d) * 15 + l;
  }
  
    
  function observer(pos) {
    var flat = 298.257223563,    // WGS84 flattening of earth
        re = 6378.137,           // GRS80/WGS84 semi major axis of earth ellipsoid
        h = pos.h || 0,
        cart = {},
        gmst = mst();
    
    var cosl = Math.cos(pos.lat),
        sinl = Math.sin(pos.lat),
        fl = 1.0 - 1.0 / flat;
    var fl2 = fl * fl;
    
    var u = 1.0 / Math.sqrt (cosl * cosl + fl2 * sinl * sinl),
        a = re * u + h,
        b = re * fl2 * u + h,
        r = Math.sqrt (a * a * cosl * cosl + b * b * sinl * sinl); // geocentric distance from earth center

    cart.lat = Math.acos (a * cosl / r); 
    cart.lon = pos.lon; 
    cart.r = h;
    
    if (pos.lat < 0.0) cart.lat *= -1; 

    polar2cart(cart); 

    // rotate around earth's polar axis to align coordinate system from Greenwich to vernal equinox
    var angle = gmst * deg2rad; // sideral time gmst given in hours. Convert to radians

    cart.x = cart.x * Math.cos(angle) - cart.y * Math.sin(angle);
    cart.y = cart.x * Math.sin(angle) + cart.y * Math.cos(angle);
    return(cart);
  }

  function moon_elements(dat) {
    if ((typeof Moon !== "undefined")) return Moon.elements(dat);
  }
  
  function moon_corr(dat, pos) {
    spherical();
    if ((typeof Moon !== "undefined")) return Moon.corr(dat, pos);
  }

  return kepler;  
};﻿
var Moon = {
  elements: function(dat) {
    var t = (dat.jd - 2451545) / 36525,
        t2 = t * t,
        t3 = t * t2,
        t4 = t * t3,
        t5 = t * t4,
        t2e4 = t2 * 1e-4,
        t3e6 = t3 * 1e-6,
        t4e8 = t4 * 1e-8;

    // semimajor axis
    var sa = 3400.4 * Math.cos(deg2rad * (235.7004 + 890534.2230 * t - 32.601 * t2e4 
        + 3.664 * t3e6 - 1.769 * t4e8)) 
        - 635.6 * Math.cos(deg2rad * (100.7370 + 413335.3554 * t - 122.571 * t2e4 
        - 10.684 * t3e6 + 5.028 * t4e8)) 
        - 235.6 * Math.cos(deg2rad * (134.9634 + 477198.8676 * t + 89.970 * t2e4 
        + 14.348 * t3e6 - 6.797 * t4e8)) 
        + 218.1 * Math.cos(deg2rad * (238.1713 +  854535.1727 * t - 31.065 * t2e4 
        + 3.623 * t3e6  - 1.769 * t4e8)) 
        + 181.0 * Math.cos(deg2rad * (10.6638 + 1367733.0907 * t + 57.370 * t2e4 
        + 18.011 * t3e6 - 8.566 * t4e8)) 
        - 39.9 * Math.cos(deg2rad * (103.2079 + 377336.3051 * t - 121.035 * t2e4 
        - 10.724 * t3e6 + 5.028 * t4e8)) 
        - 38.4 * Math.cos(deg2rad * (233.2295 + 926533.2733 * t - 34.136 * t2e4 
        + 3.705 * t3e6 - 1.769 * t4e8)) 
        + 33.8 * Math.cos(deg2rad * (336.4374 + 1303869.5784 * t - 155.171 * t2e4 
        - 7.020 * t3e6 + 3.259 * t4e8)) 
        + 28.8 * Math.cos(deg2rad * (111.4008 + 1781068.4461 * t - 65.201 * t2e4 
        + 7.328 * t3e6 - 3.538 * t4e8)) 
        + 12.6 * Math.cos(deg2rad * (13.1347 + 1331734.0404 * t + 58.906 * t2e4 
        + 17.971 * t3e6 - 8.566 * t4e8)) 
        + 11.4 * Math.cos(deg2rad * (186.5442 + 966404.0351 * t - 68.058 * t2e4 
        - 0.567 * t3e6 + 0.232 * t4e8)) 
        - 11.1 * Math.cos(deg2rad * (222.5657 - 441199.8173 * t - 91.506 * t2e4 
        - 14.307 * t3e6 + 6.797 * t4e8)) 
        - 10.2 * Math.cos(deg2rad * (269.9268 + 954397.7353 * t + 179.941 * t2e4 
        + 28.695 * t3e6 - 13.594 * t4e8)) 
        + 9.7 * Math.cos(deg2rad * (145.6272 + 1844931.9583 * t + 147.340 * t2e4 
        + 32.359 * t3e6 - 15.363 * t4e8)) 
        + 9.6 * Math.cos(deg2rad * (240.6422 + 818536.1225 * t - 29.529 * t2e4 
        + 3.582 * t3e6 - 1.769 * t4e8)) 
        + 8.0 * Math.cos(deg2rad * (297.8502 + 445267.1115 * t - 16.300 * t2e4 
        + 1.832 * t3e6 - 0.884 * t4e8)) 
        - 6.2 * Math.cos(deg2rad * (132.4925 + 513197.9179 * t + 88.434 * t2e4 
        + 14.388 * t3e6 - 6.797 * t4e8)) 
        + 6.0 * Math.cos(deg2rad * (173.5506 + 1335801.3346 * t - 48.901 * t2e4 
        + 5.496 * t3e6 - 2.653 * t4e8)) 
        + 3.7 * Math.cos(deg2rad * (113.8717 + 1745069.3958 * t - 63.665 * t2e4 
        + 7.287 * t3e6 - 3.538 * t4e8)) 
        + 3.6 * Math.cos(deg2rad * (338.9083 + 1267870.5281 * t - 153.636 * t2e4 
        - 7.061 * t3e6 + 3.259 * t4e8)) 
        + 3.2 * Math.cos(deg2rad * (246.3642 + 2258267.3137 * t + 24.769 * t2e4 
        + 21.675 * t3e6 - 10.335 * t4e8)) 
        - 3.0 * Math.cos(deg2rad * (8.1929 + 1403732.1410 * t + 55.834 * t2e4 
        + 18.052 * t3e6 - 8.566 * t4e8)) 
        + 2.3 * Math.cos(deg2rad * (98.2661 + 449334.4057 * t - 124.107 * t2e4 
        - 10.643 * t3e6 + 5.028 * t4e8)) 
        - 2.2 * Math.cos(deg2rad * (357.5291 + 35999.0503 * t - 1.536 * t2e4 
        + 0.041 * t3e6 + 0.000 * t4e8)) 
        - 2.0 * Math.cos(deg2rad * (38.5872 + 858602.4669 * t - 138.871 * t2e4 
        - 8.852 * t3e6 + 4.144 * t4e8)) 
        - 1.8 * Math.cos(deg2rad * (105.6788 + 341337.2548 * t - 119.499 * t2e4 
        - 10.765 * t3e6 + 5.028 * t4e8)) 
        - 1.7 * Math.cos(deg2rad * (201.4740 + 826670.7108 * t - 245.142 * t2e4 
        - 21.367 * t3e6 + 10.057 * t4e8)) 
        + 1.6 * Math.cos(deg2rad * (184.1196 + 401329.0556 * t + 125.428 * t2e4 
        + 18.579 * t3e6 - 8.798 * t4e8)) 
        - 1.4 * Math.cos(deg2rad * (308.4192 - 489205.1674 * t + 158.029 * t2e4 
        + 14.915 * t3e6 - 7.029 * t4e8)) 
        + 1.3 * Math.cos(deg2rad * (325.7736 - 63863.5122 * t - 212.541 * t2e4 
        - 25.031 * t3e6 + 11.826 * t4e8));

    var sapp = - 0.55 * Math.cos(deg2rad * (238.2 + 854535.2 * t)) 
        + 0.10 * Math.cos(deg2rad * (103.2 + 377336.3 * t)) 
        + 0.10 * Math.cos(deg2rad * (233.2 + 926533.3 * t));

    var sma = 383397.6 + sa + sapp * t;

    // orbital eccentricity

    var se = 0.014217 * Math.cos(deg2rad * (100.7370 + 413335.3554 * t - 122.571 * t2e4 
        - 10.684 * t3e6 + 5.028 * t4e8)) 
        + 0.008551 * Math.cos(deg2rad * (325.7736 - 63863.5122 * t - 212.541 * t2e4 
        - 25.031 * t3e6 + 11.826 * t4e8)) 
        - 0.001383 * Math.cos(deg2rad * (134.9634 + 477198.8676 * t + 89.970 * t2e4 
        + 14.348 * t3e6 - 6.797 * t4e8)) 
        + 0.001353 * Math.cos(deg2rad * (10.6638 + 1367733.0907 * t + 57.370 * t2e4 
        + 18.011 * t3e6 - 8.566 * t4e8)) 
        - 0.001146 * Math.cos(deg2rad * (66.5106 + 349471.8432 * t - 335.112 * t2e4 
        - 35.715 * t3e6 + 16.854 * t4e8)) 
        - 0.000915 * Math.cos(deg2rad * (201.4740 + 826670.7108 * t - 245.142 * t2e4 
        - 21.367 * t3e6 + 10.057 * t4e8)) 
        + 0.000869 * Math.cos(deg2rad * (103.2079 + 377336.3051 * t - 121.035 * t2e4 
        - 10.724 * t3e6 + 5.028 * t4e8)) 
        - 0.000628 * Math.cos(deg2rad * (235.7004 + 890534.2230 * t - 32.601 * t2e4 
        + 3.664 * t3e6  - 1.769 * t4e8)) 
        - 0.000393 * Math.cos(deg2rad * (291.5472 - 127727.0245 * t - 425.082 * t2e4 
        - 50.062 * t3e6 + 23.651 * t4e8)) 
        + 0.000284 * Math.cos(deg2rad * (328.2445 - 99862.5625 * t - 211.005 * t2e4 
        - 25.072 * t3e6 + 11.826 * t4e8)) 
        - 0.000278 * Math.cos(deg2rad * (162.8868 - 31931.7561 * t - 106.271 * t2e4 
        - 12.516 * t3e6 + 5.913 * t4e8)) 
        - 0.000240 * Math.cos(deg2rad * (269.9268 + 954397.7353 * t + 179.941 * t2e4 
        + 28.695 * t3e6 - 13.594 * t4e8)) 
        + 0.000230 * Math.cos(deg2rad * (111.4008 + 1781068.4461 * t - 65.201 * t2e4 
        + 7.328 * t3e6  - 3.538 * t4e8)) 
        + 0.000229 * Math.cos(deg2rad * (167.2476 + 762807.1986 * t - 457.683 * t2e4 
        - 46.398 * t3e6 + 21.882 * t4e8)) 
        - 0.000202 * Math.cos(deg2rad * ( 83.3826 - 12006.2998 * t + 247.999 * t2e4 
        + 29.262 * t3e6 - 13.826 * t4e8)) 
        + 0.000190 * Math.cos(deg2rad * (190.8102 - 541062.3799 * t - 302.511 * t2e4 
        - 39.379 * t3e6 + 18.623 * t4e8)) 
        + 0.000177 * Math.cos(deg2rad * (357.5291 + 35999.0503 * t - 1.536 * t2e4 
        + 0.041 * t3e6 + 0.000 * t4e8)) 
        + 0.000153 * Math.cos(deg2rad * (32.2842 + 285608.3309 * t - 547.653 * t2e4 
        - 60.746 * t3e6 + 28.679 * t4e8)) 
        - 0.000137 * Math.cos(deg2rad * (44.8902 + 1431596.6029 * t + 269.911 * t2e4 
        + 43.043 * t3e6 - 20.392 * t4e8)) 
        + 0.000122 * Math.cos(deg2rad * (145.6272 + 1844931.9583 * t + 147.340 * t2e4 
        + 32.359 * t3e6 - 15.363 * t4e8)) 
        + 0.000116 * Math.cos(deg2rad * (302.2110 + 1240006.0662 * t - 367.713 * t2e4 
        - 32.051 * t3e6 + 15.085 * t4e8)) 
        - 0.000111 * Math.cos(deg2rad * (203.9449 + 790671.6605 * t - 243.606 * t2e4 
        - 21.408 * t3e6 + 10.057 * t4e8)) 
        - 0.000108 * Math.cos(deg2rad * (68.9815 + 313472.7929 * t - 333.576 * t2e4 
        - 35.756 * t3e6 + 16.854 * t4e8)) 
        + 0.000096 * Math.cos(deg2rad * (336.4374 + 1303869.5784 * t - 155.171 * t2e4 
        - 7.020 * t3e6 + 3.259 * t4e8)) 
        - 0.000090 * Math.cos(deg2rad * (98.2661 + 449334.4057 * t - 124.107 * t2e4 
        - 10.643 * t3e6 + 5.028 * t4e8)) 
        + 0.000090 * Math.cos(deg2rad * (13.1347 + 1331734.0404 * t + 58.906 * t2e4 
        + 17.971 * t3e6 - 8.566 * t4e8)) 
        + 0.000056 * Math.cos(deg2rad * (55.8468 - 1018261.2475 * t - 392.482 * t2e4 
        - 53.726 * t3e6 + 25.420 * t4e8)) 
        - 0.000056 * Math.cos(deg2rad * (238.1713 + 854535.1727 * t - 31.065 * t2e4 
        + 3.623 * t3e6 - 1.769 * t4e8)) 
        + 0.000052 * Math.cos(deg2rad * (308.4192 - 489205.1674 * t + 158.029 * t2e4 
        + 14.915 * t3e6 - 7.029 * t4e8)) 
        - 0.000050 * Math.cos(deg2rad * (133.0212 + 698943.6863 * t - 670.224 * t2e4 
        - 71.429 * t3e6 + 33.708 * t4e8)) 
        - 0.000049 * Math.cos(deg2rad * (267.9846 + 1176142.5540 * t - 580.254 * t2e4 
        - 57.082 * t3e6 + 26.911 * t4e8)) 
        - 0.000049 * Math.cos(deg2rad * (184.1196 + 401329.0556 * t + 125.428 * t2e4 
        + 18.579 * t3e6 - 8.798 * t4e8)) 
        - 0.000045 * Math.cos(deg2rad * (49.1562 - 75869.8120 * t + 35.458 * t2e4 
        + 4.231 * t3e6 - 2.001 * t4e8)) 
        + 0.000044 * Math.cos(deg2rad * (257.3208 - 191590.5367 * t - 637.623 * t2e4 
        - 75.093 * t3e6 + 35.477 * t4e8)) 
        + 0.000042 * Math.cos(deg2rad * (105.6788 + 341337.2548 * t - 119.499 * t2e4 
        - 10.765 * t3e6 + 5.028 * t4e8)) 
        + 0.000042 * Math.cos(deg2rad * (160.4159 + 4067.2942 * t - 107.806 * t2e4 
        - 12.475 * t3e6 + 5.913 * t4e8)) 
        + 0.000040 * Math.cos(deg2rad * (246.3642 + 2258267.3137 * t + 24.769 * t2e4 
        + 21.675 * t3e6 - 10.335 * t4e8)) 
        - 0.000040 * Math.cos(deg2rad * (156.5838 - 604925.8921 * t - 515.053 * t2e4 
        - 64.410 * t3e6 + 30.448 * t4e8)) 
        + 0.000036 * Math.cos(deg2rad * (169.7185 + 726808.1483 * t - 456.147 * t2e4 
        - 46.439 * t3e6 + 21.882 * t4e8)) 
        + 0.000029 * Math.cos(deg2rad * (113.8717 + 1745069.3958 * t - 63.665 * t2e4 
        + 7.287 * t3e6 - 3.538 * t4e8)) 
        - 0.000029 * Math.cos(deg2rad * (297.8502 + 445267.1115 * t - 16.300 * t2e4 
        + 1.832 * t3e6 - 0.884 * t4e8)) 
        - 0.000028 * Math.cos(deg2rad * (294.0181 - 163726.0747 * t - 423.546 * t2e4 
        - 50.103 * t3e6 + 23.651 * t4e8)) 
        + 0.000027 * Math.cos(deg2rad * (263.6238 + 381403.5993 * t - 228.841 * t2e4 
        - 23.199 * t3e6 + 10.941 * t4e8)) 
        - 0.000026 * Math.cos(deg2rad * (358.0578 + 221744.8187 * t - 760.194 * t2e4 
        - 85.777 * t3e6 + 40.505 * t4e8)) 
        - 0.000026 * Math.cos(deg2rad * (8.1929 + 1403732.1410 * t + 55.834 * t2e4 
        + 18.052 * t3e6 - 8.566 * t4e8));

    var sedp = -0.0022 * Math.cos(deg2rad * (103.2 + 377336.3 * t));

    var ecc = 0.055544 + se + 1e-3 * t * sedp;

    // sine of half the inclination

    var sg = 0.0011776 * Math.cos(deg2rad * (49.1562 - 75869.8120 * t + 35.458 * t2e4 
        + 4.231 * t3e6 - 2.001 * t4e8)) 
        - 0.0000971 * Math.cos(deg2rad * (235.7004 + 890534.2230 * t - 32.601 * t2e4 
        + 3.664 * t3e6 - 1.769 * t4e8)) 
        + 0.0000908 * Math.cos(deg2rad * (186.5442 + 966404.0351 * t - 68.058 * t2e4 
        - 0.567 * t3e6 + 0.232 * t4e8)) 
        + 0.0000623 * Math.cos(deg2rad * (83.3826 - 12006.2998 * t + 247.999 * t2e4 
        + 29.262 * t3e6 - 13.826 * t4e8)) 
        + 0.0000483 * Math.cos(deg2rad * (51.6271 - 111868.8623 * t + 36.994 * t2e4 
        + 4.190 * t3e6 - 2.001 * t4e8)) 
        + 0.0000348 * Math.cos(deg2rad * (100.7370 + 413335.3554 * t - 122.571 * t2e4 
        - 10.684 * t3e6 + 5.028 * t4e8)) 
        - 0.0000316 * Math.cos(deg2rad * (308.4192 - 489205.1674 * t + 158.029 * t2e4 
        + 14.915 * t3e6 - 7.029 * t4e8)) 
        - 0.0000253 * Math.cos(deg2rad * (46.6853 - 39870.7617 * t + 33.922 * t2e4 
        + 4.272 * t3e6 - 2.001 * t4e8)) 
        - 0.0000141 * Math.cos(deg2rad * (274.1928 - 553068.6797 * t - 54.513 * t2e4 
        - 10.116 * t3e6 + 4.797 * t4e8)) 
        + 0.0000127 * Math.cos(deg2rad * (325.7736 - 63863.5122 * t - 212.541 * t2e4 
        - 25.031 * t3e6 + 11.826 * t4e8)) 
        + 0.0000117 * Math.cos(deg2rad * (184.1196 + 401329.0556 * t + 125.428 * t2e4 
        + 18.579 * t3e6 - 8.798 * t4e8)) 
        - 0.0000078 * Math.cos(deg2rad * (98.3124 - 151739.6240 * t + 70.916 * t2e4 
        + 8.462 * t3e6 - 4.001 * t4e8)) 
        - 0.0000063 * Math.cos(deg2rad * (238.1713 + 854535.1727 * t - 31.065 * t2e4 
        + 3.623 * t3e6 - 1.769 * t4e8)) 
        + 0.0000063 * Math.cos(deg2rad * (134.9634 + 477198.8676 * t + 89.970 * t2e4 
        + 14.348 * t3e6 - 6.797 * t4e8)) 
        + 0.0000036 * Math.cos(deg2rad * (321.5076 + 1443602.9027 * t + 21.912 * t2e4 
        + 13.780 * t3e6 - 6.566 * t4e8)) 
        - 0.0000035 * Math.cos(deg2rad * (10.6638 + 1367733.0907 * t + 57.370 * t2e4 
        + 18.011 * t3e6 - 8.566 * t4e8)) 
        + 0.0000024 * Math.cos(deg2rad * (149.8932 + 337465.5434 * t - 87.113 * t2e4 
        - 6.453 * t3e6 + 3.028 * t4e8)) 
        + 0.0000024 * Math.cos(deg2rad * (170.9849 - 930404.9848 * t + 66.523 * t2e4 
        + 0.608 * t3e6 - 0.232 * t4e8));

    var sgp = - 0.0203 * Math.cos(deg2rad * (125.0 - 1934.1 * t)) 
        + 0.0034 * Math.cos(deg2rad * (220.2 - 1935.5 * t));

    var gamma = 0.0449858 + sg + 1e-3 * sgp;

    // longitude of perigee

    var sp = - 15.448 * Math.sin(deg2rad * (100.7370 + 413335.3554 * t - 122.571 * t2e4 
        - 10.684 * t3e6 + 5.028 * t4e8))
        - 9.642 * Math.sin(deg2rad * (325.7736 - 63863.5122 * t - 212.541 * t2e4 
        - 25.031 * t3e6 + 11.826 * t4e8)) 
        - 2.721 * Math.sin(deg2rad * (134.9634 + 477198.8676 * t + 89.970 * t2e4 
        + 14.348 * t3e6 - 6.797 * t4e8)) 
        + 2.607 * Math.sin(deg2rad * (66.5106 + 349471.8432 * t - 335.112 * t2e4 
        - 35.715 * t3e6 + 16.854 * t4e8)) 
        + 2.085 * Math.sin(deg2rad * (201.4740 + 826670.7108 * t - 245.142 * t2e4 
        - 21.367 * t3e6 + 10.057 * t4e8)) 
        + 1.477 * Math.sin(deg2rad * (10.6638 + 1367733.0907 * t + 57.370 * t2e4 
        + 18.011 * t3e6 - 8.566 * t4e8)) 
        + 0.968 * Math.sin(deg2rad * (291.5472 - 127727.0245 * t - 425.082 * t2e4 
        - 50.062 * t3e6 + 23.651 * t4e8)) 
        - 0.949 * Math.sin(deg2rad * (103.2079 + 377336.3051 * t - 121.035 * t2e4 
        - 10.724 * t3e6 + 5.028 * t4e8)) 
        - 0.703 * Math.sin(deg2rad * (167.2476 + 762807.1986 * t - 457.683 * t2e4 
        - 46.398 * t3e6 + 21.882 * t4e8)) 
        - 0.660 * Math.sin(deg2rad * (235.7004 + 890534.2230 * t - 32.601 * t2e4 
        + 3.664 * t3e6 - 1.769 * t4e8)) 
        - 0.577 * Math.sin(deg2rad * (190.8102 - 541062.3799 * t - 302.511 * t2e4 
        - 39.379 * t3e6 + 18.623 * t4e8)) 
        - 0.524 * Math.sin(deg2rad * (269.9268 + 954397.7353 * t + 179.941 * t2e4 
        + 28.695 * t3e6 - 13.594 * t4e8)) 
        - 0.482 * Math.sin(deg2rad * (32.2842 + 285608.3309 * t - 547.653 * t2e4 
        - 60.746 * t3e6 + 28.679 * t4e8)) 
        + 0.452 * Math.sin(deg2rad * (357.5291 + 35999.0503 * t - 1.536 * t2e4 
        + 0.041 * t3e6 + 0.000 * t4e8)) 
        - 0.381 * Math.sin(deg2rad * (302.2110 + 1240006.0662 * t - 367.713 * t2e4 
        - 32.051 * t3e6 + 15.085 * t4e8)) 
        - 0.342 * Math.sin(deg2rad * (328.2445 - 99862.5625 * t - 211.005 * t2e4 
        - 25.072 * t3e6 + 11.826 * t4e8)) 
        - 0.312 * Math.sin(deg2rad * (44.8902 + 1431596.6029 * t + 269.911 * t2e4 
        + 43.043 * t3e6 - 20.392 * t4e8)) 
        + 0.282 * Math.sin(deg2rad * (162.8868 - 31931.7561 * t - 106.271 * t2e4 
        - 12.516 * t3e6 + 5.913 * t4e8)) 
        + 0.255 * Math.sin(deg2rad * (203.9449 + 790671.6605 * t - 243.606 * t2e4 
        - 21.408 * t3e6 + 10.057 * t4e8)) 
        + 0.252 * Math.sin(deg2rad * (68.9815 + 313472.7929 * t - 333.576 * t2e4 
        - 35.756 * t3e6 + 16.854 * t4e8)) 
        - 0.211 * Math.sin(deg2rad * (83.3826 - 12006.2998 * t + 247.999 * t2e4 
        + 29.262 * t3e6 - 13.826 * t4e8)) 
        + 0.193 * Math.sin(deg2rad * (267.9846 + 1176142.5540 * t - 580.254 * t2e4 
        - 57.082 * t3e6 + 26.911 * t4e8)) 
        + 0.191 * Math.sin(deg2rad * (133.0212 + 698943.6863 * t - 670.224 * t2e4 
        - 71.429 * t3e6 + 33.708 * t4e8)) 
        - 0.184 * Math.sin(deg2rad * (55.8468 - 1018261.2475 * t - 392.482 * t2e4 
        - 53.726 * t3e6 + 25.420 * t4e8)) 
        + 0.182 * Math.sin(deg2rad * (145.6272 + 1844931.9583 * t + 147.340 * t2e4 
        + 32.359 * t3e6 - 15.363 * t4e8)) 
        - 0.158 * Math.sin(deg2rad * (257.3208 - 191590.5367 * t - 637.623 * t2e4 
        - 75.093 * t3e6 + 35.477 * t4e8)) 
        + 0.148 * Math.sin(deg2rad * (156.5838 - 604925.8921 * t - 515.053 * t2e4 
        - 64.410 * t3e6 + 30.448 * t4e8)) 
        - 0.111 * Math.sin(deg2rad * (169.7185 + 726808.1483 * t - 456.147 * t2e4 
        - 46.439 * t3e6 + 21.882 * t4e8)) 
        + 0.101 * Math.sin(deg2rad * (13.1347 + 1331734.0404 * t + 58.906 * t2e4 
        + 17.971 * t3e6 - 8.566 * t4e8)) 
        + 0.100 * Math.sin(deg2rad * (358.0578 + 221744.8187 * t - 760.194 * t2e4 
        - 85.777 * t3e6 + 40.505 * t4e8)) 
        + 0.087 * Math.sin(deg2rad * (98.2661 + 449334.4057 * t - 124.107 * t2e4 
        - 10.643 * t3e6 + 5.028 * t4e8)) 
        + 0.080 * Math.sin(deg2rad * (42.9480 + 1653341.4216 * t - 490.283 * t2e4 
        - 42.734 * t3e6 + 20.113 * t4e8)) 
        + 0.080 * Math.sin(deg2rad * (222.5657 - 441199.8173 * t - 91.506 * t2e4 
        - 14.307 * t3e6 + 6.797 * t4e8)) 
        + 0.077 * Math.sin(deg2rad * (294.0181 - 163726.0747 * t - 423.546 * t2e4 
        - 50.103 * t3e6 + 23.651 * t4e8)) 
        - 0.073 * Math.sin(deg2rad * (280.8834 - 1495460.1151 * t - 482.452 * t2e4 
        - 68.074 * t3e6 + 32.217 * t4e8)) 
        - 0.071 * Math.sin(deg2rad * (304.6819 + 1204007.0159 * t - 366.177 * t2e4 
        - 32.092 * t3e6 + 15.085 * t4e8)) 
        - 0.069 * Math.sin(deg2rad * (233.7582 + 1112279.0417 * t - 792.795 * t2e4 
        - 82.113 * t3e6 + 38.736 * t4e8)) 
        - 0.067 * Math.sin(deg2rad * (34.7551 + 249609.2807 * t - 546.117 * t2e4 
        - 60.787 * t3e6 + 28.679 * t4e8)) 
        - 0.067 * Math.sin(deg2rad * (263.6238 + 381403.5993 * t - 228.841 * t2e4 
        - 23.199 * t3e6 + 10.941 * t4e8)) 
        + 0.055 * Math.sin(deg2rad * (21.6203 - 1082124.7597 * t - 605.023 * t2e4 
        - 78.757 * t3e6 + 37.246 * t4e8)) 
        + 0.055 * Math.sin(deg2rad * (308.4192 - 489205.1674 * t + 158.029 * t2e4 
        + 14.915 * t3e6 -7.029 * t4e8)) 
        - 0.054 * Math.sin(deg2rad * (8.7216 + 1589477.9094 * t - 702.824 * t2e4 
        - 67.766 * t3e6 + 31.939 * t4e8)) 
        - 0.052 * Math.sin(deg2rad * (179.8536 + 1908795.4705 * t + 359.881 * t2e4 
        + 57.390 * t3e6 - 27.189 * t4e8)) 
        - 0.050 * Math.sin(deg2rad * (98.7948 + 635080.1741 * t - 882.765 * t2e4 
        - 96.461 * t3e6 + 45.533 * t4e8)) 
        - 0.049 * Math.sin(deg2rad * (128.6604 - 95795.2683 * t - 318.812 * t2e4 
        - 37.547 * t3e6 + 17.738 * t4e8)) 
        - 0.047 * Math.sin(deg2rad * (17.3544 + 425341.6552 * t - 370.570 * t2e4 
        - 39.946 * t3e6 + 18.854 * t4e8)) 
        - 0.044 * Math.sin(deg2rad * (160.4159 + 4067.2942 * t - 107.806 * t2e4 
        - 12.475 * t3e6 + 5.913 * t4e8)) 
        - 0.043 * Math.sin(deg2rad * (238.1713 + 854535.1727 * t - 31.065 * t2e4 
        + 3.623 * t3e6 - 1.769 * t4e8)) 
        + 0.042 * Math.sin(deg2rad * (270.4555 + 1140143.5037 * t - 578.718 * t2e4 
        - 57.123 * t3e6 + 26.911 * t4e8)) 
        - 0.042 * Math.sin(deg2rad * (132.4925 + 513197.9179 * t + 88.434 * t2e4 
        + 14.388 * t3e6 - 6.797 * t4e8)) 
        - 0.041 * Math.sin(deg2rad * (122.3573 - 668789.4043 * t - 727.594 * t2e4 
        - 89.441 * t3e6 + 42.274 * t4e8)) 
        - 0.040 * Math.sin(deg2rad * (105.6788 + 341337.2548 * t - 119.499 * t2e4 
        - 10.765 * t3e6 + 5.028 * t4e8)) 
        + 0.038 * Math.sin(deg2rad * (135.4921 + 662944.6361 * t - 668.688 * t2e4 
        - 71.470 * t3e6 + 33.708 * t4e8)) 
        - 0.037 * Math.sin(deg2rad * (242.3910 - 51857.2124 * t - 460.540 * t2e4 
        - 54.293 * t3e6 + 25.652 * t4e8)) 
        + 0.036 * Math.sin(deg2rad * (336.4374 +  1303869.5784 * t - 155.171 * t2e4 
        - 7.020 * t3e6 + 3.259 * t4e8)) 
        + 0.035 * Math.sin(deg2rad * (223.0943 - 255454.0489 * t - 850.164 * t2e4 
        - 100.124 * t3e6 + 47.302 * t4e8)) 
        - 0.034 * Math.sin(deg2rad * (193.2811 - 577061.4302 * t - 300.976 * t2e4 
        - 39.419 * t3e6 + 18.623 * t4e8)) 
        + 0.031 * Math.sin(deg2rad * (87.6023 - 918398.6850 * t - 181.476 * t2e4 
        - 28.654 * t3e6 + 13.594 * t4e8));

    var spp = 2.4 * Math.sin(deg2rad * (103.2 + 377336.3 * t));

    var lp = 83.353 + 4069.0137 * t - 103.238 * t2e4 
        - 12.492 * t3e6 + 5.263 * t4e8 + sp + 1e-3 * t * spp;

    // longitude of the ascending node

    var sr = - 1.4979 * Math.sin(deg2rad * (49.1562 - 75869.8120 * t + 35.458 * t2e4 
        + 4.231 * t3e6 - 2.001 * t4e8)) 
        - 0.1500 * Math.sin(deg2rad * (357.5291 + 35999.0503 * t - 1.536 * t2e4 
        + 0.041 * t3e6 + 0.000 * t4e8)) 
        - 0.1226 * Math.sin(deg2rad * (235.7004 + 890534.2230 * t - 32.601 * t2e4 
        + 3.664 * t3e6 - 1.769 * t4e8)) 
        + 0.1176 * Math.sin(deg2rad * (186.5442 + 966404.0351 * t - 68.058 * t2e4 
        - 0.567 * t3e6 + 0.232 * t4e8)) 
        - 0.0801 * Math.sin(deg2rad * (83.3826 - 12006.2998 * t + 247.999 * t2e4 
        + 29.262 * t3e6 - 13.826 * t4e8)) 
        - 0.0616 * Math.sin(deg2rad * (51.6271 - 111868.8623 * t + 36.994 * t2e4 
        + 4.190 * t3e6 - 2.001 * t4e8)) 
        + 0.0490 * Math.sin(deg2rad * (100.7370 + 413335.3554 * t - 122.571 * t2e4 
        - 10.684 * t3e6 + 5.028 * t4e8)) 
        + 0.0409 * Math.sin(deg2rad * (308.4192 - 489205.1674 * t + 158.029 * t2e4 
        + 14.915 * t3e6 - 7.029 * t4e8)) 
        + 0.0327 * Math.sin(deg2rad * (134.9634 + 477198.8676 * t + 89.970 * t2e4 
        + 14.348 * t3e6 - 6.797 * t4e8)) 
        + 0.0324 * Math.sin(deg2rad * (46.6853 - 39870.7617 * t + 33.922 * t2e4 
        + 4.272 * t3e6 - 2.001 * t4e8)) 
        + 0.0196 * Math.sin(deg2rad * (98.3124 - 151739.6240 * t + 70.916 * t2e4 
        + 8.462 * t3e6 - 4.001 * t4e8)) 
        + 0.0180 * Math.sin(deg2rad * (274.1928 - 553068.6797 * t - 54.513 * t2e4 
        - 10.116 * t3e6 + 4.797 * t4e8)) 
        + 0.0150 * Math.sin(deg2rad * (325.7736 - 63863.5122 * t - 212.541 * t2e4 
        - 25.031 * t3e6 + 11.826 * t4e8)) 
        - 0.0150 * Math.sin(deg2rad * (184.1196 + 401329.0556 * t + 125.428 * t2e4 
        + 18.579 * t3e6 - 8.798 * t4e8)) 
        - 0.0078 * Math.sin(deg2rad * (238.1713 + 854535.1727 * t - 31.065 * t2e4 
        + 3.623 * t3e6 - 1.769 * t4e8)) 
        - 0.0045 * Math.sin(deg2rad * (10.6638 + 1367733.0907 * t + 57.370 * t2e4 
        + 18.011 * t3e6 - 8.566 * t4e8)) 
        + 0.0044 * Math.sin(deg2rad * (321.5076 + 1443602.9027 * t + 21.912 * t2e4 
        + 13.780 * t3e6 - 6.566 * t4e8)) 
        - 0.0042 * Math.sin(deg2rad * (162.8868 - 31931.7561 * t - 106.271 * t2e4 
        - 12.516 * t3e6 + 5.913 * t4e8)) 
        - 0.0031 * Math.sin(deg2rad * (170.9849 - 930404.9848 * t + 66.523 * t2e4 
        + 0.608 * t3e6 - 0.232 * t4e8)) 
        + 0.0031 * Math.sin(deg2rad * (103.2079 + 377336.3051 * t - 121.035 * t2e4 
        - 10.724 * t3e6 + 5.028 * t4e8)) 
        + 0.0029 * Math.sin(deg2rad * (222.6120 - 1042273.8471 * t + 103.516 * t2e4 
        + 4.798 * t3e6 - 2.232 * t4e8)) 
        + 0.0028 * Math.sin(deg2rad * (184.0733 + 1002403.0853 * t - 69.594 * t2e4 
        - 0.526 * t3e6 + 0.232 * t4e8));

    var srp = 25.9 * Math.sin(deg2rad * (125.0 - 1934.1 * t)) 
        - 4.3 * Math.sin(deg2rad * (220.2 - 1935.5 * t));

    var srpp = 0.38 * Math.sin(deg2rad * (357.5 + 35999.1 * t));

    var raan = 125.0446 - 1934.13618 * t + 20.762 * t2e4 
        + 2.139 * t3e6 - 1.650 * t4e8 + sr 
        + 1e-3 * (srp + srpp * t);

    // mean longitude

    var sl = - 0.92581 * Math.sin(deg2rad * (235.7004 + 890534.2230 * t - 32.601 * t2e4 
        + 3.664 * t3e6 - 1.769 * t4e8)) 
        + 0.33262 * Math.sin(deg2rad * (100.7370 + 413335.3554 * t - 122.571 * t2e4 
        - 10.684 * t3e6 + 5.028 * t4e8)) 
        - 0.18402 * Math.sin(deg2rad * (357.5291 + 35999.0503 * t - 1.536 * t2e4 
        + 0.041 * t3e6 + 0.000 * t4e8)) 
        + 0.11007 * Math.sin(deg2rad * (134.9634 + 477198.8676 * t + 89.970 * t2e4 
        + 14.348 * t3e6 - 6.797 * t4e8)) 
        - 0.06055 * Math.sin(deg2rad * (238.1713 + 854535.1727 * t - 31.065 * t2e4 
        + 3.623 * t3e6 - 1.769 * t4e8)) 
        + 0.04741 * Math.sin(deg2rad * (325.7736 - 63863.5122 * t - 212.541 * t2e4 
        - 25.031 * t3e6 + 11.826 * t4e8)) 
        - 0.03086 * Math.sin(deg2rad * (10.6638 + 1367733.0907 * t + 57.370 * t2e4 
        + 18.011 * t3e6 - 8.566 * t4e8)) 
        + 0.02184 * Math.sin(deg2rad * (103.2079 + 377336.3051 * t - 121.035 * t2e4 
        - 10.724 * t3e6 + 5.028 * t4e8)) 
        + 0.01645 * Math.sin(deg2rad * (49.1562 - 75869.8120 * t + 35.458 * t2e4 
        + 4.231 * t3e6 - 2.001 * t4e8)) 
        + 0.01022 * Math.sin(deg2rad * (233.2295 + 926533.2733 * t - 34.136 * t2e4 
        + 3.705 * t3e6 - 1.769 * t4e8)) 
        - 0.00756 * Math.sin(deg2rad * (336.4374 + 1303869.5784 * t - 155.171 * t2e4 
        - 7.020 * t3e6 + 3.259 * t4e8)) 
        - 0.00530 * Math.sin(deg2rad * (222.5657 - 441199.8173 * t - 91.506 * t2e4 
        - 14.307 * t3e6 + 6.797 * t4e8)) 
        - 0.00496 * Math.sin(deg2rad * (162.8868 - 31931.7561 * t - 106.271 * t2e4 
        - 12.516 * t3e6 + 5.913 * t4e8)) 
        - 0.00472 * Math.sin(deg2rad * (297.8502 + 445267.1115 * t - 16.300 * t2e4 
        + 1.832 * t3e6 - 0.884 * t4e8)) 
        - 0.00271 * Math.sin(deg2rad * (240.6422 + 818536.1225 * t - 29.529 * t2e4 
        + 3.582 * t3e6 - 1.769 * t4e8)) 
        + 0.00264 * Math.sin(deg2rad * (132.4925 + 513197.9179 * t + 88.434 * t2e4 
        + 14.388 * t3e6 - 6.797 * t4e8)) 
        - 0.00254 * Math.sin(deg2rad * (186.5442 + 966404.0351 * t - 68.058 * t2e4 
        - 0.567 * t3e6 + 0.232 * t4e8)) 
        + 0.00234 * Math.sin(deg2rad * (269.9268 + 954397.7353 * t + 179.941 * t2e4 
        + 28.695 * t3e6 - 13.594 * t4e8)) 
        - 0.00220 * Math.sin(deg2rad * (13.1347 + 1331734.0404 * t + 58.906 * t2e4 
        + 17.971 * t3e6 - 8.566 * t4e8)) 
        - 0.00202 * Math.sin(deg2rad * (355.0582 + 71998.1006 * t - 3.072 * t2e4 
        + 0.082 * t3e6 + 0.000 * t4e8)) 
        + 0.00167 * Math.sin(deg2rad * (328.2445 - 99862.5625 * t - 211.005 * t2e4 
        - 25.072 * t3e6 + 11.826 * t4e8)) 
        - 0.00143 * Math.sin(deg2rad * (173.5506 + 1335801.3346 * t - 48.901 * t2e4 
        + 5.496 * t3e6 - 2.653 * t4e8)) 
        - 0.00121 * Math.sin(deg2rad * (98.2661 + 449334.4057 * t - 124.107 * t2e4 
        - 10.643 * t3e6 + 5.028 * t4e8)) 
        - 0.00116 * Math.sin(deg2rad * (145.6272 + 1844931.9583 * t + 147.340 * t2e4 
        + 32.359 * t3e6 - 15.363 * t4e8)) 
        + 0.00102 * Math.sin(deg2rad * (105.6788 + 341337.2548 * t - 119.499 * t2e4 
        - 10.765 * t3e6 + 5.028 * t4e8)) 
        - 0.00090 * Math.sin(deg2rad * (184.1196 + 401329.0556 * t + 125.428 * t2e4 
        + 18.579 * t3e6 - 8.798 * t4e8)) 
        - 0.00086 * Math.sin(deg2rad * (338.9083 + 1267870.5281 * t - 153.636 * t2e4 
        - 7.061 * t3e6 + 3.259 * t4e8)) 
        - 0.00078 * Math.sin(deg2rad * (111.4008 + 1781068.4461 * t - 65.201 * t2e4 
        + 7.328 * t3e6 - 3.538 * t4e8)) 
        + 0.00069 * Math.sin(deg2rad * (323.3027 - 27864.4619 * t - 214.077 * t2e4 
        - 24.990 * t3e6 + 11.826 * t4e8)) 
        + 0.00066 * Math.sin(deg2rad * (51.6271 - 111868.8623 * t + 36.994 * t2e4 
        + 4.190 * t3e6 - 2.001 * t4e8)) 
        + 0.00065 * Math.sin(deg2rad * (38.5872 + 858602.4669 * t - 138.871 * t2e4 
        - 8.852 * t3e6 + 4.144 * t4e8)) 
        - 0.00060 * Math.sin(deg2rad * (83.3826 - 12006.2998 * t + 247.999 * t2e4 
        + 29.262 * t3e6 - 13.826 * t4e8)) 
        + 0.00054 * Math.sin(deg2rad * (201.4740 + 826670.7108 * t - 245.142 * t2e4 
        - 21.367 * t3e6 + 10.057 * t4e8)) 
        - 0.00052 * Math.sin(deg2rad * (308.4192 - 489205.1674 * t + 158.029 * t2e4 
        + 14.915 * t3e6 - 7.029 * t4e8)) 
        + 0.00048 * Math.sin(deg2rad * (8.1929 + 1403732.1410 * t + 55.834 * t2e4 
        + 18.052 * t3e6 - 8.566 * t4e8)) 
        - 0.00041 * Math.sin(deg2rad * (46.6853 - 39870.7617 * t + 33.922 * t2e4 
        + 4.272 * t3e6 - 2.001 * t4e8)) 
        - 0.00033 * Math.sin(deg2rad * (274.1928 - 553068.6797 * t - 54.513 * t2e4 
        - 10.116 * t3e6 + 4.797 * t4e8)) 
        + 0.00030 * Math.sin(deg2rad * (160.4159 + 4067.2942 * t - 107.806 * t2e4 
        - 12.475 * t3e6 + 5.913 * t4e8));

    var slp = 3.96 * Math.sin(deg2rad * (119.7 + 131.8 * t)) 
        + 1.96 * Math.sin(deg2rad * (125.0 - 1934.1 * t));

    var slpp = 0.463 * Math.sin(deg2rad * (357.5 + 35999.1 * t)) 
        + 0.152 * Math.sin(deg2rad * (238.2 + 854535.2 * t)) 
        - 0.071 * Math.sin(deg2rad * (27.8 + 131.8 * t)) 
        - 0.055 * Math.sin(deg2rad * (103.2 + 377336.3 * t)) 
        - 0.026 * Math.sin(deg2rad * (233.2 + 926533.3 * t));

    var slppp = 14 * Math.sin(deg2rad * (357.5 + 35999.1 * t)) 
        + 5 * Math.sin(deg2rad * (238.2 + 854535.2 * t));

    var lambda = 218.31665 + 481267.88134 * t - 13.268 * t2e4 
        + 1.856 * t3e6 - 1.534 * t4e8 + sl 
        + 1e-3 * (slp + slpp * t + slppp * t2e4);

     dat.a = sma;
     dat.e = ecc;
     dat.i = 2.0 * Math.asin(gamma);
     dat.w = Trig.normalize(deg2rad * (lp - raan));
     dat.N = Trig.normalize(deg2rad * raan);
     dat.M = Trig.normalize(deg2rad * (lambda - lp));
     return dat;
  },
  corr: function(dat, sol) {
    var M = Trig.normalize(sol.M + Math.PI),
        w = Trig.normalize(sol.w + Math.PI),
        L = dat.M + dat.w,     // Argument of latitude 
        E = L + dat.N - M - w; // Mean elongation
    
    var lon = 
      -0.022234 * Math.sin(dat.M - 2*E) +  // Evection
       0.011494 * Math.sin(2*E) +          // Variation
      -0.003246 * Math.sin(M) +        // Yearly Equation
      -0.001029 * Math.sin(2*dat.M - 2*E) +
      -9.94838e-4 * Math.sin(dat.M - 2*E + M) +
       9.25025e-4 * Math.sin(dat.M + 2*E) +
       8.02851e-4 * Math.sin(2*E - M) +
       7.15585e-4 * Math.sin(dat.M - M) +
      -6.10865e-4 * Math.sin(E) + 
      -5.41052e-4 * Math.sin(dat.M + M) +
      -2.61799e-4 * Math.sin(2*L - 2*E) +
       1.91986e-4 * Math.sin(dat.M - 4*E);
    dat.ra += lon;
    var lat =
      -0.003019 * Math.sin(L - 2*E) +
      -9.59931e-4 * Math.sin(dat.M - L - 2*E) +
      -8.02851e-4 * Math.sin(dat.M + L - 2*E) +
       5.75958e-4 * Math.sin(L + 2*E) +
       2.96706e-4 * Math.sin(2*dat.M + L);  
    dat.dec += lat;
  
    dat.age = Trig.normalize(dat.l - sol.l + Math.PI);   
    dat.phase = 0.5 * (1 - Math.cos(dat.age));

    return dat;
  }

};
var datetimepicker = function(cfg, callback) {
  var date = new Date(), 
      tzFormat = d3.time.format("%Z"),
      tz = [{"−12:00":720}, {"−11:00":660}, {"−10:00":600}, {"−09:30":570}, {"−09:00":540}, {"−08:00":480}, {"−07:00":420}, {"−06:00":360}, {"−05:00":300}, {"−04:30":270}, {"−04:00":240}, {"−03:30":210}, {"−03:00":180}, {"−02:00":120}, {"−01:00":60}, {"±00:00":0}, {"+01:00":-60}, {"+02:00":-120}, {"+03:00":-180}, {"+03:30":-210}, {"+04:00":-240}, {"+04:30":-270}, {"+05:00":-300}, {"+05:30":-330}, {"+05:45":-345}, {"+06:00":-360}, {"+06:30":-390}, {"+07:00":-420}, {"+08:00":-480}, {"+08:30":-510}, {"+08:45":-525}, {"+09:00":-540}, {"+09:30":-570}, {"+10:00":-600}, {"+10:30":-630}, {"+11:00":-660}, {"+12:00":-720}, {"+12:45":-765}, {"+13:00":-780}, {"+14:00":-840}],
      months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      days = ["Su", "M", "Tu", "W", "Th", "F", "Sa"],
      years = getYears(date),
      dateFormat = d3.time.format("%Y-%m-%d"),
      dtrange = cfg.daterange || [];
    
  var picker = d3.select("#celestial-form").append("div").attr("id", "celestial-date");
  nav("left");
  monSel();
  yrSel();
  nav("right");
  
  var cal = picker.append("div").attr("id", "cal");

  daySel();
  
  timeSel();
  tzSel();
  
  function daySel() {
    var mo = $("mon").value, yr = $("yr").value,
        curdt = new Date(yr, mo, 1),
        cal = d3.select("#cal"),
        today = new Date();
    yr = parseInt(yr);   
    mo = parseInt(mo);   
    curdt.setDate(curdt.getDate() - curdt.getDay());
    var nd = cal.node();
    while (nd.firstChild) nd.removeChild(nd.firstChild);
    
    for (var i=0; i<7; i++) {
      cal.append("div").classed({"date": true, "weekday": true}).html(days[i]);
    }
    for (i=0; i<42; i++) {
      var curmon = curdt.getMonth(), curday = curdt.getDay(), curid = dateFormat(curdt);
      cal.append("div").classed({
        "date": true, 
        "grey": curmon !== mo,
        "weekend": curmon === mo && (curday === 0 || curday === 6),
        "today": dateDiff(curdt, today) === 0,
        "selected": dateDiff(curdt, date) === 0
      }).attr("id", curid)
      .on("click", pick)
      .html(curdt.getDate().toString());
      
      curdt.setDate(curdt.getDate()+1);
    }
  }

  function yrSel() {     
    picker.append("select").attr("title", "Year").attr("id", "yr").on("change", daySel);   
    
    fillYrSel();
  }

  function fillYrSel() { 
    var sel = d3.select("select#yr"),
        year = date.getFullYear(),
        selected = 0,
        years = getYears(date);
        
    sel.selectAll("*").remove();    
    sel.selectAll('option').data(years).enter().append('option')
       .text(function (d, i) { 
         if (d === year) selected = i; 
         return d.toString(); 
       });
    sel.property("selectedIndex", selected);
  }
  
  function monSel() { 
    var sel = picker.append("select").attr("title", "Month").attr("id", "mon").on("change", daySel),
        selected = 0,
        month = date.getMonth();
    
    sel.selectAll('option').data(months).enter().append('option')
       .attr("value", function (d, i) { 
         if (i === month) selected = i; 
         return i; 
       })
       .text(function (d) { return d; });
    sel.property("selectedIndex", selected);
  }
  
  function nav(dir) {
    var lnk = picker.append("div").attr("id", dir).on("click", function () {
      var mon = $("mon"), yr = $("yr");
      
      if (dir === "left") {
        if (mon.selectedIndex === 0) {
          mon.selectedIndex = 11;
          yr.selectedIndex--;
        } else mon.selectedIndex--;
      } else {
        if (mon.selectedIndex === 11) {
          mon.selectedIndex = 0;
          yr.selectedIndex++;
        } else mon.selectedIndex++;
      }
      daySel();
    });
  }

  function timeSel() { 
    picker.append("input").attr("type", "number").attr("id", "hr").attr("title", "Hours").attr("max", "24").attr("min", "-1").attr("step", "1").attr("value", date.getHours()).on("change", function () { if (testNumber(this) === true) pick(); });

    picker.append("input").attr("type", "number").attr("id", "min").attr("title", "Minutes").attr("max", "60").attr("min", "-1").attr("step", "1").attr("value", date.getMinutes()).on("change", function () { if (testNumber(this) === true) pick(); });
    
    picker.append("input").attr("type", "number").attr("id", "sec").attr("title", "Seconds").attr("max", "60").attr("min", "-1").attr("step", "1").attr("value", date.getSeconds()).on("change", function () { if (testNumber(this) === true) pick(); });
  }
  
  function tzSel() { 
    var sel = picker.append("select").attr("title", "Time zone offset from UTC").attr("id", "tz").on("change", pick),
        selected = 15,
        timezone = date.getTimezoneOffset();
    sel.selectAll('option').data(tz).enter().append('option')
       .attr("value", function (d, i) { 
         var k = Object.keys(d)[0];
         if (d[k] === timezone) selected = i; 
         return d[k]; 
       })
       .text(function (d) { return Object.keys(d)[0]; });
    sel.property("selectedIndex", selected);
  }
  
  function getYears(dt) {
    var r = getDateRange(dt.getFullYear()), res = [];
    for (var i = r[0]; i <= r[1]; i++) res.push(i);
    return res;
  }  
  
  function getDateRange(yr) {
    if (!dtrange || dtrange.length < 1) return [yr - 10, yr + 10];
    
    if (dtrange.length === 1 && isNumber(dtrange[0])) {
      if (dtrange[0] >= 100) return [dtrange[0] - 10, dtrange[0] + 10];
      else return [yr - dtrange[0], yr + dtrange[0]];
    }
    if (dtrange.length === 2 && isNumber(dtrange[0])&& isNumber(dtrange[1])) {
      if (dtrange[1] >= 100) return [dtrange[0], dtrange[1]];
      else return [dtrange[0] - dtrange[1], dtrange[0] + dtrange[1]];
    }      
    return [yr - 10, yr + 10];
  }

  function select(id, val) {
    var sel = $(id);
    for (var i=0; i<sel.childNodes.length; i++) {
      if (sel.childNodes[i].value == val) {
        sel.selectedIndex = i;
        break;
      }
    }
  }
  
  function set(dt) {
     if (dt) date.setTime(dt.valueOf());
     
     select("yr", date.getFullYear());
     select("mon", date.getMonth());
     daySel();
     $("hr").value = date.getHours();
     $("min").value = date.getMinutes();
     $("sec").value = date.getSeconds();
  } 
  
  this.show = function(dt) {
    var nd = $("celestial-date"),
        src = $("datepick"),
        left = src.offsetLeft + src.offsetWidth - nd.offsetWidth,
        top = src.offsetTop - nd.offsetHeight - 1;
  
    if (nd.offsetTop === -9999) {
      date.setTime(dt.valueOf());
      set();
      d3.select("#celestial-date").style({"top": px(top), "left": px(left), "opacity": 1});  
      d3.select("#datepick").classed("active", true);
    } else {
      vanish();
    }
  };
  
  this.isVisible = function () {
    return d3.select("#datepick").classed("active") === true;
  };

  this.hide = function () {
    vanish();
  };
  
  function vanish() {
    d3.select("#celestial-date").style("opacity", 0);
    d3.select("#error").style( {top:"-9999px", left:"-9999px", opacity:0} ); 
    d3.select("#datepick").classed("active", false);
    setTimeout(function () { $("celestial-date").style.top = px(-9999); }, 600);    
  }
  
  function pick() {
    var h = $("hr").value, m = $("min").value,
        s = $("sec").value, tz = $("tz").value;
        
    if (this.id && this.id.search(/^\d/) !== -1) {
      date = dateFormat.parse(this.id); 
    }
    fillYrSel();
    
    date.setHours(h, m, s);
    set();
    
    callback(date, tz);
  } 
  
};// Copyright 2014, Jason Davies, http://www.jasondavies.com
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
                if (!view.hasOwnProperty("r")) view.r = projection.rotate();
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