// Global variable to store the selected metric for visualization
let selectedMetric = "streams"; // Set default metric to "streams"

const formattedPoints = points.map(point => point.map(p => p.toFixed(3)).join(", "));

// Function to update visualizations based on the selected metric
function update(selectedVar) {
    selectedMetric = selectedVar;  // Update the selected metric with the new value

    // Load the CSV data, automatically handling types with d3.autoType
    d3.csv("data/spoty.csv", d3.autoType).then(function (data) {
        
        // Sort the data based on the selected metric in descending order
        const topTracks = data.sort((a, b) => b[selectedMetric] - a[selectedMetric]);
        
        // Dynamically calculate max value for selected metric and update colorScale
        const maxMetricValue = d3.max(topTracks, d => d[selectedMetric]);
        const colorScale = d3.scaleLinear()
            .domain([0, maxMetricValue])
            .range(["#cce5ff", "#003366"]); // Light to dark blue gradient

        // Call functions to update each of the visualizations with the sorted data
        updateBarChart1(topTracks, colorScale);  // Bar Chart 1 will show streams
        updateBarChart2(topTracks, colorScale);  // Bar Chart 2 will show Speechiness, BPM, and Positivity
        updateBubbleChart(topTracks, colorScale); // Bubble chart updates based on the sorted data
    }).catch(function (error) {
        // Handle any errors during the loading or parsing of the CSV file
        console.error("Error loading or parsing CSV file:", error);
    });
}

// Initial Load Function
function onPageLoaded() {
        // Load the CSV data and prepare the initial visualizations
    d3.csv("data/spoty.csv", d3.autoType).then(function (data) {
        console.log("Loaded Data:", data); // Log the loaded data for debugging
        
        // Slice top 30 tracks sorted by streams
        const topTracks = data.sort((a, b) => b.streams - a.streams).slice(0, 30);

        // Initialize and update visualizations with the top 30 tracks
        createBubbleChart(topTracks); // Create the bubble chart
        createFilterOptions(data);    // Create dropdown filter options
        createBarChart1(topTracks);  // Create Bar Chart 1 showing streams
        createBarChart2(topTracks);  // Create Bar Chart 2 showing speechiness, BPM, and positivity
        createMetricSelector();     // Create the metric selector (dropdown) for user to choose the metric
    
        }).catch(function (error) {
        // Handle any errors during the loading or parsing of the CSV file
        console.error("Error loading or parsing CSV file:", error);
        });
    }


