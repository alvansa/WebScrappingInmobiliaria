const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('ladrilleroAPI', {
    // Pensado para seleccionar un archivo pdf que se procesara
    openFileLocal: () => ipcRenderer.invoke('open-dialog-local'),

    //Revisar los archivos que le faltan publicaciones
    checkDEUDA: () => ipcRenderer.invoke('process-DEUDA'),

});