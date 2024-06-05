// Function to determine age group based on the Variable Code
function returnAgeGroup(variable) {
    var age_code = variable.slice(-3);
    if (age_code == "U35") return "Under 35";
    if (age_code == "344") return "35 - 44";
    if (age_code == "454") return "45 - 54";
    if (age_code == "564") return "55 - 64";
    if (age_code == "65O") return "65 - 74";
}

// Function to determine gender based on the Variable Code
function returnGender(variable) {
    var gender_code = variable.slice(0, 5);
    if (gender_code == "PAGGT") return "Total";
    if (gender_code == "PAGGF") return "Female";
    if (gender_code == "PAGGM" || gender_code == "PAGGH") return "Male";
}

// Pie chart constants
const w_pie = 400;
const h_pie = 400;
const outer_radius_max = w_pie/2;
const outer_radius = outer_radius_max * 0.9;

// Pie chart global variables
var dataTotals;
var structuredDataTotals = {};

// Bar chart constants
const w_chart = 600;
const h_chart = 400;
const margin_top = 20;
const margin_right = 55;
const margin_bottom = 35;
const margin_left = 0;

// Bar chart global variables
var dataByAge;

function init() {
    // Reading the data
    d3.csv("./data/HEALTH_REAC_04052024140125591.csv", function(d) {
        return {
            Variable: d.VAR,        // Data code (total female, total male, etc.)
            Country: d.Country,     // Country
            Unit: d.UNIT,           // Unit code (% or head counts)
            Year: d.Year,           // Year
            Value: d.Value          // Estimated value
        };
    }).then(function(data) {
        var filtered_totals = data.filter(function(d) {                         // Filter a basic dataset for pie chart
            return (d.Country == "Australia" &&                                 // From Australia
                    (d.Variable == "PAGGFEMM" || d.Variable == "PAGGHOMM") &&   // Total female and male
                    d.Unit == "PERSMYNB");                                      // Head counts
        });

        var filtered_age_group = data.filter(function(d) {                      // Filter a basic dataset for bar chart (age group specific)
            return (d.Country == "Australia" && (                               // From Australia
                returnAgeGroup(d.Variable) == "Under 35" ||                     // Correct age groups
                returnAgeGroup(d.Variable) == "35 - 44" ||
                returnAgeGroup(d.Variable) == "45 - 54" ||
                returnAgeGroup(d.Variable) == "55 - 64" ||
                returnAgeGroup(d.Variable) == "65 - 74"
            ) && (
                returnGender(d.Variable) == "Male" || returnGender(d.Variable) == "Female"  // Only Male/Female data, not both
            ) && ( d.Unit == "PERSMYNB"))                                                   // Only head counts
        });

        dataTotals = filtered_totals.map(d => ({        // Re-map the data to keep relevant attributes only
            Year: d.Year,
            Value: d.Value,
            Gender: returnGender(d.Variable)
        }));

        dataByAge = filtered_age_group.map(d => ({      // Same as above
            Group: returnAgeGroup(d.Variable),
            Gender: returnGender(d.Variable),
            Year: d.Year,
            Value: +d.Value
        }));

        // console.log(dataTotals);
        console.log(dataByAge);
        console.log(d3.max(dataByAge, d => d.Value));

        dataTotals.forEach(function(d) {                   // Example: If you need data from 2020, only female, in Australia
            if (!structuredDataTotals[d.Year]) {
                structuredDataTotals[d.Year] = [];                    // Create new array if it doesn't exist
            }

            structuredDataTotals[d.Year].push({
                gender: d.Gender,
                value: +d.Value                                 // Ensure the value is a number
            });
        });

        console.log(structuredDataTotals[2021]);         // Log for testing

        var svg = d3.select("#visualisation").append("svg")
                    .attr("viewBox", "0 0 400 400")                 // Use viewBox for a scalable visualisation that resize with the window size
                    .attr("id", "svg_pie_chart");                   // Set id for arranging purposes in CSS
        
        var svg2 = d3.select("#visualisation").append("svg")
                    .attr("viewBox", "0 0 600 400")                 // Same as above
                    .attr("id", "svg_bar_chart");                   // Same as above

        const slider_input = document.querySelector("#slider_year");
        var current_year = slider_input.value;

        console.log ("Currently the slider is at " + current_year);
        Pie_Chart(svg, w_pie, h_pie, current_year);
        var Combine_Chart = Bar_Chart(svg2);
        Combine_Chart.update(current_year);
        
        slider_input.addEventListener("input", (event) => {     // Event listener for changes of the slider in HTML
            current_year = event.target.value;
            console.log ("Now it's at " + current_year);        // Log for testing
            Update_Pie(svg, w_pie, h_pie, current_year);
            Combine_Chart.update(current_year);
        });
    });
}

