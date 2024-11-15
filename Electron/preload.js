const { contextBridge } = require('electron');
const {getDatosRemate} = require('../Controller/datosRemate.js');
const nodePath = require('path');
// const {cpu, totalmem} = require('os-utils');
// const test = require('./index.js');

contextBridge.exposeInMainWorld('api', {
  logDates:async (startDate, endDate) => {
    try {
        const fechaHoy = new Date();
        const maxRetries = 10;
        var casos = [];
        // console.log(path.join(__dirname, './Controller/datosRemate.js'));
        if(!startDate || !endDate){
            console.log("No se ingresaron fechas");
            return;
        }
        casos = await getDatosRemate(fechaHoy,startDate, endDate,maxRetries);
        console.log(casos.length);
    }catch (error) {
        console.error('Error al obtener resultados en el index.js:', error.message);
    }
  },
  printConsole: (message) => {
    console.log(message);
    // test();
    console.log(nodePath.join(__dirname, './Controller/datosRemate.js'));
  }
});