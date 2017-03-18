/* global Celestial, horizontal, datetimepicker, config, $, pad, testNumber, hasParent */
var zenith = [0,0];

function geo(cfg) {
  var ctrl = d3.select("#celestial-form").append("div").attr("id", "loc"),
      dt = new Date(), geopos = [0,0], 
      dtFormat = d3.time.format("%Y-%m-%d %H:%M:%S"),
      zone = dt.getTimezoneOffset();

  var dtpick = new datetimepicker( function(date, tz) { 
    $("datetime").value = dateFormat(date, tz); 
    zone = tz;
    go(); 
  });
  
  var col = ctrl.append("div").attr("class", "col");
  //Latitude & longitude fields
  col.append("label").attr("title", "Location coordinates long/lat").attr("for", "lat").html("Location");
  col.append("input").attr("type", "number").attr("id", "lat").attr("title", "Latitude").attr("placeholder", "Latitude").attr("max", "90").attr("min", "-90").attr("step", "0.0001").attr("value", geopos[0]).on("change",  function () { if (testNumber(this) === true) go(); });
  col.append("span").html("\u00b0");
  col.append("input").attr("type", "number").attr("id", "lon").attr("title", "Longitude").attr("placeholder", "Longitude").attr("max", "180").attr("min", "-180").attr("step", "0.0001").attr("value", geopos[1]).on("change",  function () { if (testNumber(this) === true) go(); });
  col.append("span").html("\u00b0");
  //Here-button if supported
  if ("geolocation" in navigator) {
    col.append("input").attr("type", "button").attr("value", "Here").attr("id", "here").on("click", here);
  }
  //Datetime field with dtpicker-button
  col.append("label").attr("title", "Local date/time").attr("for", "datetime").html(" Date/time");
  col.append("input").attr("type", "text").attr("id", "datetime").attr("title", "Date and time").attr("value", dateFormat(dt, zone))
  .on("click", showpick, true).on("input", function () { 
    this.value = dateFormat(dt, zone); 
    if (!dtpick.isVisible()) showpick(); 
  });
  col.append("div").attr("id", "datepick").on("click", showpick);
  //Now -button sets current time & date of device  
  col.append("input").attr("type", "button").attr("value", "Now").attr("id", "now").on("click", now);
  //Horizon marker
  col.append("br");
  col.append("label").attr("title", "Show horizon marker").attr("for", "horizon-show").html(" Horizon marker");
  col.append("input").attr("type", "checkbox").attr("id", "horizon-show").property("checked", cfg.horizon.show).on("change", go);    
  
  d3.select(document).on("mousedown", function () { 
    if (!hasParent(d3.event.target, "celestial-date") && dtpick.isVisible()) dtpick.hide(); 
  });
  
  function now() {
    dt.setTime(Date.now());
    $("datetime").value = dateFormat(dt, zone);
    go();
  }

  function here() {
    navigator.geolocation.getCurrentPosition( function(pos) {
      geopos = [pos.coords.latitude.toFixed(4), pos.coords.longitude.toFixed(4)];
      d3.select("#lat").attr("value", geopos[0]);
      d3.select("#lon").attr("value", geopos[1]);
      go();
    });  
  }
  
  function showpick() {
    dtpick.show(dt);
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
        lat = $("lat").value,
        dm = !!$("horizon-show").checked; 

    dt = dtFormat.parse($("datetime").value.slice(0,-6));

    var tz = dt.getTimezoneOffset();
    var dtc = new Date(dt.valueOf() + (zone - tz) * 60000);

    cfg.horizon.show = dm;
    
    if (lon !== "" && lat !== "") {
      geopos = [parseFloat(lat), parseFloat(lon)];
      zenith = Celestial.getPoint(horizontal.inverse(dtc, [90, 0], geopos), cfg.transform);
      zenith[2] = 0;
      Celestial.rotate({center:zenith, horizon:cfg.horizon});
    }
  }

  setTimeout(go, 1000); 
}

function showHorizon(clip) {
  var hs = $("horizon-show");
  if (!hs) return;
  hs.style.display = clip === true ? "none" : "inline-block";
  hs.previousSibling.style.display = hs.style.display;    
}

Celestial.zenith = function () { return zenith; };
Celestial.nadir = function () {
  var b = -zenith[1],
      l = zenith[0] + 180;
  if (l > 180) l -= 360;    
  return [l, b-0.001]; 
};
