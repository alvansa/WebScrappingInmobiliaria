// scripts/help.js
const commands = {
  '🔌 Ejecución': {
    'start': 'Inicia la app en modo normal',
    'start:test': 'Inicia la app en modo test',
    'dev': 'Inicia la app en modo desarrollo',
    'empty': 'Inicia la app en modo vacío'
  },
  '⚙️ Desarrollo y mantenimiento': {
    'rebuild': 'Reconstruye módulos nativos (better-sqlite3)',
    'postinstall': 'Se ejecuta automáticamente después de npm install'
  },
  '📦 Empaquetado (Electron Builder)': {
    'make': 'Empaqueta para la plataforma actual',
    'makeMac': 'Empaqueta solo para macOS',
    'makeWindows': 'Empaqueta solo para Windows (x64)',
    'app:dir': 'Genera el directorio de la app sin empaquetar'
  },
  '🧪 Pruebas': {
    'test': 'Ejecuta todas las pruebas (Jest)',
    'test:unit': 'Ejecuta solo pruebas unitarias',
    'test:functional': 'Ejecuta solo pruebas funcionales'
  }
};

console.log('\n📦 Scripts disponibles:\n');
for (const [group, cmds] of Object.entries(commands)) {
  console.log(`\x1b[36m${group}\x1b[0m`);
  for (const [cmd, desc] of Object.entries(cmds)) {
    console.log(`  \x1b[33m${cmd.padEnd(18)}\x1b[0m ${desc}`);
  }
  console.log('');
}