// Most of the code came from 7.2. D3 Pie Chart
function Pie_Chart(svg, svg_width, svg_height, year) {
    var dataset = structuredDataTotals[year];
    console.log(dataset);                               // Log for testing

    var pie = d3.pie()
                .value(function(d) { return d.value; });
    var arc = d3.arc()
                .outerRadius(outer_radius)
                .innerRadius(0);

    var color = d3.scaleOrdinal()                       // Create a color scheme for visualization
        .domain(["Female", "Male"])
        .range(["#0072B2", "#E69F00"]);

    var arcs = svg.selectAll("g.arc")
                    .data(pie(dataset))
                    .enter()
                    .append("g")
                    .attr("class", "arc")
                    .attr("transform", "translate("+(svg_width/2)+","+(svg_height/2)+")"); 

    arcs.append("path")
        .attr("fill", function(d, i) {
            return color(i);                            // Pick a color from the created scheme
        })
        .attr("d", function(d, i) {
            return arc(d, i);                           // Generate path string for each path
        });

    arcs.append("text")
        .text(function(d, i) {
            return dataset[i].gender;                   // Adding value text to the pie piece(s)
        })
        .attr("transform", function(d) {
            return "translate("+(arc.centroid(d))+")";  // Centroid is used to find the middle of a irregular shape
        });

    // Tooltip
    var tooltip = d3.select("#tooltip");

    arcs.on('mouseover', function(event, d) {
        let expand = d3.arc()
                        .innerRadius(0)
                        .outerRadius(outer_radius_max);
        d3.select(this)
            .select("path")
            .transition()
            .duration(250)
            .attr('d', expand);

        tooltip.transition()                            // Transition to show the value using tooltip from HTML
            .duration(250)
            .style("opacity", .9);
        tooltip.html("Value: " + d.data.value)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY) + "px");
    })

    arcs.on('mouseout', function(d) {
        d3.select(this)
            .select("path")
            .transition()
            .duration(250)
            .attr('d', arc);

        tooltip.transition()
            .duration(250)
            .style("opacity", 0);
    })
}

function Update_Pie(svg, svg_width, svg_height, year) {
    // Setting up variables and dataset to use
    var dataset = structuredDataTotals[year];
    console.log(dataset);

    var pie = d3.pie()
                .value(function(d) { return d.value; });
    var arc = d3.arc()
                .outerRadius(outer_radius)
                .innerRadius(0);

    var color = d3.scaleOrdinal()       // Color scheme for the visualization
        .domain(["Female", "Male"])
        .range(["#0072B2", "#E69F00"]);

    // Update existing arcs
    var arcs = svg.selectAll("g.arc")
                    .data(pie(dataset));

    arcs.select("path")
        .transition()
        .duration(250)
        .attrTween("d", function(d) {
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                return arc(interpolate(t));
            };
        });

    arcs.select("text")
        .transition()
        .duration(250)
        .attr("transform", function(d) {
            return "translate("+(arc.centroid(d))+")";  // Update text position
        })
        .text(function(d, i) {
            return dataset[i].gender;                   // Update text value
        });

    // Add new arcs
    var new_arcs = arcs.enter()
                        .append("g")
                        .attr("class", "arc")
                        .attr("transform", "translate("+(svg_width/2)+","+(svg_height/2)+")");

    new_arcs.append("path")
        .attr("fill", function(d, i) {
            return color(i);                            // Pick a color from the chosen scheme
        })
        .attr("d", arc)
        .each(function(d) { this._current = d; });      // Store the initial angles

    new_arcs.append("text")
        .attr("transform", function(d) {
            return "translate("+(arc.centroid(d))+")";  // Centroid is used to find the middle of an irregular shape
        })
        .text(function(d, i) {
            return dataset[i].gender;                   // Adding value text to the pie piece(s)
        });

    // Remove old arcs
    arcs.exit().remove();

    // Tooltip
    var tooltip = d3.select("#tooltip");

    arcs.on('mouseover', function(event, d) {
        let expand = d3.arc()
                        .innerRadius(0)
                        .outerRadius(outer_radius_max);
        d3.select(this)
            .select("path")
            .transition()
            .duration(250)
            .attr('d', expand);

        tooltip.transition()
            .duration(250)
            .style("opacity", .9);
        tooltip.html("Value: " + d.data.value)
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY) + "px");
    })

    arcs.on('mouseout', function(d) {
        d3.select(this)
            .select("path")
            .transition()
            .duration(250)
            .attr('d', arc);

        tooltip.transition()
            .duration(250)
            .style("opacity", 0);
    })
}

