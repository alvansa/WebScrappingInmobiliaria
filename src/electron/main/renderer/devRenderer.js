// devRenderer.js — panel de pruebas del modo desarrollador.
//
// La lista TESTS es la única fuente de verdad: cada entrada genera su propio
// botón, sus inputs de parámetros y su selección de archivos. Para agregar una
// prueba nueva basta con añadir un objeto al array; no hay que tocar el HTML.
//
// Todo el módulo vive dentro de un IIFE: `window.api` lo expone el preload como
// propiedad global no configurable, así que un `const api` a nivel de script
// lanzaría "Identifier 'api' has already been declared". Dentro de la función
// sí se puede declarar y sombrear sin conflicto.

(() => {
const api = window.api || {};

/* ------------------------------------------------------------------ */
/*  Panel de registro (log)                                            */
/* ------------------------------------------------------------------ */

const logBody = document.getElementById('devLogBody');

// Cualquier error no capturado se muestra en el panel, no solo en DevTools.
window.addEventListener('error', (event) => {
  if (logBody) {
    const line = document.createElement('div');
    line.className = 'log-line log-error';
    line.textContent = `[error] ${event.message} (${event.filename}:${event.lineno})`;
    logBody.appendChild(line);
  }
});

if (!window.api) {
  console.error('window.api no está disponible: el preload no se cargó.');
}

function stamp() {
  return new Date().toLocaleTimeString('es-CL', { hour12: false });
}

function log(msg, level = 'info') {
  const line = document.createElement('div');
  line.className = `log-line log-${level}`;
  line.textContent = `[${stamp()}] ${msg}`;
  logBody.appendChild(line);
  logBody.scrollTop = logBody.scrollHeight;

  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(msg);
}

function logValue(label, value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  log(`${label}:\n${text}`);
}

document.getElementById('clearLogBtn')?.addEventListener('click', () => {
  logBody.textContent = '';
});

// Mensajes que el proceso main envía por 'message-renderer' / 'show-alert'.
api.onMessage?.((msg) => log(`main » ${msg}`, 'main'));
document.addEventListener('DOMContentLoaded', () => {
  api.onShowAlert?.((_event, message) => log(`alerta » ${message}`, 'warn'));
});

/* ------------------------------------------------------------------ */
/*  Modales de espera                                                  */
/* ------------------------------------------------------------------ */

let countdownInterval = null;

function showWaitingModal(show, message) {
  const modal = document.getElementById('waitingModal');
  modal.style.display = show ? 'flex' : 'none';
  if (message) document.getElementById('waitingMessage').textContent = message;
  if (!show && countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function showProcessModal(show) {
  document.getElementById('waitingModalProcess').style.display = show ? 'flex' : 'none';
}

api.onWaitingNotification?.(([totalSeconds, actualCase, totalCases]) => {
  let remaining = totalSeconds;
  const render = () =>
    showWaitingModal(
      true,
      `Esperando ${Math.floor(remaining)}s para procesar el caso ${actualCase} de ${totalCases}...`,
    );

  render();
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => {
    remaining -= 1;
    render();
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      showWaitingModal(false);
    }
  }, 1000);
});

/* ------------------------------------------------------------------ */
/*  Selección de archivos                                              */
/* ------------------------------------------------------------------ */

const PICKERS = {
  file: () => api.openFileLocal(), // un archivo
  files: () => api.openFilesLocal(), // varios archivos
  excel: () => api.selectExcelPath(), // un .xlsx
};

// Recorre los `files` declarados por un test y devuelve { key: ruta(s) }.
// Si el usuario cancela alguna selección devuelve null y el test se aborta.
async function pickFiles(specs) {
  const files = {};
  for (const spec of specs) {
    const name = spec.label || spec.key;
    log(`Seleccionar ${name}...`);
    const picked = await PICKERS[spec.pick]();
    const empty = picked == null || (Array.isArray(picked) && picked.length === 0);
    if (empty) {
      log(`Cancelado: no se seleccionó ${name}`, 'warn');
      return null;
    }
    files[spec.key] = picked;
    log(`${name}: ${Array.isArray(picked) ? picked.join(', ') : picked}`);
  }
  return files;
}

/* ------------------------------------------------------------------ */
/*  Registro de pruebas                                                */
/* ------------------------------------------------------------------ */
//
// Forma de una entrada:
//   id      identificador único
//   label   texto del botón
//   group   agrupación visual (opcional, default "General")
//   modal   muestra el modal de proceso mientras corre (opcional)
//   files   [{ key, pick: 'file'|'files'|'excel', label }] archivos a pedir
//   params  [{ key, label, type: 'text'|'checkbox', default, placeholder }]
//   run     async ({ params, files, log }) => resultado
//           - lanzar Error   -> se registra como fallo
//           - { ok: false }  -> se registra como fallo (con .error)
//           - undefined/null -> "lanzado" (el detalle va a la consola del main)
//           - cualquier otro -> se serializa al registro

const TESTS = [
  {
    id: 'uploadedText',
    label: 'Procesar texto de remate pegado',
    group: 'Economicos',
    params: [
      { key: 'text', label: 'Descripción del remate', type: 'text', placeholder: 'Pega aquí el texto...' },
    ],
    run: ({ params }) => {
      if (!params.text) throw new Error('Escribe un texto para procesar');
      return api.testEconomico(['uploadedText', params.text]);
    },
  },
  {
    id: 'testUserAgents',
    label: 'Test de User Agents',
    group: 'Economicos',
    run: () => api.testEconomico(['testUserAgents']),
  },
  {
    id: 'testEconomicoPuppeteer',
    label: 'Test Economico Puppeteer',
    group: 'Economicos',
    run: () => api.testEconomico(['testEconomicoPuppeteer']),
  },
  {
    id: 'readPdf',
    label: 'Leer PDF con algoritmo PJUD',
    group: 'PJUD',
    files: [{ key: 'pdfs', pick: 'files', label: 'PDF(s)' }],
    params: [{ key: 'createExcel', label: 'Crear Excel', type: 'checkbox', default: false }],
    run: ({ files, params }) => api.testEconomico(['readPdf', files.pdfs, params.createExcel]),
  },
  {
    id: 'boletin',
    label: 'Procesar archivo (algoritmo boletín)',
    group: 'Liquidaciones',
    files: [{ key: 'file', pick: 'file', label: 'Archivo PDF' }],
    run: ({ files }) => api.processFile(files.file),
  },
  {
    id: 'compareExcel',
    label: 'Comparar Excel base vs nuevo',
    group: 'Excel',
    files: [
      { key: 'base', pick: 'excel', label: 'Excel base' },
      { key: 'nuevo', pick: 'excel', label: 'Excel nuevo' },
    ],
    run: ({ files }) => api.testEconomico(['testCompleteExcelInfo', files.base, files.nuevo]),
  },
  {
    id: 'fillMapa',
    label: 'Revisar mapas de un Excel',
    group: 'Enrichers',
    files: [{ key: 'file', pick: 'file', label: 'Archivo Excel' }],
    run: ({ files }) => api.fillMapa(files.file),
  },
  {
    id: 'testMapas',
    label: 'Test de mapas SII (casos fijos)',
    group: 'Enrichers',
    run: () => api.testEconomico(['testMapas']),
  },
  {
    id: 'testMacal',
    label: 'Test API Macal',
    group: 'Fuentes',
    params: [
      { key: 'fecha', label: 'Fecha límite (YYYY/MM/DD)', type: 'text', placeholder: '2025/10/29' },
    ],
    run: ({ params }) => api.testEconomico(['testMacal', params.fecha || undefined]),
  },
  {
    id: 'countLadrillos',
    label: 'Contar ladrillos de un Excel',
    group: 'Ladrillero',
    files: [{ key: 'file', pick: 'file', label: 'Archivo Excel' }],
    run: ({ files }) => api.countLadrillos(files.file),
  },
  {
    id: 'checkDeuda',
    label: 'Revisar deuda (FPMG)',
    group: 'Ladrillero',
    modal: true,
    run: async () => {
      const ok = await api.checkDEUDA(null, null);
      return ok ? 'Proceso de deuda finalizado con éxito' : 'No hay casos de deuda para procesar';
    },
  },
];

/* ------------------------------------------------------------------ */
/*  Ejecución y render de los tests                                    */
/* ------------------------------------------------------------------ */

const grid = document.getElementById('testGrid');

function buildParamInput(param) {
  const wrap = document.createElement('label');
  wrap.className = 'param';

  const span = document.createElement('span');
  span.textContent = param.label;

  const input = document.createElement('input');
  input.type = param.type === 'checkbox' ? 'checkbox' : 'text';
  if (param.type === 'checkbox') {
    input.checked = Boolean(param.default);
  } else {
    input.value = param.default || '';
    if (param.placeholder) input.placeholder = param.placeholder;
  }

  wrap.append(span, input);
  return { wrap, input };
}

function collectParams(test, inputs) {
  const values = {};
  for (const param of test.params || []) {
    const input = inputs[param.key];
    values[param.key] = param.type === 'checkbox' ? input.checked : input.value.trim();
  }
  return values;
}

async function runTest(test, button, inputs) {
  button.disabled = true;
  const originalLabel = button.textContent;
  button.textContent = 'Ejecutando...';
  log(`▶ ${test.label}`, 'start');

  try {
    const params = collectParams(test, inputs);

    let files = {};
    if (test.files) {
      const picked = await pickFiles(test.files);
      if (!picked) return; // cancelado
      files = picked;
    }

    if (test.modal) showProcessModal(true);
    const result = await test.run({ params, files, log });

    if (result && result.ok === false) {
      log(`✖ ${test.label}: ${result.error || 'error desconocido'}`, 'error');
    } else if (result === undefined || result === null) {
      log(`✔ ${test.label} lanzado (revisa la consola del main para el detalle)`, 'ok');
    } else {
      logValue(`✔ ${test.label}`, result);
    }
  } catch (error) {
    log(`✖ ${test.label}: ${error.message}`, 'error');
  } finally {
    if (test.modal) showProcessModal(false);
    button.disabled = false;
    button.textContent = originalLabel;
  }
}

function renderTests() {
  const groups = {};
  for (const test of TESTS) {
    (groups[test.group || 'General'] ||= []).push(test);
  }

  for (const [groupName, tests] of Object.entries(groups)) {
    const section = document.createElement('section');
    section.className = 'test-group';

    const heading = document.createElement('h3');
    heading.textContent = groupName;
    section.appendChild(heading);

    for (const test of tests) {
      const card = document.createElement('div');
      card.className = 'test-card';

      const inputs = {};
      for (const param of test.params || []) {
        const { wrap, input } = buildParamInput(param);
        inputs[param.key] = input;
        card.appendChild(wrap);
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = test.label;
      button.addEventListener('click', () => runTest(test, button, inputs));
      card.appendChild(button);

      section.appendChild(card);
    }

    grid.appendChild(section);
  }
}

renderTests();

/* ------------------------------------------------------------------ */
/*  Buscador de comuna / tribunal → id                                 */
/* ------------------------------------------------------------------ */

const comunaInput = document.getElementById('comunaSearch');
const comunaResults = document.getElementById('comunaResults');
let tribunalesPorCorte = {};

Promise.resolve(api.obtainTribunales?.())
  .then((data) => {
    tribunalesPorCorte = data || {};
  })
  .catch((error) => log(`No se pudieron cargar los tribunales: ${error.message}`, 'error'));

function searchTribunales(term) {
  const q = term.trim().toLowerCase();
  if (!q) return [];

  const matches = [];
  for (const [corte, tribunales] of Object.entries(tribunalesPorCorte)) {
    for (const tribunal of tribunales) {
      if (tribunal.nombre.toLowerCase().includes(q)) {
        matches.push({ corte, ...tribunal });
      }
    }
  }
  return matches.slice(0, 20);
}

comunaInput.addEventListener('input', () => {
  comunaResults.innerHTML = '';
  for (const match of searchTribunales(comunaInput.value)) {
    const item = document.createElement('div');
    item.textContent = `${match.nombre} — corte ${match.corte}, tribunal ${match.value}`;
    item.addEventListener('click', () => {
      comunaInput.value = match.nombre;
      comunaResults.innerHTML = '';
      log(`${match.nombre} → corte ${match.corte}, tribunal ${match.value}`, 'ok');
    });
    comunaResults.appendChild(item);
  }
});

document.addEventListener('click', (event) => {
  if (event.target !== comunaInput && !comunaResults.contains(event.target)) {
    comunaResults.innerHTML = '';
  }
});
})();
