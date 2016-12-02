/**************************
 * Main object
 **************************/
var Ned = {
	init(svg) {
		this.svg = null;

		this.singleInput = false;
		this.singleOutput = false;

		// add to css
		this.pathWidth = 2;
		this.pathColor = "#999999";
		this.pathColorA = "#86d530";
		this.pathDashArray = "20,5,5,5,5,5";

		if (!(svg instanceof SVGElement)) {
			svg = document.getElementById(svg);
		}
		this.svg = svg;
		this.svg.ns = this.svg.namespaceURI;
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
		ned.svg.appendChild(this.eRoot);
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
		this.editor.svg.removeChild(this.eRoot);
		this.editor.svg.appendChild(this.eRoot);
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
		this.eDot.addEventListener("click", (e) => { this.beginConnDrag(e); });
		this.eRoot.appendChild(this.eDot);

		this.updatePosition();
	},

	updatePosition() {
		var rect = this.eRoot.getBoundingClientRect();
		if (!this.isInput) this.eRoot.setAttribute("x", -rect.width);

		var i = this.index;
		var y = (rect.height / 2) + (rect.height * 1.5 * i)
		this.eRoot.setAttribute("y", y);
	},

	updatePaths() {
		for(let p of this.paths) p.update();
	},

	get editor() {
		return this.node.editor;
	},

	get index() {
		var list = (this.isInput) ? this.node.inputs : this.node.outputs;
		return list.indexOf(this);
	},

	get singlePath() {
		return (this.isInput) ? this.editor.singleInput :this.editor.singleOutput;
	},
	get position() {
		var rect = this.eRoot.getBoundingClientRect();
		// do we need to add the css pos? cx, cy
		return {
			x: rect.x,
			y: rect.y
		};
	},

	beginConnDrag(e) {
		e.stopPropagation();
		e.preventDefault();

		var path = Object.create(Ned.Path);
		path.init(this);
		//this.paths.push(path); //Do we push the path here or can we wait ti'll the path is final

		var onConnDragMouseMove = (e) => {
			e.stopPropagation();
			e.preventDefault();
			path.updateWithPos(e.pageX, e.pageY);
		}
		
		var onConnDragMouseUp = (e) => {
			e.stopPropagation();
			e.preventDefault();

			//Does e.target equal an node were over?
			console.log(e.target);
			//TODO check connections and remove or apply the final path
			//path.output.removePath(NEditor.dragItem);

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
		this.ePath.setAttribute("class", "Outputs");
		// TODO move as much to css
		this.ePath.setAttribute("stroke-dasharray", this.editor.pathDashArray);
		this.ePath.setAttribute("stroke-width", this.editor.pathWidth);
		this.ePath.setAttribute("stroke", this.editor.pathColor);
		this.ePath.setAttribute("fill", "none");

		this.editor.svg.appendChild(this.ePath); //TODO change svg to paths child svg or group

		var pos = conn.position;
		this.setCurve(pos.x, pos.y, pos.x, pos.y);
	},

	update() {
		if (this.input && this.output) {
			var pos1 = this.input.position;
			var pos2 = this.output.position;
			this.setCurve (pos1.x, pos1.y, pos2.x, pos2.y);
		} else {
			console.error("One or more connectors from path not set.");
		}
	},
	updateWithPos(x, y) {
		// here we asume only one node is set or deemed important
		var pos = (this.input || this.output).position;
		this.setCurve (pos.x, pos.y, x, y);
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
