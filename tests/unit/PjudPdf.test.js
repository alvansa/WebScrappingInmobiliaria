const PjudPdfData = require('../../componentes/pjud/PjudPdfData');
const Caso = require('../../componentes/caso/caso');
// const createExcel = require('../../componentes/excel/createExcel')
// const Causas = require('../../model/Causas');

const {textoEstacionamiento1,textoHabitacional1, textoBodegaMultiple, textoEstacionamientoMultiple, textoHabitacionMultiple} = require('../textos/Avaluo');
const {textoGP1, textoGP2, textoGP3, textoGP4, textoGP5, texto12Santiago, GP1435} = require('../textos/GP');
const {diario2484, ex1341, diario1341, diario3354_1, diario3354_2} = require('../textos/diario');

const textosDV = require('../textos/DV');
const AR = require('../textos/ActaRemate');
const {ex1666, ex800, ex2240, ex2226} = require('../textos/Extracto'); 
const BF = require('../textos/BF');
const {dm1056, dm1138} = require('../textos/DM');
const {obtainCorteJuzgadoNumbers} = require('../../utils/corteJuzgado');


// const excelConstructor = new createExcel("","","","",false,1);
const testCaso = createCase("1111-2024", '1º Juzgado de Letras de Buin');
const caso2484 = createCase("C-2484-2023","3º Juzgado de Letras de Iquique");
const casoBase = Caso.createMockCase();
const testPjudPdf = new PjudPdfData(testCaso)
const pjudPdf2484 = new PjudPdfData(caso2484);
// const causaDB = new Causas();

const devMode = true;

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

    test('Deberia ser null ya que es un diario y no se lee de ahi', ()=>{
       const textoNormalizado = testPjudPdf.normalizeInfo(diario3354_1);
       const res = testPjudPdf.obtainRolPropiedad(textoNormalizado); 
       expect(res).toBeNull();
    });

    test('Prueba con acta de remate', ()=>{
       const textoNormalizado = testPjudPdf.normalizeInfo(AR.AR572);
       const res = testPjudPdf.obtainRolPropiedad(textoNormalizado,0); 
       expect(res).toEqual({
            tipo : 'departamento',
            rol : '2864-182'
        });
    });

    test('Prueba con acta de remate', ()=>{
       const textoNormalizado = testPjudPdf.normalizeInfo(AR.AR572);
       const res = testPjudPdf.obtainRolPropiedad(textoNormalizado,1); 
       expect(res).toEqual({
            tipo : 'estacionamiento',
            rol : '2874-439'
        });
    });

    test('Prueba con acta de remate', ()=>{
       const textoNormalizado = testPjudPdf.normalizeInfo(AR.AR572);
       const res = testPjudPdf.obtainRolPropiedad(textoNormalizado,2); 
       expect(res).toEqual({
            tipo : 'bodega',
            rol : '2874-173'
        });
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
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info, true);
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

    test('Texto de bien familiar que dice no consta con', ()=>{
        const info = testPjudPdf.normalizeInfo(BF.bf2201);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Leer diario y deberia ser null ya que el que dice nuda propiedad es otra causa', ()=>{
        const testCaso1341 = createCase('C-1341-2024','1° JUZGADO DE LETRAS DE TALCA');
        const testPjud1341 = new PjudPdfData(testCaso1341);
        const info = testPjud1341.normalizeInfo(diario1341);
        const tipoDerecho = testPjud1341.obtainTipoDerecho(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de Bien familiar definitivo', ()=>{
        const info = testPjudPdf.normalizeInfo(BF.bf1341);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toEqual('bien familiar');
    });

    test('Test Nulo basico Bien familiar no registra anotaciones', ()=>{
        const info = testPjudPdf.normalizeInfo(BF.notBf);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de tipo de texto que dice no se encuentra afecto a bf', ()=>{
        const info = testPjudPdf.normalizeInfo(BF.bf1750);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de tipo de texto que dice no se encuentra afecto a bf', ()=>{
        const info = testPjudPdf.normalizeInfo(GP1435);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de tipo de texto que dice no se encuentra afecto a bf', ()=>{
        const info = testPjudPdf.normalizeInfo(BF.BF2452);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de tipo de texto que dice no existe declaracion de bf', ()=>{
        const info = testPjudPdf.normalizeInfo(BF.BF2055);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de tipo de texto que dice Consta que no tiene anotaciones de bien familiar', ()=>{
        const info = testPjudPdf.normalizeInfo(BF.BF199);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de tipo de texto donde solo dice certificado BF', ()=>{
        const info = testPjudPdf.normalizeInfo(BF.CertificadoBF);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de tipo de texto donde solo dice certificado BF', ()=>{
        const info = testPjudPdf.normalizeInfo(BF.NotBF1439);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Dominio vigente con "Por haberse cancelado el usufructo"', ()=>{
        const info = testPjudPdf.normalizeInfo(textosDV.dv6144);
        const tipoDerecho = testPjudPdf.obtainTipoDerecho(info);
        expect(tipoDerecho).toBeNull();
    });
});

