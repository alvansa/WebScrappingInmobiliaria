const PjudPdfData = require('../../componentes/pjud/PjudPdfData');
const Caso = require('../../componentes/caso/caso');
const config = require('../../config')
const PROPIEDAD = config.PROPIEDAD;
const ESTACIONAMIENTO = config.ESTACIONAMIENTO;
const BODEGA = config.BODEGA;
// const createExcel = require('../../componentes/excel/createExcel')
// const Causas = require('../../model/Causas');

const {textoEstacionamiento1,textoHabitacional1, textoBodegaMultiple, textoEstacionamientoMultiple, textoHabitacionMultiple} = require('../textos/Avaluo');
const textosGP = require('../textos/GP');
const {diario2484, ex1341, diario1341, diario3354_1, diario3354_2} = require('../textos/diario');

const textosDV = require('../textos/DV');
const AR = require('../textos/ActaRemate');
const {ex1666, ex800, ex2240, ex2226} = require('../textos/Extracto'); 
const BF = require('../textos/BF');
const {dm1056, dm1138} = require('../textos/DM');
const {obtainCorteJuzgadoNumbers} = require('../../utils/corteJuzgado');
const {normalizeText, normalizeTextSpanish} = require('../../utils/textNormalizers');
const extractor = require('../../componentes/pdfProcess/extractors/index');
const PdfParse = require('pdf-parse');
const PdfProccess = require('../../componentes/pdfProcess/PdfProcess');


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
        // const resRol = extractor.propertyId(null);
        const resRol = extractor.propertyId(null);
        expect(resRol).toBeNull();
    });

    test('debería retornar null cuando el texto contiene "inscripcion"', () => {
        const texto = "Este es un texto con inscripcion pero sin rol de avalúo";
        const resultado = extractor.propertyId(texto);
        expect(resultado).toBeNull();
    });

    test('Deberia retornar el rol y bien raiz estacionamiento', () => {
        const textoNormalizado = normalizeText(textoEstacionamiento1)
        const resultado = extractor.propertyId(textoNormalizado, ESTACIONAMIENTO);

        expect(resultado).toEqual(
            "00546 - 00618"
        );
    });

    test('Deberia retornar el rol y bien raiz habitacional', () => {
        const textoNormalizado = normalizeText(textoHabitacional1);
        const resultado = extractor.propertyId(textoNormalizado, PROPIEDAD);
        expect(resultado).toEqual(
         '00546 - 00066'
        );
    });

    test('Deberia retornar el rol y bien raiz bodega', () => {
        const textoNormalizado = normalizeText(textoBodegaMultiple);
        const resBodega = extractor.propertyId(textoNormalizado, BODEGA);
        expect(resBodega).toEqual('03795 - 00368');
    });

    test('Deberia retornar null cuando no encuentra algo parecido', () => {
        const textoNormalizado = normalizeText(textosGP.textoGP1);
        const resRol = extractor.propertyId(textoNormalizado);
        expect(resRol).toBeNull();
    });

    test('Deberia ser null ya que es un diario y no se lee de ahi', ()=>{
       const textoNormalizado = normalizeText(diario3354_1);
       const res = extractor.propertyId(textoNormalizado); 
       expect(res).toBeNull();
    });

    test('Prueba con acta de remate', ()=>{
       const textoNormalizado = normalizeText(AR.AR572);
       const res = extractor.propertyId(textoNormalizado,PROPIEDAD); 
       expect(res).toEqual(
            '2864-182'
        );
    });

    test('Prueba con acta de remate', ()=>{
       const textoNormalizado = normalizeText(AR.AR572);
       const res = extractor.propertyId(textoNormalizado,ESTACIONAMIENTO); 
       expect(res).toEqual(
             '2874-439'
        );
    });

    test('Prueba con acta de remate', ()=>{
       const textoNormalizado = normalizeText(AR.AR572);
       const res = extractor.propertyId(textoNormalizado,BODEGA); 
       expect(res).toEqual(
            '2874-173'
        );
    });
});

