const {stringToDate, parseSpanishDate, convertDate} = require('#utils/cleanStrings');


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

describe('Test de parseSpanishDate',()=>{
    test('Fecha nula',()=>{
        const testDate = null;
        expect(parseSpanishDate(testDate)).toBeNull();
    })

    test('Fecha formato dd mm aa',()=>{
        const testDate = "15 abril 2026";
        const expectedDate = new Date("2026/04/15");
        expect(parseSpanishDate(testDate)).toEqual(expectedDate);
    });

    test('Fecha formato con multiples espacios',()=>{
        const testDate = "15  mayo  2026";
        const expectedDate = new Date("2026/05/15");
        expect(parseSpanishDate(testDate)).toEqual(expectedDate);
    });

    test('Fecha formato dd de mm del aa',()=>{
        const testDate = "15 de marzo del 2026";
        const expectedDate = new Date("2026/03/15");
        expect(parseSpanishDate(testDate)).toEqual(expectedDate);
    });

    test('Fecha formato dd de mm de aa',()=>{
        const testDate = "15 de septiembre de 2026";
        const expectedDate = new Date("2026/09/15");
        expect(parseSpanishDate(testDate)).toEqual(expectedDate);
    });

    test('Fecha formato dd-mm-aa',()=>{
        const testDate = "15-enero-2026";
        const expectedDate = new Date("2026/01/15");
        expect(parseSpanishDate(testDate)).toEqual(expectedDate);
    });

    test('Fecha formato dd/mm/aa',()=>{
        const testDate = "15/febrero/2026";
        const expectedDate = new Date("2026/02/15");
        expect(parseSpanishDate(testDate)).toEqual(expectedDate);
    });
});


describe('Test de stringToDate',()=>{
    test('Fecha nula',()=>{
        const testDate = null;
        expect(stringToDate(testDate)).toBeNull();
    })

    test('Fecha string source emol',()=>{
        const testDate = '2026-07-06';
        const expectedDate = new Date("2026/07/06");
        expect(stringToDate(testDate,'YMD')).toEqual(expectedDate);
    })

    test('Fecha string source liquidaciones',()=>{
        const testDate = '2026-07-13';
        const expectedDate = new Date("2026/07/13");
        expect(stringToDate(testDate, 'YMD')).toEqual(expectedDate);
    })

    test('Fecha string source pjud',()=>{
        const testDate = '2026-07-22';
        const expectedDate = new Date("2026/07/22");
        expect(stringToDate(testDate, 'YMD')).toEqual(expectedDate);
    })

    test('Fecha string tabla de causa pjud',()=>{
        const testDate = '05/03/2026';
        const expectedDate = new Date("2026/03/05");
        expect(stringToDate(testDate)).toEqual(expectedDate);
    })

    test('Fecha string de tabla por anexo pjud',()=>{
        const testDate = '31/12/2024';
        const expectedDate = new Date("2024/12/31");
        expect(stringToDate(testDate)).toEqual(expectedDate);
    })

    test('Fecha string de fecha ingreso pjud',()=>{
        const testDate = '11/07/2022';
        const expectedDate = new Date("2022/07/11");
        expect(stringToDate(testDate)).toEqual(expectedDate);
    })

    test('Fecha de remate obtenida de excel',()=>{
        const testDate = '06/07/2026';
        const expectedDate = new Date("2026/07/06");
        expect(stringToDate(testDate)).toEqual(expectedDate);
    })

    test('Fecha de descubrimiento obtenida de excel valor "w" ',()=>{
        const testDate = '01/07/2026';
        const expectedDate = new Date("2026/07/01");
        expect(stringToDate(testDate)).toEqual(expectedDate);
    })

    test('Fecha de descubrimiento obtenida de excel valor "v" ',()=>{
        const testDate = '2026-06-18T04:00:00.000Z';
        const expectedDate = new Date("2026/06/18");
        expect(stringToDate(testDate)).toEqual(expectedDate);
    })

    test('Fecha tipo Date ',()=>{
        const testDate = new Date("2026/06/18");
        const expectedDate = new Date("2026/06/18");
        expect(stringToDate(testDate)).toEqual(expectedDate);
    })

    test('Fecha tipo fecha con año sin el 2000 ',()=>{
        const testDate = '09-11-26';
        const expectedDate = new Date("2026/11/09");
        expect(stringToDate(testDate)).toEqual(expectedDate);
    })

});