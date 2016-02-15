//display settings form

function form(cfg) {
  var prj = Celestial.projections(), leo = Celestial.eulerAngles();
  var ctrl = d3.select("#form").append("div").attr("class", "ctrl");
  var frm = ctrl.append("form").attr("id", "params").attr("name", "params").attr("method", "get").attr("action" ,"#");
  
  //Map parameters    
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("title", "Map width, 0 indicates full width").attr("for", "width").html("Width")
  col.append("input").attr("type", "number").attr("maxlength", "4").attr("name", "width").attr("id", "width").attr("value", "");
  col.append("span").html("px");

  col.append("label").attr("title", "Map projection, (hemi) indicates hemispherical projection").attr("for", "projection").html("Projection");
  var sel = col.append("select").attr("name", "projection").attr("id", "projection").on("change", null);
  var list = Object.keys(prj).map(function (key) { 
    var n = prj[key].clip && prj[key].clip === true ? prj[key].n + " (hemi)" : prj[key].n; 
    return {o:key, n:n} 
  });
  sel.selectAll('option').data(list).enter().append('option').attr("value", function (d) { return d.o; }).text(function (d) { return d.n; });
    
  col.append("label").attr("title", "Coordinate space in which the map is displayed").attr("for", "transform").html("Coordinates");
  var sel = col.append("select").attr("name", "transform").attr("id", "transform").on("change", null);
  var list = Object.keys(leo).map(function (key) { 
    return {o:key, n:key.replace(/^([a-z])/, function(s, m) { return m.toUpperCase(); } )} 
  });
  sel.selectAll('option').data(list).enter().append('option').attr("value", function (d) { return d.o; }).text(function (d) { return d.n; });
  col.append("br");
  
  col.append("label").attr("title", "Center coordinates long/lat in selected coordinate space").attr("for", "centerx").html("Center");
  col.append("input").attr("type", "number").attr("name", "centerx").attr("id", "centerx").attr("value", "").attr("max", "24").attr("min", "0").attr("step", "0.1");
  col.append("span").attr("id", "cxunit").html("h");
  col.append("input").attr("type", "number").attr("name", "centery").attr("id", "centery").attr("value", "").attr("max", "90").attr("min", "-90").attr("step", "0.1");
  col.append("span").html("\u00b0");

  // Stars 
  var col = frm.append("div").attr("class", "col");
  col.append("label").attr("class", "header").attr("for", "stars-show").html("Stars")
  col.append("input").attr("type", "checkbox").attr("name", "stars-show").attr("id", "stars-show").attr("value", "true");
  
  col.append("label").attr("for", "stars-limit").html("down to magnitude");
  col.append("input").attr("type", "number").attr("name", "stars-limit").attr("id", "stars-limit").attr("value", "").attr("max", "6").attr("min", "-1").attr("step", "0.1");
  
  col.append("label").attr("for", "stars-colors").html("with spectral colors");
  col.append("input").attr("type", "checkbox").attr("name", "stars-colors").attr("value", "true");
  
  col.append("label").attr("for", "stars-color").html("or default color ");
  col.append("input").attr("type", "color").attr("name", "stars-color").attr("id", "stars-color").attr("value", "");
  col.append("br");
  
  col.append("label").attr("for", "stars-names").html("Show names");
  col.append("input").attr("type", "checkbox").attr("name", "stars-names").attr("id", "stars-names").attr("value", "true") ;
  
  col.append("label").attr("for", "stars-proper").html("proper names (if any)");
  col.append("input").attr("type", "checkbox").attr("name", "stars-proper").attr("id", "stars-proper").attr("value", "true");
  
  col.append("label").attr("for", "stars-desig").html("or designations");
  col.append("input").attr("type", "checkbox").attr("name", "stars-desig").attr("id", "stars-desig").attr("value", "true");
  
  col.append("label").attr("for", "stars-namelimit").html("down to mag");
  col.append("input").attr("type", "number").attr("name", "stars-namelimit").attr("id", "stars-namelimit").attr("value", "").attr("max", "6").attr("min", "-1").attr("step", "0.1");

  // DSOs 
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("class", "header").attr("title", "Deep Space Objects").attr("for", "dsos-show").html("DSOs");
  col.append("input").attr("type", "checkbox").attr("name", "dsos-show").attr("id", "dsos-show").attr("value", "true");
  
  col.append("label").attr("for", "dsos-limit").html("down to mag");
  col.append("input").attr("type", "number").attr("name", "dsos-limit").attr("id", "dsos-limit").attr("value", "").attr("max", "6").attr("min", "0").attr("step", "0.1");
  
  col.append("label").attr("for", "dsos-names").html("with names");
  col.append("input").attr("type", "checkbox").attr("name", "dsos-names").attr("id", "dsos-names").attr("value", "true");
  
  col.append("label").attr("for", "dsos-desig").html("or designations");
  col.append("input").attr("type", "checkbox").attr("name", "dsos-desig").attr("id", "dsos-desig").attr("value", "true");
  
  col.append("label").attr("for", "dsos-namelimit").html("down to mag");
  col.append("input").attr("type", "number").attr("name", "dsos-namelimit").attr("id", "dsos-namelimit").attr("value", "").attr("max", "6").attr("min", "0").attr("step", "0.1");

  // Constellations 
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("class", "header").attr("for", "constellations-show").html("Constellations");
  col.append("input").attr("type", "checkbox").attr("name", "constellations-show").attr("id", "constellations-show").attr("value", "true");
  
  col.append("label").attr("for", "constellations-names").html("with names");
  col.append("input").attr("type", "checkbox").attr("name", "constellations-names").attr("id", "constellations-names").attr("value", "true");
  
  col.append("label").attr("for", "constellations-desig").html("abbreviated");
  col.append("input").attr("type", "checkbox").attr("name", "constellations-desig").attr("id", "constellations-desig").attr("value", "true");
  
  col.append("label").attr("for", "constellations-lines").html("with lines");
  col.append("input").attr("type", "checkbox").attr("name", "constellations-lines").attr("id", "constellations-lines").attr("value", "true");
  
  col.append("label").attr("for", "constellations-bounds").html("with boundaries");
  col.append("input").attr("type", "checkbox").attr("name", "constellations-bounds").attr("id", "constellations-bounds").attr("value", "true");

  // graticules & planes 
  var col = frm.append("div").attr("class", "col");
  col.append("label").attr("class", "header").html("Lines");
  
  col.append("label").attr("title", "X/Y grid lines").attr("for", "lines-graticule").html("Graticule");
  col.append("input").attr("type", "checkbox").attr("name", "lines-graticule").attr("id", "lines-graticule").attr("value", "true");
  
  col.append("label").attr("for", "lines-equatorial").html("Equator");
  col.append("input").attr("type", "checkbox").attr("name", "lines-equatorial").attr("id", "lines-equatorial").attr("value", "true");
  
  col.append("label").attr("for", "lines-ecliptic").html("Ecliptic");
  col.append("input").attr("type", "checkbox").attr("name", "lines-ecliptic").attr("id", "lines-ecliptic").attr("value", "true");
  
  col.append("label").attr("for", "lines-galactic").html("Galactic plane");
  col.append("input").attr("type", "checkbox").attr("name", "lines-galactic").attr("id", "lines-galactic").attr("value", "true");
  
  col.append("label").attr("for", "lines-supergalactic").html("Supergalactic plane");
  col.append("input").attr("type", "checkbox").attr("name", "lines-supergalactic").attr("id", "lines-supergalactic").attr("value", "true");

  // Other
  var col = frm.append("div").attr("class", "col");
  col.append("label").attr("class", "header").html("Other");
  
  col.append("label").attr("for", "mw-show").html("Milky Way");
  col.append("input").attr("type", "checkbox").attr("name", "mw-show").attr("id", "mw-show").attr("value", "true");
  
  col.append("label").attr("for", "background").html("Background color");
   col.append("input").attr("type", "color").attr("name", "background").attr("id", "background").attr("value", "");
  
  col.append("label").attr("title", "Star/DSO sizes are increased with higher zoom-levels").attr("for", "adaptable").html("Adaptable sizes");
  col.append("input").attr("type", "checkbox").attr("name", "adaptable").attr("id", "adaptable").attr("value", "true");

}