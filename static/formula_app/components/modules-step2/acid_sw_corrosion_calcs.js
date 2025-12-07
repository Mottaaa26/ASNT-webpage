
import { tables } from "../step2_calcs.js";

/**
 * HELPER FUNCTION TO SET VISIBILITY
 * @param {string} elementId - ID of the element to show/hide
 * @param {boolean} visible - true to show, false to hide
 */
function setVisibility(elementId, visible) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (visible) {
        element.classList.remove("hidden");
    } else {
        element.classList.add("hidden");
    }
}

/**
 * VALIDATES INPUTS
 * @param {string} ph - Selected pH
 * @param {string} temp - Selected Temperature
 * @returns {string[]} errors
 */
function validate_inputs(ph, temp) {
    const errors = [];
    if (!ph) errors.push("pH selection is required.");
    if (!temp) errors.push("Temperature selection is required.");
    return errors;
}


/**
 * DISPLAY ERRORS
 * @param {string[]} errors 
 */
function display_errors(errors) {
    const errorContainer = document.getElementById("error-container");
    errorContainer.innerHTML = "";
    errorContainer.className = "flex flex-col gap-2 m-3"; // Apply flex and gap

    errors.forEach(err => {
        const div = document.createElement("div");
        div.className = "alert alert-error";
        div.textContent = err;
        errorContainer.appendChild(div);
    });
}

/**
 * POPULATE OPTIONS FOR SELECTS
 * @param {Object} tableData 
 */
function populate_options(tableData) {
    const phSelect = document.getElementById("ph_value");
    const tempSelect = document.getElementById("temperature");

    // Clear existing options to prevent duplicates if called multiple times
    phSelect.innerHTML = '<option value="" disabled selected>Select one</option>';
    tempSelect.innerHTML = '<option value="" disabled selected>Select one</option>';

    if (!tableData) return;

    // Determine unit
    const table41Data = sessionStorage.getItem("table4.1_data");
    let usesFahrenheit = true;
    if (table41Data) {
        const table41 = JSON.parse(table41Data);
        usesFahrenheit = table41.measurement_unit === "farenheit";
    }

    // Correct keys based on JSON file inspection
    const tempKey = usesFahrenheit ? "temperature_in_f" : "temperature_in_c";

    const rootData = tableData[tempKey];
    if (!rootData) {
        console.error(`Data for key '${tempKey}' not found in table_2b102.`);
        return;
    }

    // Get Temperatures
    const temps = Object.keys(rootData).sort((a, b) => parseFloat(a) - parseFloat(b));
    temps.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t;
        tempSelect.appendChild(opt);
    });

    // Populate pH 
    const phs = new Set();
    Object.values(rootData).forEach(entry => {
        Object.keys(entry).forEach(k => phs.add(k));
    });

    Array.from(phs).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        phSelect.appendChild(opt);
    });
}


/**
 * MAIN MODULE FUNCTION
 */
