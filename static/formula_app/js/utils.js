/**
 * Centralized Utility Functions for Formula App
 */

/**
 * Validates a list of input elements.
 * Checks if value is present and not empty.
 * Optional: Adds/removes 'input-error' class for visual feedback.
 * 
 * @param {Array<HTMLElement>} inputs - Array of input/select elements to validate.
 * @returns {boolean} - True if all inputs are valid, false otherwise.
 */
export function validateInputs(inputs) {
    let allValid = true;
    inputs.forEach(inp => {
        if (!inp) return; 
        
        const val = inp.value;
        if (!val || val.trim() === '') {
            allValid = false;
            // Optional: Visual feedback
            inp.classList.add('input-error');
        } else {
            inp.classList.remove('input-error');
        }
    });
    return allValid;
}
