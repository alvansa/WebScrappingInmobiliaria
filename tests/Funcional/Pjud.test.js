
const {ex1666} = require('../textos/Extracto'); 
const Caso = require('../../componentes/caso/caso');
const PjudPdfData = require('../../componentes/pjud/PjudPdfData');

describe('Test de funcionalidad Pjud a normalizacion',() => {
    test('Obtener monto minimo de postura de un extracto', () => {
        const caso1666 = new Caso(new Date(), new Date(), 'lgr', 2);
        caso1666.texto = ex1666;
        const testPjudPdf = new PjudPdfData(caso1666);
        testPjudPdf.processInfo(ex1666);
        const casoObj = caso1666.toObject();
        expect(casoObj.montoMinimo).toEqual(1031.99465);
    });

});