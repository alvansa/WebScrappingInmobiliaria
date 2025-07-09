const Caso = require('../../componentes/caso/caso');
const {procesarDatosRemate, normalizeDescription} = require('../../componentes/economico/datosRemateEmol');

const {ex1857,ex1666} = require('../textos/Extracto');

describe('procesarDatosRemate',()=>{
    test('Caso C-1857-2024',()=>{
        const caso1857 = new Caso();
        const normalizedText = normalizeDescription(ex1857);
        caso1857.texto = normalizedText;
        procesarDatosRemate(caso1857);
        expect(caso1857.formatoEntrega).toEqual('vale vista');
        expect(caso1857.causa).toEqual('C-1857-2024');
    });
    // test('Caso C-1666-2014',()=>{
    //     const caso1666 = new Caso();
    //     const normalizedText = normalizeDescription(ex1666);
    //     caso1666.texto = normalizedText;
    //     procesarDatosRemate(caso1666);
    //     expect(caso1666.formatoEntrega).toEqual('vale vista');
    //     expect(caso1666.causa).toEqual('C-1666-2014');
    //     expect(caso1666.montoMinimo).toEqual({
    //         monto: 1031.99465,
    //         moneda: 'UF'
    //     });
    // });
});


function createCase(causa,juzgado){
    const caso1 = new Caso("1/1/2025");
    caso1.causa = causa;
    caso1.juzgado = juzgado;
    return caso1;
}