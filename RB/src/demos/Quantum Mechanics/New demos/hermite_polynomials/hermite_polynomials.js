/* global applyGraphicalObjs */

const WIDTH = 1350;
const HEIGHT = 750;

const plot = d3.select("#plot").attr("width", WIDTH).attr("height", HEIGHT);
const plotNode = plot.node();

const hermiteNTextSpan = document.getElementById("hermite-n");
const scaleTextSpan = document.getElementById("x-scale");

const MIN_HERMITE_N = 0;
const MAX_HERMITE_N = 10;
const DEFAULT_HERMITE_N = MIN_HERMITE_N;
const hermiteSlider = (() => {
	const slider = document.getElementById("hermite-n-slider");
	slider.min = DEFAULT_HERMITE_N;
	slider.max = MAX_HERMITE_N;
	slider.step = 1;
	slider.value = MIN_HERMITE_N;
	// eslint-disable-next-line no-use-before-define
	slider.oninput = () => update({ hermiteN: this.value });

	return slider;
})();

const scaleFormatter = d3.format(".3~r");
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DEFAULT_GRAPH_SCALE = MAX_SCALE;
const scaleSlider = (() => {
	const slider = document.getElementById("x-scale-slider");
	slider.min = MIN_SCALE;
	slider.max = MAX_SCALE;
	slider.step = 0.01;
	slider.value = DEFAULT_GRAPH_SCALE;
	// eslint-disable-next-line no-use-before-define
	slider.oninput = () => update({ graphScale: this.value });

	return slider;
})();

function getHermitePolynomial(n) {
	switch (n) {
		case 0:
			return () => 1;
		case 1:
			return x => 2 * x;
		case 2:
			return x => 4 * x ** 2 - 2;
		case 3:
			return x => 8 * x ** 3 - 12 * x;
		case 4:
			return x => 16 * x ** 4 - 48 * x ** 2 + 12;
		case 5:
			return x => 32 * x ** 5 - 160 * x ** 3 + 120 * x;
		case 6:
			return x => 64 * x ** 6 - 480 * x ** 4 + 720 * x ** 2 - 120;
		case 7:
			return x => 128 * x ** 7 - 1344 * x ** 5 + 3360 * x ** 3 - 1680 * x;
		case 8:
			return x =>
				256 * x ** 8 - 3584 * x ** 6 + 13440 * x ** 4 - 13440 * x ** 2 + 1680;
		case 9:
			return x =>
				512 * x ** 9 -
				9216 * x ** 7 +
				48384 * x ** 5 -
				80640 * x ** 3 +
				30240 * x;
		case 10:
			return x =>
				1024 * x ** 10 -
				23040 * x ** 8 +
				161280 * x ** 6 -
				403200 * x ** 4 +
				302400 * x ** 2 -
				30240;
	}
}

