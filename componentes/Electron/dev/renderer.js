
const selectFileBtn = document.getElementById('selectFileBtn');
const checkFPMG = document.getElementById('checkFPMG');
const fillMapa = document.getElementById('fillMapa');
const fileInfo = document.getElementById('fileInfo');
const fileInfoPjud = document.getElementById('fileInfoPjud');

const excelBase = document.getElementById('fileExcelBase');
const excelNuevo = document.getElementById('fileExcelNuevo');

let pathExcelBase, pathExcelNuevo;

let countdownInterval = null;

// document.getElementById('imbeddedText').addEventListener('click', () => {
//   const result = window.api.testEconomico(["imbeddedText"]);
//   console.log(result);
// });

document.getElementById('uploadedText').addEventListener('click', () => {
    const text = document.getElementById('textInput').value;
    const result = window.api.testEconomico(["uploadedText", text]);
});

// document.getElementById('downloadPDF').addEventListener('click', () => {
//   const url = document.getElementById('PDFLink').value;
//   const result = window.api.testEconomico(["downloadPDF", url]);
// });

document.getElementById('readPdf').addEventListener('click', async () => {
  try {
    const filePath = await window.api.openFilesLocal();
    const createExcel = document.getElementById('createExcel').checked;
    
    if (filePath) {
      fileInfoPjud.textContent = `Archivo seleccionado: ${filePath}`;
      
      // Llama a tu función que procesa el archivo
      window.api.testEconomico(['readPdf',filePath, createExcel]);
    }
  } catch (error) {
    console.error('Error al seleccionar archivo:', error);
    fileInfoPjud.textContent = 'Error al seleccionar archivo';

  }
});

document.getElementById('ExcelBase').addEventListener('click',async ()=>{
    const filePath = await window.api.selectExcelPath();
    if (filePath) {
        pathExcelBase = filePath;
        console.log(`Archivo base seleccionado: ${filePath}`);
      excelBase.textContent = `${filePath.split('/').pop()}`;
    }
});
document.getElementById('ExcelNuevo').addEventListener('click',async ()=>{
    const filePath = await window.api.selectExcelPath();
    if (filePath) {
      pathExcelNuevo = filePath;
      excelNuevo.textContent = `Archivo seleccionado: ${filePath}`;

    }
});
document.getElementById('compararExcel').addEventListener('click', async ()=>{
    if(!pathExcelNuevo){
        alert("Debe seleccionar ambos archivos");
        return;
    }
    window.api.searchRepeatedCases(pathExcelBase, pathExcelNuevo);

});

// document.getElementById('testConsultaCausa').addEventListener('click', ()=>{
//   const result = window.api.testEconomico(["testConsultaCausa"]);
// })

// document.getElementById('consultaDia').addEventListener('click', ()=>{
//   const result = window.api.testEconomico(["consultaDia"]);
// })

document.getElementById('testEconomicoPuppeteer').addEventListener('click', ()=>{
  const result = window.api.testEconomico(["testEconomicoPuppeteer"]);
})

selectFileBtn.addEventListener('click', async () => {
  try {
    const filePath = await window.api.openFileLocal();
    
    if (filePath) {
      fileInfo.textContent = `Archivo seleccionado: ${filePath}`;
      
      // Llama a tu función que procesa el archivo
      window.api.processFile(filePath);
    }
  } catch (error) {
    console.error('Error al seleccionar archivo:', error);
    fileInfo.textContent = 'Error al seleccionar archivo';

  }
});

// document.getElementById('consultaMultipleCases').addEventListener('click', async () => {
//   const result = await window.api.testEconomico(['consultaMultipleCases']);
//   showWaitingModal(false);
// });

// document.getElementById('consultaCausaDB').addEventListener('click', async () => {
//   const query = document.getElementById('textConsultaCausaDB').value;
//   try {
//     const result = await window.api.consultaDB(query);
//     alert("Consulta realizada con éxito\n" + JSON.stringify(result, null, 2));
//     console.log("Resultados de la consulta:", result);
//   } catch (error) {
//     console.error('Error al consultar la base de datos:', error);
//   }
// });



checkFPMG.addEventListener('click', async () => {
  try {
    const filePath = await window.ladrilleroAPI.openFileLocal();
    
    if (filePath) {
      fileInfo.textContent = `Archivo seleccionado: ${filePath}`;
      
      showWaitingProcess(true);
      // Llama a tu función que procesa el archivo
      await window.ladrilleroAPI.checkFPMG(filePath);
    }
  } catch (error) {
    console.error('Error al seleccionar archivo:', error);
    fileInfo.textContent = 'Error al seleccionar archivo';
  }finally{
    showWaitingProcess(false)
  }

});

function showWaitingProcess(show){
  const modal = document.getElementById('waitingModalProcess');
  modal.style.display = show ? 'flex' : 'none';
}

fillMapa.addEventListener('click', async () => {
  try {
    const filePath = await window.api.openFileLocal();
    
    if (filePath) {
      fileInfo.textContent = `Archivo seleccionado: ${filePath}`;
      
      // Llama a tu función que procesa el archivo
      window.api.fillMapa(filePath);
    }
  } catch (error) {
    console.error('Error al seleccionar archivo:', error);
    fileInfo.textContent = 'Error al seleccionar archivo';

  }
});

window.api.onWaitingNotification((args) => {
  const totalSeconds = args[0];
  const actualCase = args[1];
  const totalCases = args[2];
  showWaitingModal(true, `Esperando (${totalSeconds}s)... Caso ${actualCase} de ${totalCases}`);
  
  let remaining = totalSeconds;
  updateCountdown([remaining,actualCase,totalCases]);
  
  countdownInterval = setInterval(() => {
    remaining--;
    updateCountdown([remaining,actualCase,totalCases]);
    
    if (remaining <= 0) {
      console.log("Se acabo el tiempo");
      clearInterval(countdownInterval);
      showWaitingModal(false);
    }
  }, 1000);
});

function updateCountdown(data) {
  const seconds = data[0];
  const actualCase = data[1];
  const totalCases = data[2];
  // document.getElementById('seconds').textContent = Math.floor(seconds);
  document.getElementById('waitingMessage').textContent = 
    `Esperando (${Math.floor(seconds)}s) segundos para procesar el caso ${actualCase} de ${totalCases}...`;
}

function showWaitingModal(show) {
  const modal = document.getElementById('waitingModal');
  modal.style.display = show ? 'flex' : 'none';
  if (!show && countdownInterval) clearInterval(countdownInterval);
}

document.getElementById('testMapas').addEventListener('click', ()=>{
  const result = window.api.testEconomico(["testMapas"]);
});

document.getElementById('testApiMacal').addEventListener('click', ()=>{
  const result = window.api.testEconomico(["testMacal"]);
});
// document.getElementById('getAllCausasDB').addEventListener('click', async () => {
//   const filePath = await window.api.getAllCausas();
//   console.log(filePath);
// });

// document.getElementById('selectFileTesse').addEventListener('click', async () => {

//   const filePath = await window.api.openFilesLocal();
//   if (filePath) {
//     fileInfo.textContent = `Archivo seleccionado: ${filePath}`;
    
//     // Llama a tu función que procesa el archivo
//     window.api.testEconomico(['testPdfTesseract', filePath]);
//   }
// });
 document.addEventListener('DOMContentLoaded', () => {
  window.api.onShowAlert((event,message) => {
      alert(`Mensaje recibido: \n ${message}`);
  });
 });