describe('ObtainAvaluoPropiedad', () =>{
    test('Deberia obtener el avaluo de habitacional', () =>{
        const textoNormalizado = normalizeText(textoHabitacionMultiple);
        const resAvaluo = extractor.propertyValuation(textoNormalizado,PROPIEDAD);
        expect(resAvaluo).toEqual(
         "59921526"
        );
    });

    test('Deberia obtener el avaluo estacinamiento', () =>{
        const textoNormalizado = normalizeText(textoEstacionamientoMultiple);
        const resAvaluo = extractor.propertyValuation(textoNormalizado, ESTACIONAMIENTO);
        expect(resAvaluo).toEqual(
            "4426829"
        );
    });

    test('Deberia obtener el avaluo de la bodega', () =>{
        const textoNormalizado = normalizeText(textoBodegaMultiple);
        const resAvaluo = extractor.propertyValuation(textoNormalizado, BODEGA);
        expect(resAvaluo).toEqual(
            "865771"
        );
    });

    test('Prueba con gp para obtener nulo', ()=>{
        const textoNormalizado = normalizeText(textosGP.textoGP1);
        const resAvaluo = extractor.propertyValuation(textoNormalizado);
        expect(resAvaluo).toBeNull();
    });

});

describe('obtainDerecho', () => {
    test('Test basico 1 usufructo ', () =>{
        const info = normalizeText(textosGP.textoGP1);
        const tipoDerecho = extractor.rightType(info, true);
        expect(tipoDerecho).toEqual('usufructo');
    });

    test('Test de nuda propiedad', () => {
        const info = normalizeText(textosGP.textoGP2);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toEqual('nuda propiedad');
    });

    test('Test de bien familiar', () =>{
        const info = normalizeText(textosGP.textoGP3);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toEqual('bien familiar');
    });

    test('Test nulo "no se encuentra afecto a bien familiar" ', () => {
        const info = normalizeText(textosGP.textoGP4);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test nulo "No registra anotaciones"', () => {
        const info = normalizeText(textosGP.textoGP5);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Texto de bien familiar que dice no consta con', ()=>{
        const info = normalizeText(BF.bf2201);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toBeNull();
    });

    // test('Leer diario y deberia ser null ya que el que dice nuda propiedad es otra causa', ()=>{
    //     const info = normalizeText(diario1341);
    //     const tipoDerecho = extractor.rightType(info);
    //     expect(tipoDerecho).toBeNull();
    // });

    test('Test de Bien familiar definitivo', ()=>{
        const info = normalizeText(BF.bf1341);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toEqual('bien familiar');
    });

    test('Test Nulo basico Bien familiar no registra anotaciones', ()=>{
        const info = normalizeText(BF.notBf);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de tipo de texto que dice no se encuentra afecto a bf', ()=>{
        const info = normalizeText(BF.bf1750);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de tipo de texto que dice no se encuentra afecto a bf', ()=>{
        const info = normalizeText(textosGP.GP1435);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de tipo de texto que dice no se encuentra afecto a bf', ()=>{
        const info = normalizeText(BF.BF2452);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de tipo de texto que dice no existe declaracion de bf', ()=>{
        const info = normalizeText(BF.BF2055);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de tipo de texto que dice Consta que no tiene anotaciones de bien familiar', ()=>{
        const info = normalizeText(BF.BF199);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de tipo de texto donde solo dice certificado BF', ()=>{
        const info = normalizeText(BF.CertificadoBF);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Test de tipo de texto donde solo dice certificado BF', ()=>{
        const info = normalizeText(BF.NotBF1439);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toBeNull();
    });

    test('Dominio vigente con "Por haberse cancelado el usufructo"', ()=>{
        const info = normalizeText(textosDV.dv6144);
        const tipoDerecho = extractor.rightType(info);
        expect(tipoDerecho).toBeNull();
    });
});

