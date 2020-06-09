/* global l2Norm applyDatum applyGraphicalObjs */
"use strict";

const RANGES = {
	axis: { min: -20, max: 20 },
	angle: {
		min: -Math.PI,
		max: Math.PI,
		n: 1001,
	},
	displacement: {
		min: -5,
		max: 5,
		n: 1001,
	},
};

(() => {
	const v = RANGES["axis"];
	v.mid = ((v.max + v.min) * 3) / 4;
	v.posDist = v.max - v.mid;
	v.negDist = v.mid - v.min;
	v.span = v.max - v.min;
})();

const sliders = {};
sliders.displacement = {};

const MAX_DISPLACEMENT = 5;
["x", "y"].forEach(v => {
	const slider = document.getElementById(`input-${v}-coord`);
	sliders[v] = slider;

	slider.min = -10;
	slider.max = 10;
	slider.step = 0.001;
	slider.value = 0;

	sliders.displacement[v] = (() => {
		const displacementSlider = document.getElementById(`input-displacement-${v}`);
		if (displacementSlider !== null) {
			displacementSlider.min = -MAX_DISPLACEMENT;
			displacementSlider.max = MAX_DISPLACEMENT;
			displacementSlider.step = 0.001;
			displacementSlider.value = 0;
		}
		return displacementSlider;
	})();
});
sliders.angle = (() => {
	const angleSlider = document.getElementById("input-angle-rad");
	if (angleSlider !== null) {
		angleSlider.min = 0;
		angleSlider.max = RANGES.angle.n - 1;
		angleSlider.step = 1;
		angleSlider.value = (RANGES.angle.n - 1) / 2;
	}
	return angleSlider;
})();

const AXIS_MARGINS = {
	top: 0.05,
	bottom: 0.05,
	left: sliders.displacement.x !== null ? 0.2 : 0.05,
	right: sliders.displacement.x !== null ? 0.2 : 0.1,
};
const CANVAS_HEIGHT = 400;
const CANVAS_WIDTH =
	(CANVAS_HEIGHT / (1 - (AXIS_MARGINS.left + AXIS_MARGINS.right))) *
	(1 - (AXIS_MARGINS.top + AXIS_MARGINS.bottom));
const CANVAS_BOUNDS = {
	xMin: CANVAS_WIDTH * AXIS_MARGINS.left,
	xMax: CANVAS_WIDTH * (1 - AXIS_MARGINS.right),
	yMin: CANVAS_HEIGHT * (1 - AXIS_MARGINS.bottom),
	yMax: CANVAS_HEIGHT * AXIS_MARGINS.top,
};

const textSpans = {
	angle: document.getElementById("text-angle"),
	upright: {
		x: document.getElementById("text-upright-x"),
		y: document.getElementById("text-upright-y"),
	},
	transformed: {
		x: document.getElementById("text-transformed-x"),
		y: document.getElementById("text-transformed-y"),
	},
};

const primedAxesColor = "#4f7";

const canvas = d3
	.select("#viz-canvas")
	.attr("width", CANVAS_WIDTH)
	.attr("height", CANVAS_HEIGHT)
	.attr("background-color", "black");

const ARROWHEAD_IDS = {
	upright: "marker-arrowhead-upright",
	transformed: "marker-arrowhead-transformed",
};
(() => {
	const markerAttrs = {
		attrs: {
			refX: 4,
			refY: 4,
			markerUnits: "strokeWidth",
			markerWidth: 10,
			markerHeight: 8,
			orient: "auto",
		},
	};
	const pathAttrs = { attrs: { d: "M 0 0 L 10 4 L 0 8 L 4 4 z" } };
	const defs = canvas.append("svg:defs");

	[
		[ARROWHEAD_IDS.upright, "white"],
		[ARROWHEAD_IDS.transformed, primedAxesColor],
	].forEach(([id, color]) => {
		defs.append("svg:marker")
			.attr("id", id)
			.each(function () {
				applyDatum.call(this, markerAttrs);
			})
			.append("svg:path")
			.each(function () {
				applyDatum.call(this, pathAttrs);
			})
			.attr("stroke", color)
			.attr("fill", color);
	});
})();

