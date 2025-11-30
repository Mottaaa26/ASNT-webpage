
var table_data;

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

    // Dict with all the data table and we use sessionStorage to keep these values and use them later in other scripts.
    table_data = 
    {
        start_date: document.getElementById('start_date').value,
        thickness: parseFloat(document.getElementById('thickness').value),
        measurement_unit: document.getElementById('measurement_unit').value,
        corrosion_allow: parseFloat(document.getElementById('corrosion_allowance').value),
        design_temp: parseFloat(document.getElementById('design_temperature').value),
        design_press: parseFloat(document.getElementById('design_pressure').value),
        operating_temp: parseFloat(document.getElementById('operating_temperature').value),
        operating_press: parseFloat(document.getElementById('operating_pressure').value),
        design_code: document.getElementById('design_code').value,
        equip_type: document.getElementById('equipment').value,
        comp_type: document.getElementById('component').value,
        has_cladding: document.getElementById('has_cladding').value,
        cladding: document.getElementById('cladding_input').value,
        has_internal_liner: document.getElementById('has_internal_liner').value,
        internal_liner:  document.getElementById('internal_liner_input').value,
        comp_geom_data: document.getElementById('component_geometry_data').value,
        material_especification: document.getElementById('material_especification').value,
        yield_strength: parseFloat(document.getElementById('yield_strength').value),
        tensile_strength: parseFloat(document.getElementById('tensile_strength').value),
        weld_joint_efficiency: parseFloat(document.getElementById('weld_joint_efficiency').value),
        heat_tracing: document.getElementById('heat_tracing').value,
    }

    const result_JSON = JSON.stringify(table_data);

    console.log("todo correcto");
    sessionStorage.setItem('table4.1_data', result_JSON);
    step1_calculations();
    document.getElementById("table4.1_confirmation").classList.remove("hidden");
});

window.loadComponents = undefined;

async function loadTable41(){
    const dataString = sessionStorage.getItem('table4.1_data');
    if(!dataString) return;

    const table_data = JSON.parse(dataString);

    document.getElementById('start_date').value = table_data.start_date;
    document.getElementById('thickness').value = table_data.thickness;
    document.getElementById('measurement_unit').value = table_data.measurement_unit;
    document.getElementById('corrosion_allowance').value = table_data.corrosion_allow;
    document.getElementById('design_temperature').value = table_data.design_temp;
    document.getElementById('design_pressure').value = table_data.design_press;
    document.getElementById('operating_temperature').value = table_data.operating_temp;
    document.getElementById('operating_pressure').value = table_data.operating_press;
    document.getElementById('design_code').value = table_data.design_code;
    document.getElementById('has_cladding').value = table_data.has_cladding;
    document.getElementById('cladding_input').value = table_data.cladding;
    document.getElementById('has_internal_liner').value = table_data.has_internal_liner;
    document.getElementById('internal_liner_input').value = table_data.internal_liner;
    document.getElementById('component_geometry_data').value = table_data.comp_geom_data;
    document.getElementById('material_especification').value = table_data.material_especification;
    document.getElementById('yield_strength').value = table_data.yield_strength;
    document.getElementById('tensile_strength').value = table_data.tensile_strength;
    document.getElementById('weld_joint_efficiency').value = table_data.weld_joint_efficiency;
    document.getElementById('heat_tracing').value = table_data.heat_tracing;

    document.getElementById('equipment').value = table_data.equip_type;

    if(table_data.equip_type && typeof window.loadComponents === 'function')
    {
        await window.loadComponents(table_data.equip_type);
    }

    document.getElementById('component').value = table_data.comp_type;

} 

// Delete the sessionStorage data when the log_out button is clicked
let log_out_btn = document.getElementById("logout_btn");
log_out_btn.addEventListener("click", function(){
   sessionStorage.clear();
});
