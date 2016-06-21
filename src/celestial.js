/* global settings, bvcolor, projections, projectionTween, poles, eulerAngles, euler, transformDeg, getData, Canvas, halfπ, $, px, Round, has, form, geo, setCenter, showHorizon */
var Celestial = {
  version: '0.5.7',
  container: null,
  data: []
};
 
var cfg, prjMap, prjOutline, zoom, map, outline, circle;

// Show it all, with the given config, otherwise with default settings
Celestial.display = function(config) {
  var par, container = Celestial.container;
  
  //Mash config with default settings
  cfg = settings.set(config); 
  cfg.stars.size = cfg.stars.size || 7;  // Nothing works without these
  cfg.center = cfg.center || [0,0];      
  
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
      proj = getProjection(cfg.projection);
  
  if (!proj) return;
      
  var trans = cfg.transform || "equatorial",
      ratio = proj.ratio,
      height = width / ratio,
      scale = proj.scale * width/1024,
      base = cfg.stars.size, 
      exp = -0.28, //Object size base & exponent
      adapt = 1,
      rotation = getAngles(cfg.center),
      //center = [-rotation[0], -rotation[1]],
      path = cfg.datapath || "";
      path = path.replace(/([^\/]$)/, "$1\/");
  
      
  if (par != "body") $(cfg.container).style.height = px(height);
  
  prjMap = Celestial.projection(cfg.projection).rotate(rotation).translate([width/2, height/2]).scale([scale]);
  prjOutline = Celestial.projection(cfg.projection).translate([width/2, height/2]).scale([scale]); //projected non moving outline
    
  zoom = d3.geo.zoom().projection(prjMap).center([width/2, height/2]).scaleExtent([scale, scale*5]).on("zoom.redraw", redraw);

  var canvas = d3.selectAll("canvas");
  if (canvas[0].length === 0) canvas = d3.select(par).append("canvas");
  canvas.attr("width", width).attr("height", height);
  var context = canvas.node().getContext("2d");  
  
  var graticule = d3.geo.graticule().minorStep([15,10]);
  
  map = d3.geo.path().projection(prjMap).context(context);
  outline = d3.geo.path().projection(prjOutline).context(context);
   
  //parent div with id #celestial-map or body
  if (container) container.selectAll("*").remove();
  else container = d3.select(par).append("container");

  if (cfg.interactive) canvas.call(zoom);
  else canvas.attr("style", "cursor: default!important");
  
  setClip(proj.clip);

  d3.select(window).on('resize', resize);

  if (cfg.controls === true && $("celestial-zoomin") === null) {
    d3.select(par).append("input").attr("type", "button").attr("id", "celestial-zoomin").attr("value", "\u002b").on("click", function() { zoomBy(1.057); });
    d3.select(par).append("input").attr("type", "button").attr("id", "celestial-zoomout").attr("value", "\u2212").on("click", function() { zoomBy(0.946); });
  }
  
  if (cfg.location === true) {
    circle = d3.geo.circle().angle([90]);  
    container.append("path").datum(circle).attr("class", "horizon");
    if ($("loc") === null) geo(cfg);
    else rotate({center:Celestial.zenith()});
    showHorizon(proj.clip);
  }
  
  if (cfg.form === true && $("params") === null) form(cfg);
  if ($("error") === null) d3.select("body").append("div").attr("id", "error");


  function load() {
    //Celestial planes
    for (var key in cfg.lines) {
      if (!has(cfg.lines, key)) continue;
      if (key === "graticule") {
        container.append("path").datum(graticule).attr("class", "graticule"); 
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

      container.selectAll(".mway")
         .data(mw.features)
         .enter().append("path")
         .attr("class", "mw");
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

    if (Celestial.data.length > 0) { 
      Celestial.data.forEach( function(d) {
        if (has(d, "file")) d3.json(d.file, d.callback);
        else setTimeout(d.callback, 0);
      }, this);
    }
  }
  
  
  function zoomBy(factor) {
    var scale = prjMap.scale() * factor,
        ext = zoom.scaleExtent();
    if (scale < ext[0]) scale = ext[0];
    if (scale > ext[1]) scale = ext[1];
    prjMap.scale([scale]); 
    zoom.scale([scale]); 
    redraw(); 
  }  
  
  function apply(config) {
    cfg = cfg.set(config); 
    redraw();
  }


  function rotate(config) {
    var cFrom = cfg.center, 
        rot = prjMap.rotate(),
        interval = 1500,
        keep = false;
    if (Round(rot[1], 2) === -Round(config.center[1], 2)) keep = true; //keep lat fixed if equal
    cfg = cfg.set(config);
    var d = d3.geo.distance(cFrom, cfg.center);
    if (d < 0.035) {  //~2deg
      rotation = getAngles(cfg.center);
      prjMap.rotate(rotation);
      redraw();
    } else {
      var cTween = d3.geo.interpolate(cFrom, cfg.center);
      interval *= d;
      d3.select({}).transition().duration(interval).tween("center", function() {
        return function(_) {
          var c = getAngles(cTween(_));
          if (keep) c[1] = rot[1]; 
          prjMap.rotate(c);
          redraw();
        };
      });        
    }
  }
  
  function resize(set) {
    width = getWidth();
    if (cfg.width === width && !set) return;
    height = width/ratio;
    scale = proj.scale * width/1024;
    canvas.attr("width", width).attr("height", height);
    zoom.scaleExtent([scale, scale*5]).scale([scale]);
    prjMap.translate([width/2, height/2]).scale([scale]);
    prjOutline.translate([width/2, height/2]);
    if (parent) parent.style.height = px(height);
    redraw();
  }

  function reproject(config) {
    var prj = getProjection(config.projection);
    if (!prj) return;
    
    var rot = prjMap.rotate(), ctr = prjMap.center(),
        prjFrom = Celestial.projection(cfg.projection).center(ctr).translate([width/2, height/2]).scale([scale]),
        interval = 2500,
        rTween = d3.interpolateNumber(ratio, prj.ratio);

    if (proj.clip != prj.clip) interval = 0;   // Different clip = no transition
    
    //scale = prj.scale * width/1024;
    var prjTo = Celestial.projection(config.projection).center(ctr).translate([width/2, width/prj.ratio/2]).scale([prj.scale * width/1024]);
    var bAdapt = cfg.adaptable;
    cfg.adaptable = false;

    showHorizon(prj.clip);
    
    prjMap = projectionTween(prjFrom, prjTo);
    prjOutline = projectionTween(prjFrom, prjTo);

    d3.select({}).transition().duration(interval).tween("projection", function() {
        return function(_) {
          prjMap.alpha(_).rotate(rot);
          prjOutline.alpha(_);
          map.projection(prjMap);
          outline.projection(prjOutline);
          setClip(prj.clip);
          ratio = rTween(_);
          height = width/ratio;
          canvas.attr("width", width).attr("height", height);
          if (parent) parent.style.height = px(height);
          redraw();
        };
      }).transition().duration(0).tween("projection", function() {
        proj = prj;
        ratio = proj.ratio;
        height = width / proj.ratio;
        scale = proj.scale * width/1024;
        canvas.attr("width", width).attr("height", height);
        if (parent) parent.style.height = px(height);
        cfg.projection = config.projection;
        prjMap = Celestial.projection(config.projection).rotate(rot).translate([width/2, height/2]).scale([scale]);
        prjOutline = Celestial.projection(config.projection).translate([width/2, height/2]).scale([scale]);
        map.projection(prjMap);
        outline.projection(prjOutline);
        setClip(proj.clip); 
        zoom.projection(prjMap).scaleExtent([scale, scale*5]);
        cfg.adaptable = bAdapt;
        redraw();
      });
  }

  
  function redraw() {  
    var rot = prjMap.rotate();
    prjOutline.scale(prjMap.scale());
    
    if (cfg.adaptable) adapt = Math.sqrt(prjMap.scale()/scale);
    if (cfg.orientationfixed) {
      rot[2] = cfg.center[2]; 
      prjMap.rotate(rot);
    }
    base = cfg.stars.size * adapt;
    cfg.center = [-rot[0], -rot[1], rot[2]];
    
    setCenter(cfg.center, cfg.transform);
    clear();
    
    setStyle(cfg.background);
    container.selectAll(".outline").attr("d", outline);      
    context.fill();
    
    //Draw all types of objects on the canvas
    if (cfg.mw.show) { 
      container.selectAll(".mw").each(function(d) { setStyle(cfg.mw.style); map(d); context.fill(); });
    }
    
    for (var key in cfg.lines) {
      if (!has(cfg.lines, key)) continue;
      if (cfg.lines[key].show !== true) continue;
      setStyle(cfg.lines[key]);
      container.selectAll("."+key).attr("d", map);  
      context.stroke();    
    }

    if (cfg.constellations.show) {     
      if (cfg.constellations.names) { 
        setTextStyle(cfg.constellations.namestyle);
        container.selectAll(".constname").each( function(d) { 
          if (clip(d.geometry.coordinates)) {
            var pt = prjMap(d.geometry.coordinates);
            context.fillText(constName(d), pt[0], pt[1]); 
          }
        });
      }

      if (cfg.constellations.lines) { 
        container.selectAll(".constline").each(function(d) { setStyle(cfg.constellations.linestyle); map(d); context.stroke(); });
      }
      
      if (cfg.constellations.bounds) { 
        container.selectAll(".boundaryline").each(function(d) { setStyle(cfg.constellations.boundstyle); map(d); context.stroke(); });
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
            context.fillText(starName(d), pt[0]+r, pt[1]+r);         
          }
        }
      });
    }
    
    if (cfg.dsos.show) { 
      container.selectAll(".dso").each(function(d) {
        if (clip(d.geometry.coordinates) && dsoDisplay(d.properties, cfg.dsos.limit)) {
          var pt = prjMap(d.geometry.coordinates),
              type = d.properties.type;
          setStyle(cfg.dsos.symbols[type]);
          var r = dsoSymbol(d, pt);
          if (has(cfg.dsos.symbols[type], "stroke")) context.stroke();
          else context.fill();
          
          if (cfg.dsos.names && dsoDisplay(d.properties, cfg.dsos.namelimit)) {
            setTextStyle(cfg.dsos.namestyle);
            context.fillStyle = cfg.dsos.symbols[type].fill;
            context.fillText(dsoName(d), pt[0]+r, pt[1]+r);         
          }         
        }
      });
    }
    
    if (Celestial.data.length > 0) { 
      Celestial.data.forEach( function(d) {
        d.redraw();
      });
    }
    
    
    setStyle(cfg.background);
    container.selectAll(".outline").attr("d", outline);      
    context.stroke();
    
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
    

  // Helper functions -------------------------------------------------
  
  function clip(coords) {
    return proj.clip && d3.geo.distance(cfg.center, coords) > halfπ ? 0 : 1;
  }

  function setStyle(s) {
    context.fillStyle = s.fill || null;
    context.strokeStyle = s.stroke || null;
    context.lineWidth = s.width || null;
    context.globalAlpha = s.opacity || 1;  
    context.font = s.font;
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
    
  function zoomState(sc) {
    var czi = $("celestial-zoomin"),
        czo = $("celestial-zoomout");
    if (!czi || !czo) return;
    czi.disabled = sc >= scale*4.99;
    czo.disabled = sc <= scale;    
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
    if (!prop.mag || prop.mag == 999) return Math.pow(parseInt(prop.dim) * base / 7, 0.5); 
    return Math.pow(2 * base-prop.mag, 1.4);
  }
 

  function dsoName(d) {
    var prop = d.properties;
    if (prop.name === "") return; 
    if (cfg.dsos.desig && prop.desig) return prop.desig; 
    return prop.name;
  }
  
  /*n=true, p=false, d=false non-hd/hip desig
            p=true,  d=false proper name || non-hd/hip desig
            p=false, d=true  any desig
            p=true,  d=true  proper name || any desig  */
  function starName(d) {
    var name = d.properties.desig;
    if (cfg.stars.proper && d.properties.name !== "") name = d.properties.name;
    if (!cfg.stars.desig) return name.replace(/^H(D|IP).+/, ""); 
    
    return name; 
  }
  
  function starSize(d) {
    var mag = d.properties.mag;
    if (mag === null) return 0.1; 
    var r = base * Math.exp(exp * (mag+2));
    return Math.max(r, 0.1);
  }
  
  function starColor(d) {
    var bv = d.properties.bv;
    if (!cfg.stars.colors || isNaN(bv)) {return cfg.stars.style.fill; }
    return bvcolor(bv);
  }
  
  function constName(d) { 
    return cfg.constellations.desig ? d.properties.desig : d.properties.name; 
  }
  
  function clear() {
    context.clearRect(0, 0, width + margin[0], height + margin[1]);
  }
  
  function getWidth() {
    if (cfg.width && cfg.width > 0) return cfg.width;
    //if (parent && parent.style.width !== "" && parent.style.width !== "100%") return parent.clientWidth - margin[0];
    if (parent) return parent.clientWidth - margin[0];
    return window.innerWidth - margin[0]*2;
  }
  
  function getProjection(p) {
    if (!has(projections, p)) return;
    var res = projections[p];
    if (!has(res, "ratio")) res.ratio = 2;  // Default w/h ratio 2:1
    //res.scale *= width/1024; // Projection dependent scale prop. to width
    
    return res;
  }
  
  function getAngles(coords) {
    if (coords === null) return [0,0,0];
    var rot = eulerAngles.equatorial; 
    if (!coords[2]) coords[2] = 0;
    return [rot[0] - coords[0], rot[1] - coords[1], rot[2] + coords[2]];
  }
  
  // Exported objects and functions for adding data
  this.container = container;
  this.clip = clip;
  this.map = map;
  this.mapProjection = prjMap;
  this.context = context;
  this.setStyle = setStyle;
  this.setTextStyle = setTextStyle;
  this.redraw = redraw; 
  this.resize = function(config) { 
    if (config && has(config, "width")) cfg.width = config.width; 
    resize(true); 
  }; 
  this.reload = function(config) { 
    if (!config || !has(config, "transform")) return;
    trans = cfg.transform = config.transform; 
    container.selectAll("*").remove(); 
    setClip();
    container.append("path").datum(circle).attr("class", "horizon");
    load(); 
  }; 
  this.reproject = function(config) { reproject(config); }; 
  this.apply = function(config) { apply(config); }; 
  this.rotate = function(config) { if (!config) return cfg.center; rotate(config); }; 
  this.zoomBy = function(factor) { if (!factor) return prjMap.scale(); zoomBy(factor); };
  
  load();
};
