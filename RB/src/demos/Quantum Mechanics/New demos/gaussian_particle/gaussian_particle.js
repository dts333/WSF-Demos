/* global SVDJS Plotly STANDARD_COLORS katex */

const GRAPH_WIDTH = 500;
const GRAPH_HEIGHT = GRAPH_WIDTH;

const plot3D = d3
	.select("#plot-3d")
	.attr("width", GRAPH_WIDTH)
	.attr("height", GRAPH_HEIGHT);
const plot3DNode = plot3D.node();

const plot2D = d3
	.select("#plot-2d")
	.attr("width", GRAPH_WIDTH)
	.attr("height", GRAPH_HEIGHT);

const margin2D = 15;
const X_MIN = -4.8;
const X_MAX = 4.8;
const X_0 = (X_MIN + X_MAX) / 2;
const Y_MIN = -4.8;
const Y_MAX = 4.8;
const Y_0 = (Y_MIN + Y_MAX) / 2;
const xScale2D = d3.scaleLinear([X_MIN, X_MAX], [margin2D, GRAPH_WIDTH - margin2D]);
const yScale2D = d3.scaleLinear([Y_MIN, Y_MAX], [GRAPH_HEIGHT - margin2D, margin2D]);

const sliders = {
	correlation: document.getElementById("slider-correlation"),
	particle1Spread: document.getElementById("slider-particle-1-spread"),
	particle2Spread: document.getElementById("slider-particle-2-spread"),
	particle1MeanPos: document.getElementById("slider-particle-1-mean-pos"),
	particle2MeanPos: document.getElementById("slider-particle-2-mean-pos"),
};

const textSpans = {
	correlation: document.getElementById("text-correlation"),
	particle1Spread: document.getElementById("text-particle-1-spread"),
	particle2Spread: document.getElementById("text-particle-2-spread"),
	particle1MeanPos: document.getElementById("text-particle-1-mean-pos"),
	particle2MeanPos: document.getElementById("text-particle-2-mean-pos"),
};

d3.selectAll(".param-slider").property("step", 0.0017);

d3.selectAll(".correlation-slider")
	.property("min", -1)
	.property("max", 1)
	.property("value", 0);

d3.selectAll(".spread-slider")
	.property("min", 1.1)
	.property("max", 2)
	.property("value", 1.55);

d3.selectAll(".position-slider")
	.property("min", -1)
	.property("max", 1)
	.property("value", 0);

// Set up 2D plot
(() => {
	const majorTickSpacing = 1;
	const minorTickSpacing = 1; // All ticks are major
	const majorTickLength = 6;
	const minorTickLength = 6;
	const axisLabelSpacing = 2;

	const nMinorTickGapsBwtnMajorTicks = Math.round(
		majorTickSpacing / minorTickSpacing,
	);

	const axisStrokeWidth = 1;

	const x0 = xScale2D(X_0);
	const y0 = yScale2D(Y_0);
	// x axis ticks

	// axes themselves
	plot2D
		.selectAll(".axis")
		.data([
			{
				x1: xScale2D(X_MIN),
				x2: xScale2D(X_MAX),
				y1: y0,
				y2: y0,
			},
			{
				x1: x0,
				x2: x0,
				y1: yScale2D(Y_MIN),
				y2: yScale2D(Y_MAX),
			},
		])
		.join("line")
		.classed("axis", true)
		.attr("x1", d => d.x1)
		.attr("x2", d => d.x2)
		.attr("y1", d => d.y1)
		.attr("y2", d => d.y2);

	// ticks
	const xTicks = d3.range(Math.ceil(X_MIN), Math.floor(X_MAX) + 1).map(x => {
		const xs = xScale2D(x);
		return {
			class: "axis-tick x-axis-tick",
			x1: xs,
			x2: xs,
			y1: y0 - axisStrokeWidth / 2,
			y2: y0 + majorTickLength,
		};
	});

	const yTicks = d3.range(Math.ceil(Y_MIN), Math.floor(Y_MAX) + 1).map(y => {
		const ys = yScale2D(y);
		return {
			class: "axis-tick y-axis-tick",
			x1: x0 + axisStrokeWidth / 2,
			x2: x0 - majorTickLength,
			y1: ys,
			y2: ys,
		};
	});

	plot2D
		.selectAll()
		.data([...xTicks, ...yTicks])
		.join("line")
		.attr("class", d => d.class)
		.attr("x1", d => d.x1)
		.attr("x2", d => d.x2)
		.attr("y1", d => d.y1)
		.attr("y2", d => d.y2);

	// tick labels
	const labelFormatter = d3.format("d");

	const xLabels = [-4, -2, 2, 4]
		.map(x => {
			if (x === 0) {
				return null;
			}
			const xs = xScale2D(x);
			return {
				class: "axis-label x-axis-label",
				x: xs,
				y: y0 + majorTickLength + 5,
				text: labelFormatter(x),
			};
		})
		.filter(d => d !== null);

	const yLabels = [-4, -2, 2, 4]
		.map(y => {
			if (y === 0) {
				return null;
			}
			const ys = yScale2D(y);
			return {
				class: "axis-label y-axis-label",
				x: x0 - majorTickLength - 5,
				y: ys,
				text: labelFormatter(y),
			};
		})
		.filter(d => d !== null);

	plot2D
		.selectAll()
		.data([...xLabels, ...yLabels])
		.join("text")
		.attr("class", d => d.class)
		.attr("x", d => d.x)
		.attr("y", d => d.y)
		.text(d => d.text);

	const axisNameFontsize = "25px";
	plot2D
		.append("text")
		.text("𝑥")
		.classed("axis-label x-axis-label", true)
		.attr("x", xScale2D(X_MAX) - 15)
		.attr("y", yScale2D(Y_0) + 13)
		.style("font-size", axisNameFontsize);
	plot2D
		.append("text")
		.text("𝑦")
		.classed("axis-label y-axis-label", true)
		.attr("x", xScale2D(X_0) - 20)
		.attr("y", yScale2D(Y_MAX) + 10)
		.style("font-size", axisNameFontsize);
})();

