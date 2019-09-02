/* global module, require, settings, bvcolor, projections, projectionTween, poles, eulerAngles, euler, transformDeg, getData, getPlanets, getConstellationList, getMwbackground, getGridValues, Canvas, halfπ, $, px, Round, has, isArray, isNumber, form, geo, fldEnable, setCenter, interpolateAngle */
var Celestial = {
  version: '0.6.14',
  container: null,
  data: []
};

var ANIMDISTANCE = 0.035,  // Rotation animation threshold, ~2deg in radians
    ANIMSCALE = 1.4,       // Zoom animation threshold, scale factor
    ANIMINTERVAL_R = 2000, // Rotation duration scale in ms
    ANIMINTERVAL_P = 2500, // Projection duration in ms
    ANIMINTERVAL_Z = 1500, // Zoom duration scale in ms
    zoomextent = 10,       // Default maximum extent of zoom (max/min)
    zoomlevel = 1;         // Default zoom level, 1 = 100%

var cfg, prjMap, zoom, map, circle;

// Show it all, with the given config, otherwise with default settings
Celestial.display = function(config) {
  var par, container = Celestial.container,
      animations = [], current = 0, repeat = false, aID;
  
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
    par = "#"+cfg.container;
    var st = window.getComputedStyle(parent, null);
    if (!parseInt(st.width) && !cfg.width) parent.style.width = px(parent.parentNode.clientWidth); 
  } else { 
    par = "body"; 
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
  
      
  if (par != "body") $(cfg.container).style.height = px(height);
  
  prjMap = Celestial.projection(cfg.projection).rotate(rotation).translate([width/2, height/2]).scale(scale * zoomlevel);
    
  zoom = d3.geo.zoom().projection(prjMap).center([width/2, height/2]).scaleExtent([scale, scale * zoomextent]).on("zoom.redraw", redraw);
  // Set initial zoom level
  scale *= zoomlevel;

  var canvas = d3.select(par).selectAll("canvas");
  if (canvas[0].length === 0) canvas = d3.select(par).append("canvas");
  //canvas.attr("width", width).attr("height", height);
  canvas.style("width", px(width)).style("height", px(height)).attr("width", width * pixelRatio).attr("height", height * pixelRatio);
  var context = canvas.node().getContext("2d");  
  context.setTransform(pixelRatio,0,0,pixelRatio,0,0);

  var graticule = d3.geo.graticule().minorStep([15,10]);
  
  map = d3.geo.path().projection(prjMap).context(context);
   
  //parent div with id #celestial-map or body
  if (container) container.selectAll("*").remove();
  else container = d3.select(par).append("container");

  if (cfg.interactive) canvas.call(zoom);
  else canvas.attr("style", "cursor: default!important");
  
  setClip(proj.clip);

  d3.select(window).on('resize', resize);
  d3.select(par).on('dblclick', function () { zoomBy(1.5625); return false; });
 
  if (cfg.controls === true && $("celestial-zoomin") === null) {
    d3.select(par).append("input").attr("type", "button").attr("id", "celestial-zoomin").attr("value", "\u002b").on("click", function () { zoomBy(1.25); return false; });
    d3.select(par).append("input").attr("type", "button").attr("id", "celestial-zoomout").attr("value", "\u2212").on("click", function () { zoomBy(0.8); return false; });
  }
  
  circle = d3.geo.circle().angle([90]);  
  container.append("path").datum(circle).attr("class", "horizon");
  if ($("loc") === null) geo(cfg);
  else if (cfg.follow === "zenith") rotate({center: Celestial.zenith()});

  if (cfg.location === true) {
    d3.select("#location").style("display", "inline-block");
    fldEnable("horizon-show", proj.clip);
  }
  
  if (cfg.form === true && $("params") === null) form(cfg);
  if ($("error") === null) d3.select("body").append("div").attr("id", "error");


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

    //Planets, Sun & (Moon tbi)
    d3.json(path + "planets.json", function(error, json) {
      if (error) return console.warn(error);
      
      var pl = getPlanets(json, trans);

      container.selectAll(".planets")
         .data(pl)
         .enter().append("path")
         .attr("class", "planet");

      redraw();
    });

    if (Celestial.data.length > 0) { 
      Celestial.data.forEach( function(d) {
        if (has(d, "file")) d3.json(d.file, d.callback);
        else setTimeout(d.callback, 0);
      }, this);
    }
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

    if (proj.clip != prj.clip) interval = 0;   // Different clip = no transition
    
    var prjTo = Celestial.projection(config.projection).center(ctr).translate([width/2, width/prj.ratio/2]).scale([prj.scale * width/1024]);
    var bAdapt = cfg.adaptable;

    if (sc > ext[0]) {
      delay = zoomBy(0.1);
      setTimeout(reproject, delay, config);
      return delay + interval;
    }
    
    if (cfg.location) fldEnable("horizon-show", prj.clip);
    
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
  }
    
  function drawOutline(stroke) {
    var rot = prjMap.rotate();
    
    prjMap.rotate([0,0]);
    setStyle(cfg.background);
    container.selectAll(".outline").attr("d", map);
    if (stroke === true) 
      context.stroke(); 
    else 
      context.fill();
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
      container.append("path").datum(d3.geo.circle().angle([90])).attr("class", "outline");
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
    if (current < animations.length) aID = setTimeout(animate, d);
  }
  
  function stop() {
    clearTimeout(aID);
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
  if (!has(this, "date"))
    this.date = function() { console.log("Celestial.date() needs config.location = true to work." ); };
  
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