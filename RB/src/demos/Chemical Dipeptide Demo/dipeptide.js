/* global applyGraphicalObjs defineArrowhead groupBy Plotly DIPEPTIDE_WELL graphBeadLocs */

const CONFIG = {
	containerSVGWidth: 250,
	containerSVGHeight: 300,
	graphSVGWidth: 800,
	graphSVGHeight: 300,
	equationSVGWidth: 800,
	equationSVGHeight: 150,
	dipeptideRadius: 7,
	fluidColor: "#e6f7ff",
	fluidHeight: 0.6,
	symbolSize: 50,
	symbolPad: 4,
	beakerColor: "#047",
};

const COLORS = {
	blue: "#23f",
	orange: "#f92",
	green: "#0b3",
	purple: "#c3f",
};

const beaker = d3
	.selectAll(".container")
	.attr("width", CONFIG.containerSVGWidth)
	.attr("height", CONFIG.containerSVGHeight);
const graph = d3
	.select("#energy-graph")
	.attr("width", CONFIG.graphSVGWidth)
	.attr("height", CONFIG.graphSVGHeight);
const equation = d3
	.select("#dipeptide-equation")
	.attr("width", CONFIG.equationSVGWidth)
	.attr("height", CONFIG.equationSVGHeight);

const STAGES = {
	initial: 0,
	enzyme: 1,
	ligand: 2,
	energyWell: 3,
};
let prevStage = STAGES.initial;

// Create enzyme and ligand symbols
(() => {
	const { symbolSize: size, symbolPad: pad } = CONFIG;

	// Enzyme
	const crescentScale = d3.scaleLinear([0, 1], [pad, size - pad]);
	const crescentOuterRadius = (size - 2 * pad) * 0.4;
	const crescentInnerRadius = (size - 2 * pad) * 0.28;
	beaker
		.append("symbol")
		.attr("id", "symbol-enzyme")
		.append("path")
		.attr(
			"d",
			`
			M ${crescentScale(0.75)} ${crescentScale(0.25)}
			A ${crescentOuterRadius} ${crescentOuterRadius} 0 1 0 ${crescentScale(
				0.75,
			)} ${crescentScale(0.75)}
			A ${crescentInnerRadius} ${crescentInnerRadius} 0 1 1 ${crescentScale(
				0.75,
			)} ${crescentScale(0.25)}
			`,
		)
		.attr("fill", "blue")
		.attr("stroke-opacity", 0);

	// Ligand
	const triangleXScale = d3.scaleLinear([-1, 1], [pad, size - pad]);
	const triangleYScale = d3.scaleLinear([-1, 1], [size - pad, pad]);
	const triangleRadius = 0.9;
	const vertices = d3.range(3).map(i => {
		const angle = (2 * Math.PI * i) / 3;
		return [
			triangleXScale(triangleRadius * Math.sin(angle)),
			triangleYScale(triangleRadius * Math.cos(angle)),
		];
	});
	beaker
		.append("symbol")
		.attr("id", "symbol-ligand")
		.append("path")
		.attr(
			"d",
			`M ${triangleXScale(0)} ${triangleYScale(triangleRadius)}
			${vertices.map(([x, y]) => `L ${x} ${y}`).join(" ")}
				Z`,
		)
		.attr("fill", "#fc3")
		.attr("stroke-opacity", 0);
})();

// Create chemical equation "equilibrium" arrows
(() => {
	const { symbolSize: size, symbolPad: pad } = CONFIG;
	const symbolViewbox = `${-size / 2} ${-size / 2} ${size} ${size}`;

	const scale = d3.scaleLinear([0, 1], [pad, size - pad]);
	const symbol = equation
		.append("symbol")
		.attr("viewbox", symbolViewbox)
		.attr("id", "symbol-eqn-arrow");
	const arrowPoints = [
		[0, 0.4],
		[1, 0.4],
		[0.75, 0.25],
		[0.88, 0.38],
		[0.85, 0.4],
	];

	const upsideUpPathString = [
		...arrowPoints.map((point, i) => {
			const [x, y] = point.map(scale);
			if (i === 0) {
				return `M ${x} ${y}`;
			}
			return `L ${x} ${y}`;
		}),
		"Z",
	].join(" ");

	const upsideDownPathString = [
		...arrowPoints.map((point, i) => {
			const [x, y] = point.map(comp => scale(1 - comp));
			if (i === 0) {
				return `M ${x} ${y}`;
			}
			return `L ${x} ${y}`;
		}),
		"Z",
	];
	for (const s of [upsideUpPathString, upsideDownPathString]) {
		symbol
			.append("path")
			.attr("d", s)
			.attr("stroke", "black")
			.attr("fill", "black")
			.attr("stroke-linejoin", "round");
	}
})();

const beakerXScale = d3.scaleLinear([0, 1], [0, CONFIG.containerSVGWidth]);
const beakerYScale = d3.scaleLinear([0, 1], [CONFIG.containerSVGHeight, 0]);
const beakerLine = d3
	.line()
	.x(p => p[0])
	.y(p => p[1]);

function getBeakerOutlineData() {
	const beakerColor = CONFIG.beakerColor;
	const ellipseWidth = beakerXScale(0.8) - beakerXScale(0);
	const ellipseHeight = beakerYScale(0.15) - beakerYScale(0);
	const leftX = beakerXScale(0.1);
	const rightX = beakerXScale(0.9);
	const topLeftY = beakerYScale(0.9);
	const midLeftY = beakerYScale(CONFIG.fluidHeight);
	const botLeftY = beakerYScale(0.1);
	const fluidColor = CONFIG.fluidColor;
	const strokeWidth = 1;

	function getEllipsePath(leftY, topHalf) {
		const orientation = topHalf ? 1 : 0;
		return `
				M ${leftX} ${leftY}
				a ${ellipseWidth / 2} ${ellipseHeight / 2} 0 0 ${orientation} ${ellipseWidth} 0
				`;
	}

	const beakerOutline = {
		shape: "path",
		class: "beaker-top-back",
		attrs: {
			d: `
			M ${leftX} ${botLeftY}
			V ${topLeftY}
			M ${rightX} ${botLeftY}
			V ${topLeftY}
			${getEllipsePath(topLeftY, true)}
			${getEllipsePath(midLeftY, true)}
			${getEllipsePath(botLeftY, true)}
			`,
			stroke: beakerColor,
			"stroke-width": strokeWidth,
			"fill-opacity": 0,
		},
	};

	const beakerLidFront = {
		shape: "path",
		class: "beaker-lid-front",
		attrs: {
			d: `
			M ${rightX} ${topLeftY}
			${getEllipsePath(topLeftY, false)}
			`,
			stroke: beakerColor,
			"stroke-width": strokeWidth,
			"fill-opacity": 0,
		},
	};

	const beakerWaterLevelFront = {
		shape: "path",
		class: "beaker-water-surface-front",
		attrs: {
			d: `${getEllipsePath(midLeftY, false)}`,
			stroke: beakerColor,
			"stroke-width": strokeWidth,
			"fill-opacity": 0,
		},
	};

	const beakerBackOutline = {
		shape: "path",
		class: "beaker-back",
		attrs: {
			d: `
			M ${leftX} ${botLeftY}
			${getEllipsePath(botLeftY, false)}
			`,
			stroke: d3.interpolate(beakerColor, fluidColor)(0.8),
			"stroke-width": strokeWidth,
			"fill-opacity": 0,
		},
	};

	const beakerFluid = {
		shape: "path",
		class: "beaker-bottom",
		attrs: {
			d: `
			M ${leftX} ${botLeftY}
			V ${midLeftY}
			${getEllipsePath(midLeftY, true, false)}
			V ${botLeftY}
			a ${ellipseWidth / 2} ${ellipseHeight / 2} 0 0 0 ${-ellipseWidth} 0
			Z
			`,
			"stroke-opacity": 0,
			"stroke-width": strokeWidth,
			fill: fluidColor,
		},
	};

	return {
		background: [beakerFluid, beakerBackOutline],
		foreground: [beakerOutline, beakerLidFront, beakerWaterLevelFront],
	};
}

