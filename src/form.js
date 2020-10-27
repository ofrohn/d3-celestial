/* global Celestial, settings, globalConfig, formats, formats_all, $, px, has, isNumber, isObject, isArray, findPos, transformDeg, euler, exportSVG, parentElement */

//display settings form in div with id "celestial-form"
function form(cfg) {
  var config = settings.set(cfg); 

  var prj = Celestial.projections(), leo = Celestial.eulerAngles();
  var div = d3.select(parentElement + " ~ #celestial-form");
  //if div doesn't exist, create it
  if (div.size() < 1) {
    //var container = (config.container || "celestial-map");
    div = d3.select(parentElement).select(function() { return this.parentNode; }).append("div").attr("id", "celestial-form");
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

  col.append("label").attr("for", "orientationfixed").attr("class", "advanced").html("Fixed");
  col.append("input").attr("type", "checkbox").attr("id", "orientationfixed").attr("class", "advanced").property("checked", config.orientationfixed).on("change", apply);    

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
  
  var names = formats.starnames[config.culture] || formats.starnames.iau;
  
  for (var fld in names) {
    if (!has(names, fld)) continue;
    var keys = Object.keys(names[fld]);
    if (keys.length > 1) {
      //Select List
      col.append("label").attr("for", "stars-" + fld).html("Show");
      
      selected = 0;
      col.append("label").attr("title", "Type of star name").attr("id", "label-propername").attr("for", "stars-" + fld + "Type").html(function () { return fld === "propername" ? "proper names" : ""; });
      sel = col.append("select").attr("id", "stars-" + fld + "Type").attr("class", function () { return fld === "propername" ? "advanced" : ""; }).on("change", apply);
      list = keys.map(function (key, i) {
        if (key === config.stars[fld + "Type"]) selected = i;
        return {o:key, n:names[fld][key]}; 
      });
      sel.selectAll("option").data(list).enter().append('option')
         .attr("value", function (d) { return d.o; })
         .text(function (d) { return d.n; });
      sel.property("selectedIndex", selected);

      col.append("input").attr("type", "checkbox").attr("id", "stars-" + fld).property("checked", config.stars[fld]).on("change", apply);
    } else if (keys.length === 1) {
      //Simple field
    col.append("label").attr("for", "stars-" + fld).html(" " + names[fld][keys[0]]);
      col.append("input").attr("type", "checkbox").attr("id", "stars-" + fld).property("checked", config.stars[fld]).on("change", apply);
    }    
    col.append("label").attr("for", "stars-" + fld + "Limit").html("down to mag");
    col.append("input").attr("type", "number").attr("id", "stars-" + fld + "Limit").attr("title", "Star name display limit (magnitude)").attr("value", config.stars[fld + "Limit"]).attr("max", "6").attr("min", "-1").attr("step", "0.1").on("change", apply);
  
  }

  col.append("br");

  col.append("label").attr("for", "stars-size").attr("class", "advanced").html("Stellar disk size: base");
  col.append("input").attr("type", "number").attr("id", "stars-size").attr("class", "advanced").attr("title", "Size of the displayed star disk; base").attr("value", config.stars.size).attr("max", "100").attr("min", "0").attr("step", "0.1").on("change", apply);

  col.append("label").attr("for", "stars-exponent").attr("class", "advanced").html(" * e ^ (exponent");
  col.append("input").attr("type", "number").attr("id", "stars-exponent").attr("class", "advanced").attr("title", "Size of the displayed star disk; exponent").attr("value", config.stars.exponent).attr("max", "3").attr("min", "-1").attr("step", "0.01").on("change", apply);
  col.append("span").attr("class", "advanced").text(" * (magnitude + 2))  [* adaptation]");
  
  enable($form("stars-show"));
  
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
  
  names = formats.dsonames[config.culture] || formats.dsonames.iau;
  
  for (fld in names) {
    if (!has(names, fld)) continue;
    var dsoKeys = Object.keys(names[fld]);
    col.append("label").attr("for", "dsos-" + fld).html("Show");
      
    selected = 0;
    col.append("label").attr("title", "Type of DSO name").attr("for", "dsos-" + fld + "Type").attr("class", "advanced").html("");
    sel = col.append("select").attr("id", "dsos-" + fld + "Type").attr("class", "advanced").on("change", apply);
    list = dsoKeys.map(function (key, i) {
      if (key === config.stars[fld + "Type"]) selected = i;    
      return {o:key, n:names[fld][key]}; 
    });
    sel.selectAll("option").data(list).enter().append('option')
       .attr("value", function (d) { return d.o; })
       .text(function (d) { return d.n; });
    sel.property("selectedIndex", selected);

    col.append("label").attr("for", "dsos-" + fld).html("names");
    col.append("input").attr("type", "checkbox").attr("id", "dsos-" + fld).property("checked", config.dsos[fld]).on("change", apply);
  }    
    
  col.append("label").attr("for", "dsos-nameLimit").html("down to mag");
  col.append("input").attr("type", "number").attr("id", "dsos-nameLimit").attr("title", "DSO name display limit (magnitude)").attr("value", config.dsos.nameLimit).attr("max", "6").attr("min", "0").attr("step", "0.1").on("change", apply);
  col.append("br");

  col.append("label").attr("for", "dsos-size").attr("class", "advanced").html("DSO symbol size: (base");
  col.append("input").attr("type", "number").attr("id", "dsos-size").attr("class", "advanced").attr("title", "Size of the displayed symbol: base").attr("value", config.dsos.size).attr("max", "100").attr("min", "0").attr("step", "0.1").on("change", apply);

  col.append("label").attr("for", "dsos-exponent").attr("class", "advanced").html(" * 2 [* adaptation] - magnitude) ^ exponent");
  col.append("input").attr("type", "number").attr("id", "dsos-exponent").attr("class", "advanced").attr("title", "Size of the displayed symbol; exponent").attr("value", config.dsos.exponent).attr("max", "3").attr("min", "-1").attr("step", "0.01").on("change", apply);

  enable($form("dsos-show"));

  // Constellations 
  col = frm.append("div").attr("class", "col").attr("id", "constellations");
  col.append("label").attr("class", "header").html("Constellations");
  //col.append("input").attr("type", "checkbox").attr("id", "constellations-show").property("checked", config.constellations.show).on("change", apply);
  
  
  names = formats.constellations[config.culture] || formats.constellations.iau;
  
  for (fld in names) {
    if (!has(names, fld)) continue;
    var nameKeys = Object.keys(names[fld]);
    if (nameKeys.length > 1) {
      //Select List
      col.append("label").attr("for", "constellations-" + fld).html("Show");
      
      selected = 0;
      col.append("label").attr("title", "Language of constellation names").attr("for", "constellations-" + fld + "Type").attr("class", "advanced").html("");
      sel = col.append("select").attr("id", "constellations-" + fld + "Type").attr("class", "advanced").on("change", apply);
      list = nameKeys.map(function (key, i) {
        if (key === config.constellations[fld + "Type"]) selected = i;    
        return {o:key, n:names[fld][key]}; 
      });
      sel.selectAll("option").data(list).enter().append('option')
         .attr("value", function (d) { return d.o; })
         .text(function (d) { return d.n; });
      sel.property("selectedIndex", selected);

      col.append("label").attr("for", "constellations-" + fld).html("names");
      col.append("input").attr("type", "checkbox").attr("id", "constellations-" + fld).property("checked", config.constellations[fld]).on("change", apply);
    } else if (nameKeys.length === 1) {
      //Simple field
      col.append("label").attr("for", "constellations-" + fld).attr("class", "advanced").html(" " + names[fld][nameKeys[0]]);
      col.append("input").attr("type", "checkbox").attr("id", "constellations-" + fld).attr("class", "advanced").property("checked", config.constellations[fld]).on("change", apply);      
    }      
  }
  col.append("label").attr("for", "constellations-lines").html(" lines");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-lines").property("checked", config.constellations.lines).on("change", apply);
  
  col.append("label").attr("for", "constellations-bounds").html(" boundaries");
  col.append("input").attr("type", "checkbox").attr("id", "constellations-bounds").property("checked", config.constellations.bounds).on("change", apply);

  enable($form("constellations-names"));

  // graticules & planes 
  col = frm.append("div").attr("class", "col").attr("id", "lines");
  col.append("label").attr("class", "header").html("Lines");
  
  col.append("label").attr("title", "Latitude/longitude grid lines").attr("for", "lines-graticule").html("Graticule");
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
  
  col.append("label").attr("for", "mw-style-fill").attr("class", "advanced").html(" color");
  col.append("input").attr("type", "color").attr("id", "mw-style-fill").attr("class", "advanced").attr("title", "Milky Way color").attr("value", config.mw.style.fill).on("change", apply);

  col.append("label").attr("for", "mw-style-opacity").attr("class", "advanced").html(" opacity");
  col.append("input").attr("type", "number").attr("id", "mw-style-opacity").attr("class", "advanced").attr("title", "Transparency of each Milky Way layer").attr("value", config.mw.style.opacity).attr("max", "1").attr("min", "0").attr("step", "0.01").on("change", apply);
  
  col.append("label").attr("for", "advanced").html("Advanced options");
  col.append("input").attr("type", "checkbox").attr("id", "advanced").property("checked", config.advanced).on("change", apply);
  
  col.append("br");
  
  col.append("label").attr("for", "background-fill").html("Background color");
  col.append("input").attr("type", "color").attr("id", "background-fill").attr("title", "Background color").attr("value", config.background.fill).on("change", apply);

  col.append("label").attr("for", "background-opacity").attr("class", "advanced").html("opacity");
  col.append("input").attr("type", "number").attr("id", "background-opacity").attr("class", "advanced").attr("title", "Background opacity").attr("value", config.background.opacity).attr("max", "1").attr("min", "0").attr("step", "0.01").on("change", apply);
  
  col.append("label").attr("title", "Star/DSO sizes are increased with higher zoom-levels").attr("for", "adaptable").attr("class", "advanced").html("Adaptable object sizes");
  col.append("input").attr("type", "checkbox").attr("id", "adaptable").attr("class", "advanced").property("checked", config.adaptable).on("change", apply);
  
  // General language setting
  var langKeys = formats_all[config.culture];

  selected = 0;
  col.append("label").attr("title", "General language setting").attr("for", "lang").html("Object names ");
  sel = col.append("select").attr("id", "lang").on("change", apply);
  list = langKeys.map(function (key, i) {
    if (key === config.lang) selected = i;    
    return {o:key, n:formats.constellations[config.culture].names[key]}; 
  });
  list = [{o:"---", n:"(Select language)"}].concat(list);
  sel.selectAll("option").data(list).enter().append('option')
     .attr("value", function (d) { return d.o; })
     .text(function (d) { return d.n; });
  sel.property("selectedIndex", selected);
   
  col = frm.append("div").attr("class", "col").attr("id", "download");
  col.append("label").attr("class", "header").html("Download");

  col.append("input").attr("type", "button").attr("id", "download-png").attr("value", "PNG Image").on("click", function() {
    var a = d3.select("body").append("a").node(), 
        canvas = document.querySelector(parentElement + ' canvas');
    a.download = getFilename(".png");
    a.rel = "noopener";
    a.href = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    a.click();
    d3.select(a).remove();
  });

  col.append("input").attr("type", "button").attr("id", "download-svg").attr("value", "SVG File").on("click", function() {
    exportSVG(getFilename(".svg")); 
    return false;
  });

  setLimits();
  setUnit(config.transform);
  setVisibility(cfg);
  showAdvanced(config.advanced);
  
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
    settings.set(config);
    Celestial.reload(config);
  }  
  
  function reproject() {
    var src = this;
    if (!src) return;
    config.projection = src.value; 
    settings.set(config);
    Celestial.reproject(config);
  }
  
  function turn() {
    if (testNumber(this) === false) return;   
    if (getCenter() === false) return;
    Celestial.rotate(config);
  }

  function getCenter() {
    var cx = $form("centerx"), cy = $form("centery"), cz = $form("centerz"),
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
    
  function getFilename(ext) {
    var dateFormat = d3.time.format("%Y%m%dT%H%M%S%Z"),
        filename = "d3-celestial",
        dt = Celestial.date();
    if (dt) filename += dateFormat(dt);
    return filename + ext;
  }
    
  function showConstellation() {
    var id = this.value;
    if (!id) return;
    showCon(id);
  }

  function showCon(id) {
    var z, anims = [],
        config = globalConfig;
    if (id === "---") { 
      Celestial.constellation = null;
      z = Celestial.zoomBy();
      if (z !== 1) {
        anims.push({param:"zoom", value:1/z, duration:0});
      }
      Celestial.animate(anims, false);    
      //Celestial.redraw();
      return;
    }
    if (!isObject(Celestial.constellations) || !has(Celestial.constellations, id)) return;
    
    var con = Celestial.constellations[id];
    //transform according to settings
    var center = transformDeg(con.center, euler[config.transform]);
    config.center = center;
    setCenter(config.center, config.transform);
    //config.lines.graticule.lat.pos = [Round(con.center[0])];
    //config.lines.graticule.lon.pos = [Round(con.center[1])];
    //Celestial.apply(config);

    //if zoomed, zoom out
    z = Celestial.zoomBy();
    if (z !== 1) anims.push({param:"zoom", value:1/z, duration:0});
    //rotate
    anims.push({param:"center", value:center, duration:0});
    //and zoom in
    var sc = 1 + (360/con.scale); // > 10 ? 10 : con.scale;
    anims.push({param:"zoom", value:sc, duration:0});
    Celestial.constellation = id;
    //Object.assign(globalConfig, config);   
    Celestial.animate(anims, false);    
  }
  
  function apply() {
    var value, src = this;
    //Get current configuration
    Object.assign(config, settings.set());

    switch (src.type) {
      case "checkbox": value = src.checked; enable(src); break;
      case "number": if (testNumber(src) === false) return; 
                     value = parseFloat(src.value); break;
      case "color": if (testColor(src) === false) return; 
                    value = src.value; break;
      case "text": if (src.id.search(/fill$/) === -1) return;
                   if (testColor(src) === false) return; 
                   value = src.value; break;
      case "select-one": value = src.value; break;
    }
    if (value === null) return;
    set(src.id, value);
    if (src.id === "dsos-style-fill") {
      set("dsos-style-stroke", value);
      set("dsos-nameStyle-fill", value);
    } else if (src.id === "constellations-namesType") {
      listConstellations();
    } else if (src.id === "lang") {
      setLanguage(value);
    } else if (src.id === "advanced") {
      showAdvanced(value);
    }

    getCenter();
    Object.assign(globalConfig, config);
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
  
  
  function setLanguage(lang) {
    Object.assign(config, globalConfig);
    config.lang = lang;
    var keys = ["constellations", "planets"]; 
    for (var i=0; i < keys.length; i++) {
      if (has(formats[keys[i]][config.culture].names, lang)) config[keys[i]].namesType = lang;
      else if (has(formats[keys[i]][config.culture].names, "desig")) config[keys[i]].namesType = "desig";
      else config[keys[i]].namesType = "name";
    }
    if (has(formats.dsonames[config.culture].names, lang)) config.dsos.namesType = lang;
    else config.dsos.namesType = "desig";
    if (has(formats.starnames[config.culture].propername, lang)) config.stars.propernameType = lang;
    else config.stars.propernameType = "desig";
    //update cont. list
    Object.assign(globalConfig, config);
    update();
    listConstellations();
    return config;
  }
  
    
  function update() {
    // Update all form fields
    d3.selectAll(parentElement + " ~ #celestial-form input, " + parentElement + " ~  #celestial-form select").each( function(d, i) {
      if (this === undefined) return;
      var id = this.id;

      // geopos -> lat, lon
      if (id === "lat" || id === "lon") {
        if (isArray(config.geopos)) this.value = id === "lat" ? config.geopos[0] : config.geopos[1];
      // center -> centerx, centery     
      } else if (id.search(/center/) !== -1) {
        if (isArray(config.center)) {
          switch (id) { 
            case "centerx": this.value = config.center[0]; break;
            case "centery": this.value = config.center[1]; break;
            case "centerz": this.value = config.center[2] || 0; break;
          }
        }
      } else if (id === "datetime" || id === "hr" || id === "min" || id === "sec" || id === "tz") {
        return;//skip, timezone?
      } else if (this.type !== "button") {
        var value = get(id);      
        switch (this.type) {
          case "checkbox": this.checked = value; enable(id); break;
          case "number": if (testNumber(this) === false) break;
                         this.value = parseFloat(get(id)); break;
          case "color": if (testColor(this) === false) break; 
                        this.value = value; break;
          case "text": if (id.search(/fill$/) === -1) break;
                       if (testColor(this) === false) break; 
                       this.value = value; break;
          case "select-one": this.value = value; break;
        }
      }
    });
  }

  function get(id) {
    var a = id.split("-");
    switch (a.length) {
      case 1: return config[a[0]]; 
      case 2: return config[a[0]][a[1]];
      case 3: return config[a[0]][a[1]][a[2]];
      default: return;
    }   
  }
    
  Celestial.updateForm  = update;
  Celestial.showConstellation = showCon;
  Celestial.setLanguage = function(lang) {
    var cfg = settings.set();
    if (formats_all[config.culture].indexOf(lang) !== -1) cfg = setLanguage(lang);
    return cfg;    
  };
}


// Dependend fields relations
var depends = {
  "stars-show": ["stars-limit", "stars-colors", "stars-style-fill", "stars-designation", "stars-propername", "stars-size", "stars-exponent"],
  "stars-designation": ["stars-designationType", "stars-designationLimit"],
  "stars-propername": ["stars-propernameLimit", "stars-propernameType"],
  "dsos-show": ["dsos-limit", "dsos-colors", "dsos-style-fill", "dsos-names", "dsos-size", "dsos-exponent"],
  "dsos-names": ["dsos-namesType", "dsos-nameLimit"],
  "mw-show": ["mw-style-opacity", "mw-style-fill"],
  "constellations-names": ["constellations-namesType"],
  "planets-show": ["planets-symbolType", "planets-names"],
  "planets-names": ["planets-namesType"]
};

// De/activate fields depending on selection of dependencies
function enable(source) {
  var fld = source.id, off;
  
  switch (fld) {
    case "stars-show": 
      off = !$form(fld).checked;
      for (var i=0; i< depends[fld].length; i++) { fldEnable(depends[fld][i], off); }
      /* falls through */
    case "stars-designation": 
      off = !$form("stars-designation").checked || !$form("stars-show").checked;
      for (i=0; i< depends["stars-designation"].length; i++) { fldEnable(depends["stars-designation"][i], off); }
      /* falls through */
    case "stars-propername": 
      off = !$form("stars-propername").checked || !$form("stars-show").checked;
      for (i=0; i< depends["stars-propername"].length; i++) { fldEnable(depends["stars-propername"][i], off); }
      break;
    case "dsos-show": 
      off = !$form(fld).checked;
      for (i=0; i< depends[fld].length; i++) { fldEnable(depends[fld][i], off); }
      /* falls through */
    case "dsos-names": 
      off = !$form("dsos-names").checked || !$form("dsos-show").checked;      
      for (i=0; i< depends["dsos-names"].length; i++) { fldEnable(depends["dsos-names"][i], off); }
      break;
    case "planets-show": 
      off = !$form(fld).checked;
      for (i=0; i< depends[fld].length; i++) { fldEnable(depends[fld][i], off); }
      /* falls through */
    case "planets-names": 
      off = !$form("planets-names").checked || !$form("planets-show").checked;      
      for (i=0; i< depends["planets-names"].length; i++) { fldEnable(depends["planets-names"][i], off); }
      break;
    case "constellations-names": 
    case "mw-show": 
      off = !$form(fld).checked;
      for (i=0; i< depends[fld].length; i++) { fldEnable(depends[fld][i], off); }
      break;
  }  
}

// Enable/disable field d to status off
function fldEnable(d, off) {
  var node = $form(d);
  if (!node) return;
  node.disabled = off;
  node.style.color = off ? "#999" : "#000";  
  node.previousSibling.style.color = off ? "#999" : "#000";  
  //if (node.previousSibling.previousSibling && node.previousSibling.previousSibling.tagName === "LABEL")
  //  node.previousSibling.previousSibling.style.color = off ? "#999" : "#000";  
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
  var cx = $form("centerx");
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
    $form("cxunit").innerHTML = "h";
  } else {
    cx.min = "-180";
    cx.max = "180";
    $form("cxunit").innerHTML = "\u00b0";
  }
  return cx.value;
}

function setCenter(ctr, trans) {
  var cx = $form("centerx"), cy = $form("centery"), cz = $form("centerz");
  if (!cx || !cy) return;
  
  if (ctr === null || ctr.length < 1) ctr = [0,0,0]; 
  if (ctr.length <= 2 || ctr[2] === undefined) ctr[2] = 0;
  //config.center = ctr; 
  if (trans !== "equatorial") cx.value = ctr[0].toFixed(1); 
  else cx.value = ctr[0] < 0 ? (ctr[0] / 15 + 24).toFixed(1) : (ctr[0] / 15).toFixed(1); 
  
  cy.value = ctr[1].toFixed(1);
  cz.value = ctr[2] !== null ? ctr[2].toFixed(1) : 0;
  settings.set({center: ctr});
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

  if (res.d !== 6) {
    $form("dsos-limit").max = res.d;
    $form("dsos-nameLimit").max = res.d;
  }
   
   s = config.stars.data;
  
  //test star limit
  t = s.match(rx);
  if (t !== null) {
    res.s = parseFloat(t[t.length-1]);
  }

  if (res.s != 6) {
    $form("stars-limit").max = res.s;
    $form("stars-designationLimit").max = res.s;
    $form("stars-propernameLimit").max = res.s;
  }

  return res;
}

// Options only visible in advanced mode
//"stars-designationType", "stars-propernameType", "stars-size", "stars-exponent", "stars-size", "stars-exponent", //"constellations-namesType", "planets-namesType", "planets-symbolType"
function showAdvanced(showit) {
  var vis = showit ? "inline-block" : "none";
  d3.select(parentElement + " ~ #celestial-form").selectAll(".advanced").style("display", vis);
  d3.select(parentElement + " ~ #celestial-form").selectAll("#label-propername").style("display", showit ? "none" : "inline-block");
}


function setVisibility(cfg, which) {
   var vis, fld;
   if (!has(cfg, "formFields")) return;
   if (which && has(cfg.formFields, which)) {
     d3.select(parentElement + " ~ #celestial-form").select("#" + which).style( {"display": "none"} );
     return;
   }
   // Special case for backward compatibility
   if (cfg.form === false && cfg.location === true) {
     d3.select(parentElement + " ~ #celestial-form").style("display", "inline-block");
     for (fld in cfg.formFields) {
      if (!has(cfg.formFields, fld)) continue;
       if (fld === "location") continue;
       d3.select(parentElement + " ~ #celestial-form").select("#" + fld).style( {"display": "none"} );     
     }
     return;
   }
   // hide if not desired
   if (cfg.form === false) d3.select(parentElement + " ~ #celestial-form").style("display", "none"); 

   for (fld in cfg.formFields) {
     if (!has(cfg.formFields, fld)) continue;
     if (fld === "location") continue;
     vis = cfg.formFields[fld] === false ? "none" : "block";
     d3.select(parentElement + " ~ #celestial-form").select("#" + fld).style( {"display": vis} );     
   }
   
}

function listConstellations() {
  var sel = d3.select(parentElement + " ~ #celestial-form").select("#constellation"),
      list = [], selected = 0, id, name, config = globalConfig;
    
  Celestial.container.selectAll(".constname").each( function(d, i) {
    id = d.id;
    if (id === config.constellation) selected = i;
    name = d.properties[config.constellations.namesType];
    if (name !== id) name += " (" + id + ")";
    list.push({o:id, n:name});
  });
  if (list.length < 1 || sel.length < 1) {
    setTimeout(listConstellations, 1000);
    return;
  }
  list = [{o:"---", n:"(Select constellation)"}].concat(list);
  
  sel.selectAll('option').remove();
  sel.selectAll('option').data(list).enter().append('option')
     .attr("value", function (d) { return d.o; })
     .text(function (d) { return d.n; });
  sel.property("selectedIndex", selected);
  //$form("constellation").firstChild.disabled = true;

  //Celestial.constellations = list;
}

function $form(id) { return document.querySelector(parentElement + " ~ #celestial-form" + " #" + id); }




