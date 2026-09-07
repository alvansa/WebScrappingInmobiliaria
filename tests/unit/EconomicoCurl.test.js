// El backoff real usa delays de segundos; lo anulamos para que los tests de
// reintento corran instantáneos.
jest.mock('#utils/delay.js', () => ({ delay: jest.fn().mockResolvedValue() }));

const EconomicoCurl = require('#sources/economico/EconomicoCurl.js');

// Silenciar el ruido de console del constructor / reintentos.
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => jest.restoreAllMocks());

// Guardar / restaurar env porque _loadProxies y proxyMode leen process.env.
const ENV_KEYS = ['PROXY_LIST', 'PROXY_SERVERS', 'PROXY_USER', 'PROXY_PASSWORD', 'ECONOMICOS_PROXY_MODE'];
let savedEnv;
beforeEach(() => {
    savedEnv = {};
    for (const k of ENV_KEYS) {
        savedEnv[k] = process.env[k];
        delete process.env[k];
    }
});
afterEach(() => {
    for (const k of ENV_KEYS) {
        if (savedEnv[k] === undefined) delete process.env[k];
        else process.env[k] = savedEnv[k];
    }
});

// ---------------------------------------------------------------------------
// _normalizeUrl: migración de esquema viejo -> /search/ (ago-2026)
// ---------------------------------------------------------------------------
describe('_normalizeUrl', () => {
    const scraper = new EconomicoCurl();

    test('devuelve null/undefined tal cual', () => {
        expect(scraper._normalizeUrl(null)).toBeNull();
        expect(scraper._normalizeUrl(undefined)).toBeUndefined();
    });

    test('reescribe el detalle de clasificado-remates-cod', () => {
        const vieja = 'https://www.economicos.cl/remates/clasificados-remates-cod-12345.html';
        expect(scraper._normalizeUrl(vieja)).toBe(
            'https://www.economicos.cl/search/remates/clasificados-remates-cod-12345.html'
        );
    });

    test('reescribe el listado de El Mercurio', () => {
        const vieja = 'https://www.economicos.cl/todo_chile/remates_de_propiedades_el_mercurio';
        expect(scraper._normalizeUrl(vieja)).toBe(
            'https://www.economicos.cl/search/remates/el-mercurio/0'
        );
    });

    test('reescribe el listado general de remates', () => {
        const vieja = 'https://www.economicos.cl/todo_chile/remates';
        expect(scraper._normalizeUrl(vieja)).toBe(
            'https://www.economicos.cl/search/remates/0'
        );
    });

    test('no toca el listado general si ya trae subruta (lookahead negativo)', () => {
        const yaMigrada = 'https://www.economicos.cl/todo_chile/remates/pagina/2';
        expect(scraper._normalizeUrl(yaMigrada)).toBe(yaMigrada);
    });

    test('deja intacta una URL que ya usa /search/', () => {
        const nueva = 'https://www.economicos.cl/search/remates/0';
        expect(scraper._normalizeUrl(nueva)).toBe(nueva);
    });
});

// ---------------------------------------------------------------------------
// _loadProxies + getNextProxy: carga desde env y rotación circular
// ---------------------------------------------------------------------------
describe('carga y rotación de proxies', () => {
    test('sin env no hay proxies', () => {
        const s = new EconomicoCurl();
        expect(s.proxyList).toEqual([]);
        expect(s.getNextProxy()).toBeNull();
    });

    test('PROXY_LIST en JSON', () => {
        process.env.PROXY_LIST = JSON.stringify([
            { server: 'h1:1', username: 'u', password: 'p' },
            { server: 'h2:2', username: 'u', password: 'p' },
        ]);
        const s = new EconomicoCurl();
        expect(s.proxyList).toHaveLength(2);
    });

    test('PROXY_SERVERS + user/pass como fallback', () => {
        process.env.PROXY_SERVERS = 'h1:1, h2:2 , h3:3';
        process.env.PROXY_USER = 'user';
        process.env.PROXY_PASSWORD = 'pass';
        const s = new EconomicoCurl();
        expect(s.proxyList).toEqual([
            { server: 'h1:1', username: 'user', password: 'pass' },
            { server: 'h2:2', username: 'user', password: 'pass' },
            { server: 'h3:3', username: 'user', password: 'pass' },
        ]);
    });

    test('PROXY_LIST inválido no rompe, cae a lista vacía', () => {
        process.env.PROXY_LIST = '{ esto no es json';
        const s = new EconomicoCurl();
        expect(s.proxyList).toEqual([]);
    });

    test('getNextProxy rota en círculo', () => {
        process.env.PROXY_SERVERS = 'a:1,b:2';
        const s = new EconomicoCurl();
        expect(s.getNextProxy().server).toBe('a:1');
        expect(s.getNextProxy().server).toBe('b:2');
        expect(s.getNextProxy().server).toBe('a:1');
    });
});

