/**
 * @function cursorColor
 * @description A deterministic hashing utility that maps an arbitrary string 
 * (UserID or Username) to a consistent HSL color.
 * * * KEY TECHNICAL CONCEPTS:
 * 1. Deterministic Output: Ensures the same input always produces the same 
 * visual identity, providing UI consistency in collaborative environments.
 * 2. Bitwise Hashing: Implements a lightweight string-to-integer hash algorithm 
 * (similar to Java's s[i]*31^(n-1-i)) for fast client-side execution.
 * 3. HSL Color Space: Utilizes Hue, Saturation, and Lightness to guarantee 
 * high-vibrancy, readable colors that remain visually distinct from the 
 * background UI.
 */

export const cursorColor = (str: string) => {
    let hash = 0;

    // Standard string hashing algorithm
    for(let i=0; i<str.length; i++){
        // Left shift and subtraction for fast integer distribution
        hash = str.charCodeAt(i) + ((hash<<5) - hash);
    }
    // Map the hash to the 360-degree Hue spectrum
    const h = Math.abs(hash %360);

    // Return HSL with fixed Saturation/Lightness for optimal UI contrast
    return `hsl(${h}, 70%, 60%)`;
}