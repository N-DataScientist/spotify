// Global variable to store the selected metric for visualization
let selectedMetric = "streams";

// Function to update visualizations based on the selected metric
function update(selectedVar) {
    selectedMetric = selectedVar;

    // Load CSV file and process data
    d3.csv("data/dasbtest.csv", d3.autoType).then(function (data) {
        // Sort and slice to the top 10 tracks
        const topTracks = data.sort((a, b) => b[selectedMetric] - a[selectedMetric]).slice(0, 10);

        // Update visualizations with the filtered data
        updateBarChart(topTracks);
        updateBubbleChart(topTracks);
    }).catch(function (error) {
        console.error("Error loading or parsing CSV file:", error);
    });
}

// Function to update the bar chart
function updateBarChart(data) {
    const svgWidth = 800, svgHeight = 400;
    const margin = { top: 20, right: 30, bottom: 120, left: 50 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select("#barChart svg");

    const x = d3.scaleBand()
        .domain(data.map(d => d.track_name))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[selectedMetric])])
        .range([height, 0]);

    const chartGroup = svg.select("g");

    // Update axes
    chartGroup.select(".x-axis")
        .transition()
        .duration(1000)
        .call(d3.axisBottom(x).tickFormat(d => d.length > 10 ? `${d.slice(0, 10)}...` : d))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    chartGroup.select(".y-axis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(y));

    // Update bars
    const bars = chartGroup.selectAll(".bar").data(data);

    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .merge(bars)
        .transition()
        .duration(1000)
        .attr("x", d => x(d.track_name))
        .attr("y", d => y(d[selectedMetric]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d[selectedMetric]))
        .attr("fill", "steelblue");

    bars.exit().remove();
}

// Function to update the bubble chart
function updateBubbleChart(data) {
    const svgWidth = 800, svgHeight = 600;

    const svg = d3.select("#bubbleChart svg");

    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d[selectedMetric])])
        .range([10, 50]);

    const simulation = d3.forceSimulation(data)
        .force("x", d3.forceX(svgWidth / 2).strength(0.05))
        .force("y", d3.forceY(svgHeight / 2).strength(0.05))
        .force("collision", d3.forceCollide(d => radiusScale(d[selectedMetric]) + 2));

    const bubbles = svg.selectAll(".bubble").data(data);

    bubbles.enter()
        .append("circle")
        .attr("class", "bubble")
        .merge(bubbles)
        .transition()
        .duration(1000)
        .attr("r", d => radiusScale(d[selectedMetric]))
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("fill", "steelblue");

    bubbles.exit().remove();

    simulation.nodes(data).on("tick", () => {
        svg.selectAll(".bubble")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });
}

// Initial Load Function
function onPageLoaded() {
    d3.csv("data/dasbtest.csv", d3.autoType).then(function (data) {
        // Filter the top 10 tracks initially
        const topTracks = data.sort((a, b) => b.streams - a.streams).slice(0, 10);

        // Initialize visualizations with the filtered data
        createBarChart(topTracks);
        createBubbleChart(topTracks);
    }).catch(function (error) {
        console.error("Error loading or parsing CSV file:", error);
    });
}

// Function to create the bar chart
function createBarChart(data) {
    const svgWidth = 800, svgHeight = 400;
    const margin = { top: 20, right: 30, bottom: 120, left: 50 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select("#barChart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    const chartGroup = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    chartGroup.append("g").attr("class", "x-axis").attr("transform", `translate(0, ${height})`);
    chartGroup.append("g").attr("class", "y-axis");

    updateBarChart(data);
}

// Function to create the bubble chart
function createBubbleChart(data) {
    const svgWidth = 800, svgHeight = 600;

    const svg = d3.select("#bubbleChart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    updateBubbleChart(data);
}

// Ensure the function runs once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", onPageLoaded);
