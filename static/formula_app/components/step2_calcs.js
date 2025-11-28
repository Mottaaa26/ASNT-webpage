/**
 * This file contains the calculations and functions necessary to make step 2 work correctly.
 */

/**
 * This function provides functionality to the dropdown, as well as allowing calls to the URLs defined in the views.py file to obtain the different templates for the available options
 */

// URL TO GET THE JSON WITH THE TABLE
const TABLE_DATA_URL2b22 = '/static/formula_app/data/json/table_2-B-2-2.JSON';
const TABLE_DATA_URL2b23 = '/static/formula_app/data/json/table_2-B-2-3.JSON';
const TABLE_DATA_URL2b25 = '/static/formula_app/data/json/table_2b25.JSON';

// LOAD THE JSON FILES TO USE THEM TROUGHT THE STEP
let ci_conc_table = null;
let ci_conc_table_2b23 = null;
let ci_conc_table_2b25 = null;

async function loadTables()
{
    try {
        const response = await fetch(TABLE_DATA_URL2b22);
        if(!response.ok)
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        ci_conc_table = await response.json();
        
    } catch (error) {
        console.error('Failed to load the JSON file: ', error);
    }

    try{

        const response = await fetch(TABLE_DATA_URL2b23);
        if(!response.ok)
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        ci_conc_table_2b23 = await response.json();

    } catch(error){
        console.error("Failed to load the JSON file: ", error);
    }

    try
    {
        const response = await fetch(TABLE_DATA_URL2b25);
        if(!response.ok)
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        ci_conc_table_2b25 = await response.json();
    } catch(error){
        console.error("Failed to load the JSON file: ", error);
    }
}

// CALL THE FUNCTION AT THE BEGINNING TO THE PAGE TO GET IT RIGHT AND PREVENT NULL ERRORS.
loadTables();

/**
 * THIS BLOCK OF CODE GETS THE OPTION SELECTED AND GETS THE HTML TO DISPLAY IT.
 */
var selected_option;
document.addEventListener("click", (e) => {
    const item = e.target.closest(".list-row");
    if (item) {
        selected_option = item.dataset.value.toLowerCase();

        fetch(`load-cr-snippet/${selected_option}`)
            .then(response => {
                if(!response.ok)
                {
                    throw new Error("Error en la respuesta");
                }
                return response.text();
            })
            .then(data => {
                var content_container = document.getElementById("content_container");
                content_container.classList.remove("hidden");
                content_container.innerHTML = data;

                switch (selected_option) {
                    case "hci_corrosion":
                        hci_corrosion_calc();
                        break;
                
                    default:
                        break;
                }

            })

    }
}); 

/**
 * All this code for the hci corrosion calc will be deployed in another file and the file gonna be imported to this file. for practical reasons.
 */

/**
 * THE FOLLOWING CODE WILL HANDLE THE NECESSARY CALCULATIONS TO OBTAIN THE RESULT 
 * DEPENDING ON THE ENVIRONMENT WITH WHICH THE COMPONENT IS IN CONTACT.
 */
