const auctionScraperOrchestator = require('#core/scrapeAuction/auctionScraperOrchestator.js'); // Ajusta la ruta a tu orquestador
const logger = require('#utils/logger.js');
const { delay } = require('#utils/delay.js');
const CasoBuilder = require('#models/caso/casoBuilder.js');

// 1. MOCKS DE MÓDULOS
jest.mock('#utils/logger.js', () => ({
    info: jest.fn(),
    error: jest.fn(),
<<<<<<< HEAD
    warn: jest.fn()
=======
    warn: jest.fn(),
    debug: jest.fn(),
    http: jest.fn()
>>>>>>> origin/main
}));

// Mock del delay para que las esperas de 5 minutos (300,000 ms) tomen 0ms
jest.mock('#utils/delay.js', () => ({
    delay: jest.fn().mockResolvedValue()
}));

describe('auctionScraperOrchestator', () => {
    let orchestrator;
    let mockSourcePjud;
    let mockSourceEmol;
    let mockEnricher;
    let mockExporter;
    let mockConfig;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mocks para fuentes (Sources)
        mockSourcePjud = {
            getName: jest.fn().mockReturnValue('pjud'),
            fetch: jest.fn().mockResolvedValue([{ id: 1, partes: 'Partes Pjud' }]),
            completeInfo: jest.fn().mockResolvedValue()
        };

        mockSourceEmol = {
            getName: jest.fn().mockReturnValue('emol'),
            fetch: jest.fn().mockResolvedValue([{ id: 2, partes: 'Partes Emol' }])
        };

        // Mocks para Enrichers
        mockEnricher = {
            getName: jest.fn().mockReturnValue('SpreadsheetEnricher'),
            obtain: jest.fn().mockResolvedValue(),
            enrich: jest.fn().mockResolvedValue()
        };

        // Mocks para Exporter
        mockExporter = {
            export: jest.fn().mockResolvedValue('/path/to/exported/file.xlsx')
        };

        // Configuración por defecto
        mockConfig = {
            config: {},
            isEmptyMode: false,
            isTestMode: false,
            checkedBoxes: ['pjud', 'emol'],
            saveFile: true,
            mainWindow: {},
            event: {}
        };

        orchestrator = new auctionScraperOrchestator(
            [mockSourcePjud, mockSourceEmol],
            [mockEnricher],
            mockExporter,
            mockConfig
        );
    });

    describe('Métodos auxiliares (Unidad)', () => {
        test('pjudNeedSearchAgain debe retornar true si cases es nulo, indefinido o vacío', () => {
            expect(orchestrator.pjudNeedSearchAgain(null)).toBe(true);
            expect(orchestrator.pjudNeedSearchAgain([])).toBe(true);
            expect(orchestrator.pjudNeedSearchAgain(undefined)).toBe(true);

            expect(orchestrator.pjudNeedSearchAgain([{causa: 'C-1-2020'}])).toBe(false);
        });

        test('emolShouldFetchAgain debe retornar true si cases es nulo, indefinido o vacío', () => {
            expect(orchestrator.shouldFetchEmolAgain(null)).toBe(true);
            expect(orchestrator.shouldFetchEmolAgain([])).toBe(true);
            expect(orchestrator.shouldFetchEmolAgain(undefined)).toBe(true);


            expect(orchestrator.shouldFetchEmolAgain([{causa: 'C-1-1'}])).toBe(false);
        });

        test('pjudNeedSearchAgain debe retornar false si cases tiene elementos', () => {
            const caso = new CasoBuilder(new Date(), 'lrg', 'lgr')
            .conCausa('C-33-2024')
            .conJuzgado('1° juzgado civil de santiago')
            .conNumeroCorte('1', '1')
            .construir()

            expect(orchestrator.pjudNeedSearchAgain([caso])).toBe(false);
        });

        test('shouldFetchAgainPjud debe retornar false si la proporción de casos sin partes es <= 5%', () => {
            // 20 casos, 1 sin partes (1 <= floor(20/20) = 1) -> false
            const cases = Array(19).fill({ partes: 'Bice/Soto' });
            cases.push({ partes: null }); // 1 sin partes
            
            expect(orchestrator.shouldFetchAgainPjud(cases)).toBe(false);
        });

        test('shouldFetchAgainPjud debe retornar true si los casos sin partes superan el umbral del 5%', () => {
            // 20 casos, 2 sin partes (2 > floor(20/20) = 1) -> true
            const cases = Array(18).fill({ partes: 'Estado/Soto' });
            cases.push({ partes: null }, { partes: null }); // 2 sin partes
            
            expect(orchestrator.shouldFetchAgainPjud(cases)).toBe(true);
        });
    });

    describe('Flujo principal: run()', () => {
        const startDate = '2026-01-01';
        const endDate = '2026-01-31';

        test('Flujo feliz: Obtiene, enriquece y exporta exitosamente', async () => {
            const result = await orchestrator.run(startDate, endDate);

            expect(mockEnricher.obtain).toHaveBeenCalledTimes(1);
            expect(mockSourcePjud.fetch).toHaveBeenCalledWith(startDate, endDate, expect.any(Object));
            expect(mockSourceEmol.fetch).toHaveBeenCalledWith(startDate, endDate, expect.any(Object));
<<<<<<< HEAD
            // expect(mockSourceEmol.fetch).toHaveBeenCalledTimes(2);
=======
>>>>>>> origin/main
            expect(mockEnricher.enrich).toHaveBeenCalledTimes(1);
            expect(mockExporter.export).toHaveBeenCalledTimes(1);
            expect(result).toEqual({
                filePath: '/path/to/exported/file.xlsx',
                status: 0, // EXITO
                isStopped: false
            });
        });

        test('debe retornar temprano si isEmptyMode es true', async () => {
            orchestrator.isEmptyMode = true;

            const result = await orchestrator.run(startDate, endDate);

            expect(mockExporter.export).toHaveBeenCalledWith(
                expect.any(Array),
                { saveFile: true, startDate, endDate }
            );
            // No debe llegar a la etapa de enrichers en isEmptyMode
            expect(mockEnricher.enrich).not.toHaveBeenCalled();
            expect(result).toBe('/path/to/exported/file.xlsx');
        });

        test('debe reintentar la búsqueda completa de PJUD si pjudNeedCompleteSearch es true (0 casos obtenidos)', async () => {
            // Hacemos que la 1ra llamada devuelva [] y la 2da devuelva casos
            mockSourcePjud.fetch
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([{ id: 10, partes: 'Nuevos Casos' }]);

            await orchestrator.run(startDate, endDate);

            // Fetch de PJUD debió llamarse 2 veces
            expect(mockSourcePjud.fetch).toHaveBeenCalledTimes(2);
        });

        test('debe ejecutar la segunda búsqueda (completeInfo) de PJUD si pjudNeedsSecondSearch es true', async () => {
            // Creamos 10 casos donde 5 no tienen partes (> 5% de vacíos)
            const pjudCases = [
                { id: 1, partes: 'Estado/Ortega' },
                { id: 2, partes: null },
                { id: 3, partes: null },
                { id: 4, partes: null },
                { id: 5, partes: null }
            ];
            mockSourcePjud.fetch.mockResolvedValueOnce(pjudCases);

            await orchestrator.run(startDate, endDate);

            expect(mockSourcePjud.completeInfo).toHaveBeenCalledTimes(1);
            expect(mockSourcePjud.completeInfo).toHaveBeenCalledWith(expect.arrayContaining(pjudCases));
        });

        test('debe esperar 5 minutos (delay) y reintentar EMOL si emolHasCases es false', async () => {
            // Emol no devuelve nada en la primera pasada
            mockSourceEmol.fetch.mockResolvedValueOnce([]);

            await orchestrator.run(startDate, endDate);

            // Verifica que la función delay de 5 min (300,000ms) fue invocada
            expect(delay).toHaveBeenCalledWith(300000);
            // EMOL se llamó 2 veces: en el for principal y en el retry de emol
            expect(mockSourceEmol.fetch).toHaveBeenCalledTimes(2);
        });

        test('debe filtrar las fuentes según this.checkedBoxes', async () => {
            // Solo 'pjud' está seleccionado en los checkboxes
            orchestrator.checkedBoxes = ['pjud'];

            await orchestrator.run(startDate, endDate);

            expect(mockSourcePjud.fetch).toHaveBeenCalledTimes(1);
            expect(mockSourceEmol.fetch).not.toHaveBeenCalled();
        });

        test('debe retornar estado NOT_AUCTIONS_FOUND (5) si no se obtuvieron casos de ninguna fuente', async () => {
            mockSourcePjud.fetch.mockResolvedValue([]);
            mockSourceEmol.fetch.mockResolvedValue([]);

            const result = await orchestrator.run(startDate, endDate);

            expect(logger.warn).toHaveBeenCalledWith("No se obtuvieron casos de ninguna fuente. El proceso se detendrá.");
            expect(result).toEqual({
                filePath: null,
                status: 5 // NOT_AUCTIONS_FOUND
            });
            expect(mockExporter.export).not.toHaveBeenCalled();
        });

    });

    describe('Manejo de Excepciones y Resiliencia', () => {
        const startDate = '2026-01-01';
        const endDate = '2026-01-31';

        test('debe continuar con las demás fuentes si una fuente arroja una excepción', async () => {
            mockSourcePjud.fetch.mockRejectedValue(new Error('PJUD fallo de conexión'));

            const result = await orchestrator.run(startDate, endDate);

            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Error al obtener source en pjud, error: PJUD fallo de conexión')
            );
            // La otra fuente (EMOL) debió continuar y completarse
            expect(mockSourceEmol.fetch).toHaveBeenCalledTimes(1);
            expect(result.status).toBe(0);
        });

        test('debe capturar errores en los enrichers y continuar con la exportación', async () => {
            mockEnricher.enrich.mockRejectedValue(new Error('Fallo al enriquecer con Excel'));

            const result = await orchestrator.run(startDate, endDate);

            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Error al enriquecer la informacion con SpreadsheetEnricher Fallo al enriquecer con Excel')
            );
            // Pese al error en el enricher, se debe invocar al exporter
            expect(mockExporter.export).toHaveBeenCalledTimes(1);
            expect(result.status).toBe(0);
        });

        test('debe capturar el error si el exporter falla y retornar undefined', async () => {
            mockExporter.export.mockRejectedValue(new Error('No se pudo escribir el archivo'));

            const result = await orchestrator.run(startDate, endDate);

            expect(logger.error).toHaveBeenCalledWith(
                expect.stringContaining('Error al escribir la informacion en excel error: No se pudo escribir el archivo')
            );
            expect(result).toBeUndefined();
        });
    });

    // describe('Pruebas de llamada a los Sources', ()=>{
    //     test('Prueba de llamada EMOL ', async ()=>{
    //         // mockSourceEmol.fetch.mockResolvedValue([{causa: 'C-1-1'}]);
    //         // mock
    //         const result = await orchestrator.run('2026-01-01', '2026-01-02');

    //         expect(mockSourcePjud.fetch).toHaveBeenCalledTimes(1);
    //     })
    });
// });