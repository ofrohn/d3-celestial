/* global dateDiff, $, px */
var datetimepicker = function(callback) {
  var date = new Date(), 
      tzFormat = d3.time.format("%Z"),
      tz = [{"−12:00":720}, {"−11:00":660}, {"−10:00":600}, {"−09:30":570}, {"−09:00":540}, {"−08:00":480}, {"−07:00":420}, {"−06:00":360}, {"−05:00":300}, {"−04:30":270}, {"−04:00":240}, {"−03:30":210}, {"−03:00":180}, {"−02:00":120}, {"−01:00":60}, {"±00:00":0}, {"+01:00":-60}, {"+02:00":-120}, {"+03:00":-180}, {"+03:30":-210}, {"+04:00":-240}, {"+04:30":-270}, {"+05:00":-300}, {"+05:30":-330}, {"+05:45":-345}, {"+06:00":-360}, {"+06:30":-390}, {"+07:00":-420}, {"+08:00":-480}, {"+08:30":-510}, {"+08:45":-525}, {"+09:00":-540}, {"+09:30":-570}, {"+10:00":-600}, {"+10:30":-630}, {"+11:00":-660}, {"+12:00":-720}, {"+12:45":-765}, {"+13:00":-780}, {"+14:00":-840}],
      months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      days = ["Su", "M", "Tu", "W", "Th", "F", "Sa"],
      years = getYears(date),
      dateFormat = d3.time.format("%Y-%m-%d");
    
  var picker = d3.select("#celestial-form").append("div").attr("id", "celestial-date");
  nav("left");
  monSel();
  yrSel();
  nav("right");
  
  var cal = picker.append("div").attr("id", "cal");

  daySel(date.getFullYear(), date.getMonth());
  
  timeSel();
  
  function daySel(yr, mo) {
    var curdt = new Date(yr, mo, 1),
        cal = d3.select("#cal"),
        today = new Date();
    yr = parseInt(yr);   
    mo = parseInt(mo);   
    curdt.setDate(curdt.getDate() - curdt.getDay());
    var nd = cal.node();
    while (nd.firstChild) nd.removeChild(nd.firstChild);
    
    /*for (var i=0; i<7; i++) {
      cal.append("div").classed({"date": true, "weekday": true}).html(days[i]);
    }*/
    for (var i=0; i<42; i++) {
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
    var sel = picker.append("select").attr("id", "yr").on("change", navigate),
        selected = 0,
        year = date.getFullYear();
        
    sel.selectAll('option').data(years).enter().append('option')
       .text(function (d, i) { 
         if (d === year) selected = i; 
         return d.toString(); 
       });
    sel.property("selectedIndex", selected);
  }

  function selectYr(yr) {
    var sel = $("yr");
    for (var i=0; i<sel.childNodes.length; i++) {
      if (sel.childNodes[i].value == yr) {
        sel.selectedIndex = i;
        break;
      }
    }
    
  }
  
  function monSel() { 
    var sel = picker.append("select").attr("id", "mon").on("change", navigate),
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
    var lnk = picker.append("div").attr("id", dir).html(
      function() { return (dir === "left") ? "\u25C0" : "\u25B6"; 
    })
    .on("click", function() {
      var mon = $("mon"), yr = $("yr");
      
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
      daySel(yr.value, mon.value);
    });
  }

  function timeSel() { 
    picker.append("input").attr("type", "number").attr("id", "hr").attr("title", "Hours").attr("max", "23").attr("min", "0").attr("step", "1").attr("value", date.getHours()).on("change", pick);
    picker.append("span").html(":");

    picker.append("input").attr("type", "number").attr("id", "min").attr("title", "Minutes").attr("max", "59").attr("min", "0").attr("step", "1").attr("value", date.getMinutes()).on("change", pick);
    picker.append("span").html(":");
    
    picker.append("input").attr("type", "number").attr("id", "sec").attr("title", "Seconds").attr("max", "59").attr("min", "0").attr("step", "1").attr("value", date.getSeconds()).on("change", pick);

  }
  
  function tzSel() { 
    //picker.append("label").attr("title", "Time zone offset from UTC").attr("for", "tz").html(" Time zone");
    var sel = picker.append("select").attr("id", "tz").on("change", settimezone),
        selected = 0,
        timezone = date.getTimezoneOffset();
    sel.selectAll('option').data(tz).enter().append('option')
       .attr("value", function (d, i) { 
         var k = Object.keys(d)[0];
         if (d[k] === timezone) selected = i; 
         return d[k]; 
       })
       .text(function (d) { return Object.keys(d)[0]; });
    sel.property("selectedIndex", selected);
  }
  
  function getYears(dt) {
    var y0 = dt.getFullYear(), res = [];
    for (var i=y0-10; i<=y0+10; i++) res.push(i);
    return res;
  }  
  
  function navigate() {
    var mon = $("mon"), yr = $("yr");
    daySel(yr.value, mon.value);
  }
  
  function settimezone(offset) {
    var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    var nd = new Date(utc + (600000*offset));
    return nd;
  } 
  
  this.show = function(dt) {
    var nd = $("celestial-date"),
        src = $("datepick"),
        left = src.offsetLeft + src.offsetWidth - nd.offsetWidth,
        top = src.offsetTop - nd.offsetHeight - 1;
  
    if (nd.offsetTop === -9999) {
      date.setTime(dt.valueOf());
      daySel(date.getFullYear(), date.getMonth());
      d3.select("#celestial-date").style({"top": px(top), "left": px(left), "opacity": 1});  
    } else {
      vanish();
    }
    return false;
  };
  
  this.isVisible = function() {
    return $("celestial-date").offsetTop !== -9999;
  };

  this.hide = function() {
    vanish();
    return false;
  };
  
  function vanish() {
    $("celestial-date").style.opacity = 0;
    setTimeout(function() { $("celestial-date").style.top = px(-9999); }, 600);    
  }
  
  function pick() {
    var h = $("hr").value, m = $("min").value,
        s = $("sec").value;
    if (this.id && this.id.search(/^\d/) !== -1) {
      date = dateFormat.parse(this.id); 
      var yr = date.getFullYear(), mo = date.getMonth();
      daySel(yr, mo);
      selectYr(yr);
      $("mon").selectedIndex = mo;
    }
    date.setHours(h, m, s);    
    callback(date);
  } 
  //return datetimepicker;
};