function unitVector(vec) {
	let sum = 0;
	for (const v of vec) {
		sum += v ** 2;
	}
	const magnitude = sum ** 0.5;
	return vec.map(v => v / magnitude);
}

function __matMulHelper(mat1, mat2) {
	if (typeof mat1[0].length === "undefined") {
		mat1 = [mat1];
	}

	const squeezeAns = typeof mat2[0].length === "undefined";
	if (squeezeAns) {
		mat2 = mat2.map(elem => [elem]);
	}

	const m = mat1.length;
	const k = mat2.length;
	const n = mat2[0].length;

	const ans = [];
	for (let r = 0; r < m; ++r) {
		const rowAns = [];
		for (let c = 0; c < n; ++c) {
			let sum = 0;
			for (let i = 0; i < k; ++i) {
				sum += mat1[r][i] * mat2[i][c];
			}
			rowAns.push(sum);
		}
		ans.push(rowAns);
	}

	if (squeezeAns) {
		return ans.map(row => row[0]);
	}

	return ans;
}

function matMul(...mats) {
	let ans = mats[0];
	for (let i = 1; i < mats.length; ++i) {
		ans = __matMulHelper(ans, mats[i]);
	}
	return ans;
}

function transpose(mat) {
	const ans = [];
	for (let c = 0; c < mat[0].length; ++c) {
		const row = [];
		for (let r = 0; r < mat.length; ++r) {
			row.push(mat[r][c]);
		}
		ans.push(row);
	}
	return ans;
}

const BASIC_BLUE = d3.interpolateRgb(
	d3.interpolateRgb(STANDARD_COLORS.graphicPrimary, STANDARD_COLORS.highlighted)(0.4),
	"white",
)(0.1);

