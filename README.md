# Ned (WIP)
Simple javascript node editor using svg graphics. Currently working and tested in Chrome.

The panning and zooming in the example uses [ariutta svg-pan-zoom](https://github.com/ariutta/svg-pan-zoom) but any pan and/or zoom could be used.

## How To Use

For a complete look on how everything works you can take a look at the [test.html](./test.html).

### Editor

Create and init an editor using `Nde.Create(arg)`. The argument to function should be a CSS selector or a DOM Element.
```javascript
var editor = Ned.create("#svg");
// or
var svgElement = document.querySelector("#svg");
var editor = Ned.create(svgElement);
```

After creating an editor you can setup the options and create nodes.

#### Options

+ `snapping`: value to snap nodes to (`0` or `false` is disabled). Default is `0`.
+ `singleInputs`: when `true` input connectors only allow a single connection. Default is `false`.
+ `singleOutputs`: when `true` output connectors only allow a single connection. Default is `false`.
+ `screenToWorld`: function to translate screen coördinates to world coördinates. This is used to corectly position nodes and paths when you enable a pan and/or zoom on the svg. Default is `(pos) => { return pos; }`.

The `screenToWorld` function should be correctly set before any connections are made. Any paths added before this will be drawn incorrectly.

ScreenToWorld example with svg position offset.
```javascript
editor.screenToWorld = function(pos) {
	var rect = editor.svg.getBoundingClientRect();

	return { 
		x: (pos.x - rect.left), 
		y: (pos.y - rect.top)
	};
};
```

ScreenToWorld example with svg position offset and pan and zoom using [ariutta svg-pan-zoom](https://github.com/ariutta/svg-pan-zoom).
```javascript
var panZoom = svgPanZoom(editor.svg);

editor.screenToWorld = function(pos) {
	var rect = editor.svg.getBoundingClientRect();
	var pan = panZoom.getPan();
	var zoom = panZoom.getZoom();

	return { 
		x: (((pos.x - rect.left) - pan.x) / zoom), 
		y: (((pos.y - rect.top) - pan.y) / zoom)
	};
};
```

### Nodes

Nodes

### Conectors