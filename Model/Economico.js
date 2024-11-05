const axios = require('axios');
const cheerio = require('cheerio');

url = 'https://www.economicos.cl/remates/clasificados-remates-cod47395611.html'


function getEconomico() {
    
    axios.get(url)
        .then(({data}) => {
            const $ = cheerio.load(data);
            const description = $('div#description p').text();
            //console.log(description);
            const causa = getCausa(description);
            const juzgado = getJuzgado(description);
            console.log(causa[0])
            console.log(juzgado[0])
        })
        .catch(error => {
            console.log(error);
        });
    
}

//crea una funcion que revise en la descripcion a base de regex el juzgado
function getCausa(data) {
    const regex = /C-\d{4}-\d{4}/;
    
    const causa = data.match(regex);
    console.log(data)
    //console.log(`El regex el ${causa}`);
    return causa;
}

function getJuzgado(data) {
    const regex = /\b\w+\s+juzgado(\s+\w+){3}/i;
    
    const juzgado = data.match(regex);

    return juzgado;
}

// getEconomico();