const w = 400,
  h = 350,
  x = d3
    .scaleLinear()
    .range([-w / 2, w / 2])
    .domain([-6, 6]),
  y = d3
    .scaleLinear()
    .range([-h / 2, h / 2])
    .domain([10, -10]),
  cx = d3.scaleLinear().range([0, w]).domain([0, 10]),
  cy = d3
    .scaleLinear()
    .range([-h / 2, h / 2])
    .domain([-3, 3]);

var c0 = 0,
  c1 = 0,
  c2 = 0,
  c3 = 0;

const sliders = {
  constant: document.getElementById("constant"),
  linear: document.getElementById("linear"),
  quadratic: document.getElementById("quadratic"),
  cubic: document.getElementById("cubic"),
};

const cos_graph = d3
  .select("#svg")
  .append("g")
  .attr("transform", "translate(" + 25 + ", " + (h / 2 + 25) + ")");
cos_graph.append("g").attr("class", "axis").call(d3.axisBottom(cx).ticks(0));
cos_graph.append("g").attr("class", "axis").call(d3.axisLeft(cy).ticks(0));
cos_graph
  .append("text")
  .attr("x", w / 2 - 80)
  .attr("y", -h / 2 + 10)
  .style("stroke", "white")
  .style("fill", "white")
  .style("text-align", "center")
  .text("Cosine Coefficients");
const cos = cos_graph
  .append("path")
  .attr("fill", "none")
  .style("stroke", "lightgrey")
  .style("stroke-width", 3);

const sin_graph = d3
  .select("#svg2")
  .append("g")
  .attr("transform", "translate(" + 25 + ", " + (h / 2 + 25) + ")");
sin_graph.append("g").attr("class", "axis").call(d3.axisBottom(cx).ticks(0));
sin_graph.append("g").attr("class", "axis").call(d3.axisLeft(cy).ticks(0));
sin_graph
  .append("text")
  .attr("x", w / 2 - 80)
  .attr("y", -h / 2 + 10)
  .style("stroke", "white")
  .style("fill", "white")
  .style("text-align", "center")
  .text("Sine Coefficients");
const sin = sin_graph
  .append("path")
  .attr("fill", "none")
  .style("stroke", "lightgrey")
  .style("stroke-width", 3);

const poly_graph = d3
  .select("#svg3")
  .append("g")
  .attr("transform", "translate(" + (25 + w / 2) + ", " + (h / 2 + 35) + ")");
poly_graph
  .append("g")
  .attr("class", "axis")
  .call(d3.axisBottom(x).tickValues([-6, -3, 3, 6]));
poly_graph
  .append("g")
  .attr("class", "axis")
  .call(d3.axisLeft(y).tickValues([-10, -5, 5, 10]));
poly_graph
  .append("text")
  .attr("x", -60)
  .attr("y", -h / 2 - 15)
  .style("stroke", "white")
  .style("fill", "white")
  .style("text-align", "center")
  .text("Polynomial");
const poly = poly_graph
  .append("path")
  .attr("fill", "none")
  .style("stroke", "#5df")
  .style("stroke-width", 3);

const peri_graph = d3
  .select("#svg4")
  .append("g")
  .attr("transform", "translate(" + (25 + w / 2) + ", " + (h / 2 + 35) + ")");
peri_graph
  .append("g")
  .attr("class", "axis")
  .call(d3.axisBottom(x).tickValues([-6, -3, 3, 6]));
peri_graph
  .append("g")
  .attr("class", "axis")
  .call(d3.axisLeft(y).tickValues([-10, -5, 5, 10]));
peri_graph
  .append("text")
  .attr("x", -120)
  .attr("y", -h / 2 - 15)
  .style("stroke", "white")
  .style("fill", "white")
  .style("text-align", "center")
  .text("Periodicized Polynomial");
const peri = peri_graph
  .append("path")
  .attr("fill", "none")
  .style("stroke", "#5df")
  .style("stroke-width", 3);

