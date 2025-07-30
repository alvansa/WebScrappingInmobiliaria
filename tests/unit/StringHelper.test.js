const StringHelper = require('../../componentes/caso/Normalizers/StringHelper');

const PJUD = 2;


describe('Test de partes',()=>{
    test('Partes nulas',()=>{
        expect(StringHelper.partes(null,null)).toBeNull();
    });
});