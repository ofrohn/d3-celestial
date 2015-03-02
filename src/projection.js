
Celestial.projection = function(projection, euler) {
  var p, trans, raw, forward;
  
  if (!projections.hasOwnProperty(projection)) { throw new Error("Projection not supported: " + projection); }
  p = projections[projection];
    
  if (p.arg !== null) {
    raw = d3.geo[projection].raw(p.arg);
  } else {
    raw = d3.geo[projection].raw;  
  }
  
  if (euler) {
    forward = function(λ, φ) {
      var coords = Celestial.transform([-λ, φ],euler);
      coords = raw(coords[0], coords[1]);
      return coords;
    };
  } else {
    forward = function(λ, φ) {
      var coords = raw(-λ, φ);
      return coords;
    };
  }
  forward.invert = function(x, y) {
    //Needs tranform
    var coords = raw.invert(x, y);
    coords[0] *= -1;
    return coords;
  };

  return d3.geo.projection(forward);
};
