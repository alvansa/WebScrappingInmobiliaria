
function obtainType(info) {
    const regexTipo = /destino\sdel\sbien\sraiz:\s(\w{1,20})/g;

    let tipoBien = info.match(regexTipo);
    if (tipoBien) {
        return tipoBien[0];
    }
    const regexTipoExtracto = /el\s*inmueble\s*tiene\s*destino\s*de\s*(.*)\./
    tipoBien = info.match(regexTipoExtracto);
    if (tipoBien) {
        return tipoBien[1].trim();
    }
    return null;
}

module.exports = {obtainType}