
// Logic to populate Component Geometry Data in Table 4.1 (Step 1)
// This should run after table4-1.js has initialized the main select listeners.

function step1_loader_init() {
    const equipSelect = document.getElementById("equipment");
    const compSelect = document.getElementById("component");
    const geomDataSelect = document.getElementById("component_geometry_data");

    if (!equipSelect || !compSelect || !geomDataSelect) return;

    let t42Data = null;
    let t43Data = null;

    let dataResolve;
    const dataReady = new Promise(resolve => dataResolve = resolve);

    // Load JSONs
    Promise.all([
        fetch('/static/formula_app/data/json/step4/table42.JSON').then(r => r.json()),
        fetch('/static/formula_app/data/json/step4/table43.JSON').then(r => r.json())
    ]).then(([t42, t43]) => {
        t42Data = t42;
        t43Data = t43;
        if (dataResolve) dataResolve(); // Signal valid data
    }).catch(err => {
        console.error("Failed to load geometry data", err);
    });

    // Expose updateGeometryOptions globally
    window.updateGeometryOptions = updateGeometryOptions;

    // Expose loadComponents globally
    window.loadComponents = async function (equipType) {
        // Wait for data with timeout
        if (!t42Data) {
            // Race dataReady with a 3s timeout
            const timeout = new Promise(resolve => setTimeout(() => resolve('timeout'), 3000));
            const result = await Promise.race([dataReady, timeout]);
            if (result === 'timeout') {
                console.warn("Geometry data load timed out. Dropdowns will be empty.");
                // Proceed anyway so we don't block other fields
            }
        }

        const compSelect = document.getElementById("component");
        if (!compSelect) return;

        compSelect.innerHTML = '<option value="" disabled selected>Select component</option>';

        let targetEquipName = "";
        const equipId = parseInt(equipType);

        // Map ID to Name logic (Same as Step 4)
        const idMap = {
            1: "Compressor",
            2: "Heat exchanger",
            3: "Pipe",
            4: "Pump",
            5: "Tank620",
            6: "Tank650",
            7: "FinFan",
            8: "Vessel"
        };
        if (idMap[equipId]) targetEquipName = idMap[equipId];
        else targetEquipName = equipType; // Fallback if string

        const equipEntry = t42Data.equipment_data.find(e =>
            e.equipment_type.toLowerCase().replaceAll(/\s/g, '') === targetEquipName.toLowerCase().replaceAll(/\s/g, '')
        );

        if (!equipEntry || !equipEntry.components) return;

        equipEntry.components.forEach(comp => {
            const opt = document.createElement("option");
            opt.value = comp;
            opt.textContent = comp;
            compSelect.appendChild(opt);
        });
    };

    function updateGeometryOptions() {
        // Wait for data
        if (!t42Data || !t43Data) return;

        // Clear current
        geomDataSelect.innerHTML = '<option value="" disabled selected>Select geometry</option>';

        const equipId = parseInt(equipSelect.value);
        const compId = compSelect.value; // Step 1 might save Component CODE (e.g. HEXSS)

        if (isNaN(equipId) || !compId) return;

        // Map ID to Name logic 
        let targetEquipName = "";
        const idMap = {
            1: "Compressor",
            2: "Heat exchanger",
            3: "Pipe",
            4: "Pump",
            5: "Tank620",
            6: "Tank650",
            7: "FinFan",
            8: "Vessel"
        };
        if (idMap[equipId]) targetEquipName = idMap[equipId];
        if (!targetEquipName && isNaN(equipId)) targetEquipName = equipSelect.value;
        if (!targetEquipName) targetEquipName = "";


        // Find matches in Table 4.2
        const equipEntry = t42Data.equipment_data.find(e =>
            e.equipment_type.toLowerCase().replaceAll(/\s/g, '') === targetEquipName.toLowerCase().replaceAll(/\s/g, '')
        );

        if (!equipEntry) return;

        const possibleGeoms = equipEntry.geometry_types;

        possibleGeoms.forEach(gCode => {
            // Get description from Table 4.3
            const gDescEntry = t43Data.geometry_types.find(x => x.geometry_type === gCode);
            const desc = gDescEntry ? gDescEntry.description : gCode;

            const opt = document.createElement("option");
            opt.value = gCode;
            opt.textContent = `${gCode} - ${desc}`;
            geomDataSelect.appendChild(opt);
        });
    }

    // Attach listener to Component select (since Equipment change triggers Component update, 
    // we assume user picks Component last. Or we listen to both/mutation).

    compSelect.addEventListener("change", () => {
        // Short delay to ensure value is set? No need for change event.
        updateGeometryOptions();
    });

    // Also listen to Equipment change to clear if needed, but component change is key.
    equipSelect.addEventListener("change", () => {
        geomDataSelect.innerHTML = '<option value="" disabled selected>Select geometry</option>';
        window.loadComponents(equipSelect.value);
    });
}

// Ensure execution on load or if already loaded
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", step1_loader_init);
} else {
    step1_loader_init();
}
