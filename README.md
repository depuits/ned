# Ned (WIP)
Simple javascript node editor using svg graphics. Currently working and tested in Chrome.

The panning and zooming in the example uses [ariutta svg-pan-zoom](https://github.com/ariutta/svg-pan-zoom) but any pan and/or zoom could be used.

## How To Use

For a complete look on how everything works you can take a look at the [test.html](./blob/master/test.html).

### Editor

Create and init an editor using
```javascript
var editor = Ned.create("#svg");
// or
var svgElement = document.querySelector("#svg");
var editor = Ned.create(svgElement);
```

After initializing the editor you can setup the option and create nodes.

#### Options

+ `snapping`: value to snap nodes to (`0` or `false` is disabled). Default is `0`.
+ `singleInputs`: when `true` input connectors only allow a single connection. Default is `false`.
+ `singleOutputs`: when `true` output connectors only allow a single connection. Default is `false`.
+ `screenToWorld`: function to translate screen coördinates to world coördinates. This is used to corectly position nodes and paths when you enable a pan and/or zoom on the svg. Default is `(pos) => { return pos; }`.

### Nodes

### Conectors