let baseID = 0;

function getEncirclingLineData(points, lineFunc, opaqueEncirclingLineBg) {
	const r = CONFIG.dipeptideRadius;
	return [
		{
			shape: "path",
			class: "ligand-exterior",
			attrs: {
				d: lineFunc(points),
				"stroke-width": r * 2 + 9,
				stroke: "black",
				"stroke-linecap": "round",
				"stroke-linejoin": "round",
			},
		},
		{
			shape: "path",
			class: "ligand-interior",
			attrs: {
				d: lineFunc(points),
				"stroke-width": r * 2 + 7,
				stroke: opaqueEncirclingLineBg ? CONFIG.fluidColor : "white",
				"stroke-linecap": "round",
				"stroke-linejoin": "round",
			},
		},
	];
}

// p0 is the center {x,y} of the first dot in the chain
// angles is a list of relative angles for the next dot in the chain to appear relative to the previous one (e.g., four Math.PI/2's would do a full circle)
// colors contains the colors of the dots; a null entry indicates use the default orange color
// precondition: angles.length === colors.length - 1 (the first dot needs a color but not an angle)
function makeDipeptideChain(
	p0,
	angles,
	colors,
	{ drawEncirclingLine, opaqueEncirclingLineBg, ids } = {},
) {
	const nCircles = colors.length;

	if (ids === undefined) {
		ids = d3.range(nCircles).map(i => i + baseID);
		baseID += nCircles;
	}

	if (drawEncirclingLine === undefined) {
		drawEncirclingLine = false;
	}

	if (opaqueEncirclingLineBg === undefined) {
		opaqueEncirclingLineBg = true;
	}

	const r = CONFIG.dipeptideRadius;

	let { x: cx, y: cy } = p0;
	let angle = 0;
	const centerPoints = [];
	const chain = d3.range(nCircles).map(i => {
		const color = colors[i];
		const dot = {
			shape: "circle",
			class: "peptide",
			angle,
			id: `${ids[i]}`,
			color: color,
			attrs: {
				cx,
				cy,
				r,
				fill: color === null ? COLORS.orange : color,
			},
		};

		centerPoints.push([cx, cy]);

		angle += angles[i];
		cx += 2 * r * Math.cos(angle);
		cy -= 2 * r * Math.sin(angle);
		return dot;
	});

	const data = [];

	if (drawEncirclingLine) {
		const encirclingLineData = getEncirclingLineData(
			centerPoints,
			beakerLine,
			opaqueEncirclingLineBg,
		);
		for (const d of encirclingLineData) {
			d.attrs["fill-opacity"] = 0;
		}
		data.push(...encirclingLineData);
	}

	data.push(...chain);

	for (const datum of data) {
		const klass = datum.class;
		delete datum.class;
		if (klass) {
			datum.classes = ["chemical-obj", klass];
		}
	}
	return data;
}

const initialEnergy = 0.6;
const energyCurvePadAbove = 0.035;
const dipeptideCurveInitialY = initialEnergy + energyCurvePadAbove;
const basicDipeptideChainInfo = [
	{
		x: beakerXScale(0.2),
		y: beakerYScale(0.3),
		angles: [0.3],
		colors: [COLORS.blue, null],
		graphX: 0.1,
		graphY: dipeptideCurveInitialY,
	},
	{
		x: beakerXScale(0.4),
		y: beakerYScale(0.58),
		angles: [Math.PI / 8],
		colors: [COLORS.purple, null],
		graphX: 0.17,
		graphY: dipeptideCurveInitialY,
	},
	{
		x: beakerXScale(0.71),
		y: beakerYScale(0.2),
		angles: [Math.PI / 2.3],
		colors: [COLORS.green, null],
		graphX: 0.8,
		graphY: dipeptideCurveInitialY,
	},
	{
		x: beakerXScale(0.63),
		y: beakerYScale(0.4),
		angles: [Math.PI / 0.9],
		colors: [COLORS.blue, null],
		graphX: 0.33,
		graphY: dipeptideCurveInitialY,
	},
	{
		x: beakerXScale(0.42),
		y: beakerYScale(0.25),
		angles: [Math.PI * (1 + 1 / 1.1)],
		colors: [COLORS.purple, null],
		graphX: 0.41,
		graphY: dipeptideCurveInitialY,
	},
	{
		x: beakerXScale(0.38),
		y: beakerYScale(0.43),
		angles: [Math.PI / 1.1],
		colors: [COLORS.green, null],
		graphX: 0.65,
		graphY: dipeptideCurveInitialY,
	},
	{
		x: beakerXScale(0.3),
		y: beakerYScale(0.1),
		angles: [0.4],
		colors: [COLORS.blue, null],
		graphX: 0.9,
		graphY: dipeptideCurveInitialY,
	},
	{
		x: beakerXScale(0.8),
		y: beakerYScale(0.5),
		angles: [1.9],
		colors: [COLORS.purple, null],
		graphX: 0.74,
		graphY: dipeptideCurveInitialY,
	},
	{
		x: beakerXScale(0.5),
		y: beakerYScale(0.1),
		angles: [Math.PI * (1 + 1 / 1.1)],
		colors: [COLORS.green, null],
		graphX: 0.25,
		graphY: dipeptideCurveInitialY,
	},
];

const basicDipeptides = basicDipeptideChainInfo.map(d =>
	makeDipeptideChain({ x: d.x, y: d.y }, d.angles, d.colors),
);

// precondition: joinAngles.length === 2 * (indices.length - 1) (one index per joined chain, two joinAngles per adjacent pair of joined chains)
function joinBasicDipeptides({
	newP0,
	theta0,
	indices,
	joinAngles,
	drawEncirclingLine,
	opaqueEncirclingLineBg,
	dipeptides,
}) {
	if (newP0 === undefined || newP0 === null) {
		const { x: cx, y: cy } = basicDipeptideChainInfo[indices[0]];
		newP0 = { x: cx, y: cy };
	}

	const colors = [];
	const angles = [];
	const ids = [];
	for (let j = 0; j < indices.length; ++j) {
		const chain = dipeptides[indices[j]];
		colors.push(...chain.map(d => d.color));
		ids.push(...chain.map(d => d.id));

		const anglesToOmit = j === 0 ? 1 : 2;
		angles.push(...chain.slice(anglesToOmit).map(d => d.angle));
		if (j !== indices.length - 1) {
			angles.push(joinAngles[2 * j], joinAngles[2 * j + 1]);
		}
	}

	if (theta0 !== undefined) {
		angles[0] = theta0;
	}

	return makeDipeptideChain(newP0, angles, colors, {
		drawEncirclingLine,
		opaqueEncirclingLineBg,
		ids,
	});
}

const randomJoinAngles = [
	-0.3626769162876612,
	1, //-0.37786879838531773,
	1, //-0.03411404967316334,
	0.06750564727078368,
	0.21490286059949115,
	1, //0.02809284890795294,
	-0.4449417705708276,
	-0.12330765915073838,
	1, //-0.334978273287302,
	0.031974644919427364,
	-0.058114824287623934,
	1, //0.15546516732918636,
	-0.20967142597451105,
	1, //0.39435779249912994,
	1, //0.3810119829387127,
	1, //-0.16855002719271528,
	0.14616589504372046,
	-0.4635647539182338,
	-0.3896115422424,
	-0.42834621932104666,
	-0.04019801937756873,
	0.48928649383884604,
];

const stageJoinIndices = {
	[STAGES.initial]: d3.range(basicDipeptides.length).map(i => [i]),
	[STAGES.enzyme]: [[8], [2], [3, 7], [1, 0], [4, 5, 6]],
	[STAGES.ligand]: [
		[0, 1, 5],
		[3, 4, 2],
		[6, 7, 8],
	],
};