const subcanvases = canvas
	.data([
		{
			originX: 0,
			originY: 0,
			width: CANVAS_WIDTH,
			height: CANVAS_HEIGHT,
		},
	])
	.each(function (d) {
		d3.select(this)
			.append("g")
			.attr("transform", `translate(0, ${d.originY})`)
			.classed("subcanvas", true);
	})
	.selectAll("g");

const xScale = d3
	.scaleLinear()
	.domain([RANGES.axis.min, RANGES.axis.max])
	.range([CANVAS_BOUNDS.xMin, CANVAS_BOUNDS.xMax]);
const yScale = d3
	.scaleLinear()
	.domain([RANGES.axis.min, RANGES.axis.max])
	.range([CANVAS_BOUNDS.yMin, CANVAS_BOUNDS.yMax]);

function getAngleFromIndex(angleIndex) {
	if (typeof angleIndex === "undefined") {
		if (sliders.angle === null) {
			return 0;
		}
		angleIndex = +sliders.angle.value;
	}

	return -(
		RANGES.angle.min +
		(angleIndex / (RANGES.angle.n - 1)) * (RANGES.angle.max - RANGES.angle.min)
	);
}

const AXIS_LABEL_LOCS = {
	xAx: { x: RANGES.axis.max, y: RANGES.axis.mid + RANGES.axis.span * 0.05 },
	yAx: { x: RANGES.axis.mid + RANGES.axis.span * 0.05, y: RANGES.axis.max },
};

function drawGraph() {
	subcanvases.each(function () {
		const subcanvas = d3.select(this);
		const axisAttrs = {
			stroke: "white",
			"stroke-width": 2,
			"marker-end": `url(#${ARROWHEAD_IDS.upright})`,
		};
		subcanvas
			.selectAll()
			.data([
				{
					shape: "line",
					class: "axis-x",
					attrs: {
						x1: xScale(RANGES.axis.min),
						x2: xScale(RANGES.axis.max),
						y1: yScale(RANGES.axis.mid),
						y2: yScale(RANGES.axis.mid),
						...axisAttrs,
					},
				},
				{
					shape: "line",
					class: "axis-y",
					attrs: {
						x1: xScale(RANGES.axis.mid),
						x2: xScale(RANGES.axis.mid),
						y1: yScale(RANGES.axis.min),
						y2: yScale(RANGES.axis.max),
						...axisAttrs,
					},
				},
			])
			.enter()
			.append("svg:line")
			.each(applyDatum);

		subcanvas
			.selectAll("text")
			.data([
				{
					shape: "text",
					class: "axis-x-label",
					attrs: {
						x: xScale(AXIS_LABEL_LOCS.xAx.x),
						y: yScale(AXIS_LABEL_LOCS.xAx.y),
						fill: "white",
						"text-anchor": "middle",
						"dominant-baseline": "center",
					},
					text: "𝑥",
				},
				{
					shape: "text",
					class: "axis-y-label",
					attrs: {
						x: xScale(AXIS_LABEL_LOCS.yAx.x),
						y: yScale(AXIS_LABEL_LOCS.yAx.y),
						fill: "white",
						"text-anchor": "middle",
						"dominant-baseline": "center",
					},
					text: "𝑦",
				},
			])
			.enter()
			.append("svg:text")
			.each(applyDatum)
			.text(d => d.text);
	});
}

