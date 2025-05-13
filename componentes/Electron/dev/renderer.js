
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