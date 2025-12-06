
/**
 * Function that gets the table based on the material selected and returns the table data
 * @param {string} material - The selected material name
 * @returns {Promise<Object>} table data
 */
async function get_table(material) {
    const tables = {
        table_2b62: '/static/formula_app/data/json/hf_corrosion/table_2b62.JSON',
        table_2b63: '/static/formula_app/data/json/hf_corrosion/table_2b63.JSON'
    }

    const materialToTable = {
        "carbon_steel": tables.table_2b62,
        "alloy_400": tables.table_2b63
    }

    const tablePath = materialToTable[material];

    if (!tablePath) {
        throw new Error(`unknown material: ${material}`);
    }

    const response = await fetch(tablePath);
    if (!response.ok) {
        throw new Error(`Failed to load the table: ${response.status}`);
    }
    return await response.json();
}

/**
 * VALIDATES ALL INPUT VALUES AND RETURNS AN ARRAY OF ERROR MESSAGES
 * @param {string} material - The selected material (carbon_steel or alloy_400)
 * @param {string} temp - Maximum service temperature
 * @param {string} hfConc - HF concentration
 * @param {string} velocity - Velocity (only for carbon_steel)
 * @param {string} aerated - Aerated (only for alloy_400)
 * @returns {string[]} errors
 */
