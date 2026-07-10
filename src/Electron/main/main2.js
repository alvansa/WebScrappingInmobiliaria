// const { app } = require('electron');
// const WindowManager = require('./windows/WindowManager');
// // const PuppeteerManager = require('./services/PuppeteerManager');
// const IpcRegistry = require('./ipc/ipcRegistry.js');
// // ... importa tus fuentes, enrichers, exporter, config

// class MainApp {
//     constructor() {
//         this.windowManager = new WindowManager();
//         // this.puppeteer = new PuppeteerManager();
//         this.ipcRegistry = new IpcRegistry(this.windowManager, this.puppeteer);
//         this.setupLifecycle();
//     }

//     setupLifecycle() {
//         app.whenReady().then(async () => {
//             // await this.puppeteer.launch();
//             this.windowManager.createMainWindow();
//             this.ipcRegistry.registerAll();
//         });
//         app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit());
//         app.on('before-quit', () => this.puppeteer.close());
//     }
// }

// new MainApp();