describe('obtainComuna', () => {

    test('Obtener comuna con avaluo habitacional ', () => {
        const textoNormalizado = normalizeText(textoHabitacional1);
        const spanishNormalization = normalizeTextSpanish(textoHabitacional1);
        const resComuna = extractor.district(spanishNormalization, textoNormalizado);
        expect(resComuna).toEqual('estacion central');
    });

    test('Test de comuna iquique con diario y multiples publicaciones', () => {
        const normalizeInfo = normalizeText(diario2484);
        const spanishNormalization = normalizeTextSpanish(diario2484)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("iquique");
    });

    test('Test con obtencion de comuna con GP', () => {
        const normalizeInfo = normalizeText(textosGP.texto12Santiago);
        const spanishNormalization = normalizeTextSpanish(textosGP.texto12Santiago)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("estación central");
    });

    test('Test con obtencion en DV santiago', () =>{
        const normalizeInfo = normalizeText(textosDV.dv356);
        const spanishNormalization = normalizeTextSpanish(textosDV.dv356)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("santiago");
    });

    test('Test con obtencion en DV colina', () =>{
        const normalizeInfo = normalizeText(textosDV.dv1349);
        const spanishNormalization = normalizeTextSpanish(textosDV.dv1349)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("colina");
    });

    test('Test obtencion del DV que dice comuna de chillan y lo barnechea', () =>{
        const normalizeInfo = normalizeText(textosDV.dv10803);
        const spanishNormalization = normalizeTextSpanish(textosDV.dv10803)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("lo barnechea");
    });

    test('Test que dice dos comunas pero una es el domicilio y la otra es la comprada', ()=>{
        const normalizeInfo = normalizeText(textosDV.dv100);
        const spanishNormalization = normalizeTextSpanish(textosDV.dv100)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("ñuñoa");
    });

    test('Test que tiene comuna de x, el problema antes era la coma', ()=>{
        const normalizeInfo = normalizeText(textosDV.dv1602);
        const spanishNormalization = normalizeTextSpanish(textosDV.dv1602)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("maipú");
    });

    test('Test comuna de quilpue y vitacura del vendedor', ()=>{
        const normalizeInfo = normalizeText(textosDV.dv2114);
        const spanishNormalization = normalizeTextSpanish(textosDV.dv2114)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("quilpué");
    });

    test('Test comuna buscado en GP', ()=>{
        const normalizeInfo = normalizeText(textosGP.GP15491);
        const spanishNormalization = normalizeTextSpanish(textosGP.GP15491)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("santiago");
    });

    test('Otra prueba de obtener la comuna en GP', ()=>{
        const normalizeInfo = normalizeText(textosGP.GP1435);
        const spanishNormalization = normalizeTextSpanish(textosGP.GP1435)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("lota");
    });

    test('Test comuna GP viña del mar', () => {
        const normalizeInfo = normalizeText(textosGP.textoGP5);
        const spanishNormalization = normalizeTextSpanish(textosGP.textoGP5)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("viña del mar");
    });

    test('Test comuna GP coquimbo', () => {
        const normalizeInfo = normalizeText(textosGP.textoGP4);
        const spanishNormalization = normalizeTextSpanish(textosGP.textoGP4)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("coquimbo");
    });

    test('Test comuna GP la florida', () => {
        const normalizeInfo = normalizeText(textosGP.textoGP3);
        const spanishNormalization = normalizeTextSpanish(textosGP.textoGP3)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("la florida");
    });

    test('Test comuna GP teno', () => {
        const normalizeInfo = normalizeText(textosGP.textoGP2);
        const spanishNormalization = normalizeTextSpanish(textosGP.textoGP2)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual("teno");
    });

    test('Test comuna GP null', () => {
        const normalizeInfo = normalizeText(textosGP.textoGP1);
        const spanishNormalization = normalizeTextSpanish(textosGP.textoGP1)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toBeNull();
    });

    test('Test comuna GP la serena', () => {
        const normalizeInfo = normalizeText(textosGP.GP299);
        const spanishNormalization = normalizeTextSpanish(textosGP.GP299)
        const resAnno = extractor.district(spanishNormalization,normalizeInfo);
        expect(resAnno).toEqual('la serena');
    });
});

