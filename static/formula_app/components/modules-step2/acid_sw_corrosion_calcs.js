
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
 * @param {string} temp - Input Temperature
 * @returns {string[]} errors
 */
function validate_inputs(ph, temp) {
    const errors = [];
    if (!ph || ph === "") errors.push("pH is required.");
    if (!temp || temp === "") errors.push("Temperature is required.");
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
 * Interpolates or extrapolates y value for given x based on sorted points.
 * @param {number} x - The input value (Temperature or pH)
 * @param {Array<Array<number>>} points - Array of [x, y] points, sorted by x
 * @returns {number|null} - Interpolated y value (Corrosion Rate)
 */
function interpolate(x, points) {
    if (!points || points.length === 0) return null;

    if (points.length === 1) return points[0][1];

    let i = 0;
    while (i < points.length - 2 && x > points[i + 1][0]) {
        i++;
    }

    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];

    if (x1 === x2) return y1;

    const slope = (y2 - y1) / (x2 - x1);
    const y = y1 + slope * (x - x1);

    return y;
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

    let baseCorrosionRate = 0;

    // --- VISIBILITY LOGIC ---

    function updateVisibility() {
        errorContainer.innerHTML = "";
        finalResultDisplay.classList.add("hidden");

        if (h2oSelect.value === "no") {
            hideAllAfterH2O();
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

        if (materialSelect.value === "no") {
            setVisibility("container_final_inputs", false);
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
        } else {
            setVisibility("container_final_inputs", false);
            return;
        }

    }

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

        const phVal = phValueInput.value;
        const tempVal = temperatureInput.value;

        const errors = validate_inputs(phVal, tempVal);
        if (errors.length > 0) {
            display_errors(errors);
            return;
        }

        const ph = parseFloat(phVal);
        const temp = parseFloat(tempVal);

        if (isNaN(ph) || isNaN(temp)) {
            display_errors(["Invalid pH or temperature."]);
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

        // Lookup Table 2.B.10.2
        if (!tables.table_2b102) {
            errorContainer.innerHTML = `<div class="alert alert-error">Table 2.B.10.2 data not loaded.</div>`;
            return;
        }

        const tempKey = usesFahrenheit ? "temperature_in_f" : "temperature_in_c";
        const tempData = tables.table_2b102[tempKey]; // { "100": { "4.75": 1, ... }, "200": ... }

        if (!tempData) {
            errorContainer.innerHTML = `<div class="alert alert-error">Data for ${unitLabel} not valid.</div>`;
            return;
        }

        // DOUBLE INTERPOLATION STRATEGY
        // 1. Iterate each Temperature T in the table.
        // 2. For each T, get the list of (pH, Rate) points.
        // 3. Interpolate (or find) the Rate at the input pH for that T. -> (T, Rate_at_Input_pH)
        // 4. Collect all (T, Rate_at_Input_pH) points.
        // 5. Interpolate the final Rate at the input T using these points.

        const tempPoints = []; // Array of [T, InterpolatedRateAtPH]
        let phWarning = "";

        // Get all available temperatures and sort them
        const availableTemps = Object.keys(tempData).map(parseFloat).sort((a, b) => a - b);

        for (const t of availableTemps) {
            const phData = tempData[t]; // { "4.75": 1, "5.5": 2 }
            if (!phData) continue;

            // Build (pH, Rate) points for this specific Temperature T
            const phPoints = Object.entries(phData)
                .map(([p, r]) => [parseFloat(p), parseFloat(r)])
                .sort((a, b) => a[0] - b[0]);

            if (phPoints.length === 0) continue;

            const minPH = phPoints[0][0];
            const maxPH = phPoints[phPoints.length - 1][0];

            // Check pH Range for this temp (Assuming similar ranges across temps, but safe to check first one/all)
            // Ideally we check if input pH is drastically out of range globally to warn user

            // Interpolate Rate for Input pH at Temp T
            let rateAtPH = interpolate(ph, phPoints);

            // Clamp rate if pH is out of bounds for this curve
            // Note: If pH is < minPH or > maxPH, we might be extrapolating.
            // For Acid SW, pH range is usually 4.5 to 7ish.

            if (ph < minPH) {
                rateAtPH = Math.max(0, rateAtPH);
                if (!phWarning) phWarning = `(pH < Table Range: Extrapolated)`;
            } else if (ph > maxPH) {
                // If pH > maxPH, rate usually decreases or stays same. 
                // Let's simpler clamp to nearest bound value or use extrapolated value handled by helper.
                // interpolate helper does extrapolation. We just clamp to >= 0
                rateAtPH = Math.max(0, rateAtPH);
                if (!phWarning) phWarning = `(pH > Table Range: Extrapolated)`;
            } else {
                rateAtPH = Math.max(0, rateAtPH);
            }

            tempPoints.push([t, rateAtPH]);
        }

        if (tempPoints.length === 0) {
            errorContainer.innerHTML = `<div class="alert alert-error">Could not calculate rates from table data.</div>`;
            return;
        }

        // Now interpolate across Temperatures
        const minTemp = tempPoints[0][0];
        const maxTemp = tempPoints[tempPoints.length - 1][0];
        let finalRate = interpolate(temp, tempPoints);
        let tempWarning = "";

        if (temp < minTemp) {
            tempWarning = `(Temp < Min: Extrapolated)`;
            finalRate = Math.max(0, finalRate);
        } else if (temp > maxTemp) {
            tempWarning = `(Temp > Max: Clamped)`;
            finalRate = tempPoints[tempPoints.length - 1][1];
        } else {
            finalRate = Math.max(0, finalRate);
        }

        // Store base rate
        baseCorrosionRate = finalRate;

        // Store intermediate rate
        const rateRounded = finalRate.toFixed(2);
        sessionStorage.setItem("corrosion_rate", rateRounded);

        const combinedWarning = [phWarning, tempWarning].filter(Boolean).join(" ");
        let warningHTML = "";

        if (combinedWarning) {
            warningHTML = `<div class="mt-2 p-2 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">Warning: ${combinedWarning}</div>`;
        }

        resultRate1.innerHTML = `Base Corrosion Rate (CRph): ${rateRounded} ${unitLabel} ${warningHTML}`;
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

        let Fo = 1.0;
        if (tables.table_2b103) {
            const isSignificant = oxy >= 50;
            const oxData = tables.table_2b103;
            const index = isSignificant ? 1 : 0;
            if (oxData.adjustment_factor && oxData.adjustment_factor[index] !== undefined) {
                Fo = oxData.adjustment_factor[index];
            }
        }

        const table41Data = sessionStorage.getItem("table4.1_data");
        let usesFahrenheit = true;
        if (table41Data) {
            const table41 = JSON.parse(table41Data);
            usesFahrenheit = table41.measurement_unit === "farenheit";
        }

        let Fv = 1.0;
        if (usesFahrenheit) {
            if (vel < 6) {
                Fv = 1.0;
            } else if (vel <= 20) {
                Fv = (0.25 * vel) - 0.5;
            } else {
                Fv = 5.0;
            }
        } else {
            if (vel < 1.83) {
                Fv = 1.0;
            } else if (vel <= 6.10) {
                Fv = (0.82 * vel) - 0.5;
            } else {
                Fv = 5.0;
            }
        }

        const finalRate = baseCorrosionRate * Fo * Fv;
        const finalRateRounded = finalRate.toFixed(2);

        const unitLabel = usesFahrenheit ? "mpy" : "mm/y";

        finalResultDisplay.textContent = `Estimated Corrosion Rate: ${finalRateRounded} ${unitLabel}`;
        finalResultDisplay.classList.remove("hidden");

        sessionStorage.setItem("final_corrosion_rate", finalRateRounded);
    });

    h2oSelect.addEventListener("change", updateVisibility);
    ph7Select.addEventListener("change", updateVisibility);
    ph45Select.addEventListener("change", updateVisibility);
    chloridesSelect.addEventListener("change", updateVisibility);
    materialSelect.addEventListener("change", updateVisibility);

    updateVisibility();
}
