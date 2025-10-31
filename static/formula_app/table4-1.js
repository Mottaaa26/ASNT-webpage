document.getElementById("btn_table4.1").addEventListener("click", () => {

    // Diccionario con los datos de la tabla almacenados.
    const table_data = {
        start_date: document.getElementById('start_date').value,
        thickness: parseFloat(document.getElementById('thickness').value),
        corrosion_allow: parseFloat(document.getElementById('corrosion_allowance').value),
        design_temp: parseFloat(document.getElementById('design_temperature').value),
        design_press: parseFloat(document.getElementById('design_pressure').value),
        operating_temp: parseFloat(document.getElementById('operating_temperature').value),
        operating_press: parseFloat(document.getElementById('operating_pressure').value),
        design_code: parseInt(document.getElementById('design_code').value),
        equip_type: document.getElementById('equipment_type').value,
        comp_type: document.getElementById('component_type').value,
        comp_geom_data: document.getElementById('component_geometry_data').value,
        material_especification: document.getElementById('material_especification').value,
        yield_strength: document.getElementById('yield_strength').value,
        tensile_strength: document.getElementById('tensile_strength').value,
        weld_joint_efficiency: document.getElementById('weld_joint_efficiency').value,
        heat_tracing: document.getElementById('heat_tracing').value
    }

});