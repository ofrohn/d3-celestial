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
  sel.selectAll("option").data(list).enter().append('option')
     .property("value", function (d) { return d.o; })
     .text(function (d) { return d.n; });
  sel.property("selectedIndex", selected);
  col.append("br");
  
  col.append("label").attr("title", "Center coordinates long/lat in selected coordinate space").attr("for", "centerx").html("Center");
  col.append("input").attr("type", "number").attr("name", "centerx").attr("id", "centerx").attr("title", "Center right ascension/lngitude").property("value", cfg.center[0]).attr("max", "24").attr("min", "0").attr("step", "0.1");
  col.append("span").attr("id", "cxunit").html("h");
  col.append("input").attr("type", "number").attr("name", "centery").attr("id", "centery").attr("title", "Center declination/latitude").property("value", cfg.center[1]).attr("max", "90").attr("min", "-90").attr("step", "0.1");
  col.append("span").html("\u00b0");

  // Stars 
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("class", "header").attr("for", "stars-show").html("Stars")
  col.append("input").attr("type", "checkbox").attr("name", "stars-show").attr("id", "stars-show").property("value", "true").property("checked", cfg.stars.show).on("change", enable);
  
  col.append("label").attr("for", "stars-limit").html("down to magnitude");
  col.append("input").attr("type", "number").attr("name", "stars-limit").attr("id", "stars-limit").attr("title", "Star display limit").property("value", cfg.stars.limit).attr("max", "6").attr("min", "-1").attr("step", "0.1");
  
  col.append("label").attr("for", "stars-colors").html("with spectral colors");
  col.append("input").attr("type", "checkbox").attr("name", "stars-colors").attr("id", "stars-colors").property("value", "true").property("checked", cfg.stars.colors);
  
  col.append("label").attr("for", "stars-color").html("or default color ");
  col.append("input").attr("type", "color").attr("name", "stars-color").attr("id", "stars-color").property("value", cfg.stars.color);
  col.append("br");
  
  col.append("label").attr("for", "stars-names").html("Show names");
  col.append("input").attr("type", "checkbox").attr("name", "stars-names").attr("id", "stars-names").property("value", "true").on("change", enable);
  
  col.append("label").attr("for", "stars-proper").html("proper names (if any)");
  col.append("input").attr("type", "checkbox").attr("name", "stars-proper").attr("id", "stars-proper").property("value", "true").property("checked", cfg.stars.proper);
  
  col.append("label").attr("for", "stars-desig").html("or designations");
  col.append("input").attr("type", "checkbox").attr("name", "stars-desig").attr("id", "stars-desig").property("value", "true").property("checked", cfg.stars.desig);
  
  col.append("label").attr("for", "stars-namelimit").html("down to mag");
  col.append("input").attr("type", "number").attr("name", "stars-namelimit").attr("id", "stars-namelimit").attr("title", "Star name display limit").property("value", cfg.stars.namelimit).attr("max", "6").attr("min", "-1").attr("step", "0.1");

  enable("stars-show");
  // DSOs 
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("class", "header").attr("title", "Deep Space Objects").attr("for", "dsos-show").html("DSOs");
  col.append("input").attr("type", "checkbox").attr("name", "dsos-show").attr("id", "dsos-show").property("value", "true").property("checked", cfg.dsos.show).on("change", enable);
  
  col.append("label").attr("for", "dsos-limit").html("down to mag");
  col.append("input").attr("type", "number").attr("name", "dsos-limit").attr("id", "dsos-limit").attr("title", "DSO display limit").property("value", cfg.dsos.limit).attr("max", "6").attr("min", "0").attr("step", "0.1");
  
  col.append("label").attr("for", "dsos-names").html("with names");
  col.append("input").attr("type", "checkbox").attr("name", "dsos-names").attr("id", "dsos-names").property("value", "true").property("checked", cfg.dsos.names).on("change", enable);
  
  col.append("label").attr("for", "dsos-desig").html("or designations");
  col.append("input").attr("type", "checkbox").attr("name", "dsos-desig").attr("id", "dsos-desig").property("value", "true").property("checked", cfg.dsos.desig);
  
  col.append("label").attr("for", "dsos-namelimit").html("down to mag");
  col.append("input").attr("type", "number").attr("name", "dsos-namelimit").attr("id", "dsos-namelimit").attr("title", "DSO name display limit").property("value", cfg.dsos.namelimit).attr("max", "6").attr("min", "0").attr("step", "0.1");

  enable("dsos-show");

  // Constellations 
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("class", "header").attr("for", "constellations-show").html("Constellations");
  col.append("input").attr("type", "checkbox").attr("name", "constellations-show").attr("id", "constellations-show").property("value", "true").property("checked", cfg.constellations.show).on("change", enable);
  
  col.append("label").attr("for", "constellations-names").html("with names");
  col.append("input").attr("type", "checkbox").attr("name", "constellations-names").attr("id", "constellations-names").property("value", "true").property("checked", cfg.constellations.names);
  
  col.append("label").attr("for", "constellations-desig").html("abbreviated");
  col.append("input").attr("type", "checkbox").attr("name", "constellations-desig").attr("id", "constellations-desig").property("value", "true").property("checked", cfg.constellations.desig);
  
  col.append("label").attr("for", "constellations-lines").html("with lines");
  col.append("input").attr("type", "checkbox").attr("name", "constellations-lines").attr("id", "constellations-lines").property("value", "true").property("checked", cfg.constellations.lines);
  
  col.append("label").attr("for", "constellations-bounds").html("with boundaries");
  col.append("input").attr("type", "checkbox").attr("name", "constellations-bounds").attr("id", "constellations-bounds").property("value", "true").property("checked", cfg.constellations.bounds);

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

