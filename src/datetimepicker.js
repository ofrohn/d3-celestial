
var datetimepicker = function(callback) {
  var date = new Date(), 
      tzFormat = d3.time.format("%Z"),
      tz = [{"−12:00":720}, {"−11:00":660}, {"−10:00":600}, {"−09:30":570}, {"−09:00":540}, {"−08:00":480}, {"−07:00":420}, {"−06:00":360}, {"−05:00":300}, {"−04:30":270}, {"−04:00":240}, {"−03:30":210}, {"−03:00":180}, {"−02:00":120}, {"−01:00":60}, {"±00:00":0}, {"+01:00":-60}, {"+02:00":-120}, {"+03:00":-180}, {"+03:30":-210}, {"+04:00":-240}, {"+04:30":-270}, {"+05:00":-300}, {"+05:30":-330}, {"+05:45":-345}, {"+06:00":-360}, {"+06:30":-390}, {"+07:00":-420}, {"+08:00":-480}, {"+08:30":-510}, {"+08:45":-525}, {"+09:00":-540}, {"+09:30":-570}, {"+10:00":-600}, {"+10:30":-630}, {"+11:00":-660}, {"+12:00":-720}, {"+12:45":-765}, {"+13:00":-780}, {"+14:00":-840}],
      months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      days = ["Su", "M", "T", "W", "Th", "F", "Sa"],
      years = getYears(date);
    
  var cal = d3.select("#celestial-form").append("div").attr("id", "celestial-date");
  nav("left");
  monSel();
  yrSel();
  nav("right");
  
  var cal = cal.append("div").attr("id", "cal");

  daySel(date.getFullYear(), date.getMonth());
  
  
  function daySel(yr, mo) {
    var curdt = new Date(yr, mo, 1),
        cal = d3.select("#cal"),
        today = new Date();
        
    curdt.setDate(curdt.getDate() - curdt.getDay());
    var nd = cal.node();
    while (nd.firstChild) nd.removeChild(nd.firstChild);
    
    for (var i=0; i<7; i++) {
      cal.append("div").classed({"date": true, "weekday": true}).html(days[i]);
    }
    for (var i=0; i<42; i++) {
      var curmon = curdt.getMonth(), curday = curdt.getDay();
      cal.append("div").classed({
        "date": true, 
        "grey": curmon !== mo,
        "weekend": curmon === mo && (curday === 0 || curday === 6),
        "today": dateDiff(curdt, today) === 0,
        "selected": dateDiff(curdt, date) === 0
      }).on("click", pick)
      .html(curdt.getDate().toString());
      
      curdt.setDate(curdt.getDate()+1);
    }
  }

  function yrSel() { 
    var sel = cal.append("select").attr("id", "yr").on("change", navigate),
        selected = 0,
        year = date.getFullYear();
        
    sel.selectAll('option').data(years).enter().append('option')
       .text(function (d, i) { 
         if (d === year) selected = i; 
         return d.toString(); 
       });
    sel.property("selectedIndex", selected);
  }

  function monSel() { 
    var sel = cal.append("select").attr("id", "mon").on("change", navigate),
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
    var lnk = cal.append("div").attr("id", dir).html (
      function() { return (dir === "left") ? "\u25C0" : "\u25B6"; 
    })
    .on("click", function() {
      mon = $("mon"), yr = $("yr"),
      year = yr[yr.selectedIndex].value;
      
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
      daySel(yr[yr.selectedIndex].value, mon.selectedIndex);
    })
  }
  
  function tzSel() { 
    cal.append("label").attr("title", "Time zone offset from UTC").attr("for", "tz").html(" Time zone");
    var sel = cal.append("select").attr("id", "tz").on("change", settimezone),
        selected = 0,
        timezone = dt.getTimezoneOffset();
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
    //yr, mon, back, fwd
    daySel(date.getFullYear(), date.getMonth());
    
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
        top = src.offsetTop - nd.offsetHeight;
  
    if (nd.offsetTop === -9999) {
      date.setTime(dt.valueOf());
      daySel(date.getFullYear(), date.getMonth());
      d3.select("#celestial-date").style({"top": px(top), "left": px(left), "opacity": 1});  
    } else {
      nd.style.opacity = 0;
      setTimeout(function() { $("celestial-date").style.top = px(-9999); }, 600);
    }
  }
  
  function pick() {
    callback(date);
    
  } 
  //return datetimepicker;
}