const fourier_graph = d3
  .select("#svg5")
  .append("g")
  .attr("transform", "translate(" + (25 + w / 2) + ", " + (h / 2 + 35) + ")");
fourier_graph
  .append("g")
  .attr("class", "axis")
  .call(d3.axisBottom(x).tickValues([-6, -3, 3, 6]));
fourier_graph
  .append("g")
  .attr("class", "axis")
  .call(d3.axisLeft(y).tickValues([-10, -5, 5, 10]));
fourier_graph
  .append("text")
  .attr("x", -130)
  .attr("y", -h / 2 - 15)
  .style("stroke", "white")
  .style("fill", "white")
  .style("text-align", "center")
  .text("10 Term Fourier Approximation");
const fourier = fourier_graph
  .append("path")
  .attr("fill", "none")
  .style("stroke", "#5df")
  .style("stroke-width", 3);

function get_poly_path() {
  var points = [];
  c0 = +sliders.constant.value;
  c1 = +sliders.linear.value;
  c2 = +sliders.quadratic.value;
  c3 = +sliders.cubic.value;

  for (var i = -6; i < 6; i += 12 / 1000) {
    points.push([
      (w * i) / 12,
      (-h * (c3 * i ** 3 + c2 * i ** 2 + c1 * i + c0)) / 20,
    ]);
  }

  return points;
}

function get_peri_path() {
  var points = [],
    x;

  for (var i = -6; i < 6; i += 12 / 1000) {
    x =
      ((((i + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) -
      Math.PI;
    points.push([
      (w * i) / 12,
      (-h * (c3 * x ** 3 + c2 * x ** 2 + c1 * x + c0)) / 20,
    ]);
  }

  return points;
}

/* Fourier series:
Even functions - f(x) = a_0/2 + Sigma a_n cos(n pi x / L), a_n = 2/L int [0,L] f(x) cos(n pi x / L) dx
Odd function - f(x) = Sigma b_n sin (n pi x / L), b_n = 2/L int [0,L] f(x) cos(n pi x / L) dx

*/

function get_sin_coefs() {
  var coefs = [];
  for (var n = 1; n < 11; n++) {
    coefs.push(
      (c1 * 2 * (-1) ** n) / n +
        (c3 * 2 * (-1) ** n * (Math.PI ** 2 - 6 / n ** 2)) / n
    );
  }

  return coefs;
}

function get_cos_coefs() {
  var coefs = [c0 + (c2 * Math.PI ** 2) / 3];
  for (var n = 1; n < 10; n++) {
    coefs.push((c2 * 4 * (-1) ** n) / n ** 2);
  }

  return coefs;
}

function get_fourier_path(coscs, sincs) {
  var points = [],
    y;

  for (var i = -6; i < 6; i += 12 / 1000) {
    y = 0;
    for (var n = 0; n < 10; n++) {
      y += coscs[n] * Math.cos(n * i) + sincs[n] * Math.sin(n * i);
    }
    points.push([(w * i) / 12, (-h * y) / 20]);
  }

  return points;
}

function update() {
  var cosd = "",
    sind = "";
  poly.attr("d", d3.line()(get_poly_path()));
  peri.attr("d", d3.line()(get_peri_path()));

  var coscs = get_cos_coefs(),
    sincs = get_sin_coefs();

  for (var i = 0; i < 10; i++) {
    cosd +=
      "M " + ((i + 1) * w) / 10 + ", " + 0 + " v " + (coscs[i] * h) / 6 + " ";
    sind +=
      "M " + ((i + 1) * w) / 10 + ", " + 0 + " v " + (sincs[i] * h) / 6 + " ";
  }

  cos.attr("d", cosd);
  sin.attr("d", sind);
  fourier.attr("d", d3.line()(get_fourier_path(coscs, sincs)));
}

d3.selectAll("input").on("input", update);
d3.selectAll(".tick text").attr("class", "axis-label");

update();
