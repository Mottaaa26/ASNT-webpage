/**
 * This file contains the calculations and functions necessary to make step 2 work correctly.
 */

/**
 * This function provides functionality to the dropdown, as well as allowing calls to the URLs defined in the views.py file to obtain the different templates for the available options
 */

import { hci_corrosion_calc } from "./modules-step2/hci_corrosion_calcs.js";


// URL TO GET THE JSON WITH THE TABLE
export const tables_data = 
{
    table_2b22: '/static/formula_app/data/json/table_2-B-2-2.JSON',
    table_2b23: '/static/formula_app/data/json/table_2-B-2-3.JSON',
    table_2b25: '/static/formula_app/data/json/table_2b25.JSON'
}


// LOAD THE JSON FILES TO USE THEM TROUGHT THE STEP
class TableLoader
{
    constructor(){
        this.tables =  {
            ci_conc_table: null,
            ci_conc_table_2b23: null,
            ci_conc_table_2b25: null
        }
    }

    async loadAll()
    {
        try {
            
            const [table1, table2, table3] = await Promise.all([
                fetch(tables_data.table_2b22).then(r => r.json()),
                fetch(tables_data.table_2b23).then(r => r.json()),
                fetch(tables_data.table_2b25).then(r => r.json())
            ])

            this.tables.ci_conc_table = table1;
            this.tables.ci_conc_table_2b23 = table2;
            this.tables.ci_conc_table_2b25 = table3;

        } catch (error) {
            console.error(`failed to load the tables. Error: ${error}`);
            throw error;
        }
    }

    getTables()
    {
        return this.tables;
    }
}

const table_loader = new TableLoader();
await table_loader.loadAll();

// export the tables for the modules to use it.s
export const tables = table_loader.getTables();

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
