const {changeWordsToNumbers} = require('../../componentes/economico/extractors/directionExtractor');
const {extractAuctionDate} = require('../../componentes/economico/extractors/auctionDateExtractor');
const {processMortageBank} = require('../../componentes/pdfProcess/extractors/mortageBank');
const {extractDirection, adaptDirectionToExcel} = require('../../componentes/economico/extractors/directionExtractor.js');
const PjudPdfData = require('../../componentes/pjud/PjudPdfData');
const extractors = require('../../componentes/pdfProcess/extractors/index');
const {normalizeText} = require('../../utils/textNormalizers');

const txGP = require('../textos/GP');
const DEMANDA = require('../textos/DM');
const extracto = require('../textos/Extracto');
const { experiments } = require('webpack');
const { desktopCapturer } = require('electron');
 


describe('test de convertir frases con n°s escritos en palabras a numeros',()=>{
    test('Partes nulas',()=>{
        expect(changeWordsToNumbers(null)).toBeNull();
    });

    test('Test n° uno con varias direcciones' , ()=>{
        const texto = 'inmueble consistente en el departamento n° ciento tres del primer piso del edificio n° cuatro y del Est n° ochenta y seis del segundo subterráneo del condominio parque tobalaba ii ubicado en avenida tobalaba n° siete mil trescientos once, comuna de la';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('inmueble consistente en el departamento n° 103 del primer piso del edificio n° 4 y del Est n° 86 del segundo subterráneo del condominio parque tobalaba ii ubicado en avenida tobalaba n° 7311 comuna de la');
    });

    test('Test n° dos con varias direcciones' , ()=>{
        const texto = 'inmuebles de calle el parrón n° doscientos veinticuatro, doscientos cuarenta y cuatro, doscientos sesenta y cuatro- a y doscientos sesenta y cuatro-b, de la comuna de la';
        const res = changeWordsToNumbers(texto);
    });

    test('Test n° tres con varias direcciones' , ()=>{
        const texto = 'propiedad de la demandada doña angelica nataly villanueva galvez y que consiste en el departamento n° cuatrocientos dieciséis del cuarto piso y del estacionamiento n° e cero ciento veintitrés del segundo subterráneo, ambos del conjunto habitacional denominado doña petronila, con acceso por calle santa petronila n° treinta y dos, comuna de estaci Est santa petronila 32 est 123';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('propiedad de la demandada doña angelica nataly villanueva galvez y que consiste en el departamento n° 416 del cuarto piso y del estacionamiento n° 123 del segundo subterráneo, ambos del conjunto habitacional denominado doña petronila, con acceso por calle santa petronila n° 32 comuna de estaci Est santa petronila 32 est 123');
    });

    test('Test n° cuatro con varias direcciones' , ()=>{
        const texto = 'departamento n° mil quinientos seis a del décimo quinto piso y de la bodega n° doscientos cincuenta del tercer subterráneo, del edificio con acceso por calle cóndor n° setecientos noventa y tres, de la segunda etapa del condominio nueva era san francisco, comuna de santiago Est condor 793 box 121 BOD';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('departamento n° 1506 a del décimo quinto piso y de la bodega n° 250 del tercer subterráneo, del edificio con acceso por calle cóndor n° 793 de la segunda etapa del condominio nueva era san francisco, comuna de santiago Est condor 793 box 121 BOD');
    });

    test('Test n° cinco con varias direcciones' , ()=>{
        const texto = 'parcela n° veintiuno originada de la división de la parcela n° cuarenta y dos de la colonia peñaflor, comuna de pe';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('parcela n° 21 originada de la división de la parcela n° 42 de la colonia peñaflor, comuna de pe');
    });

    test('Test n° seis con varias direcciones' , ()=>{
        const texto = 'departamento n° ochocientos veintiuno del piso octavo de la torre oriente, de la bodega n° noventa y cuatro del segundo subterráneo y del Est n° nueve del primer piso, todos del denominado edificio novo, con acceso principal por calle portugal n° quinientos sesenta y cuatro, comuna de santiago';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('departamento n° 821 del piso octavo de la torre oriente, de la bodega n° 94 del segundo subterráneo y del Est n° 9 del primer piso, todos del denominado edificio novo, con acceso principal por calle portugal n° 564 comuna de santiago');
    });

    test('Test artificial con n° simple' , ()=>{
        const texto = 'propiedad con el n° siete';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('propiedad con el n° 7');
    });

    test('Test artificial con n° simple en propiedad y estacionamiento' , ()=>{
        const texto = 'propiedad con el n° siete y estacionamiento n° trece';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('propiedad con el n° 7 y estacionamiento n° 13');
    });

    test('Test artificial con n° que incluye un y' , ()=>{
        const texto = 'propiedad con el n° siete mil trescientos treinta y uno';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('propiedad con el n° 7331');
    });

    test('Otro test con causa de emol C-6782-2025 4/11' , ()=>{
        const texto = 'departamento n° mil ciento siete del piso undécimo y del Est n° e cero veintiuno del piso primero, ambos del conjunto habitacional denominado edificio novo, con ingreso por calle santa petronila n° treinta y ocho, comuna de estaci';
        const res = changeWordsToNumbers(texto);
    });

    test('Otro test con causa de emol C-12721-2024 4/11' , ()=>{
        const texto = 'departamento n° setecientos seis del séptimo piso y el Est n° veintidós en conjunto con la bodega n° treinta y tres, ambos del primer subterráneo, todos del edificio denominado plaza de agua o edificio argomedo trescientos veinte con acceso principal por calle argomedo n° trescientos veinte, comuna de santiago';
        const res = changeWordsToNumbers(texto);
    });

    test('Test artificial para n° x' , ()=>{
        const texto = 'Parcela n° 345';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('Parcela n° 345')
    });

    test('Test artificial para n° x seguido coma' , ()=>{
        const texto = 'Parcela n° 345,';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('Parcela n° 345,')
    });

    test('Test artificial para dos no conversiones de n°' , ()=>{
        const texto = 'Parcela n° 345 que colide con edificio tralala y estacionamiento n 35';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('Parcela n° 345 que colide con edificio tralala y estacionamiento n 35')
    });

    test('Test artificial para una conversion y una no conversion' , ()=>{
        const texto = 'Parcela n° trescientos cuarenta y cinco que colide con edificio tralala y estacionamiento n 35';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('Parcela n° 345 que colide con edificio tralala y estacionamiento n 35')
    });

    test('Test artificial para una no conversion y una conversion' , ()=>{
        const texto = 'Parcela n° 345 que colide con edificio tralala y estacionamiento n° treinta y cinco';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('Parcela n° 345 que colide con edificio tralala y estacionamiento n° 35')
    });

    test('Test artificial para probar n° que incluye un "y" al final de la descripcion del numero' , ()=>{
        const texto = 'Departamento n° mil quinientos veinte y un estacionamiento n° trescientos dos';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('Departamento n° 1520 y un estacionamiento n° 302')
    });

    test('Test para probar cuando el n° termina con un "-{letra}"' , ()=>{
        const texto = 'la propiedad consistente en el departamento n° mil ochocientos siete-C';
        const res = changeWordsToNumbers(texto);
        expect(res).toBe('la propiedad consistente en el departamento n° 1807')
    });

    test('Test para probar cuando se mezclan n°s' , ()=>{
        const texto = 'la propiedad consistente en el departo n° dosmil quinientos';
        const res = changeWordsToNumbers(texto);
        // expect(res).toBe('la propiedad consistente en el departamento n° 2500')
    });

    test('Test para probar n° con tilde' , ()=>{
        const texto = 'la propiedad consistente en el departo n° dosmil quinientos';
        const res = changeWordsToNumbers(texto);
        // expect(res).toBe('la propiedad consistente en el departamento n° 2500')
    });

    test('Test para probar n° veinticuatro', ()=>{
        const texto = 'dp veinticuatro del P2 y la bod quince del primer subterráneo, del edificio ubicado en avd manquehue norte n° quinientos cincuenta y cinco, denominado edificio los cedros, comuna de las';
        const rest = changeWordsToNumbers(texto,true);
        expect(rest).toBe('dp 24 del P2 y la bod 15 del primer subterráneo, del edificio ubicado en avd manquehue norte n° 555 denominado edificio los cedros, comuna de las');
    });

});

