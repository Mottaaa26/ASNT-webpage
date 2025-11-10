
document.getElementById("corr_method").addEventListener("change", function(){

    var selected = document.getElementById("corr_method").value;
    document.getElementById("calc_method").classList.add("hidden");
    document.getElementById("measured_method").classList.add("hidden");
    document.getElementById("est_method").classList.add("hidden");


    // THE USER HAS TO ESPECIFIE THE METHOD TO GET THE CORROSION RATE OF THE COMPONENT SELECTED.

    switch (selected) {
        case 'calculated':
            document.getElementById("calc_method").classList.remove("hidden");
            break;
        case 'measured':
            document.getElementById("measured_method").classList.remove("hidden");
            
            document.getElementById("cr_measured_btn").onclick = function(){

                const step2Data = {
                    'current_thickness': document.getElementById("act_thickness").value,
                    'current_date': new Date(document.getElementById("act_date").value),
                    'previous_thickness': document.getElementById("ant_thickness").value,
                    'previous_date': new Date(document.getElementById("ant_date").value),
                }

                const current_t = parseFloat(step2Data.current_thickness);
                const previous_t = parseFloat(step2Data.previous_thickness);

                var message = document.getElementById("message_error");
                message.classList.add("hidden");
                
                //validations
                if(isNaN(step2Data.current_thickness) || isNaN(step2Data.previous_thickness) || isNaN(step2Data.current_date.getTime()) || isNaN(step2Data.previous_date.getTime()))
                {
                    console.Error("Error. Check if all the values are correct.");
                    message.classList.remove("hidden");
                    message.textContent = `Error. Check if all the values are correct. (including dates)`;
                    return;
                }

                if(step2Data.previous_date > step2Data.current_date)
                {
                    console.error("Error. Previous date must be earlier than the current date.");
                    message.classList.remove("hidden");
                    message.textContent = `Error. The previous date can't be earlier than current date.`;
                    return;
                }

                if(step2Data.previous_thickness < step2Data.current_thickness)
                {
                    sessionStorage.setItem('comp_corrosion_rate', 0);
                    let text_result = document.getElementById("cr_measured_result");
                    text_result.classList.remove("hidden");
                    text_result.innerHTML = `C<sub>r</sub> = 0 (thickness without loss)`;
                    return;
                }

                //Calculation of Cr.

                const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

                let time_diff_ms = step2Data.current_date.getTime() - step2Data.previous_date.getTime();
                let time_in_years = time_diff_ms/ MS_PER_YEAR;

                if (time_in_years <= 0)
                {
                    console.error("Error. The time interval must be greater than zero.");
                    message.classList.remove("hidden");
                    message.textContent = `Error. The time interval must be greater than zero.`;
                    return;
                }

                let delta_thickness = previous_t - current_t;
                let result = delta_thickness / time_in_years;

                sessionStorage.setItem('comp_corrosion_rate', result.toFixed(3));
                sessionStorage.setItem('step2_data', JSON.stringify(step2Data));

                var text_result = document.getElementById("cr_measured_result");
                text_result.classList.remove("hidden");
                text_result.innerHTML = `C<sub>r</sub> = ${sessionStorage.getItem('comp_corrosion_rate')} mm/year`; 
            };

            break;

        case 'estimated':
            document.getElementById("est_method").classList.remove("hidden");
            break;
        default:
            break;
    }
})

function save_data(){
    sessionStorage.setItem
}
