"use strict";

/**************************
 * Main object
 **************************/
var Ned = {
	create(svg) {
		var editor = Object.create(Ned);
		editor.init(svg);

		return editor;
	},

	init(svg) {
		this.svg = null;

		this.snapping = 0;

		this.singleInputs = false;
		this.singleOutputs = false;

		this.dragConn = null;

		if (!(svg instanceof SVGElement)) {
			svg = document.querySelector(svg);
		}
		this.svg = svg;
		this.svg.ns = this.svg.namespaceURI;

		// group for all node elements
		this.nodegroup = document.createElementNS(this.svg.ns, "g");
		this.nodegroup.setAttribute("class", "Nodegroup");
		this.svg.appendChild(this.nodegroup);

		// group to draw the paths above the nodes
		this.pathGroup = document.createElementNS(this.svg.ns, "g");
		this.pathGroup.setAttribute("class", "PathGroup");
		this.svg.appendChild(this.pathGroup);
	},

	createNode(title) {
		var n = Object.create(Ned.Node);
		n.init (this, title);

		return n;
	},

	screenToWorld(pos) {
		return pos;
	}
};

/**************************
 * Node Object
 **************************/
Ned.Node = {
	init(ned, sTitle) {
		this.editor = ned;
		this.inputs = [];
		this.outputs = [];

		// ****************** root ******************
		this.eRoot = document.createElementNS(ned.svg.ns, "svg");
		this.eRoot.setAttribute("class", "NodeContainer");
		this.eRoot.setAttribute("overflow", "visible");
		ned.nodegroup.appendChild(this.eRoot);
		this.width = 200;
		this.height = 100;

		var headerSize = 24;

		// ****************** background ******************
		this.eBack = document.createElementNS(ned.svg.ns, "rect");
		this.eBack.setAttribute("class", "Background");
		this.eBack.setAttribute("width", "100%");
		this.eBack.setAttribute("height", "100%");
		this.eRoot.appendChild(this.eBack);

		// ****************** header ******************
		this.eHeader = document.createElementNS(ned.svg.ns, "g");
		this.eHeader.setAttribute("class", "Header");
		this.eRoot.appendChild(this.eHeader);
		this.eHeader.addEventListener("mousedown", (e) => {	this.beginNodeDrag (e);	});

		this.eHeaderBack = document.createElementNS(ned.svg.ns, "rect");
		this.eHeaderBack.setAttribute("width", "100%");
		this.eHeaderBack.setAttribute("height", headerSize);
		this.eHeader.appendChild(this.eHeaderBack);
		
		this.eHeaderText = document.createElementNS(ned.svg.ns, "text");
		this.eHeaderText.appendChild(document.createTextNode(sTitle));
		this.eHeaderText.setAttribute("x", "50%");
		this.eHeaderText.setAttribute("y", headerSize - 4); // padding to the bottom text
		this.eHeader.appendChild(this.eHeaderText);

		// ****************** inputs and outputs ******************
		this.eInputs = document.createElementNS(ned.svg.ns, "svg");
		this.eInputs.setAttribute("class", "Inputs");
		this.eInputs.setAttribute("overflow", "visible");
		this.eInputs.setAttribute("x", "0%");
		this.eInputs.setAttribute("y", headerSize);
		this.eRoot.appendChild(this.eInputs);

		this.eOutputs = document.createElementNS(ned.svg.ns, "svg");
		this.eOutputs.setAttribute("class", "Outputs");
		this.eOutputs.setAttribute("overflow", "visible");
		this.eOutputs.setAttribute("x", "100%");
		this.eOutputs.setAttribute("y", headerSize);
		this.eRoot.appendChild(this.eOutputs);

		// ****************** foreign objects ******************
		this.eForeign = document.createElementNS(ned.svg.ns, "foreignObject");
		this.eForeign.setAttribute("x", "16");
		this.eForeign.setAttribute("y", headerSize);
		this.eRoot.appendChild(this.eForeign);

		// ****************** foreign object test ******************
		this.eSelect = document.createElement("select");
		this.eForeign.appendChild(this.eSelect);

		for (let i = 0; i < 5; ++i)
		{
			var eOption = document.createElement("option");
			eOption.text = "test " + i;
			this.eSelect.appendChild(eOption);
		}
		this.eText = document.createElement("textarea");
		this.eForeign.appendChild(this.eText);
	},

	addInput(name) {
		return this.addConnection (name, true);
	},

	addOutput(name) {
		return this.addConnection (name, false);
	},

	addConnection (name, isInput) {
		var conn = Object.create (Ned.Connector);
		if (isInput) this.inputs.push(conn);
		else this.outputs.push(conn);

		conn.init(this, name, isInput);
		//TODO resize / position foreign object

		return conn;
	},

	updatePaths() {
		for (let c of this.inputs) c.updatePaths();
		for (let c of this.outputs) c.updatePaths();
	},

	get position() {
		return {
			x: this.eRoot.getAttribute("x"),
			y: this.eRoot.getAttribute("y")
		};
	},
	set position(pos) {
		if (this.editor.snapping) {
			var snp = this.editor.snapping;
			pos.x = Math.round(pos.x / snp) * snp;
			pos.y = Math.round(pos.y / snp) * snp;
		}

		this.eRoot.setAttribute("x", pos.x);
		this.eRoot.setAttribute("y", pos.y);
		this.updatePaths();
	},

	get width() {
		return this.eRoot.getAttribute("width");
	},
	set width(v) {
		this.eRoot.setAttribute("width", v);
		//TODO resize / position foreign object
	},

	get height() {
		return this.eRoot.getAttribute("height");
	},
	set height(v) {
		this.eRoot.setAttribute("height", v);
		//TODO resize / position foreign object
	},

	toTop() {
		this.editor.nodegroup.removeChild(this.eRoot);
		this.editor.nodegroup.appendChild(this.eRoot);
	},

	beginNodeDrag(e) {
		// we can only drag when the left mouse button is pressed
		if (e.button != 0) {
			return;
		}

		e.stopPropagation();

		this.toTop();
		var pos = this.position;
		var screenPos = this.editor.screenToWorld({ x: e.pageX, y: e.pageY });
		var offsetX = pos.x - screenPos.x;
		var offsetY = pos.y - screenPos.y;

		var onNodeDragMouseMove = (e) => {
			e.stopPropagation();
			e.preventDefault();
			var screenPos = this.editor.screenToWorld({ x: e.pageX, y: e.pageY });
			this.position = { x: screenPos.x + offsetX, y: screenPos.y + offsetY };
		};

		var onNodeDragMouseUp = (e) => {
			e.stopPropagation(); 
			e.preventDefault();

			window.removeEventListener("mousemove", onNodeDragMouseMove);
			window.removeEventListener("mouseup",  onNodeDragMouseUp);
		};

		window.addEventListener("mousemove", onNodeDragMouseMove);
		window.addEventListener("mouseup", onNodeDragMouseUp);
	}
};

