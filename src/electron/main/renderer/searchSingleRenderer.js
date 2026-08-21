
// Manejar cambio en selección de corte
document.getElementById('corteSelect').addEventListener('change', function () {
  const corteSeleccionado = this.value;
  const tribunalSelect = document.getElementById('tribunalSelect');
  console.log('Corte seleccionado:', corteSeleccionado);
  console.log('Tribunales:', tribunalesPorCorte[corteSeleccionado]);

  // Limpiar y deshabilitar tribunal si no hay corte seleccionada
  if (!corteSeleccionado) {
    tribunalSelect.innerHTML = '<option value="">Primero seleccione corte</option>';
    tribunalSelect.disabled = true;
    return;
  }

  // Habilitar y llenar con tribunales correspondientes
  tribunalSelect.disabled = false;
  tribunalSelect.innerHTML = '<option value="">Seleccione tribunal</option>';

  tribunalesPorCorte[corteSeleccionado].forEach(tribunal => {
    const option = document.createElement('option');
    option.value = tribunal.value;
    option.textContent = tribunal.nombre;
    tribunalSelect.appendChild(option);
  });
});

// Validar campos antes de buscar
document.getElementById('searchCaseBtn').addEventListener('click', async () => {
  let juzgado = '';
  const corte = document.getElementById('corteSelect').value;
  const tribunal = document.getElementById('tribunalSelect').value;
  const rol = document.getElementById('rolInput').value;
  const year = document.getElementById('yearInput').value;
  const findJuzgado = tribunalesPorCorte[corte].find(findTribunal => findTribunal.value === tribunal);
  if (findJuzgado) {
    juzgado = findJuzgado.nombre;
  }


  if (!corte || !tribunal || !rol || !year) {
    alert('Por favor complete todos los campos');
    return;
  }

  console.log('Buscando causa:', { corte, tribunal, rol, year });
  // alert(`Búsqueda realizada para:\nCorte: ${corte}\nTribunal: ${tribunal}\nRol: ${rol}\nAño: ${year}\n juzgado: ${juzgado}`);
  const result = await window.searchSingleAPI.searchCase(corte, tribunal, juzgado, rol, year);
  console.log('Resultado de la búsqueda:', result);
  if (result) {
    alert(`Resultado de la búsqueda guardado en: ${result}`);
  } else {
    alert('No se encontró el caso');
  }
});

async function loadTribunales() {
  tribunalesPorCorte = await window.searchSingleAPI.obtainTribunalesJuzgado();
}
loadTribunales();