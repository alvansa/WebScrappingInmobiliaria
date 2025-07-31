const Caso = require('../../componentes/caso/caso');
const config = require('../../config');
// const createExcel = require('../../componentes/excel/createExcel')

// const excelConstructor = new createExcel("","","","",false,1);
const casoBase = Caso.createMockCase();


const EMOL = config.EMOL;
const PJUD = config.PJUD;
const LIQUIDACIONES = config.LIQUIDACIONES;
const PREREMATES = config.PREREMATES;

// describe('isCaseInDB', ()=>{
//     test('caso que si deberia estar en DB',()=>{
//         const inDB = excelConstructor.isCaseInDB(casoBase);
//         expect(inDB.causa).toEqual('C-746-2024');
//     });

//     test('Caso que busca null', ()=>{
//         const casoVacio = createCase(null,null);
//         const inDB = excelConstructor.isCaseInDB(casoVacio);
//         expect(inDB).toBeNull();
//     });

//     test('Comprobar fecha de caso con casoDB',()=>{
//        const inDB = excelConstructor.isCaseInDB(casoBase);
//         const isCColderInDB = new Date(inDB.fechaRemate) > new Date(casoBase.fechaRemate);
//         expect(isCColderInDB).toEqual(true); 
//     });
// });

describe('mergeDirections',()=>{
    test('Caso con direccion nula', ()=>{
        const casoTest = createCase("C-111-222", "1 santaigo");
        const result = casoTest.mergeDirections(null,null)
        expect(result).toBeNull();
    });
    test('Prueba con solo una direccion ',()=>{
        const casoTest = createCase("C-111-222", "1 santaigo");
        const result = casoTest.mergeDirections( 'AV LA TIRANA 4155 DP 905 EDIF ALTOS DEL MAR',null)
        expect(result).toEqual( 'av la tirana 4155 dp 905 edif altos del mar');
    });

    test('Caso con dos direcciones ',()=>{
        const casoTest = createCase("C-111-222", "1 santaigo");
        casoTest.direccion = 'AV LA TIRANA 4155 DP 905 EDIF ALTOS DEL MAR';
        casoTest.direccionEstacionamiento = 'AV LA TIRANA 4155 BX 28 EDIF ALTOS DEL MAR';
        casoTest.hasEstacionamiento = true;
        expect(casoTest.unitDireccion).toEqual('av la tirana 4155 dp 905 edif altos del mar Est bx 28 edif altos del mar')
    });
});

describe('adaptRol', () => {
    test('Caso base todo null', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.rolPropiedad = null;
        expect(casoTest.unitRol).toBeNull();
    });

    test('Prueba con caso rol propiedad en singular', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.rolPropiedad = "1111-1111";
        expect(casoTest.unitRol).toEqual("1111-1111"); 
    });

    test('Prueba con caso rol estacionamiento', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.rolEstacionamiento = "2222-2222";
        expect(casoTest.unitRol).toEqual("2222-2222"); 
    });

    test('Prueba con caso rol bodega', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.rolBodega = "3333-3333";
        expect(casoTest.unitRol).toEqual("3333-3333"); 
    });

    test('Prueba con caso rol propiedad y estacionamiento inicio igual', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.rolPropiedad = "1111-1111";
        casoTest.rolEstacionamiento = "1111-2222"
        expect(casoTest.unitRol).toEqual("1111-1111-2222"); 
    });
    
    test('Prueba con caso rol propiedad y estacionamiento inicio diferente', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.rolPropiedad = '1111-1111';
        casoTest.rolEstacionamiento = '2222-2222';
        expect(casoTest.unitRol).toEqual("1111-1111//2222-2222"); 
    });

    test('Prueba con caso rol propiedad y bodega inicio igual', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.rolPropiedad = '1111-1111';
        casoTest.rolBodega = '1111-3333';
        expect(casoTest.unitRol).toEqual("1111-1111-3333"); 
    });
    
    test('Prueba con caso rol propiedad y bodega inicio diferente', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.rolPropiedad = '1111-1111';
        casoTest.rolBodega = '3333-3333';
        expect(casoTest.unitRol).toEqual("1111-1111//3333-3333"); 
    });
    
    test('Prueba con caso rol propiedad, estacionamiento y bodega inicio igual', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.rolPropiedad = '1111-1111';
        casoTest.rolEstacionamiento = '1111-2222';
        casoTest.rolBodega = '1111-3333';
        expect(casoTest.unitRol).toEqual("1111-1111-2222-3333"); 
    });
    
    test('Prueba con caso rol propiedad, estacionamiento y bodega inicio diferente', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.rolPropiedad = '1111-1111';
        casoTest.rolEstacionamiento = '2222-2222';
        casoTest.rolBodega = '3333-3333';
        expect(casoTest.unitRol).toEqual("1111-1111//2222-2222//3333-3333"); 
    });
    
    test('Prueba con caso rol propiedad, estacionamiento igual y bodega diferente', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.rolPropiedad = '1111-1111';
        casoTest.rolEstacionamiento = '1111-2222';
        casoTest.rolBodega = '3333-3333';
        expect(casoTest.unitRol).toEqual("1111-1111-2222//3333-3333"); 
    });

    test('Prueba con caso rol propiedad diferente estacionamiento y bodega igual', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.rolPropiedad = '1111-1111';
        casoTest.rolEstacionamiento = '2222-2222';
        casoTest.rolBodega = '2222-3333';
        expect(casoTest.unitRol).toEqual("2222-2222-3333//1111-1111"); 
    });

    test('Prueba con caso rol propiedad bodega igual y estacionamiento diferente', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.rolPropiedad = '1111-1111';
        casoTest.rolEstacionamiento = '2222-2222';
        casoTest.rolBodega = '1111-3333';
        expect(casoTest.unitRol).toEqual("1111-1111-3333//2222-2222"); 
    });

});

