//load data and transform coordinates

function getData(d) {
  if (trans === "equatorial") return d;

  var le = euler[trans];

  d.geometry.coordinates = translate(d, le);
  
  return d;
}

function translate(d, le) {
  var res = [];
  switch (d.geometry.type) {
    case "Point": res = transformDeg(d.geometry.coordinates, le); break;
    case "LineString": res.push(transLine(d.geometry.coordinates, le)); break;
    case "MultiLineString": res = transMultiLine(d.geometry.coordinates, le); break;
    case "Polygon": res.push(transLine(d.geometry.coordinates, le)); break;
    case "MultiPolygon": res.push(transMultiLine(d.geometry.coordinates, le)); break;
  }
  
  return res;
}

function transLine(c, trans) {
  res = [];
  
  for (var i=0; i<c.length; i++)
  res.push(transformDeg(c[i], euler[trans]));
  
  return res;
}

function transMultiLine(c, trans) {
  res = [];
  
  for (var i=0; i<c.length; i++)
  res.push(transLine(c[i], trans));
  
  return res;
}

