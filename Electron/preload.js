const { contextBridge,ipcRenderer } = require('electron');
const {getDatosRemate} = require('../Controller/datosRemateEmol.js');
const {crearBase,insertarDatos} = require('../Controller/createXLSX');
const nodePath = require('path');


contextBridge.exposeInMainWorld('api', {
  logDates:async (startDate, endDate,saveFile) => {
    try {
        const fechaHoy = new Date();
        const maxRetries = 10;
        var casos = [];
        // console.log(path.join(__dirname, './Controller/datosRemate.js'));
        if(!startDate && !endDate){
            console.log("No se ingresaron fechas");
            return 0
        }else if(!startDate){
            console.log("No se ingreso la fecha de inicio");
            return 1;
        }else if(!endDate){
            console.log("No se ingreso la fecha de fin");
            return 2;
        }
        filePath = await insertarDatos(fechaHoy,startDate,endDate,maxRetries,saveFile);
        return filePath;
    }catch (error) {
        console.error('Error al obtener resultados en el index.js:', error.message);
        return null;
    }
  },
  printConsole: (message) => {
    console.log(message);
    // test();
    console.log(nodePath.join(__dirname, './Controller/datosRemate.js'));
  },
  selectFolder: () => ipcRenderer.invoke('select-folder-btn')
});

contextBridge.exposeInMainWorld('electronAPI', {
  sendPdfForProcessing: (filePath) => ipcRenderer.send('prefix-convert-pdf', filePath),
  onPdfProcessed: (callback) => ipcRenderer.once('prefix-pdf-converted', (event, data) => callback(data)),
  onPdfProcessingError: (callback) => ipcRenderer.once('prefix-pdf-converted-error', (event, error) => callback(error)),
});