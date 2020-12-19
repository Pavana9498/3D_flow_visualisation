"use strict";

/* Get or create the application global variable */
var App = App || {};

const ParticleSystem = function () {

    // setup the pointer to the scope 'this' variable
    const self = this;

    // data container
    const data = [];

    // scene graph group for the particle system
    const sceneObject = new THREE.Group();

    // bounds of the data
    const bounds = {};

    var particleSystem;


    // create the containment box.
    // This cylinder is only to guide development.
    // TODO: Remove after the data has been rendered
    self.drawContainment = function () {

        // get the radius and height based on the data bounds
        const radius = (bounds.maxX - bounds.minX) / 2.0 + 1;
        const height = (bounds.maxY - bounds.minY) + 1;

        // create a cylinder to contain the particle system
        const geometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
        const cylinder = new THREE.Mesh(geometry, material);

        // add the containment to the scene
        sceneObject.add(cylinder);
    };
    var colors = d3.scaleSequential().domain([0, 360])
        .interpolator(d3.interpolatePlasma);

    self.createParticleSystem = function () {

        // use self.data to create the particle system
        // draw your particle system here!

        var ledgerSvg = d3.select("#scene").append("svg")
            .attr('width', 50)
            .attr('height', 350)
            .attr('transform', 'translate(' + 800 + ',' +
                -400 + ')');

        var defs = ledgerSvg.append("defs");

        var linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient")
            .attr("gradientTransform", "rotate(90)");

        linearGradient.selectAll("stop")
            .data(colors.ticks().map((t, i, n) => ({ offset: `${100 * i / n.length}%`, color: colors(t) })))
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        ledgerSvg.append('g')
            .attr("transform", `translate(0,5)`)
            .append("rect")
            .attr('transform', `translate(0,5)`)
            .attr("width", 20)
            .attr("height", 300)
            .style("fill", "url(#linear-gradient)");

        var ledgerscale = d3.scaleLinear()
            .range([5, 305])
            .domain(colors.domain());

        var ledgeraxis = d3.axisRight()
            .scale(ledgerscale)
            .tickSize(8)
            .ticks(10);

        ledgerSvg
            .append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + (21) + "," + (5) + ")")
            .call(ledgeraxis);

        var particleCount = 1800,
            particles = new THREE.Geometry(),
            pMaterial = new THREE.PointsMaterial({
                size: 1,
                sizeAttenuation: false,
                vertexColors: THREE.VertexColors,
            });
        
        var planeWidth = (bounds.maxX - bounds.minX) + 1;
        var planeHeight = (bounds.maxY - bounds.minY) + 1;
        var geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        var material = new THREE.MeshBasicMaterial({ color: 0xFFF5EE, side: THREE.DoubleSide });
        var plane = new THREE.Mesh(geometry, material);
        plane.geometry.translate(0, bounds.maxY / 2, 0);
        // movement
        document.addEventListener("keydown", onDocumentKeyDown, false);
        function onDocumentKeyDown(event) {
            var keyCode = event.which;
            // up
            if (keyCode == 65) {
                plane.position.z -= 0.008;
                // d3.select("svg").remove();
                self.scatterPlot(plane.position.z);
                self.grays(plane.position.z);
                // right
            } else if (keyCode == 68) {
                plane.position.z += 0.008;
                // d3.select("svg").remove();
                self.scatterPlot(plane.position.z);
                self.grays(plane.position.z);
                // space
            }
        }
        sceneObject.add(plane);

        // now create the individual particles
        for (var p = 0; p < data.length; p++) {

            // create a particle with random
            // position values, -250 -> 250
            var pX = data[p].X,
                pY = data[p].Y,
                pZ = data[p].Z,
                particle = new THREE.Vector3(pX, pY, pZ);

            var colour = new THREE.Color(colors(data[p].concentration));

            particles.vertices.push(particle);

            particles.colors.push(colour);
        }

        // create the particle system
        particleSystem = new THREE.Points(
            particles,
            pMaterial);

        particleSystem.sortParticles = true;

        // add it to the scene
        sceneObject.add(particleSystem);

    };

    self.scatterPlot = function (zCoordinates) {

        d3.select('#scatterplot').select('svg').remove();

        // set the dimensions and margins of the graph
        var margin = { top: 10, right: 30, bottom: 110, left: 60 },
            width = 460 - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // append the svg object to the body of the page
        var svg = d3.select("#scatterplot")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        var dataset = data.filter(p => {
            return p.Z >= (zCoordinates - 0.005) && p.Z <= (zCoordinates + 0.005);
        });

        // Add X axis
        var x = d3.scaleLinear()
            .domain(d3.extent(dataset.map(p => p.X)))
            .range([0, width]);
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        // Add Y axis
        var y = d3.scaleLinear()
            .domain(d3.extent(dataset.map(p => p.Y)))
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y));

        // Add dots
        var circles = svg.append('g')
            .selectAll("dot")
            .data(dataset)
            .enter()
            .append("circle")
            .attr("cx", function (d) { return x(d.X); })
            .attr("cy", function (d) { return y(d.Y); })
            .attr("r", 3)
            .attr("class", "non_brushed")
            .style("fill", function (d) {
                return colors(d.concentration);
            });
        function highlightBrushedCircles() {

            if (d3.event.selection != null) {

                // revert circles to initial style
                circles.attr("class", "non_brushed");

                var brush_coords = d3.brushSelection(this);

                // style brushed circles
                circles.filter(function () {

                    var cx = d3.select(this).attr("cx"),
                        cy = d3.select(this).attr("cy");

                    return isBrushed(brush_coords, cx, cy);
                })
                    .attr("class", "brushed");
            }
        }
        self.grays = function (zCoordinates) {
            for (var p = 0; p < particleSystem.geometry.vertices.length; p++) {
                if (data[p].Z >= (zCoordinates - 0.05) && data[p].Z <= (zCoordinates + 0.05)) {
                    particleSystem.geometry.colors[p].set(colors(data[p].concentration));

                }
                else {
                    particleSystem.geometry.colors[p].set("#DCDCDC");
                }
            }
        }

        particleSystem.geometry.colorsNeedUpdate = true;
        function displayTable() {

            // disregard brushes w/o selections  
            if (!d3.event.selection) return;

            // programmed clearing of brush after mouse-up
            d3.select(this).call(brush.move, null);

            var d_brushed = d3.selectAll(".brushed").data();

            // populate table if one or more elements is brushed
            if (d_brushed.length > 0) {
                clearTableRows();
                d_brushed.forEach(d_row => populateTableRow(d_row))
            } else {
                clearTableRows();
            }
        }

        var brush = d3.brush()
            .on("brush", highlightBrushedCircles)
            .on("end", displayTable);

        svg.append("g")
            .call(brush);

    }
    function clearTableRows() {

        hideTableColNames();
        d3.selectAll(".row_data").remove();
    }

    function isBrushed(brush_coords, cx, cy) {

        var x0 = brush_coords[0][0],
            x1 = brush_coords[1][0],
            y0 = brush_coords[0][1],
            y1 = brush_coords[1][1];

        return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
    }

    function hideTableColNames() {
        d3.select("table").style("visibility", "hidden");
    }

    function showTableColNames() {
        d3.select("table").style("visibility", "visible");
    }

    function populateTableRow(d_row) {

        showTableColNames();

        var d_row_filter = [
            d_row.concentration];

        d3.select("table")
            .append("tr")
            .attr("class", "row_data")
            .selectAll("td")
            .data(d_row_filter)
            .enter()
            .append("td")
            .attr("align", (d, i) => i == 0 ? "left" : "right")
            .text(d => d);
    }
    // data loading function
    self.loadData = function (file) {

        // read the csv file
        d3.csv(file)
            // iterate over the rows of the csv file
            .row(function (d) {

                // get the min bounds
                bounds.minX = Math.min(bounds.minX || Infinity, d.Points0);
                bounds.minY = Math.min(bounds.minY || Infinity, d.Points2);
                bounds.minZ = Math.min(bounds.minZ || Infinity, d.Points1);
                bounds.minC = Math.min(bounds.minC || Infinity, d.concentration);

                // get the max bounds
                bounds.maxX = Math.max(bounds.maxX || -Infinity, d.Points0);
                bounds.maxY = Math.max(bounds.maxY || -Infinity, d.Points2);
                bounds.maxZ = Math.max(bounds.maxY || -Infinity, d.Points1);
                bounds.maxC = Math.max(bounds.maxC || -Infinity, d.concentration);

                // add the element to the data collection
                data.push({
                    // concentration density
                    concentration: Number(d.concentration),
                    // Position
                    X: Number(d.Points0),
                    Z: Number(d.Points1),
                    Y: Number(d.Points2),
                    // Velocity
                    U: Number(d.velocity0),
                    W: Number(d.velocity1),
                    V: Number(d.velocity2)
                });
            })
            // when done loading
            .get(function () {
                // draw the containment cylinder
                // TODO: Remove after the data has been rendered
                // self.drawContainment();

                // create the particle system
                self.createParticleSystem();
            });
    };

    // publicly available functions
    self.public = {

        // load the data and setup the system
        initialize: function (file) {
            self.loadData(file);
        },

        // accessor for the particle system
        getParticleSystems: function () {
            return sceneObject;
        }
    };

    return self.public;

};