describe('SumAvaluo', () => {
    test('Prueba con envio null', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        expect(casoTest.unitAvaluo).toBeNull();
    });

    test('Prueba con solo avaluo propiedad', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.avaluoPropiedad = 100000;
        expect(casoTest.unitAvaluo).toEqual(100000);
    });

    test('Prueba pasando texto cualquiera', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.avaluoPropiedad = "asd";
        expect(casoTest.unitAvaluo).toEqual(0);
    });

    test('Prueba pasando texto cualquiera con numero', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.avaluoPropiedad = 'asd';
        casoTest.avaluoEstacionamiento = 123;
        expect(casoTest.unitAvaluo).toEqual(123);
    });

    test('Prueba pasando texto cualquiera con 2 numeros', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.avaluoPropiedad = 'asd';
        casoTest.avaluoEstacionamiento = 123;
        casoTest.avaluoBodega = 123;
        expect(casoTest.unitAvaluo).toEqual(246);
    });

    test('Prueba con solo avaluo propiedad pasando texto', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.avaluoPropiedad = '100000';
        expect(casoTest.unitAvaluo).toEqual(100000);
    });

    test('Prueba con avaluo propiedad y estacionamiento', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.avaluoPropiedad = 1000000;
        casoTest.avaluoEstacionamiento = 200000;
        expect(casoTest.unitAvaluo).toEqual(1200000);
    });

    test('Prueba con avaluo propiedad, estacionamiento y bodega', () =>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.avaluoPropiedad = 1000000;
        casoTest.avaluoEstacionamiento = 200000;
        casoTest.avaluoBodega = 30000;
        expect(casoTest.unitAvaluo).toEqual(1230000);
    });
});

describe('completeInfo',()=>{
    test('Caso pjud con vacio',()=>{
       const casoVacio = createCase(null,null);
       const casoNuevo = Caso.completeInfo(casoBase,casoVacio);
       expect(casoNuevo.causa).toEqual(casoBase.causa);
    });

    test('Caso vacio con pjud',()=>{
       const casoVacio = createCase(null,null);
       const casoNuevo = Caso.completeInfo(casoVacio, casoBase);
       expect(casoNuevo.causa).toEqual(casoBase.causa);
    });

    test('Caso emol con pjud',()=>{
       const casoEmol = createCase('C-1234-4321','30º Juzgado Civil de Santiago');
       casoEmol.origen = EMOL;
       const casoNuevo = Caso.completeInfo(casoEmol,casoBase);
       expect(casoNuevo.causa).toEqual(casoBase.causa);
    });

    test('Caso pjud con emol',()=>{
       const casoEmol = createCase('C-1234-4321','30º Juzgado Civil de Santiago');
       casoEmol.origen = EMOL;
       const casoNuevo = Caso.completeInfo(casoBase,casoEmol);
       expect(casoNuevo.causa).toEqual(casoBase.causa);
    });

    test('Caso vacio con emol',()=>{
       const casoEmol = createCase('C-1234-4321','30º Juzgado Civil de Santiago');
       casoEmol.origen = EMOL;
       const casoVacio = createCase(null,null);
       const casoNuevo = Caso.completeInfo(casoVacio,casoEmol);
       expect(casoNuevo.causa).toEqual(casoEmol.causa);
    });
    test('Dos casos vacios',()=>{
       const casoVacio = createCase(null,null);
       const casoVacio2 = createCase(null,null)
       const casoNuevo = Caso.completeInfo(casoVacio,casoVacio2);
       expect(casoNuevo.causa).toBeNull();
    });
});

