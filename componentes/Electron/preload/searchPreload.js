const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('searchAPI', {
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
    // Selecciona la carpeta donde se guardara el archivo de resultados.
    selectFolder: async () => ipcRenderer.invoke('select-folder-btn'),

})


function allValuesAllFalse(checkboxes) {
  for(let key in checkboxes) {
    if(checkboxes[key] == true) {
      return false;
    }
  }
  return true;
}


