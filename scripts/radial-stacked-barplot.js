function init() {
    d3.csv("../data/HEALTH_REAC_04052024140125591.csv", function(d) {
        return {
            VAR: d.VAR,             // Data code (total female, total male, etc.)
            COU: d.COU,             // Country code
            Country: d.Country,     // Country
            Variable: d.Variable,   // Full Description of data
            UNIT: d.UNIT,           // Unit code (% or head counts)
            Year: d.Year,           // Year
            Value: d.Value          // Estimated value
        };
    }).then(function(data) {
        // Loading the data from 2020 and "maybe" 2021
        // Each bar will ressemble 1 country, and for each stacked element it will be for each category

        var processedData = data.filter(function(d) {
            // The only data we need are:
            //      - Total physicians by age range from all countries
            //      - in the latest years (2020 - 2022 depending on the country's data)
            //      - take value with the unit as head counts;
            return (d.UNIT == "PERSMYNB" && d.Year >= 2020 && (d.VAR == "PAGGTOPY" || d.VAR == "PAGGTU35" || d.VAR == "PAGGT344" || d.VAR == "PAGGT454" || d.VAR == "PAGGT564" || d.VAR == "PAGGT65O"));
        });
        // console.table(processedData);
    });
}

window.onload = init;
