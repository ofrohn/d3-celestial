### Data Formats

For GeoJSON, all coordinates need to be given in degrees, longitude as [-180...180] deg, latitude as [-90...90] deg

__Stars__  
`stars.6.json`, `stars.8.json`; the number indicates limit magnitude  

```js
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "id": "",        // Hipparcos number
    "properties": {
      "name": "",    // Proper name
      "desig": "",   // Bayer, Flamsteed, variable, Gliese, HD, HIP
      "mag": "",     // Apparent magnitude
      "bv": ""       // b-v color index
    },
    "geometry": {  
      "type": "Point",
      "coordinates": [lon, lat]
    }
  }, { } ]
}
```

__DSOs__  
`dsos.6.json`, `dsos.14.json`: the number indicates limit magnitude  
`dsos.bright.json`: handselected  
`lf.json`: Local group  

```js
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "id": "",       // Short designator
    "properties": {
      "name": "",   // Proper name or most commonly used designator
      "desig": "",  // Designator
      "type": "",   // Object type: gg, g, s, s0, ds, i, e, oc, gc, dn, bn, sfr, rn, pn, snr
      "mag": "",    // Apparent magnitude, 999 if n.a.
      "dim": ""     // Angular dimensions in arcminutes
    },
    "geometry": {  
      "type": "Point",
      "coordinates": [lon, lat]
    }
  }, { } ]
}
```  
___Object type___ _gg_: galaxy cluster, _g_: galaxy, _s_: spiral galaxy, _s0_: lenticular gal., _ds_: dwarf gal., _i_: irregular gal., _e_: elliptical gal.,  
_oc_: open cluster, _gc_: globular cluster, _dn_: dark nebula, _bn_: bright nebula, _sfr_: star forming region, _rn_: reflection nebula, _pn_: planetary nebula, _snr_: supernova remnant  

___additional lg.json properties:___  
_sub_: Sub group membership: \[MW|M31|N3109|LG\]  (Milky way, Andromeda, NGC 3109, gen. LG)  
_pop_: MW popultions \[OH|YH|BD\] (Old halo, young halo, bulge & disk), M31 populations \[M31|GP\]  (gen. M31, great plane)  
_str_: Tidal streams \[Mag|Sgr|CMa|FLS\] (Magellanic Stream, Sagittarius Stream, Canis Major/Monoceros Stream, Fornax-Leo-Sculptor Great Circle)

__Constellations__  
`constellations.json`  

```js
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "id": "",           // 3-letter designator
    "properties": {
      "name": "",       // full name
      "genitive": "",   // for naming stars, not yet used
      "desig": "",      // 3-letter designator again
      "display": []     // [ra,dec,scale], for single constellation display (tbi)
    },
    "geometry": {  
      "type": "Point",
      "coordinates": [lon, lat]  // Position of const. name
    }      
  }, { } ]
}
```

__Constellation lines__  
`constellations.lines.json`  

```js
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "id": "",           // 3-letter designator of constellation
    "geometry": {  
      "type": "MultiLineString",
      "coordinates": [[[lon, lat],[lon, lat],..],[[]lon, lat,[lon, lat],..],..]
    }
  }, { } ]
}
```

__Constellation boundaries__  
`constellations.bounds.json`  

```js
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "id": "",           // 3-letter designator of constellation
    "geometry": {  
      "type": "Polygon",
      "coordinates": [[[lon, lat],[lon, lat],..]]
    },
  }, { } ]
}
```

__Milky way__  
`mw.json`  

```js
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "id": "",       // ol 1-5
    "properties": {},
    "geometry": {
      "type": "MultiPolygon",
      "coordinates":[[[[lon, lat],[lon, lat],..],[[lon, lat],[lon, lat],..],..]]
    }
  }, { } ]
}
```

__Special Planes__

```js
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "id": "",       
    "geometry": {  
      "type": "LineString",
      "coordinates": [[lon, lat],[lon, lat]]
    }
  }, { } ]
}
```

__Asterisms__  

```js
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "id": "",       // Name without spaces
    "properties": {
      "n": "",      // Proper name
      "es": "",     // Proper name in spanish
      "loc": [lon,lat], // Center location of name string
      "p": n        // Priority 1..6 (~Average brighness)
                    // p=6: Guiding line
    },
    "geometry": {  
      "type": "MultiLineString",
      "coordinates": [[[lon, lat],[lon, lat],..],[[]lon, lat,[lon, lat],..],..]
    }
  }, { } ]
}
```
