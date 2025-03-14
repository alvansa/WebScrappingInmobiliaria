const PublicosYLegales = require("./publicosYLegales");
const DataPublicosYLegales = require("./DataPublicosYLegales");


async function test(){
    // const startDate = new Date(2024, 11, 9);
    // const endDate = new Date(2024, 11, 13);
    const startDate = new Date(2025, 0, 24);
    const endDate = new Date(2025, 0, 31);

    const queryDate = new Date();
    const publicosYLegales = new PublicosYLegales(startDate,endDate,queryDate);
    const casos = await publicosYLegales.scrapePage();
    for(let caso of casos){
        const data = new DataPublicosYLegales(caso);
        data.proccessAuction();
    }
    const casosObj = casos.map(caso => caso.toObject());
    console.log(casosObj);
}

async function obtainHTML(link,number){
    const startDate = new Date(2024, 11, 9);
    const endDate = new Date(2024, 11, 13);
    const queryDate = new Date();
    const publicosYLegales = new PublicosYLegales(startDate,endDate,queryDate);
    await publicosYLegales.obtainHTML(link,number);

}

function use(){
    console.log("Uso: node testPublicoYLegales.js -l link numero para guardar un html a partir de un link con un numero especifico o node testPublicosYLgegas.js -t para probar de manera general el funcionamineto");
}

async function main(){
    const args = process.argv.slice(2);
    if(args.length === 0){
        use();
    }
    if(args[0] === "-t"){
        await test();
    }else if(args[0] === "-l"){
        const link = args[1];
        const number = args[2];
        console.log(link,number);
        await obtainHTML(link,number);
    }
}

main();