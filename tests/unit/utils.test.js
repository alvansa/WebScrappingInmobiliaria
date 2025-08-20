const {matchJuzgado, matchRol} = require('../../utils/compareText');
const convertWordToNumbers = require('../../utils/convertWordToNumbers');


describe('matchJuzgado', () => {
    test('Test con ambos null', ()=>{
        const result = matchJuzgado(null, null);
        expect(result).toBe(true);
    });

    test('Test comparando un juzgado y un null', ()=>{
        const result = matchJuzgado('1° JUZGADO DE LETRAS DE IQUIQUE', null);
        expect(result).toBe(false);
    });

    test('Test comparando entre null y un juzgado', ()=>{
        const result = matchJuzgado(null,'1° JUZGADO DE LETRAS DE IQUIQUE');
        expect(result).toBe(false);
    });

    test('Test comparando entre un juzgado de pjud y como lo escribiria andres 1', ()=>{
        const result = matchJuzgado('1° JUZGADO DE LETRAS DE IQUIQUE', '1 de iquique');
        expect(result).toBe(true);
    });

});


describe('convertWordToNumbers',()=>{
    test('No es un numero solo una palabra',()=>{
        const numberText = "arriendo";
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(0);
    });

    test('No es un numero es una frase',()=>{
        const numberText = "arriendo por mucha plata";
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(0);
    });

    test('Unidad',()=>{
        const numberText = "uno";
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(1);
    });

    test('Decena simple',()=>{
        const numberText = "diez";
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(10);
    });

    test('Decena simple 2',()=>{
        const numberText = "noventa";
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(90);
    });

    test('Decena especial',()=>{
        const numberText = "doce";
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(12);
    });

    test('Decena especial',()=>{
        const numberText = "diecinueve";
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(19);
    });

    test('Decena simple con unidad',()=>{
        const numberText = "diez y ocho";
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(18);
    });

    test('Centena 100',()=>{
        const numberText = "cien";
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(100);
    });
    test('Centena 300',()=>{
        const numberText = "trescientos";
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(300);
    });

    test('Centena con unidad 301',()=>{
        const numberText = "trescientos uno";
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(301);
    });


    test('Centena con decena',()=>{
        const numberText = "trescientos noventa";
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(390);
    });

    test('Centena con decena especial',()=>{
        const numberText = "seiscientos veinticuatro";
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(624);
    });

    test('Centena con decena y unidad',()=>{
        const numberText = "quinientos cincuenta y nueve";
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(559);
    });

    test('Mil simple',()=>{
        const numberText = 'mil';
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(1000);
    });

    test('Mil no tan simple',()=>{
        const numberText = ' cuatro mil';
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(4000);
    });

    test('Miles complejo con centenda y decena especial',()=>{
        const numberText = 'Seis mil setecientos diecinueve';
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(6719);
    });

    test('Un millon ',()=>{
        const numberText = 'un millon';
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(1000000);
    });

    test('Un millon siete',()=>{
        const numberText = 'un millon siete';
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(1000007);
    });

    test('Millones complejo con cientos de miles, miles, centena y decena especial',()=>{
        const numberText = 'nueve millones setecientos cincuenta y nueve mil trescientos veintisiete';
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(9759327);
    });

    test('Anno con tildes',()=>{
        const numberText = 'año dos mil dieciséis';
        const result = convertWordToNumbers(numberText);
        expect(result).toEqual(2016);
    });
});

describe('MatchRol', ()=>{
    test('Test basico con ambos null',()=>{
        const result = matchRol(null,null);
        expect(result).toBe(false);
    });

    test('Test basico con el primero null',()=>{
        const result = matchRol(null,'1111-1111');
        expect(result).toBe(false);
    });

    test('Test basico con el segundo null',()=>{
        const result = matchRol('1111-2222',null);
        expect(result).toBe(false);
    });

    test('Test basico con el mismo rol',()=>{
        const result = matchRol('1111-2222','1111-2222');
        expect(result).toBe(true);
    });

    test('Test comparacion rol simple con rol doble',()=>{
        const result = matchRol('1111-1111','1111-1111-2222');
        expect(result).toBe(true);
    });

    test('Test comparacion rol doble con rol simple',()=>{
        const result = matchRol('1111-1111-2222','1111-1111');
        expect(result).toBe(true);
    });

    test('Test comparacion rol simple con rol doble diferente',()=>{
        const result = matchRol('1111-1111','1111-1111//2222-2222');
        expect(result).toBe(true);
    });

    test('Test comparacion rol simple con rol doble difernte que esta en el segundo',()=>{
        const result = matchRol('1111-1111','2222-2222//1111-1111');
        expect(result).toBe(true);
    });

    test('Test comparacion rol simple que esta dentro de otro rol',()=>{
        const result = matchRol('2222-2222//1111-1111','1111-3333-2222-1111');
        expect(result).toBe(true);
    });

    test('Test falso con rol que no es exactamente el mismo',()=>{
        const result = matchRol('1111-1111','2222-2222//1111-111');
        expect(result).toBe(false);
    });

    test('Test comparacion rol simple combinado que esta dentro de otro rol combinado',()=>{
        const result = matchRol('2222-2222-3333-44444','2222-9999-2222-1111');
        expect(result).toBe(true);
    });
});