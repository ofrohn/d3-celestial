/* global dateDiff, $, $form, px, testNumber, isNumber, parentElement */
var datetimepicker = function(cfg, callback) {
  var date = new Date(), 
      tzFormat = d3.time.format("%Z"),
      tz = [{"−12:00":-720}, {"−11:00":-660}, {"−10:00":-600}, {"−09:30":-570}, {"−09:00":-540}, {"−08:00":-480}, {"−07:00":-420}, {"−06:00":-360}, {"−05:00":-300}, {"−04:30":-270}, {"−04:00":-240}, {"−03:30":-210}, {"−03:00":-180}, {"−02:30":-150}, {"−02:00":-120}, {"−01:00":-60}, {"±00:00":0}, {"+01:00":60}, {"+02:00":120}, {"+03:00":180}, {"+03:30":210}, {"+04:00":240}, {"+04:30":270}, {"+05:00":300}, {"+05:30":330}, {"+05:45":345}, {"+06:00":360}, {"+06:30":390}, {"+07:00":420}, {"+08:00":480}, {"+08:30":510}, {"+08:45":525}, {"+09:00":540}, {"+09:30":570}, {"+10:00":600}, {"+10:30":630}, {"+11:00":660}, {"+12:00":720}, {"+12:45":765}, {"+13:00":780}, {"+14:00":840}],
      months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
      days = ["Su", "M", "Tu", "W", "Th", "F", "Sa"],
      years = getYears(date),
      dateFormat = d3.time.format("%Y-%m-%d"),
      dtrange = cfg.daterange || [];
    
  var picker = d3.select(parentElement + " ~ #celestial-form").append("div").attr("id", "celestial-date");
  nav("left");
  monSel();
  yrSel();
  nav("right");
  
  var cal = picker.append("div").attr("id", "cal");

  daySel();
  
  timeSel();
  tzSel();
  
  function daySel() {
    var mo = $form("mon").value, yr = $form("yr").value,
        curdt = new Date(yr, mo, 1),
        cal = d3.select(parentElement + " ~ #celestial-form").select("#cal"),
        today = new Date();
    yr = parseInt(yr);   
    mo = parseInt(mo);   
    curdt.setDate(curdt.getDate() - curdt.getDay());
    var nd = cal.node();
    while (nd.firstChild) nd.removeChild(nd.firstChild);
    
    for (var i=0; i<7; i++) {
      cal.append("div").classed({"date": true, "weekday": true}).html(days[i]);
    }
    for (i=0; i<42; i++) {
      var curmon = curdt.getMonth(), curday = curdt.getDay(), curid = dateFormat(curdt);
      cal.append("div").classed({
        "date": true, 
        "grey": curmon !== mo,
        "weekend": curmon === mo && (curday === 0 || curday === 6),
        "today": dateDiff(curdt, today) === 0,
        "selected": dateDiff(curdt, date) === 0
      }).attr("id", curid)
      .on("click", pick)
      .html(curdt.getDate().toString());
      
      curdt.setDate(curdt.getDate()+1);
    }
  }

  function yrSel() {     
    picker.append("select").attr("title", "Year").attr("id", "yr").on("change", daySel);   
    
    fillYrSel();
  }

  function fillYrSel() { 
    var sel = d3.select(parentElement + " ~ #celestial-form").select("select#yr"),
        year = date.getFullYear(),
        selected = 0,
        years = getYears(date);
        
    sel.selectAll("*").remove();    
    sel.selectAll('option').data(years).enter().append('option')
       .text(function (d, i) { 
         if (d === year) selected = i; 
         return d.toString(); 
       });
    sel.property("selectedIndex", selected);
  }
  
  function monSel() { 
    var sel = picker.append("select").attr("title", "Month").attr("id", "mon").on("change", daySel),
        selected = 0,
        month = date.getMonth();
    
    sel.selectAll('option').data(months).enter().append('option')
       .attr("value", function (d, i) { 
         if (i === month) selected = i; 
         return i; 
       })
       .text(function (d) { return d; });
    sel.property("selectedIndex", selected);
  }
  
  function nav(dir) {
    var lnk = picker.append("div").attr("id", dir).on("click", function () {
      var mon = $form("mon"), yr = $form("yr");
      
      if (dir === "left") {
        if (mon.selectedIndex === 0) {
          mon.selectedIndex = 11;
          yr.selectedIndex--;
        } else mon.selectedIndex--;
      } else {
        if (mon.selectedIndex === 11) {
          mon.selectedIndex = 0;
          yr.selectedIndex++;
        } else mon.selectedIndex++;
      }
      daySel();
    });
  }

  function timeSel() { 
    picker.append("input").attr("type", "number").attr("id", "hr").attr("title", "Hours").attr("max", "24").attr("min", "-1").attr("step", "1").attr("value", date.getHours()).on("change", function () { if (testNumber(this) === true) pick(); });

    picker.append("input").attr("type", "number").attr("id", "min").attr("title", "Minutes").attr("max", "60").attr("min", "-1").attr("step", "1").attr("value", date.getMinutes()).on("change", function () { if (testNumber(this) === true) pick(); });
    
    picker.append("input").attr("type", "number").attr("id", "sec").attr("title", "Seconds").attr("max", "60").attr("min", "-1").attr("step", "1").attr("value", date.getSeconds()).on("change", function () { if (testNumber(this) === true) pick(); });
  }
  
  function tzSel() { 
    var sel = picker.append("select").attr("title", "Time zone offset from UTC").attr("id", "tz").on("change", pick),
        selected = 15,
        tzOffset = -date.getTimezoneOffset();
    sel.selectAll('option').data(tz).enter().append('option')
       .attr("value", function (d, i) { 
         var k = Object.keys(d)[0];
         if (d[k] === tzOffset) selected = i; 
         return d[k]; 
       })
       .text(function (d) { return Object.keys(d)[0]; });
    sel.property("selectedIndex", selected);
  }
  
  function getYears(dt) {
    var r = getDateRange(dt.getFullYear()), res = [];
    for (var i = r[0]; i <= r[1]; i++) res.push(i);
    return res;
  }  
  
  function getDateRange(yr) {
    if (!dtrange || dtrange.length < 1) return [yr - 10, yr + 10];
    
    if (dtrange.length === 1 && isNumber(dtrange[0])) {
      if (dtrange[0] >= 100) return [dtrange[0] - 10, dtrange[0] + 10];
      else return [yr - dtrange[0], yr + dtrange[0]];
    }
    if (dtrange.length === 2 && isNumber(dtrange[0])&& isNumber(dtrange[1])) {
      if (dtrange[1] >= 100) return [dtrange[0], dtrange[1]];
      else return [dtrange[0] - dtrange[1], dtrange[0] + dtrange[1]];
    }      
    return [yr - 10, yr + 10];
  }

  function select(id, val) {
    var sel = $form(id);
    for (var i=0; i<sel.childNodes.length; i++) {
      if (sel.childNodes[i].value == val) {
        sel.selectedIndex = i;
        break;
      }
    }
  }
  
  function set(dt) {
     if (dt) date.setTime(dt.valueOf());
     
     select("yr", date.getFullYear());
     select("mon", date.getMonth());
     daySel();
     $form("hr").value = date.getHours();
     $form("min").value = date.getMinutes();
     $form("sec").value = date.getSeconds();
  } 
  
  this.show = function(dt, tz) {
    var nd = $form("celestial-date"),
        src = $form("datepick"),
        left = src.offsetLeft + src.offsetWidth - nd.offsetWidth,
        top = src.offsetTop - nd.offsetHeight - 1;
  
    if (nd.offsetTop === -9999) {
      date.setTime(dt.valueOf());
      select("tz", tz);
      set();
      d3.select(parentElement + " ~ #celestial-form").select("#celestial-date").style({"top": px(top), "left": px(left), "opacity": 1});  
      d3.select(parentElement + " ~ #celestial-form").select("#datepick").classed("active", true);
    } else {
      vanish();
    }
  };
  
  this.isVisible = function () {
    if (!document.getElementById("datepick")) return false;
    return d3.select(parentElement + " ~ #celestial-form").select("#datepick").classed("active") === true;
  };

  this.hide = function () {
    vanish();
  };
  
  function vanish() {
    d3.select(parentElement + " ~ #celestial-form").select("#celestial-date").style("opacity", 0);
    d3.select("#error").style( {top:"-9999px", left:"-9999px", opacity:0} ); 
    d3.select(parentElement + " ~ #celestial-form").select("#datepick").classed("active", false);
    setTimeout(function () { $form("celestial-date").style.top = px(-9999); }, 600);    
  }
  
  function pick() {
    var h = $form("hr").value, m = $form("min").value,
        s = $form("sec").value, tz = $form("tz").value;
        
    if (this.id && this.id.search(/^\d/) !== -1) {
      date = dateFormat.parse(this.id); 
    }
    fillYrSel();
    
    date.setHours(h, m, s);
    set();
    
    callback(date, tz);
  } 
  
  
};