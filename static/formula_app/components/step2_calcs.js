/**
 * This file contains the calculations and functions necessary to make step 2 work correctly.
 */

/**
 * This function provides functionality to the dropdown, as well as allowing calls to the URLs defined in the views.py file to obtain the different templates for the available options
 */

// URL TO GET THE JSON WITH THE TABLE
const TABLE_DATA_URL2b22 = '/static/formula_app/data/json/table_2-B-2-2.JSON';
const TABLE_DATA_URL2b23 = '/static/formula_app/data/json/table_2-B-2-3.JSON';

// LOAD THE JSON FILES TO USE THEM TROUGHT THE STEP
let ci_conc_table = null;
let ci_conc_table_2b23 = null;

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
    const temp_in_f = document.getElementById("temp_in_f");
    let ph_result = null;

    select.addEventListener("change", function(){
        const op = this.value;
        if(op === "yes"){

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

