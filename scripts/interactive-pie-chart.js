const w = 1000;
const h = 500;
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
        var filtered = data.filter(function(d) {
            // The only data we need are:
            //      - From Australia;
            //      - Total female and male;
            //      - Both head counts and % of head counts;
            return (d.Country == "Australia" && 
                    (d.Variable == "PAGGFEMM" || d.Variable == "PAGGHOMM"));
        });

        var filtered_counts = filtered.filter(function(d) {     // Male physicians and female physicians of Australia (in number)
            return d.Unit == "PERSMYNB";
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
                value: d.Value
            })
        })

        console.log(organized_data[2021]["Australia"]);

        var svg = d3.select("#vis2")
                    .append("svg")
                    .attr("width", w)
                    .attr("height", h);

        const slider_input = document.querySelector("#slider_year");
        var current_year = slider_input.value;

        // Pie_Chart(filtered_counts, w, h, current_year);

        console.log ("Currently the slider is at " + current_year); // Debugging
        
        slider_input.addEventListener("input", (event) => {         // Event listener for changes of the slider in HTML
            current_year = event.target.value;
            console.log ("Now it's at " + current_year);            // Debugging
        })
    });
}

function Pie_Chart(svg_width, svg_height, year) {

    // Setting up variables and dataset to use
    // var dataset = ;
    var outer_radius = Math.min(svg_width, svg_height) / 2;
    var pie = d3.pie();
}
window.onload = init;