function hci_corrosion_calc()
{
    const select = document.getElementById("cs_300_series");
    const ph_known_container = document.getElementById("ph_known_container");
    const ph_known = document.getElementById("ph_known");
    const ci_calc_container = document.getElementById("ci_concentration_container");
    const ci_concentration = document.getElementById("ci_concentration");
    const ph_calculated = document.getElementById("ph_calculated");
    const ci_concentration_acidicwater_container = document.getElementById("ci_concentration_acidicwater_container");
    const ci_conc_acidicwater = document.getElementById("ci_conc_acidicwater");
    const ph_acidic_water_container = document.getElementById("ph_acidicwater_container");

    var avg_cl_concentration;

    select.addEventListener("change", function(){
        const op = this.value;
        if(op === "yes"){

            ci_concentration_acidicwater_container.classList.add("hidden");
            ph_acidicwater_container.classList.add("hidden")

            ph_known_container.classList.remove("hidden");
            ph_known.addEventListener("change", function(){
                const op = this.value;
                if(op === "no")
                {
                    ci_calc_container.classList.remove("hidden");

                } else {
                    ci_calc_container.classList.add("hidden");  
                }
            })

        } else {
            ph_known_container.classList.add("hidden");
            ci_calc_container.classList.add("hidden");

            ci_concentration_acidicwater_container.classList.remove("hidden");

            ci_conc_acidicwater.addEventListener("change", function(){

                document.getElementById("material_container").classList.add("hidden");

                if (ci_conc_acidicwater.value === "no")
                {
                    ph_acidic_water_container.classList.remove("hidden");
                    document.getElementById("cl_acidicwater_calc").addEventListener("click", function(){

                        var input_validation = document.getElementById("ph_acidicwater");
                        var message_error = document.getElementById("message_error_phacidicwater");

                        if(input_validation.value.trim() == "")
                        {
                            input_validation.classList.add("border", "border-red-500");
                            message_error.classList.remove("hidden");
                            message_error.textContent = `The input field cannot be empty.`;
                            return 
                        }

                        input_validation.classList.remove("border", "border-red-500");
                        message_error.classList.add("hidden");

                        avg_cl_concentration = calculate_cl_from_ph();
                        var material_container = document.getElementById("material_container");
                        material_container.classList.remove("hidden");
                    })
                    
                } else {
                    ph_acidic_water_container.classList.add("hidden");
                    document.getElementById("material_container").classList.remove("hidden");
                }

            })

        }
    });
    
    var material = document.getElementById("material");
    var data_table2b26 = document.getElementById("data_table2b26");
    var data_table2b25 = document.getElementById("data_table2b25");

    material.addEventListener("change", function(){
        switch(material.value)
        {
            case "yes":
                data_table2b26.classList.remove("hidden");
                data_table2b25.classList.add("hidden");
                break;
            case "no":
                data_table2b25.classList.remove("hidden");
                data_table2b26.classList.add("hidden");

                var cl_acidicwater_info = document.getElementById("cl_acidicwater_info");
                cl_acidicwater_info.classList.remove("hidden");
                cl_acidicwater_info.textContent = `The average of the range obtained from table 2b22 was calculated to relate the data to those presented in table 2b25. The average result is ${avg_cl_concentration}`;

                operations_crrate_tab2b25(avg_cl_concentration);

                break;
            default:
                break;
        }
    });
    

    // GET THE TABLE FROM THE GLOBAL VARIABLE AND OPERATE WITH THE DATA AND
    // THE USER INPUT TO GET THE COMPONENT'S PH.
    
    document.getElementById("ph_calc_1").addEventListener("click", function(){

        var ci_concentration_value = parseFloat(ci_concentration.value);
        var temp_value = parseFloat(temp_in_f.value);
        var message = document.getElementById("message_error");

        // VALIDATION (THE VALUE MUST BE A NUMBER).
        if(isNaN(ci_concentration_value) && !Number.isInteger(ci_concentration_value)) {
            message.classList.remove("hidden");
            message.textContent = `The value must be a number!`;
            return;
        } else {
            message.classList.add("hidden");
        }
        

        // COMPARE THE VALUE SUBMITTED BY THE USER WITH THE VALUES IN THE TABLE.
        // IF THE VALUE IS EQUAL TO SOME VALUE IN THE TABLE, THE SAME POSITION OF
        // THE PH DICT WILL BE SHOWN.
        for (let i = 0; i<ci_conc_table.ci_concentration.length; i++)
        {
            var range = ci_conc_table.ci_concentration[i];

            if(Array.isArray(range))
            {
                if(ci_concentration_value >= range[0] && ci_concentration_value <= range[1])
                {
                    ph_result = parseFloat(ci_conc_table.ph[i]);
                    ph_calculated.textContent = `Ph of the component determined by its cl concentration: ${ph_result}`;
                    calculate_corrosion_rate1(ph_result, temp_value);
                    break;
                }
            }else {
                if(ci_concentration_value <= range)
                {
                    ph_result = parseFloat(ci_conc_table.ph[i]);
                    calculate_corrosion_rate1(ph_result, temp_value);
                    ph_calculated.textContent = `Ph of the component determined by its cl concentration: ${ph_result}`;
                    break;
                }
            }
            
        }

        // SHOW THE PH RESULT
        if (ph_calculated.textContent != "")
        {
            ph_calculated.classList.remove("hidden");
        } else {
            ph_calculated.textContent = "The entered value is not within any valid range. Check table 2.B.2.2 in API 581";
        }
    })

}

