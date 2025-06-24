const PjudPdfData = require('../../componentes/pjud/PjudPdfData');
const Caso = require('../../componentes/caso/caso');


const textoEstacionamiento1 = require('./textoAvaluo/Estacionamiento1');




describe('obtainRolPropiedad', () => {
    const testCaso = createCase("1111-2024", '1º Juzgado de Letras de Buin');
    const testPjudPdf = new PjudPdfData(testCaso)


  test('debería retornar null cuando el texto contiene "inscripcion"', () => {
    const texto = "Este es un texto con inscripcion pero sin rol de avalúo";
    const resultado = testPjudPdf.obtainRolPropiedad(texto);
    expect(resultado).toBeNull();
  });

  test('Deberia retornar el rol y bien raiz estacionamiento', () => {
    
    const textoNormalizado = testPjudPdf.normalizeInfo(textoEstacionamiento1)
    const resultado = testPjudPdf.obtainRolPropiedad(textoNormalizado);
    
    expect(resultado).toEqual({
      tipo: "destino del bien raiz: estacionamiento",
      rol: "00546 - 00618"
    });
  });

//   test('debería retornar el rol cuando encuentra el patrón "rol de avaluo: XXXX-XXXX"', () => {
//     mockInstance.obtainTipo.mockReturnValue("rústico");
//     const texto = "Documento con rol de avaluo: 987-654321 para el terreno";
//     const resultado = testPjudPdf.obtainRolPropiedad(texto);
    
//     expect(resultado).toEqual({
//       tipo: "rústico",
//       rol: "987-654321"
//     });
//   });

//   test('debería manejar espacios adicionales en el número de rol', () => {
//     mockInstance.obtainTipo.mockReturnValue("urbano");
//     const texto = "Rol de avaluo numero 12  -  3456 7";
//     const resultado = testPjudPdf.obtainRolPropiedad(texto);
    
//     expect(resultado).toEqual({
//       tipo: "urbano",
//       rol: "12  -  3456 7"
//     });
//   });

//   test('debería retornar null cuando no encuentra un rol de avalúo válido', () => {
//     const texto = "Este texto no contiene información de rol de avalúo";
//     const resultado = testPjudPdf.obtainRolPropiedad(texto);
//     expect(resultado).toBeNull();
//     expect(mockInstance.obtainTipo).not.toHaveBeenCalled();
//   });

//   test('debería retornar tipo vacío cuando obtainTipo retorna undefined', () => {
//     mockInstance.obtainTipo.mockReturnValue(undefined);
//     const texto = "Rol de avaluo numero 111-2222";
//     const resultado = testPjudPdf.obtainRolPropiedad(texto);
    
//     expect(resultado).toEqual({
//       tipo: "",
//       rol: "111-2222"
//     });
//   });
});



function createCase(causa,juzgado){
    const caso1 = new Caso("1/1/2025");
    caso1.causa = causa;
    caso1.juzgado = juzgado;
    return caso1;
}