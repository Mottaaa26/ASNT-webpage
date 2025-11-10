/**
 * THIS FILE IS RESPONSIBLE FOR HANDLING THE INCLUDES WITHIN THE HTML STEPS TO CHANGE STEP WHEN PRESSING THE NEXT AND PREVIOUS BUTTONS
 */

const MAX_STEP = 14;
const STEP_BASE_PATH = 'load-step/';

let actual_step = parseInt(sessionStorage.getItem('actual_step') || 1);
const stepContainer = document.getElementById("actual_step");
const btn_next = document.getElementById("btn_next");
const btn_anterior = document.getElementById("btn_anterior");
const message_error = document.getElementById("message_error");


async function loadStepContent(stepNumber) {
    
    const filePath = `${STEP_BASE_PATH}${stepNumber}`;
    console.log(`INFO: cargando el contenido del paso ${filePath}`);

    try {
        const response = await fetch(filePath);
        if(!response.ok)
        {
            console.error(`Eror al cargar el paso ${stepNumber}: Archivo no encontrado.`);
            
            if(message_error)
            {
                message_error.innerHTML = error.message;
                message_error.classList.remove("hidden");
            }

            return `<div class="p-4 bg-red-100 text-red-700 rounded-lg">Error: No se pudo cargar el contenido del paso ${stepNumber} (${filePath}).</div>`;
        }
        return await response.text();
    } catch (error) {
        console.error('Error de red durante la carga del paso: ', error);
        return `<div class="p-4 bg-red-100 text-red-700 rounded-lg">Error de red. Verifique la ruta del archivo.</div>`;
    }
}


async function renderStep() {
    const htmlContent = await loadStepContent(actual_step);
    stepContainer.innerHTML = htmlContent;

    btn_anterior.disabled = (actual_step <= 1);
    btn_next.disabled = (actual_step >= MAX_STEP);

    sessionStorage.setItem('actual_step', actual_step);

    executeInjectedScripts(stepContainer);
}

function executeInjectedScripts(container) {
    const scripts = container.querySelectorAll('script');
    scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        
        Array.from(oldScript.attributes).forEach(attr => {
            newScript.setAttribute(attr.name, attr.value);
        });

        if(oldScript.textContent)
        {
            newScript.textContent = oldScript.textContent;
        }

        if(oldScript.parentNode)
        {
            oldScript.parentNode.replaceChild(newScript, oldScript);
        }

    })
}


btn_next.onclick = function() {
    if(actual_step < MAX_STEP)
    {
        actual_step++;
        renderStep();
    }
}

btn_anterior.onclick = function() {
    if(actual_step > 1)
    {
        actual_step--;
        renderStep();
    }
}

document.addEventListener('DOMContentLoaded', renderStep);
