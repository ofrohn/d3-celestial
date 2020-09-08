/* global Celestial, settings, horizontal, datetimepicker, config, formats, $, $form, pad, testNumber, isArray, isNumber, isValidDate, showAdvanced, enable, Round, has, hasParent, parentElement */

var geoInfo = null;

function geo(cfg) {
  var dtFormat = d3.time.format("%Y-%m-%d %H:%M:%S"),
      zenith = [0,0],
      geopos = [0,0], 
      date = new Date(),
      localZone = -date.getTimezoneOffset(),
      timeZone = localZone,
      config = settings.set(cfg),
      frm = d3.select(parentElement + " ~ #celestial-form form").insert("div", "div#general").attr("id", "loc");

  var dtpick = new datetimepicker(config, function(date, tz) { 
    $form("datetime").value = dateFormat(date, tz); 
    timeZone = tz;
    go(); 
  });
  
  if (has(config, "geopos") && config.geopos !== null && config.geopos.length === 2) geopos = config.geopos;
  var col = frm.append("div").attr("class", "col").attr("id", "location").style("display", "none");
  //Latitude & longitude fields
  col.append("label").attr("title", "Location coordinates long/lat").attr("for", "lat").html("Location");
  col.append("input").attr("type", "number").attr("id", "lat").attr("title", "Latitude").attr("placeholder", "Latitude").attr("max", "90").attr("min", "-90").attr("step", "0.0001").attr("value", geopos[0]).on("change",  function () {
    if (testNumber(this) === true) go(); 
  });
  col.append("span").html("\u00b0");
  col.append("input").attr("type", "number").attr("id", "lon").attr("title", "Longitude").attr("placeholder", "Longitude").attr("max", "180").attr("min", "-180").attr("step", "0.0001").attr("value", geopos[1]).on("change",  function () { 
    if (testNumber(this) === true) go(); 
  });
  col.append("span").html("\u00b0");
  //Here-button if supported
  if ("geolocation" in navigator) {
    col.append("input").attr("type", "button").attr("value", "Here").attr("id", "here").on("click", here);
  }
  //Datetime field with dtpicker-button
  col.append("label").attr("title", "Local date/time").attr("for", "datetime").html(" Date/time");
  col.append("input").attr("type", "button").attr("id", "day-left").attr("title", "One day back").on("click", function () {
    date.setDate(date.getDate() - 1); 
    $form("datetime").value = dateFormat(date, timeZone); 
    go(); 
  });
  col.append("input").attr("type", "text").attr("id", "datetime").attr("title", "Date and time").attr("value", dateFormat(date, timeZone))
  .on("click", showpick, true).on("input", function () { 
    this.value = dateFormat(date, timeZone); 
    if (!dtpick.isVisible()) showpick(); 
  });
  col.append("div").attr("id", "datepick").on("click", showpick);
  col.append("input").attr("type", "button").attr("id", "day-right").attr("title", "One day forward").on("click", function () { 
    date.setDate(date.getDate() + 1); 
    $form("datetime").value = dateFormat(date, timeZone); 
    go(); 
  });
  //Now -button sets current time & date of device  
  col.append("input").attr("type", "button").attr("value", "Now").attr("id", "now").on("click", now);
  //Horizon marker
  col.append("br");
  col.append("label").attr("title", "Show horizon marker").attr("for", "horizon-show").html(" Horizon marker");
  col.append("input").attr("type", "checkbox").attr("id", "horizon-show").property("checked", config.horizon.show).on("change", apply);    
  //Daylight
  col.append("label").attr("title", "Show daylight").attr("for", "daylight-show").html("Daylight sky");
  col.append("input").attr("type", "checkbox").attr("id", "daylight-show").property("checked", config.daylight.show).on("change", apply);col.append("br");
    
  //Show planets
  col.append("label").attr("title", "Show solar system objects").attr("for", "planets-show").html(" Planets, Sun & Moon");
  col.append("input").attr("type", "checkbox").attr("id", "planets-show").property("checked", config.planets.show).on("change", apply);    
  //Planet names
  var names = formats.planets[config.culture] || formats.planets.iau;
  
  for (var fld in names) {
    if (!has(names, fld)) continue;
    var keys = Object.keys(names[fld]);
    if (keys.length > 1) {
      //Select List
      var txt = (fld === "symbol") ? "as" : "with";
      col.append("label").attr("for", "planets-" + fld + "Type").html(txt);
      
      var selected = 0;
      col.append("label").attr("title", "Type of planet name").attr("for", "planets-" + fld + "Type").attr("class", "advanced").html("");
      var sel = col.append("select").attr("id", "planets-" + fld + "Type").on("change", apply);
      var list = keys.map(function (key, i) {
        if (key === config.planets[fld + "Type"]) selected = i;    
        return {o:key, n:names[fld][key]}; 
      });
      sel.selectAll("option").data(list).enter().append('option')
         .attr("value", function (d) { return d.o; })
         .text(function (d) { return d.n; });
      sel.property("selectedIndex", selected);

      if (fld === "names") {
        sel.attr("class", "advanced");
        col.append("label").attr("for", "planets-" + fld).html("names");
        col.append("input").attr("type", "checkbox").attr("id", "planets-" + fld).property("checked", config.planets[fld]).on("change", apply);
      }
    } 
  }    
 
  enable($form("planets-show"));
  showAdvanced(config.advanced);
  

  d3.select(document).on("mousedown", function () { 
    if (!hasParent(d3.event.target, "celestial-date") && dtpick.isVisible()) dtpick.hide(); 
  });
  
  function now() {
    date.setTime(Date.now());
    $form("datetime").value = dateFormat(date, timeZone);
    go();
  }

  function here() {
    navigator.geolocation.getCurrentPosition( function(pos) {
      geopos = [Round(pos.coords.latitude, 4), Round(pos.coords.longitude, 4)];
      $form("lat").value = geopos[0];
      $form("lon").value = geopos[1];
      go();
    });  
  }
  
  function showpick() {
    dtpick.show(date, timeZone);
  }
  
  function dateFormat(dt, tz) {
    var tzs;
    if (!tz || tz === "0") tzs = " ±0000";
    else {
      var h = Math.floor(Math.abs(tz) / 60),
          m = Math.abs(tz) - (h * 60),
          s = tz > 0 ? " +" : " −";
      tzs = s + pad(h) + pad(m);
    }
    return dtFormat(dt) + tzs;
  }  
  

  function isValidLocation(loc) {
    //[lat, lon] expected
    if (!loc || !isArray(loc) || loc.length < 2) return false;
    if (!isNumber(loc[0]) || loc[0] < -90 || loc[0] > 90)  return false;
    if (!isNumber(loc[1]) || loc[1] < -180 || loc[1] > 180)  return false;
    return true;
  }

  function isValidTimezone(tz) {
    if (tz === undefined || tz === null) return false;
    if (!isNumber(tz) && Math.abs(tz) > 840) return false;
    return true;    
  }
  
  function apply() {
    Object.assign(config, settings.set());
    config.horizon.show = !!$form("horizon-show").checked;
    config.daylight.show = !!$form("daylight-show").checked;
    config.planets.show = !!$form("planets-show").checked;    
    config.planets.names = !!$form("planets-names").checked;    
    config.planets.namesType = $form("planets-namesType").value;    
    config.planets.symbolType = $form("planets-symbolType").value;    
    enable($form("planets-show"));

    Celestial.apply(config);
  }

  function go() {
    var lon = parseFloat($form("lon").value),
        lat = parseFloat($form("lat").value),
        tz;
    //Get current configuration
    Object.assign(config, settings.set());

    date = dtFormat.parse($form("datetime").value.slice(0,-6));

    //Celestial.apply(config);

    if (!isNaN(lon) && !isNaN(lat)) {
      if (lat !== geopos[0] || lon !== geopos[1]) {
        geopos = [lat, lon];
        setPosition([lat, lon], true);
        return;
      }
      //if (!tz) tz = date.getTimezoneOffset();
      $form("datetime").value = dateFormat(date, timeZone); 

      var dtc = new Date(date.valueOf() - (timeZone - localZone) * 60000);

      zenith = Celestial.getPoint(horizontal.inverse(dtc, [90, 0], geopos), config.transform);
      zenith[2] = 0;
      if (config.follow === "zenith") {
        Celestial.rotate({center:zenith});
      } else {
        Celestial.redraw();
      }
    }
  }

  
  function setPosition(p, settime) {
    if (!p || !has(config, "settimezone") || config.settimezone === false) return;
    var timestamp = Math.floor(date.getTime() / 1000),
        protocol = window && window.location.protocol === "https:" ? "https" : "http",
        url = protocol + "://api.timezonedb.com/v2.1/get-time-zone?key=" + config.timezoneid + "&format=json&by=position" + 
              "&lat=" + p[0] + "&lng=" + p[1] + "&time=" + timestamp;
       // oldZone = timeZone;

    d3.json(url, function(error, json) { 
      if (error) return console.warn(error);
      if (json.status === "FAILED") {
        // Location at sea inferred from longitude
        timeZone = Math.round(p[1] / 15) * 60;
        geoInfo = {
          gmtOffset: timeZone * 60,
          message: "Sea locatation inferred",
          timestamp: timestamp
        };
      } else {
        timeZone = json.gmtOffset / 60;
        geoInfo = json;
      }
      //if (settime) {
        //date.setTime(timestamp * 1000); // - (timeZone - oldZone) * 60000);
        //console.log(date.toUTCString());
      //}
      $form("datetime").value = dateFormat(date, timeZone);
      go();
    }); 
  }

  Celestial.dateFormat = dateFormat;
  
  Celestial.date = function (dt, tz) { 
    if (!dt) return date;  
    if (isValidTimezone(tz)) timeZone = tz;
    Object.assign(config, settings.set());
    if (dtpick.isVisible()) dtpick.hide();
    date.setTime(dt.valueOf());
    $form("datetime").value = dateFormat(dt, timeZone); 
    go();
  };
  Celestial.timezone = function (tz) { 
    if (!tz) return timeZone;  
    if (isValidTimezone(tz)) timeZone = tz;
    Object.assign(config, settings.set());
    if (dtpick.isVisible()) dtpick.hide();
    $form("datetime").value = dateFormat(date, timeZone); 
    go();
  };
  Celestial.position = function () { return geopos; };
  Celestial.location = function (loc, tz) {
    if (!loc || loc.length < 2) return geopos;
    if (isValidLocation(loc)) {
      geopos = loc.slice();
      $form("lat").value = geopos[0];
      $form("lon").value = geopos[1];
      if (isValidTimezone(tz)) timeZone = tz;
      else setPosition(geopos, true);
    }
  };
  //{"date":dt, "location":loc, "timezone":tz}
  Celestial.skyview = function (cfg) {
    if (!cfg) return {"date": date, "location": geopos, "timezone": timeZone};
    var valid = false;
    if (dtpick.isVisible()) dtpick.hide();
    if (has(cfg, "timezone") && isValidTimezone(cfg.timezone)) {
      timeZone = cfg.timezone;
      valid = true;
    }
    if (has(cfg, "date") && isValidDate(cfg.date)) {
      date.setTime(cfg.date.valueOf());
      $form("datetime").value = dateFormat(cfg.date, timeZone); 
      valid = true;
    }
    if (has(cfg, "location") && isValidLocation(cfg.location)) {
      geopos = cfg.location.slice();
      $form("lat").value = geopos[0];
      $form("lon").value = geopos[1];
      if (!has(cfg, "timezone")) { 
        setPosition(geopos, !has(cfg, "date"));
        return;
      }
    }
    //Celestial.updateForm();
    if (valid === false) return {"date": date, "location": geopos, "timezone": timeZone};
    if (config.follow === "zenith") go();
    else Celestial.redraw();
  };  
  Celestial.dtLoc = Celestial.skyview;
  Celestial.zenith = function () { return zenith; };
  Celestial.nadir = function () {
    var b = -zenith[1],
        l = zenith[0] + 180;
    if (l > 180) l -= 360;    
    return [l, b-0.001]; 
  };

  if (has(config, "formFields") && (config.location === true || config.formFields.location === true)) {
    d3.select(parentElement + " ~ #celestial-form").select("#location").style( {"display": "inline-block"} );
  }
  //only if appropriate
  if (isValidLocation(geopos) && (config.location === true || config.formFields.location === true) && config.follow === "zenith")
    setTimeout(go, 1000); 
 
}