/**************************
 * Node Connector Object
 **************************/
Ned.Connector = {
	init(node, name, isInput) {
		this.node = node;
		this.isInput = isInput;
		this.paths = [];

		var neRoot = isInput ? node.eInputs : node.eOutputs;

		// ****************** root ******************
		this.eRoot = document.createElementNS(this.editor.svg.ns, "svg");
		this.eRoot.setAttribute("class", isInput ? "Input" : "Output");
		this.eRoot.setAttribute("overflow", "visible");
		neRoot.appendChild(this.eRoot);

		// ****************** text ******************
		this.eText = document.createElementNS(this.editor.svg.ns, "text");
		this.eText.appendChild(document.createTextNode(name));
		this.eRoot.appendChild(this.eText);

		// ****************** dot ******************
		this.eDot = document.createElementNS(this.editor.svg.ns, "circle");
		this.eDot.ref = this; // we set the refference on the object we want to be able to connect to
		this.eDot.addEventListener("mousedown", (e) => { this.beginConnDrag(e); });
		this.eDot.addEventListener("mouseenter", (e) => { this.addHoverClass(); });
		this.eDot.addEventListener("mouseleave", (e) => { this.removeHoverClass(); });
		this.eRoot.appendChild(this.eDot);

		this.updatePosition();
	},

	addHoverClass() {
		var conn = this.editor.dragConn;
		if (!conn || (this.isInput === conn.isInput)) return;

		// we only add the class if we are dragging and the dragging connector isn't the same type of this connector
		this.eDot.setAttribute("class", "ConnHover"); 
	},
	removeHoverClass() {
		// on mouse leave we'll always remove the class
		this.eDot.removeAttribute("class");
	},

	updatePosition() {
		var rect = this.eRoot.getBoundingClientRect();

		var i = this.index;
		var y = (rect.height) + (rect.height * 1.5 * i)
		this.eRoot.setAttribute("y", y);
	},

	updatePaths() {
		for(let p of this.paths) p.update();
	},
	addPath(path) {
		if (this.hasSinglePath) {
			// destroy all current paths
			for(let p of this.paths) p.destroy();

			// clear the array
			this.paths = [];
		}

		this.paths.push(path);
	},
	removePath(path) {
		var index = this.paths.indexOf(path);
		if(index != -1) {
			this.paths.splice(index, 1);
		}
	},

	get editor() {
		return this.node.editor;
	},

	get index() {
		var list = (this.isInput) ? this.node.inputs : this.node.outputs;
		return list.indexOf(this);
	},

	get hasSinglePath() {
		return (this.isInput) ? this.editor.singleInputs : this.editor.singleOutputs;
	},
	get position() {
		var rect = this.eDot.getBoundingClientRect();
		// we need to keep the svg position in mind
		// and center it 
		var screenPos = {
			x: rect.left + (rect.width / 2),
			y: rect.top + (rect.height / 2)
		};
		return this.editor.screenToWorld(screenPos);
	},

	// path parameter is optional and a path is created if none is supplied
	connectTo(conn, path) {
		if (this.isInput === conn.isInput) {
			//can't connect 2 inputs or 2 outputs
			if (path) path.destroy();
			return false;
		}

		if (!path) {
			var path = Object.create(Ned.Path);
			path.init(this);
		}
		path.setFinalConn(conn);

		// check if we don't already have a path like this
		if (this.paths.find((p) => path.equals(p))) {
			// this path already exists so delete it
			path.destroy();
			return false;
		} 

		// remember the new path
		//add path to conn paths list to update it
		this.addPath(path);
		conn.addPath(path);
		return true;
	},

	beginConnDrag(e) {
		// we can only drag when the left mouse button is pressed
		if (e.button != 0) {
			return;
		}

		e.stopPropagation();
		e.preventDefault();

		this.editor.dragConn = this;
		var path = Object.create(Ned.Path);
		path.init(this);

		var onConnDragMouseMove = (e) => {
			e.stopPropagation();
			e.preventDefault();
			var mouseOffset = 3; // this offset is so the path isn't under the mouse when we release it. Else it isn't possible to get the underlying connector
			var screenPos = this.editor.screenToWorld({ x: e.pageX, y: e.pageY });
			var pos = {	x: screenPos.x, y: screenPos.y + mouseOffset };
			path.updateWithPos(pos);
		}
		
		var onConnDragMouseUp = (e) => {
			e.stopPropagation();
			e.preventDefault();

			this.editor.dragConn = null;
			var conn = e.target.ref; // get the saved refence to connect
			if (Ned.Connector.isPrototypeOf(conn)) {
				this.connectTo(conn, path);
				conn.removeHoverClass(); // we've stopped dragging so we'll make sure the hover class is removed
			} else {
				path.destroy();
			}

			window.removeEventListener("mousemove", onConnDragMouseMove);
			window.removeEventListener("mouseup", onConnDragMouseUp);
		};

		window.addEventListener("mousemove", onConnDragMouseMove);
		window.addEventListener("mouseup", onConnDragMouseUp);
	}
};

