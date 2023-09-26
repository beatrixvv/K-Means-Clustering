var cluster_num = document.getElementById("cluster_num");
var radius = document.getElementById("radius");
var output_o = document.getElementById("value");
var distance = document.getElementById("distance");

output_o.innerHTML = radius.value;
var size = radius.value;

// Define canvas attribute
var margin = {top: 20, right: 20, bottom: 20, left: 20};
var width = 600 - margin.left - margin.right;
var height = 400 - margin.top - margin.bottom;
var data = [];

// Add canvas
var svg = d3.select("#canvas")
        .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("width", width)
            .attr("height", height);

 // Scales for x and y coordinate
var x = d3.scaleLinear()
        .domain([0, 10])
        .range([0, width]);
var y = d3.scaleLinear()
        .domain([0, 10])
        .range([height, 0]);

// Initialize data (default: grid)
for (let i = 0; i < 11; i++) {
    for (let j = 0; j < 11; j++) {
        data.push({x: i, y: j, fill: "black"});
    }
}

// Add circles
var points = svg.append("g")
            .selectAll("circle")
            .data(data)
            .join("circle")
                .attr("r", size)
                .attr("cx", d => x(d.x))
                .attr("cy", d => y(d.y))
                .attr("stroke", "gray")
                .attr("stroke-width", "2px")
                .attr("opacity", "90%");

var centroids = [];
centroids = kMeans(cluster_num.value, distance.value);

// For moving the points
var drag = false;
var initial = [];
var selected = null;

// For cancelling selection
document.addEventListener("keydown", function(event) {
    if(event["key"] == "x") {
        d3.selectAll(".selected").classed("selected", false);
    }
})

document.getElementById("canvas").addEventListener("mousedown", function(event) {
    // For selection
    if(event["target"]["nodeName"] == "circle") {
        d3.select(event["target"]).classed("selected", true);
        if (d3.selectAll(".selected")["_groups"][0].length == 6) d3.select(event["target"]).classed("selected", false);
    }
    // For moving the points
    else {
        drag = true;
        selected = null;
        initial = [];
        initial.push(event["clientX"]);
        initial.push(event["clientY"]);
    }
})

// To update the data and scatterplot
document.getElementById("canvas").addEventListener("mouseup", function() {
    drag = false;
    if (selected != null) {
        d3.selectAll(".selected")["_groups"][0].forEach(function(d) {
            // Update data
            d["__data__"]["x"] = x.invert(d.getAttribute("cx"));
            d["__data__"]["y"] = y.invert(d.getAttribute("cy"));
            // Update clustering
            colorizePoints(centroids, distance.value);
            update();
        })
    }
})

// To move the points
document.getElementById("canvas").addEventListener("mousemove", function(event) {
    if (drag) {
        let dx = event["clientX"] - initial[0];
        let dy = event["clientY"] - initial[1];
        selected = d3.selectAll(".selected");
        selected.attr("cx", d => x(d.x) + dx)
            .attr("cy", d => y(d.y) + dy);
    }
})

// If options changed
d3.select("#cluster_num").on("input", changeCluster);
d3.select("#radius").on("input", changeRadius);
d3.select("#dataset").on("input", changeDataset);
d3.select("#distance").on("input", changeDistance);

// Functions for K-Means algorithm
function getRandomPoint(fill) {
    return { 
        x: Math.floor((Math.random() * (width-59)) + 30), 
        y: Math.floor((Math.random() * (height-59)) + 30),
        fill: fill
    };
}

// Update each point's color
function update() {
    points.attr("fill", d => d.fill);
}

function getEuclidianDistance(a, b) {
    let dx = x(b.x) - a.x,
        dy = y(b.y) - a.y;
    return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
}

function getManhattanDistance(a, b) {
    let dx = x(b.x) - a.x,
        dy = y(b.y) - a.y;
    return (Math.abs(dx) + Math.abs(dy));
}

