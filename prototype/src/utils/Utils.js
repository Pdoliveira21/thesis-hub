/**
  * Convert an alpha value to its hexadecimal representation.
  * @param {number} alpha - Alpha value in the range [0, 1].
  * @return {string} Hexadecimal representation of the alpha value.
  */
export function alphaToHex(alpha) {
  return Math.floor(alpha * 255).toString(16).padStart(2, 0);
}

/**
  * Determine the position of a point on a circunference (starting at the upmost point and moving in a clockwise direction).
  * @param {number} diameter - Diameter of the circunference.
  * @param {number} index - Index of the point.
  * @param {number} count - Total number of points.
  * @return {Object} Cartesian position (x. y) of the point on the circunference and the respective theta angle, in radians.
  */
export function circunferencePosition(diameter, index, count) {
  let angle = (2 * Math.PI * index) / count - (Math.PI / 2);
  
  return {
    x: (diameter / 2) * Math.cos(angle),
    y: (diameter / 2) * Math.sin(angle),
    theta: angle,
  };
}

/**
 * Retrieve the value of a property from an object using a string representation of the property.
 * @param {Object} obj - Object from which to retrieve the property.
 * @param {string} str - String representation of the property. (including nested properties separated by dots)
 * @returns {any} Value of the property.
 */
export function accessObjectByString(obj, str) {
  return str.split('.').reduce((acc, key) => acc && acc[key], obj);
}

/**
 * Transform a string into its camel case representation - uppercase all string words.
 * @param {string} str - String to transform.
 * @returns {string} Camel case representation of the string.
 */
export function capitalizeStringWords(str) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Checks if the id represented by the string in the format <prefix>-<id> is equal to the value.
 * @param {string} str - String representation of the id.
 * @param {string} value - Value to compare with the id.
 * @returns {boolean} True if the id is equal to the value, false otherwise.
 */
export function compareStringId(str, value) {
  const parts = str.split('-');
  return parts.length >= 2 && parts[1] === value;
}

/**
 * Decode the HTML entities present in a string.
 * @param {string} str - String to decode.
 * @returns {string} Decoded string.
 */
export function decodeHtmlEntities(str) {
  return str.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
}

/**
 * Decode a string encoded in Windows-1252.
 * @param {String} str - String to decode.
 * @returns {String} Decoded string.
 */
export function decodeWindows1252(str) {
  const buffer = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    buffer[i] = str.charCodeAt(i);
  }

  return new TextDecoder('windows-1252').decode(buffer);
}