function Bar_Chart(svg) {
    var color = d3.scaleOrdinal()
        .domain(["Female", "Male"])
        .range(["#0072B2", "#E69F00"]);

    // Define the main x scale for age groups
    var xScale = d3.scaleBand()
        .domain(["Under 35", "35 - 44", "45 - 54", "55 - 64", "65 - 74"])
        .range([margin_left, w_chart - margin_right])
        .padding([0.1]);

    // Define a sub x scale for genders within each age group
    var xSubgroup = d3.scaleBand()
        .domain(["Male", "Female"])
        .range([0, xScale.bandwidth()])
        .padding([0.04]);

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(dataByAge, d => d.Value)])
        .range([h_chart - margin_bottom, margin_top]);

    // Add the X axis
    svg.append("g")
        .attr("transform", `translate(0,${h_chart - margin_bottom})`)
        .call(d3.axisBottom(xScale))
        .call(g => g.append("text")
            .attr("x", w_chart - margin_right)
            .attr("y", margin_bottom - 4)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text("Age Groups"));

    // Add the Y axis
    svg.append("g")
        .attr("transform", `translate(${w_chart - margin_right},0)`)
        .call(d3.axisRight(yScale)
            .ticks(14))
        .call(g => g.select(".domain").remove())
        .call(g => g.append("text")
            .attr("x", margin_right - 15)
            .attr("y", 10)
            .attr("fill", "black")
            .attr("text-anchor", "end")
            .text("Physicians"));

    var group = svg.append("g");
    let bars = group.selectAll("rect");                 // Create a variable to handle all the bars in the chart
    let labels = group.selectAll("text.bar-label");     // Create a variable for text elements

    var legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${margin_left + 20}, 20)`);

    // Color square for describing which color is for which gender
    legend.selectAll("rect")
        .data(color.domain())
        .enter()
        .append("rect")
        .attr("x", w_chart - margin_right - 110)
        .attr("y", (d, i) => i * 20)
        .attr("width", 16)
        .attr("height", 16)
        .style("fill", color);

    // Text description for each 
    legend.selectAll("text")
        .data(color.domain())
        .enter()
        .append("text")
        .attr("x", w_chart - margin_right - 90)
        .attr("y", (d, i) => i * 20 + 9)
        .attr("font-size", "13px")
        .attr("dy", ".35em")
        .text(d => d);

    // Credit goes to Mike Bostock, "Icelandic population by age, 1841 - 2019", 2023
    // https://observablehq.com/@d3/icelandic-population-by-age-1841-2019?intent=fork
    // return Object.assign() is useful for modularity purposes, and the ability to update charts easily.
    return Object.assign(svg.node(), {
        update(Year) {
            const chart_transition = svg.transition()
                .ease(d3.easeLinear)
                .duration(250);

            // Bind filtered data to the bars, each is identified as Gender:Group
            bars = bars
                .data(dataByAge.filter(d => d.Year === Year), d => `${d.Gender}:${d.Group}`)
                .join(
                    enter => enter.append("rect")
                        .attr("fill", d => color(d.Gender))                     // Choose the correct color
                        .attr("x", d => xScale(d.Group) + xSubgroup(d.Gender))  // X-position based on age group and gender
                        .attr("y", d => yScale(0))                              // Y-position initialized at the bottom (0) 
                        .attr("width", xSubgroup.bandwidth())                   // Width of the bars
                        .attr("height", 0),                                     // Height initialized at 0 for animation later on
                    update => update,
                    exit => exit.call(bars => bars.transition(chart_transition).remove()
                        .attr("y", yScale(0))
                        .attr("height", 0))
                );

            bars.transition(chart_transition)                                   // Transition animation
                .attr("x", d => xScale(d.Group) + xSubgroup(d.Gender))          // Set x-position
                .attr("y", d => yScale(d.Value))                                // Set the y-position
                .attr("width", xSubgroup.bandwidth())                           // Width
                .attr("height", d => yScale(0) - yScale(d.Value));              // Height

            // Labels are created for each bars, for the exact value (head counts)
            // Same process as bars above
            labels = labels
                .data(dataByAge.filter(d => d.Year === Year), d => `${d.Gender}:${d.Group}`)
                .join(
                    enter => enter.append("text")
                        .attr("class", "bar-label")
                        .attr("text-anchor", "middle")
                        .attr("x", d => xScale(d.Group) + xSubgroup(d.Gender) + xSubgroup.bandwidth() / 2)
                        .attr("y", d => yScale(d.Value) - 5)
                        .text(d => d.Value)
                        .attr("font-size", "12px"),
                    update => update,
                    exit => exit.call(labels => labels.transition(chart_transition).remove())
                );

            labels.transition(chart_transition)
                .attr("x", d => xScale(d.Group) + xSubgroup(d.Gender) + xSubgroup.bandwidth() / 2)
                .attr("y", d => yScale(d.Value) - 5)
                .text(d => d.Value);

            group.transition(chart_transition)
                .attr("transform", `translate(0,0)`);
        },
        scales: { color }
    });
}


window.onload = init;
