const dataInmobiliaria = require('../../componentes/dataInmobiliaria/obtainDataInmobilaria');

describe('Test de dataInmobiliaria',()=>{
    
    jest.setTimeout(10000);

    test('test metros', async ()=>{
        const metros = await dataInmobiliaria.obtenerMetrosUtiles('Iquique','3800-185');
        expect(metros).toBe(62)
    });


    test('test metros con comuna con tilde', async ()=>{
        const metros = await dataInmobiliaria.obtenerMetrosUtiles('Maipú','780-17');
        expect(metros).toBe(35)
    })
});

describe('Test de metros Totales',()=>{
    test('test metros con comuna con tilde', async ()=>{
        const metros = await dataInmobiliaria.obtenerMetrosTotales('Maipú','780-17');
        expect(metros).toBe('143-171')
    });

});