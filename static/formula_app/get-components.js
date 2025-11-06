
document.addEventListener("DOMContentLoaded", function(){
    const equipmentSelect = document.getElementById("equipment");
    const componentSelect = document.getElementById("component");

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
