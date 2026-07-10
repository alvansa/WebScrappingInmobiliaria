// const { ipcMain, ipcRenderer } = require('electron');
// const scraperHandlers = require('./scraperHandlers');
// const dialogHandlers = require('./dialogHandlers');
// // ...

// class IpcRegistry {
//   constructor(windowManager, scraperOrchestrator, excelService, pjudService) {
//     this.services = { windowManager, scraperOrchestrator, excelService, pjudService };
//   }
  
//   registerAll() {
//     new scraperHandlers(ipcMain, this.services);
//     new dialogHandlers(ipcMain,this.services)
//     // excelHandlers(ipcMain, this.services);
//     // pjudHandlers(ipcMain, this.services);
//     // dialogHandlers(ipcMain, this.services);
//   }
// }

// module.exports = IpcRegistry;