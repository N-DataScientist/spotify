// Check if the global variable selectedMetric needs validation to prevent unintended values.
let selectedMetric = "streams";

// Consider limiting the number of records processed in update to improve performance.
function update(selectedVar) {
    selectedMetric = selectedVar;

    d3.csv("data/spoty.csv", d3.autoType).then(function (data) {
        // Validate data existence and sort operation to avoid runtime errors.
        const topTracks = data.sort((a, b) => b[selectedMetric] - a[selectedMetric]);

        updateBarChart(topTracks);
        updateBubbleChart(topTracks);
    }).catch(function (error) {
        console.error("Error loading or parsing CSV file:", error);
    });
}

// Avoid redundant data sorting in onPageLoaded. Sorting and slicing can be combined.
function onPageLoaded() {
    d3.csv("data/spoty.csv", d3.autoType).then(function (data) {
        const topTracks = data.sort((a, b) => b.streams - a.streams).slice(0, 30);

        createBarChart(topTracks);
        createBubbleChart(topTracks);
        createFilterOptions(data);
    }).catch(function (error) {
        console.error("Error loading or parsing CSV file:", error);
    });
}

// Add checks for svg existence in updateBarChartFromBubble to avoid DOM duplication issues.
function updateBarChartFromBubble(selectedData) {
    const svgWidth = 800, svgHeight = 400;
    const margin = { top: 20, right: 50, bottom: 150, left: 70 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select("#barChart svg");

    const barData = [
        { metric: "Streams", value: selectedData.streams },
        { metric: "Playlists", value: selectedData.in_spotify_playlists }
    ];

    const x = d3.scaleBand()
        .domain(barData.map(d => d.metric))
        .range([0, width])
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.value) * 1.2])
        .range([height, 0]);

    const chartGroup = svg.select("g");

    chartGroup.select(".x-axis")
        .transition()
        .duration(1000)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    chartGroup.select(".y-axis")
        .transition()
        .duration(1000)
        .call(d3.axisLeft(y));

    const bars = chartGroup.selectAll(".bar").data(barData);

    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .merge(bars)
        .transition()
        .duration(1000)
        .attr("x", d => x(d.metric))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.value))
        .attr("fill", () => selectedData.color || "steelblue");

    const labels = chartGroup.selectAll(".bar-label").data(barData);

    labels.enter()
        .append("text")
        .attr("class", "bar-label")
        .merge(labels)
        .transition()
        .duration(1000)
        .attr("x", d => x(d.metric) + x.bandwidth() / 2)
        .attr("y", d => y(d.value) - 10)
        .attr("text-anchor", "middle")
        .text(d => d.value.toLocaleString());

    bars.exit().remove();
    labels.exit().remove();
}

// Add a maximum radius size check to prevent bubbles from exceeding the container.
function updateBubbleChart(data) {
    const svgWidth = 800, svgHeight = 600;

    const svg = d3.select("#bubbleChart svg");

    const maxStreams = d3.max(data, d => d[selectedMetric]);

    const radiusScale = d3.scaleSqrt()
        .domain([0, maxStreams])
        .range([10, 50]);

    const colorScale = d3.scaleLinear()
        .domain([0, maxStreams])
        .range(["#cce5ff", "#003366"]);

    const simulation = d3.forceSimulation(data)
        .force("x", d3.forceX(svgWidth / 2).strength(0.05))
        .force("y", d3.forceY(svgHeight / 2).strength(0.05))
        .force("collision", d3.forceCollide(d => radiusScale(d[selectedMetric]) + 2));

    const bubbles = svg.selectAll(".bubble-group").data(data);

    const bubbleGroup = bubbles.enter()
        .append("g")
        .attr("class", "bubble-group")
        .on("mouseover", function (event, d) {
            const tooltip = d3.select(".tooltip");
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`<strong>Artist:</strong> ${d.artist_name}<br><strong>Song:</strong> ${d.track_name}<br><strong>${selectedMetric}:</strong> ${d[selectedMetric].toLocaleString()}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function () {
            d3.select(".tooltip").transition().duration(500).style("opacity", 0);
        });

    bubbleGroup
        .append("circle")
        .attr("class", "bubble")
        .merge(bubbles.select("circle"))
        .on("click", function (event, d) {
            d.color = colorScale(d[selectedMetric]);
            updateBarChartFromBubble(d);
        })
        .transition()
        .duration(1000)
        .attr("r", d => radiusScale(d[selectedMetric]))
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("fill", d => colorScale(d[selectedMetric]));

    bubbleGroup
        .append("text")
        .attr("class", "bubble-label")
        .merge(bubbles.select("text"))
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("pointer-events", "none")
        .text(d => d.artist_name);

    bubbles.exit().remove();

    simulation.nodes(data).on("tick", () => {
        svg.selectAll(".bubble")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        svg.selectAll(".bubble-label")
            .attr("x", d => d.x)
            .attr("y", d => d.y + 4);
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

    updateBarChartFromBubble(data[0]); // Initialize with first bubble data
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

// Function to create filters for the data
function createFilterOptions(data) {
    // Remove any existing filter to avoid duplicates
    d3.select("#filters").remove();

    // Extract unique artist names
    const uniqueArtists = Array.from(new Set(data.map(d => d.artist_name)));

    // Insert the filter container before the bubble chart
    const filterDiv = d3.select("#bubbleChart")
        .insert("div", ":first-child") // Position it above the chart
        .attr("id", "filters")
        .style("margin-bottom", "20px")
        .style("text-align", "center");

    // Create the dropdown label and select element
    filterDiv.append("label")
        .text("Filter by Artist: ")
        .style("margin-right", "10px");

    filterDiv.append("select")
        .attr("id", "artistFilter")
        .on("change", function () {
            const selectedArtist = this.value;
            if (selectedArtist === "All") {
                updateBubbleChart(data); // Show all data if "All" is selected
            } else {
                const filteredData = data.filter(d => d.artist_name === selectedArtist);
                updateBubbleChart(filteredData);
            }
        })
        .selectAll("option")
        .data(["All", ...uniqueArtists]) // Include an "All" option
        .enter()
        .append("option")
        .text(d => d);
}



// Ensure the function runs once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", onPageLoaded);
