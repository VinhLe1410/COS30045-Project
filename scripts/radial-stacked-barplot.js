function radialStackedBarplot(dataset) {
//width and height of svg
    var w = 700;
    var h = 700;
    var innerRadius = 125;
    // var outerRadius = 250;
    var outerRadius = Math.min(w, h) / 2.2;

//set up the stack
    // list out manually all the keys for stacking to debug
    var stacks = d3.stack() //generate stacks
                    .keys(
                        ["PAGGTU35", "PAGGT344", "PAGGT344", "PAGGT454", "PAGGT564", "PAGGT65O"]
                    ); 
                    //specify the categories of interest

//set up the svg canvas
    var svg = d3.select("#vis1")
                .append("svg")
                .attr("width", w)
                .attr("height", h);

//set up the scales
    var xScale = d3.scaleBand()
                    .domain(dataset.map(function(d) {return d.COU;}))
                    .range([0, 2 * Math.PI])
                    .paddingInner(0.05);
                    // .align(0);
    
    var yScale = d3.scaleRadial()
                    .domain([0, d3.max(dataset, function(d) {
                        return d.PAGGTOPY;
                    })])
                    .range([innerRadius, outerRadius]);

//color scheme to attach to the arcs group
    var color = d3.scaleOrdinal(d3.schemeCategory10)
                    .domain(
                        ["PAGGTU35", "PAGGT344", "PAGGT454", "PAGGT564", "PAGGT65O"]
                    ) ; //d3 native color scheme (no. 10)
    
//set up the arcs
    // debugging
    // var groups = svg.selectAll("g")
    //                 .data(stacks(dataset))
    //                 .enter()
    //                 .append("g")
    //                 .style("fill", function(d, i) {
    //                     return color(i);
    //                 })
    //                 .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");
    var groups = svg.append("g")
                    .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

    //from here (line 45 - 101): taken from d3 js library examples
    groups.append("g")
            .selectAll("g")
            .data(stacks(dataset))
            .enter()
            .append("g")
            .style("fill", function(d, i) {
                return color(i);
            })
            .selectAll("path")
            .data(function(d) {return d;})
            .enter()
            .append("path")
            .attr("d", d3.arc()
                        .innerRadius(function(d) { return yScale(d[0]); })
                        .outerRadius(function(d) { return yScale(d[1]); })
                        .startAngle(function(d) { return xScale(d.data.COU); })
                        .endAngle(function(d) { return xScale(d.data.COU) + xScale.bandwidth(); })
                        .padAngle(0.01)
                        .padRadius(innerRadius)
            );
    
// label indicating countries at xAxis
    var label = groups.append("g")
                    .selectAll("g")
                    .data(dataset)
                    .enter()
                    .append("g")
                    .attr("text-anchor", "middle")
                    .attr("transform", function(d) {
                        return "rotate(" + ((xScale(d.COU) + xScale.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + innerRadius + ",0)"; 
                    });
    
    label.append("line")
            .attr("x2", -5)
            .attr("stroke", "#000")
            .attr("stroke-width", 1);
    
    label.append("text")
            .attr("transform", function(d) {
                return (xScale(d.COU) + xScale.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)"; 
            })
            .text(function(d) { return d.COU; })
            .attr("font-size", "8px");

//y Axis settings and height of each bars
    var yAxis = groups.append("g")
                        .attr("text-anchor", "middle");
                        
    var yTicks = yAxis.selectAll("g")
                .data(yScale.ticks(5).slice(1))
                .enter()
                .append("g");

    //cỉcle playing as line responsible for measuring - ticks
    // debugging
    yTicks.append("circle")
            .attr("r", yScale)
            // .attr("dy", "0.35em")
            .attr("stroke", "#000")
            .attr("fill", "none")
            .attr("stroke-width", 0.5);

    yTicks.append("text")
            .attr("y", function(d) {return -yScale(d);})
            .attr("dy", "0.35em")
            .text(yScale.tickFormat(5, "s"))
            .attr("font-size", "12px"); //the value at each tick

    yAxis.append("text")
            .attr("y", function(d) { return -yScale(yScale.ticks(5).pop()); })
            .attr("dy", "-1.5em")
            .text("Population")
            .attr("font-size", "14px");

// legend
    var legend = groups.append("g")
                        .selectAll("g")
                        .data(["PAGGTU35", "PAGGT344", "PAGGT344", "PAGGT454", "PAGGT564", "PAGGT65O"])
                        .enter()
                        .append("g")
                        .attr("transform", function (d, i) {
                            return "translate(-75," + (i - 2.75) * 20 + ")"; 
                        });

    legend.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", function (d, i) { return color(i);});
    
    legend.append("text")
            .attr("x", 24)
            .attr("y", 9)
            .text(function (d) { 
                if (d == "PAGGTU35") return "Under 35 years old";
                if (d == "PAGGT344") return "35 - 44 years old";
                if (d == "PAGGT454") return "45 - 54 years old";
                if (d == "PAGGT564") return "55 - 64 years old";
                if (d == "PAGGT65O") return "65 - 74 years old";
            })
}

function init() {
    d3.csv("../data/HEALTH_REAC_04052024140125591.csv", function(d) {
        return {
            VAR: d.VAR,             // Data code (total female, total male, etc.)
            COU: d.COU,             // Country code
            Country: d.Country,     // Country
            Variable: d.Variable,   // Full Description of data
            UNIT: d.UNIT,           // Unit code (% or head counts)
            Year: d.Year,           // Year
            Value: d.Value,         // Estimated value
        };
    }).then(function(data) {
        // Loading the data from 2020
        // Each bar will ressemble 1 country, and for each stacked element it will be for each category

        var filteredData = data.filter(function(d) {
            // The only data we need are:
            //      - Total physicians by age range from all countries
            //      - in the latest years (2020 - 2022 depending on the country's data)
            //      - take value with the unit as head counts;
            return (d.UNIT == "PERSMYNB" && d.Year == 2020 && (d.VAR == "PAGGTOPY" || d.VAR == "PAGGTU35" || d.VAR == "PAGGT344" || d.VAR == "PAGGT454" || d.VAR == "PAGGT564" || d.VAR == "PAGGT65O"));
        });
        console.table(filteredData);

        var longToWideData = d3.rollup(
            filteredData, 
            v => Object.fromEntries(v.map(d => [d.VAR, d.Value])),
            d => d.COU
        );

        var wideArray = Array.from(longToWideData, ([key, value]) => ({COU: key, ...value}))

        console.log(wideArray);

        var processedData = wideArray.filter(function(d) {
            return typeof d.PAGGTU35 != 'undefined' && typeof d.PAGGT344 != 'undefined' && typeof d.PAGGT454 != 'undefined' && typeof d.PAGGT564 != 'undefined' && typeof d.PAGGT65O != 'undefined';
        });

        radialStackedBarplot(processedData);

    });
}

window.onload = init;