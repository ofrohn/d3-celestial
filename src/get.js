/* global Celestial, euler, transformDeg, isArray, isNumber, cfg */
//load data and transform coordinates

function getPoint(coords, trans) {
  return transformDeg(coords, euler[trans]);
}
 
function getData(d, trans) {
  if (trans === "equatorial") return d;

  var leo = euler[trans],
      coll = d.features;

  for (var i=0; i<coll.length; i++)
    coll[i].geometry.coordinates = translate(coll[i], leo);
  
  return d;
}

function translate(d, leo) {
  var res = [];
  switch (d.geometry.type) {
    case "Point": res = transformDeg(d.geometry.coordinates, leo); break;
    case "LineString": res.push(transLine(d.geometry.coordinates, leo)); break;
    case "MultiLineString": res = transMultiLine(d.geometry.coordinates, leo); break;
    case "Polygon": res.push(transLine(d.geometry.coordinates[0], leo)); break;
    case "MultiPolygon": res.push(transMultiLine(d.geometry.coordinates[0], leo)); break;
  }
  
  return res;
}

function getGridValues(type, loc) {
  var lines = [];
  if (!loc) return [];
  if (!isArray(loc)) loc = [loc];
  //center, outline, values
  for (var i=0; i < loc.length; i++) {
    switch (loc[i]) {
      case "center": 
        if (type === "lat")
          lines = lines.concat(getLine(type, cfg.center[0], "N"));
        else
          lines = lines.concat(getLine(type, cfg.center[1], "S")); 
        break;
      case "outline": 
        if (type === "lon") { 
          lines = lines.concat(getLine(type, cfg.center[1]-89.99, "S"));
          lines = lines.concat(getLine(type, cfg.center[1]+89.99), "N");
        } else {
					// TODO: hemi
          lines = lines.concat(getLine(type, cfg.center[0]-179.99, "E"));
          lines = lines.concat(getLine(type, cfg.center[0]+179.99, "W"));
        }
        break;
      default: if (isNumber(loc[i])) {
        if (type === "lat")
          lines = lines.concat(getLine(type, loc[i], "N"));
        else
          lines = lines.concat(getLine(type, loc[i], "S")); 
        break;        
      }
    }
  }
  //return [{coordinates, value, orientation}, ...]
  return jsonGridValues(lines);
}

function jsonGridValues(lines) {
  var res = [];
  for (var i=0; i < lines.length; i++) {
    var f = {type: "Feature", "id":i, properties: {}, geometry:{type:"Point"}};
    f.properties.value = lines[i].value;
    f.properties.orientation = lines[i].orientation;
    f.geometry.coordinates = lines[i].coordinates;
    res.push(f);
  }
  return res;
}

function getLine(type, loc, orient) {
  var min, max, step, val, coord,
      tp = type,
      res = [],
      lr = loc;
  if (cfg.transform === "equatorial" && tp === "lon") tp = "ra";
  
  if (tp === "ra") {
    min = 0; max = 23; step = 1;
  } else if (tp === "lon") {
    min = 0; max = 350; step = 10;    
  } else {
    min = -80; max = 80; step = 10;    
  }
  for (var i=min; i<=max; i+=step) {
    var o = orient;
    if (tp === "lat") {
      coord = [lr, i];
      val = i.toString() + "\u00b0";
      if (i < 0) o += "S"; else o += "N";
    } else if (tp === "ra") {
      coord = [i * 15, lr];
      val = i.toString() + "\u02b0";
    } else {
      coord = [i, lr];
      val = i.toString() + "\u00b0";
    }
  
    res.push({coordinates: coord, value: val, orientation: o});
  }
  return res;
}

function transLine(c, leo) {
  var line = [];
  
  for (var i=0; i<c.length; i++)
    line.push(transformDeg(c[i], leo));
  
  return line;
}

function transMultiLine(c, leo) {
  var lines = [];
  
  for (var i=0; i<c.length; i++)
    lines.push(transLine(c[i], leo));
  
  return lines;
}

Celestial.getData = getData;
Celestial.getPoint = getPoint;