// THIS FUNCTIONS IS USED TO APPLY LINEAR INTERPOLATION TO OBTAIN THE CORRESPONDING VALUES
// AND TO GET THE RESULT OF THE CORROSION RATE.
function calculate_corrosion_rate1(ph, temperature)
{
    const ph_values = [];
    const temp_values = [];

    // ITERATE THROUGH THE JSON FILE TO GET THE PH VALUES (KEYS) AND STORE IT IN THE ARRAY DECLARED ABOVE.
    Object.keys(ci_conc_table_2b23).forEach(key => {
        ph_values.push(parseFloat(key));
    })

    // KNOWING ALL THE KEYS INSIDE THE PH KEYS ARE THE SAME (TEMPERATURE), ONLY STORE IN THE TEMP_VALUES ARRAY THE FIRSTS KEYS.
    Object.keys(ci_conc_table_2b23[ph_values[0]]).forEach(temp => {
        temp_values.push(parseFloat(temp));
    })
    
    //GET THE LOWEST AND THE HIGHEST PH VALUE FOR INTERPOLATION
    let lower_ph = ph_values[0];
    let upper_ph = ph_values[ph_values.length -1];

    for (let i = 0; i<ph_values.length -1; ++i)
    {
        if(ph >= ph_values[i] && ph <= ph_values[i+1])
        {
            lower_ph = ph_values[i];
            upper_ph = ph_values[i+1];
            break;
        }
    }

    // GET THE LOWEST AND THE HIGHEST TEMP VALUE FOR INTERPOLATION
    let lower_temp = temp_values[0];
    let upper_temp = temp_values[temp_values.length -1];

    for(let i = 0; i<temp_values.length; ++i)
    {
        if(temperature >= temp_values[i] && temperature <= temp_values[i+1])
        {
            lower_temp = temp_values[i];
            upper_temp = temp_values[i+1];
            break;
        }
    }

    //FUNCTION TO GET CORROSION RATE FROM TABLE
    function getRate(ph_val, temp_val)
    {
        const ph_key = ph_val.toString();
        const temp_key = temp_val.toString();
        return ci_conc_table_2b23[ph_key][temp_key];
    }

    //GET THE 4 CORNER VALUES FOR BILINEAL INTERPOLATION
    const rate_ph1_t1 = getRate(lower_ph, lower_temp);
    const rate_ph1_t2 = getRate(lower_ph, upper_temp);
    const rate_ph2_t1 = getRate(upper_ph, lower_temp);
    const rate_ph2_t2 = getRate(upper_ph, upper_temp);

    // BILINEAR INTERPOLATION TO APPROXIMATE THE VALUES ENTERED BY THE USER.
    let corrosion_rate;

    if(lower_ph === upper_ph && lower_temp === upper_temp)
    {
        corrosion_rate = rate_ph1_t1;
    }

    else if(lower_ph === upper_ph)
    {
        corrosion_rate = rate_ph1_t1 + 
            ((temperature - lower_temp) / (upper_temp - lower_temp)) * 
            (rate_ph1_t2 - rate_ph1_t1);
    }

    else if (lower_temp === upper_temp) {
        corrosion_rate = rate_ph1_t1 + 
            ((ph - lower_ph) / (upper_ph - lower_ph)) * 
            (rate_ph2_t1 - rate_ph1_t1);
    }

     else {
        // First interpolate along pH for both temperatures
        const rate_at_lower_temp = rate_ph1_t1 + 
            ((ph - lower_ph) / (upper_ph - lower_ph)) * 
            (rate_ph2_t1 - rate_ph1_t1);
            
        const rate_at_upper_temp = rate_ph1_t2 + 
            ((ph - lower_ph) / (upper_ph - lower_ph)) * 
            (rate_ph2_t2 - rate_ph1_t2);
        
        // Then interpolate along temperature
        corrosion_rate = rate_at_lower_temp + 
            ((temperature - lower_temp) / (upper_temp - lower_temp)) * 
            (rate_at_upper_temp - rate_at_lower_temp);
    }

    // Round to 2 decimal places
    corrosion_rate = Math.round(corrosion_rate * 100) / 100;

    console.log(`Corrosion Rate calculado: ${corrosion_rate} mpy`);
    
    // DISPLAY RESULT
    const result_element = document.getElementById("corrosion_rate_result");
    if(result_element) {
        result_element.classList.remove("hidden");
        result_element.textContent = `Corrosion Rate: ${corrosion_rate} mpy (at pH ${ph} and ${temperature}°F)`;
    } else 
    {
        result_element.classList.add("hidden");
    }

    return corrosion_rate;
}  