describe('obtainComuna', () => {

    test('Obtener comuna con avaluo habitacional ', () => {
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
        const normalizeInfo = testPjudPdf.normalizeInfo(textosDV.dv356);
        const spanishNormalization = testPjudPdf.normalizeSpanish(textosDV.dv356)
        const resAnno = pjudPdf2484.obtainComuna(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("santiago");
    });

    test('Test con obtencion en DV colina', () =>{
        const normalizeInfo = testPjudPdf.normalizeInfo(textosDV.dv1349);
        const spanishNormalization = testPjudPdf.normalizeSpanish(textosDV.dv1349)
        const resAnno = pjudPdf2484.obtainComuna(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("colina");
    });

    test('Test obtencion del DV que dice comuna de chillan y lo barnechea', () =>{
        const normalizeInfo = testPjudPdf.normalizeInfo(textosDV.dv10803);
        const spanishNormalization = testPjudPdf.normalizeSpanish(textosDV.dv10803)
        const resAnno = pjudPdf2484.obtainComuna(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("lo barnechea");
    });

    test('Test que dice dos comunas pero una es el domicilio y la otra es la comprada', ()=>{
        const normalizeInfo = testPjudPdf.normalizeInfo(textosDV.dv100);
        const spanishNormalization = testPjudPdf.normalizeSpanish(textosDV.dv100)
        const resAnno = pjudPdf2484.obtainComuna(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("ñuñoa");
    });

    test('Test que tiene comuna de x, el problema antes era la coma', ()=>{
        const normalizeInfo = testPjudPdf.normalizeInfo(textosDV.dv1602);
        const spanishNormalization = testPjudPdf.normalizeSpanish(textosDV.dv1602)
        const resAnno = pjudPdf2484.obtainComuna(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("maipú");
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
        const normalizeInfo = testPjudPdf.normalizeInfo(textosDV.dv356);
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

    test('Caso donde aparece el ano de inscripcion y el ano de vigencia', ()=>{
        const info = testPjudPdf.normalizeInfo(textosDV.dv3857);
        const anno = testPjudPdf.obtainAnno(info);
        expect(anno).toEqual('2014');
    });

    test('Obtener anno de DV el anno con punto',()=>{
        const info = testPjudPdf.normalizeInfo(textosDV.dv1750);
        const anno = testPjudPdf.obtainAnno(info);
        expect(anno).toEqual('2.020');
    });

    test('Obtener anno de DV 2',()=>{
        const info = testPjudPdf.normalizeInfo(textosDV.dv212);
        const anno = testPjudPdf.obtainAnno(info);
        expect(anno).toEqual('2.019');
    });

    test('Obtener el anno de registro de propiedad con parentesis',()=>{
        const info = testPjudPdf.normalizeInfo(textosDV.dv4991);
        const anno = testPjudPdf.obtainAnno(info);
        expect(anno).toEqual('2023');
    });

    test('Obtener el anno de registro de propiedad de conservador',()=>{
        const info = testPjudPdf.normalizeInfo(ex800);
        const anno = testPjudPdf.obtainAnno(info);
        expect(anno).toEqual('2005');
    });

    test('Obtener el anno con punto de conservador',()=>{
        const info = testPjudPdf.normalizeInfo(ex2240);
        const anno = testPjudPdf.obtainAnno(info);
        expect(anno).toEqual('2.020');
    });

    test('Obtener el anno de registro de propiedad de un extracto',()=>{
        const info = testPjudPdf.normalizeInfo(ex2226);
        const anno = testPjudPdf.obtainAnno(info);
        expect(anno).toEqual('2017');
    });

    test('Obtener el anno de un DV que aparecia 3430',()=>{
        const info = testPjudPdf.normalizeInfo(textosDV.dv11840);
        const anno = testPjudPdf.obtainAnno(info);
        expect(anno).toEqual('2016');
    });

    test('Obtener el anno de un DV que tiene dos annos asociados a la compra',()=>{
        const info = testPjudPdf.normalizeInfo(textosDV.dv9404);
        const anno = testPjudPdf.obtainAnno(info);
        expect(anno).toEqual(2015);
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

    test('Obtener monto minimo de postura de un extracto',()=>{
        const info = testPjudPdf.normalizeInfo(ex1341);
        const montoMinimo = testPjudPdf.obtainMontoMinimo(info);
        expect(montoMinimo).toEqual({
            monto: '80.074.227',
            moneda : "Pesos"
        });
    });

    test('Obtener monto minimo de postura de un extracto',()=>{
        const info = testPjudPdf.normalizeInfo(ex1666);
        const montoMinimo = testPjudPdf.obtainMontoMinimo(info);
        expect(montoMinimo).toEqual({
            monto: '1031,99465',
            moneda : "UF"
        });
    });

    test('Obtener monto minimo de un acta de remate',()=>{
        const info = testPjudPdf.normalizeInfo(AR.AR572);
        const montoMinimo = testPjudPdf.obtainMontoMinimo(info);
        expect(montoMinimo).toEqual({
            monto: '81.100.000',
            moneda : "Pesos"
        });
    });

});

describe('checkIfValidDoc',()=>{
    test('Test de diario que deberia ser false', ()=>{
       const res = testPjudPdf.checkIfValidDoc(diario3354_1);
       expect(res).toEqual(false);
    });

    test('Test de diario que deberia ser false', ()=>{
       const res = testPjudPdf.checkIfValidDoc(diario3354_2);
       expect(res).toEqual(false);
    });
});

describe('ObtainMontoCompra', () => {
    test('Caso donde no puede obtener el monto de compra',()=>{

        const normalizeInfo = testPjudPdf.normalizeInfo(textosDV.dv11066);
        const resMontoCompra = testPjudPdf.obtainMontoCompra(normalizeInfo);
        expect(resMontoCompra).toBeNull();
    });

    test('Obtener monto de compra de DV Pesos con se estiman', () => {
        const normalizeInfo = testPjudPdf.normalizeInfo(textosDV.dv356);
        const resMontoCompra = testPjudPdf.obtainMontoCompra(normalizeInfo);
        expect(resMontoCompra).toEqual({
            monto: 67000000,
            moneda: 'Pesos' 
        });
    });

    test('Obtener monto de compra uf con coma DV con por el precio', () =>{
        const normalizeInfo = testPjudPdf.normalizeInfo(textosDV.dv23039);
        const resMontoCompra = testPjudPdf.obtainMontoCompra(normalizeInfo);
        expect(resMontoCompra).toEqual({
            monto: 3192.39,
            moneda: 'UF' 
        });
    });

    test('Obtener monto de compra uf DV', () =>{
        const normalizeInfo = testPjudPdf.normalizeInfo(textosDV.dv12017);
        const resMontoCompra = testPjudPdf.obtainMontoCompra(normalizeInfo);
        expect(resMontoCompra).toEqual({
            monto: 3756,
            moneda: 'UF' 
        });
    });

    test('Obtener motno de compra por compraventa', ()=>{
        const normalizeInfo = testPjudPdf.normalizeInfo(textosDV.dv13759);
        const monto = testPjudPdf.obtainMontoCompra(normalizeInfo);
        expect(monto).toEqual({
            monto: 9744,
            moneda: 'UF' 
        })
    });

    test('Obtener monto de compra pesos por la suma', () =>{
        const normalizeInfo = testPjudPdf.normalizeInfo(textosDV.dv7140);
        const resMontoCompra = testPjudPdf.obtainMontoCompra(normalizeInfo);
        expect(resMontoCompra).toEqual({
            monto: 78918749,
            moneda: 'Pesos' 
        });
    });

    test('Monto no encontrado por dacion de pago',()=>{
        const normalizeInfo = testPjudPdf.normalizeInfo(textosDV.dv198);
        const resMontoCompra = testPjudPdf.obtainMontoCompra(normalizeInfo);
        expect(resMontoCompra).toBeNull();
    });
    test('Prueba por se estiman: ',()=>{

    });
});

describe('obtainDeudaHipoteca', ()=>{
    test('Monto de compra donde dice mutuo y prestamo',()=>{
        const info = testPjudPdf.normalizeInfo(dm1056);
        const deuda = testPjudPdf.obtainDeudaHipotecaria(info);
        expect(deuda).toEqual('uf 1248,2274');
    });

    test('Monto de compra donde dice mutuo hipotecario',()=>{
        const info = testPjudPdf.normalizeInfo(dm1138);
        const deuda = testPjudPdf.obtainDeudaHipotecaria(info);
        expect(deuda).toEqual('uf 3684,5498');
    });
});

describe('obtainCorteJuzgadoNumbers', ()=>{
    test('caso nulo', ()=>{
        const casoNulo = createCase("C-1111-2222",null);
        const casos = [casoNulo];
        obtainCorteJuzgadoNumbers(casos);
        expect(casos[0].numeroJuzgado).toBeNull();
    });
    test('caso base de iquique', ()=>{
        const casoIquique = createCase('C-1111-1111',"3º Juzgado de Letras de Iquique");
        const casos = [casoIquique];
        obtainCorteJuzgadoNumbers(casos);
        expect(casos[0].numeroJuzgado).toEqual('11');
    });
    test('caso base de iquique', ()=>{
        const casoSantiago = createCase('C-1111-1111',"30° JUZGADO CIVIL DE SANTIAGO");
        const casos = [casoSantiago];
        obtainCorteJuzgadoNumbers(casos);
        expect(casos[0].numeroJuzgado).toEqual('288');
    });
    test('caso base de iquique', ()=>{
        const casoSantiago = createCase('C-1111-1111',"30° JUZGADO CIVIL DE SANTIAGO");
        casoSantiago.numeroJuzgado = "25";
        const casos = [casoSantiago];
        obtainCorteJuzgadoNumbers(casos);
        expect(casos[0].numeroJuzgado).toEqual('25');
    });
});

// describe('bindCaseWithDB',()=>{
//     test('Caso vacio con DB', ()=>{
//         const casoDB = excelConstructor.isCaseInDB(casoBase);
//         let emptyCase = createCase(null,null);
//         emptyCase = Caso.bindCaseWithDB(emptyCase,casoDB); 
//         expect(emptyCase.direccion).toEqual("Calle Principal 123, Santiago");
//         expect(emptyCase.rol).toEqual('1342-209-220');
//         expect(emptyCase.estadoCivil).toEqual('casado sociedad conyugal');
//         expect(emptyCase.fechaRemate).toEqual(new Date(casoDB.fechaRemate));
//         expect(emptyCase.isPaid).toEqual(false);
//     });

//     test('Caso que ya estaba con fecha de remate anterior', ()=>{
//         const casoDB = excelConstructor.isCaseInDB(casoBase);
//         let cCase = createCase(null,null);
//         cCase.fechaRemate = new Date('2025/05/19');
//         cCase = Caso.bindCaseWithDB(cCase,casoDB); 
//         expect(cCase.fechaRemate).toEqual(new Date('2025/05/19'));
//         expect(cCase.alreadyAppear).toEqual(new Date('2024/12/25'));
//         expect(cCase.isPaid).toEqual(false);
//     });

//     test('Caso que ya estaba con fecha de remate posterior', ()=>{
//         let casoBaseFechaModificada = Caso.createMockCase();
//         casoBaseFechaModificada.fechaRemate = new Date("2023/12/25");
//         const casoDB = excelConstructor.isCaseInDB(casoBaseFechaModificada);
//         casoBaseFechaModificada = Caso.bindCaseWithDB(casoBaseFechaModificada,casoDB); 
//         expect(casoBaseFechaModificada instanceof Caso).toEqual(true);
//         expect(casoBaseFechaModificada.causa).toEqual('C-746-2024');
//         expect(casoBaseFechaModificada.fechaRemate).toEqual(new Date("2023/12/25"));
//         expect(casoBaseFechaModificada.isPaid).toEqual(false);
//     });

//     test('Caso que esta en DB pero el isPaid es nulo, deberia quedar nulo', ()=>{
//         let casoforDB = createCase("C-6950-2019","1° Juzgado de Letras de San Bernardo");
//         casoforDB.numeroJuzgado = 267;
//         const casoDB = excelConstructor.isCaseInDB(casoforDB);
//         expect(casoforDB.isPaid).toEqual(false);
        

//         casoforDB = Caso.bindCaseWithDB(casoforDB,casoDB); 
//         expect(casoforDB.isPaid).toEqual(false);
//         expect(casoDB.isPaid).toBeNull();
//     });
// });

// describe('inCaseInDB', ()=>{
//     test('Caso null', ()=>{
//         const casoVacio = createCase(null,null)
//         const casoDB = excelConstructor.isCaseInDB(casoVacio);
//         expect(casoDB).toBeNull();
//     });
    
//     test('Caso que no esta en DB',()=>{
//         const casoVacio = createCase('C-123-1111',null)
//         const casoDB = excelConstructor.isCaseInDB(casoVacio);
//         expect(casoDB).toBeNull();
//     });

//     test('Caso que ya estaba con fecha de remate anterior', ()=>{
//         const casoDB = excelConstructor.isCaseInDB(casoBase);
//         expect(casoDB.causa).toEqual(casoBase.causa);
//         expect(casoDB).not.toBeNull();
//     });

// });




describe('obtainFormatoEntrega',()=>{
    test('Obtener el formato de entrega de un acta de remate',()=>{
        const info = testPjudPdf.normalizeInfo(AR.AR572);
        const formatoEntrega = testPjudPdf.obtainFormatoEntrega(info);
        expect(formatoEntrega).toEqual('vale vista');
    });
});


function createCase(causa,juzgado){
    const caso1 = new Caso("1/1/2025");
    caso1.causa = causa;
    caso1.juzgado = juzgado;
    return caso1;
}