function indicesToDipeptideChain({
	indices,
	newP0,
	theta0,
	drawEncirclingLine,
	opaqueEncirclingLineBg,
	dipeptides,
	joinAngles,
}) {
	const allButFirstJoinIndex = indices.slice(1);
	joinAngles = joinAngles ?? [
		...allButFirstJoinIndex.map(j => randomJoinAngles[2 * j]),
		...allButFirstJoinIndex.map(j => randomJoinAngles[2 * j + 1]),
	];
	return joinBasicDipeptides({
		newP0,
		theta0,
		indices,
		joinAngles,
		drawEncirclingLine,
		opaqueEncirclingLineBg,
		dipeptides,
	});
}

const ligandLocs = [
	{ x: 0.2, y: 0.33 },
	{ x: 0.4, y: 0.5 },
	{ x: 0.62, y: 0.3 },
];

function getBeakerData(stage) {
	if (stage === STAGES.initial) {
		return basicDipeptides.flat(Infinity);
	} else if (stage === STAGES.enzyme) {
		const newP0s = [
			{ x: 0.24, y: 0.24 },
			{ x: 0.7, y: 0.53 },
			{ x: 0.55, y: 0.4 },
			{ x: 0.3, y: 0.5 },
			{ x: 0.55, y: 0.2 },
		].map(({ x, y }) => ({ x: beakerXScale(x), y: beakerYScale(y) }));
		return stageJoinIndices[stage]
			.map((indices, j) =>
				indicesToDipeptideChain({
					indices,
					newP0: newP0s[j],
					dipeptides: basicDipeptides,
				}),
			)
			.flat(Infinity);
	} else if (stage === STAGES.ligand) {
		// Magic numbers to get the dipeptides to wrap around the ligand
		const newP0s = ligandLocs.map(({ x, y }) => ({
			x: beakerXScale(x) + CONFIG.symbolPad + 11,
			y: beakerYScale(y) + CONFIG.symbolSize - CONFIG.dipeptideRadius + 1,
		}));
		return stageJoinIndices[stage]
			.map((indices, j) =>
				indicesToDipeptideChain({
					indices,
					newP0: newP0s[j],
					theta0: 0,
					joinAngles: [0, Math.PI / 3, Math.PI / 3, 0],
					dipeptides: basicDipeptides,
				}),
			)
			.flat(Infinity);
	} else {
		throw new Error(`Unexpected containerIndex ${stage}`);
	}
}

function getLengthAtX(pathNode, x) {
	let leftLength = 0;
	let rightLength = pathNode.getTotalLength();
	while (leftLength < rightLength - 1) {
		const middleLength = (leftLength + rightLength) / 2;
		const middlePointX = pathNode.getPointAtLength(middleLength).x;
		if (x < middlePointX) {
			rightLength = middleLength;
		} else {
			leftLength = middleLength;
		}
	}
	return (leftLength + rightLength) / 2;
}

const graphXScale = d3.scaleLinear([-0.1, 1], [0, CONFIG.graphSVGWidth]);
const graphYScale = d3.scaleLinear([-0.1, 1.1], [CONFIG.graphSVGHeight, 0]);
const graphLine = d3
	.line()
	.x(p => graphXScale(p[0]))
	.y(p => graphYScale(p[1]))
	.curve(d3.curveNatural);
const defs = graph.append("defs");
const arrowheadID = "arrowhead";
defineArrowhead(defs, { id: arrowheadID, length: 18, width: 14, color: "black" });

function getPointKey(stage) {
	return stage === STAGES.initial
		? "initial"
		: stage === STAGES.enzyme
		? "enzyme"
		: stage === STAGES.ligand
		? "ligand"
		: null;
}

const energyCurvePoints = [
	{ x: 0.05, initial: 0.7, enzyme: 0.67, ligand: 0.7 },
	{ x: 0.1, initial: 0.75, enzyme: 0.6, ligand: 0.6 },
	{ x: 0.13, initial: 0.63, enzyme: 0.55, ligand: 0.0 },
	{ x: 0.17, initial: 0.5, enzyme: 0.5, ligand: -0.17 },
	{ x: 0.21, initial: 0.68, enzyme: 0.58, ligand: 0.13 },
	{ x: 0.25, initial: 0.83, enzyme: 0.62, ligand: 0.62 },
	{ x: 0.32, initial: 0.5, enzyme: 0.5, ligand: 0.5 },
	{ x: 0.4, initial: 0.92, enzyme: 0.65, ligand: 0.65 },
	{ x: 0.5, initial: 0.38, enzyme: 0.38, ligand: 0.38 },
	{ x: 0.6, initial: 0.92, enzyme: 0.65, ligand: 0.65 },
	{ x: 0.7, initial: 0.55, enzyme: 0.55, ligand: 0.55 },
	{ x: 0.78, initial: 0.84, enzyme: 0.62, ligand: 0.62 },
	{ x: 0.88, initial: 0.5, enzyme: 0.5, ligand: 0.5 },
	{ x: 0.95, initial: 0.7, enzyme: 0.6, ligand: 0.6 },
	{ x: 0.99, initial: 0.8, enzyme: 0.7, ligand: 0.7 },
];

for (const point of energyCurvePoints) {
	for (const key of Object.keys(point)) {
		if (key === "x") {
			continue;
		}
		point[key] += 0.1;
	}
}

function getEnergyCurvePoints(stage) {
	const k = getPointKey(stage);
	return energyCurvePoints.map(point => [point.x, point[k]]);
}

function getEnergyCurveData(stage) {
	return [
		{
			shape: "path",
			class: "energy-curve",
			attrs: {
				d: graphLine(getEnergyCurvePoints(stage)),
				stroke: "black",
				"stroke-width": 2,
				"fill-opacity": 0,
			},
		},
	];
}

function getGraphData(stage) {
	const k = getPointKey(stage);
	return graphBeadLocs
		.map(point => {
			const { x, y } = point[k];
			return [
				{
					shape: "circle",
					class: "graph-bead",
					attrs: {
						cx: x,
						cy: y,
						r: CONFIG.dipeptideRadius - 1,
						stroke: "#333",
						"stroke-width": 1,
						fill: "#fff",
					},
				},
				// {
				// 	shape: "text",
				// 	class: "graph-bead-text",
				// 	text: i,
				// 	attrs: {
				// 		fill: "black",
				// 		"text-anchor": "middle",
				// 		"dominant-baseline": "middle",
				// 		"font-size": 8,
				// 		x,
				// 		y,
				// 	},
				// },
			];
		})
		.flat(Infinity);
}

const equationDipeptides = [
	[{ color: COLORS.blue }, { color: COLORS.green }, { color: COLORS.purple }],
	[{ color: COLORS.purple }, { color: COLORS.blue }],
	[{ color: COLORS.blue }],
	[{ color: COLORS.blue }, { color: COLORS.green }],
	[{ color: COLORS.green }, { color: COLORS.purple }, { color: COLORS.blue }],
];

