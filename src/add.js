/* global Celestial, has */
//Add more JSON data to the map

Celestial.add = function(dat) {
  var res = {};
  //dat: {file:dat.file, callback:dat.callback, size:null, shape:null, color:null} );
  //callback func. || size:"prop=val:result;.." etc. || size:function(prop) { } etc.

  if (!has(dat, "file") || !has(dat, "type")) return console.log("Cant add no file");
  
  res.file = dat.file;
  res.type = dat.type;
  if (has(dat, "callback")) res.callback = dat.callback;
  if (has(dat, "redraw")) res.redraw = dat.redraw;
  Celestial.data.push(res);
};