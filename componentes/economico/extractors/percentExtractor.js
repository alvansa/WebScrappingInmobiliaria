
function extractPercent(data) {
    // console.log("Data en getPorcentaje: ", data);
    const foundPercent = obtainPercent(data);
    if(foundPercent){
        const percent = getPercentNumber(foundPercent)
        return percent;
    }

    return null;
}

function obtainPercent(data){
    const regexMinimos = [
        /\d{1,3}\s*%\s*(?:del\s+)?(?:mínimo|valor|precio)+/i,
        /(garantía|Garantía)\s+(suficiente\s+)?(de\s+)?(\$\s*)?(\d{1,3}(?:\.\d{3})*,?\d*)/i,
        /(caución|interesados\s+)[a-zA-ZáéíóúÑñ:\s]*\d{1,3}\s*%/i,
        /(garantía|Garantía)\s+(suficiente\s+)?(por\s+)?(el\s+)?\d{1,3}%/i,
        /(para\s*participar)[\wáéíóúÑñ:\s]{1,200}(mínimo\s*fijado)/i,
        /garantía\s*[\w,áéíóúÑñ0-9%:\s]{1,200}mínimo/i,
    ];
    for (let regex of regexMinimos) {
        const porcentaje = data.match(regex);
        if (porcentaje != null) {
            return porcentaje;
        }
    }
}

function getPercentNumber(percent){
        const minimoPorcentaje = percent[0].match(/\d{1,3}\s*%/);
        const minimoPesos = percent[0].match(/(\d{1,3}\.)*\d{1,3}(,\d{1,5})*/);
        if (minimoPorcentaje) {
            return minimoPorcentaje[0];
        } else if (minimoPesos) {
            return minimoPesos[0];
        }

}

module.exports = {extractPercent}