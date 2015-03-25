/* global Celestial, projections */
//Flipped projection generated on the fly
Celestial.projection = function(projection) {
  var p, trans, raw, forward;
  
  if (!projections.hasOwnProperty(projection)) { throw new Error("Projection not supported: " + projection); }
  p = projections[projection];
    
  if (p.arg !== null) {
    raw = d3.geo[projection].raw(p.arg);
  } else {
    raw = d3.geo[projection].raw;  
  }
  
  forward = function(λ, φ) {
    var coords = raw(-λ, φ);
    return coords;
  };

  forward.invert = function(x, y) {
    var coords = raw.invert(x, y);
    coords[0] *= -1;
    return coords;
  };

  return d3.geo.projection(forward);
};

var eulerAngles = {
  "equatorial": [180.0, 0.0, 0.0],
  "ecliptic": [180.0, 0.0, 23.4393],
  "galactic": [93.5949, 28.9362, -58.5988],
  "supergalactic": [137.3100, 59.5283, 57.7303],
  "mars": [97.5,23.5,29]
};

var poles = {
  "equatorial": [0.0, 90.0],
  "ecliptic": [-90.0, 66.5607],
  "galactic": [-167.1405, 27.1283],
  "supergalactic": [-76.2458, 15.7089],
  "mars": [-42.3186, 52.8865]
};

Celestial.eulerAngles = function() { return eulerAngles; };
Celestial.poles = function() { return poles; };
