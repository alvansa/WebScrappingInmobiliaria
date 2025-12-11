const {stringToDate, parseSpanishDate, parseSpreadSheeToDate, isValidDate, convertDate} = require('../../utils/cleanStrings');


describe('Test de fechas',()=>{
    test('Fecha nula',()=>{
        const testDate = null;
        expect(convertDate(testDate)).toBeNull();
    });

    test('Fecha formato dd/mm/aa',()=>{
        const testDate = "15/08/23";
        const expectedDate = new Date("2023/08/15");
        expect(convertDate(testDate)).toEqual(expectedDate);
    });

    test('Fecha formato dd-mes-aa',()=>{
        const testDate = "21-abr-2026";
        const expectedDate = new Date("2026/04/21");
        expect(convertDate(testDate)).toEqual(expectedDate);
    });

});