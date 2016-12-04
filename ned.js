/**************************
 * Main object
 **************************/
var Ned = {
	init(svg) {
		this.svg = null;

		this.singleInput = false;
		this.singleOutput = false;

		if (!(svg instanceof SVGElement)) {
			svg = document.getElementById(svg);
		}
		this.svg = svg;
		this.svg.ns = this.svg.namespaceURI;

		// group for all node elements
		this.nodegroup = document.createElementNS(this.svg.ns,"g");
		this.nodegroup.setAttribute("class", "Nodegroup");
		this.svg.appendChild(this.nodegroup);

		// group to draw the paths above the nodes
		this.pathGroup = document.createElementNS(this.svg.ns,"g");
		this.pathGroup.setAttribute("class", "PathGroup");
		this.svg.appendChild(this.pathGroup);
	},
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
		this.eRoot = document.createElementNS(ned.svg.ns,"svg");
		this.eRoot.setAttribute("class", "NodeContainer");
		this.eRoot.setAttribute("overflow", "visible");
		ned.nodegroup.appendChild(this.eRoot);
		this.width = 200;
		this.height = 100;

		var headerSize = 24;

		// ****************** background ******************
		this.eBack = document.createElementNS(ned.svg.ns,"rect");
		this.eBack.setAttribute("class", "Background");
		this.eBack.setAttribute("width", "100%");
		this.eBack.setAttribute("height", "100%");
		this.eRoot.appendChild(this.eBack);

		// ****************** header ******************
		this.eHeader = document.createElementNS(ned.svg.ns,"g");
		this.eHeader.setAttribute("class", "Header");
		this.eRoot.appendChild(this.eHeader);
		this.eHeader.addEventListener("mousedown", (e) => {	this.beginNodeDrag (e);	});

		this.eHeaderBack = document.createElementNS(ned.svg.ns,"rect");
		this.eHeaderBack.setAttribute("width", "100%");
		this.eHeaderBack.setAttribute("height", headerSize);
		this.eHeader.appendChild(this.eHeaderBack);
		
		this.eHeaderText = document.createElementNS(ned.svg.ns,"text");
		this.eHeaderText.appendChild(document.createTextNode(sTitle));
		this.eHeaderText.setAttribute("x", "50%");
		this.eHeaderText.setAttribute("y", headerSize - 4); // padding to the bottom text
		this.eHeader.appendChild(this.eHeaderText);

		// ****************** foreign objects ******************
		this.eForeign = document.createElementNS(ned.svg.ns,"foreignObject");
		this.eForeign.setAttribute("x", "16");
		this.eForeign.setAttribute("y", headerSize);
		this.eRoot.appendChild(this.eForeign);

		// ****************** inputs and outputs ******************
		this.eInputs = document.createElementNS(ned.svg.ns,"svg");
		this.eInputs.setAttribute("class", "Inputs");
		this.eInputs.setAttribute("overflow", "visible");
		this.eInputs.setAttribute("x", "0%");
		this.eInputs.setAttribute("y", headerSize);
		this.eRoot.appendChild(this.eInputs);

		this.eOutputs = document.createElementNS(ned.svg.ns,"svg");
		this.eOutputs.setAttribute("class", "Outputs");
		this.eOutputs.setAttribute("overflow", "visible");
		this.eOutputs.setAttribute("x", "100%");
		this.eOutputs.setAttribute("y", headerSize);
		this.eRoot.appendChild(this.eOutputs);

		// ****************** foreign object test ******************
		this.eSelect = document.createElement("select");
		this.eForeign.appendChild(this.eSelect);

		for (let i = 0; i < 5; ++i)
		{
			var eOption = document.createElement("option");
			eOption.text = "test " + i;
			this.eSelect.appendChild(eOption);
		}
	},

	addInput(name) {
		var o = Object.create (Ned.Connector);
		this.inputs.push(o);
		o.init(this, name, true);
		return o;
	},

	addOutput(name) {
		var o = Object.create (Ned.Connector);
		this.outputs.push(o);
		o.init(this, name, false);
		return o;
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
		this.eRoot.setAttribute("x", pos.x);
		this.eRoot.setAttribute("y", pos.y);
		this.updatePaths();
	},

	get width() {
		return this.eRoot.getAttribute("width");
	},
	set width(v) {
		this.eRoot.setAttribute("width", v);
	},

	get height() {
		return this.eRoot.getAttribute("height");
	},
	set height(v) {
		this.eRoot.setAttribute("height", v);
	},

	toTop() {
		this.editor.nodegroup.removeChild(this.eRoot);
		this.editor.nodegroup.appendChild(this.eRoot);
	},

	beginNodeDrag(e) {
		e.stopPropagation();

		this.toTop();
		var pos = this.position;
		var offsetX = pos.x - e.pageX;
		var offsetY = pos.y - e.pageY;

		var onNodeDragMouseMove = (e) => {
			e.stopPropagation();
			e.preventDefault();
			this.position = { x: e.pageX + offsetX, y: e.pageY + offsetY };
		};

		var onNodeDragMouseUp = (e) => {
			e.stopPropagation(); 
			e.preventDefault();

			window.removeEventListener("mousemove",onNodeDragMouseMove);
			window.removeEventListener("mouseup", onNodeDragMouseUp);
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
		this.eRoot = document.createElementNS(this.editor.svg.ns,"svg");
		this.eRoot.setAttribute("class", isInput ? "Input" : "Output");
		this.eRoot.setAttribute("overflow", "visible");
		neRoot.appendChild(this.eRoot);

		// ****************** dot ******************
		this.eDot = document.createElementNS(this.editor.svg.ns,"circle");
		this.eDot.ref = this; // we set the refference on the object we want to be able to connect to
		this.eDot.addEventListener("mousedown", (e) => { this.beginConnDrag(e); });
		this.eDot.addEventListener("mouseenter", (e) => { this.eDot.setAttribute("class", "ConnHover"); });
		this.eDot.addEventListener("mouseleave", (e) => { this.eDot.removeAttribute("class"); });
		this.eRoot.appendChild(this.eDot);

		/*if (!this.isInput) {
			var rect = this.eRoot.getBoundingClientRect();
			this.eRoot.setAttribute("x", -rect.width);
		}*/

		this.updatePosition();
	},

	updatePosition() {
		var rect = this.eRoot.getBoundingClientRect();

		var i = this.index;
		var y = (rect.height / 2) + (rect.height * 1.5 * i)
		this.eRoot.setAttribute("y", y);
	},

	updatePaths() {
		for(let p of this.paths) p.update();
	},
	removePath(p) {
		var index = this.paths.indexOf(p);
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

	get singlePath() {
		return (this.isInput) ? this.editor.singleInput : this.editor.singleOutput;
	},
	get position() {
		var rect = this.eRoot.getBoundingClientRect();
		var rootRect = this.editor.svg.getBoundingClientRect();
		// we need to keep the svg position in mind
		// and center it 
		return {
			x: (rect.left - rootRect.left) + (rect.width / 2),
			y: (rect.top - rootRect.top) + (rect.height / 2)
		};
	},

	beginConnDrag(e) {
		e.stopPropagation();
		e.preventDefault();

		var path = Object.create(Ned.Path);
		path.init(this);

		var onConnDragMouseMove = (e) => {
			e.stopPropagation();
			e.preventDefault();
			var mouseOffset = 3; // this offset is so the path isn't under the mouse when we release it. Else it isn't possible to get the underlying connector
			var rootRect = this.editor.svg.getBoundingClientRect();
			var pos = {	x: (e.pageX - rootRect.left), y: (e.pageY - rootRect.top + mouseOffset) };
			path.updateWithPos(pos);
		}
		
		var onConnDragMouseUp = (e) => {
			e.stopPropagation();
			e.preventDefault();

			var conn = e.target.ref; // get the saved refence to connect
			if (Ned.Connector.isPrototypeOf(conn)) {
				if (this.isInput === conn.isInput) {
					//can't connect 2 inputs or 2 outputs
					path.destroy ();
				}
				else {
					path.setFinalConn(conn);
					// check if we don't already have a path like this
					if (this.paths.find((p) => path.equals(p))) {
						// this path already exists so delete it
						path.destroy ();
					} else {
						// remember the new path
						//add conn to path to update it
						this.paths.push(path);
						conn.paths.push(path);
					}
				}
			} else {
				path.destroy ();
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
		this.input.removePath(this);
		this.output.removePath(this);
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
