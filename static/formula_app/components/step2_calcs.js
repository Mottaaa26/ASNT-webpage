/**
 * This file contains the calculations and functions necessary to make step 2 work correctly.
 */

/**
 * This function provides functionality to the dropdown, as well as allowing calls to the URLs defined in the views.py file to obtain the different templates for the available options
 */

/**
 * THIS BLOCK OF CODE GETS THE OPTION SELECTED AND GETS THE HTML TO DISPLAY IT.
 */
var selected_option;
document.addEventListener("click", (e) => {
    const item = e.target.closest(".list-row");
    if (item) {
        selected_option = item.dataset.value.toLowerCase();
        console.log("Opcion seleccionada: ", selected_option);

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
    
    const ci_conc_table = {};

    select.addEventListener("change", function(){
        const op = this.value;
        if(op === "yes"){

            ph_known_container.classList.remove("hidden");
            ph_known.addEventListener("change", function(){
                const op = this.value;
                if(op === "no")
                {
                    ci_calc_container.classList.remove("hidden");
                    var ci_concentration_value = ci_concentration.value;
                    
                    fetch("static/formula_app/json/table_2-B-2-2.json")
                        .then(response => response.json())
                        .then(data => ci_conc_table);

                    
                }
            })

        } else {
            ph_known_container.classList.add("hidden");
        }
    });

}
