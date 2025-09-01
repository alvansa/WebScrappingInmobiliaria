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
        expect(caso3013.montoMinimo).toEqual({
            monto: 78230000,
            moneda : 'Pesos'
        });
    });

    test('test de caso C-3111-11111', ()=>{
        const caso3013 = new CasoBuilder(null, null, null)
            .conOrigen(LIQUIDACIONES)
            .construir()
        ProcessBoletin.obtainDataRematesPdf(BOLETIN.BOL3013, caso3013);
        caso3013.montoMinimo = {monto : 12345, moneda : 'Pesos'};
        expect(caso3013.montoMinimo).toEqual({
            monto: 12345,
            moneda : 'Pesos'
        });
    });
});
