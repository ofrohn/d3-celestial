/* global Celestial */
var Canvas = {}; 

Canvas.symbol = function () {
  // parameters and default values
  var type = d3.functor("circle"), 
      size = d3.functor(64), 
      age = d3.functor(Math.PI), //crescent shape 0..2Pi
      color = d3.functor("#fff"),  
      text = d3.functor(""),  
      padding = d3.functor([2,2]),  
      pos;
  
  function canvas_symbol(context) {
    draw_symbol[type()](context);
  }
  
  var draw_symbol = {
    "circle": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/2;
      ctx.arc(pos[0], pos[1], r, 0, 2 * Math.PI);
      return r;
    },
    "square": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/1.7;
      ctx.moveTo(pos[0]-r, pos[1]-r);
      ctx.lineTo(pos[0]+r, pos[1]-r);
      ctx.lineTo(pos[0]+r, pos[1]+r);
      ctx.lineTo(pos[0]-r, pos[1]+r);
      ctx.closePath();
      return r;
    },
    "diamond": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/1.5;
      ctx.moveTo(pos[0], pos[1]-r);
      ctx.lineTo(pos[0]+r, pos[1]);
      ctx.lineTo(pos[0], pos[1]+r);
      ctx.lineTo(pos[0]-r, pos[1]);
      ctx.closePath();
      return r;
    },
    "triangle": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/Math.sqrt(3);
      ctx.moveTo(pos[0], pos[1]-r);
      ctx.lineTo(pos[0]+r, pos[1]+r);
      ctx.lineTo(pos[0]-r, pos[1]+r);
      ctx.closePath();
      return r;
    },
    "ellipse": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/2;
      ctx.save();
      ctx.translate(pos[0], pos[1]);
      ctx.scale(1.6, 0.8); 
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, 2 * Math.PI); 
      ctx.closePath();
      ctx.restore();      
      return r;
    },
    "marker": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/2;
      ctx.moveTo(pos[0], pos[1]-r);
      ctx.lineTo(pos[0], pos[1]+r);
      ctx.moveTo(pos[0]-r, pos[1]);
      ctx.lineTo(pos[0]+r, pos[1]);
      ctx.closePath();
      return r;
    },
    "cross-circle": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/2;
      ctx.moveTo(pos[0], pos[1]-s);
      ctx.lineTo(pos[0], pos[1]+s);
      ctx.moveTo(pos[0]-s, pos[1]);
      ctx.lineTo(pos[0]+s, pos[1]);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos[0], pos[1]);
      ctx.arc(pos[0], pos[1], r, 0, 2 * Math.PI);    
      ctx.closePath();
      return r;
    },
    "stroke-circle": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/2;
      ctx.moveTo(pos[0], pos[1]-s);
      ctx.lineTo(pos[0], pos[1]+s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pos[0], pos[1]);
      ctx.arc(pos[0], pos[1], r, 0, 2 * Math.PI);    
      ctx.closePath();
      return r;
    }, 
    "crescent": function(ctx) {
      var s = Math.sqrt(size()), 
          r = s/2,
          ag = age(),
          ph = 0.5 * (1 - Math.cos(ag)),
          e = 1.6 * Math.abs(ph - 0.5) + 0.01,
          dir = ag > Math.PI,
          termdir = Math.abs(ph) > 0.5 ? dir : !dir; 

      ctx.save();
      ctx.fillStyle = "#557";
      ctx.moveTo(pos[0], pos[1]);
      ctx.arc(pos[0], pos[1], r, 0, 2 * Math.PI);    
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#eee";
      ctx.beginPath();
      ctx.moveTo(pos[0], pos[1]);
      ctx.arc(pos[0], pos[1], r, -Math.PI/2, Math.PI/2, dir); 
      ctx.scale(e, 1);
      ctx.arc(pos[0]/e, pos[1], r, Math.PI/2, -Math.PI/2, termdir); 
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      
      return r;
    } 
  };

  
  canvas_symbol.type = function(_) {
    if (!arguments.length) return type; 
    type = d3.functor(_);
    return canvas_symbol;
  };
  canvas_symbol.size = function(_) {
    if (!arguments.length) return size; 
    size = d3.functor(_);
    return canvas_symbol;
  };
  canvas_symbol.age = function(_) {
    if (!arguments.length) return age; 
    age = d3.functor(_);
    return canvas_symbol;
  };
  canvas_symbol.text = function(_) {
    if (!arguments.length) return text; 
    text = d3.functor(_);
    return canvas_symbol;
  };
  canvas_symbol.position = function(_) {
    if (!arguments.length) return; 
    pos = _;
    return canvas_symbol;
  };

  return canvas_symbol;
};

Celestial.Canvas = Canvas;


/*var color = "#fff", angle = 0, align = "center", baseline = "middle", font = "10px sans-serif", padding = [0,0], aPos, sText;

canvas.text = function () {

  function txt(ctx){
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    
    //var pt = projection(d.geometry.coordinates);
    if (angle) {
      canvas.save();     
      canvas.translate(aPos[0], aPos[1]);
      canvas.rotate(angle); 
      canvas.fillText(sText, 0, 0);
      canvas.restore();     
    } else
      canvas.fillText(sText, aPos[0], aPos[1]);
  }
  
  txt.angle = function(x) {
    if (!arguments.length) return angle * 180 / Math.PI;
    color = x  * Math.PI / 180;
    return txt;
  };  
  txt.color = function(s) {
    if (!arguments.length) return color;
    color = s;
    return txt;
  };  
  txt.align = function(s) {
    if (!arguments.length) return align;
    align = s;
    return txt;
  };
  txt.baseline = function(s) {
    if (!arguments.length) return baseline;
    baseline = s;
    return txt;
  };
  txt.padding = function(a) {
    if (!arguments.length) return padding;
    padding = a;
    return txt;
  };
  txt.text = function(s) {
    if (!arguments.length) return sText;
    sText = s;
    return txt;
  };
  txt.font = function(s) {
    if (!arguments.length) return font;
    font = s;
    return txt;
  };
  txt.style = function(o) {
    if (!arguments.length) return;
    if (o.fill) color = o.fill;
    if (o.font) font = o.font;
    return txt;
  }; 
  
}

  function ctxPath(d) {
    var pt;
    //d.map( function(axe, i) {
    context.beginPath();
    for (var i = 0; i < d.length; i++) {
      pt = projection(d[i]);
      if (i === 0)
        context.moveTo(pt[0], pt[1]);
      else
        context.lineTo(pt[0], pt[1]);
    }
    context.fill();
  }
  

  function ctxText(d, ang) {
    var pt = projection(d.geometry.coordinates);
    if (ang) {
      canvas.save();     
      canvas.translate(pt[0], pt[1]);
      canvas.rotate(Math.PI/2); 
      canvas.fillText(txt, 0, 0);
      canvas.restore();     
    } else
      canvas.fillText(d.properties.txt, pt[0], pt[1]);
  }
  

*/