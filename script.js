// Function that runs when the page is loaded
function onPageLoaded() {
    console.log("Page loaded");
    loadAndVisualizeCSV();
}

// Load and visualize the CSV data
function loadAndVisualizeCSV() {
    const csvFilePath = "data/spotify-2023--Cleaned-DAVI-Project.csv";

    // Load the CSV file using d3.csv
    d3.csv(csvFilePath, d3.autoType).then(function (data) {
        console.log("Data loaded:", data);

        // Check if data contains the necessary fields
        if (!data.length || !data[0]["Track Name"] || !data[0].Streams || !data[0].Popularity) {
            console.error("CSV file is missing required columns.");
            return;
        }

        // Visualize the bar chart
        createBarChart(data);

        // Visualize the bubble chart
        createBubbleChart(data);
    }).catch(function (error) {
        console.error("Error loading the CSV file:", error);
    });
}

// Function to create a bar chart
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

    // Create scales
    const x = d3.scaleBand()
        .domain(data.slice(0, 10).map(d => d["Track Name"]))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.Streams)])
        .nice()
        .range([height, 0]);

    // Add axes
    chartGroup.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d => d.length > 10 ? `${d.slice(0, 10)}...` : d))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    chartGroup.append("g")
        .call(d3.axisLeft(y));

    // Add bars
    chartGroup.selectAll(".bar")
        .data(data.slice(0, 10))
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d["Track Name"]))
        .attr("y", d => y(d.Streams))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.Streams))
        .attr("fill", "steelblue")
        .on("mouseover", function (event, d) {
            d3.select("#tooltip")
                .style("opacity", 1)
                .html(`<strong>${d["Track Name"]}</strong><br>Streams: ${d.Streams}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
            d3.select(this).attr("fill", "orange");
        })
        .on("mousemove", function (event) {
            d3.select("#tooltip")
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
            d3.select("#tooltip").style("opacity", 0);
            d3.select(this).attr("fill", "steelblue");
        });
}

// Function to create a bubble chart
function createBubbleChart(data) {
    const svgWidth = 800, svgHeight = 600;

    const svg = d3.select("#bubbleChart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.Streams)])
        .range([10, 50]);

    const simulation = d3.forceSimulation(data)
        .force("x", d3.forceX(svgWidth / 2).strength(0.05))
        .force("y", d3.forceY(svgHeight / 2).strength(0.05))
        .force("collision", d3.forceCollide(d => radiusScale(d.Streams) + 2));

    const bubbles = svg.selectAll(".bubble")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "bubble")
        .attr("r", d => radiusScale(d.Streams))
        .attr("fill", "steelblue")
        .on("mouseover", function (event, d) {
            d3.select("#tooltip")
                .style("opacity", 1)
                .html(`<strong>${d["Track Name"]}</strong><br>Streams: ${d.Streams}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
            d3.select(this).attr("fill", "orange");
        })
        .on("mousemove", function (event) {
            d3.select("#tooltip")
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 20}px`);
        })
        .on("mouseout", function () {
            d3.select("#tooltip").style("opacity", 0);
            d3.select(this).attr("fill", "steelblue");
        });

    simulation.nodes(data)
        .on("tick", () => {
            bubbles
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });
}

// Ensure the function runs once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", onPageLoaded);
