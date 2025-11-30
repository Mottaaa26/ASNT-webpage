/*
    This file is responsible for the persistence of the values
    the user enters in the inputs.
*/ 

document.addEventListener('DOMContentLoaded', async function(){
    console.log("INFO: initializing the loading of persistent data");

    // CHECK IF TABLE4.1_DATA HAS DATA
    if(sessionStorage.getItem('table4.1_data'))
    {
        // CHECK THAT THE INSTANTIATED FUNCTION IS OF TYPE 'FUNCTION
        // IF SO, IT LOADS.
        if(typeof loadTable41 === 'function') {
           await loadTable41();
        }
    }
    
})
