import { roundToClosestValue } from '../utils.js';

// Temperature constants (shared across all tables)
const AVAILABLE_TEMPS_F = [450, 500, 550, 600, 650, 700, 750];
const AVAILABLE_TEMPS_C = [232, 260, 288, 316, 343, 371, 399];

// global variable declarations 
let material = "";
let maximum_process_temperature = 0;
let sulfur_concentration = 0;
let tan = 0;
let velocity = 0;
let table = null;

// get the table4.1 to see the measurement unit
let table41 = sessionStorage.getItem("table4.1_data");
let table41_data = JSON.parse(table41);


/**
 * Maps a rounded temperature value to the correct JSON key format
 * Handles special cases like "<=450" for minimum and ">750" for maximum
 * 
 * @param {number} roundedTemp - The rounded temperature value
 * @param {number} originalTemp - The original input temperature (before rounding)
 * @param {boolean} isFahrenheit - Whether the temperature is in Fahrenheit
 * @returns {string} The temperature key to use in the JSON lookup
 */
function getTemperatureKey(roundedTemp, originalTemp, isFahrenheit) {
    const temps = isFahrenheit ? AVAILABLE_TEMPS_F : AVAILABLE_TEMPS_C;
    const minTemp = temps[0];
    const maxTemp = temps[temps.length - 1];

    // If original temperature is less than or equal to minimum, use <=min format
    if (originalTemp <= minTemp) return `<=${minTemp}`;

    // If original temperature is greater than maximum, use >max format
    if (originalTemp > maxTemp) return `>${maxTemp}`;

    // Otherwise, use the rounded temperature as a string
    return roundedTemp.toString();
}

/**
 * Populates the TAN select dropdown with unique TAN values from the table data
 * @param {Object} table - The table data
 */
function populate_tan_options(table) {
    const tanSelect = document.getElementById("tan");
    tanSelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    const tanValues = new Set();

    const tempData = table["temperature_in_f"] || table["temperature_in_c"];

    Object.values(tempData).forEach((value) => {
        Object.keys(value).forEach((key) => {
            tanValues.add(parseFloat(key));
        });
    });

    Array.from(tanValues)
        .sort((a, b) => a - b)
        .forEach((tanValue) => {
            const option = document.createElement("option");
            option.value = tanValue;
            option.textContent = tanValue;
            tanSelect.appendChild(option);
        });

    tanSelect.disabled = false;

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
    if (!maximum_process_temperature || maximum_process_temperature === 0 || isNaN(maximum_process_temperature)) {
        errors.push("Maximum process temperature is required");
    }
    if (!sulfur_concentration || sulfur_concentration === 0 || isNaN(sulfur_concentration)) {
        errors.push("Sulfur concentration is required");
    }
    if (!tan || tan === 0 || isNaN(tan)) {
        errors.push("TAN is required");
    }
    if (!velocity || velocity === 0 || isNaN(velocity)) {
        errors.push("Velocity is required");
    }
    return errors;
}

/**
 * DISPLAY VALIDATIONS ERRORS TO THE USER
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

/**
 * Function that gets the table based on the material selected and returns the table data
 * @param {string} material - The selected material name
 * @returns {Promise<Object>} table data
 */
