
const Caso = require('../../componentes/caso/caso');
const PjudPdfData = require('../../componentes/pjud/PjudPdfData');

const {dv1750, dv4991} = require('../textos/DV');
const {bf1750} = require('../textos/BF');
const {ex1666} = require('../textos/Extracto'); 
const AR = require('../textos/ActaRemate');
const AV = require('../textos/Avaluo');
const textosGP = require('../textos/GP');

describe('Test de funcionalidad Pjud a normalizacion',() => {
    test('Obtener monto minimo de postura de un extracto', () => {
        const caso1666 = new Caso(new Date(), new Date(), 'lgr', 2);
        caso1666.texto = ex1666;
        const testPjudPdf = new PjudPdfData(caso1666);
        testPjudPdf.processInfo(ex1666)
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
        expect(casoObj.anno).toEqual(2020);
        expect(casoObj.tipoDerecho).toBeNull();
    });

    test('Obtener el anno de un dominio vigente y normalizarlo',()=>{
        const caso4991 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso4991);
        testPjudPdf.processInfo(dv4991);
        const casoObj = caso4991.toObject();
        expect(casoObj.anno).toEqual(2023);
    });

    test('Obtener el avaluo de habitacional', ()=>{
        const caso4991 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso4991);
        testPjudPdf.processInfo(AV.textoHabitacionMultiple);
        const casoObj = caso4991.toObject();
        expect(casoObj.rolPropiedad).toEqual('03795 - 00302');
        expect(casoObj.avaluoPropiedad).toEqual(59921526);
    });

    test('Obtencion de GP 15491', ()=>{
        const caso15491 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso15491);
        testPjudPdf.processInfo(textosGP.GP15491);
        const casoObj = caso15491.toObject();
        expect(casoObj.comuna).toEqual('santiago');
        expect(casoObj.tipoDerecho).toEqual('usufructo');
        expect(casoObj.montoMinimo).toBeNull();
    });

    test('Obtencion de comuna con normalizacion para incluir tilde concepcion', ()=>{
        const caso7156 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso7156);
        testPjudPdf.processInfo(AV.av7156);
        const casoObj = caso7156.toObject();
        expect(casoObj.comuna).toEqual('concepción');
    });

    test('Obtencion de comuna con normalizacion para incluir tilde concon', ()=>{
        const caso1028 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso1028);
        testPjudPdf.processInfo(AV.av1028);
        const casoObj = caso1028.toObject();
        expect(casoObj.comuna).toEqual('concón');
    });

    test('Obtencion de comuna con normalizacion para incluir tilde copiapo', ()=>{
        const caso3025 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso3025);
        testPjudPdf.processInfo(AV.av3025);
        const casoObj = caso3025.toObject();
        expect(casoObj.comuna).toEqual('copiapó');
    });

});

describe('Test de Pjud con avaluos', ()=>{
    test('Caso con solo avaluo habitacional', ()=>{
        const caso4991 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso4991);
        testPjudPdf.processInfo(AV.textoHabitacionMultiple);
        const casoObj = caso4991.toObject();
        expect(casoObj.unitRol).toEqual('3795-302');
        expect(casoObj.unitAvaluo).toEqual(59921526);
    });

    test('Caso con avaluo habitacional y estacionamiento', ()=>{
        const caso4991 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso4991);
        testPjudPdf.processInfo(AV.textoHabitacionMultiple);
        testPjudPdf.processInfo(AV.textoEstacionamientoMultiple);
        const casoObj = caso4991.toObject();
        expect(casoObj.unitRol).toEqual('3795-302-474');
        expect(casoObj.unitAvaluo).toEqual(64348355);
    });

    test('Caso con avaluo habitacional, estacionamiento y bodega', ()=>{
        const caso4991 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso4991);
        testPjudPdf.processInfo(AV.textoHabitacionMultiple);
        testPjudPdf.processInfo(AV.textoEstacionamientoMultiple);
        testPjudPdf.processInfo(AV.textoBodegaMultiple);
        const casoObj = caso4991.toObject();
        expect(casoObj.unitRol).toEqual('3795-302-474-368');
        expect(casoObj.unitAvaluo).toEqual(65214126);
    });

    test('Caso con avaluo habitacional, estacionamiento y bodega', ()=>{
        const caso4991 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso4991);
        testPjudPdf.processInfo(AV.textoHabitacionMultiple);
        testPjudPdf.processInfo(AV.textoBodegaMultiple);
        const casoObj = caso4991.toObject();
        expect(casoObj.unitRol).toEqual('3795-302-368');
        expect(casoObj.unitAvaluo).toEqual(60787297);
    });
});

describe('Test funcional de pjud con rol',()=>{

    test('Leer acta de remate 572',()=>{

        const caso572 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso572);
        testPjudPdf.processInfo(AR.AR572);
        const casoObj = caso572.toObject();
        expect(casoObj.unitRol).toEqual('2874-439-173//2864-182');
        expect(casoObj.montoMinimo).toEqual(81100000);
        expect(casoObj.formatoEntrega).toEqual('vale vista');
        expect(casoObj.comuna).toEqual('santiago');
        expect(casoObj.direccion).toEqual(`calle santa rosa nº 991: departamento nº 905; estacionamiento nº 234, y bodega nº 173, del tercer subterraneo; todos del proyecto "edificio espacio santa rosa",`)
        expect(casoObj.anno).toEqual(2019);
    });

    test('Leer acta de remate 2396',()=>{

        const caso2396 = new Caso(new Date(), new Date(), 'lgr', 2);
        const testPjudPdf = new PjudPdfData(caso2396);
        testPjudPdf.processInfo(AR.AR2396);
        const casoObj = caso2396.toObject();
        expect(casoObj.unitRol).toEqual('5500-26');
        expect(casoObj.montoMinimo).toEqual(50000000);
        expect(casoObj.formatoEntrega).toEqual('vale vista');
        expect(casoObj.comuna).toEqual('osorno');
        expect(casoObj.direccion).toEqual(`la campina sitio nº 26, loteo la campina,`)
        expect(casoObj.anno).toEqual(2022);
        // expect(casoObj.unitAvaluo).toEqual(60787297);
    });
});