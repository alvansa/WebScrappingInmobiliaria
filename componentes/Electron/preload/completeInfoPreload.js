const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('completeInfoAPI', {
  openFileLocal: () => ipcRenderer.invoke('open-dialog-local'),

  completeInfoFromExcel: async(filePath) => {
    try {
      const result = await ipcRenderer.invoke('complete-info-excel', filePath);
      console.log("Resultados de la consulta en el preload :", result);
      alert('Listo')
      return result;
    } catch (error) {
      console.error('Error al obtener información del Pjud:', error);
      throw error; // Re-lanzar el error para manejarlo en el lugar donde se llama
    }
  },

});