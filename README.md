# Ned
Simple javascript node editor using svg graphics. A working example can be found [here](https://depuits.github.io/ned).

 Some **SVG2** features are required. Currently working and tested in **Chrome**. 

The panning and zooming in the example uses [ariutta svg-pan-zoom](https://github.com/ariutta/svg-pan-zoom) but any pan and/or zoom could be used.

## Examples
* [Pan and zoom](https://depuits.github.io/ned/index.html)
* [Dual pannels](https://depuits.github.io/ned/dual.html)

## How To Use
For a complete look on how everything works you can take a look at the [index.html](./index.html).

### Editor
Create and init an editor using `Ned.Create(arg)`. The argument to function should be a CSS selector or a DOM Element.
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

The `screenToWorld` function should be correctly set before any connections are made. Any paths added before this will be drawn incorrectly. In this method the `this` object links to the editor trying to translate the position.

ScreenToWorld example with svg position offset.
```javascript
editor.screenToWorld = function(pos) {
	var rect = this.svg.getBoundingClientRect();

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
	var rect = this.svg.getBoundingClientRect();
	var pan = this.panZoom.getPan();
	var zoom = this.panZoom.getZoom();

	return { 
		x: (((pos.x - rect.left) - pan.x) / zoom), 
		y: (((pos.y - rect.top) - pan.y) / zoom)
	};
};
```

### Nodes
Nodes can simple be created by calling 
```javascript
// create a new node
var n1 = editor.createNode("Node title");

// position the node
n1.position = { x: 100, y: 180};
```

#### Connectors
Connectors are the link points of the nodes. Any node can have as many or little connectors as needed. Connectors are split in two groups: input and output. To add connectors you call
```javascript
var n1i1 = n1.addInput("Input name");
var n1o1 = n1.addOutput("Output name");
```

Connections can be made by simply calling the `connectTo` function on a connector and passing in the target connector. If a connection can not be made the function will return `false`.
```javascript
n1o1.connectTo(n2i1);
```

Depending on the editor settings for `singleInputs` and `singleOutputs` the number of possible connections is limited.

## Customization
Most of the visual customization can be done inside the [css](./ned.css). Other node customization like adding objects and changing size is work in progress.

## SVG structure
This is the default svg structure without any other libraries or other things in the svg. Except for the first ROOT svg element the structure is "`DOM object` ClassName".

```
`svg` ROOT  
  │  
  ├─ `g` Nodegroup  
  │   ├─ `svg` NodeContainer  
  │   │   ├─ `rect` Background  
  │   │   ├─ `g` Header  
  │   │   │   ├─ `rect`  
  │   │   │   └─ `text`  
  │   │   ├─ `foreignObject`  
  │   │   ├─ `svg` Inputs  
  │   │   │   ├─ `svg` Input  
  │   │   │   │   ├─ `text`  
  │   │   │   │   └─ `circle`  
  │   │   │   └─ ...  
  │   │   └─ `svg` Outputs  
  │   │       ├─ `svg` Output  
  │   │       │   ├─ `text`  
  │   │       │   └─ `circle`  
  │   │       └─ ...  
  │   └─ ...  
  └─ `g` PathGroup  
      ├─ `path` Path  
      └─ ...  
```
