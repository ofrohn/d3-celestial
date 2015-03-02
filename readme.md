# Celestial map with D3.js

### Usage


```js
var config = { 
  width: 1024,     //Default width; height is determined by projection
  projection: "aitoff",  //Map projection used: see below
  transform: null, //*TBI* Coordinate transformation euler angles: euler.ecliptic, euler.galactic, euler.supergalactic, [0,0,0]
  bgcolor: "#000", //Background color css value
  stars: {
    show: true,    //Show stars
    limit: 6,      //up to maximum stellar magnitude
    colors: true,  //Show stars in spectral colors, if not use "color"
    color: "#fff", //Default color for stars
    names: true,   //Show star names (css-class starname)
    proper: false, //Show proper names (if none shows designation)
    desig: true,   //Show designation (Bayer, Flamsteed, Variable star, Gliese, Draper, Hipparcos, whichever applies first)
    namelimit: 2,  //Maximum magnitude with name
    data: 'data/stars.6.json' //Data source for stellar data
  },
  dsos: {
    show: true,    //Show Deep Space Objects
    limit: 6,      //up to maximum magnitude
    names: true,   //Show DSO names
    desig: true,   //Show short DSO names
    namelimit: 6,  //Maximum magnitude with name
    data: 'data/dsos.bright.json'  //Data source for DSOs
  },
  constellations: {
    show: true,    //Show constellations 
    names: true,   //Show constellation names (css-class: constname)
    desig: true,   //Show short constellation names (3 letter designations)
    lines: true,   //Show constellation lines (css-class: constline)
    bounds: false  //Show constellation boundaries (css-class: boundaryline)
  },
  mw: {
    show: true,    //Show Milky Way as filled polygons (css-class: mw)
    opacity: 0.55  //Maximum opacity
  },
  lines: {
    graticule: true,  //Show graticule lines (css-class: gridline)
    equatorial: false,  //Show equatorial plane (css-class: equatorial)
    ecliptic: true,   //Show ecliptic plane (css-class: ecliptic)
    galactic: false,  //Show galactic plane (css-class: galactic)
    supergalactic: false  //Show supergalactic plane (css-class: supergalactic)
  }
};

Celestial.display(config);
```


__Supported projections:__ airy, aitoff, armadillo, august, azimuthalEqualArea, azimuthalEquidistant, baker, berghaus, boggs, bonne, bromley, collignon, craig, craster, cylindricalEqualArea, cylindricalStereographic, eckert1, eckert2, eckert3, eckert4, eckert5, eckert6, eisenlohr, equirectangular, fahey, foucaut, ginzburg4, ginzburg5, ginzburg6, ginzburg8, ginzburg9, gringorten, hammer, hatano, healpix, hill, homolosine, kavrayskiy7, lagrange, larrivee, laskowski, loximuthal, mercator, miller, mollweide, mtFlatPolarParabolic, mtFlatPolarQuartic, mtFlatPolarSinusoidal, naturalEarth, nellHammer, orthographic, patterson, polyconic, rectangularPolyconic, robinson, sinusoidal, stereographic, times, twoPointEquidistant, vanDerGrinten, vanDerGrinten2, vanDerGrinten3, vanDerGrinten4, wagner4, wagner6, wagner7, wiechel, winkel3
most of these need the extension [d3.geo.projections](https://github.com/d3/d3-geo-projection/)  

### Files

__GeoJSON data files__

All positions

* `stars.6.json` Stars down to 6th magnitude \[1\]
* `stars.7.json` Stars down to 7th magnitude \[1\]
  
* `dsos.6.json` Deep space objects down to 6th magnitude \[2\]
* `dsos.7.json` Deep space objects down to 7th magnitude \[2\]
* `dsos.bright.json` Some of the brightest showpiece DSOs of my own choosing
  
* `constellations.json` Constellation data  \[3\]
* `constellations.bounds.json` Constellation boundaries \[4\]
* `constellations.lines.json` Constellation lines \[3\]
  
* `mw.json` Milky way outlines in 5 brightness steps \[5\]

### Sources

\[1\] XHIP: An Extended Hipparcos Compilation; Anderson E., Francis C. (2012) [VizieR catalogue V/137D](http://cdsarc.u-strasbg.fr/viz-bin/Cat?V/137D)  
\[2\] [Saguaro Astronomy Club Database version 8.1](http://www.saguaroastro.org/content/downloads.htm)  
\[3\] [IAU Constellation page](http://www.iau.org/public/themes/constellations/), name positions and some line modifications by me  
\[4\] Catalogue of Constellation Boundary Data; Davenhall A.C., Leggett S.K. (1989) [VizieR catalogue VI/49/](http://vizier.cfa.harvard.edu/viz-bin/Cat?VI/49)  
\[5\] [Milky Way Outline Catalog](http://www.skymap.com/milkyway_cat.htm), Jose R. Vieira  

all data converted to GeoJSON at J2000 epoch 

And thanks to Jason Davies for [d3.geo.zoom](http://www.jasondavies.com/maps/rotate/), which saved me some major headaches in figuring out how to rotate/zomm the map.
