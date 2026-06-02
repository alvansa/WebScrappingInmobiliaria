
class EconomicosSource {
    constructor() {

    }

    getName() {return "Economicos";}

    async fetch(startDate, endDate, options) {
        return [];
        const { event, mainWindow, emptyMode, testMode } = options;
        const Economico = require('../economico/Economico.js');
        const economico = new Economico();
        return await economico.getCases(startDate, endDate, { event, mainWindow, emptyMode, testMode });
    }
}

module.exports = EconomicosSource;