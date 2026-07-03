
function extractPropertyId(data) {
    const regexRolAvaluo = /rol\s*(?:de\s*)?aval[uú]os?\s*(?:n[úu]meros?\s*)?(?:es\s*)?(?:el\s*)?(?:Nº?°?\s*)?(\d{1,5}\s*-\s*\d{1,5})/i;
    const rolAvaluo = data.match(regexRolAvaluo);

    if (rolAvaluo) {
        return rolAvaluo[1];
    }

    return null;
}

module.exports = {extractPropertyId};