/**************************
 * Node path Object
 **************************/
Ned.Path = {
	init(conn) {
		this.editor = conn.editor;
		this.input = conn.isInput ? conn : null;
		this.output = conn.isInput ? null : conn;

		this.ePath = document.createElementNS(this.editor.svg.ns, "path");
		this.ePath.setAttribute("class", "Path");		
		this.ePath.addEventListener("click", (e) => { this.onClicked(e); });

		this.editor.pathGroup.appendChild(this.ePath);

		var pos = conn.position;
		this.updateWithPos(pos);
	},

	destroy() {
		if (this.input) this.input.removePath(this);
		if (this.output) this.output.removePath(this);
		this.editor.pathGroup.removeChild(this.ePath);
		this.ePath = null;
	},

	setFinalConn(conn) {
		// if the input is set then set the output and vice versa
		if (this.input) this.output = conn;
		else this.input = conn;

		this.update();
	},

	equals(p) {
		return this.input === p.input && this.output === p.output;
	},

	onClicked(e) {
		// we can only drag when the left mouse button is pressed
		if (e.button != 0) {
			return;
		}
		
		this.destroy();
	},

	update() {
		this.updateWithPos ((this.input || this.output).position);
	},
	updateWithPos(pos) {
		var pos1 = this.output ? this.output.position : pos;
		var pos2 = this.input ? this.input.position : pos;
		this.setCurve (pos1.x, pos1.y, pos2.x, pos2.y);
	},

	setCurve(x1, y1, x2, y2) {
		var dif = Math.abs(x1 - x2) / 1.5,
			str = "M" + x1 + "," + y1 + " C" +	//MoveTo
				(x1 + dif) + "," + y1 + " " +	//First Control Point
				(x2 - dif) + "," + y2 + " " +	//Second Control Point
				(x2) + "," + y2;				//End Point

		this.ePath.setAttribute('d', str);
	}
}