const indexToCxScale = d3.scaleLinear([-2, 2], [200, 700]);
// -2 <= index <= 2
// We draw the chain from the bottom left corner up to the top right corner
function getEquationDipeptideData(index, showLigand) {
	const r = CONFIG.dipeptideRadius;

	const sign = index < 0 ? -1 : 1;
	const indexMag = Math.abs(index);
	const chainCx = indexToCxScale(index);
	const chainCy = CONFIG.equationSVGHeight / 2;

	const ligandX = chainCx - CONFIG.symbolSize / 2;
	const ligandY = chainCy - CONFIG.symbolSize / 2;

	const circles = [];
	const ligands = [];

	if (index === -2) {
		ligands.push({
			shape: "use",
			id: "eqn-ligand",
			classes: ["eqn-chain", "eqn-ligand"],
			attrs: {
				"xlink:href": "#symbol-ligand",
				transform: `translate(${ligandX}, ${ligandY})`,
			},
			styles: {
				opacity: 0,
			},
		});
	}

	const preconfiguredDipeptides = equationDipeptides[-index + 2];
	// Walk the chain in pairs from the bottom up
	for (let i = 0; i <= indexMag; ++i) {
		let cx1, cy1, cx2, cy2;

		if (showLigand && index === -2) {
			const baseCx = ligandX + CONFIG.symbolPad + 11;
			const baseCy = ligandY + CONFIG.symbolSize - CONFIG.dipeptideRadius + 1;

			const angle = Math.PI / 3;

			if (i === 2) {
				cx2 = baseCx;
				cy2 = baseCy;
				cx1 = cx2 + 2 * r;
				cy1 = baseCy;
			} else if (i === 1) {
				cx2 = baseCx + 4 * r;
				cy2 = baseCy;
				cx1 = cx2 + 2 * r * Math.cos(angle);
				cy1 = cy2 - 2 * r * Math.sin(angle);
			} else {
				cx2 = baseCx + 4 * r;
				cy2 = baseCy - 4 * r * Math.sin(angle);
				cx1 = cx2 - 2 * r * Math.cos(angle);
				cy1 = cy2 - 2 * r * Math.sin(angle);
			}

			ligands[0].styles.opacity = 1;
		} else {
			cx1 = chainCx;
			cy1 = chainCy + (4 * i - 2 * indexMag - 1) * r;
			cx2 = chainCx;
			cy2 = cy1 + 2 * r;
		}

		const peptideColor = preconfiguredDipeptides[i].color;
		const fill1 = COLORS.orange;
		const fill2 = peptideColor;
		circles.push(
			{
				shape: "circle",
				classes: ["eqn-chain", "peptide"],
				id: `${sign}_${i}_${index}_a`,
				index,
				attrs: {
					cx: cx1,
					cy: cy1,
					fill: fill1,
					r,
				},
			},
			{
				shape: "circle",
				classes: ["eqn-chain", "peptide"],
				id: `${sign}_${i}_${index}_b`,
				index,
				attrs: {
					cx: cx2,
					cy: cy2,
					fill: fill2,
					r,
				},
			},
		);
	}

	// const ligandData = [];
	// if (indexMag === 2) {
	// 	const line = d3
	// 		.line()
	// 		.x(p => p[0])
	// 		.y(p => p[1]);

	// 	for (let i = 0; i < elData.length; ++i) {
	// 		const d = elData[i];

	// 		d.id = `${sign}_${i}_${index}_d`;

	// 		d.classes = d.classes || [];
	// 		d.classes.push("eqn-chain");

	// 		d.styles = d.styles || {};
	// 		d.styles.opacity =
	// 			d.class === "ligand-interior" || drawEncirclingLine ? 1 : 0;
	// 	}
	// }

	return [...circles, ...ligands];
}
function getEquationChainData(stage) {
	const indices = d3.range(-2, 2 + 1);
	const chains = indices
		.map(i => getEquationDipeptideData(i, stage === STAGES.ligand))
		.flat(Infinity)
		.sort((a, b) => {
			const shapeToNum = shape => (shape === "path" ? 2 : shape === "line" ? 1 : 0);
			const aVal = shapeToNum(a.shape);
			const bVal = shapeToNum(b.shape);
			return bVal - aVal;
		});

	const maxIndex = stage === STAGES.initial ? 0 : 2;

	for (const chain of chains) {
		chain.styles = chain.styles || {};
		if (chain.styles.opacity === undefined) {
			chain.styles.opacity = Math.abs(chain.index) <= maxIndex ? 1 : 0;
		}
	}

	const arrowCenterIndices = indices.slice(0, -1).map(i => i + 0.5);
	const arrows = arrowCenterIndices.map(i => ({
		shape: "use",
		classes: ["eqn-chain", "eqn-arrow"],
		id: `arrow-${i.toFixed(3)}`,
		attrs: {
			"xlink:href": "#symbol-eqn-arrow",
			transform: `translate(${
				indexToCxScale(i) - CONFIG.symbolSize / 2 - CONFIG.dipeptideRadius + 8 // 8 is a magic alignment number
			}, ${CONFIG.equationSVGHeight / 2 - CONFIG.symbolSize / 2})`,
		},
		styles: {
			opacity: Math.abs(i) <= maxIndex ? 1 : 0,
		},
	}));

	return [...chains, ...arrows];
}

// Adapted https://stackoverflow.com/a/52291755
// Compute an array arr of path [x,y] pairs such that arr[i] === pathNode.getPointAtLength(i/(N_PRECOMPUTED_PATH_POINTS-1) * pathNode.getTotalLength())
const N_PRECOMPUTED_PATH_POINTS = 3000;
const energyCurvePathPoints = {};
function precomputeAndCachePathPoints(pathNode, nPoints) {
	for (const stage of [STAGES.initial, STAGES.enzyme, STAGES.ligand]) {
		pathNode.setAttribute("d", graphLine(getEnergyCurvePoints(stage)));

		const step = pathNode.getTotalLength() / (nPoints - 1);
		energyCurvePathPoints[stage] = [];
		for (let i = 0; i < nPoints; ++i) {
			const length = i * step;
			const { x, y } = pathNode.getPointAtLength(length);
			energyCurvePathPoints[stage].push([x, y]);
		}
	}
}

const buttons = {
	addEnzyme: document.getElementById("btn-add-enzyme"),
	addLigand: document.getElementById("btn-add-ligand"),
	reset: document.getElementById("btn-reset"),
};
function initialize() {
	// Disable buttons
	buttons.addEnzyme.disabled = false;
	buttons.addLigand.disabled = true;
	buttons.reset.disabled = true;

	const { background, foreground } = getBeakerOutlineData();

	applyGraphicalObjs(beaker, background);
	applyGraphicalObjs(beaker, getBeakerData(STAGES.initial), { key: d => d.id });
	applyGraphicalObjs(beaker, foreground);

	// Graph axes
	applyGraphicalObjs(graph, [
		{
			shape: "line",
			class: "y-axis",
			attrs: {
				x1: graphXScale(0),
				x2: graphXScale(0),
				y1: graphYScale(-0.1),
				y2: graphYScale(1.05),
				stroke: "black",
				"stroke-width": 3,
				"marker-end": `url(#${arrowheadID})`,
			},
		},
		{
			shape: "text",
			class: "y-axis-label",
			text: "Energy",
			attrs: {
				fill: "black",
				transform: `
				translate(${graphXScale(0) - 10} ${graphYScale(0.5)})
				rotate(-90)
				`,
				"font-size": 20,
				"text-anchor": "middle",
				"dominant-baseline": "bottom",
			},
		},
	]);
	// Initial energy curve
	const energyCurve = applyGraphicalObjs(graph, getEnergyCurveData(STAGES.initial));
	precomputeAndCachePathPoints(energyCurve.node(), N_PRECOMPUTED_PATH_POINTS);
	energyCurve.attr("d", graphLine(getEnergyCurvePoints(STAGES.initial)));

	// Initial dipeptides on the graph
	applyGraphicalObjs(graph, getGraphData(STAGES.initial));

	applyGraphicalObjs(equation, getEquationChainData(STAGES.initial));
}

const DIPEPTIDE_SELECTOR = "circle.chemical-obj";
const LIGAND_SELECTOR = "path.chemical-obj";

function fadeligands(svg, fadeDuration, fadeDelay) {
	fadeDelay = fadeDelay ?? 0;

	svg
		.selectAll(`${LIGAND_SELECTOR}.ligand-exterior`)
		.transition()
		.delay(fadeDelay)
		.duration(fadeDuration)
		.style("opacity", 0)
		.end()
		.then(() => {
			svg
				.selectAll(LIGAND_SELECTOR)
				.transition()
				.duration(100)
				.attr("stroke-width", 0)
				.remove();
		});
}