describe('test para extraer fecha de remate',()=>{

    test('test prueba para verificar si obtiene del resumen', ()=>{
        const text = 'Mensaje desde el browser Remate: 19º Juzgado Civil Santiago Huérfanos 1409, Piso 5, en causa Rol C-13993-2023 el 14 octubre 2025 a las 13:00 hrs se realizará subasta vía plataforma videoconferencia Zoom propiedad Pasaje Lloret Nº 8019, Conjunto Habitacional Jardín Poniente, Comuna Renca, inscrito a Fojas 15121 Nº 24089 Regi';
        const res = extractAuctionDate(text);
        expect(res).toBe('14 octubre 2025')
    });

    test('test prueba para verificar si obtiene del resumen', ()=>{
        const text = 'Remate: Primer Juzgado Civil De Santiago, Huérfanos 1409, piso 15 santiago, rematará 21 de octubre de 2025 a las 14:50 horas, departamento nº 2.619 del 26º piso y de la bodega nº 74 del 1º subterráneo, ambos de la torre oriente del edificio Portal Independencia, 2º etapa, con acceso por Avenida Inde';
        const res = extractAuctionDate(text);
        // expect(res)
    });
});

describe('test para extraer el banco que tiene la hipoteca del GP', ()=>{

    test('Test para obtener el banco Security', ()=>{
        const text = txGP.textoGP1;
        const banco = processMortageBank(text);
        expect(banco).toBe('Security');
    });

    test('Test para obtener el banco de credito e inversiones', ()=>{
        const text = txGP.textoGP2;
        const banco = processMortageBank(text);
        expect(banco).toBe('BCI');
    });

    test('Test para obtener el banco cuando no lo encuentra y es nulo', ()=>{
        const text = txGP.textoGP3;
        const banco = processMortageBank(text);
        expect(banco).toBeNull();
    });
    
    test('Test para obtener el banco bbva o bilbao vizcaya argentaria', ()=>{
        const text = txGP.textoGP5;
        const banco = processMortageBank(text);
        expect(banco).toBe('BBVA');
    });

    test('Test para obtener el banco santander sin espacios', ()=>{
        const text = txGP.texto12Santiago;
        const banco = processMortageBank(text);
        expect(banco).toBe('Scotiabank');
    });

    test('Test para obtener el banco BCI con una "hipoteca en favor"', ()=>{
        const text = txGP.GP668;
        const banco = processMortageBank(text);
        expect(banco).toBe('BCI');
    });

    test('Test para obtener el banco estado', ()=>{
        const text = txGP.GP6562;
        const banco = processMortageBank(text);
        expect(banco).toBe('Estado');
    });

    test('Test para obtener el banco estado', ()=>{
        const text = txGP.GP546;
        const parte = 'FONDO DE INVERSION ACTIVA DEUDA HIPOTECARIA CON SUBSIDIO HABITACIONAL II';
        const banco = processMortageBank(text, parte);
        expect(banco).toBe('Fondo De Inversion Activa Deuda Hipotecaria Con Subsidio Habitacional Ii');
    });

    test('Test para obtener el banco falabella con el acreedor y no punto', ()=>{
        const text = txGP.GP1361;
        const banco = processMortageBank(text);
        expect(banco).toBe('Falabella');
    });

    test('Test para obtener el banco BBVA cuando este fallaba', ()=>{
        const text = txGP.GP246;
        const banco = processMortageBank(text);
        expect(banco).toBe('BBVA');
    });

    test('Test para obtener el banco estado con hipoteca de primer grado', ()=>{
        const text = txGP.GP1655;
        const banco = processMortageBank(text);
        expect(banco).toBe('Estado');
    });
    
    test('Test para obtener el banco de Chile', ()=>{
        const text = txGP.GP3657;
        const banco = processMortageBank(text);
        expect(banco).toBe('Banco De Chile');
    });

    test('Test para obtener el banco estado con segunda hipoteca', ()=>{
        const text = txGP.GP899;
        const banco = processMortageBank(text);
        expect(banco).toBe('Estado');
    });

    test('Test para obtener el banco BCI con puntos de por medio por las fojas', ()=>{
        const text = txGP.GP973;
        const banco = processMortageBank(text);
        expect(banco).toBe('BCI');
    });

    test('Test para obtener el banco Estado como primera hipoteca', ()=>{
        const text = txGP.GP33;
        const banco = processMortageBank(text);
        expect(banco).toBe('Estado');
    });

    test('Test para obtener el banco Santander con hipotecas', ()=>{
        const text = txGP.GP5051;
        const banco = processMortageBank(text);
        expect(banco).toBe('Santander');
    });

    test('Test para obtener el hipotecario que no es un banco', ()=>{
        const text = txGP.GP6782;
        const banco = processMortageBank(text,null);
        expect(banco).toBeNull();

    });
});

