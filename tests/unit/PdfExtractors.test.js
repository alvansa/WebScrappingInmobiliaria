const extractor = require('../../componentes/pdfProcess/extractors');
const {normalizeText, normalizeTextSpanish}  = require('../../utils/textNormalizers');
const config = require('../../config');


const AV = require('../textos/Avaluo');
const GP = require('../textos/GP');
const AR = require('../textos/ActaRemate');
const DV = require('../textos/DV');
const EX = require('../textos/Extracto');

const PROPIEDAD = config.PROPIEDAD;
const ESTACIONAMIENTO = config.ESTACIONAMIENTO;
const BODEGA = config.BODEGA;


describe('Test de obtencion de roles de avaluo ',()=>{
    test('Avaluo propiedad', ()=>{
        const normText = normalizeText(AV.textoHabitacionMultiple);
        const result = extractor.propertyId(normText,PROPIEDAD);
        expect(result).toEqual('03795 - 00302');
    });

    test('Avaluo estacionamiento', ()=>{
        const normText = normalizeText(AV.textoEstacionamientoMultiple);
        const result = extractor.propertyId(normText,ESTACIONAMIENTO);
        expect(result).toEqual('03795 - 00474');
    });

    test('Avaluo bodega', ()=>{
        const normText = normalizeText(AV.textoBodegaMultiple)
        const result = extractor.propertyId(normText,BODEGA);
        expect(result).toEqual('03795 - 00368');
    });

    test('Avaluo de estacionamiento tratatando de obtener bodega', ()=>{
        const normText = normalizeText(AV.textoEstacionamientoMultiple)
        const result = extractor.propertyId(normText,BODEGA);
        expect(result).toBeNull();
    });
});

describe('Test de obtencion de valores de avaluo ',()=>{
    test('Avaluo propiedad', ()=>{
        const normText = normalizeText(AV.textoHabitacionMultiple);
        const result = extractor.propertyValuation(normText,PROPIEDAD);
        expect(result).toEqual('59921526');
    });

    test('Avaluo estacionamiento', ()=>{
        const normText = normalizeText(AV.textoEstacionamientoMultiple);
        const result = extractor.propertyValuation(normText,ESTACIONAMIENTO);
        expect(result).toEqual('4426829');
    });

    test('Avaluo bodega', ()=>{
        const normText = normalizeText(AV.textoBodegaMultiple)
        const result = extractor.propertyValuation(normText,BODEGA);
        expect(result).toEqual('865771');
    });

    test('Avaluo de estacionamiento tratatando de obtener bodega', ()=>{
        const normText = normalizeText(AV.textoEstacionamientoMultiple)
        const result = extractor.propertyValuation(normText,BODEGA);
        expect(result).toBeNull();
    });

    // test('Avaluo de estacionamiento', ()=>{
    //     const normText = normalizeText(AV.textoEstacionamientoMultiple)
    //     const result = extractor.propertyValuation(normText,BODEGA);
    //     expect(result).toBeNull();
    // });
});

describe('Obtener comunas', ()=>{
    test('Obtener comuna de GP', ()=>{
        const texto = GP.GP15491;
        const norm = normalizeText(texto);
        const spa = normalizeTextSpanish(texto);
        const comuna = extractor.district(spa, norm);
        expect(comuna).toEqual('santiago');
    });

    test('Obtener comuna de Avaluo 1', ()=>{
        const texto = AV.av7156;
        const norm = normalizeText(texto);
        const spa = normalizeTextSpanish(texto);
        const comuna = extractor.district(spa, norm);
        expect(comuna).toEqual('concepcion');
    });

    test('Obtener comuna de Avaluo 2', ()=>{
        const texto = AV.av1028;
        const norm = normalizeText(texto);
        const spa = normalizeTextSpanish(texto);
        const comuna = extractor.district(spa, norm);
        expect(comuna).toEqual('concon');
    });

    test('Obtener comuna de Avaluo 3', ()=>{
        const texto = AV.av3025;
        const norm = normalizeText(texto);
        const spa = normalizeTextSpanish(texto);
        const comuna = extractor.district(spa, norm);
        expect(comuna).toEqual('copiapo');
    });

    test('Obtener comuna de Avaluo 4', ()=>{
        const texto = AV.av2443;
        const norm = normalizeText(texto);
        const spa = normalizeTextSpanish(texto);
        const comuna = extractor.district(spa, norm);
        expect(comuna).toEqual('chillan');
    });

    test('Obtener comuna de Avaluo 5', ()=>{
        const texto = AV.av1065;
        const norm = normalizeText(texto);
        const spa = normalizeTextSpanish(texto);
        const comuna = extractor.district(spa, norm);
        expect(comuna).toEqual('curacavi');
    });

    test('Obtener comuna de Acta de remate', ()=>{
        const texto = AR.AR572;
        const norm = normalizeText(texto);
        const spa = normalizeTextSpanish(texto);
        const comuna = extractor.district(spa, norm);
        expect(comuna).toEqual('santiago');
    });
});

