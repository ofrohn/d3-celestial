//display settings form

function form(cfg) {
  var ctrl = d3.select("#form").append("div").attr("class", "ctrl");
  var frm = ctrl.append("form").attr("id", "params").attr("name", "params").attr("method", "get").attr("action" ,"#");
  var col = frm.append("div").attr("class", "col");
  
  col.append("label").attr("title", "Map width, 0 indicates full width").attr("htmlFor", "width").html("Width");
  col.append("input").attr("type", "number").attr("maxlength", "4").attr("name", "width").attr("value", "");
  col.append("span").html("\u2009px");

  col.append("label").attr("title", "Map projection, (hemi) indicates hemispherical projection").attr("htmlFor", "projection").html("Projection");
  var sel = col.append("select").attr("name", "projection").attr("id", "projection").on('change', null);

  <label title="Coordinate space in which the map is displayed">Coordinates <select name="transform" id="transform"></select></label><br>
  <label title="Center coordinates in selected coordinate space">Center <input type="number" name="centerx" id="centerx" value="" max="24" min="0" step="0.1"> <span id="cxunit">h</span><input type="number" name="centery" id="centery" value="" max="90" min="-90" step="0.1"> &deg;</label>

}