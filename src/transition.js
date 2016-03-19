/* global redraw, interval, projection, container, width, height */
function animate() {
  var reqAnimFrame = window.mozRequestAnimationFrame  || window.webkitRequestAnimationFrame || 
                     window.msRequestAnimationFrame || window.oRequestAnimationFrame;

    reqAnimFrame(animate);
    redraw();
}

function change(projection) {
  clearInterval(interval);
  update(projection);
}

function update(toProjection) {
  container.selectAll("path").transition()
      .duration(750)
      .attrTween("d", projectionTween(projection, toProjection));
}

function projectionTween(projection0, projection1) {
  return function(d) {
    var t = 0;

    var projection = d3.geo.projection(project)
        .scale(1)
        .translate([width / 2, height / 2]);

    var path = d3.geo.path()
        .projection(projection);

    function project(λ, φ) {
      λ *= 180 / Math.PI; φ *= 180 / Math.PI;
      var p0 = projection0([λ, φ]), p1 = projection1([λ, φ]);
      return [(1 - t) * p0[0] + t * p1[0], (1 - t) * -p0[1] + t * -p1[1]];
    }

    return function(_) {
      t = _;
      return path(d);
    };
  };
}