describe('Prueba para obtener direccion de inmueble y estacionamiento', ()=>{

    test('Direccion de inmueble de acta de remate', ()=>{
        const texto = AR.AR2396;
        const norm = normalizeText(texto)
        const direccion = extractor.address(norm, PROPIEDAD);
        expect(direccion).toBe(`la campina sitio nº 26, loteo la campina,`);
    });

    test('Direccion de Estacionamiento deberia ser null, acta remate', ()=>{
        const texto = AR.AR2396;
        const norm = normalizeText(texto)
        const direccion = extractor.address(norm, ESTACIONAMIENTO);
        expect(direccion).toBeNull();
    });

    test('Direccion de inmueble de acta de remate 2', ()=>{
        const texto = AR.AR572;
        const norm = normalizeText(texto)
        const direccion = extractor.address(norm, PROPIEDAD);
        expect(direccion).toBe(`calle santa rosa nº 991: departamento nº 905; estacionamiento nº 234, y bodega nº 173, del tercer subterraneo; todos del proyecto "edificio espacio santa rosa",`);
    });

    test('Direccion de inmueble de avaluo', ()=>{
        const texto = AV.textoHabitacional1;
        const norm = normalizeText(texto)
        const direccion = extractor.address(norm, PROPIEDAD);
        expect(direccion).toBe('carlos pezoa veliz 0143 dp 603 ed pezoa veliz');
    });
});

describe('Pruebas de obtencion de anno de compra', ()=>{})

describe('Pruebas de obtencion de monto de compra', ()=>{

    test('Obtener monto de compra de DV con en la suma', ()=>{

        const text = DV.dv2114;
        const norm = normalizeText(text);
        const monto = extractor.housePrice(norm);
        expect(monto).toEqual({
            monto: 3539,
            moneda: "UF"
        });
    })

    test('Obtencion de monto de compra con GP y DV combinado',()=>{
        const text = GP.DVGP1082;
        const norm = normalizeText(text);
        const monto = extractor.housePrice(norm);
        expect(monto).toEqual({
            monto: 3766,
            moneda: "UF"
        });

    });
})

describe('Pruebas de obtencion de monto minimo de remate', ()=>{
    test('Obtener monto minimo de extracto de remate', ()=>{
        const text = EX.ex1666;
        const norm = normalizeText(text);
        const monto = extractor.minAmount(norm);
        expect(monto).toEqual({
            monto: '1031,99465',
            moneda: "UF"
        });
    })
});

describe('Test de banco hipoteca', ()=>{
    test('test con hipoteca - ',()=>{
        const norm = normalizeText(GP.GP5424);
        const banco = extractor.mortageBank(norm);
        expect(banco).toBe('Banco De Chile');
    })
})

describe('Pruebas para derechos', ()=>{
    //TODO: Es un estatuto y el usufructo solo aparece como peticion de revision
    test('Test para explicacion de usufructo',()=>{
        const text = `CONSTITUCION DE GARANTIAS Constituir toda clase de garantías, hipotecas,
prendas, fianzas simples y/o solidarias, avales en letras de cambio o pagarés, constituirse en
codeudor solidario, warrant, gravar los bienes sociales con derechos de uso, usufructo,
habitación, etcétera; constituir servidumbres activas o pasivas; posponerlas`;
        const norm = normalizeText(text);
        const tipoDerecho = extractor.rightType(norm);
        // expect(tipoDerecho).toBeNull();
    })
})