const nPoints = 300;
const line = d3.line();
function getGraphData({ hermiteN, graphScale }) {
	const hermitePolynomial = getHermitePolynomial(hermiteN);

	const minX = -graphScale;
	const maxX = -minX;
	const dx = (maxX - minX) / (nPoints - 1);
	let minY = Infinity;
	let maxY = -Infinity;
	const curvePointsUnscaled = d3.range(nPoints).map(i => {
		const x = minX + i * dx;
		const y = hermitePolynomial(x);
		if (y < minY) {
			minY = y;
		}
		if (y > maxY) {
			maxY = y;
		}
		return [x, y];
	});

	minY = Math.min(minY, -2);
	maxY = Math.max(maxY, 2);

	const tickLength = 10;
	const marginScale = 1.05;
	const graphXMin = minX * marginScale;
	const graphXMax = maxX * marginScale;
	const graphYMin = minY * marginScale;
	const graphYMax = maxY * marginScale;
	const xScale = d3.scaleLinear([graphXMin, graphXMax], [0, WIDTH]);
	const yScale = (() => {
		let yScale = d3.scaleLinear([graphYMin, graphYMax], [HEIGHT, 0]);
		if (yScale.invert(tickLength + 20) > graphYMin) {
			yScale = d3.scaleLinear(
				[graphYMin, graphYMax],
				[HEIGHT - (tickLength + 20), 0],
			);
		}
		return yScale;
	})();

	const curvePointsScaled = curvePointsUnscaled.map(([x, y]) => [
		xScale(x),
		yScale(y),
	]);

	const scaledX0 = xScale(0);
	const scaledY0 = yScale(0);

	const nXTicks = 20;
	const nXLabels = 5;
	const xTicks = xScale.ticks(nXTicks);
	const xTickSet = new Set(xTicks);
	const xLabelLocs = xScale.ticks(nXLabels).filter(x => xTickSet.has(x) && x !== 0); // This works because the numbers we're working with are exactly representable as floats; otherwise .has might fail with rounding errors
	const xTickFormat = xScale.tickFormat(nXLabels, "~g");

	const nYTicks = 20;
	const nYLabels = 5;
	const yTicks = yScale.ticks(nYTicks).filter(y => y !== 0);
	const yTickSet = new Set(yTicks);
	const yLabelLocs = yScale.ticks(nYLabels).filter(y => yTickSet.has(y) && y !== 0);
	const yTickFormat = yScale.tickFormat(nYLabels, "~g");

	const tickData = [
		...xTicks.map(x => {
			const scaledX = xScale(x);
			return {
				shape: "line",
				classes: ["axis-tick", "axis-x-tick"],
				attrs: {
					x1: scaledX,
					x2: scaledX,
					y1: scaledY0,
					y2: scaledY0 + tickLength,
				},
			};
		}),
		...yTicks.map(y => {
			const scaledY = yScale(y);
			return {
				shape: "line",
				classes: ["axis-tick", "axis-y-tick"],
				attrs: {
					x1: scaledX0 - tickLength,
					x2: scaledX0,
					y1: scaledY,
					y2: scaledY,
				},
			};
		}),
	];

	const tickLabelData = [
		...xLabelLocs.map(x => {
			const scaledX = xScale(x);
			return {
				shape: "text",
				classes: ["axis-label", "x-axis-label"],
				text: xTickFormat(x),
				attrs: {
					x: scaledX,
					y: scaledY0 + tickLength + 4,
				},
			};
		}),
		...yLabelLocs.map(y => {
			const scaledY = yScale(y);
			return {
				shape: "text",
				classes: ["axis-label", "y-axis-label"],
				text: yTickFormat(y),
				attrs: {
					x: scaledX0 - tickLength - 4,
					y: scaledY,
				},
			};
		}),
	];

	const axisData = [
		{
			shape: "line",
			classes: ["graph-obj", "axis", "x-axis"],
			attrs: {
				x1: xScale(graphXMin),
				x2: xScale(graphXMax),
				y1: scaledY0,
				y2: scaledY0,
			},
		},
		{
			shape: "line",
			classes: ["graph-obj", "axis", "y-axis"],
			attrs: {
				x1: scaledX0,
				x2: scaledX0,
				y1: yScale(graphYMin),
				y2: yScale(graphYMax),
			},
		},
		{
			shape: "path",
			classes: ["graph-obj", "curve", "curve-background"],
			attrs: {
				d: line(curvePointsScaled),
			},
		},
		{
			shape: "path",
			classes: ["graph-obj", "curve", "curve-foreground"],
			attrs: {
				d: line(curvePointsScaled),
			},
		},
	];

	return { axisData, tickData, tickLabelData };
}

function update({ hermiteN, graphScale } = {}) {
	hermiteN = +(hermiteN ?? hermiteSlider.value);
	graphScale = +(graphScale ?? scaleSlider.value);

	hermiteNTextSpan.innerText = hermiteN;
	scaleTextSpan.innerText = scaleFormatter(graphScale);

	const { axisData, tickData, tickLabelData } = getGraphData({
		hermiteN,
		graphScale,
	});
	applyGraphicalObjs(plot, tickData, { selector: ".axis-tick" });
	applyGraphicalObjs(plot, tickLabelData, { selector: ".axis-label" });
	applyGraphicalObjs(plot, axisData, { selector: ".graph-obj" });
	plotNode.append(plot.selectAll(".curve-background").node());
	plotNode.append(plot.selectAll(".curve-foreground").node());
}

update();
