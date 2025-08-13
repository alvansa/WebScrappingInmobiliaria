const DateHelper = require('../../componentes/caso/Normalizers/DateHelper');

const PJUD = 2;

describe('Fechas en pjud', () => {
    test('Normalizacion de fecha basica 1', () =>{
        const fecha = '28/08/2025 15:45';
        const fechaNormalizada = DateHelper.normalize(fecha, PJUD);
        expect(fechaNormalizada).toBeInstanceOf(Date);
        expect(fechaNormalizada).toEqual(new Date(2025, 7, 28));
    });

    test('Caso nulo',()=>{
        const resFecha = DateHelper.normalize(null, null);
        expect(resFecha).toBeNull();
    });
    
    test('Caso Date sin origen',()=>{
        const fecha = new Date('2025/12/25');
        const resFecha = DateHelper.normalize(fecha, null);
        expect(resFecha).toEqual(new Date('2025/12/25'));
    });

    test('Caso Date origen EMOL',()=>{
        const fecha = new Date('2025/12/25');
        const resFecha = DateHelper.normalize(fecha, null);
        expect(resFecha).toEqual(new Date('2025/12/25'));
    });

    test('Caso 07 agosto 2025',()=>{
        const fecha = '07 agosto 2025';
        const resFecha = DateHelper.normalize(fecha, null);
        expect(resFecha).toEqual(new Date('2025/08/07'));
    });

    test('Caso PJUD',()=>{
        const fecha = '01/08/2025 13:00';
        const resFecha = DateHelper.normalize(fecha,null);
        expect(resFecha).toEqual(new Date('2025/08/01'));
    });

    test('Caso Boletin', ()=>{
        const fecha = '09/07/2025 15:00';
        const resFecha = DateHelper.normalize(fecha,null);
        expect(resFecha).toEqual(new Date('2025/07/09'));
    });

    test('caso con barra lateral "/"', ()=>{
        const fecha = '25/12/2025';
        const resFecha = DateHelper.normalize(fecha,null);
        expect(resFecha).toEqual(new Date('2025/12/25'));
    });

    test('Caso con fecha en palabras', ()=>{
        const fecha = '25 de diciembre del 2025';
        const resFecha = DateHelper.normalize(fecha,null);
        expect(resFecha).toEqual(new Date('2025/12/25'));
    });
    
    test('Caso con fecha en palabras', ()=>{
        const fecha = 'Wed Dec 25 2024 00:00:00 GMT-0300 (Chile Summer Time)';
        const resFecha = DateHelper.normalize(fecha,null);
        expect(resFecha).toEqual(new Date('2024/12/25'));
    });


    test('Caso con fecha en palabras como EMOL', ()=>{
        const fecha = 'veinticinco de diciembre del 2024';
        const resFecha = DateHelper.normalize(fecha,null);
        expect(resFecha).toEqual(new Date('2024/12/25'));
    });

    test('Caso con fecha en numero y palabras emol', ()=>{
        const fecha = '3 de septiembre 2025';
        const resFecha = DateHelper.normalize(fecha,null);
        expect(resFecha).toEqual(new Date('2025/09/03'));
    });

    test('Caso con fecha en numero, palabras emol y ano con punto', ()=>{
        const fecha = '29 de Agosto de 2.025';
        const resFecha = DateHelper.normalize(fecha,null);
        expect(resFecha).toEqual(new Date('2025/08/29'));
    });

    test('Caso con fecha 20 de agosto de 2025', ()=>{
        const fecha = '20 de agosto de 2025';
        const resFecha = DateHelper.normalize(fecha,null);
        expect(resFecha).toEqual(new Date('2025/08/20'));
    });
})

// describe('normalizarFechaRemate', ()=>{

// });