function getLinesData({
	x,
	y,
	angleRad,
	displacementX,
	displacementY,
	shouldDrawUprightLines,
}) {
	if (typeof x === "undefined") {
		x = +sliders.x.value;
	}

	if (typeof y === "undefined") {
		y = +sliders.y.value;
	}

	if (typeof angleRad === "undefined") {
		if (sliders.angle === null) {
			angleRad = 0;
		} else {
			angleRad = +getAngleFromIndex(sliders.angle.value);
		}
	}

	if (typeof displacementX === "undefined") {
		if (sliders.displacement.x === null) {
			displacementX = 0;
		} else {
			displacementX = sliders.displacement.x.value;
		}
	}
	displacementX = +displacementX;

	if (typeof displacementY === "undefined") {
		if (sliders.displacement.y === null) {
			displacementY = 0;
		} else {
			displacementY = +sliders.displacement.y.value;
		}
	}
	displacementY = +displacementY;

	if (typeof shouldDrawUprightLines === "undefined") {
		shouldDrawUprightLines = true;
	}

	const sin = Math.sin(angleRad);
	const cos = Math.cos(angleRad);

	const tfAxesAttrs = {
		"stroke-width": 2,
		"marker-end": `url(#${ARROWHEAD_IDS.transformed})`,
	};

	const tfAxOrigin = {
		x: RANGES.axis.mid + displacementX,
		y: RANGES.axis.mid + displacementY,
	};

	const tfAxDisplacement = {
		pos: {
			xAx: {
				x: RANGES.axis.posDist * cos,
				y: RANGES.axis.posDist * sin,
			},
			yAx: {
				x: -RANGES.axis.posDist * sin,
				y: RANGES.axis.posDist * cos,
			},
		},
		neg: {
			xAx: {
				x: RANGES.axis.negDist * cos,
				y: RANGES.axis.negDist * sin,
			},
			yAx: {
				x: -RANGES.axis.negDist * sin,
				y: RANGES.axis.negDist * cos,
			},
		},
	};

	// console.log(tfAxDisplacement);
	const _maxNorm = l2Norm(RANGES.axis.posDist, RANGES.axis.posDist);
	const _minNorm = l2Norm(RANGES.axis.posDist, 0);
	const _normScale = d3
		.scaleLinear()
		.domain([_minNorm, _maxNorm])
		.range([0, 1])
		.clamp(true);

	// Object.values(tfAxDisplacement).forEach(bothAxesEndDisplacement => {
	// 	Object.values(bothAxesEndDisplacement).forEach(axEndDisp => {
	// 		let { x: dx, y: dy } = axEndDisp;
	// 		const ratio = dy / dx;

	// 		dx *= 10;
	// 		dy *= 10;

	// 		if (dx > RANGES.axis.posDist + MAX_DISPLACEMENT) {
	// 			dx = RANGES.axis.posDist + MAX_DISPLACEMENT;
	// 			dy = dx * ratio;
	// 		} else if (dx < -RANGES.axis.negDist - MAX_DISPLACEMENT) {
	// 			dx = -RANGES.axis.negDist - MAX_DISPLACEMENT;
	// 			dy = dx * ratio;
	// 		} else if (dy > RANGES.axis.posDist) {
	// 			dy = RANGES.axis.posDist;
	// 			dx = dy / ratio;
	// 		} else if (dy < -RANGES.axis.negDist) {
	// 			dy = -RANGES.axis.negDist;
	// 			dx = dy / ratio;
	// 		}

	// 		if (ratio !== Infinity) {
	// 			dx = Math.max(
	// 				-RANGES.axis.negDist - MAX_DISPLACEMENT,
	// 				Math.min(dx, RANGES.axis.posDist + MAX_DISPLACEMENT),
	// 			);
	// 			dy = dx * ratio;
	// 		}

	// 		if (ratio !== 0) {
	// 			dy = Math.max(-RANGES.axis.negDist, Math.min(dy, RANGES.axis.posDist));
	// 			dx = dy / ratio;
	// 		}

	// 		const norm = l2Norm(dx, dy);
	// 		const scale = Math.pow(0.9, _normScale(norm));

	// 		axEndDisp.x = dx * scale;
	// 		axEndDisp.y = dy * scale;
	// 	});
	// });
	// console.log(tfAxDisplacement);

	// Looks like {xAx: {x: y: }, {yAx: {x: y: }}}
	const tfAxPosEndCoords = {};
	Object.entries(tfAxDisplacement.pos).forEach(([ax, info]) => {
		tfAxPosEndCoords[ax] = {};
		Object.entries(info).forEach(([coord, dist]) => {
			tfAxPosEndCoords[ax][coord] = tfAxOrigin[coord] + dist;
		});
	});

	const tfAxesData = [
		{
			shape: "line",
			class: "tf-axis-x",
			attrs: {
				x1: xScale(tfAxOrigin.x - tfAxDisplacement.neg.xAx.x),
				y1: yScale(tfAxOrigin.y - tfAxDisplacement.neg.xAx.y),
				x2: xScale(tfAxPosEndCoords.xAx.x),
				y2: yScale(tfAxPosEndCoords.xAx.y),
				...tfAxesAttrs,
				stroke: primedAxesColor,
			},
		},
		{
			shape: "line",
			class: "tf-axis-y",
			attrs: {
				x1: xScale(tfAxOrigin.x - tfAxDisplacement.neg.yAx.x),
				y1: yScale(tfAxOrigin.y - tfAxDisplacement.neg.yAx.y),
				x2: xScale(tfAxPosEndCoords.yAx.x),
				y2: yScale(tfAxPosEndCoords.yAx.y),
				...tfAxesAttrs,
				stroke: primedAxesColor,
			},
		},
	];

	const uprightLinesAttrs = {
		stroke: "white",
		"stroke-width": 2,
		"stroke-dasharray": "5 5",
	};
	const uprightLinesData = !shouldDrawUprightLines
		? []
		: [
				{
					shape: "line",
					class: "upright-line-horizontal",
					attrs: {
						x1: xScale(RANGES.axis.mid),
						y1: yScale(y),
						x2: xScale(x),
						y2: yScale(y),
						...uprightLinesAttrs,
					},
				},
				{
					shape: "line",
					class: "upright-line-vertical",
					attrs: {
						x1: xScale(x),
						y1: yScale(RANGES.axis.mid),
						x2: xScale(x),
						y2: yScale(y),
						...uprightLinesAttrs,
					},
				},
		  ];

	// Compute projection of point onto transformed axes by translating point and transformed axes back to origin, computing projection onto transformed axes (now rotated but not translated), and then translating back
	const tfAxProjCoords = {};
	Object.keys(tfAxPosEndCoords).forEach(ax => {
		const tfAxPosEndDispX = tfAxDisplacement.pos[ax].x;
		const tfAxPosEndDispY = tfAxDisplacement.pos[ax].y;
		const posEndNorm = l2Norm(tfAxPosEndDispX, tfAxPosEndDispY);
		const posEndUnitVecX = tfAxPosEndDispX / posEndNorm;
		const posEndUnitVecY = tfAxPosEndDispY / posEndNorm;
		const projectionDotProd =
			(x - tfAxOrigin.x) * posEndUnitVecX + (y - tfAxOrigin.y) * posEndUnitVecY;

		tfAxProjCoords[ax] = {};
		tfAxProjCoords[ax].x = tfAxOrigin.x + projectionDotProd * posEndUnitVecX;
		tfAxProjCoords[ax].y = tfAxOrigin.y + projectionDotProd * posEndUnitVecY;
		tfAxProjCoords[ax].dotProd = projectionDotProd;
	});

	const tfLinesAttrs = {
		stroke: primedAxesColor,
		"stroke-width": 2,
		"stroke-dasharray": "5 5",
	};
	const tfLinesData = [
		{
			shape: "line",
			class: "tf-line-vertical",
			attrs: {
				x1: xScale(tfAxProjCoords.xAx.x),
				y1: yScale(tfAxProjCoords.xAx.y),
				x2: xScale(x),
				y2: yScale(y),
				...tfLinesAttrs,
			},
		},
		{
			shape: "line",
			class: "tf-line-horizontal",
			attrs: {
				x1: xScale(tfAxProjCoords.yAx.x),
				y1: yScale(tfAxProjCoords.yAx.y),
				x2: xScale(x),
				y2: yScale(y),
				...tfLinesAttrs,
			},
		},
	];

	const axisLabelDist = 0.05 * RANGES.axis.span;
	const axisLabelAttrs = {
		fill: primedAxesColor,
	};
	const getOpacity = (x, y) => {
		const minDistToUprightAxisLabel = Math.min(
			...["xAx", "yAx"].map(ax => {
				const distFromUprightAxisLabel = l2Norm(
					x - AXIS_LABEL_LOCS[ax].x,
					y - AXIS_LABEL_LOCS[ax].y,
				);
				return distFromUprightAxisLabel / RANGES.axis.span;
			}),
		);

		const beginAppearScaledDist = 0.05;
		const fullyAppearScaledDist = 0.07;
		const unadjustedOpacity =
			(1 / (fullyAppearScaledDist - beginAppearScaledDist)) *
			(minDistToUprightAxisLabel - beginAppearScaledDist);
		const opacity = Math.max(0, Math.min(unadjustedOpacity, 1));
		return opacity;
	};
	const tfAxisLabelsData = [
		(() => {
			// X axis label
			const x = tfAxPosEndCoords.xAx.x + axisLabelDist * -sin;
			const y = (() => {
				const y = tfAxPosEndCoords.xAx.y + axisLabelDist * cos;
				if (cos < 0) {
					return y + axisLabelDist * cos * 0.9;
				}
				return y;
			})();

			const opacity = getOpacity(x, y);

			return {
				shape: "text",
				class: "tf-x-axis-label",
				attrs: {
					x: xScale(x),
					y: yScale(y),
					opacity: opacity,
					...axisLabelAttrs,
					"text-anchor": "middle",
					"dominant-baseline": "center",
				},
				text: "𝑥′",
			};
		})(),
		(() => {
			// Y axis label
			const x = tfAxPosEndCoords.yAx.x + axisLabelDist * cos * 1.2;
			const y = (() => {
				const y = tfAxPosEndCoords.yAx.y + axisLabelDist * sin;
				if (sin < 0) {
					return y + axisLabelDist * sin * 0.9;
				}
				return y;
			})();

			const opacity = getOpacity(x, y);

			return {
				shape: "text",
				class: "tf-y-axis-label",
				attrs: {
					x: xScale(x),
					y: yScale(y),
					opacity: opacity,
					...axisLabelAttrs,
					"text-anchor": "middle",
					"dominant-baseline": "center",
				},
				text: "𝑦′",
			};
		})(),
	];

	const pointDatum = {
		shape: "circle",
		class: "marked-point",
		attrs: {
			cx: xScale(x),
			cy: yScale(y),
			r: 4,
			fill: "#fd0",
		},
	};

	return {
		data: [
			...tfAxesData,
			...uprightLinesData,
			...tfLinesData,
			...tfAxisLabelsData,
			pointDatum,
		],
		tfCoords: {
			xAxXCoord: tfAxProjCoords.xAx.dotProd,
			yAxYCoord: tfAxProjCoords.yAx.dotProd,
		},
	};
}

