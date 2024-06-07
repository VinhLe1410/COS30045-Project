//function changing data input from long to wide format
function longToWide(dataset) {
    //let country code be the key 
    //let repetitive variables in VAR be the attributes of the new array, map with Value that respective to the country and the attribute
    var longToWideData = d3.rollup(
        dataset, 
        v => Object.fromEntries(v.map(d => [d.VAR, d.Value])),
        d => d.COU
    );

    //reformat the wide dataset from [COU: <Country code>, {VAR1: Value1, VAR2: Value2, ...}]
    var result = Array.from(longToWideData, ([key, value]) => ({COU: key, ...value}));
    
    //test result
    // console.log(result);

    return result;
}

function radialStackedBarplot(dataset, keysDomain) {
    //reset svg
    d3.select("svg").remove();
    
    //width and height of svg
    var w = 900;
    var h = 900;
    var innerRadius = 125;
    var outerRadius = Math.min(w, h) / 2;

    //set up the stack
    // list out manually all the keys for stacking to debug
    var stacks = d3.stack() //generate stacks
                    .keys(keysDomain); 
                    //specify the categories of interest

    //set up the svg canvas
    var svg = d3.select("#visualisation")
                .append("svg")
                .attr("id", "svg_radial_bar_plot")
                .attr("viewBox", "0 0 900 900");

    //set up the scales
    var xScale = d3.scaleBand()
                    .domain(dataset.map(function(d) {return d.COU;}))
                    .range([0, 2 * Math.PI])
                    .paddingInner(0.05)
                    .align(0);
    
    var yScale = d3.scaleRadial()
                    .domain([0, d3.max(dataset, function(d) {
                        if (typeof d.PAGGTOPY != 'undefined') return d.PAGGTOPY;
                        if (typeof d.PAGGHOMM != 'undefined') return d.PAGGHOMM;
                        if (typeof d.PAGGFEMM != 'undefined') return d.PAGGFEMM;
                    })])
                    .range([innerRadius, outerRadius]);

    //color scheme to attach to the arcs group
    var color = d3.scaleOrdinal()
                    .domain(keysDomain)
                    .range(["#E69F00","#56B4E9","#009E73","#0072B2","#D55E00","#CC79A7"]) ; //d3 native color scheme (no. 10)

    //set up the arcs
    var groups = svg.append("g")
                    .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

    var arc = d3.arc()
                .innerRadius(function(d) { return yScale(d[0]); })
                .outerRadius(function(d) { return yScale(d[1]); })
                .startAngle(function(d) { return xScale(d.data.COU); })
                .endAngle(function(d) { return xScale(d.data.COU) + xScale.bandwidth(); })
                .padAngle(0.01)
                .padRadius(innerRadius);
    
    //append each arc into group of arcs
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
            .attr("d", arc);

    //if hover on a bar, do the function(event, d) which change fill color and display tooltip 
    //showing the exact number of physicians respect to the preferred country and age group
    groups.selectAll("path")
            .on("mouseover", function(event, d) {
                //change fill color
                d3.select(this)
                    .attr("original-fill", d3.select(this).attr('fill')) //save original hue
                    .attr("fill", "#F0E442") //show color when it is hovered
                    .transition()
                    .duration(1000);

                //get x and y polar position of the arcs to see where the mouse hovered on
                var [xPosInRadial, yPosInRadial] = arc.centroid(d); 

                //show exact number of physicians regarding preferred country and age group with background box
                tooltip = svg.append("rect")
                                .attr("id", "tooltipBox")
                                .attr("x", xPosInRadial + outerRadius + 10)
                                .attr("y", yPosInRadial + outerRadius + 10)
                                .attr("width", "130px")
                                .attr("height", "13px")
                                .attr("fill", "white")
                                .attr("opacity", 0.9);

                tooltipText = svg.append("text")
                                    .attr("id", "tooltipText")
                                    .attr("x", xPosInRadial + outerRadius + 15)
                                    .attr("y", yPosInRadial + outerRadius + 20)
                                    .text("Physicians: " + (d[1] - d[0]))
                                    .attr("font-size", "13px")
                                    .attr("font-family", "Gill Sans, Lucida Sans, sans-serif");
            })
            //when the bar is not hovered anymore
            .on("mouseout", function() {
                //change back to the original color
                d3.select(this)
                    .attr("fill", d3.select(this).attr('original-fill'))
                    .transition()
                    .duration(1000);

                //remove the tooltips
                svg.select("#tooltipBox").remove();
                svg.select("#tooltipText").remove();

            })
    
    // group of labels indicating countries at xAxis
    var label = groups.append("g")
                    .selectAll("g")
                    .data(dataset)
                    .enter()
                    .append("g")
                    .attr("text-anchor", "middle")
                    .attr("transform", function(d) {
                        return "rotate(" + ((xScale(d.COU) + xScale.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + innerRadius + ",0)"; 
                    });
    
    //line connect the bar to the Country code
    label.append("line")
            .attr("x2", -5)
            .attr("stroke", "#000")
            .attr("stroke-width", 1);
    
    //display the country code text
    label.append("text")
            .attr("transform", function(d) {
                return (xScale(d.COU) + xScale.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)"; 
            })
            .text(function(d) { return d.COU; })
            .attr("font-size", "8px")
            .attr("font-family", "Gill Sans, Lucida Sans, sans-serif");

    
    //y Axis settings and height of each bars with ticks
    var yAxis = groups.append("g")
                        .attr("text-anchor", "middle");
                        
    var yTicks = yAxis.selectAll("g")
                .data(yScale.ticks(5).slice(1))
                .enter()
                .append("g");

    //cỉcle playing as line responsible for measuring - ticks
    yTicks.append("circle")
            .attr("r", yScale)
            .attr("stroke", "#808080")
            .attr("fill", "none")
            .attr("stroke-width", 0.5);

    //text showing the value (number of people) at each tick
    yTicks.append("text")
            .attr("y", function(d) {return -yScale(d);})
            .attr("dy", "0.35em")
            .text(yScale.tickFormat(5, "s")) //the value at each tick
            .attr("font-size", "12px")
            .attr("font-family", "Gill Sans, Lucida Sans, sans-serif"); 

    // legend group
    var legend = groups.append("g")
                        .selectAll("g")
                        .data(keysDomain)
                        .enter()
                        .append("g")
                        .attr("transform", function (d, i) {
                            return "translate(-60," + (i - 2.5) * 20 + ")"; 
                        });

    //boxes of colors of each age group
    legend.append("rect")
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", function (d, i) { return color(i);});
    
    //labeling the category respect to the color it indicates to
    legend.append("text")
            .attr("x", 24)
            .attr("y", 15)
            .text(function (d) { 
                if (d == "PAGGTU35" || d == "PAGGFU35" || d == "PAGGMU35") return "Under 35 years old";
                if (d == "PAGGT344" || d == "PAGGF344" || d == "PAGGM344") return "35 - 44 years old";
                if (d == "PAGGT454" || d == "PAGGF454" || d == "PAGGM454") return "45 - 54 years old";
                if (d == "PAGGT564" || d == "PAGGF564" || d == "PAGGM564") return "55 - 64 years old";
                if (d == "PAGGT65O" || d == "PAGGF65O" || d == "PAGGM65O") return "65 - 74 years old";
            })
            .attr("font-size", "12px")
            .attr("font-family", "Gill Sans, Lucida Sans, sans-serif");
}


d3.csv("./data/HEALTH_REAC_04052024140125591.csv", function(d) {
    return {
        VAR: d.VAR,             // Data code (total female, total male, etc.)
        COU: d.COU,             // Country code
        Country: d.Country,     // Country
        Variable: d.Variable,   // Full Description of data
        UNIT: d.UNIT,           // Unit code (% or head counts)
        Year: +d.Year,           // Year
        Value: +d.Value,         // Estimated value
    };
}).then(function(data) {
    //when click on total button
    d3.select("#total")
        .on("click", function() {
            //filter raw data
            var filteredDataTotal = data.filter(function(d) {
                return (d.UNIT == "PERSMYNB" && d.Year == 2021 && (d.VAR == "PAGGTOPY" || d.VAR == "PAGGTU35" || d.VAR == "PAGGT344" || d.VAR == "PAGGT454" || d.VAR == "PAGGT564" || d.VAR == "PAGGT65O"));
            });
            
            //data reshape from long to wide
            var wideArrayTotal = longToWide(filteredDataTotal);
            
            //filter data with missing attributes
            var processedDataTotal = wideArrayTotal.filter(function(d) {
                return typeof d.PAGGTU35 != 'undefined' && typeof d.PAGGT344 != 'undefined' && typeof d.PAGGT454 != 'undefined' && typeof d.PAGGT564 != 'undefined' && typeof d.PAGGT65O != 'undefined';
            });

            //supposed attributes of the data
            var stacksKeyTotal = ["PAGGTU35", "PAGGT344", "PAGGT454", "PAGGT564", "PAGGT65O"];

            //test data processed
            // console.log(processedDataTotal);

            radialStackedBarplot(processedDataTotal, stacksKeyTotal);
        });

    //when click on female button
    d3.select("#female")
        .on("click", function() {
            //filter raw data
            var filteredDataFemale = data.filter(function(d) {
                return (d.UNIT == "PERSMYNB" && d.Year == 2021 && (d.VAR == "PAGGFEMM" || d.VAR == "PAGGFU35" || d.VAR == "PAGGF344" || d.VAR == "PAGGF454" || d.VAR == "PAGGF564" || d.VAR == "PAGGF65O"));
            });
            //test data filtered
            // console.log(filteredDataFemale);

            //data reshape from long to wide
            var wideArrayFemale = longToWide(filteredDataFemale);

            //filter data with missing attributes
            var processedDataFemale = wideArrayFemale.filter(function(d) {
                return typeof d.PAGGFU35 != 'undefined' && typeof d.PAGGF344 != 'undefined' && typeof d.PAGGF454 != 'undefined' && typeof d.PAGGF564 != 'undefined' && typeof d.PAGGF65O != 'undefined';
            });

            //supposed attributes of the data
            var stacksKeyFemale = ["PAGGFU35", "PAGGF344", "PAGGF454", "PAGGF564", "PAGGF65O"];

            //test data processed
            // console.log(processedDataFemale);

            radialStackedBarplot(processedDataFemale, stacksKeyFemale);
        });

    //when click on male button
    d3.select("#male")
        .on("click", function() {
            //filter raw data
            var filteredDataMale = data.filter(function(d) {
                return (d.UNIT == "PERSMYNB" && d.Year == 2021 && (d.VAR == "PAGGHOMM" || d.VAR == "PAGGMU35" || d.VAR == "PAGGM344" || d.VAR == "PAGGM454" || d.VAR == "PAGGM564" || d.VAR == "PAGGM65O"));
            });
            
            //data reshape from long to wide
            var wideArrayMale = longToWide(filteredDataMale);

            //filter data with missing attributes
            var processedDataMale = wideArrayMale.filter(function(d) {
                return typeof d.PAGGMU35 != 'undefined' && typeof d.PAGGM344 != 'undefined' && typeof d.PAGGM454 != 'undefined' && typeof d.PAGGM564 != 'undefined' && typeof d.PAGGM65O != 'undefined';
            });
            
            //supposed attributes of the data
            var stacksKeyMale = ["PAGGMU35", "PAGGM344", "PAGGM454", "PAGGM564", "PAGGM65O"];

            //test data processed
            // console.log(processedDataMale);
            
            radialStackedBarplot(processedDataMale, stacksKeyMale);
        });
    document.getElementById("total").click();
});