export function acid_sw_corrosion_calc() {

    // --- DOM ELEMENTS ---
    const h2oSelect = document.getElementById("h2o_present");
    const ph7Select = document.getElementById("ph_7");
    const ph45Select = document.getElementById("ph_4_5");
    const chloridesSelect = document.getElementById("chlorides");
    const materialSelect = document.getElementById("material");

    // Final Inputs Containers
    const containerFinalInputs = document.getElementById("container_final_inputs");
    const containerStep1 = document.getElementById("container_step_1");
    const containerStep2 = document.getElementById("container_step_2");
    const containerStep3 = document.getElementById("container_step_3");
    const containerComingSoon = document.getElementById("container_coming_soon");

    // Inputs inside Final Step
    const phValueInput = document.getElementById("ph_value");
    const temperatureInput = document.getElementById("temperature");
    const oxygenInput = document.getElementById("oxygen");
    const velocityInput = document.getElementById("velocity");

    // Buttons & Results
    const btnCalcRate = document.getElementById("calculate_corrosion_rate");
    const btnCalcFinalRate = document.getElementById("calculate_final_corrosion_rate");

    const resultRate1 = document.getElementById("corrosion_rate_result_1"); // Intermediate Result
    const finalResultDisplay = document.getElementById("corrosion_rate"); // Main Result at bottom
    const errorContainer = document.getElementById("error-container");

    let isPopulated = false;
    let baseCorrosionRate = 0;

    // --- VISIBILITY LOGIC ---

    function updateVisibility() {
        // Clear errors and results when changing main flow
        errorContainer.innerHTML = "";
        finalResultDisplay.classList.add("hidden");

        // --- 1. H2O PRESENT ---
        if (h2oSelect.value === "no") {
            hideAllAfterH2O();
            // Corrosion Rate = 0
            sessionStorage.setItem("corrosion_rate", 0);
            sessionStorage.setItem("final_corrosion_rate", 0);
            finalResultDisplay.textContent = "Estimated Corrosion Rate is 0 mpy";
            finalResultDisplay.classList.remove("hidden");
            return;
        }

        if (h2oSelect.value === "yes") {
            setVisibility("container_ph_7", true);
        } else {
            hideAllAfterH2O();
            return;
        }

        // --- 2. pH > 7 ---
        if (ph7Select.value === "yes") {
            hideAllAfterPH7();
            setVisibility("container_coming_soon", true);
            return;
        }

        if (ph7Select.value === "no") {
            setVisibility("container_ph_4_5", true);
            setVisibility("container_coming_soon", false);
        } else {
            hideAllAfterPH7();
            return;
        }

        // --- 3. pH < 4.5 ---
        if (ph45Select.value === "yes") {
            hideAllAfterPH45();
            setVisibility("container_coming_soon", true);
            return;
        }

        if (ph45Select.value === "no") {
            setVisibility("container_chlorides", true);
            setVisibility("container_coming_soon", false);
        } else {
            hideAllAfterPH45();
            return;
        }

        // --- 4. CHLORIDES ---
        if (chloridesSelect.value === "yes") {
            hideAllAfterChlorides();
            setVisibility("container_coming_soon", true);
            return;
        }

        if (chloridesSelect.value === "no") {
            setVisibility("container_material", true);
            setVisibility("container_coming_soon", false);
        } else {
            hideAllAfterChlorides();
            return;
        }

        // --- 5. MATERIAL ---
        if (materialSelect.value === "no") {
            setVisibility("container_final_inputs", false);
            // Rate = 2 mpy
            sessionStorage.setItem("corrosion_rate", 2);
            sessionStorage.setItem("final_corrosion_rate", 2);
            finalResultDisplay.textContent = "Estimated corrosion rate: 2 mpy";
            finalResultDisplay.classList.remove("hidden");
            return;
        }

        if (materialSelect.value === "yes") {
            setVisibility("container_final_inputs", true);
            setVisibility("container_step_1", true);
            finalResultDisplay.classList.add("hidden");

            // Populate options if not done
            // Using helper table loader from imports
            if (!isPopulated && tables.table_2b102) {
                populate_options(tables.table_2b102);
                isPopulated = true;
            }
        } else {
            setVisibility("container_final_inputs", false);
            return;
        }

    }

    // --- HELPER HIDE FUNCTIONS ---
    function hideAllAfterH2O() {
        setVisibility("container_ph_7", false);
        setVisibility("container_ph_4_5", false);
        setVisibility("container_chlorides", false);
        setVisibility("container_material", false);
        setVisibility("container_final_inputs", false);
        setVisibility("container_coming_soon", false);
        finalResultDisplay.classList.add("hidden");
    }

    function hideAllAfterPH7() {
        setVisibility("container_ph_4_5", false);
        setVisibility("container_chlorides", false);
        setVisibility("container_material", false);
        setVisibility("container_final_inputs", false);
        setVisibility("container_coming_soon", false);
    }

    function hideAllAfterPH45() {
        setVisibility("container_chlorides", false);
        setVisibility("container_material", false);
        setVisibility("container_final_inputs", false);
        setVisibility("container_coming_soon", false);
    }

    function hideAllAfterChlorides() {
        setVisibility("container_material", false);
        setVisibility("container_final_inputs", false);
        setVisibility("container_coming_soon", false);
    }


    // --- CALCULATION HANDLERS ---

    // Step 1 Calculation (pH & Temp) -> Show Oxygen
    btnCalcRate.addEventListener("click", () => {
        errorContainer.innerHTML = "";

        const ph = phValueInput.value;
        const temp = temperatureInput.value;

        const errors = validate_inputs(ph, temp);
        if (errors.length > 0) {
            display_errors(errors);
            return;
        }

        // Get Unit System
        const table41Data = sessionStorage.getItem("table4.1_data");
        let usesFahrenheit = true;
        if (table41Data) {
            const table41 = JSON.parse(table41Data);
            usesFahrenheit = table41.measurement_unit === "farenheit";
        }
        const unitLabel = usesFahrenheit ? "mpy" : "mm/y";

        // Lookup Base Rate from Table 2.B.10.2
        if (!tables.table_2b102) {
            errorContainer.innerHTML = `<div class="alert alert-error">Table 2.B.10.2 data not loaded.</div>`;
            return;
        }

        const tempKey = usesFahrenheit ? "temperature_in_f" : "temperature_in_c";
        const tempData = tables.table_2b102[tempKey];

        let foundRate = null;
        if (tempData && tempData[temp]) {
            foundRate = tempData[temp][ph];
        }

        if (foundRate === undefined || foundRate === null) {
            // Fallback or error if not found (should be populated though)
            errorContainer.innerHTML = `<div class="alert alert-error">Could not find corrosion rate for Temp ${temp} and pH ${ph}.</div>`;
            return;
        }

        baseCorrosionRate = parseFloat(foundRate);

        // Store intermediate rate
        sessionStorage.setItem("corrosion_rate", baseCorrosionRate);

        resultRate1.textContent = `Base Corrosion Rate (CRph): ${baseCorrosionRate} ${unitLabel}`;
        resultRate1.classList.remove("hidden");

        // Show Next Step
        setVisibility("container_step_2", true);
    });

    // Step 2 Logic (Oxygen input focus) -> Show Velocity
    oxygenInput.addEventListener("input", () => {
        if (oxygenInput.value) {
            setVisibility("container_step_3", true);
        }
    });

    // Final Calculation
    btnCalcFinalRate.addEventListener("click", () => {
        errorContainer.innerHTML = "";

        // Ensure Step 1 was done
        if (!baseCorrosionRate && baseCorrosionRate !== 0) {
            errorContainer.innerHTML = `<div class="alert alert-error">Please calculate the base rate first.</div>`;
            return;
        }

        const oxy = parseFloat(oxygenInput.value);
        const vel = parseFloat(velocityInput.value);

        if (isNaN(oxy) || isNaN(vel)) {
            errorContainer.innerHTML = `<div class="alert alert-error">Please fill in Oxygen and Velocity.</div>`;
            return;
        }

        // --- 1. Determine Adjustment Factor for Oxygen (Fo) ---
        // Table 2.B.10.3: Oxygen Component -> Adjustment Factor
        // Assumptions: "not_significant" (< 50 ppb), "significant" (>= 50 ppb)

        let Fo = 1.0;
        if (tables.table_2b103) {
            const isSignificant = oxy >= 50;
            const oxData = tables.table_2b103;
            // Structure: { oxygen_component: [...], adjustment_factor: [1.0, 2.0] }
            // Index 0 = not_significant, Index 1 = significant
            const index = isSignificant ? 1 : 0;
            if (oxData.adjustment_factor && oxData.adjustment_factor[index] !== undefined) {
                Fo = oxData.adjustment_factor[index];
            }
        }

        // --- 2. Determine Velocity Factor (Fv) ---
        // Unit System Check
        const table41Data = sessionStorage.getItem("table4.1_data");
        let usesFahrenheit = true;
        if (table41Data) {
            const table41 = JSON.parse(table41Data);
            usesFahrenheit = table41.measurement_unit === "farenheit";
        }

        let Fv = 1.0;

        if (usesFahrenheit) {
            // US Customary Units (ft/s)
            if (vel < 6) {
                Fv = 1.0;
            } else if (vel <= 20) {
                Fv = (0.25 * vel) - 0.5;
            } else {
                Fv = 5.0;
            }
        } else {
            // SI Units (m/s)
            if (vel < 1.83) {
                Fv = 1.0;
            } else if (vel <= 6.10) {
                Fv = (0.82 * vel) - 0.5;
            } else {
                Fv = 5.0;
            }
        }

        // --- 3. Calculate Final Rate ---
        // CR = CRph * Fo * Fv
        const finalRate = baseCorrosionRate * Fo * Fv;
        const finalRateRounded = finalRate.toFixed(2);

        const unitLabel = usesFahrenheit ? "mpy" : "mm/y";

        finalResultDisplay.textContent = `Estimated Corrosion Rate: ${finalRateRounded} ${unitLabel}`;
        finalResultDisplay.classList.remove("hidden");

        // Store in Session
        sessionStorage.setItem("final_corrosion_rate", finalRateRounded);
    });


    // --- EVENT LISTENERS FOR SELECTION CHANGES ---
    h2oSelect.addEventListener("change", updateVisibility);
    ph7Select.addEventListener("change", updateVisibility);
    ph45Select.addEventListener("change", updateVisibility);
    chloridesSelect.addEventListener("change", updateVisibility);
    materialSelect.addEventListener("change", updateVisibility);

    // Initial check
    updateVisibility();
}
