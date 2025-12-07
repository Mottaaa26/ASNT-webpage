
/**
 * Function that gets the tables containing the corrosion rate data
 * @returns {Promise<Object>} table data
 */
async function get_tables() {
    const tablePaths = {
        table_2b92: '/static/formula_app/data/json/ht_oxidation/table_2b92.JSON',
    };

    try {
        const responses = await Promise.all([
            fetch(tablePaths.table_2b92).then(r => r.json()),
        ]);

        return {
            table_2b92: responses[0],
        };
    } catch (error) {
        console.error("Failed to load tables:", error);
        throw error;
    }
}

/**
 * Determines the unit system (Fahrenheit/Imperial vs Celsius/Metric)
 * @returns {boolean} true if Fahrenheit, false if Celsius
 */
function is_fahrenheit() {
    const table41Data = sessionStorage.getItem("table4.1_data");
    let usesFahrenheit = true;
    if (table41Data) {
        const table41 = JSON.parse(table41Data);
        usesFahrenheit = table41.measurement_unit === "farenheit";
    }
    return usesFahrenheit;
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
 * Populates dropdowns based on loaded data and user selection
 */
async function populate_dropdowns(tables) {
    const materialSelect = document.getElementById("material");
    const tempSelect = document.getElementById("maximum_metal_temperature");
    const isF = is_fahrenheit();
    const tableData = tables.table_2b92;
    // Structure: { temperature_in_f: { "CS": { "925": ..., ...}, "5 Cr": ...}, temperature_in_c: ... }

    // Clear temp options first
    tempSelect.innerHTML = '<option value="" selected disabled>Select one</option>';

    if (!materialSelect.value) return;

    const unitKey = isF ? "temperature_in_f" : "temperature_in_c";
    const material = materialSelect.value; // Needs to match JSON keys? 
    // HTML values: "carbon steel", "1 1/4cr", "5cr"...
    // JSON Keys: "CS", "1 1/4Cr", "5 Cr", "304 SS", "800 H/HP"...

    // Mapping HTML values to JSON Keys
    const materialMap = {
        "carbon steel": "CS",
        "1 1/4cr": "1 1/4Cr",
        "2 1/4cr": "2 1/4Cr",
        "5cr": "5 Cr",
        "7cr": "7 Cr",
        "9cr": "9 Cr",
        "12cr": "12 Cr",
        "304 ss": "304 SS",
        "309 ss": "309 SS",
        "310 ss/hk": "310 SS/HK",
        "800 h/hp": "800 H/HP"
    };

    const jsonMaterial = materialMap[material];

    if (tableData[unitKey] && tableData[unitKey][jsonMaterial]) {
        const temps = Object.keys(tableData[unitKey][jsonMaterial]).sort((a, b) => parseFloat(a) - parseFloat(b));

        temps.forEach(temp => {
            if (tableData[unitKey][jsonMaterial][temp] !== null) { // Only show valid data points? 
                // Or show all? Table has explicit "null"s.
                // Assuming we can only calculate where data exists.
                const option = document.createElement("option");
                option.value = temp;
                option.textContent = temp;
                tempSelect.appendChild(option);
            }
        });
    }
}


/**
 * Main Calculation Function
 */
export function ht_oxidation_calc() {
    const calcButton = document.getElementById("calculate_corrosion_rate");
    const resultDisplay = document.getElementById("corrosion_rate");
    const materialSelect = document.getElementById("material");
    const tempSelect = document.getElementById("maximum_metal_temperature");

    let tables = null;

    // Initialization
    async function init() {
        try {
            tables = await get_tables();
            // Add listener to populate temps when material changes
            materialSelect.addEventListener("change", () => populate_dropdowns(tables));

            // Initial populate if something selected (unlikely on reload but good practice)
            populate_dropdowns(tables);

        } catch (e) {
            display_errors(["Error loading data tables."]);
        }
    }

    init();

    // Calculate Button Logic
    calcButton.addEventListener("click", () => {
        document.getElementById("error-container").innerHTML = "";
        resultDisplay.classList.add("hidden");

        const material = materialSelect.value;
        const temperature = tempSelect.value;

        if (!material || !temperature) {
            display_errors(["Please select both Material and Temperature."]);
            return;
        }

        const isF = is_fahrenheit();
        const unit = isF ? "mpy" : "mm/year"; // Validate unit string ("mm/yr" vs "mm/year")

        // Map Material
        const materialMap = {
            "carbon steel": "CS",
            "1 1/4cr": "1 1/4Cr",
            "2 1/4cr": "2 1/4Cr",
            "5cr": "5 Cr",
            "7cr": "7 Cr",
            "9cr": "9 Cr",
            "12cr": "12 Cr",
            "304 ss": "304 SS",
            "309 ss": "309 SS",
            "310 ss/hk": "310 SS/HK",
            "800 h/hp": "800 H/HP"
        };
        const jsonMaterial = materialMap[material];

        // Lookup Rate
        const tableData = tables.table_2b92;
        const unitKey = isF ? "temperature_in_f" : "temperature_in_c";

        let rate = null;
        if (tableData[unitKey] && tableData[unitKey][jsonMaterial]) {
            rate = tableData[unitKey][jsonMaterial][temperature];
        }

        if (rate !== null && rate !== undefined) {
            sessionStorage.setItem("corrosion_rate", rate);
            resultDisplay.textContent = `Estimated Corrosion Rate: ${rate} ${unit}`;
            resultDisplay.classList.remove("hidden");
        } else {
            // Should not happen if validation works and dropdown only populated valid
            display_errors(["Data not available for the selected conditions."]);
        }
    });

}
