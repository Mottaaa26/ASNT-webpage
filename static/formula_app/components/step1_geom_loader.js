
// Logic to populate Component Geometry Data in Table 4.1 (Step 1)
// This should run after table4-1.js has initialized the main select listeners.

document.addEventListener("DOMContentLoaded", function () {
    const equipSelect = document.getElementById("equipment");
    const compSelect = document.getElementById("component");
    const geomDataSelect = document.getElementById("component_geometry_data");

    if (!equipSelect || !compSelect || !geomDataSelect) return;

    let t42Data = null;
    let t43Data = null;

    // Load JSONs
    Promise.all([
        fetch('/static/formula_app/data/json/step4/table42.JSON').then(r => r.json()),
        fetch('/static/formula_app/data/json/step4/table43.JSON').then(r => r.json())
    ]).then(([t42, t43]) => {
        t42Data = t42;
        t43Data = t43;
        // If data loaded, we bind change events or initial load check
    });

    function updateGeometryOptions() {
        // Wait for data
        if (!t42Data || !t43Data) return;

        // Clear current
        geomDataSelect.innerHTML = '<option value="" disabled selected>Select geometry</option>';

        const equipId = parseInt(equipSelect.value);
        const compId = compSelect.value; // Step 1 might save Component CODE (e.g. HEXSS)

        if (isNaN(equipId) || !compId) return;

        // Map ID to Name logic (Same as Step 4)
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

        // Find matches in Table 4.2
        const equipEntry = t42Data.equipment_data.find(e =>
            e.equipment_type.toLowerCase().replaceAll(/\s/g, '') === targetEquipName.toLowerCase().replaceAll(/\s/g, '')
        );

        if (!equipEntry) return;

        // In Table 4.2, geometry_types are listed for the EQUIPMENT, not strictly per component.
        // We will show ALL valid geometries for this Equipment.
        // Step 4 logic: "Find matching equipment... possibleGeoms = equip.geometry_types"

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
    // existing table4-1.js likely changes 'component' innerHTML on equipment change.
    // We should listen to 'change' on COMPONENT.

    compSelect.addEventListener("change", () => {
        // Short delay to ensure value is set? No need for change event.
        updateGeometryOptions();
    });

    // Also listen to Equipment change to clear if needed, but component change is key.
    equipSelect.addEventListener("change", () => {
        geomDataSelect.innerHTML = '<option value="" disabled selected>Select geometry</option>';
    });

});
