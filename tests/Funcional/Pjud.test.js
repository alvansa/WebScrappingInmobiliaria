
const Caso = require('../../componentes/caso/caso');
const PjudPdfData = require('../../componentes/pjud/PjudPdfData');

const {dv1750, dv4991} = require('../textos/DV');
const {bf1750} = require('../textos/BF');
const {ex1666} = require('../textos/Extracto'); 
const {textoEstacionamiento1,textoHabitacional1, textoBodegaMultiple, textoEstacionamientoMultiple, textoHabitacionMultiple} = require('../textos/Avaluo');

describe('Test de funcionalidad Pjud a normalizacion',() => {
    test('Obtener monto minimo de postura de un extracto', () => {
        const caso1666 = new Caso(new Date(), new Date(), 'lgr', 2);
        caso1666.texto = ex1666;
        const testPjudPdf = new PjudPdfData(caso1666);
        testPjudPdf.processInfo(ex1666);
        const casoObj = caso1666.toObject();
        expect(casoObj.montoMinimo).toEqual(1031.99465);
    });

    test('Obtener el anno de un dominio vigente y normalizarlo',()=>{
        const caso1750 = new Caso(new Date(), new Date(), 'lgr', 2);
        caso1750.texto = dv1750;
        const testPjudPdf = new PjudPdfData(caso1750);
        testPjudPdf.processInfo(dv1750);
        testPjudPdf.processInfo(bf1750);
        const casoObj = caso1750.toObject();
        expect(casoObj.anno).toEqual("2020");
        expect(casoObj.tipoDerecho).toBeNull();
    });

    test('Obtener el anno de un dominio vigente y normalizarlo',()=>{
        const caso4991 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso4991);
        testPjudPdf.processInfo(dv4991);
        const casoObj = caso4991.toObject();
        expect(casoObj.anno).toEqual("2023");
    });

    test('Obtener el avaluo de habitacional', ()=>{
        const caso4991 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso4991);
        testPjudPdf.processInfo(textoHabitacionMultiple);
        const casoObj = caso4991.toObject();
        expect(casoObj.rolPropiedad).toEqual('03795 - 00302');
        expect(casoObj.avaluoPropiedad).toEqual(59921526);
    });
});

describe('Test de Pjud con avaluos', ()=>{
    test('Caso con solo avaluo habitacional', ()=>{
        const caso4991 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso4991);
        testPjudPdf.processInfo(textoHabitacionMultiple);
        const casoObj = caso4991.toObject();
        expect(casoObj.unitRol).toEqual('3795-302');
        expect(casoObj.unitAvaluo).toEqual(59921526);
    });

    test('Caso con avaluo habitacional y estacionamiento', ()=>{
        const caso4991 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso4991);
        testPjudPdf.processInfo(textoHabitacionMultiple);
        testPjudPdf.processInfo(textoEstacionamientoMultiple);
        const casoObj = caso4991.toObject();
        expect(casoObj.unitRol).toEqual('3795-302-474');
        expect(casoObj.unitAvaluo).toEqual(64348355);
    });

    test('Caso con avaluo habitacional, estacionamiento y bodega', ()=>{
        const caso4991 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso4991);
        testPjudPdf.processInfo(textoHabitacionMultiple);
        testPjudPdf.processInfo(textoEstacionamientoMultiple);
        testPjudPdf.processInfo(textoBodegaMultiple);
        const casoObj = caso4991.toObject();
        expect(casoObj.unitRol).toEqual('3795-302-474-368');
        expect(casoObj.unitAvaluo).toEqual(65214126);
    });

    test('Caso con avaluo habitacional, estacionamiento y bodega', ()=>{
        const caso4991 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso4991);
        testPjudPdf.processInfo(textoHabitacionMultiple);
        testPjudPdf.processInfo(textoBodegaMultiple);
        const casoObj = caso4991.toObject();
        expect(casoObj.unitRol).toEqual('3795-302-368');
        expect(casoObj.unitAvaluo).toEqual(60787297);
    });
});