describe('ObtainDireccion', () => {
    test('test con avaluo habitacional ', () =>{
        const normalizeTexto = normalizeText(textoHabitacional1);
        const resDireccion = extractor.address(normalizeTexto, PROPIEDAD);
        expect(resDireccion).toEqual(
             'carlos pezoa veliz 0143 dp 603 ed pezoa veliz',
        );
    });
});

describe('ObtainAnno', () => {
    // test('Test de anno con diario y multiples publicaciones', () => {
    //     const normalizeInfo = pjudPdf2484.normalizeInfo(diario2484);
    //     const resAnno = pjudPdf2484.obtainAnno(normalizeInfo);
    //     expect(resAnno).toEqual("2010");

    // });

    test('Test de anno con DV ', () => {
        const normalizeInfo = normalizeText(textosDV.dv356);
        const resAnno = extractor.buyYear(normalizeInfo);
        expect(resAnno).toEqual('2021');
    });

    test('test negativo null, con lectura GP', () =>{
        const normalizeInfo = normalizeText(textosGP.textoGP1);
        const resAnno = extractor.buyYear(normalizeInfo);
        expect(resAnno).toBeNull();
    });

    test('Lectura de texto null', () => {
        const resAnno = extractor.buyYear(null);
        expect(resAnno).toBeNull();
    });

    test('Caso donde aparece el ano de inscripcion y el ano de vigencia', ()=>{
        const info = normalizeText(textosDV.dv3857);
        const anno = extractor.buyYear(info);
        expect(anno).toEqual('2014');
    });

    test('Obtener anno de DV el anno con punto',()=>{
        const info = normalizeText(textosDV.dv1750);
        const anno = extractor.buyYear(info);
        expect(anno).toEqual('2.020');
    });
    test('Obtener anno de DV 2',()=>{
        const info = normalizeText(textosDV.dv212);
        const anno = extractor.buyYear(info);
        expect(anno).toEqual('2.019');
    });

    test('Obtener el anno de registro de propiedad con parentesis',()=>{
        const info = normalizeText(textosDV.dv4991);
        const anno = extractor.buyYear(info);
        expect(anno).toEqual('2023');
    });

    test('Obtener el anno de registro de propiedad de conservador',()=>{
        const info = normalizeText(ex800);
        const anno = extractor.buyYear(info);
        expect(anno).toEqual('2005');
    });

    test('Obtener el anno con punto de conservador',()=>{
        const info = normalizeText(ex2240);
        const anno = extractor.buyYear(info);
        expect(anno).toEqual('2.020');
    });

    test('Obtener el anno de registro de propiedad de un extracto',()=>{
        const info = normalizeText(ex2226);
        const anno = extractor.buyYear(info);
        expect(anno).toEqual('2017');
    });

    test('Obtener el anno de un DV que aparecia 3430',()=>{
        const info = normalizeText(textosDV.dv11840);
        const anno = extractor.buyYear(info);
        expect(anno).toEqual('2016');
    });

    test('Obtener el anno de un DV que tiene dos annos asociados a la compra',()=>{
        const info = normalizeText(textosDV.dv9404);
        const anno = extractor.buyYear(info);
        expect(anno).toEqual(2015);
    });

    test('Obtener el null de un DV que se confundio con el anno',()=>{
        const info = normalizeText(textosDV.dv35);
        const anno = extractor.buyYear(info);
        expect(anno).toBeNull();
    });
});

