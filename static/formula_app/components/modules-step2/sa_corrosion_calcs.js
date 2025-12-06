import { roundToClosestValue } from '../utils.js';

/**
 * Function that gets the table based on the material selected and returns the table data
 * Special case: For carbon steel, the table selection depends on the temperature unit from table 4.1
 * - If fahrenheit: use table_2b52.JSON
 * - If celsius: use table_2b52M.JSON
 * @param {string} material - The selected material name
 * @returns {Promise<Object>} table data
 */
async function get_table(material) {
    const tables = {
        table_2b52: '/static/formula_app/data/json/sa_corrosion/table_2b52.JSON',
        table_2b52M: '/static/formula_app/data/json/sa_corrosion/table_2b52M.JSON',
        table_2b53: '/static/formula_app/data/json/sa_corrosion/table_2b53.JSON',
        table_2b54: '/static/formula_app/data/json/sa_corrosion/table_2b54.JSON',
        table_2b55: '/static/formula_app/data/json/sa_corrosion/table_2b55.JSON',
        table_2b56: '/static/formula_app/data/json/sa_corrosion/table_2b56.JSON',
        table_2b57: '/static/formula_app/data/json/sa_corrosion/table_2b57.JSON',
    }

    let table_path;

    // Special handling for carbon steel based on temperature unit
    if (material === "carbon steel") {
        // Get the measurement unit from table 4.1
        const table41Data = sessionStorage.getItem("table4.1_data");
        if (table41Data) {
            const table41 = JSON.parse(table41Data);
            // If celsius, use table_2b52M, otherwise use table_2b52
            table_path = table41.measurement_unit === "celsius" ? tables.table_2b52M : tables.table_2b52;
        } else {
            // Default to fahrenheit table if table 4.1 data is not available
            table_path = tables.table_2b52;
        }
    } else {
        // For other materials, use the standard mapping
        const materialToTable = {
            "304 ss": tables.table_2b53,
            "316 ss": tables.table_2b54,
            "alloy 20": tables.table_2b55,
            "alloy c-276": tables.table_2b56,
            "alloy b-2": tables.table_2b57,
        }

        table_path = materialToTable[material];
        if (!table_path) {
            throw new Error(`Unknown material: ${material}`);
        }
    }

    const response = await fetch(table_path);
    if (!response.ok) {
        throw new Error(`Failed to load the table: ${response.status}`);
    }
    const tableData = await response.json();

    return tableData;
}

/**
 * VALIDATES ALL INPUT VALUES AND RETURNS AN ARRAY OF ERROR MESSAGES
 * @param {string} material - The selected material
 * @param {string} acidConcentration - The selected acid concentration
 * @param {string} maximumTemperature - The maximum temperature value
 * @param {string} velocityOfAcid - The selected velocity of acid
 * @returns {string[]}
 */
