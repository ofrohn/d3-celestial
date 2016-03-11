/* global settings, symbols, bvcolor, projections, poles, eulerAngles, halfπ, $, px, has */
var Celestial = {
  version: '0.5.0',
  container: null,
  data: []
};


// Show it all, with the given config, otherwise with default settings
Celestial.display = function(config) {
  var circle, par, container = Celestial.container;
  
  //Mash config with default settings
  var cfg = settings.set(config); 
  cfg.stars.size = cfg.stars.size || 7;  //Nothung works without starsize
  
  var parent = $(cfg.container);
  if (parent) { 
    par = "#"+cfg.container;
    var st = window.getComputedStyle(parent, null);
    //parent.style.width = stl.width;
    if (!parseInt(st.width) && !cfg.width) parent.style.width = px(window.innerWidth);    
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

  var canvas = d3.selectAll("canvas");
  if (canvas[0].length === 0) canvas = d3.select(par).append("canvas");
  canvas.attr("width", width).attr("height", height);
  var context = canvas.node().getContext("2d");  
  
  var graticule = d3.geo.graticule().minorStep([15,10]);
  
  var map = d3.geo.path().projection(projection).context(context);
  var outline = d3.geo.path().projection(projOl).context(context);
   
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

  if (cfg.lines.graticule.show) {
      container.append("path").datum(graticule).attr("class", "graticule"); 
  }

  //Celestial planes
  for (var key in cfg.lines) {
    if (!has(cfg.lines, key) || key === "graticule" || cfg.lines[key].show === false) continue;
    container.append("path")
       .datum(d3.geo.circle().angle([90]).origin(transformDeg(poles[key], euler[trans])) )
       .attr("class", key);
  }
  
  //Milky way outline
  if (cfg.mw.show) { d3.json(path + "mw.json", function(error, json) {
    if (error) { 
      window.alert("Your Browser doesn't support local file loading or the file doesn't exist. See readme.md");
      return console.warn(error);  
    }

    mw = getData(json, trans);

    container.selectAll(".mway")
       .data(mw.features)
       .enter().append("path")
       .attr("class", "mw");
    redraw();
  });}

  //Constellation names or designation
  if (cfg.constellations.show) { 
    d3.json(path + "constellations.json", function(error, json) {
      if (error) return console.warn(error);
      
      con = getData(json, trans);
      
      if (cfg.constellations.names) { 
        container.selectAll(".constnames")
           .data(con.features)
           .enter().append("text")
           .attr("class", "constname")
           .attr("text", function(d) { if (cfg.constellations.names) { return cfg.constellations.desig?d.properties.desig:d.properties.name; }});
        redraw();
      }
    });

    //Constellation boundaries
    if (cfg.constellations.bounds) { 
      d3.json(path + "constellations.bounds.json", function(error, json) {
        if (error) return console.warn(error);

        conb = getData(json, trans);

        container.selectAll(".bounds")
           .data(conb.features)
           .enter().append("path")
           .attr("class", "boundaryline");
        redraw();
      });
    }

    //Constellation lines
    if (cfg.constellations.lines) { 
      d3.json(path + "constellations.lines.json", function(error, json) {
        if (error) return console.warn(error);

        conl = getData(json, trans);

        container.selectAll(".lines")
           .data(conl.features)
           .enter().append("path")
           .attr("class", "constline");
           //.attr("d", map);
        redraw();
      });
    }
  }
  
  //Stars
  if (cfg.stars.show) { 
    d3.json(path + cfg.stars.data, function(error, json) {
      if (error) return console.warn(error);

      st = getData(json, trans);

      container.selectAll(".stars")
         .data(st.features)
         //.data(st.features.filter( function(d) {
         //  return d.properties.mag <= cfg.stars.limit; 
         //}))
         .enter().append("path")
         .attr("class", "star")
         //.attr("d", map.pointRadius( function(d) {
         //  return d.properties ? starSize(d.properties.mag) : 1;
         //}))
         .attr("text", starName)
         .attr("fill", starColor);
         //.attr("radius", starSize);

/*      if (cfg.stars.names) { 
        container.selectAll(".starnames")
           .data(st.features.filter( function(d) {
             return d.properties.mag <= cfg.stars.namelimit; 
           }))
           .enter().append("text")
           .attr("transform", function(d) { return point(d.geometry.coordinates); })
           .text( function(d) { return starName(d.properties); })
           .attr({dy: "-.5em", dx: ".35em", class: "starname"})
           .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); });
      }*/
      redraw();
    });
  }

  //Deep space objects
  if (cfg.dsos.show) { 
    d3.json(path + cfg.dsos.data, function(error, json) {
      if (error) return console.warn(error);
      
      ds = getData(json, trans);
  
      container.selectAll(".dsos")
         .data(ds.features)
         /*.filter( function(d) {
           return d.properties.mag == 999 && Math.sqrt(parseInt(d.properties.dim)) > cfg.dsos.limit ||
                  d.properties.mag != 999 && d.properties.mag <= cfg.dsos.limit; 
         }))*/
         .enter().append("path")
         .attr("class", "dso" );
         //.attr("class", function(d) { return "dso " + d.properties.type; } );
         //.attr("transform", function(d) { return point(d.geometry.coordinates); })
         //.attr("d", function(d) { return dsoSymbol(d.properties); })
         //.attr("style", function(d) { return opacity(d.geometry.coordinates); });
      /*
      if (cfg.dsos.names) { 
        container.selectAll(".dsonames")
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
      }*/
      redraw();
    });
  }

  if (this.data.length > 0) { 
    this.data.forEach( function(d) {
      if (has(d, "file")) d3.json(d.file, d.callback);
      else setTimeout(d.callback, 0);
    }, this);
  }
  
  d3.select(window).on('resize', resize);
  
  
  function resize() {
    if (cfg.width && cfg.width > 0) return;
    //context.clearRect(0,0,width,height);
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
  
  // Exported objects and functions for adding data
  this.container = container;
  this.clip = clip;
  this.point = point;
  this.opacity = opacity;
  this.map = map;
  this.mapProjection = projection;
  this.resize = function() { resize(); }; 
  
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

  function setStyle(s) {
    context.fillStyle = s.fill;
    context.strokeStyle = s.stroke || null;
    context.lineWidth = s.width || null;
    context.globalAlpha = s.opacity || 1;  
    context.font = s.font;
    s.dash ? context.setLineDash(s.dash) : context.setLineDash([]);
    context.beginPath();
  }

  function setTextStyle(s) {
    context.fillStyle = s.fill;
    context.textAlign = s.align || "left";
    context.textBaseline = s.baseline || "bottom";
    context.globalAlpha = s.opacity || 1;  
    context.font = s.font;
  }
    
  function redraw() {
    //if (!d3.event) return; 
    //d3.event.preventDefault();
    
    var rot = projection.rotate();
    projOl.scale(projection.scale());
    
    if (cfg.adaptable) adapt = Math.sqrt(projection.scale()/scale);
    base = cfg.stars.size * adapt;
    center = [-rot[0], -rot[1]];
    
    clear();
    
    setStyle(cfg.background);
    container.selectAll(".outline").attr("d", outline);      
    context.fill();
    //context.sroke();
    
    //All different types of objects need separate updates
    container.selectAll(".mw").each(function(d) { setStyle(cfg.mw.style); map(d); context.fill(); });

    for (var key in cfg.lines) {
      setStyle(cfg.lines[key]);
      container.selectAll("."+key).attr("d", map);  
      context.stroke();    
    }

    setTextStyle(cfg.constellations.namestyle);
    container.selectAll(".constname").each( function(d) { 
      if (clip(d.geometry.coordinates)) {
        var node = d3.select(this),
            pt = projection(d.geometry.coordinates);
        context.fillText(node.attr("text"), pt[0], pt[1]); 
      }
    });
    /*container.selectAll(".constname")
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); });*/
    container.selectAll(".constline").each(function(d) { setStyle(cfg.constellations.linestyle); map(d); context.stroke(); });
    container.selectAll(".boundaryline").each(function(d) { setStyle(cfg.constellations.boundstyle); map(d); context.stroke(); });
    //container.selectAll(".constline").attr("d", map);  
    //container.selectAll(".boundaryline").attr("d", map);  
    
    setStyle(cfg.stars.style);
    container.selectAll(".star").each(function(d) {
      if (clip(d.geometry.coordinates) && d.properties.mag <= cfg.stars.limit) {
        var node = d3.select(this),
            pt = projection(d.geometry.coordinates),
            r = starSize(d);//node.attr("radius");
        context.fillStyle = node.attr("fill");
        context.beginPath();
        context.arc(pt[0], pt[1], r, 0, 2 * Math.PI);
        context.closePath();
        context.fill();
        if (cfg.stars.names && d.properties.mag <= cfg.stars.namelimit) {
          setTextStyle(cfg.stars.namestyle);
          context.fillText(node.attr("text"), pt[0], pt[1]);         
        }
      }
    });

    /*container.selectAll(".starname")   
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d) { return clip(d.geometry.coordinates); }); 
    */
    container.selectAll(".dso")
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .attr("d", function(d) { return dsoSymbol(d.properties); })
       .attr("style", function(d) { return opacity(d.geometry.coordinates); });
    container.selectAll(".dsoname")
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .attr("style", function(d) { return opacity(d.geometry.coordinates); });

    if (Celestial.data.length > 0) { 
      Celestial.data.forEach( function(d) {
        d.redraw();
      });
    }
    //setStyle(cfg.background);
    //container.selectAll(".outline").attr("d", outline);      
    //context.sroke();
  }

  function dsoSymbol(d) {
    var prop = d.properties;
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

  function dsoSize(d) {
    var prop = d.properties;
    if (!prop.mag || prop.mag == 999) return Math.pow(parseInt(prop.dim)*base/7, 0.5); 
    return Math.pow(2*base-prop.mag, 1.4);
  }
 

  function dsoName(d) {
    var prop = d.properties;
    if (prop.name === "") return; 
    if (cfg.dsos.desig && prop.desig) return prop.desig; 
    return prop.name;
  }
  
  function starName(d) {
    var name = d.properties.name;
    if (cfg.stars.desig === false && name === "") return; 
    if (cfg.stars.proper && name !== "") return name; 
    if (cfg.stars.desig)  return d.properties.desig; 
  }
  
  function starSize(d) {
    var mag = d.properties.mag;
    if (mag === null) return 0.1; 
    var d = base * Math.exp(exp * (mag+2));
    return Math.max(d, 0.1);
  }
  
  function starColor(d) {
    var bv = d.properties.bv;
    if (!cfg.stars.colors || isNaN(bv)) {return cfg.stars.style.fill; }
    return bvcolor(bv);
  }
  
  function clear() {
    context.clearRect(0,0,width+margin[0],height+margin[1]);
  }
  
  function getWidth() {
    if (cfg.width && cfg.width > 0) return cfg.width;
    if (parent && parent.style.width !== "" && parent.style.width !== "100%") return parent.clientWidth - margin[0];
    return window.innerWidth - margin[0]*2;
  }
  
  function getAngles(coords) {
    var rot = eulerAngles['equatorial'], ctr = 0;
    if (!coords || trans !== 'equatorial') {
      if (trans === 'equatorial' || trans === 'ecliptic') ctr = 180;
      return [rot[0] - ctr, rot[1], rot[2]];
    }
    //ctr = transformDeg(coords, euler["inverse " + trans]);
    return [rot[0] - coords[0], rot[1] - coords[1], rot[2]];
  }
};
