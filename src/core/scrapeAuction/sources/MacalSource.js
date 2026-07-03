

class MacalSource {
    constructor() {

    }
    
    getName() { return 'macal'; }

    async fetch(startDate, endDate, { event, mainWindow, emptyMode, testMode }) {
        return [];
    }
}


module.exports = MacalSource;