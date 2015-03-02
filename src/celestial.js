//Celestial.js main file
var Celestial = {};

Celestial.display = function(config) {
  var circle;
  
  var set = function() {
    var set, key;
    for (set in settings) {
    if (!config.hasOwnProperty(set)) { continue; }
    if (config[set] === null) { continue; }
      if (settings[set].constructor != Object ) {
        settings[set] = config[set];
      } else {
        for (key in settings[set]) {
          if (config[set].hasOwnProperty(key)) {
            settings[set][key] = config[set][key];
          }
        }
      }
    }
  };

  if (config) { set(config); }
  
  if (!projections.hasOwnProperty(settings.projection)) { return; }
  
  var proj = projections[settings.projection],
      ratio = proj.ratio || 2,
      width = settings.width,
      height = width / ratio,
      sc = width / 180,
      center = [180, 0, 0];
    
  var projection = Celestial.projection(settings.projection, settings.transform).rotate(center).translate([width/2, height/2]).scale([proj.scale]);
  var projBg = Celestial.projection(settings.projection).rotate(center).translate([width/2, height/2]).scale([proj.scale]);
  var projOl = Celestial.projection(settings.projection).translate([width/2, height/2]).scale([proj.scale]);

  if (proj.clip) {
    projection.clipAngle(90);
    projBg.clipAngle(90);
    circle = d3.geo.circle().angle([90]);
  }

  var zoom = d3.geo.zoom().projection(projection).center([width/2, height/2]).scaleExtent([proj.scale*0.8, proj.scale*4]).on("zoom", zoomed);
  
  var graticule = d3.geo.graticule().minorStep([15,10]);
                    
  var path = d3.geo.path().projection(projection);
  var bg = d3.geo.path().projection(projBg);
  var ol = d3.geo.path().projection(projOl);
      
  var svg = d3.select("body").append("svg").attr("width", width).attr("height", height).call(zoom);
  
  if (circle) {
    svg.append("path").datum(circle).attr("class", "outline").attr("d", ol); //.style("fill", settings.bgcolor);
  } else {
    svg.append("path").datum(graticule.outline).attr("class", "outline").attr("d", bg); //.style("fill", settings.bgcolor);
  }
  if (settings.lines.graticule) {
    svg.append("path").datum(graticule).attr("class", "gridline").attr("d", bg);
  }
  
  //d3.select("body").style("background-color", "black");
  
  //Milky way outline
  if (settings.mw.show) { d3.json("data/mw.json", function(error, mwjson) {
    svg.selectAll(".mway")
       .data(mwjson.features)
       .enter()
       .append("path")
       .attr("class", "mw")
       .attr("d", path);
       //.style("fill", settings.mw.color)
       //.style("opacity", settings.mw.opacity/5);
  });}

  //Constellation nemes or designation
  if (settings.constellations.show) { 
    d3.json("data/constellations.json", function(error, conjson) {
      svg.selectAll(".constnames")
         .data(conjson.features)
         .enter()
         .append("text")
         .attr("class", "constname")
         .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
         .text( function(d, i) { if (settings.constellations.names) { return settings.constellations.desig?d.properties.desig:d.properties.name; }})
         .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); }); 
    });

    //Constellation boundaries
    if (settings.constellations.bounds) { 
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
    if (settings.constellations.lines) { 
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
  if (settings.stars.show) { 
    d3.json(settings.stars.data, function(error, starjson) {
      svg.selectAll(".stars")
         .data(starjson.features)
         .enter()
         .append("path")
         .attr("class", "star")
         .attr("d", path.pointRadius( function(d, i) {
           return starsize(d.properties.mag);
         } ))
         .style("fill", function(d, i) {
           return starcolor(d.properties);
         });

      if (settings.stars.names) { 
        svg.selectAll(".starnames")
           .data(starjson.features)
           .enter()
           .append("text")
           .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
           .text( function(d, i) { return starname(d.properties); })
           .attr("dy", "-.5em")
           .attr("dx", ".35em")
           .attr("class", "starname")
           .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); }); 
      }       
    });
  }

  //Deep space objects
  if (settings.dsos.show) { 
    d3.json(settings.dsos.data, function(error, dsojson) {
      svg.selectAll(".dsos")
         .data(dsojson.features)
         .enter()
         .append("path")
         .attr("class", "dso")
         .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
         .attr("d", function(d, i) { return dsosymbol(d.properties); })
         .style("stroke", function(d, i) { return dsocolor(d.properties, "stroke"); })
         .style("fill", function(d, i) { return dsocolor(d.properties, "fill"); })
         .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); })
         .style("stroke-opacity", function(d, i) { return clip(d.geometry.coordinates); }); 
    
      if (settings.dsos.names) { 
        svg.selectAll(".dsonames")
           .data(dsojson.features)
           .enter()
           .append("text")
           .attr("class", "dsoname")
           .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
           .text( function(d, i) { return dsoname(d.properties); } )
           .attr("dy", "-.5em")
           .attr("dx", ".35em")
           .style("fill", function(d, i) { return dsocolor(d.properties, "stroke"); })
           .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); }); 
      }
    });
  }

  //Celestial planes
  for (var key in settings.lines) {
    if (settings.lines.hasOwnProperty(key) && key != "graticule" && settings.lines[key] !== false) { 
      var pl = Celestial.plane(key);  

      svg.selectAll(".pl" + key)
         .data(pl.features)
         .enter()
         .append("path")
         .attr("d", path)
         .attr("class", key);
    }
  }
  
   
  //-- Helper functions

  function clip(coords) {
    return proj.clip && d3.geo.distance(center, coords) > pi_2 ? 0 : 1;
  }

  function point(coords) {
    return "translate(" + projection(coords) + ")";
  }
  
  function zoomed() {
    if (!d3.event) { return; }
    var rot = projection.rotate();
    projBg.scale(projection.scale());
    projBg.rotate(projection.rotate());
    projOl.scale(projection.scale());
    
    center = [-rot[0], -rot[1]];
    
    svg.selectAll(".constname")
       .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); });
    svg.selectAll(".constline").attr("d", path);  
    svg.selectAll(".boundaryline").attr("d", path);  

    svg.selectAll(".star")
       .attr("d", path.pointRadius( function(d, i) { return starsize(d.properties.mag); } )); 
    svg.selectAll(".starname")
       .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); });
       
    svg.selectAll(".dso")
       .attr("transform", function(d) { return point(d.geometry.coordinates); })
       .attr("d", function(d, i) { return dsosymbol(d.properties); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); })
       .style("stroke-opacity", function(d, i) { return clip(d.geometry.coordinates); });
    svg.selectAll(".dsoname")
       .attr("transform", function(d, i) { return point(d.geometry.coordinates); })
       .style("fill-opacity", function(d, i) { return clip(d.geometry.coordinates); });
    
    svg.selectAll(".outline").attr("d", ol);  
    svg.selectAll(".gridline").attr("d", bg);  

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

  function dsocolor(prop, which) {
    if (!prop.type || 
        !symbols.hasOwnProperty(prop.type) || 
        prop.mag == 999 && Math.sqrt(parseInt(prop.dim)) < settings.dsos.limit || 
        prop.mag != 999 && prop.mag > settings.dsos.limit) { return "none"; }
    return symbols[prop.type][which]; 
  }

  function dsosize(mag, dim) {
    if (!mag || mag == 999) { return Math.pow(parseInt(dim), 0.5); }
    return Math.pow(14-mag, 1.4);
  }

  function dsoname(prop) {
    if (prop.mag == 999 && Math.sqrt(parseInt(prop.dim)) < settings.dsos.namelimit || 
        prop.mag != 999 && prop.mag > settings.dsos.namelimit || 
        prop.name === "") { return; }
    if (settings.dsos.desig && prop.desig) { return prop.desig; }
    return prop.name;
  }
  
  function starname(prop) {
    if (prop.mag > settings.stars.namelimit || 
       (settings.stars.desig === false && prop.name === "")) { return; }
    if (settings.stars.proper && prop.name !== "") { return prop.name; }
    if (settings.stars.desig) { return prop.desig; }
  }
  
  function starsize(mag) {
    if (mag === null) { return 0.3; }
    var d = Math.pow(6-mag, 0.66);
    return d>0.5 ? d : 0.5;
  }
  
  function starcolor(prop) {
    if (prop.mag > settings.stars.limit) { return "rgba(0,0,0,0)"; }
    if (!settings.stars.colors || prop.mag > 5) { return settings.stars.color; }
    return bvcolor(prop.bv);
  }
  
};