async function get_tables(material) {
    const tables = {
        table2b32: '/static/formula_app/data/json/ht_sna_corrosion/table_2b32.JSON',
        table2b33: '/static/formula_app/data/json/ht_sna_corrosion/table_2b33.JSON',
        table2b34: '/static/formula_app/data/json/ht_sna_corrosion/table_2b34.JSON',
        table2b35: '/static/formula_app/data/json/ht_sna_corrosion/table_2b35.JSON',
        table2b36: '/static/formula_app/data/json/ht_sna_corrosion/table_2b36.JSON',
        table2b37: '/static/formula_app/data/json/ht_sna_corrosion/table_2b37.JSON',
        table2b38: '/static/formula_app/data/json/ht_sna_corrosion/table_2b38.JSON',
        table2b39: '/static/formula_app/data/json/ht_sna_corrosion/table_2b39.JSON',
        table2b310: '/static/formula_app/data/json/ht_sna_corrosion/table_2b310.JSON',
    }

    const materialToTable = {
        "carbon steel": tables.table2b32,
        "1Cr-0.2 Mo": tables.table2b33,
        "1Cr-0.5 Mo": tables.table2b33,
        "1.25Cr-0.5Mo": tables.table2b33,
        "2.25Cr-1Mo": tables.table2b33,
        "3Cr-1Mo": tables.table2b33,
        "5Cr-0.5Mo": tables.table2b34,
        "7Cr-1Mo": tables.table2b35,
        "9Cr-1Mo": tables.table2b36,
        "12 % Cr Steel": tables.table2b37,
        "Austenitic SS Without Mo": tables.table2b38,
        "316 SS with < 2.5 % Mo": tables.table2b39,
        "316 SS with >= 2.5 % Mo": tables.table2b310,
        "317 SS": tables.table2b310
    };

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
 * Calculates the corrosion rate based on the given inputs
 * @param {Object} table - The table data
 * @param {string} measurement_unit - The measurement unit ("farenheit" or "celsius")
 * @param {number} maximum_process_temperature - The maximum process temperature
 * @param {number} sulfur_concentration - The sulfur concentration
 * @param {number} tan - The TAN value
 * @param {number} velocity - The velocity
 * @returns {number} The corrosion rate
 */
function calculate_corrosion_rate(table, measurement_unit, maximum_process_temperature, sulfur_concentration, tan, velocity) {

    const isFahrenheit = measurement_unit === "farenheit";

    // get the data based on the measurement unit
    let measurement_unit_dict = isFahrenheit
        ? table["temperature_in_f"]
        : table["temperature_in_c"];

    // iterate through measurement_unit_dict to find the sulfur concentration dictionary
    let sulfur_dict = null;
    Object.keys(measurement_unit_dict).forEach((key) => {
        if (parseFloat(key) === sulfur_concentration) {
            sulfur_dict = measurement_unit_dict[key];
        }
    });

    if (!sulfur_dict) {
        console.error("Sulfur concentration not found:", sulfur_concentration);
        return null;
    }

    // iterate through sulfur_dict to find the TAN dictionary
    let tan_dict = null;
    Object.keys(sulfur_dict).forEach((key) => {
        if (parseFloat(key) === tan) {
            tan_dict = sulfur_dict[key];
        }
    });

    if (!tan_dict) {
        console.error("TAN value not found:", tan);
        return null;
    }

    // Round temperature to closest available value
    const availableTemps = isFahrenheit ? AVAILABLE_TEMPS_F : AVAILABLE_TEMPS_C;
    const roundedTemp = roundToClosestValue(availableTemps, maximum_process_temperature);

    // Get the correct key for the JSON (handles <=450 and >750 cases)
    // Pass both rounded and original temperature to determine the correct key
    const tempKey = getTemperatureKey(roundedTemp, maximum_process_temperature, isFahrenheit);

    // Get corrosion rate from table
    const corrosionRate = tan_dict[tempKey];

    // Apply velocity factor based on threshold
    const velocityThreshold = isFahrenheit ? 100 : 30.48;
    let finalCorrosionRate;
    let isHighVelocity = false;

    if (velocity < velocityThreshold) {
        // Use corrosion rate from tables
        finalCorrosionRate = corrosionRate;
    } else {
        // Multiply by 5 for high velocity
        finalCorrosionRate = corrosionRate * 5;
        isHighVelocity = true;
    }

    // Store both values in sessionStorage
    sessionStorage.setItem("corrosion_rate", finalCorrosionRate);
    sessionStorage.setItem("is_high_velocity", isHighVelocity);
    sessionStorage.setItem("velocity_threshold", velocityThreshold);
    sessionStorage.setItem("velocity_unit", isFahrenheit ? "ft/s" : "m/s");

    return finalCorrosionRate;

}

/**
 * Main function that orchestrates the corrosion calculation workflow
 */
export async function ht_sna_corrosion_calc() {


    // get material value
    document.getElementById("material").addEventListener("change", async (e) => {
        material = e.target.value;

        const tanSelect = document.getElementById("tan");
        tanSelect.innerHTML = '<option value="" disabled selected>Select one</option>';
        tanSelect.disabled = true;

        try {
            const materialTable = await get_tables(material);
            populate_tan_options(materialTable);
        } catch (error) {
            console.error(error);
            tanSelect.innerHTML = '<option value="" disabled selected>Error loading options</option>';
        }

    });

    // Button calculate corrosion rate listener to get the data in the inputs to operate with them
    document.getElementById("calculate_corrosion_rate").addEventListener("click", async () => {

        document.getElementById("error-container").innerHTML = "";

        material = document.getElementById("material").value;
        maximum_process_temperature = parseFloat(document.getElementById("maximum_process_temperature").value);
        sulfur_concentration = parseFloat(document.getElementById("sulfur_concentration").value);
        tan = parseFloat(document.getElementById("tan").value);
        velocity = parseFloat(document.getElementById("velocity").value);

        const errors = validate_inputs();
        if (errors.length > 0) {
            display_errors(errors);
            return;
        }

        // if all data is correct, get the table and calculate the corrosion rate
        try {
            table = await get_tables(material);
            const finalRate = calculate_corrosion_rate(table, table41_data.measurement_unit, maximum_process_temperature, sulfur_concentration, tan, velocity);

            // Get UI elements
            const corrosionRateElement = document.getElementById("corrosion_rate");
            const velocityMessageElement = document.getElementById("velocity_message");

            // Get stored values
            const isHighVelocity = sessionStorage.getItem("is_high_velocity") === "true";
            const velocityThreshold = sessionStorage.getItem("velocity_threshold");
            const velocityUnit = sessionStorage.getItem("velocity_unit");

            // Display corrosion rate
            corrosionRateElement.textContent = `Estimated Corrosion Rate: ${finalRate} mpy`;
            corrosionRateElement.classList.remove("hidden");

            // Display velocity message if applicable
            if (isHighVelocity) {
                velocityMessageElement.textContent = `⚠️ High velocity detected (${velocity} ${velocityUnit} ≥ ${velocityThreshold} ${velocityUnit}). Corrosion rate has been multiplied by 5.`;
                velocityMessageElement.classList.remove("hidden");
            } else {
                velocityMessageElement.classList.add("hidden");
            }

        } catch (error) {
            console.error("Error:", error);
        }
    });

}