// Function responsible for converting the Cl concentration value from wppm to wt% and then applying interpolation to relate the obtained value with that of Table 2b25
function operations_crrate_tab2b25(avg_cl_concentration)
{

    // Get the user input to corrosion rate

    // Get the alloy selected by the user
    const alloy_select = document.getElementById("material_selected_tab2b25");

    // Get the table 4.1 for session storage and get the operating temperatura value
    const table_data_str = sessionStorage.getItem("table4.1_data");
    const table_data = JSON.parse(table_data_str);

    // already have the cl_concentration average value.

    // now interpolate the cl_concentration value with the function:
    var interpolated_clvalue = interpolate_cl_concentration(avg_cl_concentration);

    // Relation of the temp inputted by the user in the table and the temps shown in the table2b25.
    
    // Get the representation of the temp by the user (F° o C°)

    let temperature = parseFloat(table_data.operating_temp);

    var temp_selected = document.getElementById("temp_selected_tab2b25");
    var new_temp_value;
    var temp_in_f_available = [100, 125, 175, 200];
    var temp_in_c_available = [38, 52, 79, 93];

    temp_selected.addEventListener("change", function(){
        switch (temp_selected.value) {
            case "farenheit":
            
                // Compare the value given by the user and round it to the available values.
                
                // Get if the value inputted by ther user is in the array

                for(let i = 0; i<temp_in_f_available.length; ++i)
                {
                    if (temperature == temp_in_f_available[i])
                    {
                        new_temp_value = temperature;

                    } else {

                        // Call the function round_nearest to get the value of the temp in table 2b25
                        new_temp_value = round_nearest(temp_in_f_available, temperature);
                    }
                
                }
                break;
            case "celsius":
                // Compare the value given by the user and round it to the available values.
                
                // Get if the value inputted by ther user is in the array

                for(let i = 0; i<temp_in_c_available.length; ++i)
                {
                    if (temperature == temp_in_c_available[i])
                    {
                        new_temp_value = temperature;

                    } else {

                        // Call the function round_nearest to get the value of the temp in table 2b25
                        new_temp_value = round_nearest(temp_in_c_available, temperature);
                    }
                
                }
                break;
            default:
                break;
        }

        // call the function to determine the cr of the component and store it in session storage variable
        let result_corrosion_rate;
        result_corrosion_rate = calc_corrosion_rate_tab2b25(alloy_select.value, new_temp_value, interpolated_clvalue, temp_selected.value);    
        sessionStorage.setItem("corrosion_rate", result_corrosion_rate);

        let cr_result_container = document.getElementById("estimated_cr_tab2b25");
        cr_result_container.classList.remove("hidden");
        cr_result_container.textContent = `Estimated corrosion rate for this component is: ${result_corrosion_rate} mpy`;
    })  

}

// This function gets the data in the table 2b22 and gets the cl concentration from the ph value.
function calculate_cl_from_ph()
{
    const ph_input = document.getElementById("ph_acidicwater");
    const cl_result_element = document.getElementById("cl_acidicwater");
    const message_error = document.getElementById("message_error");

    const ph_value = parseFloat(ph_input.value);

    // VALIDATIONS
    if(isNaN(ph_value))
    {
        message_error.classList.remove("hidden");
        message_error.textContent = "El valor del ph debe ser un número válido!";
        return;
    } else {
        message_error.classList.add("hidden");
    }

    if(ph_value < 0.5 || ph_value > 5.0)
    {
        message_error.classList.remove("hidden");
        message_error.textContent = "El ph debe estar entre 0.5 y 5.0 según la tabla 2.B.2.2";
        return;
    }

    let cl_concentration_range = null;


    for(let i = 0; i<ci_conc_table.ph.length; ++i)
    {
        const table_ph = ci_conc_table.ph[i];


        if(ph_value === table_ph)
        {
            cl_concentration_range = ci_conc_table.ci_concentration[i];
            break;
        }

        if (i < ci_conc_table.ph.length -1)
        {
            const next_ph = ci_conc_table.ph[i+1];

            if(ph_value > table_ph && ph_value < next_ph)
            {
                const current_range = ci_conc_table.ci_concentration[i];
                const next_range = ci_conc_table.ci_concentration[i+1];

                const current_mid = Array.isArray(current_range)
                    ? (current_range[0] + current_range[1]) / 2
                    : current_range;

                const next_mid = Array.isArray(next_range)
                    ? (next_range[0] + next_range[1]) / 2
                    : next_range;

                const interpolated_value = current_mid + ((ph_value - table_ph) / (next_ph - table_ph)) * (next_mid - current_mid);

                cl_concentration_range = Math.round(interpolated_value);
                break;

            }
        }
    }

    var avg_cl_concentration;

    if (cl_concentration_range !== null){
        cl_result_element.classList.remove("hidden");

        avg_cl_concentration = (cl_concentration_range[0]+cl_concentration_range[1])/2;

        if(Array.isArray(cl_concentration_range))
        {
            cl_result_element.textContent = `Cl concentration for ph ${ph_value}: ${cl_concentration_range[0]} - ${cl_concentration_range[1]} wppm`;
        } else {
            cl_result_element.textContent = `Cl concentration for ph: ${ph_value}: <= ${cl_concentration_range} wppm`;
        }

    } else {
        cl_result_element.classList.remove("hidden");
        cl_result_element.textContent = "The Cl⁻ concentration could not be determined for the entered pH."
    }

    return avg_cl_concentration;
}