describe('ObtainMontoMinimo', () => {
    // test("Obtener monto minimo a partir de diario con multiples publicaciones", () =>{
    //     const info = pjudPdf2484.normalizeInfo(diario2484);
    //     const resMontoMinimo = pjudPdf2484.obtainMontoMinimo(info);
    //     expect(resMontoMinimo).toEqual({
    //         monto: '123.136.853',
    //         moneda : "Pesos"
    //     })
    // });

    test('Obtener monto minimo de postura de un extracto',()=>{
        const info = normalizeText(ex1341);
        const montoMinimo = extractor.minAmount(info);
        expect(montoMinimo).toEqual({
            monto: '80.074.227',
            moneda : "Pesos"
        });
    });

    test('Obtener monto minimo de postura de un extracto',()=>{
        const info = normalizeText(ex1666);
        const montoMinimo = extractor.minAmount(info);
        expect(montoMinimo).toEqual({
            monto: '1031,99465',
            moneda : "UF"
        });
    });

    test('Obtener monto minimo de un acta de remate',()=>{
        const info = normalizeText(AR.AR572);
        const montoMinimo = extractor.minAmount(info);
        expect(montoMinimo).toEqual({
            monto: '81.100.000',
            moneda : "Pesos"
        });
    });

});

// describe('checkIfValidDoc',()=>{
//     test('Test de diario que deberia ser false', ()=>{
//        const res = PdfProccess.validate(diario3354_1);
//        expect(res).toEqual(false);
//     });

//     test('Test de diario que deberia ser false', ()=>{
//        const res = PdfProccess.validate(diario3354_2);
//        expect(res).toEqual(false);
//     });
// });

describe('ObtainMontoCompra', () => {
    test('Caso donde no puede obtener el monto de compra',()=>{

        const normalizeInfo = normalizeText(textosDV.dv11066);
        const resMontoCompra = extractor.housePrice(normalizeInfo);
        expect(resMontoCompra).toBeNull();
    });

    test('Obtener monto de compra de DV Pesos con se estiman', () => {
        const normalizeInfo = normalizeText(textosDV.dv356);
        const resMontoCompra = extractor.housePrice(normalizeInfo);
        expect(resMontoCompra).toEqual({
            monto: 67000000,
            moneda: 'Pesos' 
        });
    });

    test('Obtener monto de compra uf con coma DV con por el precio', () =>{
        const normalizeInfo = normalizeText(textosDV.dv23039);
        const resMontoCompra = extractor.housePrice(normalizeInfo);
        expect(resMontoCompra).toEqual({
            monto: 3192.39,
            moneda: 'UF' 
        });
    });

    test('Obtener monto de compra uf DV', () =>{
        const normalizeInfo = normalizeText(textosDV.dv12017);
        const resMontoCompra = extractor.housePrice(normalizeInfo);
        expect(resMontoCompra).toEqual({
            monto: 3756,
            moneda: 'UF' 
        });
    });

    test('Obtener motno de compra por compraventa', ()=>{
        const normalizeInfo = normalizeText(textosDV.dv13759);
        const monto = extractor.housePrice(normalizeInfo);
        expect(monto).toEqual({
            monto: 9744,
            moneda: 'UF' 
        })
    });

    test('Obtener monto de compra pesos por la suma', () =>{
        const normalizeInfo = normalizeText(textosDV.dv7140);
        const resMontoCompra = extractor.housePrice(normalizeInfo);
        expect(resMontoCompra).toEqual({
            monto: 78918749,
            moneda: 'Pesos' 
        });
    });

    test('Monto no encontrado por dacion de pago',()=>{
        const normalizeInfo = normalizeText(textosDV.dv198);
        const resMontoCompra = extractor.housePrice(normalizeInfo);
        expect(resMontoCompra).toBeNull();
    });
});

describe('obtainDeudaHipoteca', ()=>{
    test('Monto de compra donde dice mutuo y prestamo',()=>{
        const info = normalizeText(dm1056);
        const deuda = extractor.mortageDebt(info);
        expect(deuda).toEqual('uf 1248,2274');
    });

    test('Monto de compra donde dice mutuo hipotecario',()=>{
        const info = normalizeText(dm1138);
        const deuda = extractor.mortageDebt(info);
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
        const info = normalizeText(AR.AR572)
        const formatoEntrega = extractor.deliveryFormat(info)
        expect(formatoEntrega).toEqual('vale vista');
    });
});


function createCase(causa,juzgado){
    const caso1 = new Caso("1/1/2025");
    caso1.causa = causa;
    caso1.juzgado = juzgado;
    return caso1;
}