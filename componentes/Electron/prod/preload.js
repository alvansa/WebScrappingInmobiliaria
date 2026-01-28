const { contextBridge, ipcRenderer } = require('electron');


console.log("preload loaded succefully");

contextBridge.exposeInMainWorld('api', {
  // Funcion de test principal para realizar pruebas unicas de funcionamientos especificos.
  testEconomico : async (args) => {
    const results = await ipcRenderer.invoke('testEconomico', args)
  },
  // Funcion para abrir un dialogo de seleccion de archivos locales
  // Pensado para seleccionar un archivo pdf que se procesara
  openFileLocal: () => ipcRenderer.invoke('open-dialog-local'),

  openFilesLocal: () => ipcRenderer.invoke('open-dialog-local-multiple'),

  //Procesa un archivo pdf seleccionado con el algoritmo del boletin
  processFile: (filePath) => ipcRenderer.invoke('process-file', filePath),

  
  fillMapa: (filePath) => ipcRenderer.invoke('process-Mapa', filePath),

  checkDEUDA : async ()=> {
    const result = await ipcRenderer.invoke('process-DEUDA')
    return result;
  },
  

  // Funcion para mostrar en pantalla el tiempo de espera.
  onWaitingNotification: (callback) => {
    ipcRenderer.on('aviso-espera', (_, seconds) => callback(seconds));
  },

  consultaDB : async (query) => {
    const result = await ipcRenderer.invoke('consultaDB', query);
    console.log("Resultados de la consulta en el preload :", result);
    return result;
  },

  getAllCausas : async() =>{
    const result = await ipcRenderer.invoke('getAllCausas');
    return result;
  },

  completeInfoFromExcel: async(filePath) => {
    try {
      const result = await ipcRenderer.invoke('complete-info-excel', filePath);
      console.log("Resultados de la consulta en el preload :", result);
      return result;
    } catch (error) {
      console.error('Error al obtener información del Pjud:', error);
      throw error; // Re-lanzar el error para manejarlo en el lugar donde se llama
    }
  },

  onShowAlert : async  (callback) => {
    ipcRenderer.on('show-alert', callback);
  },

  selectExcelPath : async ()=> ipcRenderer.invoke('select-excel-path'),

  searchRepeatedCases: async (excelBase, excelNuevo) => {
    try {
      const result = await ipcRenderer.invoke('search-repeated-cases', excelBase, excelNuevo);
      console.log("Resultados de la busqueda de casos repetidos:", result);
      return result;
    } catch (error) {
      console.error('Error al buscar casos repetidos:', error);
      throw error; // Re-lanzar el error para manejarlo en el lugar donde se llama
    }
  },

  openWindow : (type)=>{
    console.log(`Tipo recibido : ${type}`)
    ipcRenderer.invoke('open-window', type);
  },

  onMessage : (callback)=>{ ipcRenderer.on('message-renderer',(_event,msg)=>{ callback(msg) })},
});

contextBridge.exposeInMainWorld('ladrilleroAPI', {
    // Pensado para seleccionar un archivo pdf que se procesara
    openFileLocal: () => ipcRenderer.invoke('open-dialog-local'),

    //Revisar los archivos que le faltan publicaciones
    checkFPMG: () => ipcRenderer.invoke('process-FPMG'),

});