function findClosestCentroid(centroids, point, distance_funct) {
    let closest = {i: -1, distance: width * 2};
    let distance = 0;
    centroids.forEach(function(d, i) {
        if (distance_funct == "euclid") {
            distance = getEuclidianDistance(d, point);
        }
        if (distance_funct == "manhattan") {
            distance = getManhattanDistance(d, point);
        }
        // Only update when the centroid is closer
        if (distance < closest.distance) {
            closest.i = i;
            closest.distance = distance;
        }
    });
    return (centroids[closest.i]); 
}
    
function colorizePoints(centroids, distance_funct) {
    data.forEach(function(d) {
        let closest = findClosestCentroid(centroids, d, distance_funct);
        d.fill = closest.fill;
    });
}
    
function computeClusterCenter(cluster) {
    return [
        d3.mean(cluster, d => x(d.x)), 
        d3.mean(cluster, d => y(d.y))
    ];
}
    
function moveCentroids(centroids) {
    centroids.forEach(function(d) {
        // Get clusters based on their fill color
        let cluster = data.filter(function(e) {
            return e.fill == d.fill;
        });

        // Compute the cluster centers
        let center = computeClusterCenter(cluster);
        if (cluster.length == 0) {
            center = [width/2, length/2];
        }
        // Move the centroid
        d.x = center[0];
        d.y = center[1];
    });
}

function iterate(centroids, distance_funct) {
    colorizePoints(centroids, distance_funct);
    moveCentroids(centroids);
    update();
}

function kMeans(numClusters, distance_funct) {
    // Initialize random centroids
    let centroids = [];
    let colors = ["black", "blue", "green", "pink", "yellow", "lightblue", "purple", "grey", "orange", "beige"];
    for (let i = 0; i < numClusters; i++) {
        centroids.push(getRandomPoint(colors[i]));
    }
    
    // Iteratation
    for (let i = 0; i < 10; i++) {
        iterate(centroids, distance_funct);
    }
    return centroids;
}

// Functions for changed options
function changeCluster() {
    // Call the kmeans function
    centroids = kMeans(this.value, distance.value);
}

function changeRadius() {
    // Update the displayed value
    output_o.innerHTML = this.value;
    size = this.value;
    // Update the chart
    points.attr("r", this.value);
}

function changeDataset() {
    let dataset = document.getElementById("dataset").value;
    // Reset the chart
    svg.selectAll("circle").remove();
    data = [];

    // Initialize data based on the dataset
    if (dataset == "grid") {
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                data.push({x: i, y: j, fill: "black"});
            }
        }
    }
    if (dataset == "diamond") {
        // For the upper part
        for (let i = 0; i <= 3; i++) {
            for (let j = 4-i; j <= 6+i; j++) {
                data.push({x: j, y: i, fill: "black"})
            }
        }
        // For the middle part
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 11; j++) {
                data.push({x: j, y: 4+i, fill: "black"})
            }
        }
        // For the lower part
        for (let i = 0; i <= 3; i++) {
            for (let j = 4-i; j <= 6+i; j++) {
                data.push({x: j, y: 10-i, fill: "black"})
            }
        }
    }

    if (dataset == "random") {
        for (let i = 0; i < 100; i++) {
            // Generate random number [0,11)
            let x = Math.floor(Math.random() * 11);
            let y = Math.floor(Math.random() * 11);
            data.push({x: x, y: y, fill: "black"});
        }
    }

    // Add circles
    points = svg.append("g")
            .selectAll("circle")
            .data(data)
            .join("circle")
                .attr("r", size)
                .attr("cx", d => x(d.x))
                .attr("cy", d => y(d.y))
                .attr("stroke", "gray")
                .attr("stroke-width", "2px")
                .attr("opacity", "90%");
    
    centroids = kMeans(cluster_num.value, distance.value);
}

function changeDistance() {
    // Call the kmeans function
    centroids = kMeans(cluster_num.value, this.value);
}