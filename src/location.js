function geo(cfg) {
  var ctrl = d3.select("#celestial-form").append("div").attr("class", "loc"),
      dt = new Date(), geopos = [0,0],
      dtFormat = d3.time.format("%Y-%m-%d %H:%M:%S"),
      tzFormat = d3.time.format("%Z"),
      tz = [{"−12:00":720}, {"−11:00":660}, {"−10:00":600}, {"−09:30":570}, {"−09:00":540}, {"−08:00":480}, {"−07:00":420}, {"−06:00":360}, {"−05:00":300}, {"−04:30":270}, {"−04:00":240}, {"−03:30":210}, {"−03:00":180}, {"−02:00":120}, {"−01:00":60}, {"±00:00":0}, {"+01:00":-60}, {"+02:00":-120}, {"+03:00":-180}, {"+03:30":-210}, {"+04:00":-240}, {"+04:30":-270}, {"+05:00":-300}, {"+05:30":-330}, {"+05:45":-345}, {"+06:00":-360}, {"+06:30":-390}, {"+07:00":-420}, {"+08:00":-480}, {"+08:30":-510}, {"+08:45":-525}, {"+09:00":-540}, {"+09:30":-570}, {"+10:00":-600}, {"+10:30":-630}, {"+11:00":-660}, {"+12:00":-720}, {"+12:45":-765}, {"+13:00":-780}, {"+14:00":-840}];
  
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition( function(pos) {
      geopos = [Round(pos.coords.latitude, 4), Round(pos.coords.longitude, 4)];
      d3.select("#lat").attr("value", geopos[0]);
      d3.select("#lon").attr("value", geopos[1]);
    });  
  }
  
  var col = ctrl.append("div").attr("class", "col");

  col.append("label").attr("title", "Location coordinates long/lat").attr("for", "lat").html("Location");
  col.append("input").attr("type", "number").attr("id", "lat").attr("title", "Latitude").attr("max", "90").attr("min", "-90").attr("step", "0.0001").attr("value", geopos[0]).on("change", go);
  col.append("span").html("\u00b0");
  
  col.append("input").attr("type", "number").attr("id", "lon").attr("title", "Longitude").attr("max", "180").attr("min", "-180").attr("step", "0.0001").attr("value", geopos[1]).on("change", go);
  col.append("span").html("\u00b0");

  col.append("label").attr("title", "Local date/time").attr("for", "datetime").html(" Local date/time");
  col.append("input").attr("type", "text").attr("id", "datetime").attr("title", "Date and time").attr("value", dtFormat(dt)).on("change", go);

  col.append("label").attr("title", "Time zone offset from UTC").attr("for", "tz").html(" Time zone");
  var sel = col.append("select").attr("id", "tz").on("change", go),
      selected = 0,
      timezone = dt.getTimezoneOffset();
  sel.selectAll('option').data(tz).enter().append('option')
     .attr("value", function (d, i) { 
       var k = Object.keys(d)[0];
       if (d[k] === timezone) selected = i; 
       return d[k]; 
     })
     .text(function (d) { return Object.keys(d)[0]; });
  sel.property("selectedIndex", selected);

  function go() {
    var zenith = [0,0];
    switch (this.id) {
      case "lat": geopos[0] = this.value; break;
      case "lon": geopos[1] = this.value; break;
      case "datetime": break;
      case "tz": break;
    }
    Celestial.rotate({center: zenith});
  }
}

function tzMinutes(tz) {
  var t = tz.replace(/\+|±/, "").split(":");
  var res = Math.abs(parseInt(t[0]) * 60) + parseInt(t[1]);
  if (t[0] < 0) res *= -1;
  return res;  
}