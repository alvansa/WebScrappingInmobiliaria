const { createExcel } = require('#exporters/excel/createExcel.js');
const Caso = require('#models/caso/caso.js');

// La fecha de inicio/fin del excel usa el mismo formato yyyy-mm-dd que manda
// el orquestador (auctionScraperOrchestator). fixStringDate las convierte a
// yyyy/mm/dd antes de pasarlas a `new Date(...)`, por lo que quedan en hora
// local y evitan el corrimiento de un día típico de parsear ISO con 'Z'.
function buildExcel(startDate = '2026-01-01', endDate = '2026-01-31') {
    return new createExcel('/tmp', startDate, endDate, false, 'oneDay', false);
}

function createCase(causa, juzgado, fechaRemate = null) {
    const caso = new Caso(new Date());
    caso.causa = causa;
    caso.juzgado = juzgado;
    if (fechaRemate) {
        caso.fechaRemate = fechaRemate;
    }
    return caso;
}

describe('getValidAuctions', () => {

    describe('casos ya presentes en la cache', () => {
        test('un caso con misma causa y juzgado que uno ya cacheado se rechaza', () => {
            const excel = buildExcel();
            const casoCacheado = createCase('C-1234-2026', '28° Juzgado Civil de Santiago', new Date('2026-01-15'));
            const cache = new Map([[`${casoCacheado.causa}|${casoCacheado.juzgado}`, casoCacheado]]);

            const casoNuevo = createCase('C-1234-2026', '28° Juzgado Civil de Santiago', new Date('2026-01-15'));

            expect(excel.getValidAuctions(casoNuevo, cache)).toBe(false);
        });

        test('al encontrar un duplicado, completa en la cache los datos que le faltaban', () => {
            const excel = buildExcel();
            const casoCacheado = createCase('C-1234-2026', '28° Juzgado Civil de Santiago', new Date('2026-01-15'));
            casoCacheado.partes = null;
            const cache = new Map([[`${casoCacheado.causa}|${casoCacheado.juzgado}`, casoCacheado]]);

            const casoNuevo = createCase('C-1234-2026', '28° Juzgado Civil de Santiago', new Date('2026-01-15'));
            casoNuevo.partes = 'Perez con Gonzalez';

            excel.getValidAuctions(casoNuevo, cache);

            // El getter de partes (StringHelper.partes) normaliza a minusculas.
            expect(casoCacheado.partes).toEqual('perez con gonzalez');
        });

        test('un caso con distinta causa no se considera duplicado', () => {
            const excel = buildExcel();
            const casoCacheado = createCase('C-1111-2026', '28° Juzgado Civil de Santiago', new Date('2026-01-15'));
            const cache = new Map([[`${casoCacheado.causa}|${casoCacheado.juzgado}`, casoCacheado]]);

            const casoNuevo = createCase('C-2222-2026', '28° Juzgado Civil de Santiago', new Date('2026-01-15'));

            expect(excel.getValidAuctions(casoNuevo, cache)).toBe(true);
        });

        test('misma causa pero distinto juzgado no se considera duplicado', () => {
            const excel = buildExcel();
            const casoCacheado = createCase('C-1234-2026', '28° Juzgado Civil de Santiago', new Date('2026-01-15'));
            const cache = new Map([[`${casoCacheado.causa}|${casoCacheado.juzgado}`, casoCacheado]]);

            const casoNuevo = createCase('C-1234-2026', '5° Juzgado Civil de Santiago', new Date('2026-01-15'));

            expect(excel.getValidAuctions(casoNuevo, cache)).toBe(true);
        });
    });

    describe('rango de fechas', () => {
        test('rechaza un caso con fecha de remate anterior al inicio del rango', () => {
            const excel = buildExcel('2026-01-10', '2026-01-31');
            const caso = createCase('C-1234-2026', '28° Juzgado Civil de Santiago', new Date('2026-01-05'));

            expect(excel.getValidAuctions(caso, new Map())).toBe(false);
        });

        test('rechaza un caso con fecha de remate posterior al fin del rango', () => {
            const excel = buildExcel('2026-01-01', '2026-01-10');
            const caso = createCase('C-1234-2026', '28° Juzgado Civil de Santiago', new Date('2026-01-20'));

            expect(excel.getValidAuctions(caso, new Map())).toBe(false);
        });

        test('acepta un caso con fecha de remate dentro del rango', () => {
            const excel = buildExcel('2026-01-01', '2026-01-31');
            const caso = createCase('C-1234-2026', '28° Juzgado Civil de Santiago', new Date('2026-01-15'));

            expect(excel.getValidAuctions(caso, new Map())).toBe(true);
        });

        test('un caso sin fecha de remate no es rechazado por el rango de fechas', () => {
            const excel = buildExcel('2026-01-01', '2026-01-31');
            const caso = createCase('C-1234-2026', '28° Juzgado Civil de Santiago'); // sin fechaRemate

            expect(excel.getValidAuctions(caso, new Map())).toBe(true);
        });
    });

    describe('juez partidor', () => {
        test('rechaza un caso cuyo juzgado es "Juez Partidor"', () => {
            const excel = buildExcel();
            const caso = createCase('C-1234-2026', 'Juez Partidor', new Date('2026-01-15'));

            expect(excel.getValidAuctions(caso, new Map())).toBe(false);
        });

        test('rechaza "Juez Partidor" sin importar mayusculas/minusculas', () => {
            const excel = buildExcel();
            const caso = createCase('C-1234-2026', 'JUEZ PARTIDOR', new Date('2026-01-15'));

            expect(excel.getValidAuctions(caso, new Map())).toBe(false);
        });

        test('no rechaza un juzgado que no es juez partidor', () => {
            const excel = buildExcel();
            const caso = createCase('C-1234-2026', '28° Juzgado Civil de Santiago', new Date('2026-01-15'));

            expect(excel.getValidAuctions(caso, new Map())).toBe(true);
        });
    });

    describe('normalizacion del simbolo de grado en el juzgado', () => {
        test('reemplaza "º" por "°" en el juzgado del caso recibido', () => {
            const excel = buildExcel();
            const caso = createCase('C-1234-2026', '28º Juzgado Civil de Santiago', new Date('2026-01-15'));

            excel.getValidAuctions(caso, new Map());

            expect(caso.juzgado).toContain('°');
            expect(caso.juzgado).not.toContain('º');
        });
    });

    describe('caso valido nuevo', () => {
        test('retorna true para un caso nuevo, dentro de rango, sin duplicado y sin ser juez partidor', () => {
            const excel = buildExcel('2026-01-01', '2026-01-31');
            const caso = createCase('C-9999-2026', '10° Juzgado Civil de Santiago', new Date('2026-01-20'));

            expect(excel.getValidAuctions(caso, new Map())).toBe(true);
        });

        // currentCase.juzgado?.toLowerCase() protege el caso de un juzgado
        // nulo/no resuelto: no revienta la validación, y como no es "juez
        // partidor" el caso se considera válido.
        test('un caso sin juzgado no revienta la validacion', () => {
            const excel = buildExcel('2026-01-01', '2026-01-31');
            const caso = createCase('C-9999-2026', null, new Date('2026-01-20'));

            expect(() => excel.getValidAuctions(caso, new Map())).not.toThrow();
            expect(excel.getValidAuctions(caso, new Map())).toBe(true);
        });
    });
});
