const PjudPdfData = require('../../componentes/pjud/PjudPdfData');
const Caso = require('../../componentes/caso/caso');
const createExcel = require('../../componentes/excel/createExcel')


const {textoEstacionamiento1,textoHabitacional1, textoBodegaMultiple, textoEstacionamientoMultiple, textoHabitacionMultiple} = require('./textos/Avaluo');
const {textoGP1, textoGP2, textoGP3, textoGP4, textoGP5, texto12Santiago} = require('./textos/GP');
const {diario2484} = require('./textos/diario');
const {tx356, tx23039, tx12017, tx1349} = require('./textos/DV');
const { experiments } = require('webpack');

const excelConstructor = new createExcel("","","","",false,1);
const testCaso = createCase("1111-2024", '1º Juzgado de Letras de Buin');
const caso2484 = createCase("C-2484-2023","3º Juzgado de Letras de Iquique");
const testPjudPdf = new PjudPdfData(testCaso)
const pjudPdf2484 = new PjudPdfData(caso2484);



describe('obtainRolPropiedad', () => {

    test('Caso lectura de null', () =>{
        const resRol = testPjudPdf.obtainRolPropiedad(null);
        expect(resRol).toBeNull();
    });

    test('debería retornar null cuando el texto contiene "inscripcion"', () => {
        const texto = "Este es un texto con inscripcion pero sin rol de avalúo";
        const resultado = testPjudPdf.obtainRolPropiedad(texto);
        expect(resultado).toBeNull();
    });

    test('Deberia retornar el rol y bien raiz estacionamiento', () => {
        const textoNormalizado = testPjudPdf.normalizeInfo(textoEstacionamiento1)
        const resultado = testPjudPdf.obtainRolPropiedad(textoNormalizado);

        expect(resultado).toEqual({
            tipo: "destino del bien raiz: estacionamiento",
            rol: "00546 - 00618"
        });
    });

    test('Deberia retornar el rol y bien raiz habitacional', () => {
        const textoNormalizado = testPjudPdf.normalizeInfo(textoHabitacional1);
        const resultado = testPjudPdf.obtainRolPropiedad(textoNormalizado);
        expect(resultado).toEqual({
            tipo : 'destino del bien raiz: habitacional',
            rol : '00546 - 00066'
        });
    });

    test('Deberia retornar el rol y bien raiz bodega', () => {
        const textoNormalizado = testPjudPdf.normalizeInfo(textoBodegaMultiple);
        const resBodega = testPjudPdf.obtainRolPropiedad(textoNormalizado);
        expect(resBodega).toEqual({
            tipo : 'destino del bien raiz: bodega',
            rol : '03795 - 00368'
        });
    });

    test('Deberia retornar null cuando no encuentra algo parecido', () => {
        const textoNormalizado = testPjudPdf.normalizeInfo(textoGP1);
        const resRol = testPjudPdf.obtainRolPropiedad(textoNormalizado);
        expect(resRol).toBeNull();
    });
});

describe('ObtainAvaluoPropiedad', () =>{
    test('Deberia obtener el avaluo de habitacional', () =>{
        const textoNormalizado = testPjudPdf.normalizeInfo(textoHabitacionMultiple);
        const resAvaluo = testPjudPdf.obtainAvaluoPropiedad(textoNormalizado);
        expect(resAvaluo).toEqual({
            avaluo: "59921526",
            tipo: "destino del bien raiz: habitacional"
        });
    });

    test('Deberia obtener el avaluo estacinamiento', () =>{
        const textoNormalizado = testPjudPdf.normalizeInfo(textoEstacionamientoMultiple);
        const resAvaluo = testPjudPdf.obtainAvaluoPropiedad(textoNormalizado);
        expect(resAvaluo).toEqual({
            avaluo: "4426829",
            tipo: "destino del bien raiz: estacionamiento",
        });
    });

    test('Deberia obtener el avaluo de la bodega', () =>{
        const textoNormalizado = testPjudPdf.normalizeInfo(textoBodegaMultiple);
        const resAvaluo = testPjudPdf.obtainAvaluoPropiedad(textoNormalizado);
        expect(resAvaluo).toEqual({
            avaluo: "865771",
            tipo: "destino del bien raiz: bodega",
        });
    });

    test('Prueba con gp para obtener nulo', ()=>{
        const textoNormalizado = testPjudPdf.normalizeInfo(textoGP1);
        const resAvaluo = testPjudPdf.obtainAvaluoPropiedad(textoNormalizado);
        expect(resAvaluo).toBeNull();
    });

});

