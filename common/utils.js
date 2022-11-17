function getRandomInRange(from, to, fixed) {
    return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
    // .toFixed() returns string, so ' * 1' is a trick to convert to number
}

function cloneObject(object) {
    return JSON.parse(JSON.stringify(object));
};

function getCurrentTime() {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

module.exports = {
    getRandomInRange: getRandomInRange,
    cloneObject: cloneObject,
    getCurrentTime: getCurrentTime
}
