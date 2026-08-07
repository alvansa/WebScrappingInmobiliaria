const GestorRematesPjud = require('#src/core/sources/pjud/GestorRematesPlay.js');
// const {delay} = require('#utils/delay.js');
const CasoBuilder = require('#models/caso/casoBuilder.js');
// const { defaultInstance } = require('#core/scrapeAuction/services/PlaywrightManager.js');

// 1. Mock de Playwright para evitar abrir el navegador
// jest.mock('playwright', () => ({
//     chromium: {
//         launch: jest.fn().mockResolvedValue({
//             close: jest.fn().mockResolvedValue(true)
//         })
//     }
// }));


jest.mock('#src/core/scrapeAuction/services/PlaywrightManager.js', () => {
    const mockBrowserInstance = {
        closeBrowser: jest.fn().mockResolvedValue(true),
        createHumanContext: jest.fn().mockResolvedValue({
            newPage: jest.fn().mockResolvedValue({
                goto: jest.fn().mockResolvedValue(true),
                close: jest.fn().mockResolvedValue(true)
            }),
            close: jest.fn().mockResolvedValue(true)
        })
    };

    return {
        PlaywrightManager: {
            getBrowser: jest.fn().mockResolvedValue(mockBrowserInstance)
        }
    };
});

jest.mock('#utils/delay.js', () =>({
    ...jest.requireActual('#utils/delay.js'),
    delay : jest.fn().mockResolvedValue()
}));

const MAX_RETRIES = 10;

describe('getInfoFromAuctions - Filtro de partes', () => {
    let instance;

    beforeEach(() => {

        // Casos de prueba falsos
        const caso1 = new CasoBuilder(new Date(), 'lrg', 'lgr')
            .conCausa('C-11-2022')
            .conJuzgado('30° juzgado civil de santiago')
            .conNumeroCorte('1', '1')
            .conPartes('Bice/Soto')
            .construir();

        const caso2 = new CasoBuilder(new Date(), 'lrg', 'lgr')
            .conCausa('C-22-2023')
            .conJuzgado('28° juzgado civil de santiago')
            .conNumeroCorte('1', '1')
            .construir()
        const caso3 = new CasoBuilder(new Date(), 'lrg', 'lgr')
            .conCausa('C-33-2024')
            .conJuzgado('1° juzgado civil de santiago')
            .conNumeroCorte('1', '1')
            .construir()
        const casos = [caso1, caso2, caso3];

        instance = new GestorRematesPjud(casos, null, null, 3);
        
        // Mock del método consultaCausa para que no haga peticiones reales
        instance.consultaCausa = jest.fn().mockResolvedValue({
            toObject: () => ({ status: 'ok' })
        });
    });

    test('debe OMITIR casos con partes cuando skipIfHasPartes es TRUE', async () => {
        // Ejecutamos con el flag activado
        // instance.consultaCausa = jest.fn().mockResolvedValue(false);

        await instance.getInfoFromAuctions({ skipIfHasPartes: true });

        // consultaCausa solo debió llamarse 2 veces (casos C-2 y C-3)
        expect(instance.consultaCausa).toHaveBeenCalledTimes(2);

        // Verificamos que NUNCA se haya llamado con el caso C-1 (el que tiene partes)
        expect(instance.consultaCausa).not.toHaveBeenCalledWith(
            expect.objectContaining({causa: ' C-11-2022'})
        );
        
        // Verificamos que SÍ se haya llamado con C-2 y C-3
        expect(instance.consultaCausa).toHaveBeenCalledWith(
            expect.objectContaining({causa: 'C-22-2023'})
        );
        expect(instance.consultaCausa).toHaveBeenCalledWith(
            expect.objectContaining({causa: 'C-33-2024'})
        );
    });

    test('debe PROCESAR TODOS los casos si skipIfHasPartes es FALSE', async () => {
        instance.consultaCausa = jest.fn().mockResolvedValue(false);
        // Ejecutamos con el flag desactivado
        await instance.getInfoFromAuctions({ skipIfHasPartes: true });

        // Debió procesar los 3 casos sin importar si tienen partes
        expect(instance.consultaCausa).toHaveBeenCalledTimes(2 * MAX_RETRIES);
    });
});