/**
 * This file contains the calculations and functions necessary to make step 2 work correctly.
 */

/**
 * This function provides functionality to the dropdown, as well as allowing calls to the URLs defined in the views.py file to obtain the different templates for the available options
 */
document.addEventListener("DOMContentLoaded", () => {

    // Call the necesary objets from the DOM by their id.
    const content_container = document.getElementById("content_container");
    const selected_text_span = document.getElementById("selected_text");
    const options_menu = document.getElementById("options_menu");
    const dropdown_opener = document.getElementById("dropdown_opener");

    options_menu.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if(!link) return;

        e.preventDefault();
        const snippetName = link.getAttribute('data-value');
        const url = `/cargar-cr-snippet/${snippetName}/`;

        selected_text_span.textContent = link.textContent.trim();
        
        content_container.classList.remove("hidden");

        fetch(url)
            .then (response => {
                if(!response.ok)
                {
                    throw new Error("The response wasn't okay");
                }
                return response.text();   
            })
            .then(html => {
                content_container.innerHTML = html;
            })
            .catch(error => {
                content_container.innerHTML = `<p class="text-error text-center py-4">Error al cargar: ${error.message}</p>`
                console.error("Error fetching snippet: ", error);
            });
    });
});