const substanceDropDuration = 1000;
function dropSubstanceIntoBeaker(stage) {
	if (stage === STAGES.initial) {
		return;
	}
	const symbol = stage === STAGES.enzyme ? "#symbol-enzyme" : "#symbol-ligand";
	const ty = -50;
	const symbols = beaker
		.selectAll("use")
		.data([
			{ ...ligandLocs[0], delay: stage === STAGES.enzyme ? 200 : 450 },
			{ ...ligandLocs[1], delay: 0 },
			{ ...ligandLocs[2], delay: stage === STAGES.enzyme ? 400 : 150 },
		])
		.join(enter => enter.insert("use", ".beaker-lid-front"))
		.classed("beaker-dropped-substance", true)
		.attr("xlink:href", symbol)
		.attr("transform", d => `translate(${beakerXScale(d.x)} ${ty})`)
		.style("opacity", 1);

	const dropEndY = CONFIG.fluidHeight;
	const t = symbols
		.transition()
		.ease(d3.easeCubicIn)
		.duration(substanceDropDuration)
		.delay(d => d.delay)
		.attr(
			"transform",
			d => `translate(${beakerXScale(d.x)} ${beakerYScale(CONFIG.fluidHeight + 0.1)})`,
		);

	if (stage === STAGES.enzyme) {
		t.transition()
			.ease(d3.easePolyOut.exponent(2.3))
			.duration(1200)
			.attr(
				"transform",
				d => `
					translate(
						${beakerXScale(d.x)}
						${beakerYScale(dropEndY - 0.1)})`,
			)
			.style("opacity", 0);
	} else {
		t.transition()
			.ease(d3.easePolyOut.exponent(1.2))
			.duration(450)
			.attr(
				"transform",
				d => `
					translate(
						${beakerXScale(d.x)}
						${beakerYScale(dropEndY - 0.06)})`,
			)
			.transition()
			.ease(d3.easeCubicOut)
			.duration(d => 9000 * Math.abs(dropEndY - d.y))
			.attr(
				"transform",
				d => `
					translate(
						${beakerXScale(d.x)}
						${beakerYScale(d.y)})`,
			);
	}
}

const energyCurveChangeDelay = 500;
const energyCurveChangeDuration = 1500;
const dipeptideResetDuration = 1500;
const dipeptideMovementDuration = 4000;
const dipeptideMovementDelayAfterEnzyme = 750 + substanceDropDuration;
const dipeptideMovementDelayAfterLigand = 1350 + substanceDropDuration;
const ligandAppearDuration = 700;
const ligandExteriorAppearPreappearTime = 300;
const ligandFadeDuration = 200;
const defaultEnergyWellFadeDuration = 900;
const graphRecedeDuration = 500;
const energyWell3DTransitionDuration = 7500;

function applyDataToSvg(svg, { stage, data, tweens, thens }) {
	const { [DIPEPTIDE_SELECTOR]: dipeptideData, [LIGAND_SELECTOR]: ligandData } =
		groupBy(
			data,
			d => `${d.shape}.chemical-obj`,
			[DIPEPTIDE_SELECTOR, LIGAND_SELECTOR],
			false,
		);

	const energyWellFadeDuration =
		stage === STAGES.initial && prevStage === STAGES.energyWell
			? defaultEnergyWellFadeDuration
			: 0;
	const dipeptideMovementDelay =
		stage === STAGES.initial && prevStage === STAGES.energyWell
			? energyWellFadeDuration
			: stage === STAGES.enzyme
			? dipeptideMovementDelayAfterEnzyme
			: dipeptideMovementDelayAfterLigand;
	const dipeptideResetDelay = energyWellFadeDuration + ligandFadeDuration;
	const dipeptideMovementTransition = d3
		.transition()
		.delay(dipeptideMovementDelay)
		.duration(dipeptideMovementDuration);

	let totalTransitionDuration;

	const dipeptideSelector = svg === beaker ? DIPEPTIDE_SELECTOR : ".graph-bead";

	if (svg === beaker) {
		// Animate the dipeptides moving
		if (stage === STAGES.initial) {
			fadeligands(svg, ligandFadeDuration, energyWellFadeDuration);
			applyGraphicalObjs(svg, dipeptideData, {
				selector: dipeptideSelector,
				key: d => d.id,
				transition: d3
					.transition("dipeptideReset")
					.delay(dipeptideResetDelay)
					.duration(dipeptideResetDuration),
			});
			totalTransitionDuration =
				(prevStage === STAGES.energyWell ? energyWellFadeDuration : 0) +
				energyCurveChangeDelay +
				energyCurveChangeDuration;
		} else if (stage === STAGES.enzyme) {
			applyGraphicalObjs(svg, dipeptideData, {
				selector: DIPEPTIDE_SELECTOR,
				key: d => d.id,
				transition: d3.transition(dipeptideMovementTransition),
			});

			// Only for testing; in the actual demo ligands don't appear at this stage
			applyGraphicalObjs(svg, ligandData, {
				selector: LIGAND_SELECTOR,
				transition: d3.transition().duration(ligandAppearDuration),
			});
			totalTransitionDuration = dipeptideMovementDelay + dipeptideMovementDuration;
		} else if (stage === STAGES.ligand) {
			applyGraphicalObjs(svg, dipeptideData, {
				selector: DIPEPTIDE_SELECTOR,
				key: d => d.id,
				transition: d3.transition(dipeptideMovementTransition),
			});
			applyGraphicalObjs(svg, ligandData, {
				selector: LIGAND_SELECTOR,
				transition: d3
					.transition()
					.delay(dipeptideMovementDelay + dipeptideMovementDuration * 0.6)
					.duration(ligandAppearDuration),
			});
			svg.selectAll(`${LIGAND_SELECTOR}.ligand-exterior`).style("opacity", 0);
			svg.selectAll(`${LIGAND_SELECTOR}.ligand-interior`).style("opacity", 1);
			svg
				.selectAll(`${LIGAND_SELECTOR}.ligand-exterior`)
				.transition("exterior")
				.delay(
					dipeptideMovementDelay +
						dipeptideMovementDuration -
						ligandExteriorAppearPreappearTime,
				)
				.duration(ligandAppearDuration)
				.style("opacity", 1);

			const firstDipeptide = svg.selectAll(DIPEPTIDE_SELECTOR).node();
			const fragment = document.createDocumentFragment();
			svg.selectAll(LIGAND_SELECTOR).each(function () {
				fragment.appendChild(this);
			});
			firstDipeptide.parentNode.insertBefore(fragment, firstDipeptide);

			totalTransitionDuration =
				dipeptideMovementDelay + dipeptideMovementDuration * 0.6 + ligandAppearDuration;
		} else {
			throw new Error(`Invalid stage ${stage}`);
		}
	} else {
		// eslint-disable-next-line no-unused-vars
		const [beads, text] = groupBy(data, d => d.shape, ["circle", "text"], true).map(
			pair => pair[1],
		);

		svg.selectAll(dipeptideSelector).data(beads);
		// applyGraphicalObjs(svg, beads, {
		// 	selector: dipeptideSelector,
		// 	transition: d3.transition(dipeptideMovementTransition),
		// });
		// applyGraphicalObjs(svg, text, {
		// 	selector: ".graph-bead-text",
		// 	// transition: d3.transition(dipeptideMovementTransition),
		// });

		totalTransitionDuration = dipeptideMovementDelay + dipeptideMovementDuration;
	}

	if (tweens !== undefined) {
		for (const [name, tween] of Object.entries(tweens)) {
			const t = svg
				.selectAll(dipeptideSelector)
				.transition(name)
				.delay(stage === STAGES.initial ? dipeptideResetDelay : dipeptideMovementDelay)
				.duration(
					stage === STAGES.initial ? dipeptideResetDuration : dipeptideMovementDuration,
				)
				.tween(name, tween);

			if (thens !== undefined && thens[name] !== undefined) {
				t.end()
					.then(thens[name])
					.catch(() => {});
			}
		}
	}

	return totalTransitionDuration - 100;
}

