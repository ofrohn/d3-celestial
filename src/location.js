/* global Celestial, horizontal, datetimepicker, config, $ */
function geo(cfg) {
  var ctrl = d3.select("#celestial-form").append("div").attr("class", "loc"),
      dt = new Date(), geopos = [0,0], zone = 0,
      dtFormat = d3.time.format("%Y-%m-%d %H:%M:%S %Z");
  

  var dtpick = new datetimepicker( function(date) { 
    $("datetime").value = dtFormat(date); 
    go(); 
  });
  
  var col = ctrl.append("div").attr("class", "col");

  col.append("label").attr("title", "Location coordinates long/lat").attr("for", "lat").html("Location");
  col.append("input").attr("type", "number").attr("id", "lat").attr("title", "Latitude").attr("max", "90").attr("min", "-90").attr("step", "0.0001").attr("value", geopos[0]).on("change", go);
  col.append("span").html("\u00b0");
  
  col.append("input").attr("type", "number").attr("id", "lon").attr("title", "Longitude").attr("max", "180").attr("min", "-180").attr("step", "0.0001").attr("value", geopos[1]).on("change", go);
  col.append("span").html("\u00b0");

  if ("geolocation" in navigator) {
    col.append("input").attr("type", "button").attr("value", "Here").attr("id", "here").on("click", here);
  }
  
  col.append("label").attr("title", "Local date/time").attr("for", "datetime").html(" Local date/time");
  col.append("input").attr("type", "text").attr("id", "datetime").attr("title", "Date and time").attr("value", dtFormat(dt))
  .on("click", showpick).on("input", function() { 
    this.value = dtFormat(dt); 
    if (!dtpick.isVisible()) showpick(); 
  });
  col.append("div").attr("id", "datepick").html("&#x1F4C5;").on("click", showpick);
  
  col.append("input").attr("type", "button").attr("value", "Now").attr("id", "now").on("click", now);
  
  //d3.select(window).on("click", function() { if (dtpick.isVisible()) dtpick.hide(); });
  
  function now() {
    dt.setTime(Date.now());
    $("datetime").value = dtFormat(dt);
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
    return false;
  }
  
  function go() {
    var zenith = [0,0];
    //switch (this.id) {
    geopos[0] = parseFloat($("lat").value); 
    geopos[1] = parseFloat($("lon").value); 
    dt = dtFormat.parse($("datetime").value);
    //case "tz": offset = this.value; break;

    if (geopos[0] !== "" && geopos[1] !== "") {
      zenith = horizontal.inverse(dt, [90, 0], geopos);
      config.center = zenith;
      Celestial.rotate(config);
    }
  }

  setTimeout(go, 1000);  
}

