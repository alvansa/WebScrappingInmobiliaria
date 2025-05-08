// Mock de la clase Caso
// Este mock simula la clase Caso y sus métodos para facilitar las pruebas
class CasoMock {
    constructor(fechaObtencion, fechaPublicacion = 'N/A', link = 'N/A', origen = 'N/A') {
      // Propiedades públicas
      this.texto = '';
      
      // Propiedades "privadas" (simuladas con _)
      this._fechaPublicacion = fechaPublicacion;
      this._fechaObtencion = fechaObtencion;
      this._origen = origen;
      this._link = link;
      this._causa = null;
      this._juzgado = null;
      this._porcentaje = null;
      this._formatoEntrega = null;
      this._fechaRemate = null;
      this._montoMinimo = null;
      this._multiples = false;
      this._comuna = null;
      this._foja = null;
      this._multiplesFoja = false;
      this._numero = null;
      this._partes = null;
      this._tipoPropiedad = null;
      this._tipoDerecho = null;
      this._anno = 0;
      this._martillero = null;
      this._direccion = null;
      this._diaEntrega = null;
      this._rolPropiedad = null;
      this._avaluoPropiedad = null;
  
      // Métodos de asignación (setters)
      this.darCausa = jest.fn().mockImplementation((causa) => {
        this._causa = causa;
      });
      
      this.darJuzgado = jest.fn().mockImplementation((juzgado) => {
        this._juzgado = juzgado;
      });
      
      this.darPorcentaje = jest.fn().mockImplementation((porcentaje) => {
        this._porcentaje = porcentaje;
      });
      
      this.darFormatoEntrega = jest.fn().mockImplementation((formato) => {
        this._formatoEntrega = formato;
      });
      
      this.darFechaRemate = jest.fn().mockImplementation((fecha) => {
        this._fechaRemate = fecha;
      });
      
      this.darMontoMinimo = jest.fn().mockImplementation((monto) => {
        this._montoMinimo = monto;
      });
      
      this.darMultiples = jest.fn().mockImplementation((multiples) => {
        this._multiples = multiples;
      });
      
      this.darComuna = jest.fn().mockImplementation((comuna) => {
        this._comuna = comuna;
      });
      
      this.darFoja = jest.fn().mockImplementation((foja) => {
        this._foja = foja;
      });
      
      this.darAnno = jest.fn().mockImplementation((anno) => {
        this._anno = anno;
      });
      
      this.darNumero = jest.fn().mockImplementation((numero) => {
        this._numero = numero;
      });
      
      this.darPartes = jest.fn().mockImplementation((partes) => {
        this._partes = partes;
      });
      
      this.darTipoPropiedad = jest.fn().mockImplementation((tipo) => {
        this._tipoPropiedad = tipo;
      });
      
      this.darTipoDerecho = jest.fn().mockImplementation((derecho) => {
        this._tipoDerecho = derecho;
      });
      
      this.darMartillero = jest.fn().mockImplementation((martillero) => {
        this._martillero = martillero;
      });
      
      this.darDireccion = jest.fn().mockImplementation((direccion) => {
        this._direccion = direccion;
      });
      
      this.darDiaEntrega = jest.fn().mockImplementation((dia) => {
        this._diaEntrega = dia;
      });
      
      this.darRolPropiedad = jest.fn().mockImplementation((rol) => {
        this._rolPropiedad = rol;
      });
      
      this.darAvaluoPropiedad = jest.fn().mockImplementation((avaluo) => {
        this._avaluoPropiedad = avaluo;
      });
  
      // Métodos de acceso (getters - opcionales para testing)
      this.obtenerCausa = jest.fn().mockImplementation(() => {
        return this._causa;
      });
      
      this.obtenerJuzgado = jest.fn().mockImplementation(() => {
        return this._juzgado;
      });
      
      // ... otros getters según necesidad
  
      // Métodos especiales para testing
      this.resetMock = jest.fn().mockImplementation(() => {
        // Restablecer propiedades
        this.texto = '';
        this._causa = null;
        this._juzgado = null;
        // ... resetear todas las demás propiedades
        
        // Limpiar todos los mocks de métodos
        Object.getOwnPropertyNames(this)
          .filter(prop => jest.isMockFunction(this[prop]))
          .forEach(method => this[method].mockClear());
      });
      
      this.getPrivate = jest.fn().mockImplementation((propName) => {
        return this[`_${propName}`];
      });
      
      this.setPrivate = jest.fn().mockImplementation((propName, value) => {
        this[`_${propName}`] = value;
      });
    }
  }
  
  // Configuración para reemplazar la clase real en los tests
  jest.mock('../Caso', () => {
    return CasoMock;
  });

module.exports = CasoMock;