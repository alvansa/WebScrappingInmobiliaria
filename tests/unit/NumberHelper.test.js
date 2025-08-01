const NumberHelper = require('../../componentes/caso/Normalizers/NumberHelper');

describe('Normalizar deuda hipotecaria',()=>{
    test('Caso null', ()=>{
        const deudaNormalizada = NumberHelper.deudaHipotecaria(null);
        expect(deudaNormalizada).toBeNull();
    });

    test('Test con deuda tipo unidades de fomento',()=>{
        const deuda = '718,690876 unidades de fomento';
        const deudaNormalizada = NumberHelper.deudaHipotecaria(deuda);
        expect(deudaNormalizada).toEqual(718.690876);
    });

    test('Caso con signo peso $', ()=>{
        const deuda = '$ 35769403';
        const deudaNormalizada = NumberHelper.deudaHipotecaria(deuda);
        expect(deudaNormalizada).toEqual(35769403);
    });

    test('Caso con uf al final', ()=>{
        const deuda = '678,911695 uf';
        const deudaNormalizada = NumberHelper.deudaHipotecaria(deuda);
        expect(deudaNormalizada).toEqual(678.911695);
    });

    test('Caso con uf al inicio', ()=>{
        const deuda = 'uf 1326,3657';
        const deudaNormalizada = NumberHelper.deudaHipotecaria(deuda);
        expect(deudaNormalizada).toEqual(1326.3657);
    });

    test('Caso con unidad de foemtno y guion - ', ()=>{
        const deuda = '1145,0897- unidades de fomento';
        const deudaNormalizada = NumberHelper.deudaHipotecaria(deuda);
        expect(deudaNormalizada).toEqual(1145.0897);
    });

    test('Caso con unidad de fometno sin espacios ', ()=>{
        const deuda = '3762,250696unidadesdefomento';
        const deudaNormalizada = NumberHelper.deudaHipotecaria(deuda);
        expect(deudaNormalizada).toEqual(3762.250696);
    });

    test('Caso con signo peso y sin espacios', ()=>{
        const deuda = '$130000000';
        const deudaNormalizada = NumberHelper.deudaHipotecaria(deuda);
        expect(deudaNormalizada).toEqual(130000000);
    });

    test('Caso con signo peso y coma', ()=>{
        const deuda = '$4018727,';
        const deudaNormalizada = NumberHelper.deudaHipotecaria(deuda);
        expect(deudaNormalizada).toEqual(4018727);
    });
});