const GRAPH_WIDTH = 400;
const GRAPH_HEIGHT = GRAPH_WIDTH;

const plotPlusPolarized = d3.select("#gw-plus-polarized");
const plotCrossPolarized = d3.select("#gw-cross-polarized");

const plots = d3
	.selectAll(".gw-plot")
	.attr("width", GRAPH_WIDTH)
	.attr("height", GRAPH_HEIGHT);

const graphMargin = 15;
const X_MIN = -5;
const X_MAX = 5;
const X_0 = (X_MIN + X_MAX) / 2;
const Y_MIN = -5;
const Y_MAX = 5;
const Y_0 = (Y_MIN + Y_MAX) / 2;
const xScale = d3.scaleLinear([X_MIN, X_MAX], [graphMargin, GRAPH_WIDTH - graphMargin]);
const yScale = d3.scaleLinear(
	[Y_MIN, Y_MAX],
	[GRAPH_HEIGHT - graphMargin, graphMargin],
);

const spreadScale = d3.scaleLinear([-1, 1], [0.6, 2.4]);
const correlationScale = d3.scaleLinear([-1, 1], [-0.95, 0.95]);

const sliders = {
	// Functions as particle 1 spread and particle 2 spread
	plusPolarization: document.getElementById("slider-plus-polarized"),
	// Functions as the correlation
	crossPolarization: document.getElementById("slider-cross-polarized"),
};

d3.selectAll(".param-slider")
	.property("type", "range")
	.property("step", 0.001)
	.property("min", -1)
	.property("max", 1)
	.property("value", 0);

// Set up 2D plots
(() => {
	const x0 = xScale(X_0);
	const y0 = yScale(Y_0);
	// x axis ticks

	// axes themselves
	plots
		.selectAll(".axis")
		.data([
			{
				x1: xScale(X_MIN),
				x2: xScale(X_MAX),
				y1: y0,
				y2: y0,
			},
			{
				x1: x0,
				x2: x0,
				y1: yScale(Y_MIN),
				y2: yScale(Y_MAX),
			},
		])
		.join("line")
		.classed("axis", true)
		.attr("x1", d => d.x1)
		.attr("x2", d => d.x2)
		.attr("y1", d => d.y1)
		.attr("y2", d => d.y2);
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

// Synopsis: we perform an eigendecomposition on the covariance matrix and use this to
// compute its sqrt. Then we use this to generate points on the ellipse of the
// level set
function drawEllipse2D(plot, { r, s1, s2, u1, u2 }) {
	r = r ?? correlationScale(0);
	s1 = s1 ?? spreadScale(0);
	s2 = s2 ?? spreadScale(0);
	u1 = u1 ?? 0;
	u2 = u2 ?? 0;
	// const r = +sliders.correlation.value; // correlation
	// const s1 = +sliders.particle1Spread.value; // sigma_1
	// const s2 = +sliders.particle2Spread.value; // sigma_2
	// const u1 = 0; // mu_1
	// const u2 = 0; // mu_2

	// eigendecomposition of the covariance matrix
	let lambda1, lambda2, eVec1, eVec2;
	if (r === 0) {
		lambda1 = s1;
		lambda2 = s2;
		if (plot === plotPlusPolarized) {
			eVec1 = [0, 1];
			eVec2 = [1, 0];
		} else {
			const v = 0.5 ** 0.5;
			eVec1 = [-v, v];
			eVec2 = [v, v];
		}
	} else {
		// ICM stands for inverse (of the) covariance matrix
		const discriminantICM = Math.sqrt((s1 - s2) ** 2 + 4 * r ** 2);
		lambda1 = (s1 + s2 - discriminantICM) / 2;
		lambda2 = (s1 + s2 + discriminantICM) / 2;
		eVec1 = unitVector([(s1 - s2 - discriminantICM) / (2 * r), 1]);
		eVec2 = unitVector([(s1 - s2 + discriminantICM) / (2 * r), 1]);
	}

	if (r < 0) {
		eVec1 = eVec1.map(x => x * -1);
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

	function getPointsOnEllipse(radius) {
		const nPoints = 48;
		const pointsOnUnitCircle = d3.range(nPoints).map(i => {
			const theta =
				(r < 0 ? -Math.PI / 2 : 0) + (0.2 + (i / nPoints) * 2 * Math.PI);

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

		return pointsOnEllipse;
	}

	const ellipsePoints = getPointsOnEllipse(2.5);
	plot.selectAll(".ellipse-point")
		.data(ellipsePoints)
		.join("circle")
		.classed("ellipse-point", true)
		.attr("cx", d => xScale(d[0]))
		.attr("cy", d => yScale(d[1]))
		.attr("r", 2.5);
}

function drawPlusPolarized(plusPolarization) {
	plusPolarization = plusPolarization ?? +sliders.plusPolarization.value;
	const s1 = spreadScale(plusPolarization);
	const s2 = spreadScale(-plusPolarization);
	drawEllipse2D(plotPlusPolarized, { s1, s2 });
}

function drawCrossPolarized(crossPolarization) {
	crossPolarization = correlationScale(
		crossPolarization ?? +sliders.crossPolarization.value,
	);
	drawEllipse2D(plotCrossPolarized, { r: crossPolarization });
}

d3.select(sliders.plusPolarization).on("input", function () {
	drawPlusPolarized(+this.value);
});

d3.select(sliders.crossPolarization).on("input", function () {
	drawCrossPolarized(+this.value);
});

drawPlusPolarized();
drawCrossPolarized();
