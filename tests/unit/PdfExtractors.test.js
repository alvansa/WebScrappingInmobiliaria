const extractor = require('../../componentes/pdfProcesors/extractors');
const {normalizeText}  = require('../../utils/textNormalizers');
const config = require('../../config');


const AV = require('../textos/Avaluo');

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
});