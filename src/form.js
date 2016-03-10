//display settings form

//test with onchange and set cfg
function form(cfg) {
  var prj = Celestial.projections(), leo = Celestial.eulerAngles();
  var ctrl = d3.select("#form").append("div").attr("class", "ctrl");
  var frm = ctrl.append("form").attr("id", "params").attr("name", "params").attr("method", "get").attr("action" ,"#");
  
  //Map parameters    
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("title", "Map width, 0 indicates full width").attr("for", "width").html("Width")
  col.append("input").attr("type", "number").attr("maxlength", "4").attr("max", "9999").attr("min", "0").attr("title", "Map width").attr("id", "width").attr("value", cfg.width).on("change", function() { if (testNumber(this)) cfg.width = this.value; });
  col.append("span").html("px");

  col.append("label").attr("title", "Map projection, (hemi) indicates hemispherical projection").attr("for", "projection").html("Projection");
  var sel = col.append("select").attr("id", "projection").on("change", function() { cfg.projection = this.options[this.selectedIndex].value });
  var selected = 0;
  var list = Object.keys(prj).map( function (key, i) { 
    var n = prj[key].clip && prj[key].clip === true ? prj[key].n + " (hemi)" : prj[key].n; 
    if (key === cfg.projection) selected = i;
    return {o:key, n:n} 
  });
  sel.selectAll('option').data(list).enter().append('option')
     .attr("value", function (d) { return d.o; })
     .text(function (d) { return d.n; });
  sel.property("selectedIndex", selected);
  
  selected = 0;
  col.append("label").attr("title", "Coordinate space in which the map is displayed").attr("for", "transform").html("Coordinates");
  var sel = col.append("select").attr("id", "transform").on("change", function() { 
    cfg.transform = this.options[this.selectedIndex].value 
    setUnit(cfg.transform);    
 });
  var list = Object.keys(leo).map(function (key, i) {
    if (key === cfg.transform) selected = i;    
    return {o:key, n:key.replace(/^([a-z])/, function(s, m) { return m.toUpperCase(); } )} 
  });
  sel.selectAll("option").data(list).enter().append('option')
     .attr("value", function (d) { return d.o; })
     .text(function (d) { return d.n; });
  sel.property("selectedIndex", selected);
  col.append("br");
  
  col.append("label").attr("title", "Center coordinates long/lat in selected coordinate space").attr("for", "centerx").html("Center");
  col.append("input").attr("type", "number").attr("id", "centerx").attr("title", "Center right ascension/lngitude").attr("value", function() { 
    var cx = cfg.center[0]; 
    if (cfg.transform !== "equatorial") return cx; 
    return cx < 0 ? cx / 15 + 24 : cx / 15; 
  })
  .attr("max", "24").attr("min", "0").attr("step", "0.1").on("change", function() {
    var cx = this.value; 
    if (testNumber(this)) { 
      if (cfg.transform !== "equatorial") cfg.center[0] = cx; 
      else { 
        cfg.center[0] = cx > 12 ? cx * 15 - 360 : cx * 15; 
      } 
    }
  });
  col.append("span").attr("id", "cxunit").html("h");
  
  col.append("input").attr("type", "number").attr("id", "centery").attr("title", "Center declination/latitude").attr("value", cfg.center[1]).attr("max", "90").attr("min", "-90").attr("step", "0.1").on("change", function() { if (testNumber(this)) cfg.center[1] = this.value; });
  col.append("span").html("\u00b0");

  // Stars 
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("class", "header").attr("for", "stars-show").html("Stars")
  col.append("input").attr("type", "checkbox").attr("id", "stars-show").property("checked", cfg.stars.show).on("change", function() { cfg.stars.show = this.checked; enable(this); });
  
  col.append("label").attr("for", "stars-limit").html("down to magnitude");
  col.append("input").attr("type", "number").attr("id", "stars-limit").attr("title", "Star display limit").attr("value", cfg.stars.limit).attr("max", "6").attr("min", "-1").attr("step", "0.1").on("change", function() { if (testNumber(this)) cfg.stars.limit = this.value; });
  
  col.append("label").attr("for", "stars-colors").html("with spectral colors");
  col.append("input").attr("type", "checkbox").attr("id", "stars-colors").property("checked", cfg.stars.colors).on("change", function() { cfg.stars.colors = this.checked; });
  
  col.append("label").attr("for", "stars-color").html("or default color ");
  col.append("input").attr("type", "color").attr("id", "stars-color").property("value", cfg.stars.color).on("change", function() { cfg.stars.color = this.value; });
  col.append("br");
  
  col.append("label").attr("for", "stars-names").html("Show names");
  col.append("input").attr("type", "checkbox").attr("id", "stars-names").on("change", function() { cfg.stars.names = this.checked; enable(this); });
  
  col.append("label").attr("for", "stars-proper").html("proper names (if any)");
  col.append("input").attr("type", "checkbox").attr("id", "stars-proper").property("checked", cfg.stars.proper).on("change", function() { cfg.stars.proper = this.checked; });
  
  col.append("label").attr("for", "stars-desig").html("or designations");
  col.append("input").attr("type", "checkbox").attr("id", "stars-desig").property("checked", cfg.stars.desig).on("change", function() { cfg.stars.desig = this.checked; });
  
  col.append("label").attr("for", "stars-namelimit").html("down to mag");
  col.append("input").attr("type", "number").attr("id", "stars-namelimit").attr("title", "Star name display limit").attr("value", cfg.stars.namelimit).attr("max", "6").attr("min", "-1").attr("step", "0.1").on("change", function() { if (testNumber(this)) cfg.stars.namelimit = this.value; });;

  enable($("stars-show"));
  // DSOs 
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("class", "header").attr("title", "Deep Space Objects").attr("for", "dsos-show").html("DSOs");
  col.append("input").attr("type", "checkbox").attr("id", "dsos-show").property("checked", cfg.dsos.show).on("change", function() { cfg.dsos.show = this.checked; enable(this); });
  
  col.append("label").attr("for", "dsos-limit").html("down to mag");
  col.append("input").attr("type", "number").attr("id", "dsos-limit").attr("title", "DSO display limit").attr("value", cfg.dsos.limit).attr("max", "6").attr("min", "0").attr("step", "0.1").on("change", function() { if (testNumber(this)) cfg.dsos.limit = this.value; });
  
  col.append("label").attr("for", "dsos-names").html("with names");
  col.append("input").attr("type", "checkbox").attr("id", "dsos-names").property("checked", cfg.dsos.names).on("change", function() { cfg.dsos.names = this.checked; enable(this); });
  
  col.append("label").attr("for", "dsos-desig").html("or designations");
  col.append("input").attr("type", "checkbox").attr("id", "dsos-desig").property("checked", cfg.dsos.desig).on("change", function() { cfg.dsos.desig = this.checked; });
  
  col.append("label").attr("for", "dsos-namelimit").html("down to mag");
  col.append("input").attr("type", "number").attr("id", "dsos-namelimit").attr("title", "DSO name display limit").attr("value", cfg.dsos.namelimit).attr("max", "6").attr("min", "0").attr("step", "0.1").on("change", function() { if (testNumber(this)) cfg.dsos.namelimit = this.value; });

  enable($("dsos-show"));

  // Constellations 
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("class", "header").attr("for", "constellations-show").html("Constellations");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-show").property("checked", cfg.constellations.show).on("change", function() { cfg.constellations.show = this.checked; enable(this); });
  
  col.append("label").attr("for", "constellations-names").html("with names");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-names").property("checked", cfg.constellations.names).on("change", function() { cfg.constellations.names = this.checked; });
  
  col.append("label").attr("for", "constellations-desig").html("abbreviated");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-desig").property("checked", cfg.constellations.desig).on("change", function() { cfg.constellations.desig = this.checked; });
  
  col.append("label").attr("for", "constellations-lines").html("with lines");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-lines").property("checked", cfg.constellations.lines).on("change", function() { cfg.constellations.lines = this.checked; });
  
  col.append("label").attr("for", "constellations-bounds").html("with boundaries");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-bounds").property("checked", cfg.constellations.bounds).on("change", function() { cfg.constellations.bounds = this.checked; });

  enable($("constellations-show"));

  // graticules & planes 
  var col = frm.append("div").attr("class", "col");
  col.append("label").attr("class", "header").html("Lines");
  
  col.append("label").attr("title", "X/Y grid lines").attr("for", "lines-graticule").html("Graticule");
  col.append("input").attr("type", "checkbox").attr("id", "lines-graticule").property("checked", cfg.lines.graticule).on("change", function() { cfg.lines.graticule = this.checked; });
  
  col.append("label").attr("for", "lines-equatorial").html("Equator");
  col.append("input").attr("type", "checkbox").attr("id", "lines-equatorial").property("checked", cfg.lines.equatorial).on("change", function() { cfg.lines.equatorial = this.checked; });
  
  col.append("label").attr("for", "lines-ecliptic").html("Ecliptic");
  col.append("input").attr("type", "checkbox").attr("id", "lines-ecliptic").property("checked", cfg.lines.ecliptic).on("change", function() { cfg.lines.ecliptic = this.checked; });
  
  col.append("label").attr("for", "lines-galactic").html("Galactic plane");
  col.append("input").attr("type", "checkbox").attr("id", "lines-galactic").property("checked", cfg.lines.galactic).on("change", function() { cfg.lines.galactic = this.checked; });
  
  col.append("label").attr("for", "lines-supergalactic").html("Supergalactic plane");
  col.append("input").attr("type", "checkbox").attr("id", "lines-supergalactic").property("checked", cfg.lines.supergalactic).on("change", function() { cfg.lines.supergalactic = this.checked; });

  // Other
  var col = frm.append("div").attr("class", "col");
  col.append("label").attr("class", "header").html("Other");
  
  col.append("label").attr("for", "mw-show").html("Milky Way");
  col.append("input").attr("type", "checkbox").attr("id", "mw-show").property("checked", cfg.mw.show).on("change", function() { mw.show = this.checked; });
  
  col.append("label").attr("for", "background").html("Background color");
  col.append("input").attr("type", "color").attr("id", "background").attr("value", cfg.background.fill).on("change", function() { cfg.background.fill = this.value; });
  
  col.append("label").attr("title", "Star/DSO sizes are increased with higher zoom-levels").attr("for", "adaptable").html("Adaptable sizes");
  col.append("input").attr("type", "checkbox").attr("id", "adaptable").property("checked", cfg.adaptable).on("change", function() { cfg.adaptable = this.value; });
  
  col.append("input").attr("type", "button").attr("id", "show").attr("value", "Show");
  //col.append("input").attr("type", "button").attr("id", "defaults").attr("value", "Defaults");

  ctrl.append("div").attr("id", "error");
  
  $("show").onclick = function(e) {
    var x = $("centerx"),
        y = $("centery");
    //Test params
    if (!isNumber(cfg.width)) { popError($("width"), "Check Width setting"); return false; }

    if (x.value === "" && y.value !== "" || y.value === "" && x.value !== "") {
      popError(x, "Both center coordinates need to be given");
      return false; 
    } 
  
    Celestial.display(cfg);

    return false;
  }

  setLimits();
  setUnit(cfg.transform);
  /* descoped
  $("defaults").onclick = function(e) {
    cfg = Celestial.settings().set({width:0, projection:"aitoff"});
    //fillForm(cfg);
    return false;
  }*/
}

