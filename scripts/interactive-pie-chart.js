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
    }).then(function(data) {        // START OF "THEN"
        var filtered = data.filter(function(d) {   // START OF FILTER
            return (d.COU == "AUS" && (d.VAR == "PAGGFEMM" || d.VAR == "PAGGHOMM"))
        });                         // END OF FILTER
        console.table(filtered);
    });                             // END OF "THEN"
}
window.onload = init; //call function init() whenever the window is onload
