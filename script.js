// Function that runs when the page is loaded
function onPageLoaded() {
    console.log("Page loaded");
    loadAndVisualizeCSV();
}

// Load and visualize the CSV data
function loadAndVisualizeCSV() {
    const csvFilePath = "data/spotify-2023--Cleaned-DAVI-Project.csv";

    // Load the CSV file using d3.csv with autoType to convert numbers correctly
    d3.csv(csvFilePath, d3.autoType).then(function (data) {
        console.log("Data loaded", data);

        // Set up the bar chart SVG
        const svgBar = d3.select("#chart")
            .append("svg")
            .attr("width", 800)
            .attr("height", 400);

        const barWidth = 40;
        const xSpacing = 10;

        // Tooltip for bar chart
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Function to update the bar chart
        function updateBars(data) {
            svgBar.selectAll("rect")
                .data(data)
                .join("rect")
                .attr("x", (d, i) => i * (barWidth + xSpacing))
                .attr("y", d => 400 - parseInt(d.Popularity))
                .attr("width", barWidth)
                .attr("height", d => parseInt(d.Popularity))
                .attr("fill", "steelblue")
                .on("mouseover", function (event, d) {
                    tooltip
                        .style("opacity", 1)
                        .html(`<strong>Popularity:</strong> ${d.Popularity}<br><strong>Song:</strong> ${d["Track Name"]}`)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 20}px`);
                    d3.select(this).attr("fill", "orange");
                })
                .on("mousemove", function (event) {
                    tooltip
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 20}px`);
                })
                .on("mouseout", function () {
                    tooltip.style("opacity", 0);
                    d3.select(this).attr("fill", "steelblue");
                });
        }

        // Initial render of the bar chart
        updateBars(data);

        // Filter functionality for bar chart
        const filterButton = document.getElementById("filterButton");
        if (filterButton) {
            filterButton.addEventListener("click", function () {
                const filteredData = data.filter(d => parseInt(d.Popularity) > 50);
                updateBars(filteredData);
            });
        } else {
            console.warn("Warning: 'filterButton' element not found in the HTML.");
        }

        // Set up the bubble chart SVG
        const svgBubble = d3.select("#chart")
            .append("svg")
            .attr("width", 800)
            .attr("height", 600);

        // Radius scale for bubble chart
        const radiusScale = d3.scaleSqrt()
            .domain([0, d3.max(data, d => d.Streams)])
            .range([10, 50]);

        // Tooltip for bubble chart
        const bubbleTooltip = d3.select("body")
            .append("div")
            .attr("class", "bubble-tooltip")
            .style("opacity", 0);

        // D3 force simulation for bubbles
        const simulation = d3.forceSimulation(data)
            .force("charge", d3.forceManyBody().strength(-30))
            .force("center", d3.forceCenter(400, 300))
            .force("collision", d3.forceCollide().radius(d => radiusScale(d.Streams) + 2))
            .on("tick", ticked);

        // Create circles for each data point in bubble chart
        const circles = svgBubble.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("r", d => radiusScale(d.Streams))
            .attr("fill", "steelblue")
            .on("mouseover", function (event, d) {
                bubbleTooltip
                    .style("opacity", 1)
                    .html(`<strong>Artist:</strong> ${d["Artist(S) Name"]}<br><strong>Streams:</strong> ${d.Streams}`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
                d3.select(this).attr("fill", "orange");
            })
            .on("mousemove", function (event) {
                bubbleTooltip
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 20}px`);
            })
            .on("mouseout", function () {
                bubbleTooltip.style("opacity", 0);
                d3.select(this).attr("fill", "steelblue");
            });

        // Add text labels inside each bubble
        const labels = svgBubble.selectAll("text")
            .data(data)
            .enter()
            .append("text")
            .text(d => truncateText(d["Track Name"], 10)) // Limit to 10 characters
            .attr("text-anchor", "middle")
            .attr("dy", 4)
            .attr("fill", "white")
            .style("font-size", d => `${Math.max(10, radiusScale(d.Streams) / 3)}px`);

        // Helper function to truncate text if too long
        function truncateText(text, maxLength) {
            return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
        }

        // Tick function to update circle and label positions
        function ticked() {
            circles
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            labels
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        }

    }).catch(function (error) {
        console.error("Error loading the CSV file:", error);
    });
}

// Event listener to ensure onPageLoaded runs once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", onPageLoaded);
