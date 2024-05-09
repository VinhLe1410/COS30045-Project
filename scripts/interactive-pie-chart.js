function init() {
    //reading the data
    d3.csv("./data/HEALTH_REAC_04052024140125591.csv", function(d) {
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
        var filtered = data.filter(function(d) {
            // The only data we need are:
            //      - From Australia;
            //      - Total female and male;
            //      - Both head counts and % of head counts;
            return (d.COU == "AUS" && (d.VAR == "PAGGFEMM" || d.VAR == "PAGGHOMM"))
        });
        // console.table(filtered);

        // filtered_counts: Male physicians and female physicians of Australia (in number)
        // filtered_percentage: Male physicians and female physicians of Australia (in percentage)
        var filtered_counts = filtered.filter(function(d) {
            return d.UNIT == "PERSMYNB";
        });
        var filtered_percentage = filtered.filter(function(d) {
            return d.UNIT == "PHYTOTNB";
        });

        // oldest_year and latest_year are for the time slider
        var oldest_year = d3.min(filtered_counts, function(d){
            return d.Year;
        });
        var latest_year = d3.max(filtered_counts, function(d) {
            return d.Year;
        });

        // Console log for checking the data
        console.table(filtered_counts);
        console.log(oldest_year + " to " + latest_year);
    });
}
window.onload = init;