// Synopsis: we perform an eigendecomposition on the covariance matrix and use this to
// compute its sqrt. Then we use this to generate five points on the ellipse of the
// level set, solve the linear equation giving the coefficients of the ellipse in
// standard form, and then use those coefficients to get cx, cy, rx, ry, and the
// rotation
function drawEllipse2D() {
	const r = +sliders.correlation.value; // correlation
	const s1 = +sliders.particle1Spread.value; // sigma_1
	const s2 = +sliders.particle2Spread.value; // sigma_2
	const u1 = +sliders.particle1MeanPos.value; // mu_1
	const u2 = +sliders.particle2MeanPos.value; // mu_2

	// eigendecomposition of the covariance matrix
	let lambda1, lambda2, eVec1, eVec2;
	if (r === 0) {
		lambda1 = s1;
		lambda2 = s2;
		eVec1 = [0, 1];
		eVec2 = [1, 0];
	} else {
		// ICM stands for inverse (of the) covariance matrix
		const discriminantICM = Math.sqrt((s1 - s2) ** 2 + 4 * r ** 2);
		lambda1 = (s1 + s2 - discriminantICM) / 2;
		lambda2 = (s1 + s2 + discriminantICM) / 2;
		eVec1 = unitVector([(s1 - s2 - discriminantICM) / (2 * r), 1]);
		eVec2 = unitVector([(s1 - s2 + discriminantICM) / (2 * r), 1]);
	}

	const sqrtSigma = matMul(
		[
			[lambda1 ** 0.5, 0],
			[0, lambda2 ** 0.5],
		],
		[
			[eVec1[0], eVec2[0]],
			[eVec1[1], eVec2[1]],
		],
	);

	function getEllipseParams(radius) {
		const nPoints = 5;
		const pointsOnUnitCircle = d3.range(nPoints).map(i => {
			const theta = (i / nPoints) * 2 * Math.PI;
			return [Math.cos(theta), Math.sin(theta)];
		});

		// https://stats.stackexchange.com/a/76428
		const pointsOnEllipse = matMul(
			pointsOnUnitCircle,
			[
				[radius, 0],
				[0, radius],
			],
			sqrtSigma,
		);

		for (let i = 0; i < pointsOnEllipse.length; ++i) {
			pointsOnEllipse[i][0] += u1;
			pointsOnEllipse[i][1] += u2;
		}

		const mat = transpose(
			pointsOnEllipse.map(([x, y]) => [x ** 2, x * y, y ** 2, x, y, 1]),
		);

		// https://math.stackexchange.com/a/2286578
		// https://math.stackexchange.com/a/767126
		const { u } = SVDJS.SVD(mat, "f", true, 1e-10);
		const [a, b, c, d, e, f] = u.map(row => row[row.length - 1]);

		// https://en.wikipedia.org/wiki/Ellipse#General_ellipse
		const discriminantCanonical = b ** 2 - 4 * a * c;
		const x0 = (2 * c * d - b * e) / discriminantCanonical;
		const y0 = (2 * a * e - b * d) / discriminantCanonical;
		function getScaleFactor(sign) {
			return (
				-Math.sqrt(
					Math.abs(
						2 *
							(a * e ** 2 +
								c * d ** 2 -
								b * d * e +
								discriminantCanonical * f) *
							(a + c + sign * Math.sqrt((a - c) ** 2 + b ** 2)),
					),
				) / discriminantCanonical
			);
		}
		const m = getScaleFactor(1);
		const n = getScaleFactor(-1);
		const theta =
			b === 0
				? a < c
					? 0
					: Math.PI / 4
				: Math.atan((1 / b) * (c - a - Math.sqrt((a - c) ** 2 + b ** 2)));

		const cx = xScale2D(x0);
		const cy = yScale2D(y0);
		const rx = xScale2D(m) - xScale2D(X_0);
		const ry = yScale2D(Y_0) - yScale2D(n);
		const rotate = (-Math.sign(r) * (theta * 180)) / Math.PI;
		const transform = `rotate(${rotate} ${cx} ${cy})`;

		return { cx, cy, rx, ry, transform };
	}

	const ellipseColorInterpolator = d3.interpolateRgb(BASIC_BLUE, "black");
	const colorConstancy = 6;
	const initialWhiteness = 0.9;
	const ellipsesData = [0.4, 1, 1.6, 2.2]
		.map((radius, index) => {
			const ellipseParams = getEllipseParams(radius);
			return [
				{
					...ellipseParams,
					class: "level-set-background",
					stroke: "#ccc",
				},
				{
					...ellipseParams,
					class: "level-set-foreground",
					stroke: ellipseColorInterpolator(
						1 -
							initialWhiteness +
							(1 - colorConstancy / (index + colorConstancy)),
					),
				},
			];
		})
		.flat(Infinity);

	plot2D
		.selectAll(".level-set")
		.data(ellipsesData)
		.join("ellipse")
		.attr("class", d => `level-set ${d.class}`)
		.attr("cx", d => d.cx)
		.attr("cy", d => d.cy)
		.attr("rx", d => d.rx)
		.attr("ry", d => d.ry)
		.attr("transform", d => d.transform)
		.attr("stroke", d => d?.stroke);
}

const triangulationInfo = (() => {
	const xMin = X_MIN;
	const xMax = X_MAX;
	const nXPoints = 76;
	const dx = (xMax - xMin) / (nXPoints - 1);

	const yMin = Y_MIN;
	const yMax = Y_MAX;
	const nYPoints = 76;
	const dy = (yMax - yMin) / (nYPoints - 1);

	const gridPoints = [];
	for (let i = 0; i < nXPoints; ++i) {
		const x = xMin + i * dx;
		for (let j = 0; j < nYPoints; ++j) {
			const y = yMin + j * dy;
			gridPoints.push([x, y, null]);
		}
	}

	const xs = gridPoints.map(p => p[0]);
	const ys = gridPoints.map(p => p[1]);

	const delaunay = d3.Delaunay.from(gridPoints);
	const { triangles } = delaunay;
	const i = d3.range(triangles.length / 3).map(i => triangles[3 * i]);
	const j = d3.range(triangles.length / 3).map(i => triangles[3 * i + 1]);
	const k = d3.range(triangles.length / 3).map(i => triangles[3 * i + 2]);

	return { gridPoints, xs, ys, i, j, k };
})();

