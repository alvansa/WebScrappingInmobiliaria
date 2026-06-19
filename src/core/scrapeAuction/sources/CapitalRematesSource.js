const capitalRemates = require('#sources/capitalRemates/capitalRemates.js');

class CapitalRematesSource {
    constructor() {

    }

    getName() {return "capitalremates";}

    async fetch(startDate, endDate, options) {
        return [];

    }
}

module.exports = CapitalRematesSource;