const energyWellGraph = d3
	.select("#energy-well-plot")
	.style("display", "none")
	.style("opacity", 0);
const bottomGraphContainer = d3
	.select("#bottom-graph-container")
	.style("transform", "translate(0 0)");

// eslint-disable-next-line no-unused-vars
function update(stage) {
	for (const button of Object.values(buttons)) {
		button.disabled = true;
	}

	if (stage === STAGES.energyWell) {
		const wellCenterX = graphXScale(0.165);
		const wellCenterY = graphYScale(0);
		const wellEllipseRx = 60;
		const wellEllipseRy = 10;
		const wellEllipseCy = wellCenterY - 40;
		const arcSweepDuration = 2000;
		const ellipseCircumference = 255; // Trial and error
		const halfCircumference = ellipseCircumference / 2;
		const sweepColor = "#579";
		graph
			.append("path")
			.classed("well-circle", true)
			.attr(
				"d",
				`
				M ${wellCenterX - wellEllipseRx} ${wellEllipseCy}
				a ${wellEllipseRx} ${wellEllipseRy} 0 0 0 ${2 * wellEllipseRx} 0
			`,
			)
			.attr("stroke-dasharray", halfCircumference)
			.attr("stroke-dashoffset", halfCircumference)
			.attr("stroke", sweepColor)
			.attr("stroke-width", 2)
			.attr("fill-opacity", 0)
			.transition()
			.duration(arcSweepDuration / 2)
			.ease(d3.easeCubicIn)
			.attr("stroke-dashoffset", 0);

		graph
			.insert("path", ".energy-curve")
			.classed("well-circle", true)
			.attr(
				"d",
				`
				M ${wellCenterX + wellEllipseRx} ${wellEllipseCy}
				a ${wellEllipseRx} ${wellEllipseRy} 0 1 0 ${-2 * wellEllipseRx} 0
			`,
			)
			.attr("stroke-dasharray", halfCircumference)
			.attr("stroke-dashoffset", halfCircumference)
			.attr("stroke", sweepColor)
			.attr("stroke-width", 2)
			.attr("fill-opacity", 0)
			.transition()
			.delay(arcSweepDuration / 2)
			.duration(arcSweepDuration / 2)
			.ease(d3.easeCubicOut)
			.attr("stroke-dashoffset", 0);
		energyWellGraph
			.style("display", "initial")
			.transition()
			.delay(arcSweepDuration)
			.duration(defaultEnergyWellFadeDuration)
			.style("opacity", 1)
			.end()
			.then(() => {
				let t = d3;
				for (let i = 0; i < 4; ++i) {
					const ease = i === 3 ? d3.easeLinear : d3.easeCubic;
					t = t
						.transition()
						.duration(energyWell3DTransitionDuration)
						.ease(ease)
						.tween("3dEnergyWell", () => {
							// eslint-disable-next-line no-use-before-define
							return t => plotEnergyWell(t + i);
						});
				}
			});
		bottomGraphContainer
			.transition()
			.delay(arcSweepDuration)
			.duration(graphRecedeDuration)
			.style("transform", "translate(-200px,0px)");

		setTimeout(() => {
			buttons.reset.disabled = false;
		}, arcSweepDuration + defaultEnergyWellFadeDuration + 4 * energyWell3DTransitionDuration);

		prevStage = stage;
		return;
	} else if (stage === STAGES.initial) {
		graph
			.selectAll(".well-circle")
			.transition()
			.duration(graphRecedeDuration)
			.style("opacity", 0)
			.remove();
		beaker
			.selectAll(".beaker-dropped-substance")
			.transition()
			.delay(energyCurveChangeDelay)
			.duration(dipeptideResetDuration / 2)
			.style("opacity", 0);
		bottomGraphContainer
			.transition()
			.duration(defaultEnergyWellFadeDuration)
			.style("transform", null);
		energyWellGraph
			.transition()
			.duration(300)
			.style("opacity", 0)
			.transition()
			.style("display", "none");
		// eslint-disable-next-line no-use-before-define
		plotEnergyWell(0);
	}

	dropSubstanceIntoBeaker(stage);

	applyDataToSvg(beaker, { stage, data: getBeakerData(stage) });

	// Animate the energy curve itself
	const energyCurve = graph.selectAll(".energy-curve");

	const finalEnergyCurvePathString = graphLine(getEnergyCurvePoints(stage));

	const energyCurveDelay =
		stage === STAGES.initial
			? prevStage === STAGES.energyWell
				? defaultEnergyWellFadeDuration + energyCurveChangeDelay
				: energyCurveChangeDelay
			: substanceDropDuration;
	const energyCurveDuration =
		stage === STAGES.initial ? dipeptideResetDuration : energyCurveChangeDuration;

	energyCurve
		.transition()
		.delay(energyCurveDelay)
		.duration(energyCurveDuration)
		.attr("d", finalEnergyCurvePathString);

	const tempFinalPath = graph
		.append("path")
		.classed("temp-path", true)
		.attr("opacity", 0)
		.attr("d", finalEnergyCurvePathString);
	const tempFinalPathNode = tempFinalPath.node();
	const indexScale = d3
		.scaleLinear()
		.domain([0, tempFinalPathNode.getTotalLength()])
		.rangeRound([0, N_PRECOMPUTED_PATH_POINTS - 1]);

	const thisPathPoints = energyCurvePathPoints[stage];
	// Animate the dipeptides moving along the energy curve

	// Animate them moving vertically as the curve changes shape
	// if (stage === STAGES.enzyme) {
	// 	for (const dipeptide of horizontalGraphDipeptides) {
	// 		const cxs = dipeptide.map(dp => dp.attrs.cx);
	// 		const lengths = cxs.map(cx => getLengthAtX(tempFinalPathNode, cx));
	// 		const pointIndices = lengths.map(l => indexScale(l));
	// 		const cys = pointIndices.map(pi => thisPathPoints[pi][1]);
	// 		const cy = Math.min(...cys) - 20;

	// 		const [dp1, dp2] = dipeptide;
	// 		graph
	// 			.selectAll(".graph-dipeptide")
	// 			.filter(d => d.id === dp1.id || d.id === dp2.id)
	// 			.transition()
	// 			.delay(energyCurveDelay)
	// 			.duration(energyCurveChangeDuration * 0.97)
	// 			.attr("cy", cy);
	// 	}
	// }

	const graphData = getGraphData(stage);
	function graphDipeptideTween(d) {
		const { cx: finalCx, cy: finalCy } = d.attrs;

		const initialLength = getLengthAtX(tempFinalPathNode, this.getAttribute("cx"));
		const initialPoint = tempFinalPathNode.getPointAtLength(initialLength);
		const initialDistAboveCurve = this.getAttribute("cy") - initialPoint.y;

		const finalLength = getLengthAtX(tempFinalPathNode, finalCx);
		const finalPoint = tempFinalPathNode.getPointAtLength(finalLength);
		const finalDistAboveCurve = finalCy - finalPoint.y;

		// if (stage === STAGES.initial) {
		// 	const initialCx = this.getAttribute("cx");
		// 	const initialCy = this.getAttribute("cy");
		// 	const maxHeight = 0.3 * Math.abs(initialCx - finalCx);
		// 	const straightLineXScale = d3.scaleLinear([0, 1], [initialCx, finalCx]);
		// 	const straightLineYScale = d3.scaleLinear([0, 1], [initialCy, finalCy]);

		// 	const distAboveStraightLineEase = t => Math.sqrt(2 * t);
		// 	const distAboveStraightLineScale = t =>
		// 		t < 0.5
		// 			? 2 * distAboveStraightLineEase(t)
		// 			: 2 * distAboveStraightLineEase(1 - t);

		// 	return t => {
		// 		this.setAttribute("cx", straightLineXScale(t));
		// 		this.setAttribute(
		// 			"cy",
		// 			straightLineYScale(t) - maxHeight * distAboveStraightLineScale(t),
		// 		);
		// 	};
		// }

		const distAboveCurveScale = d3
			.scalePow([0, 1], [initialDistAboveCurve, finalDistAboveCurve])
			.exponent(0.5);

		const lengthScale = d3.scaleLinear([0, 1], [initialLength, finalLength]);

		// const yScale = d3.scaleLinear([0, 1], [cy, this.getAttribute("cy")]);
		return t => {
			// const length = lengthScale(t);
			// const point = tempFinalPathNode.getPointAtLength(length);
			// const curveY = point.y;
			// const distAboveCurve = distAboveCurveScale(t);
			// return curveY + distAboveCurve;

			const length = lengthScale(t);
			const pointIndex = indexScale(length);
			const [x, y] = thisPathPoints[pointIndex];

			this.setAttribute("cx", x);
			this.setAttribute("cy", y + distAboveCurveScale(t));
		};
	}

	const totalTransitionDuration = applyDataToSvg(graph, {
		stage,
		data: graphData,
		tweens: { "graph-dipeptide-position": graphDipeptideTween },
		thens: {
			"graph-dipeptide-position": () => {
				graph.selectAll(".temp-path").remove();

				if (stage === STAGES.ligand) {
					update(STAGES.energyWell);
				}
			},
		},
	});

	setTimeout(
		() => {
			if (stage !== STAGES.ligand) {
				const nextButton =
					stage === STAGES.initial
						? buttons.addEnzyme
						: stage === STAGES.enzyme
						? buttons.addLigand
						: stage === STAGES.energyWell
						? buttons.reset
						: null;
				nextButton.disabled = false;
				buttons.reset.disabled = stage === STAGES.initial;
			}
		},
		stage === STAGES.initial ? 1000 + dipeptideResetDuration : totalTransitionDuration,
	);

	// Do the chemical equation at the bottom
	const eqnData = getEquationChainData(stage);
	const transition = d3
		.transition()
		.delay(
			stage === STAGES.enzyme || stage === STAGES.ligand
				? dipeptideMovementDelayAfterEnzyme +
						dipeptideMovementDuration -
						ligandExteriorAppearPreappearTime
				: prevStage === STAGES.energyWell
				? defaultEnergyWellFadeDuration
				: 0,
		)
		.duration(stage === STAGES.initial ? dipeptideResetDuration : ligandAppearDuration);

	if (stage === STAGES.initial) {
		const eqnDataOrig = eqnData.map(d => ({ ...d }));
		for (const datum of eqnData) {
			datum.attrs = {};
		}
		applyGraphicalObjs(equation, eqnData, {
			key: d => d.id,
			selector: ".eqn-chain",
			transition: transition.end().then(() => {
				applyGraphicalObjs(equation, eqnDataOrig, {
					key: d => d.id,
					selector: ".eqn-chain",
				});
			}),
		});
	} else {
		applyGraphicalObjs(equation, eqnData, {
			key: d => d.id,
			selector: ".eqn-chain",
			transition,
		});
	}

	// equation
	// 	.selectAll(".eqn-chain")
	// 	.data(eqnData)
	// 	.join(
	// 		enter => enter.append(),
	// 		update =>
	// 			update.transition(transition).style("opacity", d => d.styles.opacity),
	// 		remove => remove.transition(transition).style("opacity", 0).remove(),
	// 	);

	prevStage = stage;
}

