import { roundToClosestValue } from "../utils.js";

const AVAILABLE_TEMPS_F = [425, 475, 525, 575, 625, 675, 725, 775, 825, 875, 925, 975];
const AVAILABLE_TEMPS_C = [218, 246, 274, 302, 329, 357, 385, 413, 441, 469, 496, 524];

// Variables to store input values
let material = "";
let hydrocarbon = "";
let maximum_process_temperature = 0;
let h2s_concentration = 0;
let table = null;

/**
 * Function that handles the selection of the table based on the material
 * @param {string} material 
 * @returns {JSON} table
 */
async function get_table(material) {
    const tables = {
        table_2b42: '/static/formula_app/data/json/ht_h2s2_corrosion/table_2b42.json',
        table_2b43: '/static/formula_app/data/json/ht_h2s2_corrosion/table_2b43.json',
        table_2b44: '/static/formula_app/data/json/ht_h2s2_corrosion/table_2b44.json',
        table_2b45: '/static/formula_app/data/json/ht_h2s2_corrosion/table_2b45.json',
        table_2b46: '/static/formula_app/data/json/ht_h2s2_corrosion/table_2b46.json',
        table_2b47: '/static/formula_app/data/json/ht_h2s2_corrosion/table_2b47.json',
    }

    const materialToTable = {
        "carbon steel": tables.table_2b42,
        "1cr-0.2 mo": tables.table_2b42,
        "1cr-0.5 mo": tables.table_2b42,
        "1.25cr-0.5mo": tables.table_2b42,
        "2.25cr-1mo": tables.table_2b42,
        "3cr-1mo": tables.table_2b42,
        "5cr-0.5mo": tables.table_2b43,
        "7cr steel": tables.table_2b44,
        "9cr-1mo": tables.table_2b45,
        "12cr steel": tables.table_2b46,
        "304 stainless steel": tables.table_2b47,
        "304l stainless steel": tables.table_2b47,
        "316 stainless steel": tables.table_2b47,
        "316l stainless steel": tables.table_2b47,
        "321 stainless steel": tables.table_2b47,
        "347 stainless steel": tables.table_2b47,
    }

    const tablePath = materialToTable[material];

    if (!tablePath) {
        throw new Error(`Unknown material: ${material}`);
    }

    const response = await fetch(tablePath);
    if (!response.ok) {
        throw new Error(`Failed to load the table: ${response.status}`);
    }
    return await response.json();
}

/**
 * VALIDATES ALL INPUT VALUES AND RETURNS AN ARRAY OF ERROR MESSAGES
 * @returns {string[]}
 */
function validate_inputs() {
    const errors = [];
    if (!material || material === "") {
        errors.push("Material is required");
    }
    // Only validate hydrocarbon if it's not disabled
    const hydrocarbonInput = document.getElementById("hydrocarbon");
    if (!hydrocarbonInput.disabled && (!hydrocarbon || hydrocarbon === "")) {
        errors.push("Type of hydrocarbon is required");
    }
    if (!maximum_process_temperature || maximum_process_temperature === 0 || isNaN(maximum_process_temperature)) {
        errors.push("Maximum process temperature is required");
    }
    if (!h2s_concentration || h2s_concentration === 0 || isNaN(h2s_concentration)) {
        errors.push("H2S concentration is required");
    }
    return errors;
}

/**
 * Calculates the corrosion rate based on the given inputs
 * @param {Object} table - The table data from JSON
 * @param {string} measurement_unit - The measurement unit ("farenheit" or "celsius")
 * @param {number} maximum_process_temperature - The maximum process temperature
 * @param {number} h2s_concentration - The H2S concentration (mole %)
 * @param {string} hydrocarbon - The type of hydrocarbon ("naphtha" or "gas oil")
 * @returns {number} The corrosion rate
 */