describe('checkEstacionamientoBodega', ()=>{
    test('Caso sin nada', ()=>{
        const casotest = createCase('C-1111-2222','');
        expect(casotest.unitDireccion).toBeNull();
    });

    test('Caso sin estacionamiento ni bodega', ()=>{
        const casotest = createCase('C-1111-2222','');
        casotest.direccion = 'AV LA TIRANA 4155 DP 905 EDIF ALTOS DEL MAR';
        expect(casotest.unitDireccion).toEqual('AV LA TIRANA 4155 DP 905 EDIF ALTOS DEL MAR');
    });

    test('Caso con estacionamiento sin Bodega', ()=>{
        const casotest = createCase('C-1111-2222','');
        casotest.direccion = 'AV LA TIRANA 4155 DP 905 EDIF ALTOS DEL MAR';
        casotest.direccionEstacionamiento = 'AV LA TIRANA 4155 BX 28 EDIF ALTOS DEL MAR';
        casotest.hasEstacionamiento = true;
        expect(casotest.unitDireccion).toEqual('av la tirana 4155 dp 905 edif altos del mar Est bx 28 edif altos del mar');
    });

    test('Caso con estacionamiento y Bodega', ()=>{
        const casotest = createCase('C-1111-2222','');
        casotest.direccion = 'AV LA TIRANA 4155 DP 905 EDIF ALTOS DEL MAR';
        casotest.direccionEstacionamiento = 'AV LA TIRANA 4155 BX 28 EDIF ALTOS DEL MAR';
        casotest.hasEstacionamiento = true;
        casotest.hasBodega = true;
        expect(casotest.unitDireccion).toEqual('av la tirana 4155 dp 905 edif altos del mar Est bx 28 edif altos del mar BOD');
    });
});

describe('normalizarMontoMinimo',()=>{
    test('Caso con monto minimo nulo', ()=>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.montoMinimo = null;
        expect(casoTest.montoMinimo).toBeNull();
    });

    test('Caso con monto minimo UF con coma',()=>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.montoMinimo = {
            monto: '1031,99465',
            moneda: 'UF'
        };
        expect(casoTest.montoMinimo).toEqual({
            monto: 1031.99465,
            moneda: 'UF'
        });
    });

    test('Caso con minimo UF sin coma',()=>{
        const casoTest = createCase("C-111-222","1 santaigo");
        casoTest.montoMinimo = {
            monto: '1031',
            moneda: 'UF'
        };
        expect(casoTest.montoMinimo).toEqual({
            monto: 1031,
            moneda: 'UF'
        });

    });

});

describe('Normalizar formato entrega', ()=>{
    test('Test nulo ', ()=>{
        casoBase.formatoEntrega = null;
        expect(casoBase.formatoEntrega).toBeNull();
    });
    
    test('Test basico ', ()=>{
        const formato = 'vale            vista';
        casoBase.formatoEntrega = formato;
        expect(casoBase.formatoEntrega).toEqual('vale vista');
    });

    test('Test vale a la vista ', ()=>{
        const formato = 'vale a la vista';
        casoBase.formatoEntrega = formato;
        expect(casoBase.formatoEntrega).toEqual('vale vista');
    });

    test('Test con salto de linea ', ()=>{
        const formato = 'vale a\n la vista';
        casoBase.formatoEntrega = formato;
        expect(casoBase.formatoEntrega).toEqual('vale vista');
    });

    test('Test con salto de linea ', ()=>{
        const formato = 'vale a\n la           VISTA';
        casoBase.formatoEntrega = formato;
        expect(casoBase.formatoEntrega).toEqual('vale vista');
    });
});


function createCase(causa,juzgado){
    const caso1 = new Caso("1/1/2025");
    caso1.causa = causa;
    caso1.juzgado = juzgado;
    return caso1;
}