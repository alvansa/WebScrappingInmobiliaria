
const selectFileBtn = document.getElementById('selectFileBtn');
const fileInfo = document.getElementById('fileInfo');

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

document.getElementById('readPdf').addEventListener('click', () => {
  const pdfPath = document.getElementById('pdfPath').value;
  const result = window.api.testEconomico(["readPdf", pdfPath]); 
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