function calculate_corrosion_rate(table, measurement_unit, maximum_process_temperature, h2s_concentration, hydrocarbon) {

    const isFahrenheit = measurement_unit === "farenheit";

    // Get the data based on the measurement unit
    const temperatureData = isFahrenheit
        ? table["temperature_in_f"]
        : table["temperature_in_c"];

    // Get the temperatures array
    const temperatures = temperatureData["temperatures"];

    // Round temperature to closest available value
    const availableTemps = isFahrenheit ? AVAILABLE_TEMPS_F : AVAILABLE_TEMPS_C;
    const roundedTemp = roundToClosestValue(availableTemps, maximum_process_temperature);

    // Find the index of the rounded temperature
    const tempIndex = temperatures.indexOf(roundedTemp);

    if (tempIndex === -1) {
        console.error("Temperature not found in table:", roundedTemp);
        return null;
    }

    // Find the H2S concentration key in the data
    // We need to search for it because parseFloat(1.0).toString() = "1" but the key might be "1.0"
    let h2sKey = null;
    Object.keys(temperatureData["data"]).forEach((key) => {
        if (parseFloat(key) === h2s_concentration) {
            h2sKey = key;
        }
    });

    if (!h2sKey) {
        console.error("H2S concentration not found:", h2s_concentration);
        return null;
    }

    // Get the data for this H2S concentration
    const h2sData = temperatureData["data"][h2sKey];

    // Check if h2sData is an array (for materials like 12Cr Steel and 300 series SS)
    // or an object with hydrocarbon types (for other materials)
    let corrosionRates;

    if (Array.isArray(h2sData)) {
        // For materials that don't require hydrocarbon type (12Cr, 300 series SS)
        corrosionRates = h2sData;
    } else {
        // For materials that require hydrocarbon type
        // Capitalize hydrocarbon type to match JSON keys ("Naphtha" or "Gas oil")
        const hydrocarbonKey = hydrocarbon === "naphtha" ? "Naphtha" : "Gas oil";

        // Get the corrosion rate array for this hydrocarbon type
        corrosionRates = h2sData[hydrocarbonKey];

        if (!corrosionRates) {
            console.error("Hydrocarbon type not found:", hydrocarbonKey);
            return null;
        }
    }

    // Get the corrosion rate at the temperature index
    const corrosionRate = corrosionRates[tempIndex];

    // Store the result in sessionStorage
    sessionStorage.setItem("corrosion_rate", corrosionRate);

    return corrosionRate;
}

/**
 * DISPLAY VALIDATION ERRORS TO THE USER
 * @param {string[]} errors - Array of error messages
 */
function display_errors(errors) {
    const errorContainer = document.getElementById("error-container");
    errorContainer.innerHTML = "";

    errors.forEach((error) => {
        const errorElement = document.createElement("p");
        errorElement.textContent = error;
        errorElement.classList.add("alert", "alert-error", "m-3", "text-white", "text-bold");
        errorContainer.appendChild(errorElement);
    });
}

export async function ht_h2sh2_corrosion_calc() {

    // Read table41_data from sessionStorage
    const table41 = sessionStorage.getItem("table4.1_data");
    const table41_data = JSON.parse(table41);

    // Pre-fill maximum process temperature with operating_temp from Table 4.1
    const tempInput = document.getElementById("maximum_process_temperature");
    if (table41_data && table41_data.operating_temp) {
        tempInput.value = table41_data.operating_temp;
        maximum_process_temperature = parseFloat(table41_data.operating_temp);
    }

    // Event listener for material selection
    document.getElementById("material").addEventListener("change", async function () {
        material = this.value;
        table = await get_table(material);

        // IF THE MATERIAL IS 12%CR STEEL OR 300 SERIES SS DISABLED THE TYPE OF HYDROCARBON INPUT
        switch (material) {
            case "12cr steel":
            case "304 stainless steel":
            case "304l stainless steel":
            case "316 stainless steel":
            case "316l stainless steel":
            case "321 stainless steel":
            case "347 stainless steel":
                document.getElementById("hydrocarbon").disabled = true;
                document.getElementById("hydrocarbon").value = ""; // Clear value when disabled
                hydrocarbon = "";
                break;
            default:
                document.getElementById("hydrocarbon").disabled = false;
                break;
        }
    });

    // Event listener for hydrocarbon selection
    document.getElementById("hydrocarbon").addEventListener("change", function () {
        hydrocarbon = this.value;
    });

    // Event listener for temperature input
    document.getElementById("maximum_process_temperature").addEventListener("input", function () {
        maximum_process_temperature = parseFloat(this.value);
    });

    // Event listener for H2S concentration selection
    document.getElementById("h2s_concentration").addEventListener("change", function () {
        h2s_concentration = parseFloat(this.value);
    });

    // Event listener for calculate button
    document.getElementById("calculate_corrosion_rate").addEventListener("click", async function () {
        // Validate inputs
        const errors = validate_inputs();

        if (errors.length > 0) {
            display_errors(errors);
            return;
        }

        // Clear any previous errors
        document.getElementById("error-container").innerHTML = "";

        // Calculate corrosion rate
        const corrosionRate = calculate_corrosion_rate(
            table,
            table41_data.measurement_unit,
            maximum_process_temperature,
            h2s_concentration,
            hydrocarbon
        );

        // Display the result
        if (corrosionRate !== null) {
            const resultElement = document.getElementById("corrosion_rate");
            const unit = table41_data.measurement_unit === "farenheit" ? "mpy" : "mm/y";
            resultElement.textContent = `Corrosion rate: ${corrosionRate} ${unit}`;
            resultElement.classList.remove("hidden");
        }
    });

}