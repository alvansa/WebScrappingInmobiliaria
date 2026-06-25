const SpreadSheetManager = require('#enrichers/spreadSheet/SpreadSheetManager.js');
const DataEnricher = require('#enrichers/spreadSheet/DataEnricher.js');
const { tribunales2 } = require('#models/caso/datosLocales.js');

class SpreadSheetEnricher {
    constructor() {
        this.data = null;
        this.enricher = new DataEnricher();
    }

    getName() {return "SpreadSheetEnricher";}

    async obtain(){
        const response = await SpreadSheetManager.processData();
        if(response.result){
            this.data = response.data;
        }else{
            this.data = null;
        }
    }

    async enrich(causas) {
        if(this.data == null){
            return false;
        }
        this.enricher.enrichWithSpreadsheetData(causas, this.data);
        return true;

    }
}

module.exports = SpreadSheetEnricher;