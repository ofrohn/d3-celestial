var pi2 = Math.PI*2,
    pi_2 = Math.PI/2,
    deg2rad = Math.PI/180;

Celestial.plane = function(transformation) {
  var i, coords = [], tr,
  planeJson = function(id, coords) {
    var res = {type:"FeatureCollection", features:[]};
    res.features[0] = {type:"Feature", "id":id, properties:{}, geometry:{}};
    res.features[0].geometry.type = "LineString";
    res.features[0].geometry.coordinates = coords;
    return res;
  };
  
  if (transformation == "equatorial") {
    for (i=-180; i<=180; i+=1) { coords.push([i,0]); }
  } else {
    tr = "inverse " + transformation;
    if (!euler.hasOwnProperty(tr)) { return null; }
    for (i=-Math.PI; i<=Math.PI; i+=0.01) {
      coords.push( Celestial.transform([i,0], euler[tr]).map( function(rad) { return rad / deg2rad; }));
    }
  }
  return planeJson(transformation, coords);
};

//Transform equatorial into any coordinates
Celestial.transform = function(c, euler) {
  var x, y, z, β, γ, λ, φ, dψ, ψ, θ,
      ε = 1.0e-5;

  if (!euler) { return c; }

  λ = c[0];  // celestial longitude 0..2pi
  if (λ < 0) { λ += pi2; }
  φ = c[1];  // celestial latitude  -pi/2..pi/2
  
  λ -= euler[0];  // celestial longitude - celestial coordinates of the native pole
  β = euler[1];  // inclination between the poles (colatitude)
  γ = euler[2];  // native coordinates of the celestial pole
  
  x = Math.sin(φ) * Math.sin(β) - Math.cos(φ) * Math.cos(β) * Math.cos(λ);
  if (Math.abs(x) < ε) {
    x = -Math.cos(φ + β) + Math.cos(φ) * Math.cos(β) * (1 - Math.cos(λ));
  }
  y = -Math.cos(φ) * Math.sin(λ);
  
  if (x !== 0 || y !== 0) {
    dψ = Math.atan2(y, x);
  } else {
    dψ = λ - Math.PI;
  }
  ψ = (γ + dψ); //+ pi2) % (pi2));
  if (ψ > Math.PI) { ψ -= pi2; } 
  
  if (λ % Math.PI === 0) {
    θ = φ + Math.cos(λ) * β;
    if (θ > pi_2) { θ = Math.PI - θ; }
    if (θ < -pi_2) { θ = -Math.PI - θ; }
  } else {
    z = Math.sin(φ) * Math.cos(β) + Math.cos(φ) * Math.sin(β) * Math.cos(λ);
    if (Math.abs(z) > 0.99) {
      θ = Math.abs(Math.acos(Math.sqrt(x*x+y*y)));
      if (z < 0) { θ *= -1; }
    } else {
      θ = Math.asin(z);
    }
  }
  
  return [ψ, θ];
};


var euler = {
  "ecliptic": [270.0, 23.4393, 90.0],
  "inverse ecliptic": [90.0, 23.4393, 270.0],
  "galactic": [192.8595, 62.8717, 122.9319], 
  "inverse galactic": [238.9319, 62.8717, 192.8595],
  "supergalactic": [283.7542, 74.2911, 26.4504],
  "inverse supergalactic": [334.4504, 74.2911, 283.7542],
  "init": function() {
    for (var key in this) {
      if (this[key].constructor == Array) { 
        this[key] = this[key].map( function(val) { return val * deg2rad; } );
      }
    }
  },
  "add": function(name, ang) {
    if (!ang || !name || ang.length !== 3 || this.hasOwnProperty(name)) { return; }
    this[name] = ang.map( function(val) { return val * deg2rad; } );
    return this[name];
  }
};

euler.init();