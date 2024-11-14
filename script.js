// Function that runs when the page is loaded
// Called on page load, this function logs a message and triggers data visualization, 
// making it ideal for initializing visuals once the page is ready
function onPageLoaded() {
    console.log("Page loaded");
    loadAndVisualizeCSV();
}

// This function sets the CSV file path and initiates data loading, processing, and visualization, 
// making it suitable as long as csvFilePath correctly points to the CSV location.
function loadAndVisualizeCSV() {
    const csvFilePath = "data/spotify-2023--Cleaned-DAVI-Project.csv";

    
    // ******************************************************************
    // Set up custom delimiter for tab-separated values
    // d3.csv(csvFilePath, d3.autoType).then(function (data) {
    // console.log("Data loaded", data);
    // ******************************************************************

// This function creates an SVG element with specified width and height for the bar chart 
// inside the #chart div, providing an appropriate setup for a fixed-size chart area.
        const svgBar = d3.select("#chart")
            .append("svg")
            .attr("width", 800)
            .attr("height", 400);
    
// ******************************************************************
//    const barWidth = 40;
//    const xSpacing = 10;
// ******************************************************************
    

//This function sets up a tooltip element to display additional information on hover, enhancing interactivity.    
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    

// This function renders or updates the bar chart based on provided data, using data.join() to 
// dynamically add, update, or remove bars, with tooltips for interactivity and hover highlights.
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

// This function calls updateBars to render the initial bar chart, ensuring it displays immediately once the data loads
        updateBars(data);

// This function filters data by Popularity and updates the chart when the filterButton is clicked, 
// effectively handling interactivity; however, ensure filterButton exists in the HTML or consider adding a check for its presence.
        document.getElementById("filterButton").addEventListener("click", function () {
            const filteredData = data.filter(d => parseInt(d.Popularity) > 50);
            updateBars(filteredData);
        });
    
    const filterButton = document.getElementById("filterButton");
if (filterButton) {
    filterButton.addEventListener("click", function () {
        const filteredData = data.filter(d => parseInt(d.Popularity) > 50);
        updateBars(filteredData);
    });
} else {
    console.warn("Warning: 'filterButton' element not found in the HTML.");
}


// This function creates an SVG element for the bubble chart, providing an appropriate setup for 
// displaying it below or next to the bar chart.
        const svgBubble = d3.select("#chart")
            .append("svg")
            .attr("width", 800)
            .attr("height", 600);

//This function defines a square root scale to size each bubble based on the Streams value, ideal for 
//visualizing large variances by keeping bubble sizes manageable and visually proportional.
        const radiusScale = d3.scaleSqrt()
            .domain([0, d3.max(data, d => d.Streams)])
            .range([10, 50]);
    
    
// This function creates a tooltip to display information for each bubble, effectively enhancing interactivity in 
// the bubble chart.
        const bubbleTooltip = d3.select("body")
            .append("div")
            .attr("class", "bubble-tooltip")
            .style("opacity", 0);
    
    
// This function uses D3’s force simulation to position bubbles without overlap, providing a suitable method for 
// dynamic, clear arrangement.
        const simulation = d3.forceSimulation(data)
            .force("charge", d3.forceManyBody().strength(-30))
            .force("center", d3.forceCenter(400, 300))
            .force("collision", d3.forceCollide().radius(d => radiusScale(d.Streams) + 2))
            .on("tick", ticked);

// This function adds a circle for each data point and enables hover interactivity, effectively using mouseover, 
// mousemove, and mouseout events to display relevant tooltip data.
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
    
    
//This function adds a text label with the track name at each bubble’s center, effectively displaying names; for 
//long names, consider truncating or dynamically adjusting font size.
        const labels = svgBubble.selectAll("text")
            .data(data)
            .enter()
            .append("text")
             .text(d => truncateText(d["Track Name"], 10)) // Limit to 10 characters
            .attr("text-anchor", "middle")
            .attr("dy", 4)
            .attr("fill", "white")
            .style("font-size", d => `${Math.max(10, radiusScale(d.Streams) / 3)}px`); // Adjust font size
    
// Helper function to truncate text if too long
function truncateText(text, maxLength) {
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}



    
    
//This function updates each circle and label position according to simulation calculations, effectively keeping 
//bubbles and labels aligned throughout the simulation.
        function ticked() {
            circles
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);

            labels
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        }
    
// ******************************************************************
//   }).catch(function (error) {
//     console.error("Error loading the CSV file:", error);
//   });
// ******************************************************************

    
    
}


//This event listener ensures onPageLoaded runs only after the DOM is fully loaded, 
//effectively preventing premature execution.
document.addEventListener("DOMContentLoaded", onPageLoaded);