describe('obtainDerecho', () => {
    test('Test basico 1 usufructo ', () =>{
        const info = testPjudPdf.normalizeInfo(textoGP1);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toEqual('usufructo');
    });

    test('Test de nuda propiedad', () => {
        const info = testPjudPdf.normalizeInfo(textoGP2);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toEqual('nuda propiedad');
    });

    test('Test de bien familiar', () =>{
        const info = testPjudPdf.normalizeInfo(textoGP3);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toEqual('bien familiar');
    });

    test('Test nulo "no se encuentra afecto a bien familiar" ', () => {

        const info = testPjudPdf.normalizeInfo(textoGP4);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test nulo "No registra anotaciones"', () => {

        const info = testPjudPdf.normalizeInfo(textoGP5);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toBeNull();
    });


});

describe('obtainComuna', () => {

    test('Test con avaluo habitacional ', () => {
        const textoNormalizado = testPjudPdf.normalizeInfo(textoHabitacional1);
        const spanishNormalization = testPjudPdf.normalizeSpanish(textoHabitacional1);
        const resComuna = testPjudPdf.obtainComuna(spanishNormalization, textoNormalizado);
        expect(resComuna).toEqual('estacion central');
    });

    test('Test de comuna iquique con diario y multiples publicaciones', () => {
        const normalizeInfo = pjudPdf2484.normalizeInfo(diario2484);
        const spanishNormalization = pjudPdf2484.normalizeSpanish(diario2484)
        const resAnno = pjudPdf2484.obtainComuna(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("iquique");
    });

    test('Test con obtencion de comuna con GP', () => {
        const normalizeInfo = testPjudPdf.normalizeInfo(texto12Santiago);
        const spanishNormalization = testPjudPdf.normalizeSpanish(texto12Santiago)
        const resAnno = pjudPdf2484.obtainComuna(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("estación central");
    });

    test('Test con obtencion en DV santiago', () =>{
        const normalizeInfo = testPjudPdf.normalizeInfo(tx356);
        const spanishNormalization = testPjudPdf.normalizeSpanish(tx356)
        const resAnno = pjudPdf2484.obtainComuna(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("santiago");
    });

    test('Test con obtencion en DV colina', () =>{
        const normalizeInfo = testPjudPdf.normalizeInfo(tx1349);
        const spanishNormalization = testPjudPdf.normalizeSpanish(tx1349)
        const resAnno = pjudPdf2484.obtainComuna(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("colina");
    });

});

describe('ObtainDireccion', () => {
    test('test con avaluo habitacional ', () =>{
        const normalizeTexto = testPjudPdf.normalizeInfo(textoHabitacional1);
        const resDireccion = testPjudPdf.obtainDireccion(normalizeTexto);
        expect(resDireccion).toEqual({
            direccion: 'carlos pezoa veliz 0143 dp 603 ed pezoa veliz',
            tipo: 'destino del bien raiz: habitacional'
        });
    });
});

describe('ObtainAnno', () => {
    // test('Test de anno con diario y multiples publicaciones', () => {
    //     const normalizeInfo = pjudPdf2484.normalizeInfo(diario2484);
    //     const resAnno = pjudPdf2484.obtainAnno(normalizeInfo);
    //     expect(resAnno).toEqual("2010");

    // });

    test('Test de anno con DV ', () => {
        const normalizeInfo = testPjudPdf.normalizeInfo(tx356);
        const resAnno = testPjudPdf.obtainAnno(normalizeInfo);
        expect(resAnno).toEqual('2021');
    });

    test('test negativo null, con lectura GP', () =>{
        const normalizeInfo = testPjudPdf.normalizeInfo(textoGP1);
        const resAnno = testPjudPdf.obtainAnno(normalizeInfo);
        expect(resAnno).toBeNull();
    });

    test('Lectura de texto null', () => {
        const resAnno = testPjudPdf.obtainAnno(null);
        expect(resAnno).toBeNull();
    });
});

describe('ObtainMontoMinimo', () => {
    test("Obtener monto minimo a partir de diario con multiples publicaciones", () =>{
        const info = pjudPdf2484.normalizeInfo(diario2484);
        const resMontoMinimo = pjudPdf2484.obtainMontoMinimo(info);
        expect(resMontoMinimo).toEqual({
            monto: '123.136.853',
            moneda : "Pesos"
        })

    });
});

describe('ObtainMontoCompra', () => {
    test('Obtener monto de compra de DV Pesos', () => {
        const normalizeInfo = testPjudPdf.normalizeInfo(tx356);
        const resMontoCompra = testPjudPdf.obtainMontoCompra(normalizeInfo);
        expect(resMontoCompra).toEqual({
            monto: 67000000,
            moneda: 'Pesos' 
        });
    });

    test('Obtener monto de compra uf con coma DV', () =>{
        const normalizeInfo = testPjudPdf.normalizeInfo(tx23039);
        const resMontoCompra = testPjudPdf.obtainMontoCompra(normalizeInfo);
        expect(resMontoCompra).toEqual({
            monto: 3192.39,
            moneda: 'UF' 
        });
    });

    test('Obtener monto de compra uf DV', () =>{
        const normalizeInfo = testPjudPdf.normalizeInfo(tx12017);
        const resMontoCompra = testPjudPdf.obtainMontoCompra(normalizeInfo);
        expect(resMontoCompra).toEqual({
            monto: 3756,
            moneda: 'UF' 
        });
    });
});

describe('adaptRol', () => {
    test('Caso base todo null', () =>{
        const rolResultado = excelConstructor.adaptRol();
        expect(rolResultado).toBeNull();
    });

    test('Prueba con caso rol propiedad en singular', () =>{
        const rolResultado = excelConstructor.adaptRol("1111-1111");
        expect(rolResultado).toEqual("1111-1111"); 
    });

    test('Prueba con caso rol estacionamiento', () =>{
        const rolResultado = excelConstructor.adaptRol(null,"2222-2222");
        expect(rolResultado).toEqual("2222-2222"); 
    });

    test('Prueba con caso rol bodega', () =>{
        const rolResultado = excelConstructor.adaptRol(null,null,"3333-3333");
        expect(rolResultado).toEqual("3333-3333"); 
    });

    test('Prueba con caso rol propiedad y estacionamiento inicio igual', () =>{
        const rolResultado = excelConstructor.adaptRol('1111-1111','1111-2222');
        expect(rolResultado).toEqual("1111-1111-2222"); 
    });
    
    test('Prueba con caso rol propiedad y estacionamiento inicio diferente', () =>{
        const rolResultado = excelConstructor.adaptRol('1111-1111','2222-2222');
        expect(rolResultado).toEqual("1111-1111//2222-2222"); 
    });

    test('Prueba con caso rol propiedad y bodega inicio igual', () =>{
        const rolResultado = excelConstructor.adaptRol('1111-1111',null,'1111-3333');
        expect(rolResultado).toEqual("1111-1111-3333"); 
    });
    
    test('Prueba con caso rol propiedad y bodega inicio diferente', () =>{
        const rolResultado = excelConstructor.adaptRol('1111-1111',null,'3333-3333');
        expect(rolResultado).toEqual("1111-1111//3333-3333"); 
    });
    
    test('Prueba con caso rol propiedad, estacionamiento y bodega inicio igual', () =>{
        const rolResultado = excelConstructor.adaptRol('1111-1111','1111-2222','1111-3333');
        expect(rolResultado).toEqual("1111-1111-2222-3333"); 
    });
    
    test('Prueba con caso rol propiedad, estacionamiento y bodega inicio diferente', () =>{
        const rolResultado = excelConstructor.adaptRol('1111-1111','2222-2222','3333-3333');
        expect(rolResultado).toEqual("1111-1111//2222-2222//3333-3333"); 
    });
    
    test('Prueba con caso rol propiedad, estacionamiento igual y bodega diferente', () =>{
        const rolResultado = excelConstructor.adaptRol('1111-1111','1111-2222','3333-3333');
        expect(rolResultado).toEqual("1111-1111-2222//3333-3333"); 
    });

    test('Prueba con caso rol propiedad diferente estacionamiento y bodega igual', () =>{
        const rolResultado = excelConstructor.adaptRol('1111-1111','2222-2222','2222-3333');
        expect(rolResultado).toEqual("2222-2222-3333//1111-1111"); 
    });

    test('Prueba con caso rol propiedad bodega igual y estacionamiento diferente', () =>{
        const rolResultado = excelConstructor.adaptRol('1111-1111','2222-2222','1111-3333');
        expect(rolResultado).toEqual("1111-1111-3333//2222-2222"); 
    });

});

describe('SumAvaluo', () => {
    test('Prueba con envio null', () =>{
        const resSumAvaluo = excelConstructor.sumAvaluo();
        expect(resSumAvaluo).toBeNull();
    });

    test('Prueba con solo avaluo propiedad', () =>{
        const resSumAvaluo = excelConstructor.sumAvaluo(100000);
        expect(resSumAvaluo).toEqual(100000);
    });

    test('Prueba pasando texto cualquiera', () =>{
        const resSumAvaluo = excelConstructor.sumAvaluo('asd');
        expect(resSumAvaluo).toBeNull();
    });

    test('Prueba con solo avaluo propiedad pasando texto', () =>{
        const resSumAvaluo = excelConstructor.sumAvaluo('100000');
        expect(resSumAvaluo).toEqual(100000);
    });

    test('Prueba con avaluo propiedad y estacionamiento', () =>{
        const resSumAvaluo = excelConstructor.sumAvaluo(100000,20000);
        expect(resSumAvaluo).toEqual(120000);
    });

    test('Prueba con avaluo propiedad, estacionamiento y bodega', () =>{
        const resSumAvaluo = excelConstructor.sumAvaluo(100000,20000,3000);
        expect(resSumAvaluo).toEqual(123000);
    });
});



function createCase(causa,juzgado){
    const caso1 = new Caso("1/1/2025");
    caso1.causa = causa;
    caso1.juzgado = juzgado;
    return caso1;
}