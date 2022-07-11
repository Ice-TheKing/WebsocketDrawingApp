/// return true if id is valid, false otherwise
const validateID = (id) => {
    if (id.length !== 4) {
        return false;
    }

    // convert to decimal
    const decimal = parseInt(id, 16);

    // should be between min and max
    const min = 4369;
    const max = 65535;

    if (!decimal || decimal < min || decimal > max) {
        return false;
    }

    return true;
};