/* global τ, deg2rad */
function $(id) { return document.getElementById(id); }
function px(n) { return n + "px"; } 
function Round(x, dg) { return(Math.round(Math.pow(10,dg)*x)/Math.pow(10,dg)); }
function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }
function pad(n) { return n < 10 ? '0' + n : n; }


function has(o, key) { return o !== null && hasOwnProperty.call(o, key); }
function when(o, key, val) { return o !== null && hasOwnProperty.call(o, key) ? o[key] : val; }
function isNumber(n) { return !isNaN(parseFloat(n)) && isFinite(n); }
function isArray(o) { return Object.prototype.toString.call(o) === "[object Array]"; }
function isObject(o) { var type = typeof o;  return type === 'function' || type === 'object' && !!o; }
function isFunction(o) { return typeof o == 'function' || false; }

function findPos(o) {
  var l = 0, t = 0;
  if (o.offsetParent) {
    do {
      l += o.offsetLeft;
      t += o.offsetTop;
    } while ((o = o.offsetParent) !== null);
  }
  return [l, t];
}

function hasParent(t, id){
  while(t.parentNode){
    if(t.id === id) return true;
    t = t.parentNode;
  }
  return false;
}

function attach(node, event, func) {
  if (node.addEventListener) node.addEventListener(event, func, false);
  else node.attachEvent("on" + event, func); 
}

function stopPropagation(e) {
  if (typeof e.stopPropagation != "undefined") e.stopPropagation();
  else e.cancelBubble = true;
}

function dateDiff(dt1, dt2, type) {
  var diff = dt2.valueOf() - dt1.valueOf(),
      tp = type || "d";
  switch (tp) {
    case 'y': case 'yr': diff /= 31556926080; break;
    case 'm': case 'mo': diff /= 2629800000; break;
    case 'd': case 'dy': diff /= 86400000; break;
    case 'h': case 'hr': diff /= 3600000; break;
    case 'n': case 'mn': diff /= 60000; break;
    case 's': case 'sec': diff /= 1000; break;
    case 'ms': break;    
  }
  return Math.floor(diff);
}

function interpolateAngle(a1, a2, t) {
  a1 = (a1*deg2rad +τ) % τ;
  a2 = (a2*deg2rad + τ) % τ;
  var diff = Math.abs(a1 - a2);
  if (diff > Math.PI) {
    if (a1 > a2) a1 = a1 - τ;
    else if (a2 > a1) a2 = a2 - τ;
  }
  return d3.interpolateNumber(a1/deg2rad, a2/deg2rad);
}