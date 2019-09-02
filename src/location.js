/* global Celestial, horizontal, datetimepicker, config, $, pad, testNumber, fldEnable, Round, has, hasParent */

function geo(cfg) {
  var frm = d3.select("#celestial-form").append("div").attr("id", "loc"),
      dtFormat = d3.time.format("%Y-%m-%d %H:%M:%S"),
      zenith = [0,0],
      geopos = [0,0], 
      date = new Date(),
      zone = date.getTimezoneOffset();

  var dtpick = new datetimepicker(cfg, function(date, tz) { 
    $("datetime").value = dateFormat(date, tz); 
    zone = tz;
    go(); 
  });
  
  if (has(cfg, "geopos") && cfg.geopos !== null && cfg.geopos.length === 2) geopos = cfg.geopos;
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
  col.append("input").attr("type", "checkbox").attr("id", "horizon-show").property("checked", cfg.horizon.show).on("change", go);    
  col.append("label").attr("title", "Show solar system objects").attr("for", "planets-show").html(" Planets, Sun & Moon");
  col.append("input").attr("type", "checkbox").attr("id", "planets-show").property("checked", cfg.planets.show).on("change", go);    
  
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
  
  function go() {
    var lon = $("lon").value,
        lat = $("lat").value;

    date = dtFormat.parse($("datetime").value.slice(0,-6));

    var tz = date.getTimezoneOffset();
    var dtc = new Date(date.valueOf() + (zone - tz) * 60000);

    cfg.horizon.show = !!$("horizon-show").checked;
    cfg.planets.show = !!$("planets-show").checked;
    
    if (lon !== "" && lat !== "") {
      geopos = [parseFloat(lat), parseFloat(lon)];
      zenith = Celestial.getPoint(horizontal.inverse(dtc, [90, 0], geopos), cfg.transform);
      zenith[2] = 0;
      if (cfg.follow === "zenith") {
        Celestial.rotate({center:zenith, horizon:cfg.horizon});
      } else {
        Celestial.apply({horizon:cfg.horizon});
      }
    }
  }

  Celestial._location = function (lat, lon) {
    $("lat").value = lat;
    $("lon").value = lon;
  };

  Celestial._go = function () {
    go();
  };

  Celestial.getPosition = function (p) {
    
  };

  Celestial.date = function (dt) { 
    if (!dt) return date;  
    if (dtpick.isVisible()) dtpick.hide();
    date.setTime(dt.valueOf());
    $("datetime").value = dateFormat(dt, zone); 
    Celestial.redraw();
  };
  Celestial.position = function () { return geopos; };
  Celestial.location = function (loc) {
    if (!loc || loc.length < 2) return geopos;
  };
  Celestial.skyview = function (dt, loc) {
    if (!dt || !loc || loc.length < 2) {
      return {date: date, location: geopos};
    }
    if (dtpick.isVisible()) dtpick.hide();
    date.setTime(dt.valueOf());
    $("datetime").value = dateFormat(dt, zone); 
    Celestial.redraw();
  };  
  Celestial.dtLoc = Celestial.datelocation;
  Celestial.zenith = function () { return zenith; };
  Celestial.nadir = function () {
    var b = -zenith[1],
        l = zenith[0] + 180;
    if (l > 180) l -= 360;    
    return [l, b-0.001]; 
  };

  setTimeout(go, 1000); 
 
}
