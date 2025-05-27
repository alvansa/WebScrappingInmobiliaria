
const selectFileBtn = document.getElementById('selectFileBtn');
const fileInfo = document.getElementById('fileInfo');
const fileInfoPjud = document.getElementById('fileInfoPjud');

let countdownInterval = null;

document.getElementById('imbeddedText').addEventListener('click', () => {
  const result = window.api.testEconomico(["imbeddedText"]);
  console.log(result);
});

document.getElementById('uploadedText').addEventListener('click', () => {
    const text = document.getElementById('textInput').value;
    const result = window.api.testEconomico(["uploadedText", text]);
});

document.getElementById('downloadPDF').addEventListener('click', () => {
  const url = document.getElementById('PDFLink').value;
  const result = window.api.testEconomico(["downloadPDF", url]);
});

document.getElementById('readPdf').addEventListener('click', async () => {
  try {
    const filePath = await window.api.openFileLocal();
    
    if (filePath) {
      fileInfoPjud.textContent = `Archivo seleccionado: ${filePath}`;
      
      // Llama a tu función que procesa el archivo
      window.api.testEconomico(['readPdf',filePath]);
    }
  } catch (error) {
    console.error('Error al seleccionar archivo:', error);
    fileInfoPjud.textContent = 'Error al seleccionar archivo';

  }
});

document.getElementById('testConsultaCausa').addEventListener('click', ()=>{
  const result = window.api.testEconomico(["testConsultaCausa"]);
})

document.getElementById('consultaDia').addEventListener('click', ()=>{
  const result = window.api.testEconomico(["consultaDia"]);
})

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

document.getElementById('consultaMultipleCases').addEventListener('click', async () => {
  const result = await window.api.testEconomico(['consultaMultipleCases']);
  showWaitingModal(false);
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
