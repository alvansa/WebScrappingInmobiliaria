const CapitalRemates = require('#sources/capitalRemates/capitalRemates.js');

class CapitalRematesSource {
    constructor(manager, logger) {
        this.manager = manager;
        this.logger = logger;
    }

    getName() {return "capitalremates";}

    async fetch(startDate, endDate, options) {
        try{
            const casos = await CapitalRemates.getRemates(startDate, endDate)
            return casos;
        }catch(error){
            this.logger.error(`No se obtuvieron los remates de Capital Remates error: ${error.message}`);
            return [];
        }
    }
}

module.exports = CapitalRematesSource;