// This function get the array and the temperature inputted by the user to round it to te nearest value
function round_nearest(array, temperature)
{
    let low = 0;
    let high = array.length -1;

    // Reduce the interval by binary search until the low value > high value
    while(low <= high)
    {
        let mid = Math.floor((low + high)/2);
        
        if (array[mid] == temperature) return array[mid]; // The value is in the array
        if (array[mid] < temperature) low = mid + 1; // Search in right
        else high = mid -1 ; // Search in left
    }

    let min_value = array[high] ?? array[0]; 
    let max_value = array[low] ?? array[array.length -1];

    return Math.abs(temperature - min_value) < Math.abs(temperature - max_value)
        ? min_value
        : max_value;

}

// This function interpolates the values inputted by the user to the ones in the table 2b25.
function interpolate_cl_concentration(avg_cl_concentration)
{
    // wt% available in the table 2b25
    var cl_concentration_wt = [0.50, 0.75, 1.0];

    // convert from wppm to wt%
    var conc_wt = avg_cl_concentration / 10000;

    for(let i = 0; i<cl_concentration_wt; ++i)
    {
        if(conc_wt == cl_concentration_wt[i]) return conc_wt;
    }

    // Binary search to get the values that surrounds the avg_cl_concentration
    let low = 0;
    let high = cl_concentration_wt.length - 1;

    while(low <= high )
    {
        const mid = Math.floor((low + high) / 2);
        if(cl_concentration_wt[mid] < conc_wt) low = mid +1;
        else high = mid -1;
    }

    // manage values out of range 
    if (conc_wt <= cl_concentration_wt[0]) return cl_concentration_wt[0];
    if (conc_wt >= cl_concentration_wt[cl_concentration_wt.length-1]) return cl_concentration_wt[cl_concentration_wt.length-1];

    // interpolate the value to the values in the array.
    const x0 = cl_concentration_wt[high];
    const x1 = cl_concentration_wt[low];

    const t = (conc_wt - x0) / (x1-x0);
    const interpolated = x0 + t * (x1-x0);

    return interpolated;

}

// This function calculates the corrosion rate of the component based in the data of the table 2b25 in the api581 file.
function calc_corrosion_rate_tab2b25(alloy_name, temperature, cl_concentration, measurement_unit)
{
    var obt_array;
    let corrosion_rate;

    // switch to evaluate the measurement_unit
    switch (measurement_unit) {
        case "farenheit":
            obt_array = ci_conc_table_2b25['temperature in f°'];

            // Get the Corrosion rate with the values
            for(let i = 0; i<obt_array.length; ++i)
            {
                // see if the alloy name is equals to material then checks the temperature to get the corrosion rate.
                if(obt_array[i].alloy == alloy_name && obt_array[i].cl_concentration == cl_concentration)
                {
                    for(let x in obt_array[i].temperature)
                    {
                        if(temperature == x)
                        {
                            corrosion_rate = obt_array[i].temperature[x];
                        }
                    }
                }
            }

            break;

        case "celsius":
            obt_array = ci_conc_table_2b25['temperature in c°'];

            for(let i = 0; i<obt_array.length; ++i)
            {
                if(obt_array[i].alloy == alloy_name && obt_array[i].cl_concentration == cl_concentration)
                {
                    for(let x in obt_array[i].temperature)
                    {
                        if(temperature == x)
                        {
                            corrosion_rate = obt_array[i].temperature[x];
                        }
                    }
                }
            }

            break;

        default:
            break;
    }
    
    return corrosion_rate;
}

