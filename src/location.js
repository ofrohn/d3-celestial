/* global Celestial, horizontal, datetimepicker, config, Round, $ */
function geo(cfg) {
  var ctrl = d3.select("#celestial-form").append("div").attr("class", "loc"),
      dt = new Date(), geopos = [0,0], zone = 0,
      dtFormat = d3.time.format("%Y-%m-%d %H:%M:%S %Z");
  
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition( function(pos) {
      geopos = [Round(pos.coords.latitude, 4), Round(pos.coords.longitude, 4)];
      d3.select("#lat").attr("value", geopos[0]);
      d3.select("#lon").attr("value", geopos[1]);
      go();
    });  
  }

  var dtpick = new datetimepicker();
  
  var col = ctrl.append("div").attr("class", "col");

  col.append("label").attr("title", "Location coordinates long/lat").attr("for", "lat").html("Location");
  col.append("input").attr("type", "number").attr("id", "lat").attr("title", "Latitude").attr("max", "90").attr("min", "-90").attr("step", "0.0001").attr("value", geopos[0]).on("change", go);
  col.append("span").html("\u00b0");
  
  col.append("input").attr("type", "number").attr("id", "lon").attr("title", "Longitude").attr("max", "180").attr("min", "-180").attr("step", "0.0001").attr("value", geopos[1]).on("change", go);
  col.append("span").html("\u00b0");

  col.append("label").attr("title", "Local date/time").attr("for", "datetime").html(" Local date/time");
  col.append("input").attr("type", "text").attr("id", "datetime").attr("title", "Date and time").attr("value", dtFormat(dt))
  .on("click", showpick).on("change", go);
  col.append("button").attr("id", "datepick").html("&#x1F4C5;").on("click", showpick);
  
  col.append("input").attr("type", "button").attr("value", "Now").attr("id", "now").on("click", now);
  
  function now() {
    dt.setTime(Date.now());
    $("datetime").value = dtFormat(dt);
    go();
  }

  function showpick() {
    dtpick.show(dt);
  }
  
  function pick() {
    dt.setTime(dtnew.getTime());
    $("datetime").value = dtFormat(dt);
    //go();
  }

  
  function go() {
    var zenith = [0,0];
    switch (this.id) {
      case "lat": geopos[0] = this.value; break;
      case "lon": geopos[1] = this.value; break;
      case "datetime": dt = dtFormat.parse(this.value); break;
      //case "tz": offset = this.value; break;
    }
    if (geopos[0] !== "" && geopos[1] !== "") {
      zenith = horizontal.inverse(dt, [90, 0], geopos);
      config.center = zenith;
      Celestial.rotate(config);
    }
  }
}