describe('Test para obtener el texto de la demanda', ()=>{

    test('Test para texto de demanda que la deuda esta separada por espacios',()=>{
        // const pjud = new PjudPdfData(null,null,null);

        const demanda = DEMANDA.dm8094;
        const normDemanda = normalizeText(demanda);
        const deuda = extractors.mortageDebt(normDemanda);
        expect(deuda).toBe('2488,1308 unidades de fomento');

    })
})

describe('Test para probar la direccion y adaptacion a excel', () =>{

    test('Test de piso y cambio de piso por n°', ()=>{
        const direccion = extractDirection(extracto.ex11393)
        expect(direccion).toBe('dp 24 del P2 y la bod 15 del primer subterráneo, del edificio ubicado en avd manquehue norte n° 555 denominado edificio los cedros, comuna de las');
    });

    describe('Test de adaptaciones al excel centrados en el cambio de piso', ()=>{

        test('Test de cambio caso "primer piso', ()=>{
            const direccion = adaptDirectionToExcel('dp 24 del primer piso y la bod 15 del primer subterráneo');
            expect(direccion).toBe('dp 24 del P1 y la bod 15 del primer subterráneo');
        })

        test('Test de cambio caso "vigesimocuarto piso', ()=>{
            const direccion = adaptDirectionToExcel('departamento 24 del vigesimocuarto piso y la bod 15 del primer subterráneo ubicado en avd manquehue norte n° 555 denominado edificio los cedros.');
            expect(direccion).toBe('dp 24 P24 y la bod 15 del primer subterráneo ubicado en avd manquehue norte n° 555 denominado edificio los cedros.');
        })

        test('Test de cambio caso "piso vigesimocuarto', ()=>{
            const direccion = adaptDirectionToExcel('departamento 24 del piso vigesimocuarto y la bod 15 del primer subterráneo ubicado en avd manquehue norte n° 555 denominado edificio los cedros.');
            expect(direccion).toBe('dp 24 P24 y la bod 15 del primer subterráneo ubicado en avd manquehue norte n° 555 denominado edificio los cedros.');
        })
    })

});

