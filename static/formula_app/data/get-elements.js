
document.addEventListener("DOMContentLoaded", function(){
    const equipmentSelect = document.getElementById("equipment");
    const componentSelect = document.getElementById("component");


    const has_cladding = document.getElementById("has_cladding");
    const cladding_row = document.getElementById("cladding_row");
    const cladding_input = document.getElementById("cladding_input");

    const has_internal_liner = document.getElementById("has_internal_liner");
    const internal_liner_row = document.getElementById("internal_liner_row");
    const internal_liner_input = document.getElementById("internal_liner_input");

    
    has_cladding.addEventListener("change", function(){

        const isYes = this.value === "yes";

        if(!cladding_row)
        {
            console.error("Error");
            return;
        }

        if(isYes)
        {
            cladding_row.classList.remove("hidden");
            if(cladding_input)
            {
                cladding_input.setAttribute("required", "required");
            }
        } else {
            cladding_row.classList.add("hidden");
            if(cladding_input)
            {
                cladding_input.removeAttribute("required");
                cladding_input.value = 0;
            }
        }

    });

    has_internal_liner.addEventListener("change", function(){

        const isYes = this.value === "yes";
        if(!internal_liner_row)
        {
            console.error("Error");
            return;
        }

        if(isYes)
        {
            internal_liner_row.classList.remove("hidden");
            if(internal_liner_input)
            {
                internal_liner_input.setAttribute("required", "required");
            }
        } else {
            internal_liner_row.classList.add("hidden");
            if(internal_liner_input)
            {
                internal_liner_input.removeAttribute("required");
                internal_liner_input.value = 0;
            }
        }

    });
    

    equipmentSelect.addEventListener("change", function(){
        const equipmentId = this.value;

        componentSelect.innerHTML = '<option value="">Select component</option>';
        if (!equipmentId) return;


        fetch(`get-components/?equipment_id=${equipmentId}`)
            .then(response => response.json())
            .then(data => {
                data.forEach(component => {
                    const option = document.createElement("option");
                    option.value = component.id;
                    option.textContent = component.name;
                    componentSelect.appendChild(option);
                });
            })
            .catch(error => console.error("Error fetching components: ", error));
    });


});
