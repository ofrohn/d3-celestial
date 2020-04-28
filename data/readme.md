# Data Formats

For GeoJSON, all coordinates need to be given in degrees, longitude as [-180...180] deg, latitude as [-90...90] deg

## Stars

`stars.6.json`, `stars.8.json`, `stars.14.json`: the number indicates limit magnitude  

```js
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "id": "",        // Hipparcos number
    "properties": {
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

## Starnames

`starnames.json`: Magnitude independent, all stars with a name/designation other than HIP/HD  

```js
{"id": {         // Hipparcos number  
   "name": "",      // Proper name  
    ...             // and names in 17 further languages (see list in main readme)
   "desig": "",     // Standard designation, first from list below  
   "bayer": "",     // Bayer  
   "flam": "",      // Flamsteed  
   "var": "",       // Variable star  
   "gliese": "",    // Gliese  
   "hd": "",        // Henry Draper
   "hip": ""        // Hipparcos number again   
  }, "id": {...}  
}
```
  
##Traditional Chinese star names  

`starnames.cn.json`:  
```js
{"id": {         // Hipparcos number  
   "name": "",      // Chinese name  
   "desig": "",     // IAU designation  
   "en": "",        // English translation  
   "pinyin": ""     // Pinyin transcription  
  }, "id": {...}  
}
```

## DSOs

`dsos.6.json`, `dsos.14.json`: the number indicates limit magnitude  
`dsos.bright.json`: hand selected  
`lf.json`: Local group  
`messier.json` Messier objects

```js
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "id": "",       // Short designator
    "properties": {
      "name": "",   // Proper name or most commonly used designator
      "desig": "",  // Designator
      "type": "",   // Object type: gg, g, s, s0, sd, i, e, oc, gc, dn, bn, sfr, rn, en, pn, snr
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

___Object type:___ _gg_: galaxy cluster, _g_: galaxy, _s_: spiral galaxy, _s0_: lenticular gal., _sd_: dwarf spheroidal gal., _i_: irregular gal., _e_: elliptical gal., _oc_: open cluster, _gc_: globular cluster, _dn_: dark nebula, _bn_: bright nebula, _sfr_: star forming region, _rn_: reflection nebula, _en_: emission nebula, _pn_: planetary nebula, _snr_: supernova remnant

___additional lg.json properties:___  
_sub_: Sub group membership: \[MW|M31|N3109|LG\]  (Milky way, Andromeda, NGC 3109, gen. LG)  
_pop_: MW popultions \[OH|YH|BD\] (Old halo, young halo, bulge & disk), M31 populations \[M31|GP\]  (gen. M31, great plane)  
_str_: Tidal streams \[Mag|Sgr|CMa|FLS\] (Magellanic Stream, Sagittarius Stream, Canis Major/Monoceros Stream, Fornax-Leo-Sculptor Great Circle)

## Constellations

`constellations.json`

```js
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "id": "",           // 3-letter designator
    "properties": {
      "name": "",       // full IAU name
      "desig": "",      // 3-letter designator again
      "gen": "",        // genitive for naming stars, not yet used
      "rank": "",       // 1-3 for differential name display by size/brightness
      "en": "",         // english name
      ...               // and names in 18 further languages (see list in main readme)
      "display": []     // [ra,dec,scale], for single constellation display 
    },
    "geometry": {  
      "type": "Point",
      "coordinates": [lon, lat]  // Position of const. name
    }      
  }, { } ]
}
```

## Constellation lines

`constellations.lines.json`, `constellations.lines.cn.json`

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

## Constellation boundaries

`constellations.bounds.json`, `constellations.bounds.cn.json`

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

##Traditional Chinese constellations

`constellations.cn.json`  

```js
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "id": "",           // numerical id
    "properties": {
      "name": "",       // chinese name
      "en": "",         // english translation
      "pinyin": "",     // pinyin transcription
      "desig": "",      // also chinese name, for compatibility
      "rank": "",       // so far only 1; differential name display by size/brightness
      "display": []     // [ra,dec,scale], for single constellation display 
    },
    "geometry": {  
      "type": "Point",
      "coordinates": [lon, lat]  // Position of const. name
    }      
  }, { } ]
}
```

## Milky way

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

## Special Planes

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

## Asterisms

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

## Planets

Not geojson, because positions need to be calculated by date from keplerian elements  
All element values in degrees, except a (AU|km) and e (dimensionless)  

```js
"id":{                // (usually) 3-letter id
  "name": "",         // full name
  "trajectory": bool, // show trajectory (tbi)
  "H": n,             // absolute magnitude
  "elements":[{
    "a": "da": Semimajor axis / change per century (all 'dx' fields)
    "e": "de": Eccentricity
    "i": "di": Inclination
    "L": "dL": or "M": "dM": mean longitude (M*Q) or mean anomaly
    "W": "dW": or "w": "dw": longitude of periapsis (w*N) or argument of periapsis
    "N": "dn": longitude of the ascending node
    "ep":"2000-01-01" epoch, default date
  }],
  "desig": "",        // 3-Letter designation
  ...                 // Names in 14 different languages, see list in main readme
  }
```

