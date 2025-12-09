let tribunalesPorCorte  = [];
console.log('Renderer loaded succefully')

// // obtener y procesar casos del pjud con sus pdf
// //Esta funcino fue creada para buscar datos solo del pjud
// document.getElementById('processExcelBtn').addEventListener('click', async () => {
//   const saveFile = document.getElementById('excel-input').value;

//   if (!saveFile) {
//     alert('Por favor seleccionar excel a completar');
//     return;
//   }

//   try {
//     const result = await window.api.completeInfoFromExcel(saveFile, startDate, endDate);
//     if (result) {
//       alert(`PDFs procesados y guardados en: ${result}`);
//     } else {
//       alert('No se encontraron PDFs para procesar');
//     }
//   } catch (error) {
//     console.error('Error al procesar los casos faltantes:', error);
//     alert('Ocurrió un error al procesar el excel');
//   }
// });

// document.getElementById('select-pdf-folder-btn').addEventListener('click', async () => {
//   // Llama al proceso principal para abrir el selector de carpetas
//   const folderPath = await window.api.selectFolder();
//   console.log("Path escogido: ", folderPath);
//   const folderInput = document.getElementById('pdf-folder-input'); // Obtén el input

//   if (folderPath) {
//     console.log('Carpeta seleccionada:', folderPath);
//     folderInput.value = folderPath;
//   } else {
//     console.log('Selección cancelada.');
//     folderInput.value = 'No se seleccionó ninguna carpeta.';
//   }
// });

// Manejo de notificaciones de espera con Modal
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

// window.api.electronLog((event, message) => {
//   console.log('Mensaje del proceso principal:', message);
//   alert(`Mensaje del proceso principal:\n${message}`);
// });

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

// document.getElementById('select-excel-file-btn').addEventListener('click', async()=>{
//   const excelInput = document.getElementById('excel-input'); // Obtén el input
//   const excelPath = await window.api.selectExcelPath();

//   if (excelPath) {
//     excelInput.value = excelPath;
//   } else {
//     excelInput.value = 'No se seleccionó ninguna carpeta.';
//   }
// });


document.getElementById('openSearchWindow').addEventListener('click', () => {
  console.log('presionado send en el renderer de search')
  window.api.openWindow('search'); 
});

document.getElementById('openSingleCaseWindow').addEventListener('click', () => {
  window.api.openWindow('singleCase'); 
});

document.getElementById('openExcelWindow').addEventListener('click', () => {
  window.api.openWindow('excel'); 
});

document.getElementById('openLadrillero').addEventListener('click', () => {
  window.api.openWindow('ladrillero'); 
});

document.getElementById('openSettingsWindow').addEventListener('click', () => {
  window.api.openWindow('singleCase'); 
});