// https://en.wikipedia.org/wiki/Multivariate_normal_distribution#Bivariate_case
function gaussianPdf(x, y, { r, u1, u2, s1, s2 }) {
	const dx = x - u1;
	const dy = y - u2;
	const p = r / (s1 * s2);
	return (
		(1 / (2 * Math.PI * s1 * s2 * Math.sqrt(1 - p ** 2))) *
		Math.exp(
			(-1 / (2 * (1 - p ** 2))) *
				(dx ** 2 / s1 ** 2 + dy ** 2 / s2 ** 2 - (2 * p * dx * dy) / (s1 * s2)),
		)
	);
}

// We'll use x and y terminology to describe gridlines running parallel to the y axis,
// but of course you can swap x and y in the returned array to get gridlines in the
// other direction. Returns an array of gridlines; each gridline is an array of points
// [x,y]
function getGridlines({ nGridlines, xMin, xMax, yMin, yMax, nPointsPerGridline }) {
	nPointsPerGridline = nPointsPerGridline ?? 51;
	const dx = (xMax - xMin) / (nGridlines - 1);
	const dy = (yMax - yMin) / (nPointsPerGridline - 1);
	const gridlines = [];
	for (let i = 0; i < nGridlines; ++i) {
		const x = xMin + i * dx;
		const gridline = [];
		for (let j = 0; j < nPointsPerGridline; ++j) {
			const y = yMin + j * dy;
			gridline.push([x, y]);
		}
		gridlines.push(gridline);
	}
	return gridlines;
}