function validate_inputs(material, temp, hfConc, velocity, aerated) {
    const errors = [];

    if (!material) {
        errors.push("Material selection is required.");
        return errors;
    }

    if (!temp) errors.push("Maximum service temperature is required.");
    if (!hfConc) errors.push("HF-in-water concentration is required.");

    if (material === "carbon_steel") {
        if (!velocity) errors.push("Velocity is required.");
    } else if (material === "alloy_400") {
        if (!aerated) errors.push("Aeration status is required.");
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
 * Populates the Temperature dropdown
 * @param {Object} tableData 
 */
function populate_temperature(tableData) {
    const maxTempSelect = document.getElementById("maximum_service_temperature");
    const currentVal = maxTempSelect.value;
    maxTempSelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    // Determine unit system
    const table41Data = sessionStorage.getItem("table4.1_data");
    let usesFahrenheit = true;
    if (table41Data) {
        const table41 = JSON.parse(table41Data);
        usesFahrenheit = table41.measurement_unit === "farenheit";
    }

    const tempKey = usesFahrenheit ? "temperature_in_f" : "temperature_in_c";
    const rootData = tableData[tempKey];

    if (!rootData) return;

    const temperatures = Object.keys(rootData).sort((a, b) => {
        const numA = parseFloat(a.split('_')[0]);
        const numB = parseFloat(b.split('_')[0]);
        return numA - numB;
    });

    temperatures.forEach(temp => {
        const option = document.createElement("option");
        option.value = temp;
        option.textContent = temp;
        maxTempSelect.appendChild(option);
    });

    if (temperatures.includes(currentVal)) {
        maxTempSelect.value = currentVal;
    }
}

/**
 * Populates other dropdowns based on material
 * @param {Object} tableData 
 * @param {string} material 
 */
function populate_specific_options(tableData, material) {
    const hfConcentrationSelect = document.getElementById("hf_in_water");
    const velocitySelect = document.getElementById("velocity");
    const aeratedSelect = document.getElementById("aerated");

    // Preserve values if possible
    const currentHf = hfConcentrationSelect.value;
    const currentVel = velocitySelect.value;

    // Reset contents
    hfConcentrationSelect.innerHTML = '<option value="" disabled selected>Select one</option>';
    velocitySelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    // Get root data
    const table41Data = sessionStorage.getItem("table4.1_data");
    let usesFahrenheit = true;
    if (table41Data) {
        const table41 = JSON.parse(table41Data);
        usesFahrenheit = table41.measurement_unit === "farenheit";
    }
    const tempKey = usesFahrenheit ? "temperature_in_f" : "temperature_in_c";
    const rootData = tableData[tempKey];

    if (!rootData) return;

    if (material === "carbon_steel") {
        // Populate HF Conc (Ranges) and Velocity
        const hfRanges = new Set();
        const velocities = new Set();

        Object.values(rootData).forEach(tempObj => {
            Object.keys(tempObj).forEach(range => hfRanges.add(range));
            Object.values(tempObj).forEach(velObj => {
                Object.keys(velObj).forEach(v => velocities.add(v));
            });
        });

        // Fill HF
        Array.from(hfRanges).sort().forEach(range => {
            const option = document.createElement("option");
            option.value = range;
            option.textContent = range;
            hfConcentrationSelect.appendChild(option);
        });
        if (hfRanges.has(currentHf)) hfConcentrationSelect.value = currentHf;

        // Fill Velocity
        Array.from(velocities)
            .sort((a, b) => parseFloat(a) - parseFloat(b))
            .forEach(vel => {
                const option = document.createElement("option");
                option.value = vel;
                option.textContent = vel;
                velocitySelect.appendChild(option);
            });
        if (velocities.has(currentVel)) velocitySelect.value = currentVel;

    } else if (material === "alloy_400") {
        // Populate HF Conc (Values)
        // Aerated is static in HTML (Yes/No), so we don't necessarily need to populate it dynamically
        // unless we want to be strictly data-driven. The structure is Temp -> Aerated -> HF -> Rate.
        // We will trust the hardcoded Aerated options match the JSON keys ("Yes", "No").

        const hfConcs = new Set();
        Object.values(rootData).forEach(tempObj => {
            Object.values(tempObj).forEach(aeratedObj => {
                Object.keys(aeratedObj).forEach(conc => hfConcs.add(conc));
            });
        });

        Array.from(hfConcs)
            .sort((a, b) => parseFloat(a) - parseFloat(b))
            .forEach(conc => {
                const option = document.createElement("option");
                option.value = conc;
                option.textContent = conc + "%";
                hfConcentrationSelect.appendChild(option);
            });
        if (hfConcs.has(currentHf)) hfConcentrationSelect.value = currentHf;
    }
}

/**
 * Calculates the corrosion rate from the table data
 * @param {Object} tableData 
 * @param {string} material 
 * @param {string} temp 
 * @param {string} hfConc 
 * @param {string} velocity 
 * @param {string} aerated 
 * @returns {number|null} corrosion rate
 */
function calculate_corrosion_rate(tableData, material, temp, hfConc, velocity, aerated) {
    const table41Data = sessionStorage.getItem("table4.1_data");
    let usesFahrenheit = true;
    if (table41Data) {
        const table41 = JSON.parse(table41Data);
        usesFahrenheit = table41.measurement_unit === "farenheit";
    }
    const tempKey = usesFahrenheit ? "temperature_in_f" : "temperature_in_c";

    const rootData = tableData[tempKey];
    if (!rootData) return null;

    const tempData = rootData[temp];
    if (!tempData) return null;

    if (material === "carbon_steel") {
        // Temp -> HF Range -> Velocity -> Rate
        const hfData = tempData[hfConc];
        if (!hfData) return null;

        const rate = hfData[velocity];
        return rate !== undefined ? rate : null;

    } else if (material === "alloy_400") {
        // Temp -> Aerated -> HF Conc -> Rate
        // Aerated value in JSON is "Yes" / "No" (Capitalized)
        // HTML value is "yes" / "no" (lowercase) - need to simple capitalize
        const aeratedKey = aerated.charAt(0).toUpperCase() + aerated.slice(1).toLowerCase();

        const aeratedData = tempData[aeratedKey];
        if (!aeratedData) return null;

        const rate = aeratedData[hfConc];
        return rate !== undefined ? rate : null;
    }

    return null;
}

export function hf_corrosion_calc() {
    // Get all input elements
    const carbonSteelSelect = document.getElementById("carbon_steel");
    const alloy400Select = document.getElementById("alloy_400");
    const maxTempSelect = document.getElementById("maximum_service_temperature");
    const velocitySelect = document.getElementById("velocity");
    const hfConcentrationSelect = document.getElementById("hf_in_water");
    const aeratedSelect = document.getElementById("aerated");

    const calculateButton = document.getElementById("calculate_corrosion_rate");
    const messageDisplay = document.getElementById("velocity_message");
    const corrosionRateDisplay = document.getElementById("corrosion_rate");

    // Helper visibility function
    function setVisibility(elementId, visible) {
        const element = document.getElementById(elementId);
        if (!element) return;
        const label = document.querySelector(`label[for="${elementId}"]`);
        if (visible) {
            element.classList.remove("hidden");
            if (label) label.classList.remove("hidden");
        } else {
            element.classList.add("hidden");
            if (label) label.classList.add("hidden");
        }
    }

    // State
    let currentMaterial = null;
    let currentTableData = null;

    async function checkConditions() {
        // Reset UI Components
        setVisibility("maximum_service_temperature", false);
        setVisibility("velocity", false);
        setVisibility("hf_in_water", false);
        setVisibility("aerated", false);
        calculateButton.classList.add("hidden");
        messageDisplay.classList.add("hidden");
        corrosionRateDisplay.classList.add("hidden");

        const isCarbonSteel = carbonSteelSelect.value;
        const isAlloy400 = alloy400Select.value;
        let activeMaterial = null;

        // Logic Flow
        if (isCarbonSteel === "yes") {
            activeMaterial = "carbon_steel";
            setVisibility("alloy_400", false);

            // Show Inputs
            setVisibility("maximum_service_temperature", true);
            setVisibility("hf_in_water", true);
            setVisibility("velocity", true); // Only for CS

            calculateButton.classList.remove("hidden");

        } else if (isCarbonSteel === "no") {
            setVisibility("alloy_400", true);

            if (isAlloy400 === "yes") {
                activeMaterial = "alloy_400";

                // Show Inputs
                setVisibility("maximum_service_temperature", true);
                setVisibility("hf_in_water", true);
                setVisibility("aerated", true); // Only for Alloy 400

                calculateButton.classList.remove("hidden");

            } else if (isAlloy400 === "no") {
                // Literature Case
                messageDisplay.textContent = "Determine Corrosion Rate from published literature.";
                messageDisplay.classList.remove("hidden");
                messageDisplay.classList.remove("alert-warning");
                messageDisplay.classList.add("alert-info");
            }
        } else {
            setVisibility("alloy_400", false);
        }

        // Data Loading & Population
        if (activeMaterial) {
            if (activeMaterial !== currentMaterial) {
                try {
                    currentTableData = await get_table(activeMaterial);
                    currentMaterial = activeMaterial;

                    // Populate
                    populate_temperature(currentTableData);
                    populate_specific_options(currentTableData, activeMaterial);

                } catch (error) {
                    console.error("Error loading table data:", error);
                }
            }
        } else {
            currentMaterial = null;
            currentTableData = null;
        }
    }

    // Calculation Handler
    calculateButton.addEventListener("click", () => {
        document.getElementById("error-container").innerHTML = ""; // Clear errors

        const temp = maxTempSelect.value;
        const hfConc = hfConcentrationSelect.value;
        const velocity = velocitySelect.value;
        const aerated = aeratedSelect.value;

        const errors = validate_inputs(currentMaterial, temp, hfConc, velocity, aerated);

        if (errors.length > 0) {
            display_errors(errors);
            return;
        }

        const rate = calculate_corrosion_rate(currentTableData, currentMaterial, temp, hfConc, velocity, aerated);

        if (rate === null || rate === undefined) {
            display_errors(["Could not determine corrosion rate from the table with these inputs."]);
            return;
        }

        // Unit handling (from Table 4.1)
        const table41Data = sessionStorage.getItem("table4.1_data");
        let unit = "mm/year";
        if (table41Data) {
            const table41 = JSON.parse(table41Data);
            unit = table41.measurement_unit === "farenheit" ? "mpy" : "mm/year";
        }

        sessionStorage.setItem("corrosion_rate", rate);
        corrosionRateDisplay.textContent = `Corrosion Rate: ${rate} ${unit}`;
        corrosionRateDisplay.classList.remove("hidden");
    });

    // Listeners
    carbonSteelSelect.addEventListener("change", () => {
        if (carbonSteelSelect.value === "yes") alloy400Select.value = "";
        checkConditions();
    });
    alloy400Select.addEventListener("change", checkConditions);

    // Initial run
    checkConditions();
}
