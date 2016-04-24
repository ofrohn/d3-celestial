/* global settings, bvcolor, projections, poles, eulerAngles, euler, transformDeg, getData, Canvas, halfπ, $, px, has, form, setCenter */
var Celestial = {
  version: '0.5.3',
  container: null,
  data: []
};
 
var cfg, projection, projOl, zoom, map, outline;

// Show it all, with the given config, otherwise with default settings
Celestial.display = function(config) {
  var circle, par, container = Celestial.container;
  
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
  
  if (!has(projections, cfg.projection)) return; 
  
  var proj = projections[cfg.projection],
      trans = cfg.transform || "equatorial",
      ratio = proj.ratio || 2,
      margin = [16,16],
      width = getWidth(),
      height = width / ratio,
      scale = proj.scale * width/1024, // Projection dependent scale prop. to width
      base = cfg.stars.size, 
      exp = -0.28, //Object size base & exponent
      adapt = 1,
      rotation = getAngles(cfg.center),
      //center = [-rotation[0], -rotation[1]],
      path = cfg.datapath || "";
      path = path.replace(/([^\/]$)/, "$1\/");
  
      
  if (par != "body") $(cfg.container).style.height = px(height);
  
  projection = Celestial.projection(cfg.projection).rotate(rotation).translate([width/2, height/2]).scale([scale]);
  projOl = Celestial.projection(cfg.projection).translate([width/2, height/2]).scale([scale]); //projected non moving outline
  
  if (proj.clip) {
    projection.clipAngle(90);
    circle = d3.geo.circle().angle([90]);
  }
  
  zoom = d3.geo.zoom().projection(projection).center([width/2, height/2]).scaleExtent([scale, scale*5]).on("zoom.redraw", redraw);

  var canvas = d3.selectAll("canvas");
  if (canvas[0].length === 0) canvas = d3.select(par).append("canvas");
  canvas.attr("width", width).attr("height", height);
  var context = canvas.node().getContext("2d");  
  
  var graticule = d3.geo.graticule().minorStep([15,10]);
  
  map = d3.geo.path().projection(projection).context(context);
  outline = d3.geo.path().projection(projOl).context(context);
   
  //parent div with id #map or body
  if (container) container.selectAll("*").remove();
  else container = d3.select(par).append("container");

  if (cfg.interactive) canvas.call(zoom);
  else canvas.attr("style", "cursor: default!important");
  
  if (circle) {
    container.append("path").datum(circle).attr("class", "outline"); 
  } else {
    container.append("path").datum(graticule.outline).attr("class", "outline"); 
  }

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

  if (this.data.length > 0) { 
    this.data.forEach( function(d) {
      if (has(d, "file")) d3.json(d.file, d.callback);
      else setTimeout(d.callback, 0);
    }, this);
  }
    
  d3.select(window).on('resize', resize);

  if (cfg.controls === true && $("celestial-zoomin") === null) {
    d3.select(par).append("input").attr("type", "button").attr("id", "celestial-zoomin").attr("value", "\u002b").on("click", function() { zoomBy(1.111); });
    d3.select(par).append("input").attr("type", "button").attr("id", "celestial-zoomout").attr("value", "\u2212").on("click", function() { zoomBy(0.9); });
  }
  
  if (cfg.form === true && $("params") === null) form(cfg);

  
  function zoomBy(factor) {
    var scale = projection.scale() * factor,
        ext = zoom.scaleExtent();
    if (scale < ext[0]) scale = ext[0];
    if (scale > ext[1]) scale = ext[1];
    projection.scale([scale]); 
    zoom.scale([scale]); 
    redraw(); 
  }  
  
  function apply(config) {
    cfg = settings.set(config); 
    redraw();
  }


  function rotate(config) {
    cfg = settings.set(config);
    var rot = projection.rotate();
    rotation = getAngles(cfg.center);
    rotation[2] = rot[2];
    //center = [-rotation[0], -rotation[1]];
    projection.rotate(rotation);
    redraw();
  }
  
  function resize() {
    if (cfg.width && cfg.width > 0) return;
    width = getWidth();
    height = width/ratio;
    var scale = proj.scale * width/1024;
    canvas.attr("width", width).attr("height", height);
    zoom.scale([scale]);
    projection.translate([width/2, height/2]).scale([scale]);
    projOl.translate([width/2, height/2]);
    if (parent) parent.style.height = px(height);
    redraw();
  }
  
  function redraw() {  
    var rot = projection.rotate();
    projOl.scale(projection.scale());
    
    if (cfg.adaptable) adapt = Math.sqrt(projection.scale()/scale);
    base = cfg.stars.size * adapt;
    cfg.center = [-rot[0], -rot[1]];
    
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
            var pt = projection(d.geometry.coordinates);
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
          var pt = projection(d.geometry.coordinates),
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
          var pt = projection(d.geometry.coordinates),
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
    
    if (cfg.controls) { 
      zoomState(projection.scale());
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
    $("celestial-zoomin").disabled = sc >= scale*4.99;
    $("celestial-zoomout").disabled = sc <= scale;    
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
    context.clearRect(0,0,width+margin[0],height+margin[1]);
  }
  
  function getWidth() {
    if (cfg.width && cfg.width > 0) return cfg.width;
    //if (parent && parent.style.width !== "" && parent.style.width !== "100%") return parent.clientWidth - margin[0];
    if (parent) return parent.clientWidth - margin[0];
    return window.innerWidth - margin[0]*2;
  }
  
  function getAngles(coords) {
    if (coords === null) return [0,0];
    var rot = eulerAngles.equatorial; //, rp = projection.rotate(); //, ctr = 0;
    //if (!coords || trans !== 'equatorial') {
      //if (trans === 'equatorial' || trans === 'ecliptic') ctr = 180;
      //return [rot[0], rot[1], rot[2]];
    //}
    //ctr = transformDeg(coords, euler["inverse " + trans]);
    return [rot[0] - coords[0], rot[1] - coords[1], rot[2]];
  }
  
  // Exported objects and functions for adding data
  this.container = container;
  this.clip = clip;
  this.map = map;
  this.mapProjection = projection;
  this.context = context;
  this.setStyle = setStyle;
  this.setTextStyle = setTextStyle;
  this.redraw = redraw; 
  this.resize = function() { resize(); }; 
  this.apply = function(config) { apply(config); }; 
  this.rotate = function(config) { if (!config) return cfg.center; rotate(config); }; 
  this.zoomBy = function(factor) { if (!factor) return cfg.center; zoomBy(factor); };
};