let firstPlot = true;
function drawSurface3D() {
	const r = +sliders.correlation.value; // correlation
	const s1 = +sliders.particle1Spread.value; // sigma_x
	const s2 = +sliders.particle2Spread.value; // sigma_y
	const u1 = +sliders.particle1MeanPos.value; // mu_x
	const u2 = +sliders.particle2MeanPos.value; // mu_y

	const [xMin, xMax, yMin, yMax] = [X_MIN, X_MAX, Y_MIN, Y_MAX];

	function pdf(x, y) {
		return 0.001 + gaussianPdf(x, y, { r, u1, u2, s1, s2 });
	}

	const zs = triangulationInfo.gridPoints.map(([x, y]) => pdf(x, y));

	const surfaceLighting = {
		ambient: 0.7,
		roughness: 0.8,
		diffuse: 0.4,
		specular: 0.96,
	};
	const meshDatum = {
		type: "mesh3d",
		x: triangulationInfo.xs,
		y: triangulationInfo.ys,
		z: zs,
		i: triangulationInfo.i,
		j: triangulationInfo.j,
		k: triangulationInfo.k,
		lighting: surfaceLighting,
		facecolor: triangulationInfo.i.map(() => STANDARD_COLORS.graphicPrimary),
	};

	const gridlineZShift = 0.0001;
	const xGridlines = getGridlines({
		nGridlines: 12,
		f: pdf,
		xMin: X_MIN,
		xMax: X_MAX,
		yMin: Y_MIN,
		yMax: Y_MAX,
	}).map(gridline => gridline.map(([x, y]) => [x, y, gridlineZShift + pdf(x, y)]));
	const yGridlines = getGridlines({
		nGridlines: 12,
		f: pdf,
		xMin: Y_MIN,
		xMax: Y_MAX,
		yMin: X_MIN,
		yMax: X_MAX,
	}).map(gridline => gridline.map(([x, y]) => [y, x, gridlineZShift + pdf(y, x)]));

	const gridlinesData = [...xGridlines, ...yGridlines].map(gridline => ({
		type: "scatter3d",
		x: gridline.map(p => p[0]),
		y: gridline.map(p => p[1]),
		z: gridline.map(p => p[2]),
		mode: "lines",
		line: {
			color: "#000",
			width: 2.5,
		},
	}));

	const nSideViewPoints = 51;
	function getGaussianSideViewPoints(min, max, { mean, stdDev }) {
		const d = (max - min) / nSideViewPoints;
		const points = [];
		for (let i = 0; i < nSideViewPoints; ++i) {
			const x = min + i * d;
			points.push([
				x,
				gaussianPdf(x, 0, { r: 0, u1: mean, u2: 0, s1: stdDev, s2: 1 }),
			]);
		}
		return points;
	}

	const xSideViewPoints = getGaussianSideViewPoints(xMin, xMax, {
		mean: u1,
		stdDev: s1,
	}).map(([x, z]) => [x, yMax, z]);

	const ySideViewPoints = getGaussianSideViewPoints(yMin, yMax, {
		mean: u2,
		stdDev: s2,
	}).map(([y, z]) => [xMax, y, z]);

	const sideViewData = [xSideViewPoints, ySideViewPoints].map(points => ({
		type: "scatter3d",
		x: points.map(p => p[0]),
		y: points.map(p => p[1]),
		z: points.map(p => p[2]),
		mode: "lines",
		line: {
			color: "#ddd",
			width: 9,
		},
	}));

	const data = [meshDatum, ...gridlinesData, ...sideViewData];

	const axesAttrs = {
		visible: true,
		showgrid: true,
		showspikes: false,
		showline: false,
		zeroline: false,
		showticklabels: true,
		gridwidth: 3,
		color: "#aaa",
		gridcolor: "#999",
	};

	const xSpan = xMax - xMin;

	const ySpan = yMax - yMin;
	const yAspect = ySpan / xSpan;

	const zMin = Math.min(zs);
	const zMax = Math.max(zs);
	const zSpan = zMax - zMin;
	const zAspect = zSpan / xSpan;

	const layout = {
		width: GRAPH_WIDTH,
		height: GRAPH_HEIGHT,
		paper_bgcolor: "black",
		margin: { t: 0, b: 0, l: 0, r: 0 },
		hovermode: false,
		showlegend: false,
		font: { family: "sans-serif", size: 15 },
		scene: {
			aspectmode: "manual",
			aspectratio: { x: 1, y: yAspect, z: zAspect },
			xaxis: axesAttrs,
			yaxis: { ...axesAttrs, range: [yMin, yMax] },
			zaxis: {
				...axesAttrs,
				showgrid: true,
				range: [
					0,
					gaussianPdf(0, 0, {
						r: 1,
						u1: 0,
						u2: 0,
						s1: +sliders.particle1Spread.min,
						s2: +sliders.particle2Spread.min,
					}),
				],
			},
		},
	};

	if (firstPlot) {
		const cameraXYDist = 1.7;
		const cameraInitialAngle = (3 * Math.PI) / 2 - 0.4;
		const x = cameraXYDist * Math.cos(cameraInitialAngle);
		const y = cameraXYDist * Math.sin(cameraInitialAngle);
		layout.scene.camera = {
			up: { x: 0, y: 0, z: 1 },
			center: { x: 0, y: 0, z: 0 },
			eye: {
				x,
				y,
				z: 1.1,
			},
			projection: { type: "perspective" },
		};
		firstPlot = false;
	} else {
		layout.scene.camera = plot3DNode._fullLayout.scene._scene.getCamera();
	}

	const config = {
		displayModeBar: false,
		scrollZoom: false,
	};

	Plotly.react(plot3DNode, data, layout, config);
}

drawEllipse2D();
drawSurface3D();
d3.selectAll(".param-slider").on("input.all", () => {
	drawEllipse2D();
	drawSurface3D();
});

function updateTex(name, latexVariable) {
	return function () {
		const slider = this;
		const scale = d3.scaleLinear(
			[slider.min, slider.max],
			[Math.round(slider.min), Math.round(slider.max)],
		);
		const value = (() => {
			let v = scale(+this.value);
			if (Math.abs(v) < 1e-3) {
				v = +0;
				console.log(v);
			}
			const s = v.toFixed(2);
			return s;
		})();

		if (katex !== undefined) {
			katex.render(`${latexVariable}=${value}`, textSpans[name]);
		}
	};
}

const variables = [
	["correlation", "\\rho"],
	["particle1Spread", "\\sigma_1"],
	["particle2Spread", "\\sigma_2"],
	["particle1MeanPos", "\\mu_1"],
	["particle2MeanPos", "\\mu_2"],
];

// eslint-disable-next-line no-unused-vars
function updateAll() {
	for (const [name, latexVariable] of variables) {
		updateTex(name, latexVariable).call(sliders[name]);
	}
}

for (const [name, latexVariable] of variables) {
	d3.select(sliders[name]).on("input", updateTex(name, latexVariable));
}

console.log(sliders.correlation.step);