function validate_inputs(material, acidConcentration, maximumTemperature, velocityOfAcid) {
    const errors = [];

    if (!material || material === "") {
        errors.push("Material of construction is required");
    }

    if (!acidConcentration || acidConcentration === "") {
        errors.push("Acid concentration is required");
    }

    if (!maximumTemperature || maximumTemperature === "") {
        errors.push("Maximum temperature is required");
    }

    if (!velocityOfAcid || velocityOfAcid === "") {
        errors.push("Velocity of acid is required");
    }

    return errors;
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

/**
 * Calculates the corrosion rate based on the given inputs
 * Handles both carbon steel format and other materials format
 * Uses EXACT values from dropdowns (no rounding needed)
 * @param {Object} tableData - The table data
 * @param {string} material - The material name
 * @param {string} acidConcentration - The acid concentration
 * @param {number} maximumTemperature - The maximum temperature
 * @param {number} velocity - The velocity of acid
 * @returns {number|null} The corrosion rate or null if not found
 */
function calculate_corrosion_rate(tableData, material, acidConcentration, maximumTemperature, velocity) {
    let corrosionRate = null;

    if (material === "carbon steel") {
        // Carbon steel format: { "100": [{ temperature: 42, acid_velocity: { "0": 5, "1": 7 } }] }
        const concentrationData = tableData[acidConcentration];

        if (!concentrationData || !Array.isArray(concentrationData)) {
            console.error("Concentration not found in table:", acidConcentration);
            return null;
        }

        // Find exact temperature match (dropdown values come from table)
        const tempData = concentrationData.find(item => item.temperature === maximumTemperature);

        if (!tempData || !tempData.acid_velocity) {
            console.error("Temperature data not found:", maximumTemperature);
            return null;
        }

        // Get corrosion rate for exact velocity (dropdown values come from table)
        corrosionRate = tempData.acid_velocity[velocity.toString()];

    } else {
        // Other materials format: { "temperature_in_f": { "98": { "86": { "2": 5 } } } }
        // Determine which temperature scale to use based on table 4.1
        const table41Data = sessionStorage.getItem("table4.1_data");
        let usesFahrenheit = true;

        if (table41Data) {
            const table41 = JSON.parse(table41Data);
            usesFahrenheit = table41.measurement_unit === "farenheit";
        }

        const tempScale = usesFahrenheit ? "temperature_in_f" : "temperature_in_c";
        const tempData = tableData[tempScale];

        if (!tempData) {
            console.error("Temperature scale not found in table:", tempScale);
            return null;
        }

        // Get concentration data (exact match)
        const concentrationData = tempData[acidConcentration];

        if (!concentrationData) {
            console.error("Concentration not found:", acidConcentration);
            return null;
        }

        // Get velocity data for exact temperature (dropdown values come from table)
        const velocityData = concentrationData[maximumTemperature.toString()];

        if (!velocityData) {
            console.error("Temperature not found:", maximumTemperature);
            return null;
        }

        // Get corrosion rate for exact velocity (dropdown values come from table)
        corrosionRate = velocityData[velocity.toString()];
    }

    if (corrosionRate === null || corrosionRate === undefined) {
        console.error("Corrosion rate not found in table");
        return null;
    }

    return corrosionRate;
}

/**
 * Populates the acid concentration dropdown with unique values from the table
 * Handles both carbon steel format and other materials format
 * @param {Object} tableData - The table data
 * @param {string} material - The material name to determine table format
 */
function populate_acid_concentration(tableData, material) {
    const acidConcentrationSelect = document.getElementById("acid_concentration");
    acidConcentrationSelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    let concentrations = [];

    // Check if this is carbon steel format (has numeric keys directly)
    if (material === "carbon steel") {
        // Carbon steel format: { "100": [...], "98": [...], ... }
        concentrations = Object.keys(tableData).sort((a, b) => parseFloat(b) - parseFloat(a));
    } else {
        // Other materials format: { "temperature_in_c": { "98": {...}, ... }, "temperature_in_f": { ... } }
        // Get concentrations from temperature_in_f or temperature_in_c
        const tempData = tableData.temperature_in_f || tableData.temperature_in_c;
        if (tempData) {
            concentrations = Object.keys(tempData).sort((a, b) => parseFloat(b) - parseFloat(a));
        }
    }

    concentrations.forEach((concentration) => {
        const option = document.createElement("option");
        option.value = concentration;
        option.textContent = `${concentration}%`;
        acidConcentrationSelect.appendChild(option);
    });

    acidConcentrationSelect.disabled = false;
}

/**
 * Populates the temperature dropdown with unique temperature values from the table
 * Handles both carbon steel format and other materials format
 * @param {Object} tableData - The table data
 * @param {string} material - The material name to determine table format
 */
function populate_temperature(tableData, material) {
    const temperatureSelect = document.getElementById("maximum_temperature");
    temperatureSelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    const temperatures = new Set();

    // Check if this is carbon steel format
    if (material === "carbon steel") {
        // Carbon steel format: { "100": [{ temperature: 42, acid_velocity: { ... } }] }
        Object.values(tableData).forEach((concentrationData) => {
            if (Array.isArray(concentrationData)) {
                concentrationData.forEach((tempData) => {
                    if (tempData && tempData.temperature) {
                        temperatures.add(parseFloat(tempData.temperature));
                    }
                });
            }
        });
    } else {
        // Other materials format: { "temperature_in_f": { "98": { "86": { ... } } } }
        const tempData = tableData.temperature_in_f || tableData.temperature_in_c;
        if (tempData) {
            Object.values(tempData).forEach((concentrationData) => {
                Object.keys(concentrationData).forEach((temp) => {
                    temperatures.add(parseFloat(temp));
                });
            });
        }
    }

    // Sort temperatures numerically
    Array.from(temperatures)
        .sort((a, b) => a - b)
        .forEach((temp) => {
            const option = document.createElement("option");
            option.value = temp;
            option.textContent = temp;
            temperatureSelect.appendChild(option);
        });

    temperatureSelect.disabled = false;
}

/**
 * Populates the velocity dropdown with unique velocity values from the table
 * Handles both carbon steel format and other materials format
 * @param {Object} tableData - The table data
 * @param {string} material - The material name to determine table format
 */
function populate_velocity(tableData, material) {
    const velocitySelect = document.getElementById("velocity_of_acid");
    velocitySelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    const velocities = new Set();

    // Check if this is carbon steel format
    if (material === "carbon steel") {
        // Carbon steel format: { "100": [{ temperature: 42, acid_velocity: { "0": 5, "1": 7, ... } }] }
        Object.values(tableData).forEach((concentrationData) => {
            if (Array.isArray(concentrationData)) {
                concentrationData.forEach((tempData) => {
                    if (tempData && tempData.acid_velocity) {
                        Object.keys(tempData.acid_velocity).forEach((velocity) => {
                            velocities.add(parseFloat(velocity));
                        });
                    }
                });
            }
        });
    } else {
        // Other materials format: { "temperature_in_f": { "98": { "86": { "2": 5, "6": 15, ... } } } }
        const tempData = tableData.temperature_in_f || tableData.temperature_in_c;
        if (tempData) {
            Object.values(tempData).forEach((concentrationData) => {
                Object.values(concentrationData).forEach((temperatureData) => {
                    Object.keys(temperatureData).forEach((velocity) => {
                        velocities.add(parseFloat(velocity));
                    });
                });
            });
        }
    }

    // Sort velocities numerically
    Array.from(velocities)
        .sort((a, b) => a - b)
        .forEach((velocity) => {
            const option = document.createElement("option");
            option.value = velocity;
            option.textContent = velocity;
            velocitySelect.appendChild(option);
        });

    velocitySelect.disabled = false;
}


export function sa_corrosion_calc() {

    // Get DOM elements
    const materialSelect = document.getElementById("material_of_construction");
    const oxygenSelect = document.getElementById("oxygen_present");
    const specialistContainer = document.getElementById("specialist_message_container");
    const additionalInputsContainer = document.getElementById("additional_inputs_container");
    const calculateButton = document.getElementById("calculate_corrosion_rate");
    const setCorrosionRateButton = document.getElementById("set_corrosion_rate");
    const specialistCorrosionRateInput = document.getElementById("specialist_corrosion_rate");

    // Function to check conditions and show/hide elements
    async function checkConditions() {
        const material = materialSelect.value;
        const oxygenPresent = oxygenSelect.value;

        // Check if both material and oxygen are selected
        if (material && oxygenPresent) {
            // Load and display the table for verification
            try {
                const tableData = await get_table(material);

                // Populate acid concentration, temperature, and velocity dropdowns
                // Pass material to determine table format
                populate_acid_concentration(tableData, material);
                populate_temperature(tableData, material);
                populate_velocity(tableData, material);

            } catch (error) {
                console.error(`[SA Corrosion] Error loading table:`, error);
            }

            // Check if material is Alloy B-2 AND oxygen is present
            if (material === "alloy b-2" && oxygenPresent === "yes") {
                specialistContainer.classList.remove("hidden");
                additionalInputsContainer.classList.add("hidden");
                calculateButton.classList.add("hidden");
                setCorrosionRateButton.classList.remove("hidden");
            } else {
                specialistContainer.classList.add("hidden");
                additionalInputsContainer.classList.remove("hidden");
                calculateButton.classList.remove("hidden");
                setCorrosionRateButton.classList.add("hidden");
            }
        } else {
            // Hide both if not all conditions are met
            specialistContainer.classList.add("hidden");
            additionalInputsContainer.classList.add("hidden");
            calculateButton.classList.add("hidden");
            setCorrosionRateButton.classList.add("hidden");
        }
    }

    // Handle set corrosion rate button click
    setCorrosionRateButton.addEventListener("click", () => {
        const corrosionRateValue = specialistCorrosionRateInput.value;

        if (corrosionRateValue && corrosionRateValue > 0) {
            // Get the measurement unit from table 4.1
            const table41Data = sessionStorage.getItem("table4.1_data");
            let unit = "mm/year"; // Default unit

            if (table41Data) {
                const table41 = JSON.parse(table41Data);
                unit = table41.measurement_unit === "farenheit" ? "mpy" : "mm/year";
            }

            // Save to sessionStorage (only the numeric value, without unit)
            sessionStorage.setItem("corrosion_rate", corrosionRateValue);

            // Show success message with the appropriate unit
            const corrosionRateDisplay = document.getElementById("corrosion_rate");
            corrosionRateDisplay.textContent = `Corrosion Rate set: ${corrosionRateValue} ${unit}`;
            corrosionRateDisplay.classList.remove("hidden");
        } else {
            alert("Please enter a valid corrosion rate value");
        }
    });

    // Handle calculate corrosion rate button click
    calculateButton.addEventListener("click", async () => {
        // Clear previous errors
        document.getElementById("error-container").innerHTML = "";

        // Get input values
        const material = materialSelect.value;
        const acidConcentration = document.getElementById("acid_concentration").value;
        const maximumTemperature = parseFloat(document.getElementById("maximum_temperature").value);
        const velocityOfAcid = parseFloat(document.getElementById("velocity_of_acid").value);

        // Validate inputs
        const errors = validate_inputs(material, acidConcentration, maximumTemperature.toString(), velocityOfAcid.toString());

        if (errors.length > 0) {
            display_errors(errors);
            return;
        }

        // If all validations pass, proceed with calculation
        try {
            const tableData = await get_table(material);

            // Calculate corrosion rate
            const corrosionRate = calculate_corrosion_rate(
                tableData,
                material,
                acidConcentration,
                maximumTemperature,
                velocityOfAcid
            );

            if (corrosionRate === null) {
                display_errors(["Could not calculate corrosion rate. Please check your inputs."]);
                return;
            }

            // Get the measurement unit from table 4.1
            const table41Data = sessionStorage.getItem("table4.1_data");
            let unit = "mm/year"; // Default unit

            if (table41Data) {
                const table41 = JSON.parse(table41Data);
                unit = table41.measurement_unit === "farenheit" ? "mpy" : "mm/year";
            }

            // Save to sessionStorage
            sessionStorage.setItem("corrosion_rate", corrosionRate);

            // Display the result
            const corrosionRateDisplay = document.getElementById("corrosion_rate");
            corrosionRateDisplay.textContent = `Corrosion Rate: ${corrosionRate} ${unit}`;
            corrosionRateDisplay.classList.remove("hidden");

        } catch (error) {
            console.error("Error calculating corrosion rate:", error);
            display_errors([`Error: ${error.message}`]);
        }
    });

    materialSelect.addEventListener("change", () => {
        // Hide corrosion rate display when material changes
        const corrosionRateDisplay = document.getElementById("corrosion_rate");
        corrosionRateDisplay.classList.add("hidden");

        checkConditions();
    });

    oxygenSelect.addEventListener("change", () => {
        // Hide corrosion rate display when oxygen selection changes
        const corrosionRateDisplay = document.getElementById("corrosion_rate");
        corrosionRateDisplay.classList.add("hidden");

        checkConditions();
    });

    checkConditions();
}
