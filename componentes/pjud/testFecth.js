const fs = require('fs');  // Requiere el módulo fs para guardar el archivo

fetch("https://oficinajudicialvirtual.pjud.cl/ADIR_871/civil/documentos/anexoDocCivil.php?dtaDoc=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczpcL1wvb2ZpY2luYWp1ZGljaWFsdmlydHVhbC5wanVkLmNsIiwiYXVkIjoiaHR0cHM6XC9cL29maWNpbmFqdWRpY2lhbHZpcnR1YWwucGp1ZC5jbCIsImlhdCI6MTczNTkxNTA4MSwiZXhwIjoxNzM1OTE4NjgxLCJkYXRhIjoidVU3UFo3czM0S2VhRG5IZk9nUFFQRTdRaWxkYjNtRm5RanNtbGQyTDNqVDFINEE3SnB5Q3Bock5ReHU1M0VLTEhjV0tuZ243dU9oVnNKRStXNUF3eVE9PSJ9.6GF9G_al3Dbho2UqEEeOflPvyMipOLRyBeI3xUd0QJo", {
  method: "GET",
  headers: {
    "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "es-ES,es;q=0.8",
    "cache-control": "no-cache",
    "pragma": "no-cache",
    "sec-ch-ua": "\"Brave\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "document",
    "sec-fetch-mode": "navigate",
    "sec-fetch-site": "same-origin",
    "sec-fetch-user": "?1",
    "sec-gpc": "1",
    "upgrade-insecure-requests": "1",
    "cookie": "PHPSESSID=5771108a21c015515d570e81ffae88ad; TS01262d1d=01b485afe5473912bd677a9ee3a3ee0086d4a0c297247b6bb883f2733142ede0f3bacbb855c312c2094671122519f48a07a503b95497455106eff4edcbe68ea5e0ea5ef77c",
    "Referer": "https://oficinajudicialvirtual.pjud.cl/indexN.php",
    "Referrer-Policy": "no-referrer-when-downgrade"
  }
})
.then(response => {
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }
  return response.arrayBuffer();  // Si esperas HTML, usa text()

})
.then(data => {
    var base64str = Buffer.from(data).toString('base64');  // Convierte los datos a base64
    console.log(base64str);  // Muestra los datos obtenidos
    fs.writeFileSync('test.pdf', base64str, 'base64');  // Guarda el archivo
  console.log("pdf listo");  // Muestra los datos obtenidos
})
.catch(error => {
  console.error("There was a problem with the fetch operation:", error);
});
