/* global Celestial, has */
//Add more JSON data to the map

Celestial.add = function(dat) {
  var res = {};
  //dat: {file: path, type:'json|raw', callback: func(), redraw: func()} 
  //or {file:file, size:null, shape:null, color:null}  TBI
  //  with size,shape,color: "prop=val:result;.." || function(prop) { .. return res; } 
  if (!has(dat, "type")) return console.log("Missing type");
  
  if ((dat.type === "dso" || dat.type === "json") && (!has(dat, "file") && !has(dat, "callback"))) return console.log("Can't add data file");
  if ((dat.type === "line" || dat.type === "raw") && !has(dat, "callback")) return console.log("Can't add line");
  
  if (has(dat, "file")) res.file = dat.file;
  res.type = dat.type;
  if (has(dat, "callback")) res.callback = dat.callback;
  if (has(dat, "redraw")) res.redraw = dat.redraw;
  Celestial.data.push(res);
};

Celestial.remove = function(i) {
  if (i !== null && i < Celestial.data.length) {
    return Celestial.data.splice(i,1);
  }
};

Celestial.clear = function() {
  Celestial.data = [];
};
