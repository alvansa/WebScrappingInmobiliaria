const { getCausaVoluntaria } = require('../economico/datosRemateEmol');
const Caso = require('./caso');

class CasoBuilder{
    constructor(fechaObtencion,link,origen){
        console.log("CasoBuilder: ", fechaObtencion, link, origen);
        this.caso = new Caso(fechaObtencion,null,link,origen);
        
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

    conFechaRemate(fechaRemate){
        this.caso.fechaRemate = fechaRemate;
        return this;
    }

    construir(){
        return this.caso;
    }

}

module.exports = CasoBuilder;