// ---------------------------------------------------------------------------
// getRequestAgents: modo 'fallback' = directo en intento 0, proxy después
// ---------------------------------------------------------------------------
describe('getRequestAgents', () => {
    test("modo 'fallback': intento 0 va directo", () => {
        process.env.PROXY_SERVERS = 'a:1';
        const s = new EconomicoCurl();
        const { agents, viaProxy } = s.getRequestAgents(0);
        expect(viaProxy).toBe(false);
        expect(agents).toEqual({});
    });

    test("modo 'fallback': intento 1 usa proxy", () => {
        process.env.PROXY_SERVERS = 'a:1';
        const s = new EconomicoCurl();
        const { agents, viaProxy } = s.getRequestAgents(1);
        expect(viaProxy).toBe(true);
        expect(agents.httpsAgent).toBeDefined();
        expect(agents.httpAgent).toBe(agents.httpsAgent); // mismo agente cacheado
    });

    test("modo 'never': nunca usa proxy aunque haya", () => {
        process.env.PROXY_SERVERS = 'a:1';
        process.env.ECONOMICOS_PROXY_MODE = 'never';
        const s = new EconomicoCurl();
        expect(s.getRequestAgents(3).viaProxy).toBe(false);
    });

    test("modo 'always': proxy desde el intento 0", () => {
        process.env.PROXY_SERVERS = 'a:1';
        process.env.ECONOMICOS_PROXY_MODE = 'always';
        const s = new EconomicoCurl();
        expect(s.getRequestAgents(0).viaProxy).toBe(true);
    });

    test("'fallback' sin proxies configuradas cae a directo", () => {
        const s = new EconomicoCurl();
        expect(s.getRequestAgents(2).viaProxy).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// extractCasesFromList: parseo del HTML del listado (axios mockeado)
// ---------------------------------------------------------------------------
describe('extractCasesFromList', () => {
    function mockHtml(scraper, html) {
        scraper.axiosInstance.request = jest.fn().mockResolvedValue({ data: html });
    }

    const LISTADO_HTML = `
        <div class="result row-fluid">
            <div class="col2">
                <a href="/remates/clasificados-remates-cod-111.html"><h3>Remate casa La Florida</h3></a>
            </div>
            <ul class="meta"><li>Publicado el: 2026-08-20</li></ul>
        </div>
        <div class="result row-fluid">
            <div class="col2">
                <a href="https://www.economicos.cl/search/remates/clasificados-remates-cod-222.html"><h3>Remate depto Ñuñoa</h3></a>
            </div>
            <ul class="meta"><li>Publicado el: 2026-08-25</li></ul>
        </div>
        <div class="result row-fluid">
            <div class="col2"><a href="/remates/sin-fecha.html"><h3>Sin fecha</h3></a></div>
            <ul class="meta"><li>Región: Metropolitana</li></ul>
        </div>`;

    test('extrae link + fechaPublicacion y descarta bloques sin fecha', async () => {
        const s = new EconomicoCurl();
        mockHtml(s, LISTADO_HTML);

        const casos = await s.extractCasesFromList('https://www.economicos.cl/todo_chile/remates');

        expect(casos).toHaveLength(2);
        expect(casos[0]).toEqual({
            link: 'https://www.economicos.cl/remates/clasificados-remates-cod-111.html',
            fechaPublicacion: new Date('2026/08/20'),
            announcement: '/remates/clasificados-remates-cod-111.html',
        });
        // link ya absoluto se conserva
        expect(casos[1].link).toBe('https://www.economicos.cl/search/remates/clasificados-remates-cod-222.html');
    });

    test('normaliza la URL del listado antes de pedirla', async () => {
        const s = new EconomicoCurl();
        mockHtml(s, '<html></html>');

        await s.extractCasesFromList('https://www.economicos.cl/todo_chile/remates');

        expect(s.axiosInstance.request).toHaveBeenCalledWith(
            expect.objectContaining({ url: 'https://www.economicos.cl/search/remates/0' })
        );
    });

    test('HTTP 404 devuelve [] sin reintentar', async () => {
        const s = new EconomicoCurl();
        s.axiosInstance.request = jest.fn().mockRejectedValue({ response: { status: 404 } });

        const casos = await s.extractCasesFromList('https://www.economicos.cl/search/remates/0');

        expect(casos).toEqual([]);
        expect(s.axiosInstance.request).toHaveBeenCalledTimes(1);
    });
});

// ---------------------------------------------------------------------------
// getPageDescription: extrae la descripción y respeta el corto-circuito 403/404
// ---------------------------------------------------------------------------
describe('getPageDescription', () => {
    test('devuelve el texto de div#description p', async () => {
        const s = new EconomicoCurl();
        s.axiosInstance.request = jest.fn().mockResolvedValue({
            data: '<div id="description"><p>  Se rematará la propiedad de calle X 123  </p></div>',
        });

        const desc = await s.getPageDescription('https://www.economicos.cl/search/remates/clasificados-remates-cod-1.html');
        expect(desc).toBe('Se rematará la propiedad de calle X 123');
    });

    test('403 directo (esquema viejo) => null sin reintentar', async () => {
        const s = new EconomicoCurl(); // modo fallback => intento 0 es directo
        s.axiosInstance.request = jest.fn().mockRejectedValue({ response: { status: 403 } });

        const desc = await s.getPageDescription('https://www.economicos.cl/remates/clasificados-remates-cod-1.html', 3);

        expect(desc).toBeNull();
        expect(s.axiosInstance.request).toHaveBeenCalledTimes(1);
    });

    test('error de red reintenta hasta maxRetries y luego devuelve null', async () => {
        const s = new EconomicoCurl();
        s.axiosInstance.request = jest.fn().mockRejectedValue({ message: 'ETIMEDOUT' }); // sin .response

        const desc = await s.getPageDescription('https://www.economicos.cl/search/remates/clasificados-remates-cod-1.html', 3);

        expect(desc).toBeNull();
        expect(s.axiosInstance.request).toHaveBeenCalledTimes(3);
    });
});
