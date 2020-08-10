(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['d3', 'topojson'], function(d3, topojson) {
      return (root.geolocator = factory(d3, topojson, root));
    });
  } else if (typeof exports === 'object') {
    module.exports = factory(require('d3'), require('topojson'));
  } else {
    root.geolocator = factory(root.d3, root.topojson, root);
  }
}(this, function(d3, topojson, window) {
  'use strict';
  var originalGeolocator = null;
  if (window) originalGeolocator = window.geolocator;
  var plugins = [];

  var doDrawLoop = function(planet, canvas, hooks) {
    d3.timer(function() {
      if (planet.stopped) {
        return true;
      }

      planet.context.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < hooks.onDraw.length; i++) {
        hooks.onDraw[i]();
      }
    });
  };

  var initPlugins = function(planet, localPlugins) {
    // Add the global plugins to the beginning of the local ones
    for (var i = plugins.length - 1; i >= 0; i--) {
      localPlugins.unshift(plugins[i]);
    }

    // Load the default plugins if none have been loaded so far
    if (localPlugins.length === 0) {
      if (geolocator.plugins.earth)
        planet.loadPlugin(geolocator.plugins.earth());
      if (geolocator.plugins.pings)
        planet.loadPlugin(geolocator.plugins.pings());
    }

    for (i = 0; i < localPlugins.length; i++) {
      localPlugins[i](planet);
    }
  };

  var runOnInitHooks = function(planet, canvas, hooks) {
    // onInit hooks can be asynchronous if they take a parameter;
    // iterate through them one at a time
    if (hooks.onInit.length) {
      var completed = 0;
      var doNext = function(callback) {
        var next = hooks.onInit[completed];
        if (next.length) {
          next(function() {
            completed++;
            callback();
          });
        } else {
          next();
          completed++;
          setTimeout(callback, 0);
        }
      };
      var check = function() {
        if (completed >= hooks.onInit.length) doDrawLoop(planet, canvas, hooks);
        else doNext(check);
      };
      doNext(check);
    } else {
      doDrawLoop(planet, canvas, hooks);
    }
  };

  var startDraw = function(planet, canvas, localPlugins, hooks) {
    planet.canvas = canvas;
    planet.context = canvas.getContext('2d');

    if (planet.stopped !== true) {
      initPlugins(planet, localPlugins);
    }

    planet.stopped = false;
    runOnInitHooks(planet, canvas, hooks);
  };

  var geolocator = {
    plugins: {},

    noConflict: function() {
      window.geolocator = originalGeolocator;
      return geolocator;
    },

    loadPlugin: function(plugin) {
      plugins.push(plugin);
    },

    planet: function() {
      var localPlugins = [];
      var hooks = {
        onInit: [],
        onDraw: [],
        onStop: []
      };

      var planet = {
        plugins: {},

        draw: function(canvas) {
          startDraw(planet, canvas, localPlugins, hooks);
        },

        onInit: function(fn) {
          hooks.onInit.push(fn);
        },

        onDraw: function(fn) {
          hooks.onDraw.push(fn);
        },

        onStop: function(fn) {
          hooks.onStop.push(fn);
        },

        loadPlugin: function(plugin) {
          localPlugins.push(plugin);
        },

        stop: function() {
          planet.stopped = true;
          for (var i = 0; i < hooks.onStop.length; i++) {
            hooks.onStop[i](planet);
          }
        },

        withSavedContext: function(fn) {
          if (!this.context) {
            throw new Error("No canvas to fetch context for");
          }

          this.context.save();
          fn(this.context);
          this.context.restore();
        }
      };

      planet.projection = d3.geo.orthographic()
        .clipAngle(90);
      planet.path = d3.geo.path().projection(planet.projection);

      return planet;
    }
  };
  geolocator.plugins.topojson = function(config) {
    return function(planet) {
      planet.plugins.topojson = {};

      planet.onInit(function(done) {
        if (config.world) {
          planet.plugins.topojson.world = config.world;
          setTimeout(done, 0);
        } else {
          var file = config.file || 'world-110m.json';
          d3.json(file, function(err, world) {
            if (err) {
              throw new Error("Could not load JSON " + file);
            }
            planet.plugins.topojson.world = world;
            done();
          });
        }
      });
    };
  };

  geolocator.plugins.oceans = function(config) {
    return function(planet) {
      planet.onDraw(function() {
        planet.withSavedContext(function(context) {
          context.beginPath();
          planet.path.context(context)({type: 'Sphere'});

          context.fillStyle = config.fill || 'black';
          context.fill();
        });
      });
    };
  };

  geolocator.plugins.land = function(config) {
    return function(planet) {
      var land = null;

      planet.onInit(function() {
        var world = planet.plugins.topojson.world;
        land = topojson.feature(world, world.objects.land);
      });

      planet.onDraw(function() {
        planet.withSavedContext(function(context) {
          context.beginPath();
          planet.path.context(context)(land);

          if (config.fill !== false) {
            context.fillStyle = config.fill || 'white';
            context.fill();
          }

          if (config.stroke) {
            if (config.lineWidth) context.lineWidth = config.lineWidth;
            context.strokeStyle = config.stroke;
            context.stroke();
          }
        });
      });
    };
  };

  geolocator.plugins.borders = function(config) {
    return function(planet) {
      var borders = null;
      var borderFns = {
        internal: function(a, b) {
          return a.id !== b.id;
        },
        external: function(a, b) {
          return a.id === b.id;
        },
        both: function(a, b) {
          return true;
        }
      };

      planet.onInit(function() {
        var world = planet.plugins.topojson.world;
        var countries = world.objects.countries;
        var type = config.type || 'internal';
        borders = topojson.mesh(world, countries, borderFns[type]);
      });

      planet.onDraw(function() {
        planet.withSavedContext(function(context) {
          context.beginPath();
          planet.path.context(context)(borders);
          context.strokeStyle = config.stroke || 'gray';
          if (config.lineWidth) context.lineWidth = config.lineWidth;
          context.stroke();
        });
      });
    };
  };

  geolocator.plugins.earth = function(config) {
    config = config || {};
    var topojsonOptions = config.topojson || {};
    var oceanOptions = config.oceans || {};
    var landOptions = config.land || {};
    var bordersOptions = config.borders || {};

    return function(planet) {
      geolocator.plugins.topojson(topojsonOptions)(planet);
      geolocator.plugins.oceans(oceanOptions)(planet);
      geolocator.plugins.land(landOptions)(planet);
      geolocator.plugins.borders(bordersOptions)(planet);
    };
  };

  geolocator.plugins.lakes = function(options) {
    options = options || {};
    var lakes = null;

    return function(planet) {
      planet.onInit(function() {
        // We can access the data loaded from the TopoJSON plugin
        // on its namespace on `planet.plugins`. We're loading a custom
        // TopoJSON file with an object called "ne_110m_lakes".
        var world = planet.plugins.topojson.world;
        lakes = topojson.feature(world, world.objects.ne_110m_lakes);
      });

      planet.onDraw(function() {
        planet.withSavedContext(function(context) {
          context.beginPath();
          planet.path.context(context)(lakes);
          context.fillStyle = options.fill || 'black';
          context.fill();
        });
      });
    };
  };

  geolocator.plugins.pings = function(config) {
    var pings = [];
    config = config || {};

    var addPing = function(lng, lat, options) {
      options = options || {};
      options.color = options.color || config.color || 'white';
      options.angle = options.angle || config.angle || 5;
      options.ttl   = options.ttl   || config.ttl   || 2000;
      var ping = { time: new Date(), options: options };
      if (config.latitudeFirst) {
        ping.lat = lng;
        ping.lng = lat;
      } else {
        ping.lng = lng;
        ping.lat = lat;
      }
      pings.push(ping);
    };

    var drawPings = function(planet, context, now) {
      var newPings = [];
      for (var i = 0; i < pings.length; i++) {
        var ping = pings[i];
        var alive = now - ping.time;
        if (alive < ping.options.ttl) {
          newPings.push(ping);
          drawPing(planet, context, now, alive, ping);
        }
      }
      pings = newPings;
    };

    var drawPing = function(planet, context, now, alive, ping) {
      var alpha = 1 - (alive / ping.options.ttl);
      var color = d3.rgb(ping.options.color);
      color = "rgba(" + color.r + "," + color.g + "," + color.b + "," + alpha + ")";
      context.strokeStyle = color;
      var circle = d3.geo.circle().origin([ping.lng, ping.lat])
        .angle(alive / ping.options.ttl * ping.options.angle)();
      context.beginPath();
      planet.path.context(context)(circle);
      context.stroke();
    };

    return function (planet) {
      planet.plugins.pings = {
        add: addPing
      };

      planet.onDraw(function() {
        var now = new Date();
        planet.withSavedContext(function(context) {
          drawPings(planet, context, now);
        });
      });
    };
  };

  geolocator.plugins.zoom = function (options) {
    options = options || {};
    var noop = function() {};
    var onZoomStart = options.onZoomStart || noop;
    var onZoomEnd   = options.onZoomEnd   || noop;
    var onZoom      = options.onZoom      || noop;
    var afterZoom   = options.afterZoom   || noop;
    var startScale  = options.initialScale;
    var scaleExtent = options.scaleExtent || [50, 2000];

    return function(planet) {
      planet.onInit(function() {
        var zoom = d3.behavior.zoom()
          .scaleExtent(scaleExtent);

        if (startScale !== null && startScale !== undefined) {
          zoom.scale(startScale);
        } else {
          zoom.scale(planet.projection.scale());
        }

        zoom
          .on('zoomstart', onZoomStart.bind(planet))
          .on('zoomend', onZoomEnd.bind(planet))
          .on('zoom', function() {
            onZoom.call(planet);
            planet.projection.scale(d3.event.scale);
            afterZoom.call(planet);
          });
        d3.select(planet.canvas).call(zoom);
      });
    };
  };

  geolocator.plugins.drag = function(options) {
    options = options || {};
    var noop = function() {};
    var onDragStart = options.onDragStart || noop;
    var onDragEnd   = options.onDragEnd   || noop;
    var onDrag      = options.onDrag      || noop;
    var afterDrag   = options.afterDrag   || noop;

    return function(planet) {
      planet.onInit(function() {
        var drag = d3.behavior.drag()
          .on('dragstart', onDragStart.bind(planet))
          .on('dragend', onDragEnd.bind(planet))
          .on('drag', function() {
            onDrag.call(planet);
            var dx = d3.event.dx;
            var dy = d3.event.dy;
            var rotation = planet.projection.rotate();
            var radius = planet.projection.scale();
            var scale = d3.scale.linear()
              .domain([-1 * radius, radius])
              .range([-90, 90]);
            var degX = scale(dx);
            var degY = scale(dy);
            rotation[0] += degX;
            rotation[1] -= degY;
            if (rotation[1] > 90)   rotation[1] = 90;
            if (rotation[1] < -90)  rotation[1] = -90;
            if (rotation[0] >= 180) rotation[0] -= 360;
            planet.projection.rotate(rotation);
            afterDrag.call(planet);
          });
        d3.select(planet.canvas).call(drag);
      });
    };
  };

  geolocator.plugins.mouse = function(options) {
    options = options || {};
    var noop = function() {},
        onClick = options.onClick || noop,
        onMousedown = options.onMousedown || noop,
        onMousemove = options.onMousemove || noop,
        onMouseup = options.onMouseup || noop;


    return function(planet) {
   
      planet.onInit(function() {
         d3.select(planet.canvas).on('click', onClick.bind(planet));
         d3.select(planet.canvas).on('mousedown', onMousedown.bind(planet));
         d3.select(planet.canvas).on('mousemove', onMousemove.bind(planet));
         d3.select(planet.canvas).on('mouseup', onMouseup.bind(planet));
      });

    };
  };

  
  geolocator.plugins.markers = function (config) {
    var marks = [];
    config = config || {};

    var addMark = function(lng, lat, options) {
      options = options || {};
      options.color = options.color || config.color || 'white';
      options.size = options.size || config.size || 5;
      var mark = { options: options };
      if (config.latitudeFirst) {
        mark.lat = lng;
        mark.lng = lat;
      } else {
        mark.lng = lng;
        mark.lat = lat;
      }
      marks.push(mark);
    };

    var removeMark = function(lng, lat) {
      if (lng === "*") {
        marks = [];
        return;
      }    
      if (arguments.length === 1 && lng < marks.length) {
        marks.splice(lng, 1);
        return;
      }
      if (arguments.length === 2) {
        for (var i=0; i <= marks.length; i++) {
          if (marks[i].lng === lng && marks[i].lat === lat) {
            marks.splice(i, 1);
            return;  
          }
        }
      }
    }

    var drawMarks = function(planet, context) {
      for (var i = 0; i < marks.length; i++) {
        var mark = marks[i];
        var rot = planet.projection.rotate(),
            center = [-rot[0], -rot[1]];
        //draw only if distance from center < 90deg
        var dist = d3.geo.distance(center, [mark.lng, mark.lat]);
        if (dist <= Math.PI/2) drawMark(planet, context, mark);
      }
    };

    var drawMark = function(planet, context, mark) {
      var color = mark.options.color,
          size = mark.options.size * 5,
          pos = planet.projection([mark.lng, mark.lat]);
          
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(pos[0], pos[1]);
      context.arc(pos[0], pos[1] - size, size/2, Math.PI, 0);
      context.fill();
      context.fillStyle = "#fff";
      context.beginPath();
      context.arc(pos[0], pos[1] - size, size/4, 0, 2 * Math.PI);
      context.fill();
    };

    return function (planet) {
      planet.plugins.markers = {
        add: addMark,
        remove: removeMark
      };

      planet.onDraw(function() {
        planet.withSavedContext(function(context) {
          drawMarks(planet, context);
        });
      });
    };
  };

  // This plugin will show concentric hemispheres with increasing opacities,
  // specifically to show the dark side with increasing levels of twilight.
  geolocator.plugins.hemisphere = function(options) {
    var pos = {},
        options = options || {};
        
    options.color = options.color || 'black';
    options.alpha = options.alpha || 0.12;
    options.sun = options.sun || 1;

    var setOrigin = function(lng, lat) {
      pos.lng = lng;
      pos.lat = lat;
    };

    var drawHemisphere = function(context, planet, pos) {
      if (options.sun > 0) {
        context.fillStyle = "#ff0";
        context.lineStyle = "#000";
        var circle = d3.geo.circle().origin([pos.lng + 180, -pos.lat]).angle(1)();
        context.beginPath();
        planet.path.context(context)(circle);
        context.fill();
        context.stroke();
      }
      context.fillStyle = options.color;
      context.globalAlpha = options.alpha;

      for (var i = 0; i <= 3; i++) {
        circle = d3.geo.circle().origin([pos.lng, pos.lat]).angle(90 - i*6)();
        context.beginPath();
        planet.path.context(context)(circle);
        context.fill();
      }
    };

    return function(planet) {
      planet.plugins.hemisphere = {
        origin: setOrigin
      };
      planet.onInit(function() {});
      planet.onDraw(function() {
        if (!pos.hasOwnProperty("lat")) return;
        planet.withSavedContext(function(context) {
          drawHemisphere(context, planet, pos);
        });
      });
    };
  };

  geolocator.plugins.grid = function(config) {
    config = config || {};
    config.color = config.color || '#999';
    config.lineWidth = config.lineWidth || 0.25;

    return function(planet) {
      var graticule = null;
      
      planet.onInit(function() {
        graticule = d3.geo.graticule();
      });

      planet.onDraw(function() {
        planet.withSavedContext(function(context) {
          context.beginPath();
          planet.path(graticule());
          context.strokeStyle = config.color;
          context.lineWidth = config.lineWidth;
          context.stroke();
        });
      });
    };
  };
  return geolocator;
}));
