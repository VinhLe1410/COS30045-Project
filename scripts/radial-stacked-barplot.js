function init() {
    //reading the data
    d3.csv("./data/HEALTH_REAC_04052024140125591.csv").then(function(data) {
        dataset = data; //name the dataset
    });
}
window.onload = init; //call function init() whenever the window is onload
