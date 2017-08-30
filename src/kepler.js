/* global transform, Trig, Moon, deg2rad, dateParse, has, halfπ, τ */
var gmdat = {
  "sol": 0.0002959122082855911025,  // AU^3/d^2
  "mer": 164468599544771, //km^3/d^2
  "ven": 2425056445892137,
  "ter": 2975536307796296,
  "lun": 36599199229256,
  "mar": 319711652803400,
  "cer": 467549107200,
  "ves": 129071530155,
  "jup": 945905743547733000,
  "sat": 283225255921345000,
  "ura": 43256076555832200,
  "nep": 51034453325494200,
  "plu": 7327611364884,
  "eri": 8271175680000
}, 
symbols = {
  "sol":"\u2609", "mer":"\u263f", "ven":"\u2640", "ter":"\u2295", "lun":"\u25cf", "mar":"\u2642", "cer":"\u26b3", 
  "ves":"\u26b6", "jup":"\u2643", "sat":"\u2644", "ura":"\u2645", "nep":"\u2646", "plu":"\u2647", "eri":"\u26aa"
}, 

ε = 23.43928 * deg2rad,
sinε = Math.sin(ε),
cosε = Math.cos(ε),
kelements = ["a","e","i","w","M","L","W","N","n","ep","ref","lecl","becl","Tilt"];
/*
    ep = epoch (iso-date)
    N = longitude of the ascending node (deg) Ω
    i = inclination to the refrence plane, default:ecliptic (deg) 
    w = argument of periapsis (deg)  ω
    a = semi-major axis, or mean distance from parent body (AU,km)
    e = eccentricity (0=circle, 0-1=ellipse, 1=parabola, >1=hyperbola ) (-)
    M = mean anomaly (0 at periapsis; increases uniformly with time) (deg)
    n = mean daily motion = 360/P (deg/day)
    
    W = N + w  = longitude of periapsis ϖ
    L = M + W  = mean longitude
    q = a*(1-e) = periapsis distance
    Q = a*(1+e) = apoapsis distance
    P = 2π * sqrt(a^3/GM) = orbital period (years)
    T = Epoch_of_M - (M(deg)/360_deg) / P  = time of periapsis
    v = true anomaly (angle between position and periapsis) ν
    E = eccentric anomaly
    
    Mandatory: a, e, i, N, w|W, M|L, dM|n
    
*/

