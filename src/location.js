/* global Celestial, settings, horizontal, datetimepicker, config, $, pad, testNumber, isArray, isNumber, isValidDate, fldEnable, Round, has, hasParent */

function geo(cfg) {
  var frm = d3.select("#celestial-form form").insert("div", "div#general").attr("id", "loc"),
      dtFormat = d3.time.format("%Y-%m-%d %H:%M:%S"),
      zenith = [0,0],
      geopos = [0,0], 
      date = new Date(),
      zone = date.getTimezoneOffset(),
      config = settings.set(cfg);

  var dtpick = new datetimepicker(config, function(date, tz) { 
    $("datetime").value = dateFormat(date, tz); 
    zone = tz;
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
    $("datetime").value = dateFormat(date, zone); 
    go(); 
  });
  col.append("input").attr("type", "text").attr("id", "datetime").attr("title", "Date and time").attr("value", dateFormat(date, zone))
  .on("click", showpick, true).on("input", function () { 
    this.value = dateFormat(date, zone); 
    if (!dtpick.isVisible()) showpick(); 
  });
  col.append("div").attr("id", "datepick").on("click", showpick);
  col.append("input").attr("type", "button").attr("id", "day-right").attr("title", "One day forward").on("click", function () { 
    date.setDate(date.getDate() + 1); 
    $("datetime").value = dateFormat(date, zone); 
    go(); 
  });
  //Now -button sets current time & date of device  
  col.append("input").attr("type", "button").attr("value", "Now").attr("id", "now").on("click", now);
  //Horizon marker
  col.append("br");
  col.append("label").attr("title", "Show horizon marker").attr("for", "horizon-show").html(" Horizon marker");
  col.append("input").attr("type", "checkbox").attr("id", "horizon-show").property("checked", config.horizon.show).on("change", go);    
  //Daylight
  col.append("label").attr("title", "Show daylight").attr("for", "daylight-show").html("Daylight sky");
  col.append("input").attr("type", "checkbox").attr("id", "daylight-show").property("checked", config.daylight.show).on("change", go);    
  //Show planets
  col.append("label").attr("title", "Show solar system objects").attr("for", "planets-show").html(" Planets, Sun & Moon");
  col.append("input").attr("type", "checkbox").attr("id", "planets-show").property("checked", config.planets.show).on("change", go);    
  
  d3.select(document).on("mousedown", function () { 
    if (!hasParent(d3.event.target, "celestial-date") && dtpick.isVisible()) dtpick.hide(); 
  });
  
  function now() {
    date.setTime(Date.now());
    $("datetime").value = dateFormat(date, zone);
    go();
  }

  function here() {
    navigator.geolocation.getCurrentPosition( function(pos) {
      geopos = [Round(pos.coords.latitude, 4), Round(pos.coords.longitude, 4)];
      $("lat").value = geopos[0];
      $("lon").value = geopos[1];
      go();
    });  
  }
  
  function showpick() {
    dtpick.show(date);
  }
  
  function dateFormat(dt, tz) {
    var tzs;
    if (!tz || tz === "0") tzs = " ±0000";
    else {
      var h = Math.floor(Math.abs(tz) / 60),
          m = Math.abs(tz) - (h * 60),
          s = tz < 0 ? " +" : " −";
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

  function go() {
    var lon = $("lon").value,
        lat = $("lat").value;
        //Get current configuration
        Object.assign(config, settings.set());

    date = dtFormat.parse($("datetime").value.slice(0,-6));

    var tz = date.getTimezoneOffset();
    var dtc = new Date(date.valueOf() + (zone - tz) * 60000);

    config.horizon.show = !!$("horizon-show").checked;
    config.daylight.show = !!$("daylight-show").checked;
    config.planets.show = !!$("planets-show").checked;    
    Celestial.apply(config);

    if (lon !== "" && lat !== "") {
      geopos = [parseFloat(lat), parseFloat(lon)];
      zenith = Celestial.getPoint(horizontal.inverse(dtc, [90, 0], geopos), config.transform);
      zenith[2] = 0;
      if (config.follow === "zenith") {
        Celestial.rotate({center:zenith});
      }
    }
  }

  Celestial.getPosition = function (p) {
    
  };

  Celestial.date = function (dt, tz) { 
    if (!dt) return date;  
    zone = tz || zone;
    if (dtpick.isVisible()) dtpick.hide();
    date.setTime(dt.valueOf());
    $("datetime").value = dateFormat(dt, zone); 
    Celestial.redraw();
  };
  Celestial.timezone = function (tz) { 
    if (!tz) return zone;  
    zone = tz || zone;
    if (dtpick.isVisible()) dtpick.hide();
    $("datetime").value = dateFormat(date, zone); 
    Celestial.redraw();
  };
  Celestial.position = function () { return geopos; };
  Celestial.location = function (loc) {
    if (!loc || loc.length < 2) return geopos;
    if (isValidLocation(config.location)) {
      geopos = config.location.slice();
      $("lat").value = geopos[0];
      $("lon").value = geopos[1];
      go();
    }
  };
  //{"date":dt, "location":loc, "timezone":tz}
  Celestial.skyview = function (cfg) {
    var valid = false;
    if (dtpick.isVisible()) dtpick.hide();
    if (isValidDate(cfg.date)) {
      date.setTime(cfg.date.valueOf());
      $("datetime").value = dateFormat(cfg.date, zone); 
      valid = true;
    }
    zone = cfg.timezone || zone;
    if (isValidLocation(cfg.location)) {
      geopos = cfg.location.slice();
      $("lat").value = geopos[0];
      $("lon").value = geopos[1];
      valid = true;
    }
    if (valid === true) go();
    else return {"date": date, "location": geopos};
  };  
  Celestial.dtLoc = Celestial.skyview;
  Celestial.zenith = function () { return zenith; };
  Celestial.nadir = function () {
    var b = -zenith[1],
        l = zenith[0] + 180;
    if (l > 180) l -= 360;    
    return [l, b-0.001]; 
  };

  if (has(cfg, "formFields") && (cfg.location === true || cfg.formFields.location === true)) {
    d3.select("#location").style( {"display": "inline-block"} );
  }
  //only if appropriate
  if (cfg.location === true && cfg.formFields.location === true)
    setTimeout(go, 1000); 
 
}