// Global color scale (same for both charts)
    const colorScale = d3.scaleLinear()
    .domain([0, 10000000000]) // Set the domain for your data range (for streams in this case)
    .range(["#cce5ff", "#003366"]); // Set the color gradient from light to dark blue




    // Function to create the bubble chart
    function createBubbleChart(data) {
    const svgWidth = 800, svgHeight = 600; // Define the size of the SVG container

    // Create the SVG element and append it to the bubble chart container
    const svg = d3.select("#bubbleChart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Update the bubble chart with the loaded data
    updateBubbleChart(data);
    
}

// Function to create filters for the data
function createFilterOptions(data) {
    d3.select("#filters").remove(); // Remove existing filters if any

    // Get a list of unique artists for the filter dropdown
    const uniqueArtists = Array.from(new Set(data.map(d => d.artist_name)));

    // Create a wrapper for the filters
    const filtersWrapper = d3.select("#bubbleChart")
        .insert("div", ":first-child") // Insert above the bubble chart
        .attr("id", "filters")
        .style("margin-bottom", "20px")
        .style("display", "flex")
        .style("justify-content", "center")
        .style("align-items", "center")
        .style("gap", "20px");

    // Create the artist filter dropdown
    const artistFilterDiv = filtersWrapper.append("div")
        .style("text-align", "center");

    artistFilterDiv.append("label")
        .text("Filter by Artist: ") // Label for the dropdown
        .style("margin-right", "10px")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("color", "#ffffff");

    artistFilterDiv.append("select") // Dropdown for selecting artists
        .attr("id", "artistFilter")
        .style("font-size", "16px")
        .style("padding", "5px 10px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("background-color", "#f5f5f5")
        .style("color", "#333")
        .on("change", function () {
            const selectedArtist = this.value; // Get the selected artist from the dropdown
            
                const filteredData = data.filter(d => d.artist_name === selectedArtist);
                updateBubbleChart(filteredData); // Update the bubble chart with filtered data
            
        })
        .selectAll("option")
        .data(["- Select an Artist -", ...uniqueArtists]) // unique artists
        .enter()
        .append("option")
        .text(d => d); // Set the text for each option to the artist name
}

// Function to update the bubble chart
function updateBubbleChart(data) {
    const svgWidth = 800, svgHeight = 600; // Define the size of the SVG container

    const svg = d3.select("#bubbleChart svg");

    const maxStreams = d3.max(data, d => d[selectedMetric]); // Get the maximum value of the selected metric (e.g., streams)

    // Create a radius scale based on the selected metric (e.g., streams)
    const radiusScale = d3.scaleSqrt()
        .domain([0, maxStreams]) // Set the domain to the minimum and maximum streams
        .range([25, 52]); // Set the range for the radius of the bubbles

    
    // Create a color scale based on the selected metric (e.g., streams)
     const colorScale = d3.scaleLinear()
        .domain([0, maxStreams]) // Set the domain based on the min and max of the selected metric
        .range(["#cce5ff", "#003366"]); // Set the color gradient from light to dark blue Color, range for Top 30 songs

        // Set up a force simulation to position the bubbles
    const simulation = d3.forceSimulation(data)
        .force("x", d3.forceX(svgWidth / 2).strength(0.07)) // Apply force on the x-axis to center the bubbles
        .force("y", d3.forceY(svgHeight / 2).strength(0.07)) // Apply force on the y-axis to center the bubbles
        .force("collision", d3.forceCollide(d => radiusScale(d[selectedMetric]) + 2)); // Ensure bubbles do not overlap

    // Bind the data to the bubbles and create the bubble groups
    const bubbles = svg.selectAll(".bubble-group").data(data);

    const bubbleGroup = bubbles.enter()
        .append("g")
        .attr("class", "bubble-group")
        .on("mouseover", function (event, d) {
            // Display a tooltip on hover over a bubble
            const tooltip = d3.select(".tooltip");
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`<strong>Artist:</strong> ${d.artist_name}<br><strong>Song:</strong> ${d.track_name}<br><strong>${selectedMetric}:</strong> ${d[selectedMetric].toLocaleString()}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function () {
            // Hide the tooltip when mouse moves away from the bubble
            d3.select(".tooltip").transition().duration(500).style("opacity", 0);
        });

     // Add circle elements for each bubble
    bubbleGroup
        .append("circle")
        .attr("class", "bubble")
        .merge(bubbles.select("circle"))
        .on("click", function (event, d) {
        // Set the color of the bubble when clicked and update bar charts
            d.color = colorScale(d[selectedMetric]);
            updateBarChartFromBubble(d);
        })
        .transition()
        .duration(1000)
        .attr("r", d => radiusScale(d[selectedMetric]))  // Set the radius based on the metric value
        .attr("cx", d => d.x)  // Set the x position
        .attr("cy", d => d.y)  // Set the y position
        .attr("fill", d => colorScale(d[selectedMetric])); // Set the color based on the metric value
        
        // Add text labels inside the bubbles
    bubbleGroup
        .append("text")
        .attr("class", "bubble-label")
        .merge(bubbles.select("text"))
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("pointer-events", "none")
        .text(d => d.artist_name); // Display artist name inside the bubble

    bubbles.exit().remove(); // Remove any bubbles that are no longer in the data

    // Update the bubble positions during the simulation
    simulation.nodes(data).on("tick", () => {
        svg.selectAll(".bubble")
            .attr("cx", d => d.x) // Update the x position during the simulation
            .attr("cy", d => d.y); // Update the y position during the simulation

        svg.selectAll(".bubble-label")
            .attr("x", d => d.x)
            .attr("y", d => d.y + 4); // Position the text labels
    });



    
     //  Add the color legend for the bubbles(Create it only once)

    const legendWidth = 400;
    const legendHeight = 20;

    // Create the legend container outside the bubble chart, below it
    const legend = d3.select("#bubbleChart")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", 50) ;// Set fixed height for the legend container,,Create the legend container below the bubble chart

    // Add the rectangle to represent the gradient
    const gradient = legend.append("defs")
        .append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

    // Define the color stops for the gradient
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#daecff"); // Lightest color

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#003366"); // Darkest color

    // Add the gradient rectangle to the legend
    legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#gradient)");

    // Add text to describe the color scale for the legend
    legend.append("text")
        .attr("x", 0)
        .attr("y", legendHeight + 15) // Position text below the gradient rectangle
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .style("fill", "#ffffff")
        .style("font-size", "12px")
        .text("Least streams");

    legend.append("text")
        .attr("x", legendWidth)
        .attr("y", legendHeight + 15)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .style("fill", "#ffffff")
        .style("font-size", "12px")
        .text("Most streams");
    
    
    
}



document.addEventListener("DOMContentLoaded", () => {
    // Wait for the DOM content to be fully loaded before executing the code
    d3.csv("data/spoty.csv", d3.autoType).then(data => {
        // Load the CSV data and automatically convert data types
        createFilterOptions(data); // Create the artist filter options
        createMetricSelector(); // Create the metric selector
        createBubbleChart(data); // Create the bubble chart
        createBarChart1(data); // Create Bar Chart 1 for streams
        createBarChart2(data); // Create Bar Chart 2 for speechiness, BPM, positivity
    }).catch(err => console.error("Error loading data:", err));
    // Catch and log any error that occurs while loading the CSV data
});



// Function to create Bar Chart 1 (Streams for selected song)
function createBarChart1(topTracks) {
    // Set up width and height for the SVG canvas
    const svgWidth = 500, svgHeight = 450;
    // Set up margins for the bar chart
    const margin = { top: 20, right: 20, bottom: 50, left: 80 };
    // Calculate the width and height of the chart area, accounting for margins
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    // Select the SVG element for the bar chart or create it if it doesn't exist
    const svg = d3.select("#barChart1 svg").empty() ? d3.select("#barChart1").append("svg").attr("width", svgWidth).attr("height", svgHeight)
        : d3.select("#barChart1 svg");

    // Create a group element (g) to contain the chart elements and apply margins
    const chartGroup = svg.select("g").empty()  ? svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`)
        : svg.select("g");
    

     // Create an x-scale for the track names (using a band scale)
    const x = d3.scaleBand()
    .domain(topTracks.map(d => d.track_name)) // Map over the tracks for the x-axis labels
    .range([0, width]) // Set the range of the x-axis based on the chart width
    .padding(0.4); // Add space between the bars


    // Create a y-scale for the streams (using a linear scale)
 //   const y = d3.scaleLinear()
  //      .domain([0, topTracks.streams]) // Set the y-axis range from 0 to the max stream count
  //      .range([height, 0]); // Invert the y-axis, as SVG coordinates start from top-left

    const y = d3.scaleLinear()
        .domain([0, d3.max(topTracks, d => d[selectedMetric])]) // Ensure dynamic metric scaling
        .range([height, 0]);
    
    // Clear any previous chart content before creating a new one
    chartGroup.selectAll("*").remove();
    
    

    // Append the x-axis to the chart
    chartGroup.append("g")
        .attr("transform", `translate(0, ${height})`) // Position the x-axis at the bottom of the chart
        .call(d3.axisBottom(x)); // Call the axis for the x-scale

    // Append the y-axis to the chart
    chartGroup.append("g")
        .call(d3.axisLeft(y)); // Call the axis for the y-scale

    
    // Create the bars using rectangles
    chartGroup.selectAll(".bar")
        .data([topTracks]) // Bind the data to the bars
        .enter()
        .append("rect") // Append rectangle elements for the bars
        .attr("class", "bar") // Set the class for styling
        .attr("x", d => x(d.track_name)) // Set the x position based on the track name
        .attr("y", d => y(d.streams)) // Set the y position based on the streams
        .attr("width", x.bandwidth()) // Set the width of each bar using the scale bandwidth
        .attr("height", d => height - y(d.streams)) // Set the height of the bar (difference from max height)
       // .attr("fill", d => colorScale(d.streams)); // Fill the bar color based on the color scale
        .attr("fill", d => colorScale(d[selectedMetric])); 
        
    // Add labels to the bars
    chartGroup.selectAll(".bar-label")
        .data([topTracks])
        .enter()
        .append("text") // Add text labels
        .attr("x", d => x(d.track_name) + x.bandwidth() / 2) // Center the label horizontally
        .attr("y", d => y(d.streams) - 10) // Position the label slightly above the top of the bar
        .attr("text-anchor", "middle") // Center the text horizontally
        //.text(d => d.streams.toLocaleString()); // Format the stream number and add it as the label
        .text(d => d[selectedMetric].toLocaleString());
}

// Add tooltips to Bar Chart 1
chartGroup.selectAll(".bar")
    .on("mouseover", function (event, d) {
        const tooltip = d3.select(".tooltip");
        tooltip.transition().duration(200).style("opacity", 1);
        tooltip.html(`Streams: ${d.streams.toLocaleString()}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`);
    })
    .on("mouseout", function () {
        d3.select(".tooltip").transition().duration(500).style("opacity", 0);
    });

function updateBarChart1(songData, artistColor) {
    // Set up dimensions and margins for the updated bar chart
    const svgWidth = 500, svgHeight = 450;
    const margin = { top: 20, right: 20, bottom: 50, left: 70 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    // Select the existing SVG element for Bar Chart 1 or create it if it doesn't exist
    const svg = d3.select("#barChart1 svg").empty() ? d3.select("#barChart1").append("svg").attr("width", svgWidth).attr("height", svgHeight)
        : d3.select("#barChart1 svg");

    // Create a group element (g) to contain the chart elements
    const chartGroup = svg.select("g").empty() ? svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`)
        : svg.select("g");
    

     // Create the data for the single bar based on the selected song
    const data = [{ name: songData.track_name, value: songData.streams }];
    
    // Define the x-scale based on the song name
    const x = d3.scaleBand()
        .domain(data.map(d => d.name)) // Use the track name for the x-axis
        .range([0, width]) // Set the range of the x-axis based on the chart width
        .padding(0.4); // Add space between bars
    
        // Define the y-scale based on the streams
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])  // Set the y-axis range from 0 to the maximum streams
        .range([height, 0]); // Invert the y-axis for SVG

    
    // Clear previous chart
    chartGroup.selectAll("*").remove();

        // Add x and y axes
    chartGroup.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x)); // Call the x-axis

    chartGroup.append("g")
        .call(d3.axisLeft(y)); // Call the y-axis

    
    // Create the bar using a rectangle
    chartGroup.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect") // Append a rectangle (bar) for the track
        .attr("class", "bar") // Set the class for styling
        .attr("x", d => x(d.name)) // Position the bar based on the song name
        .attr("y", d => y(d.value)) // Position the bar based on the stream count
        .attr("width", x.bandwidth()) // Set the width of the bar
        .attr("height", d => height - y(d.value)) // Set the height of the bar
       // .attr("fill", d => colorScale(d.streams));
       // .attr("fill", d => d.color);
        .attr("fill", d => songData.color);
       // .attr("fill", d => colorScale(d[selectedMetric]));
    // Add labels
    chartGroup.selectAll(".bar-label")
        .data(data)
        .enter()
        .append("text") // Add text labels
        .attr("x", d => x(d.name) + x.bandwidth() / 2) // Center the label horizontally
        .attr("y", d => y(d.value) - 8) // Position the label above the bar
        .attr("text-anchor", "middle") // Center the text
        .text(d => d.value.toLocaleString()); // Format the stream count as a label
}

// updateBarChart1(songData.track_name, songData.streams);


// Function to create Bar Chart 2 (Speechiness, BPM, Positivity)
function createBarChart2(topTracks) {
    // Set up width and height for the SVG canvas
    const svgWidth = 500, svgHeight = 400;
    // Define margins for the chart
    const margin = { top: 20, right: 20, bottom: 50, left: 70 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    // Define the metrics to be displayed in the chart (speechiness, BPM, positivity)
    const metrics = [
        { name: "Word Count in %", value: topTracks.speechiness },
        { name: "BPM", value: topTracks.bpm },
        { name: "Positivity in %", value: topTracks.valence }
    ];

    // Select or create the SVG element
    const svg = d3.select("#barChart2 svg").empty()  ? d3.select("#barChart2").append("svg").attr("width", svgWidth).attr("height", svgHeight)
        : d3.select("#barChart2 svg");

    // Create a group element to contain the chart elements
    const chartGroup = svg.select("g").empty() ? svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`)
        : svg.select("g");

    // Set up the x-scale for the metrics
    const x = d3.scaleBand()
        .domain(metrics.map(d => d.name)) // Use the metric names for the x-axis
        .range([0, width]) // Set the x-axis range
        .padding(0.4); // Add space between the bars

    // Set up the y-scale based on the values
    const y = d3.scaleLinear()
        .domain([0, 180]) // Set the y-axis range from 0 to 180
        .range([height, 0]); // Invert the y-axis for SVG positioning
    

    // Clear previous chart
    chartGroup.selectAll("*").remove();

    // Add X and Y axis
    chartGroup.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    chartGroup.append("g")
        .call(d3.axisLeft(y));

        // Add bars representing each metric
    chartGroup.selectAll(".bar")
        .data(metrics)
        .enter()
        .append("rect") // Create a rectangle for each metric
        .attr("class", "bar") // Set the class for styling
        .attr("x", d => x(d.name)) // Position the bar on the x-axis based on the metric name
        .attr("y", d => y(d.value)) // Position the bar on the y-axis based on the metric value
        .attr("width", x.bandwidth()) // Set the width of the bar
        .attr("height", d => height - y(d.value)) // Set the height based on the value
      //  .attr("fill", d => colorScale(d.value)); // Set the color of the bar
        .attr("fill", d => colorScale(d[selectedMetric]));
    // Add labels
    chartGroup.selectAll(".bar-label")
        .data(metrics)
        .enter()
        .append("text") // Add text labels
        .attr("x", d => x(d.name) + x.bandwidth() / 2) // Position the label centered horizontally above each bar
        .attr("y", d => y(d.value) - 8) // Position the label just above the top of the bar
        .attr("text-anchor", "middle") // Center the text
        .style("font-size", "12px")  // Set font size for the label
        .text(d => d.value.toFixed(2)); // Display the metric value as a label, rounded to 2 decimal places
}


function updateBarChart2(songData) {
    const svgWidth = 500, svgHeight = 400;
    const margin = { top: 20, right: 20, bottom: 50, left: 70 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const metrics = [
        { name: "Word Count in %", value: songData.speechiness },  //Amount of spoken words in the song
        { name: "BPM", value: songData.bpm },  //Beats per minute, a measure of song tempo
        { name: "Positivity in %", value: songData.valence } //Positivity of the song's musical content
    ];

    // Select or create the SVG element
    const svg = d3.select("#barChart2 svg").empty()  ? d3.select("#barChart2").append("svg").attr("width", svgWidth).attr("height", svgHeight)
        : d3.select("#barChart2 svg");

    const chartGroup = svg.select("g").empty() ? svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`)
        : svg.select("g");

    // Scale setup
    const x = d3.scaleBand()
        .domain(metrics.map(d => d.name))
        .range([0, width])
        .padding(0.4);

    const y = d3.scaleLinear()
        .domain([0, 180]) // Fixed range as per your requirements
        .range([height, 0]);

    // Clear previous chart
    chartGroup.selectAll("*").remove();

    // Add X and Y axis
    chartGroup.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x));

    chartGroup.append("g")
        .call(d3.axisLeft(y));

    // Add bars
    chartGroup.selectAll(".bar")
        .data(metrics)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.name))
        .attr("y", d => y(d.value))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.value))
     //   .attr("fill", d => colorScale(d.value));
        //.attr("fill", d => colorScale(d[selectedMetric]));
        .attr("fill", d => songData.color);
    // Add labels
    chartGroup.selectAll(".bar-label")
        .data(metrics)
        .enter()
        .append("text")
        .attr("x", d => x(d.name) + x.bandwidth() / 2)
        .attr("y", d => y(d.value) - 8)
        .attr("text-anchor", "middle")
        .text(d => d.value.toFixed(2));
}


// Function to update visualizations based on the selected artist or song
//function update(selectedTrack, artistColor) {
  //  updateBarChart1(selectedTrack, artistColor);
  //  updateBarChart2(selectedTrack);
//}

function updateBarChartFromBubble(songData) {
    // Update Bar Chart 1 (Streams) for the selected song
    updateBarChart1(songData);

    // Update Bar Chart 2 (Speechiness, BPM, Positivity) for the selected song
    updateBarChart2(songData);
}



// Ensure the function runs once the DOM is fully loaded
document.addEventListener("DOMContentLoaded", onPageLoaded);


