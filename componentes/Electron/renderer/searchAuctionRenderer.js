const searchButton = document.getElementById('logButton');

searchButton.addEventListener('click', async () => {

  searchButton.disabled = true; // Deshabilita el botón al hacer clic

  const workingDialog = createDialog();

  try {
    const { startDate, endDate, saveFile } = getFormValues();
    const checkedBoxes = getCheckedBoxes();

    // Verifica que window.api exista antes de usarla
    if (!window.searchAPI?.startProcess) {
      console.log('Ocurrio un error con la API');
      return;
    }
    if (saveFile == 'No se seleccionó ninguna carpeta.' || !saveFile) {
      alert('No se ha seleccionado una carpeta para guardar los datos');
      return;
    }
    console.log(`Valores startDate : ${startDate} endDate :${endDate} saveFile: ${saveFile} checked: ${checkedBoxes}`)
    const filePath = await window.searchAPI.startProcess(startDate, endDate, saveFile, checkedBoxes);
    handleResults(filePath);
  } catch (error) {
    console.error('Ocurrió un error:', error);
  } finally {
    // Elimina el diálogo al finalizar
    document.body.removeChild(workingDialog);
    searchButton.disabled = false; // Habilita el botón nuevamente
  }
});

function getCheckedBoxes() {
  return {
    pjud: document.getElementById('pjud').checked,
    economico: document.getElementById('economicos').checked,
    PYL: document.getElementById('PYL').checked,
    liquidaciones: document.getElementById('liquidaciones').checked,
    preremates: document.getElementById('preremates').checked
  }
}

document.getElementById('select-folder-btn').addEventListener('click', async () => {
  // Llama al proceso principal para abrir el selector de carpetas
  const folderPath = await window.searchAPI.selectFolder();
  console.log("Path escogido: ", folderPath);
  const folderInput = document.getElementById('folder-input'); // Obtén el input

  if (folderPath) {
    console.log('Carpeta seleccionada:', folderPath);
    folderInput.value = folderPath;
  } else {
    console.log('Selección cancelada.');
    folderInput.value = 'No se seleccionó ninguna carpeta.';
  }
});

function createDialog() {
  // Crear y mostrar el diálogo de "Trabajando..."
  const workingDialog = document.createElement('div');
  workingDialog.id = 'workingDialog';
  workingDialog.style.position = 'fixed';
  workingDialog.style.top = '50%';
  workingDialog.style.left = '50%';
  workingDialog.style.transform = 'translate(-50%, -50%)';
  workingDialog.style.padding = '20px';
  workingDialog.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  workingDialog.style.color = 'white';
  workingDialog.style.borderRadius = '10px';
  workingDialog.style.textAlign = 'center';
  workingDialog.textContent = 'Trabajando, por favor espere...';
  document.body.appendChild(workingDialog);
  return workingDialog;

}
function getFormValues() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const saveFile = document.getElementById('folder-input').value

  return { startDate, endDate, saveFile };
}

function handleResults(filePath) {
  const messages = {
    null: 'Ocurrió un error al obtener los datos. Por favor, intente nuevamente.',
    0: 'No se ingresó ninguna de las fechas.',
    1: 'No se ingresó la fecha de inicio.',
    2: 'No se ingresó la fecha de fin.',
    3: 'La fecha de inicio es mayor a la fecha de fin.',
    4: 'No se seleccionó ninguna opción.',
    5: 'Error: No se encontró ningún caso en el rango de fechas seleccionado.',
    default: 'Error al registrar los datos.',
  };

  if (filePath == null || typeof filePath === 'number') {
    alert(messages[filePath] || messages.default);
  } else {
    alert(`¡Éxito! Los datos se han registrado correctamente en el archivo: ${filePath}`);
  }
}
