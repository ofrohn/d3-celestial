//display settings form

function form(cfg) {
  var prj = Celestial.projections(), leo = Celestial.eulerAngles();
  var ctrl = d3.select("#form").append("div").attr("class", "ctrl");
  var frm = ctrl.append("form").attr("id", "params").attr("name", "params").attr("method", "get").attr("action" ,"#");
  
  //Map parameters    
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("title", "Map width, 0 indicates full width").attr("for", "width").html("Width")
  col.append("input").attr("type", "number").attr("maxlength", "4").attr("name", "width").attr("id", "width").property("value", cfg.width);
  col.append("span").html("px");

  col.append("label").attr("title", "Map projection, (hemi) indicates hemispherical projection").attr("for", "projection").html("Projection");
  var sel = col.append("select").attr("name", "projection").attr("id", "projection").on("change", null);
  var selected = 0;
  var list = Object.keys(prj).map( function (key, i) { 
    var n = prj[key].clip && prj[key].clip === true ? prj[key].n + " (hemi)" : prj[key].n; 
    if (key === cfg.projection) selected = i;
    return {o:key, n:n} 
  });
  sel.selectAll('option').data(list).enter().append('option')
     .property("value", function (d) { return d.o; })
     .text(function (d) { return d.n; });
  sel.property("selectedIndex", selected);
  
  selected = 0;
  col.append("label").attr("title", "Coordinate space in which the map is displayed").attr("for", "transform").html("Coordinates");
  var sel = col.append("select").attr("name", "transform").attr("id", "transform").on("change", null);
  var list = Object.keys(leo).map(function (key, i) {
    if (key === cfg.transform) selected = i;    
    return {o:key, n:key.replace(/^([a-z])/, function(s, m) { return m.toUpperCase(); } )} 
  });
  sel.selectAll('option').data(list).enter().append('option')
     .property("value", function (d) { return d.o; })
     .text(function (d) { return d.n; });
  sel.property("selectedIndex", selected);
  col.append("br");
  
  col.append("label").attr("title", "Center coordinates long/lat in selected coordinate space").attr("for", "centerx").html("Center");
  col.append("input").attr("type", "number").attr("name", "centerx").attr("id", "centerx").property("value", cfg.center[0]).attr("max", "24").attr("min", "0").attr("step", "0.1");
  col.append("span").attr("id", "cxunit").html("h");
  col.append("input").attr("type", "number").attr("name", "centery").attr("id", "centery").property("value", cfg.center[1]).attr("max", "90").attr("min", "-90").attr("step", "0.1");
  col.append("span").html("\u00b0");

  // Stars 
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("class", "header").attr("for", "stars-show").html("Stars")
  col.append("input").attr("type", "checkbox").attr("name", "stars-show").attr("id", "stars-show").property("value", "true").property("checked", cfg.stars.show);
  
  col.append("label").attr("for", "stars-limit").html("down to magnitude").style("color", cfg.stars.show ? "#000" : "#999");
  col.append("input").attr("type", "number").attr("name", "stars-limit").attr("id", "stars-limit").property("value", cfg.stars.limit).attr("max", "6").attr("min", "-1").attr("step", "0.1").property("disabled", !cfg.stars.show);
  
  col.append("label").attr("for", "stars-colors").html("with spectral colors").style("color", cfg.stars.show ? "#000" : "#999");
  col.append("input").attr("type", "checkbox").attr("name", "stars-colors").property("value", "true").property("checked", cfg.stars.colors).property("disabled", !cfg.stars.show);
  
  col.append("label").attr("for", "stars-color").html("or default color ").style("color", cfg.stars.show ? "#000" : "#999");
  col.append("input").attr("type", "color").attr("name", "stars-color").attr("id", "stars-color").property("value", cfg.stars.color).property("disabled", !cfg.stars.show);
  col.append("br");
  
  col.append("label").attr("for", "stars-names").html("Show names").style("color", cfg.stars.show ? "#000" : "#999");
  col.append("input").attr("type", "checkbox").attr("name", "stars-names").attr("id", "stars-names").property("value", "true").property("checked", cfg.stars.names).property("disabled", !cfg.stars.show);
  
  col.append("label").attr("for", "stars-proper").html("proper names (if any)").style("color", !cfg.stars.show || !cfg.stars.names ? "#999" : "#000");
  col.append("input").attr("type", "checkbox").attr("name", "stars-proper").attr("id", "stars-proper").property("value", "true").property("checked", cfg.stars.proper).property("disabled", !cfg.stars.show || !cfg.stars.names);
  
  col.append("label").attr("for", "stars-desig").html("or designations").style("color", !cfg.stars.show || !cfg.stars.names ? "#999" : "#000");
  col.append("input").attr("type", "checkbox").attr("name", "stars-desig").attr("id", "stars-desig").property("value", "true").property("checked", cfg.stars.desig).property("disabled", !cfg.stars.show || !cfg.stars.names);
  
  col.append("label").attr("for", "stars-namelimit").html("down to mag").style("color", !cfg.stars.show || !cfg.stars.names ? "#999" : "#000");
  col.append("input").attr("type", "number").attr("name", "stars-namelimit").attr("id", "stars-namelimit").property("value", cfg.stars.namelimit).attr("max", "6").attr("min", "-1").attr("step", "0.1").property("disabled", !cfg.stars.show || !cfg.stars.names);

  // DSOs 
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("class", "header").attr("title", "Deep Space Objects").attr("for", "dsos-show").html("DSOs");
  col.append("input").attr("type", "checkbox").attr("name", "dsos-show").attr("id", "dsos-show").property("value", "true").property("checked", cfg.dsos.show);
  
  col.append("label").attr("for", "dsos-limit").html("down to mag").style("color", cfg.dsos.show ? "#000" : "#999");
  col.append("input").attr("type", "number").attr("name", "dsos-limit").attr("id", "dsos-limit").property("value", cfg.dsos.limit).attr("max", "6").attr("min", "0").attr("step", "0.1").property("disabled", !cfg.dsos.show);
  
  col.append("label").attr("for", "dsos-names").html("with names").style("color", cfg.dsos.show ? "#000" : "#999");
  col.append("input").attr("type", "checkbox").attr("name", "dsos-names").attr("id", "dsos-names").property("value", "true").property("checked", cfg.dsos.names).property("disabled", !cfg.dsos.show);
  
  col.append("label").attr("for", "dsos-desig").html("or designations").style("color", !cfg.dsos.show || !cfg.dsos.names ? "#999" : "#000");
  col.append("input").attr("type", "checkbox").attr("name", "dsos-desig").attr("id", "dsos-desig").property("value", "true").property("checked", cfg.dsos.desig).property("disabled", !cfg.dsos.show || !cfg.dsos.names);
  
  col.append("label").attr("for", "dsos-namelimit").html("down to mag").style("color", !cfg.dsos.show || !cfg.dsos.names ? "#999" : "#000");;
  col.append("input").attr("type", "number").attr("name", "dsos-namelimit").attr("id", "dsos-namelimit").property("value", cfg.dsos.namelimit).attr("max", "6").attr("min", "0").attr("step", "0.1").property("disabled", !cfg.dsos.show || !cfg.dsos.names);

  // Constellations 
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("class", "header").attr("for", "constellations-show").html("Constellations");
  col.append("input").attr("type", "checkbox").attr("name", "constellations-show").attr("id", "constellations-show").property("value", "true").property("checked", cfg.constellations.show);
  
  col.append("label").attr("for", "constellations-names").html("with names").style("color", cfg.constellations.show ? "#000" : "#999");
  col.append("input").attr("type", "checkbox").attr("name", "constellations-names").attr("id", "constellations-names").property("value", "true").property("checked", cfg.constellations.names).property("disabled", !cfg.constellations.show);
  
  col.append("label").attr("for", "constellations-desig").html("abbreviated").style("color", cfg.constellations.show ? "#000" : "#999");;
  col.append("input").attr("type", "checkbox").attr("name", "constellations-desig").attr("id", "constellations-desig").property("value", "true").property("checked", cfg.constellations.desig).property("disabled", !cfg.constellations.show || !cfg.constellations.names);
  
  col.append("label").attr("for", "constellations-lines").html("with lines").style("color", cfg.constellations.show ? "#000" : "#999");;
  col.append("input").attr("type", "checkbox").attr("name", "constellations-lines").attr("id", "constellations-lines").property("value", "true").property("checked", cfg.constellations.lines).property("disabled", !cfg.constellations.show);
  
  col.append("label").attr("for", "constellations-bounds").html("with boundaries").style("color", cfg.constellations.show ? "#000" : "#999");;
  col.append("input").attr("type", "checkbox").attr("name", "constellations-bounds").attr("id", "constellations-bounds").property("value", "true").property("checked", cfg.constellations.bounds).property("disabled", !cfg.constellations.show);

  // graticules & planes 
  var col = frm.append("div").attr("class", "col");
  col.append("label").attr("class", "header").html("Lines");
  
  col.append("label").attr("title", "X/Y grid lines").attr("for", "lines-graticule").html("Graticule");
  col.append("input").attr("type", "checkbox").attr("name", "lines-graticule").attr("id", "lines-graticule").property("value", "true").property("checked", cfg.lines.graticule);
  
  col.append("label").attr("for", "lines-equatorial").html("Equator");
  col.append("input").attr("type", "checkbox").attr("name", "lines-equatorial").attr("id", "lines-equatorial").property("value", "true").property("checked", cfg.lines.equatorial);
  
  col.append("label").attr("for", "lines-ecliptic").html("Ecliptic");
  col.append("input").attr("type", "checkbox").attr("name", "lines-ecliptic").attr("id", "lines-ecliptic").property("value", "true").property("checked", cfg.lines.ecliptic);
  
  col.append("label").attr("for", "lines-galactic").html("Galactic plane");
  col.append("input").attr("type", "checkbox").attr("name", "lines-galactic").attr("id", "lines-galactic").property("value", "true").property("checked", cfg.lines.galactic);
  
  col.append("label").attr("for", "lines-supergalactic").html("Supergalactic plane");
  col.append("input").attr("type", "checkbox").attr("name", "lines-supergalactic").attr("id", "lines-supergalactic").property("value", "true").property("checked", cfg.lines.supergalactic);

  // Other
  var col = frm.append("div").attr("class", "col");
  col.append("label").attr("class", "header").html("Other");
  
  col.append("label").attr("for", "mw-show").html("Milky Way");
  col.append("input").attr("type", "checkbox").attr("name", "mw-show").attr("id", "mw-show").property("value", "true").property("checked", cfg.mw.show);
  
  col.append("label").attr("for", "background").html("Background color");
  col.append("input").attr("type", "color").attr("name", "background").attr("id", "background").property("value", cfg.background);
  
  col.append("label").attr("title", "Star/DSO sizes are increased with higher zoom-levels").attr("for", "adaptable").html("Adaptable sizes");
  col.append("input").attr("type", "checkbox").attr("name", "adaptable").attr("id", "adaptable").property("value", "true").property("checked", cfg.adaptable);

}