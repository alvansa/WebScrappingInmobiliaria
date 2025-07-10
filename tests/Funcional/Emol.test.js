const Caso = require('../../componentes/caso/caso');
const {procesarDatosRemate, normalizeDescription} = require('../../componentes/economico/datosRemateEmol');

const {ex1857,ex1666, ex800} = require('../textos/Extracto');

describe('procesarDatosRemate',()=>{
    test('Caso C-1857-2024',()=>{
        const caso1857 = new Caso();
        const normalizedText = normalizeDescription(ex1857);
        caso1857.texto = normalizedText;
        procesarDatosRemate(caso1857);
        expect(caso1857.formatoEntrega).toEqual('vale vista');
        expect(caso1857.causa).toEqual('C-1857-2024');
        expect(caso1857.comuna).toEqual('antofagasta');
        expect(caso1857.anno).toEqual('2013');
        expect(caso1857.montoMinimo).toEqual({
            monto: 83547301,
            moneda: 'Pesos'
        });
        expect(caso1857.porcentaje).toEqual(10);
        // expect(caso1857.diaEntrega).toEqual('dia habil anterior');
        expect(caso1857.partes).toEqual('Progarantía SAGR/ Constructora e Ingeniería Smot');
        expect(caso1857.fechaRemate).toEqual(new Date('2025/07/08'));
    });

    test('Caso C-1666-2014',()=>{
        const caso1666 = new Caso();
        const normalizedText = normalizeDescription(ex1666);
        caso1666.texto = normalizedText;
        procesarDatosRemate(caso1666);
        expect(caso1666.formatoEntrega).toEqual('vale vista');
        expect(caso1666.causa).toEqual('C-1666-2014');
        expect(caso1666.fechaRemate).toEqual(new Date('2025/07/17'));
        // expect(caso1666.diaEntrega).toEqual('dia viernes anterior');
        expect(caso1666.partes).toEqual('Fondo de Inversion Larrain Vial con Castillo');
        // expect(caso1666.montoMinimo).toEqual({
        //     moneda: 'UF',
        //     monto: 1031.99465
        // });
    });

    test('Caso C-800-2025',()=>{
        const caso800 = new Caso();
        const normalizedText = normalizeDescription(ex800);
        caso800.texto = normalizedText;
        procesarDatosRemate(caso800);
        expect(caso800.formatoEntrega).toEqual('vale vista');
        expect(caso800.causa).toEqual('C-800-2025');
        expect(caso800.porcentaje).toEqual(10);
        expect(caso800.anno).toEqual('2005');
    });
});


function createCase(causa,juzgado){
    const caso1 = new Caso("1/1/2025");
    caso1.causa = causa;
    caso1.juzgado = juzgado;
    return caso1;
}