var depends = {
  "stars-show": ["stars-limit", "stars-colors", "stars-color", "stars-names"],
  "stars-names": ["stars-proper", "stars-desig", "stars-namelimit"],
  "dsos-show": ["dsos-limit", "dsos-names"],
  "dsos-names": ["dsos-desig", "dsos-namelimit"],
  "constellations-show": ["constellations-names", "constellations-desig", "constellations-lines", "constellations-bounds"]
}, numeric = ["centerx", "centery", "stars-limit": "Star display limit", "stars-namelimit", "dsos-limit", "dsos-namelimit"];

function enable(source) {
  var fld = source ? source : this.id, off;
  
  switch (fld) {
    case "stars-show": 
      off = !$(fld).checked;
      for (var i=0; i< depends[fld].length; i++) { fldEnable(depends[fld][i], off) };
    case "stars-names": 
      off = !$("stars-names").checked || !$("stars-show").checked;      
      for (var i=0; i< depends["stars-names"].length; i++) { fldEnable(depends["stars-names"][i], off) };
      break;
    case "dsos-show": 
      off = !$(fld).checked;
      for (var i=0; i< depends[fld].length; i++) { fldEnable(depends[fld][i], off) };
    case "dsos-names": 
      off = !$("dsos-names").checked || !$("dsos-show").checked;      
      for (var i=0; i< depends["dsos-names"].length; i++) { fldEnable(depends["dsos-names"][i], off) };
      break;
    case "constellations-show": 
      off = !$(fld).checked;
      for (var i=0; i< depends[fld].length; i++) { fldEnable(depends[fld][i], off) };
      break;
  }  
}

function fldEnable(d, off) {
  var node = $(d);
  node.disabled = off;
  node.previousSibling.style.color = off ? "#999" : "#000";
  
}

function test(e) {
  var err = [], key, t;
  
  //Test params
  if (!isNumber(cfg.width)) err.push("Check Width setting");
  for (var i = 0; i < numeric.lemgth; i++) {
    t = testNumber($(numeric[i]));
    if (t !== 0) err.push(t);
  }

  if ($("centerx").value === "" && $("centery").value !== "" || $("centery").value === "" && $("centerx").value !== "") {
    err.push("Both center coordinates need to be given");
  }

  if (err.length > 0) {
    $("error").innerHTML = err.join("<br>");
    $("error").style.display = "block";
  } else {
    $("error").style.display = "none";
    cfg = parseForm(cfg);
    Celestial.display(cfg);
  }
  return false;
}

function testNumber(p) {
  var v = p.value;
  if (v === "") return 0;
  if (!isNumber(v)) return p.title + ": check field value";
  v = parseFloat(v);
  if (v < p.min || v > p.max ) return p.title + " must be between " + p.min + " and " + p.max;
  return 0;
}

function getLimits() {
  var t, rx = /\d+(\.\d+)?/g,
      s, d, res = {s:6, d:6},
      cfg =  Celestial.settings();
  if (typeof dsodata !== 'undefined') d = dsodata;
  else d = cfg.dsos.data;
  
  //test dso limit
  t = d.match(rx);
  if (t !== null) {
    res.d = parseFloat(t[t.length-1]);
  }
   

  if (typeof stardata !== 'undefined') s = stardata;
  else s = cfg.stars.data;
  
  //test star limit
  t = s.match(rx);
  if (t !== null) {
    res.s = parseFloat(t[t.length-1]);
  }
  return res;
}
