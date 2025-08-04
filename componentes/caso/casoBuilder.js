const { getCausaVoluntaria } = require('../economico/datosRemateEmol');
const Caso = require('./caso');

class CasoBuilder{
    constructor(fechaObtencion){
        this.caso = new Caso(fechaObtencion);
    }

    conCausa(causa){
        this.caso.causa = causa;
        return this;
    }

    conJuzgado(juzgado){
        this.caso.juzgado = juzgado;
        return this;
    }

    conPartes(partes){
        this.caso.partes = partes;
        return this;
    }

    conExcel(causa,juzgado,partes){
        this.caso.causa = causa;
        this.caso.juzgado = juzgado;
        this.caso.partes = partes;
        return this;
    }

    construir(){
        return this.caso;
    }

}

module.exports = CasoBuilder;