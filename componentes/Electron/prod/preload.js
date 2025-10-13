const { contextBridge, ipcRenderer } = require('electron');
// const {insertarDatos} = require('../excel/createXLSX.js');
const nodePath = require('path');


contextBridge.exposeInMainWorld('api', {
  // Funcino del proceso principal que obtiene los remates publicas en las fuentes seleccionadas
  // entre las fechas seleccionadas.
  startProcess: async (startDate, endDate, saveFile, checkedBoxes) => {
    try {
      if (!startDate && !endDate) {
        console.log("No se ingresaron fechas");
        return 0
      } else if (!startDate) {
        console.log("No se ingreso la fecha de inicio");
        return 1;
      } else if (!endDate) {
        console.log("No se ingreso la fecha de fin");
        return 2;
      } else if (startDate > endDate) {
        console.log("La fecha de inicio es mayor a la fecha de fin");
        return 3;
      } else if (allValuesAllFalse(checkedBoxes)) {
        console.log("No se selecciono ninguna opcion");
        return 4;
      } else {
        filePath = ipcRenderer.invoke('start-proccess', startDate, endDate, saveFile, checkedBoxes)
        return filePath;
      }
    } catch (error) {
      console.error('Error al obtener resultados en el index.js:', error.message);
      return null;
    }
  },

  // Funcion para que el main le pueda entregar al renderer el listado de cortes y juzgados.
  obtainTribunalesJuzgado: async () => {
    const result = await ipcRenderer.invoke('obtainTribunalesJuzgado');
    return result;
  },

  // Selecciona la carpeta donde se guardara el archivo de resultados.
  selectFolder: async () => ipcRenderer.invoke('select-folder-btn'),

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

  //Revisar los archivos que le faltan publicaciones
  checkFPMG: (filePath) => ipcRenderer.invoke('process-FPMG', filePath),

  // Busca un caso a partir de sus datos en la pagina del pjud, busca, descarga y procesa los pdf.
  searchCase: async (corte, tribunal,juzgado, rol, year) => {
    result = ipcRenderer.invoke('search-case', corte, tribunal,juzgado, rol, year)
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

  electronLog : async  (callback) => {
    const result = await ipcRenderer.invoke('electron-log', (event, message) => callback(message));
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
  }


});


function allValuesAllFalse(checkboxes) {
  for(let key in checkboxes) {
    if(checkboxes[key] == true) {
      return false;
    }
  }
  return true;
}