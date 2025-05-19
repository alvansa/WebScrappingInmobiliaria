
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

window.api.onWaitingNotification((totalSeconds) => {
  showWaitingModal(true, `Esperando (${totalSeconds}s)...`);
  
  let remaining = totalSeconds;
  updateCountdown(remaining);
  
  countdownInterval = setInterval(() => {
    remaining--;
    updateCountdown(remaining);
    
    if (remaining <= 0) {
      console.log("Se acabo el tiempo");
      clearInterval(countdownInterval);
    }
  }, 1000);
});

function updateCountdown(seconds) {
  // document.getElementById('seconds').textContent = Math.floor(seconds);
  document.getElementById('waitingMessage').textContent = 
    `Esperando (${Math.floor(seconds)}s) segundos para procesar el siguiente caso...`;
}

function showWaitingModal(show) {
  const modal = document.getElementById('waitingModal');
  modal.style.display = show ? 'flex' : 'none';
  if (!show && countdownInterval) clearInterval(countdownInterval);
}
