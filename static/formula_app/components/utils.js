/**
 * UTILITY FUNCTIONS FOR FORMULA APP
 * This file contains shared utility functions that can be used across different modules
 */

/**
 * Rounds a temperature value to the closest available value in the provided array
 * 
 * @param {number[]} availableValues - Array of available temperature values (e.g., [450, 500, 550, 600])
 * @param {number} temperature - The temperature value to round
 * @returns {number} The closest available temperature value
 * 
 * @example
 * const temps = [450, 500, 550, 600];
 * roundToClosestValue(temps, 475); // Returns 500
 * roundToClosestValue(temps, 525); // Returns 550
 * roundToClosestValue(temps, 400); // Returns 450 (minimum)
 * roundToClosestValue(temps, 700); // Returns 600 (maximum)
 */
export function roundToClosestValue(availableValues, temperature) {
    // Validate inputs
    if (!Array.isArray(availableValues) || availableValues.length === 0) {
        throw new Error("availableValues must be a non-empty array");
    }

    if (typeof temperature !== 'number' || isNaN(temperature)) {
        throw new Error("temperature must be a valid number");
    }

    // Sort the array to ensure we have values in ascending order
    const sortedValues = [...availableValues].sort((a, b) => a - b);

    // If temperature is less than or equal to the minimum, return the minimum
    if (temperature <= sortedValues[0]) {
        return sortedValues[0];
    }

    // If temperature is greater than or equal to the maximum, return the maximum
    if (temperature >= sortedValues[sortedValues.length - 1]) {
        return sortedValues[sortedValues.length - 1];
    }

    // Find the closest value
    let closestValue = sortedValues[0];
    let minDifference = Math.abs(temperature - sortedValues[0]);

    for (let i = 1; i < sortedValues.length; i++) {
        const difference = Math.abs(temperature - sortedValues[i]);

        if (difference < minDifference) {
            minDifference = difference;
            closestValue = sortedValues[i];
        }
    }

    return closestValue;
}
