//load data and transform coordinates

function getData(d, trans) {
  if (trans === "equatorial") return d;

  var le = euler[trans],
      coll = d.features;

  for (var i=0; i<coll.length; i++)
    coll[i].geometry.coordinates = translate(coll[i], le);
  
  return d;
}

function translate(d, le) {
  var res = [];
  switch (d.geometry.type) {
    case "Point": res = transformDeg(d.geometry.coordinates, le); break;
    case "LineString": res.push(transLine(d.geometry.coordinates, le)); break;
    case "MultiLineString": res = transMultiLine(d.geometry.coordinates, le); break;
    case "Polygon": res.push(transLine(d.geometry.coordinates, le)); break;
    case "MultiPolygon": res.push(transMultiLine(d.geometry.coordinates[0], le)); break;
  }
  
  return res;
}

function transLine(c, le) {
  res = [];
  
  for (var i=0; i<c.length; i++)
    res.push(transformDeg(c[i], le));
  
  return res;
}

function transMultiLine(c, le) {
  res = [];
  
  for (var i=0; i<c.length; i++)
    res.push(transLine(c[i], le));
  
  return [res];
}

