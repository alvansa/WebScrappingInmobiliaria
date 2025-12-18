const BOLETIN = require('../textos/Boletin');
const ProcesarBoletin = require('../../componentes/liquidaciones/procesarBoletin');
const CasoBuilder = require('../../componentes/caso/casoBuilder');
const config = require('../../config');
const { extractPercent } = require('../../componentes/economico/extractors/percentExtractor');

const LIQUIDACIONES = config.LIQUIDACIONES;

const ProcessBoletin = new ProcesarBoletin(null,null,null)


describe('Test de leer boletin concursal directo', ()=>{

    test('test de caso C-3013-2025', ()=>{
        const caso3013 = new CasoBuilder(null, null, null)
            .conOrigen(LIQUIDACIONES)
            .construir()
        ProcessBoletin.obtainDataRematesPdf(BOLETIN.BOL3013, caso3013);
        expect(caso3013.causa).toEqual('C-3013-2025');
        expect(caso3013.fechaRemate).toEqual(new Date('2025/08/28'));
        expect(caso3013.juzgado).toEqual('7º juzgado civil de santiago');
        expect(caso3013.anno).toEqual(2020);
        expect(caso3013.montoMinimo).toEqual(78230000);
        expect(caso3013.moneda).toEqual('Pesos');
    });

    test('test de caso C-3111-11111', ()=>{
        const caso3013 = new CasoBuilder(null, null, null)
            .conOrigen(LIQUIDACIONES)
            .construir()
        ProcessBoletin.obtainDataRematesPdf(BOLETIN.BOL3013, caso3013);
        // caso3013.montoMinimo = {monto : 12345, moneda : 'Pesos'};
        expect(caso3013.montoMinimo).toEqual(78230000);
        expect(caso3013.moneda).toEqual('Pesos');
    });

    test('Test de caso C-17471-2024 que obtuvo la comuna Aisen', ()=>{
        const caso17471 = new CasoBuilder(null,null,LIQUIDACIONES, null)
            .conOrigen(LIQUIDACIONES)
            .conCausa('C-17471-2024')
            .conJuzgado('10 santiago')
            .construir();
        ProcessBoletin.obtainDataRematesPdf(BOLETIN.BOL17471, caso17471);
        expect(caso17471.comuna).toBe('San Joaquín');
    })
});
