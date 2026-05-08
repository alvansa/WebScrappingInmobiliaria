const scrapeAuction = require('../../componentes/Electron/prod/scrapeAuctions.js');
const SpreadsheetManager = require('../../componentes/spreadSheet/SpreadSheetManager.js');
const DataEnricher = require('../../componentes/spreadSheet/DataEnricher.js');
const logger = require('../../utils/logger.js');
const { createExcel } = require('../../componentes/excel/createExcel.js');

jest.mock('../../componentes/spreadSheet/SpreadSheetManager.js');
jest.mock('../../componentes/spreadSheet/DataEnricher.js');
jest.mock('../../componentes/excel/createExcel.js');
jest.mock('../../utils/logger.js');


describe('ScrapeAuction', () => {
    let scrapper;

    beforeEach(() =>{
        jest.clearAllMocks();
        scrapper = new scrapeAuction(
            '2024-01-01',
            '2024-01-31',
            'output.xlsx',
            {
                economico : true,
                pjud: true,
                boletin: true,
                macal: true,
                capitalRemates: true,
                PYL: true
            },
            null,
            false,
            null,
            false
        );

        SpreadsheetManager.processData.mockResolvedValue({data: []});
        // Mock de createExcel.writeData
        const mockExcel = { writeData: jest.fn().mockResolvedValue('/ruta/fake.xlsx') };
        createExcel.mockImplementation(() => mockExcel);
        // Mock de DataEnricher
        DataEnricher.prototype.enrichWithSpreadsheetData = jest.fn();
        jest.spyOn(scrapper, 'launchPuppeteer_inElectron').mockResolvedValue();
    })

    test('Proceso de scrapping con exito total', async() =>{

    });

    describe('Scrapping con fallos en fuentes', () => {
        test('Proceso de scrapping con Economico fallido', async () => {
            jest.spyOn(scrapper, 'getCasosPjud').mockResolvedValue([]);
            jest.spyOn(scrapper, 'getCasosMacal').mockResolvedValue([]);
            jest.spyOn(scrapper, 'getCapitalRemates').mockResolvedValue([]);
            jest.spyOn(scrapper, 'getCasosBoletin').mockResolvedValue([]);
            jest.spyOn(scrapper, 'getPublicosYLegales').mockResolvedValue([]);
            // jest.spyOn(scrapper, 'getCasosEconomico').mockResolvedValue([]);
            jest.spyOn(scrapper, 'getCasosEconomico').mockRejectedValue(new Error('Error de red'));
            const resultado = await scrapper.startSearch();
            // await expect(scrapper.startSearch()).toHaveBeenCalled();
            // expect(scrapper.getCasosEconomico).toHaveBeenCalledWith(
            //     scrapper.startDate,
            //     scrapper.endDate,
            //     scrapper.checkedBoxes.economico
            // );
            expect(resultado).toBe(6);
        });

        test('Proceso de scrapping con Pjud fallido', async () => {
            jest.spyOn(scrapper, 'getCasosEconomico').mockResolvedValue([]);
            jest.spyOn(scrapper, 'getCasosMacal').mockResolvedValue([]);
            jest.spyOn(scrapper, 'getCapitalRemates').mockResolvedValue([]);
            jest.spyOn(scrapper, 'getCasosBoletin').mockResolvedValue([]);
            jest.spyOn(scrapper, 'getPublicosYLegales').mockResolvedValue([]);
            // jest.spyOn(scrapper, 'getCasosEconomico').mockResolvedValue([]);
            jest.spyOn(scrapper, 'getCasosPjud').mockRejectedValue(new Error('Error de red'));
            const resultado = await scrapper.startSearch();
            // await expect(scrapper.startSearch()).toHaveBeenCalled();
            // expect(scrapper.getCasosEconomico).toHaveBeenCalledWith(
            //     scrapper.startDate,
            //     scrapper.endDate,
            //     scrapper.checkedBoxes.economico
            // );
            expect(resultado).toBe(6);

        });

        test('Proceso de scrapping con Boletin fallido', async () => {

        });

        test('Proceso de scrapping con Macal fallido', async () => {

        });

        test('Proceso de scrapping con CapitalRemates fallido', async () => {

        });

        test('Proceso de scrapping con CapitalRemates fallido', async () => {

        });
    });

});