function updateAngle({
	x,
	y,
	angleIndex,
	displacementX,
	displacementY,
	userInput = true,
	shouldDrawUprightLines,
} = {}) {
	const angleRad = getAngleFromIndex(angleIndex);

	const { data, tfCoords: tfCoords } = getLinesData({
		x,
		y,
		angleRad,
		displacementX,
		displacementY,
		shouldDrawUprightLines,
	});

	applyGraphicalObjs(subcanvases, () => data, {
		selector: ".graph-obj",
		cssClass: "graph-obj",
	});

	textSpans.upright.x.textContent = (+sliders.x.value).toFixed(2);
	textSpans.upright.y.textContent = (+sliders.y.value).toFixed(2);
	textSpans.transformed.x.textContent = tfCoords.xAxXCoord.toFixed(2);
	textSpans.transformed.y.textContent = tfCoords.yAxYCoord.toFixed(2);

	if (!userInput || typeof angleRad !== "undefined") {
		textSpans.angle.textContent = (angleIndex === (RANGES.angle.n - 1) / 2
			? +0
			: (angleRad * 180) / Math.PI
		).toFixed(2);
	}
}

drawGraph();
updateAngle({
	angleRad: 0,
	displacementX: 0,
	displacementY: 0,
	userInput: false,
	shouldDrawUprightLines: sliders.angle !== null,
});