var Kepler = function () {
  var gm = gmdat.sol, 
      parentBody = "sol", 
      elem = {}, dat = {},
      id, name, symbol;


  function kepler(date) {
    dates(date);
    if (id === "sol") {
      dat.x = 0;
      dat.y = 0;
      dat.z = 0;
      return kepler;
    }
    coordinates();
    return kepler;
  }

  var dates = function(date) {
    var dt;
    dat = [];
    if (date) {
      if (date instanceof Date) { dt = new Date(date.valueOf()); }
      else { dt = dateParse(date); }
    }
    if (!dt) { dt = new Date(); }
    dat.jd = JD(dt);
      
    dt = dateParse(elem.ep);
    if (!dt) dt = dateParse("2000-01-01");
    dat.jd0 = JD(dt);
    dat.d = dat.jd - dat.jd0;
    dat.cy = dat.d / 36525;
  };

  var coordinates = function() {
    var key;
    if (id === "lun") {
      dat = moon_elements(dat);
      if (!dat) return;
    } else {
      for (var i=0; i<kelements.length; i++) {
        key = kelements[i];
        if (!has(elem, key)) continue; 
        if (has(elem, "d"+key)) {
          dat[key] = elem[key] + elem["d"+key] * dat.cy;
        } else if (has(elem, key)) {
          dat[key] = elem[key];
        }
      }
      if (has(dat, "M") && !has(dat, "dM") && has(dat, "n")) {
        dat.M += (dat.n * dat.d);
      }
    }
    derive();
    trueAnomaly();
    cartesian();    
  };

  kepler.cartesian = function() {
    return dat;    
  };

  kepler.spherical = function() {
    spherical();
    return dat;    
  };

  kepler.equatorial = function(pos) {
    equatorial(pos);
    return dat;    
  };

  kepler.transpose = function() {
    transpose(dat);
    return dat;    
  };
  
  kepler.elements = function(_) {
    var key;
    
    if (!arguments.length) return elem;
    
    for (var i=0; i<kelements.length; i++) {
      key = kelements[i];
      if (!has(_, key)) continue; 
      elem[key] = _[key];
      
      if (key === "a" || key === "e") elem[key] *= 1.0; 
      else if (key !== "ref" && key !== "ep") elem[key] *= deg2rad;

      if (has(_, "d" + key)) {
        key = "d" + key;
        elem[key] = _[key];
        if (key === "da" || key === "de") elem[key] *= 1.0; 
        else elem[key] *= deg2rad;
      } 
    }
    return kepler;
  };

  kepler.parentBody = function(_) {
    if (!arguments.length) return parentBody; 
    parentBody = _;
    gm = gmdat[parentBody];
    return kepler;
  };

  kepler.id = function(_) {
    if (!arguments.length) return id; 
    id = _;
    symbol = symbols[_];
    return kepler;
  };

  kepler.name = function(_) {
    if (!arguments.length) return name; 
    name = _;
    return kepler;
  };

  kepler.symbol = function(_) {
    if (!arguments.length) return symbol; 
    symbol = symbols[_];
    return kepler;
  };

  
  function near_parabolic(E, e) {
    var anom2 = e > 1.0 ? E*E : -E*E,
        term = e * anom2 * E / 6.0,
        rval = (1.0 - e) * E - term,
        n = 4;

    while(Math.abs(term) > 1e-15) {
      term *= anom2 / (n * (n + 1));
      rval -= term;
      n += 2;
    }
    return(rval);
  }

  function anomaly() {
    var curr, err, trial, tmod,
        e = dat.e, M = dat.M,
        thresh = 1e-8,
        offset = 0.0, 
        delta_curr = 1.9, 
        is_negative = false, 
        n_iter = 0;

    if (!M) return(0.0); 

    if (e < 1.0) {
      if (M < -Math.PI || M > Math.PI) {
        tmod = Trig.normalize0(M);
        offset = M - tmod;
        M = tmod;
      }

      if (e < 0.9) {   
        curr = Math.atan2(Math.sin(M), Math.cos(M) - e);
        do {
          err = (curr - e * Math.sin(curr) - M) / (1.0 - e * Math.cos(curr));
          curr -= err;
        } while (Math.abs(err) > thresh);
        return curr; // + offset;
      }
    }

    if ( M < 0.0) {
      M = -M;
      is_negative = true;
    }

    curr = M;
    thresh = thresh * Math.abs(1.0 - e);
               /* Due to roundoff error,  there's no way we can hope to */
               /* get below a certain minimum threshhold anyway:        */
    if ( thresh < 1e-15) { thresh = 1e-15; }
    if ( (e > 0.8 && M < Math.PI / 3.0) || e > 1.0) {   /* up to 60 degrees */
      trial = M / Math.abs( 1.0 - e);

      if (trial * trial > 6.0 * Math.abs(1.0 - e)) {  /* cubic term is dominant */
        if (M < Math.PI) {
          trial = Math.pow(6.0 * M, 1/3);
        } else {       /* hyperbolic w/ 5th & higher-order terms predominant */
          trial = Trig.asinh( M / e);
        }
      }
      curr = trial;
    }
    if (e > 1.0 && M > 4.0) {   /* hyperbolic, large-mean-anomaly case */
      curr = Math.log(M);
    }
    if (e < 1.0) {
      while(Math.abs(delta_curr) > thresh) {
        if ( n_iter++ > 8) {
          err = near_parabolic(curr, e) - M;
        } else {
          err = curr - e * Math.sin(curr) - M;
        }
        delta_curr = -err / (1.0 - e * Math.cos(curr));
        curr += delta_curr;
      }
    } else {
      while (Math.abs(delta_curr) > thresh) {
        if (n_iter++ > 7) {
          err = -near_parabolic(curr, e) - M;
        } else {
          err = e * Trig.sinh(curr) - curr - M;
        }
        delta_curr = -err / (e * Trig.cosh(curr) - 1.0);
        curr += delta_curr;
      }
    }
    return( is_negative ? offset - curr : offset + curr);
  }

  function trueAnomaly() {
    var x, y, r0, g, t;

    if (dat.e === 1.0) {   /* parabolic */
      t = dat.jd0 - dat.T;
      g = dat.w0 * t * 0.5;

      y = Math.pow(g + Math.sqrt(g * g + 1.0), 1/3);
      dat.v = 2.0 * Math.atan(y - 1.0 / y);
    } else {          /* got the mean anomaly;  compute eccentric,  then true */
      dat.E = anomaly();
      if (dat.e > 1.0) {    /* hyperbolic case */
        x = (dat.e - Trig.cosh(dat.E));
        y = Trig.sinh(dat.E);
      } else {          /* elliptical case */
        x = (Math.cos(dat.E) - dat.e);
        y =  Math.sin(dat.E);
      }
      y *= Math.sqrt(Math.abs(1.0 - dat.e * dat.e));
      dat.v = Math.atan2(y, x);
    }

    r0 = dat.q * (1.0 + dat.e);
    dat.r = r0 / (1.0 + dat.e * Math.cos(dat.v));
  }

  function derive() {
    if (!dat.hasOwnProperty("w")) {
      dat.w = dat.W - dat.N;
    }
    if (!dat.hasOwnProperty("M")) {
      dat.M = dat.L - dat.W;
    }
    if (dat.e < 1.0) { dat.M = Trig.normalize0(dat.M); }
    //dat.P = Math.pow(Math.abs(dat.a), 1.5);
    dat.P = τ * Math.sqrt(Math.pow(dat.a, 3) / gm) / 365.25;
    dat.T = dat.jd0 - (dat.M / halfπ) / dat.P;

    if (dat.e !== 1.0) {   /* for non-parabolic orbits: */
     dat.q = dat.a * (1.0 - dat.e);
     dat.t0 = dat.a * Math.sqrt(Math.abs(dat.a) / gm);
    } else {
     dat.w0 = (3.0 / Math.sqrt(2)) / (dat.q * Math.sqrt(dat.q / gm));
     dat.a = 0.0;
     dat.t0 = 0.0;
    }
    dat.am = Math.sqrt(gm * dat.q * (1.0 + dat.e));
  }

  function transpose() {
    if (!dat.ref || dat.ref === "ecl") {
      dat.tx = dat.x;
      dat.ty = dat.y;
      dat.tz = dat.z;
      return;
    }
    var a0 = dat.lecl,// - Math.PI/2,
        a1 = Math.PI/2 - dat.becl,
        angles = [0, a1, -a0];
    transform(dat, angles);
    var tp =  Trig.cartesian([dat.tl, dat.tb, dat.r]);
    dat.tx = tp.x;
    dat.ty = tp.y;
    dat.tz = tp.z;
  }

  function equatorial(pos) {
    ε = (23.439292 - 0.0130042 * dat.cy - 1.667e-7 * dat.cy * dat.cy + 5.028e-7 * dat.cy * dat.cy * dat.cy) * deg2rad;
    sinε = Math.sin(ε);
    cosε = Math.cos(ε);
    var o = (id === "lun") ? {x:0, y:0, z:0} : {x:pos.x, y:pos.y, z:pos.z};
    dat.xeq = dat.x - o.x;
    dat.yeq = (dat.y - o.y) * cosε - (dat.z - o.z) * sinε;
    dat.zeq = (dat.y - o.y) * sinε + (dat.z - o.z) * cosε;

    dat.ra = Trig.normalize(Math.atan2(dat.yeq, dat.xeq));
    dat.dec = Math.atan2(dat.zeq, Math.sqrt(dat.xeq*dat.xeq + dat.yeq*dat.yeq));
    if (id === "lun") dat = moon_corr(dat, pos);
    dat.pos = [dat.ra / deg2rad, dat.dec / deg2rad];
    dat.rt = Math.sqrt(dat.xeq*dat.xeq + dat.yeq*dat.yeq + dat.zeq*dat.zeq);
  }

  function cartesian() {
    var u = dat.v + dat.w;
    dat.x = dat.r * (Math.cos(dat.N) * Math.cos(u) - Math.sin(dat.N) * Math.sin(u) * Math.cos(dat.i));
    dat.y = dat.r * (Math.sin(dat.N) * Math.cos(u) + Math.cos(dat.N) * Math.sin(u) * Math.cos(dat.i));
    dat.z = dat.r * (Math.sin(u) * Math.sin(dat.i));
    return dat;
  }

  function spherical() {
    var lon = Math.atan2(dat.y, dat.x),
        lat = Math.atan2(dat.z, Math.sqrt(dat.x*dat.x + dat.y*dat.y));
    dat.l = Trig.normalize(lon);
    dat.b = lat;
    return dat; 
  }

  function polar2cart(pos) {
    var rclat = Math.cos(pos.lat) * pos.r;
    pos.x = rclat * Math.cos(pos.lon);
    pos.y = rclat * Math.sin(pos.lon);
    pos.z = pos.r * Math.sin(pos.lat);
    return pos;
  }

  
  function JD(dt) {  
    var yr = dt.getUTCFullYear(),
        mo = dt.getUTCMonth() + 1,
        dy = dt.getUTCDate(),
        frac = (dt.getUTCHours() - 12 + dt.getUTCMinutes()/60.0 + dt.getUTCSeconds()/3600.0) / 24, 
        IYMIN = -4799;        /* Earliest year allowed (4800BC) */

    if (yr < IYMIN) return -1; 
    var a = Math.floor((14 - mo) / 12),
        y = yr + 4800 - a,
        m = mo + (12 * a) - 3;
    var jdn = dy + Math.floor((153 * m + 2)/5) + (365 * y) + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    return jdn + frac;   
  }

  function mst(lon) {
    var l = lon || 0;  // lon=0 -> gmst
    return (18.697374558 + 24.06570982441908 * dat.d) * 15 + l;
  }
  
    
  function observer(pos) {
    var flat = 298.257223563,    // WGS84 flatening of earth
        re = 6378.137,           // GRS80/WGS84 semi major axis of earth ellipsoid
        h = pos.h || 0,
        cart = {},
        gmst = mst();
    
    var cosl = Math.cos(pos.lat),
        sinl = Math.sin(pos.lat),
        fl = 1.0 - 1.0 / flat;
    var fl2 = fl * fl;
    
    var u = 1.0 / Math.sqrt (cosl * cosl + fl2 * sinl * sinl),
        a = re * u + h,
        b = re * fl2 * u + h,
        r = Math.sqrt (a * a * cosl * cosl + b * b * sinl * sinl); // geocentric distance from earth center

    cart.lat = Math.acos (a * cosl / r); 
    cart.lon = pos.lon; 
    cart.r = h;
    
    if (pos.lat < 0.0) cart.lat *= -1; 

    polar2cart(cart); 

    // rotate around earth's polar axis to align coordinate system from Greenwich to vernal equinox
    var angle = gmst * deg2rad; // sideral time gmst given in hours. Convert to radians

    cart.x = cart.x * Math.cos(angle) - cart.y * Math.sin(angle);
    cart.y = cart.x * Math.sin(angle) + cart.y * Math.cos(angle);
    return(cart);
  }

  function moon_elements(dat) {
    if ((typeof Moon !== "undefined")) return Moon.elements(dat);
  }
  
  function moon_corr(dat, pos) {
    spherical();
    if ((typeof Moon !== "undefined")) return Moon.corr(dat, pos);
  }

  return kepler;  
};