const dataInmobiliaria = require('../../componentes/dataInmobiliaria/obtainDataInmobilaria');

jest.spyOn(dataInmobiliaria, 'obtenerMetrosTotales').mockResolvedValue(62);

describe('Test de dataInmobiliaria',()=>{
    test('test metros', async ()=>{
        dataInmobiliaria.obtenerMetrosTotales.mockResolvedValue(62);
        const metros = await dataInmobiliaria.obtenerMetrosTotales('Iquique','3800-185');

        expect(metros).toBe(62)

        expect(dataInmobiliaria.obtenerMetrosTotales).toHaveBeenCalledWith('Iquique','3800-185');
    })
});

describe('Test de pruebas de comunas',()=>{
    test('test comuna maipú', ()=>{
        const codeComuna = dataInmobiliaria.getCodeComuna('Maipú');
        expect(codeComuna).toBe('14109');
    });
    test('test comuna Curacaví', ()=>{
        const codeComuna = dataInmobiliaria.getCodeComuna('Curacaví');
        expect(codeComuna).toBe('14603');
    });
})