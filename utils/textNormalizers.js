
function normalizeText(text) {
    return text
        .toLowerCase()
        .replace(/[\n\r]/g, " ")
        .replace(/\s+/g, " ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/−/g, "-");
}

function normalizeTextSpanish(text){
    return text
        .toLowerCase()
        .replace(/[\n\r]/g, " ")
        .replace(/\s+/g, " ")
        .replace(/−/g, "-");
}

module.exports = {normalizeText, normalizeTextSpanish};