/**
  * Convert an alpha value to its hexadecimal representation.
  * @param {number} alpha - Alpha value in the range [0, 1].
  * @return {string} Hexadecimal representation of the alpha value.
  */
function alphaToHex(alpha) {
  return Math.floor(alpha * 255).toString(16).padStart(2, 0);
}

/**
  * Determine the position of a point on a circunference 
  * (starting at the upmost point and moving in a clockwise direction).
  * @param {number} diameter - Diameter of the circunference.
  * @param {number} index - Index of the point.
  * @param {number} count - Total number of points.
  * @return {Object} Position x and y of the point on the circunference.
  */
function circunferencePosition(diameter, index, count) {
  let angle = (2 * Math.PI * index) / count - (Math.PI / 2);
  
  return {
    x: (diameter / 2) * Math.cos(angle),
    y: (diameter / 2) * Math.sin(angle),
  };
}
