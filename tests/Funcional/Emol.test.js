const Caso = require('../../componentes/caso/caso');
const {procesarDatosRemate, normalizeDescription} = require('../../componentes/economico/datosRemateEmol');

const {ex1857} = require('../textos/Extracto');

describe('procesarDatosRemate',()=>{
    test('Caso C-1857-2024',()=>{
        const caso1857 = new Caso();
        const normalizedText = normalizeDescription(ex1857);
        caso1857.texto = normalizedText;
        procesarDatosRemate(caso1857);
        expect(caso1857.formatoEntrega).toEqual('vale vista');
        expect(caso1857.causa).toEqual('C-1857-2024');
    });
});


function createCase(causa,juzgado){
    const caso1 = new Caso("1/1/2025");
    caso1.causa = causa;
    caso1.juzgado = juzgado;
    return caso1;
}