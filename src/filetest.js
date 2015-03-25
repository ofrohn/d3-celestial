function testFile(fname) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () { callback(fname, this.responseText) };
  xhr.onerror = function () { window.alert("Browser doesn't support local file loading or file doesn't exist: " + fname + "\nSee readme.md"); };
  xhr.open("GET", fname, true);
  xhr.send();
}

function callback(file, json) {
  try {
    JSON.parse(json);
  } catch(e) {
    window.alert("Not a valid JSON file: " + file);
    console.log(e);
  }
};
