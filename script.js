// Function that runs when the page is loaded
function onPageLoaded() {
    console.log("page loaded");

    // Load and visualize CSV data
    loadAndVisualizeCSV();
}

function loadAndVisualizeCSV() {
    const csvFilePath = "data/spotify-2023--Cleaned-DAVI-Project.csv";

    d3.csv(csvFilePath).then(function(data) {
        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", 800)
            .attr("height", 400);

        const barWidth = 40;
        const xSpacing = 10;

        // Create a tooltip div and add it to the body
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip");

        // Draw initial bars with interactive tooltips and hover effect
        function updateBars(data) {
            svg.selectAll("rect")
                .data(data)
                .join("rect") // Use join to handle enter and update selections
                .attr("x", (d, i) => i * (barWidth + xSpacing))
                .attr("y", d => 400 - parseInt(d.Popularity)) // Replace 'Popularity' with your column name
                .attr("width", barWidth)
                .attr("height", d => parseInt(d.Popularity))
                .attr("fill", "steelblue")
                .on("mouseover", function(event, d) {
                    tooltip
                        .style("opacity", 1)
                        .html(`<strong>Popularity:</strong> ${d.Popularity}<br><strong>Song:</strong> ${d.Song}`) // Customize based on your data
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 20}px`);
                    d3.select(this).attr("fill", "orange");
                })
                .on("mousemove", function(event) {
                    tooltip
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 20}px`);
                })
                .on("mouseout", function() {
                    tooltip.style("opacity", 0);
                    d3.select(this).attr("fill", "steelblue");
                });
        }

        // Initial rendering of the bar chart with transition
        svg.selectAll("rect")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", (d, i) => i * (barWidth + xSpacing))
            .attr("y", 400) // Start bars from the bottom
            .attr("width", barWidth)
            .attr("height", 0) // Start with zero height
            .attr("fill", "steelblue")
            .transition()
            .duration(800) // Duration of the animation in milliseconds
            .attr("y", d => 400 - parseInt(d.Popularity)) // Replace with the actual column name
            .attr("height", d => parseInt(d.Popularity));

        // Render bars with hover and tooltip
        updateBars(data);

        // Filtering function for button click
        document.getElementById("filterButton").addEventListener("click", function() {
            // Filter data to show only songs with popularity > 50
            const filteredData = data.filter(d => parseInt(d.Popularity) > 50);
            updateBars(filteredData); // Re-render bars with filtered data
        });
    }).catch(function(error) {
        console.error("Error loading the CSV file:", error);
    });
}
