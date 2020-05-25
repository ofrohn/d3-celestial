/* global d3, topojson, Celestial, settings, container */
function timezones() {
  var cfg = settings.set(),
       world, timezone;
  d3.json(cfg.datapath + "timezones.json", function(error, json) {
    world = topojson.feature(json, json.objects.timezones);
    
    Celestial.container.selectAll(".timezones")
         .data(world.features)
         .enter().append("path")
         .attr("class", "tz");
  });

  function getTimezone(pos) {
    var tz;
    Celestial.container.selectAll(".tz").each( function(d,i) {
      if (pointInPolygon(pos, d.geometry.coordinates[0])) {
        tz = getMinutes(d.properties.zone);
        return false;  
      }
    });
    return tz;
  }

  function getMinutes(s) {
    if (!s) return;
    /*var tza = s.match(/UTC([\+\-])(\d+)\:(\d+)/);
    if (tza === null) return;
    var tzm = parseInt(tza[2]) * 60 + parseInt(tza[3]);
    if (tza[1] === "-") tzm *= -1;*/
    return parseFloat(s) * 60;
  }

  function pointInPolygon(p, polygon) {
    var isInside = false;
    var minX = polygon[0][0], maxX = polygon[0][0];
    var minY = polygon[0][1], maxY = polygon[0][1];
    for (var n = 1; n < polygon.length; n++) {
      var q = polygon[n];
      minX = Math.min(q[0], minX);
      maxX = Math.max(q[0], maxX);
      minY = Math.min(q[1], minY);
      maxY = Math.max(q[1], maxY);
    }

    if (p[0] < minX || p[0] > maxX || p[1] < minY || p[1] > maxY) {
      return false;
    }

    var i = 0, j = polygon.length - 1;
    for (i, j; i < polygon.length; j = i++) {
      if ( (polygon[i][1] > p[1]) != (polygon[j][1] > p[1]) &&
            p[0] < (polygon[j][0] - polygon[i][0]) * (p[1] - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0] ) {
        isInside = !isInside;
      }
    }

    return isInside;
  }
  Celestial.getTimezone = getTimezone;
}