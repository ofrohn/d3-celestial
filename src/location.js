/* global Celestial, horizontal, datetimepicker, config, $, pad, testNumber */
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

  col.append("label").attr("title", "Location coordinates long/lat").attr("for", "lat").html("Location");
  col.append("input").attr("type", "number").attr("id", "lat").attr("title", "Latitude").attr("placeholder", "Latitude").attr("max", "90").attr("min", "-90").attr("step", "0.0001").attr("value", geopos[0]).on("change",  function() { if (testNumber(this) === true) go(); });
  col.append("span").html("\u00b0");
  
  col.append("input").attr("type", "number").attr("id", "lon").attr("title", "Longitude").attr("placeholder", "Longitude").attr("max", "180").attr("min", "-180").attr("step", "0.0001").attr("value", geopos[1]).on("change",  function() { if (testNumber(this) === true) go(); });
  col.append("span").html("\u00b0");

  if ("geolocation" in navigator) {
    col.append("input").attr("type", "button").attr("value", "Here").attr("id", "here").on("click", here);
  }
  
  col.append("label").attr("title", "Local date/time").attr("for", "datetime").html(" Local date/time");
  col.append("input").attr("type", "text").attr("id", "datetime").attr("title", "Date and time").attr("value", dateFormat(dt, zone))
  .on("click", showpick, true).on("input", function() { 
    this.value = dateFormat(dt, zone); 
    if (!dtpick.isVisible()) showpick(); 
  });
  col.append("div").attr("id", "datepick").on("click", showpick);
  
  col.append("input").attr("type", "button").attr("value", "Now").attr("id", "now").on("click", now);
    
  d3.select(document).on("mousedown", function() { 
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
    var zenith = [0,0],
        lon = $("lon").value,
        lat = $("lat").value; 

    dt = dtFormat.parse($("datetime").value.slice(0,-6));

    var tz = dt.getTimezoneOffset();
    var dtc = new Date(dt.valueOf() + (zone - tz) * 60000);

    if (lon !== "" && lat !== "") {
      geopos = [parseFloat(lat), parseFloat(lon)];
      zenith = horizontal.inverse(dtc, [90, 0], geopos);
      Celestial.rotate({center:zenith});
    }
  }

  function hasParent(t, id){
    while(t.parentNode){
      if(t.id === id) return true;
      t = t.parentNode;
    }
    return false;
  }
  
  setTimeout(go, 1000);  
}

