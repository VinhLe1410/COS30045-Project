const w_pie = 400;
const h_pie = 400;
const w_chart = 600;
const h_chart = 400;

const outer_radius_max = w_pie/2;
const outer_radius = outer_radius_max * 0.9;

var organized_data = {};

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
        var filtered_counts = data.filter(function(d) {
            // The only data we need are:
            //      - From Australia;
            //      - Total female and male;
            //      - Both head counts and % of head counts;
            return (d.Country == "Australia" && 
                    (d.Variable == "PAGGFEMM" || d.Variable == "PAGGHOMM") &&
                    d.Unit == "PERSMYNB");
        });

        filtered_counts.forEach(function(d) {                   // Example: If you need data from 2020, only female, in Australia 
            var Gender;                                         // -> organized_data[2020]["Australia"]["Female"]
            if (d.Variable == "PAGGFEMM") { Gender = "Female";}
            else { Gender = "Male";}

            if (!organized_data[d.Year]) {
                organized_data[d.Year] = {};                    // Create new object if it doesn't exist
            }
            if (!organized_data[d.Year][d.Country]) {
                organized_data[d.Year][d.Country] = [];         // Create new object if it doesn't exist
            }

            organized_data[d.Year][d.Country].push({
                gender: Gender,
                value: +d.Value                                 // Ensure the value is a number
            });
        });

        // Testing
        console.log(organized_data[2021]["Australia"]);

        var svg = d3.select("#visualisation").append("svg")
                    .attr("viewBox", "0 0 400 400")
                    .attr("id", "svg_pie_chart");
                    // .attr("width", w_pie)
                    // .attr("height", h_pie);
        
        var svg2 = d3.select("#visualisation").append("svg")
                    .attr("viewBox", "0 0 600 400")
                    .attr("id", "svg_bar_chart");
                    // .attr("width", w_chart)
                    // .attr("height", h_chart);

        const slider_input = document.querySelector("#slider_year");
        var current_year = slider_input.value;

        console.log ("Currently the slider is at " + current_year); // Debugging
        Pie_Chart(svg, w_pie, h_pie, current_year);
        
        slider_input.addEventListener("input", (event) => {         // Event listener for changes of the slider in HTML
            current_year = event.target.value;
            console.log ("Now it's at " + current_year);            // Debugging
            Update_Pie(svg, w_pie, h_pie, current_year);
        });
    });
}

function Pie_Chart(svg, svg_width, svg_height, year) {
    var dataset = organized_data[year]["Australia"];
    console.log(dataset);

    var pie = d3.pie()
                .value(function(d) { return d.value; });
    var arc = d3.arc()
                .outerRadius(outer_radius)
                .innerRadius(0);

    var color = d3.scaleOrdinal(d3.schemeTableau10);

    var arcs = svg.selectAll("g.arc")
                    .data(pie(dataset))
                    .enter()
                    .append("g")
                    .attr("class", "arc")
                    .attr("transform", "translate("+(svg_width/2)+","+(svg_height/2)+")"); 

    arcs.append("path")
        .attr("fill", function(d, i) {
            return color(i);                            // Pick a color from the chosen scheme
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

    arcs.on('mouseover', function(d) {
        let expand = d3.arc()
                        .innerRadius(0)
                        .outerRadius(outer_radius_max);
        d3.select(this)
            .select("path")
            .transition()
            .duration(500)
            .attr('d', expand);
        
    })

    arcs.on('mouseout', function(d) {
        d3.select(this)
            .select("path")
            .transition()
            .duration(500)
            .attr('d', arc);
    })
}

function Update_Pie(svg, svg_width, svg_height, year) {
    // Setting up variables and dataset to use
    var dataset = organized_data[year]["Australia"];
    console.log(dataset);

    var pie = d3.pie()
                .value(function(d) { return d.value; });
    var arc = d3.arc()
                .outerRadius(outer_radius)
                .innerRadius(0);

    var color = d3.scaleOrdinal(d3.schemeTableau10);

    // Update existing arcs
    var arcs = svg.selectAll("g.arc")
                    .data(pie(dataset));

    arcs.select("path")
        .transition()
        .duration(500)
        .attrTween("d", function(d) {
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                return arc(interpolate(t));
            };
        });

    arcs.select("text")
        .transition()
        .duration(500)
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
}

window.onload = init;
