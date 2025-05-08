const {procesarDatosRemate,getJuzgado} = require('../economico/datosRemateEmol');
const Caso = require('../caso/caso');
const casos = require('./casosTest');
// const CasoMock = require('./mocks');
const { getReadableFromProtocolStream } = require('puppeteer');
// const helpers = require('./helpers');



describe('Revisar el getJuzgado', () => {
    it('Debería devolver el juzgado correcto', () => {
        const texto = casos[0];
        const resultado = getJuzgado(texto);
        expect(resultado).toBe('29° JUZGADO CIVIL DE SANTIAGO');
    })
    it('Deberia devolver null si no encuentra el juzgado', () => {
        const texto = "No hay juzgado aquí";
        const resultado = getJuzgado(texto);
        expect(resultado).toBe(null);
    })
});