// Dependend fields relations
var depends = {
  "stars-show": ["stars-limit", "stars-colors", "stars-color", "stars-names"],
  "stars-names": ["stars-proper", "stars-desig", "stars-namelimit"],
  "dsos-show": ["dsos-limit", "dsos-names"],
  "dsos-names": ["dsos-desig", "dsos-namelimit"],
  "constellations-show": ["constellations-names", "constellations-desig", "constellations-lines", "constellations-bounds"]
};

// De/activate fields depending on selection of dependencies
function enable(source) {
  var fld = source.id, off;
  
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

// Enable/disable field d to status off
function fldEnable(d, off) {
  var node = $(d);
  node.disabled = off;
  node.previousSibling.style.color = off ? "#999" : "#000";  
}

// Error notification
function popError(nd, err) {
  //var p = nd.getBoundingClientRect();
  d3.select("#error").html(err).style( {top:px(nd.offsetTop+nd.offsetHeight+1), left:px(nd.offsetLeft), opacity:1} );
}

//Check nmueric field
function testNumber(nd) {
  var v = nd.value;
  //if (v === "") return true;
  if (!isNumber(v)) { popError(nd, nd.title + ": check field value"); return false; }
  v = parseFloat(v);
  if (v < nd.min || v > nd.max ) { popError(nd, nd.title + " must be between " + nd.min + " and " + nd.max); return false; }
  d3.select("#error").style( {top:"-9999px", left:"-9999px", opacity:0} );
  return true;
}

function setUnit(trans) {
  var cx = $("centerx");
  if (trans === 'equatorial') {
    cx.min = "0";
    cx.max = "24";
    $("cxunit").innerHTML = "h";
  } else {
    cx.min = "-180";
    cx.max = "180";
    $("cxunit").innerHTML = "\u00b0";
  }
}

// Set max input limits depending on data
function setLimits() {
  var t, rx = /\d+(\.\d+)?/g,
      s, d, res = {s:6, d:6},
      cfg =  Celestial.settings();

  d = cfg.dsos.data;
  
  //test dso limit
  t = d.match(rx);
  if (t !== null) {
    res.d = parseFloat(t[t.length-1]);
  }

  if (res.d != 6) {
    $("dsos-limit").max = res.d;
    $("dsos-namelimit").max = res.d;
  };
   
   s = cfg.stars.data;
  
  //test star limit
  t = s.match(rx);
  if (t !== null) {
    res.s = parseFloat(t[t.length-1]);
  }

  if (res.s != 6) {
    $("stars-limit").max = res.s;
    $("stars-namelimit").max = res.s;
  };

  return res;
}
