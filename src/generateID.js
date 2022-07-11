// TODO: 1 - Z instead of 1 - F?
const generateID = (excludedIds) => {
  // TODO: check against existing IDs

  const min = 4369; // Hex: 1111
  const max = 65535; // Hex: FFFF
  const decimalID = Math.floor(Math.random() * (max - min + 1)) + min; // decimal from min (inclusive) - max (inclusive)
  const hexID = decimalID.toString(16).toUpperCase(); // convert decimal to hexadecimal

  return hexID;
};

module.exports.getID = generateID;