initialize();

function get3DSphereDatum({ cx, cy, cz, color, opacity, lighting, peptide }) {
	return {
		type: "mesh3d",
		x: peptide.x.map(x => cx + x),
		y: peptide.y.map(y => cy + y),
		z: peptide.z.map(z => cz + z),
		i: peptide.simplices.map(s => s[0]),
		j: peptide.simplices.map(s => s[1]),
		k: peptide.simplices.map(s => s[2]),
		facecolor: peptide.simplices.map(() => color ?? COLORS.orange),
		opacity,
		lighting,
	};
}

function clamp(value, min, max) {
	return value < min ? min : value > max ? max : value;
}

let firstPlot = true;
const graphDiv = document.getElementById("energy-well-plot");
// t has four stages:
// [0, 1]: the initial beads are moving around the single energy well strip
// [1, 2]: the well graph widens to four units wide
// [2, 3]: each other strip has the beads moving around on it
// [3, 4]: the beads are replaced by dipeptides
function plotEnergyWell(t) {
	const surfaceLighting = {
		ambient: 0.7,
		roughness: 0.6,
		diffuse: 0.6,
		specular: 0.9,
	};
	const sphereLighting = {
		ambient: 0.5,
		roughness: 1,
		diffuse: 0.6,
		specular: 0.5,
	};
	const { well, peptide } = DIPEPTIDE_WELL;

	const data = [
		{
			type: "mesh3d",
			x: well.x,
			y: well.y,
			z: well.z,
			i: well.simplices.map(s => s[0]),
			j: well.simplices.map(s => s[1]),
			k: well.simplices.map(s => s[2]),
			facecolor: well.simplices.map(() => "#234"),
			lighting: surfaceLighting,
		},
		...well.gridlines.map(gridline => ({
			type: "scatter3d",
			mode: "lines",
			x: gridline.map(p => p[0]),
			y: gridline.map(p => p[1]),
			z: gridline.map(p => p[2] + 0.01),
			line: {
				width: 3,
				color: "#789",
			},
			lighting: surfaceLighting,
		})),
	];

	const diameter = 1;

	const xIndexInterpolator = d3
		.scaleLinear([0, well.grid.length - 1], [Math.min(...well.x), Math.max(...well.x)])
		.clamp(true);

	const wellIndexToYInterpolator = d3
		.scaleLinear([-0.5, 3.5], [Math.min(...well.y), Math.max(...well.y)])
		.clamp(true);

	const yIndexInterpolator = d3
		.scaleLinear(
			[0, well.grid[0].length - 1],
			[Math.min(...well.y), Math.max(...well.y)],
		)
		.clamp(true);

	function xsToPoints(xs, wellIndex) {
		const tClamped = clamp(t, 0, 1);
		return xs.map(([x, yAdjust, zAdjust]) => {
			const y = wellIndexToYInterpolator(wellIndex) + yAdjust;

			// Since the well is a grid of points (an xIndex-by-yIndex array of z
			// values), we have to interpolate between the "raw" indices we get by
			// naively inverting the values (which won't necessarily be integers) and
			// the integer indices on the grid. So, we obtain the z-values  at the four
			// corners of the smallest grid unit surrounding the selected point and
			// interpolate between them
			const xIndexRaw = xIndexInterpolator.invert(x);
			const xLowerIndex = Math.floor(xIndexRaw);
			const xUpperIndex = Math.ceil(xIndexRaw);

			const yIndexRaw = yIndexInterpolator.invert(y);
			const yLowerIndex = Math.floor(yIndexRaw);
			const yUpperIndex = Math.ceil(yIndexRaw);

			function makeXInterpolator(yIndex) {
				return d3.scaleLinear(
					[xLowerIndex, xUpperIndex],
					[well.grid[yIndex][xLowerIndex], well.grid[yIndex][xUpperIndex]],
				);
			}
			const zAtXAndLowerY = makeXInterpolator(yLowerIndex)(xIndexRaw);
			const zAtXAndUpperY = makeXInterpolator(yUpperIndex)(xIndexRaw);

			const zAtXY = d3.scaleLinear(
				[yLowerIndex, yUpperIndex],
				[zAtXAndLowerY, zAtXAndUpperY],
			)(yIndexRaw);

			const z = zAtXY + tClamped * zAdjust * diameter;

			return { x, y, z };
		});
	}

	const beadOpacityInterpolator = d3.scaleLinear([3, 3.3], [1, 0]).clamp(true);
	const beadOpacity = t < 3 ? 1 : beadOpacityInterpolator(t);

	if (beadOpacity > 0) {
		// List of lists of [xInitial, xFinal, yAdjust, zAdjust]; ys inferred from the well index, zs inferred from x and y
		// Initial and final will be interpolated between to get the current value
		// yAdjust is a fudge factor to get the spheres within a well strip to not all lie on the same line
		// zAdjust is a fudge factor (to be multiplied by diameter) to get the sphere to be centered not at z, but some higher value
		// wellBeadLocs[0] is the bottommost strip, [1] is the next up, [2] is the next up and is the one displayed first, and [3] is the topmost
		const wellBeadLocs = [
			[
				[0.1, 4 * Math.PI, 0.1, 1],
				[1.2, 3.8 * Math.PI, 0.8, 1.3],
				[4.4, 4.3 * Math.PI, -0.3, 1.3],
				[-2.3, 4.5 * Math.PI, -1, 1.3],
				[-3.6, 3.7 * Math.PI, 0.5, 1.3],
				[-7.4, 4 * Math.PI, -0.6, 1.2],
				[7.8, 4.2 * Math.PI, 0.7, 1.2],
				[8.9, 3.9 * Math.PI, -0.8, 1.3],
			],
			[
				[0.9, -2 * Math.PI, 0.1, 1],
				[1.8, -1.8 * Math.PI, 0.8, 1.3],
				[2, -2.3 * Math.PI, -0.3, 1.3],
				[-2.4, -2.5 * Math.PI, -0.8, 1.1],
				[-5.3, -1.7 * Math.PI, 0.6, 1.2],
				[-7, -2 * Math.PI, 0.8, 1.1],
				[8.3, -2.2 * Math.PI, 0.9, 1.2],
				[10.3, -1.9 * Math.PI, -0.8, 1.2],
			],
			[
				[-5, -4 * Math.PI, 0.1, 1],
				[-8, -3.8 * Math.PI, 0.8, 1.3],
				[4, -4.3 * Math.PI, -0.3, 1.4],
				[-2, -4.2 * Math.PI, -0.6, 1.3],
				[-3.3, -3.7 * Math.PI, 0.4, 1.3],
				[-4, -4 * Math.PI, -0.5, 1.3],
				[7, -4.2 * Math.PI, 0.5, 1.3],
				[8, -3.9 * Math.PI, -0.8, 1.2],
			],
			[
				[-1, -3.8 * Math.PI, 0.1, 1.2],
				[2, -4 * Math.PI, 0.8, 1.1],
				[4.5, -4.1 * Math.PI, -0.3, 1.3],
				[-2.7, -4.3 * Math.PI, -0.8, 1.4],
				[-3, -3.6 * Math.PI, 0.7, 1.4],
				[-4.7, -4.1 * Math.PI, 0.6, 1.2],
				[-9, -4.2 * Math.PI, 0.7, 1.3],
				[11.4, -3.8 * Math.PI, -0.8, 1.2],
			],
		]
			.map((wellList, wellIndex) => {
				const tClamped = wellIndex === 2 ? clamp(t, 0, 1) : clamp(t, 2, 3) - 2;
				return wellList.map(([xi, xf, yAdjust, zAdjust]) => {
					const x = xi * (1 - tClamped) + xf * tClamped;
					return [x, yAdjust, zAdjust];
				});
			})
			.map(xsToPoints);

		for (const points of wellBeadLocs) {
			for (const point of points) {
				const { x, y, z } = point;
				data.push(
					get3DSphereDatum({
						cx: x,
						cy: y,
						cz: z,
						color: "white",
						opacity: beadOpacity,
						lighting: sphereLighting,
						peptide,
					}),
				);
			}
		}
	}

	const dipeptideOpacityInterpolator = d3.scaleLinear([3.4, 3.7], [0, 1]).clamp(true);
	const dipeptideOpacity = dipeptideOpacityInterpolator(t);

	if (dipeptideOpacity > 0) {
		// rest is [dtheta, dphi, color]
		// the order corresponds to the order of the energy wells above
		const chainsInfo = [
			{
				initial: {
					cx: 4 * Math.PI,
					color: null,
				},
				rest: [
					[0.2, 0.9, COLORS.blue],
					[0.4, 0.4, null],
					[0.4, 0.1, COLORS.green],
					[0.5, -0.1, null],
					[0.5, -0.3, COLORS.purple],
				],
			},
			{
				initial: {
					cx: -2 * Math.PI,
					color: null,
				},
				rest: [
					[0.2, 0.9, COLORS.blue],
					[-1, 0.1, null],
					[-0.6, 0.6, COLORS.purple],
				],
			},
			{
				initial: { cx: -4 * Math.PI, color: null },
				rest: [
					[1.8, 1.1, COLORS.purple],
					[-1, 0.1, null],
					[-0.1, 0.1, COLORS.green],
					[-1, 0.1, null],
					[-0.6, 0.1, COLORS.blue],
				],
			},
			{
				initial: { cx: -4 * Math.PI, color: null },
				rest: [
					[0.4, 0.9, COLORS.purple],
					[0.4, 0.1, null],
					[0.4, 0.2, COLORS.blue],
				],
			},
		];
		chainsInfo.forEach(({ initial, rest }, wellIndex) => {
			const dy = initial.dy ?? 0;
			const initialColor = initial.color;
			let cx = initial.cx;
			let cy = wellIndexToYInterpolator(wellIndex) + dy;

			const xIndex = Math.floor(xIndexInterpolator.invert(cx));
			const yIndex = Math.floor(yIndexInterpolator.invert(cy));

			let cz = well.grid[yIndex][xIndex] + diameter;
			data.push(
				get3DSphereDatum({
					cx,
					cy,
					cz,
					color: initialColor,
					opacity: dipeptideOpacity,
					lighting: sphereLighting,
					peptide,
				}),
			);

			let theta = 0;
			let phi = 0;
			for (const [dTheta, dPhi, color] of rest) {
				theta += dTheta;
				phi += dPhi;
				cx += diameter * Math.cos(theta) * Math.cos(phi);
				cy += diameter * Math.sin(theta) * Math.cos(phi);
				cz += diameter * Math.sin(phi);
				data.push(
					get3DSphereDatum({
						cx,
						cy,
						cz,
						color,
						opacity: dipeptideOpacity,
						lighting: sphereLighting,
						peptide,
					}),
				);
			}
		});
	}

	const axesAttrs = {
		showgrid: false,
		visible: false,
		showspikes: false,
	};

	const yMinInterpolator = d3.scaleLinear([1, 2], [0, Math.min(...well.y)]).clamp(true);
	const yMaxInterpolator = d3
		.scaleLinear([1, 2], [2 * Math.PI, Math.max(...well.y)])
		.clamp(true);

	const xSpan = Math.max(...well.x) - Math.min(...well.x);

	const yRange = [yMinInterpolator(t), yMaxInterpolator(t)];
	const ySpan = yRange[1] - yRange[0];
	const yAspect = ySpan / xSpan;

	const zRange = [Math.min(...well.z), Math.max(...well.z) + diameter];
	const zSpan = Math.max(...well.z) - Math.min(...well.z);
	const zAspect = zSpan / xSpan;

	const layout = {
		margin: { t: 0, b: 0, l: 0, r: 0 },
		hovermode: false,
		showlegend: false,
		scene: {
			aspectmode: "manual",
			aspectratio: { x: 1, y: yAspect, z: zAspect },
			xaxis: axesAttrs,
			yaxis: { ...axesAttrs, range: yRange },
			zaxis: { ...axesAttrs, range: zRange },
		},
	};

	layout.scene.camera = {
		up: { x: 0, y: 0, z: 1 },
		center: { x: 0, y: 0, z: 0 },
		eye: {
			x: -0.68577809539281663,
			y: -0.750278208976746,
			z: 1.331169138564033,
		},
		projection: { type: "perspective" },
	};

	const config = {
		displayModeBar: false,
		scrollZoom: false,
	};

	if (firstPlot) {
		Plotly.react(graphDiv, data, layout, config);
		firstPlot = false;
	} else {
		Plotly.react(graphDiv, data, layout);
	}
}

plotEnergyWell(0);
