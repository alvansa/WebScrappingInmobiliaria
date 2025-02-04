


document.getElementById('logButton').addEventListener('click', async () => {


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

  try {
    const {startDate,endDate,saveFile} = getFormValues();
    const checkedBoxes = getCheckedBoxes();
    console.log(checkedBoxes);
    // Verifica que window.api exista antes de usarla
    if (window.api && window.api.logDates) {
      if (saveFile == 'No se seleccionó ninguna carpeta.' || saveFile == '') {
        alert('No se ha seleccionado una carpeta para guardar los datos');
        return;
      }
      window.api.updateProgress(({ progreso, caso }) => {
        console.log(progreso, caso);
        if (progreso && caso) {
            workingDialog.textContent = `Procesando: Caso ${caso} / ${progreso}%`;
        }
    });

      // const inicio = new Date();
      const filePath = await window.api.logDates(startDate, endDate,saveFile,checkedBoxes); // Operación que toma tiempo
      // const fin = new Date();
      if(filePath == null){
        alert('Ocurrio un error al obtener los datos, por favor intente nuevamente');
      }
      else if (typeof(filePath) != 'number') {
        alert('¡Éxito! Los datos se han registrado correctamente en el archivo: ' + filePath);
        // const tiempo = (fin - inicio)/1000;
        // alert("Se demoro " + tiempo + " segundos");
      } else if (filePath == 0) {
        alert('No se ingreso ninguna de las fechas');
      }else if(filePath == 1){
        alert('No se ingreso la fecha de inicio');
      }
      else if (filePath == 2) {
        alert('No se ingreso la fecha de fin');
      }else {
        alert('Error al registrar los datos');
      }
    } else {
      console.error('La API no está disponible.');
    }
  } catch (error) {
    console.error('Ocurrió un error:', error);
  } finally {
    // Elimina el diálogo al finalizar
    document.body.removeChild(workingDialog);
  }
});

function getFormValues(){
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const saveFile = document.getElementById('folder-input').value

  return {startDate,endDate,saveFile};
}

function getCheckedBoxes(){
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
  const folderPath = await window.api.selectFolder();
  console.log(folderPath);
  const folderInput = document.getElementById('folder-input'); // Obtén el input
  
  if (folderPath) {
      console.log('Carpeta seleccionada:', folderPath);
      folderInput.value = folderPath;
  } else {
      console.log('Selección cancelada.');
      folderInput.value = 'No se seleccionó ninguna carpeta.';
  }
});