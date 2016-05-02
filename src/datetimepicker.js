
var datetimepicker = function() {
  var date = new Date(), 
      tzFormat = d3.time.format("%Z"),
      tz = [{"−12:00":720}, {"−11:00":660}, {"−10:00":600}, {"−09:30":570}, {"−09:00":540}, {"−08:00":480}, {"−07:00":420}, {"−06:00":360}, {"−05:00":300}, {"−04:30":270}, {"−04:00":240}, {"−03:30":210}, {"−03:00":180}, {"−02:00":120}, {"−01:00":60}, {"±00:00":0}, {"+01:00":-60}, {"+02:00":-120}, {"+03:00":-180}, {"+03:30":-210}, {"+04:00":-240}, {"+04:30":-270}, {"+05:00":-300}, {"+05:30":-330}, {"+05:45":-345}, {"+06:00":-360}, {"+06:30":-390}, {"+07:00":-420}, {"+08:00":-480}, {"+08:30":-510}, {"+08:45":-525}, {"+09:00":-540}, {"+09:30":-570}, {"+10:00":-600}, {"+10:30":-630}, {"+11:00":-660}, {"+12:00":-720}, {"+12:45":-765}, {"+13:00":-780}, {"+14:00":-840}];
    
  var cal = d3.select("#celestial-form").append("div").attr("id", "celestial-date");
  var days = cal.append("div").attr("id", "cal");
  
  month(date.getFullYear(), date.getMonth());
  
  
  function month(yr, mo) {
    var curdt = new Date(yr, mo, 1),
        days = d3.select("#cal");
        
    curdt.setDate(curdt.getDate() - curdt.getDay());
    var nd = days.node();
    while (nd.firstChild) nd.removeChild(nd.firstChild);
    
    for (var i=0; i<35; i++) {
      curmon = curdt.getMonth(), curday = curdt.getDay(), curdate = curdt.getDate();
      days.append("div").classed({
        "date": true, 
        "grey": curmon !== mo,
        "weekend": curmon === mo && (curday === 0 || curday === 6),
        "today": curmon === mo && curdate === new Date().getDate(),
        "selected": curmon === mo && curdate === date.getDate()
      })
      .html(curdt.getDate().toString());
      
      curdt.setDate(curdt.getDate()+1);
    }
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

  function settimezone(offset) {
    var utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    var nd = new Date(utc + (600000*offset));
    return nd;
  } 
 
  this.show = function(src, dt) {
    var nd = d3.select("#celestial-date"),
        ptop = src.offsetTop,
        left = src.offsetLeft,
        top = ptop - nd.node().offsetHeight;
    
    date.setTime(dt.valueOf());
    month(date.getFullYear(), date.getMonth());
    
    nd.style({"top": px(top), "left": px(left), "opacity": 1});  
    return dt;
  }
  //return datetimepicker;
}