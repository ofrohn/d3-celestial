var τ = Math.PI*2,
    halfπ = Math.PI/2,
    deg2rad = Math.PI/180;

Celestial.graticule = function(svg, path, trans) {
  //d3.geo.circle graticule [0,90]/10..170deg + [0..180,0]/90deg

  var i;
  
  if (!trans || trans == "equatorial") { return; }
  for (i=10; i<=170; i+=10) {
    svg.append("path")
       .datum( d3.geo.circle().angle([i]).origin(poles[trans]) )
       .attr("class", 'gridline')
       .attr("d", path);
  }
  for (i=10; i<=180; i+=10) {
    svg.append("path")
       .datum( d3.geo.circle().angle([90]).origin(Celestial.transformDeg([i,0], euler["inverse " + trans])) )
       .attr("class", 'gridline')
       .attr("d", path);    
  }  
};

Celestial.transformDeg = function(c, euler) {
  var res = Celestial.transform( c.map( function(d) { return d * deg2rad; } ), euler);
  return res.map( function(d) { return d / deg2rad; } );
};

//Transform equatorial into any coordinates
Celestial.transform = function(c, euler) {
  var x, y, z, β, γ, λ, φ, dψ, ψ, θ,
      ε = 1.0e-5;

  if (!euler) { return c; }

  λ = c[0];  // celestial longitude 0..2pi
  if (λ < 0) { λ += τ; }
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
  ψ = (γ + dψ); 
  if (ψ > Math.PI) { ψ -= τ; } 
  
  if (λ % Math.PI === 0) {
    θ = φ + Math.cos(λ) * β;
    if (θ > halfπ) { θ = Math.PI - θ; }
    if (θ < -halfπ) { θ = -Math.PI - θ; }
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