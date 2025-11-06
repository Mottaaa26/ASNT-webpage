// validate table fields and save it in a dict
document.getElementById("btn_table4.1").addEventListener("click", () => {

    //
    const requiredFields = document.getElementById("table4.1_data").querySelectorAll('input[required], select[required]');

    for (let field of requiredFields)
    {

        if(!field.value || field.value === "")
        {
            if(!field.reportValidity())
            {
                return;
            }
        } 

    }

    // Dict with all the data table
    const table_data = 
    {
        start_date: new Date(document.getElementById('start_date').value),
        thickness: parseFloat(document.getElementById('thickness').value),
        corrosion_allow: parseFloat(document.getElementById('corrosion_allowance').value),
        design_temp: parseFloat(document.getElementById('design_temperature').value),
        design_press: parseFloat(document.getElementById('design_pressure').value),
        operating_temp: parseFloat(document.getElementById('operating_temperature').value),
        operating_press: parseFloat(document.getElementById('operating_pressure').value),
        design_code: document.getElementById('design_code').value,
        equip_type: document.getElementById('equipment').value,
        comp_type: document.getElementById('component').value,
        comp_geom_data: document.getElementById('component_geometry_data').value,
        material_especification: document.getElementById('material_especification').value,
        yield_strength: parseFloat(document.getElementById('yield_strength').value),
        tensile_strength: parseFloat(document.getElementById('tensile_strength').value),
        weld_joint_efficiency: parseFloat(document.getElementById('weld_joint_efficiency').value),
        heat_tracing: document.getElementById('heat_tracing').value,
    }

    document.getElementById("table4.1_confirmation").classList.remove("hidden");

    var table41_confirmation = document.getElementById("step1_confirmation");
    table41_confirmation.classList.remove("hidden");
    table41_confirmation.textContent = `We already have those values from the table above: t = ${table_data.thickness}; age = ${table_data.start_date.toLocaleDateString()}`;

    console.log("Todo correcto");

});
