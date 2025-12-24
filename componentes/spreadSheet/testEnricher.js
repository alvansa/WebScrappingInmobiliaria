const SpreadSheetManager = require('./SpreadSheetManager');
const DataEnricher = require('./DataEnricher');
const CasoBuilder = require('../caso/casoBuilder');
const config = require('../../config');


async function main(){
    
    const casoTestCausa = new CasoBuilder(new Date(), "PJUD", config.PJUD)
        .conCausa('C-14045-2024')
        .conJuzgado('27° SANTIAGO')
        .conMontoMinimo(999999)
        .construir();

    const casoTestRol = new CasoBuilder(new Date(), "PJUD", config.PJUD)
        .conComuna('Osorno')
        .conRol('481-34-43')
        .construir();

    const caso1 = new CasoBuilder(new Date(), 'PJUD', config.PJUD)
        .conCausa('C-4835-2024')
        .conJuzgado('2° JUZGADO DE LETRAS DE LOS ANGELES')
        .construir();

    const casoRol2 = new CasoBuilder(new Date(), "PJUD", config.PJUD)
        .conComuna('Santiago')
        .conRol('324-415')
        .construir();

    const casos = [caso1, casoRol2];
    const data = await SpreadSheetManager.processData(false);
    const enricher = new DataEnricher();
    enricher.enrichWithSpreadsheetData(casos, data);

    for(let caso of casos){
        console.log(caso.toObject());
        console.log('-------------------');
    }

}
main();