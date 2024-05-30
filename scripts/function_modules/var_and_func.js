const w_pie = 400;
const h_pie = 400;
const w_chart = 600;
const h_chart = 400;

function returnAgeGroup(variable) {
    var age_code = variable.slice(-3);
    if (age_code == "U35") return "Under 35 years old";
    if (age_code == "344") return "35 - 44 years old";
    if (age_code == "454") return "45 - 54 years old";
    if (age_code == "564") return "55 - 64 years old";
    if (age_code == "65O") return "65 - 74 years old";
}

function returnGender(variable) {
    var gender_code = variable.slice(0, 5);
    if (gender_code == "PAGGT") return "Total";
    if (gender_code == "PAGGF") return "Female";
    if (gender_code == "PAGGM") return "Male";
}

export { w_pie, h_pie, w_chart, h_chart, returnAgeGroup, returnGender };