const puppeteer = require('puppeteer');

async function main(){
    const proxyData = [{
        "server" : " http://45.127.248.127:5128 ",
        "username" : "jyhuwzla",
        "password" : "u119x5g9j0kt"
    },{
        "server" : " http://198.23.239.134:6540",
        "username" : "jyhuwzla",
        "password" : "u119x5g9j0kt",
    }];
    const randomIndex = Math.floor(Math.random() * proxyData.length);
    const url =  'https://oficinajudicialvirtual.pjud.cl/indexN.php';
    const url2 = "https://www.google.com";
    const browser = await puppeteer.launch({
        headless: false,
        proxy: {
            server: proxyData[randomIndex].server,
            username: proxyData[randomIndex].username,
            password: proxyData[randomIndex].password,
        },
    });
    const page = await browser.newPage();
    await page.goto(url,{ waitUntil: 'networkidle2', timeout: 0 });
    // await page.waitForSelector('#competencia'); 

    await delay(1000);

    browser.close();
    console.log('Browser closed');
    console.log("Se probo la conexion con el proxy: ",proxyData[randomIndex]);

}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main();

