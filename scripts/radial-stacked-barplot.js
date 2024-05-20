function radialStackedBarplot(dataset) {
//width and height of svg
    var w = 500;
    var h = 500;
    var innerRadius = 70;
    var outerRadius = 150;
    // var outerRadius = Math.min(w, h) / 2;

//set up the stack
    // list out manually all the keys for stacking to debug
    var stacks = d3.stack() //generate stacks
                    .keys(["PAGGTOPY", "PAGGTU35", "PAGGT344", "PAGGT344", "PAGGT454", "PAGGT564", "PAGGT65O"]); 
                    //specify the categories of interest

//set up the svg canvas
    var svg = d3.select("#vis1")
                .append("svg")
                .attr("width", w)
                .attr("height", h);

//set up the scales
    var xScale = d3.scaleBand()
                    .domain(dataset.map(function(d) {return d.Country;}))
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
                    .domain(["PAGGTOPY", "PAGGTU35", "PAGGT344", "PAGGT344", "PAGGT454", "PAGGT564", "PAGGT65O"]) ; //d3 native color scheme (no. 10)
    
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
                        .startAngle(function(d) { return xScale(d.data.Country); })
                        .endAngle(function(d) { return xScale(d.data.Country) + xScale.bandwidth(); })
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
                        return "rotate(" + ((xScale(d.Country) + xScale.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + innerRadius + ",0)"; 
                    });
    label.append("text")
        .attr("transform", function(d) {
            return (xScale(d.Country) + xScale.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)"; 
        })
        .text(function(d) { return d.Country; });

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
            .attr("y", function(d) {return -yScale(d);})
            .attr("dy", "0.35em")
            .attr("fill", "none")
            .attr("stroke", "#fff")
            .attr("stroke-width", 5)
            .text(yScale.tickFormat(5, "s"));

    yTicks.append("text")
            .attr("y", function(d) {return -yScale(d);})
            .attr("dy", "0.35em")
            .text(yScale.tickFormat(5, "s")); //the value at each tick

    // yAxis.append("text")
    //         .attr("y", function(d) { return -yScale(yScale.ticks(5).pop()); })
    //         .attr("dy", "-1em")
    //         .text("Population");
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

        //long to wide dataset: need to change to the form
        //debugging
        // [
            //  {country: d.Country, PAGGTOPY: d.Value, PAGGTU35: d.Value, PAGGT344: d.Value, PAGGT454: d.Value, ... ncl chia theo VAR},
        //     {...}, ...
        // ]
        // could remove Year as all items have the same year
        // in progress right now...
        // var output = d3.nest()
        //                 .key(function(d) { return d["COU"] })
        //                 .rollup(function(d) {
        //                     return d.reduce(function(prev, curr) {
        //                         prev["COU"] = curr["COU"];
        //                         prev[curr["VAR"]] = curr["VAR"];
        //                         return prev;
        //                     }, {});
        //                 })
        //                 .entries(filteredData)
        //                 .map(function(d) {
        //                     return d.value;
        //                 });

        var testDataset = [
            {Country: 'Australia', PAGGTOPY: 100260, PAGGTU35: 25165, PAGGT344: 28087, PAGGT454: 21667, PAGGT564: 15994, PAGGT65O: 7643 },
            {Country: 'Austria', PAGGTOPY: 47422, PAGGTU35: 9166, PAGGT344: 12364, PAGGT454: 10614, PAGGT564: 12211, PAGGT65O: 2619 },
            {Country: 'Belgium', PAGGTOPY: 37089, PAGGTU35: 4539, PAGGT344: 8063, PAGGT454: 8362, PAGGT564: 8696, PAGGT65O: 6131 },
            {Country: 'Canada', PAGGTOPY: 105504, PAGGTU35: 26409, PAGGT344: 24270, PAGGT454: 20524, PAGGT564: 19300, PAGGT65O: 10897 },
            {Country: 'Czechia', PAGGTOPY: 43810, PAGGTU35: 9963, PAGGT344: 9343, PAGGT454: 9184, PAGGT564: 8020, PAGGT65O: 5990 },
            {Country: 'Denmark', PAGGTOPY: 25522, PAGGTU35: 6221, PAGGT344: 6866, PAGGT454: 5163, PAGGT564: 4581, PAGGT65O: 2419 },
            {Country: 'Finland', PAGGTOPY: 19970, PAGGTU35: 5252, PAGGT344: 5610, PAGGT454: 4371, PAGGT564: 4167, PAGGT65O: 570 },
            {Country: 'France', PAGGTOPY: 214293, PAGGTU35: 34393, PAGGT344: 41243, PAGGT454: 40744, PAGGT564: 59562, PAGGT65O: 34177 },
        ];

        radialStackedBarplot(testDataset);

    });
}

window.onload = init;