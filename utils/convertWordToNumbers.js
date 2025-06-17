function convertWordToNumbers(stringNumber) {
  const numberMap = {
    units: {
      "cero": 0,
      "uno": 1,
      "un": 1,
      "una": 1,
      "dos": 2,
      "tres": 3,
      "cuatro": 4,
      "cinco": 5,
      "seis": 6,
      "siete": 7,
      "ocho": 8,
      "nueve": 9,
      "diez": 10,
      "once": 11,
      "doce": 12,
      "trece": 13,
      "catorce": 14,
      "quince": 15
    },
    specialTens: {
      "dieciséis": 16,
      "dieciseis": 16,
      "diecisiete": 17,
      "dieciocho": 18,
      "diecinueve": 19,
      "veinte": 20,
      "veintiuno": 21,
      "veintidós": 22,
      "veintitrés": 23,
      "veinticuatro": 24,
      "veinticinco": 25,
      "veintiséis": 26,
      "veintisiete": 27,
      "veintiocho": 28,
      "veintinueve": 29
    },
    tens: {
      "treinta": 30,
      "cuarenta": 40,
      "cincuenta": 50,
      "sesenta": 60,
      "setenta": 70,
      "ochenta": 80,
      "noventa": 90
    },
    hundreds: {
      "cien": 100,
      "ciento": 100,
      "doscientos": 200,
      "doscientas": 200,
      "trescientos": 300,
      "trescientas": 300,
      "cuatrocientos": 400,
      "cuatrocientas": 400,
      "quinientos": 500,
      "quinientas": 500,
      "seiscientos": 600,
      "seiscientas": 600,
      "setecientos": 700,
      "setecientas": 700,
      "ochocientos": 800,
      "ochocientas": 800,
      "novecientos": 900,
      "novecientas": 900
    },
    thousands: {
      "mil": 1000
    },
    millions: {
      "millón": 1000000,
      "millones": 1000000
    }
  };

  // Normalizar el string: eliminar acentos, convertir a minúsculas y unir palabras compuestas
  const normalized = stringNumber
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // eliminar acentos
    .replace(/\s+/g, ' ')
    .trim();

  // Verificar primero números especiales (0-29)
  for (const [word, value] of Object.entries(numberMap.specialTens)) {
    if (normalized === word) {
      return value;
    }
  }

  // Verificar unidades simples (0-15)
  if (numberMap.units[normalized]) {
    return numberMap.units[normalized];
  }

  // Procesar números más complejos
  let total = 0;
  let currentValue = 0;
  const parts = normalized.split(/\s+|y/); // Separar por espacios o "y"
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    // console.log("part: ", part)
    
    // 1. Procesar unidades especiales (16-29)
    if (numberMap.specialTens[part]) {
      currentValue += numberMap.specialTens[part];
      continue;
    }
    
    // 2. Procesar unidades simples (0-15)
    if (numberMap.units[part]) {
      currentValue += numberMap.units[part];
      continue;
    }
    
    // 3. Procesar decenas (30-90)
    if (numberMap.tens[part]) {
      currentValue += numberMap.tens[part];
      continue;
    }
    
    // Creo que este if es inutil y nunca deberia entrar, aun asi quiero revisarlo antes de borrarlo, y menos un viernes.
    // 4. Procesar "y" en decenas (ej. "cuarenta y dos")
    if (part === 'y' && i > 0 && i < parts.length - 1) {
      console.log("aqui no deberia entrar nunca")
      const prev = parts[i-1];
      const next = parts[i+1];
      
      if (numberMap.tens[prev] && numberMap.units[next]) {
        currentValue += numberMap.units[next];
        i++; // Saltamos la siguiente parte ya procesada
        continue;
      }
    }
    
    // 5. Procesar cientos
    if (numberMap.hundreds[part]) {
      currentValue += numberMap.hundreds[part];
      continue;
    }
    
    // 6. Procesar miles
    if (part === 'mil') {
      total += (currentValue || 1) * 1000;
      currentValue = 0;
      continue;
    }
    
    // 7. Procesar millones (si los tuvieras)
    if (part === 'millones') {
      total += (currentValue || 1) * 1000000;
      // console.log("aqui deberia entrar y el total es: ", total)
      currentValue = 0;
      continue;
    }
    
  }
  total += currentValue;

  return total;
}

module.exports = convertWordToNumbers;


//Funcion original
function convertWordToNumber(stringNumber){
  const checked = {
    thousands : false,
    hundred : false,
    tens : false,
    units : false
  }
  let total = 0;
  
  const units = {
    "uno" : 1,
    "dos" : 2,
    "tres" : 3,
    "cuatro": 4,
    "cinco" : 5,
    "seis" : 6,
    "siete" : 7,
    "ocho" : 8,
    "nueve": 9
  }
  const tens = {
    "dieci": 10,
    "veinti": 20,
    "treinta" : 30,
    "cuarenta" : 40,
    "cincuenta" : 50,
    "sesenenta" : 60,
    "setenta" : 70,
    "ochenta" : 80,
    "noventa" : 90
  }
  const hundreds = {
    "ciento" : 100,
    "doscientos" : 200,
    "trescientos ":300,
    "trescientas" : 300,
    "cuatrocientos" : 400,
    "quinientos" : 500,
    "seiscientos" : 600,
    "setecientos" : 700,
    "ochocientos" : 800,
    "novecientos" : 900,
  }
  const thousands = {
    "mil" : 1000,
    "dosmil" : 2000,
    "tresmil" : 3000,
    "cuatromil" : 4000,
    "cincomil" : 5000,
    "seismil" : 6000,
    "sietemil" : 7000,
    "ochomil" : 8000,
    "nuevemil" : 9000
  }
  
  const partes = stringNumber.split(" ");
  const normalizedParts = normalizarPartes(partes);
  for(let part of normalizedParts){
    if(!checked.thousands){
      if(thousands[part]){
        checked.thousands = true;
        total += thousands[part];
      }  
    }
    if(!checked.hundreds){
      if(hundreds[part]){
        checked.hundreds = true;
        total += hundreds[part];
      }
    }
    if(!checked.tens){
      if(tens[part]){
        checked.tens = true;
        total += tens[part];
      }
    }
    if(!checked.units){
      if(units[part]){
        checked.units = true;
        total += units[part];
      }
    }
  }
  console.log(stringNumber,total) 
}


function normalizarPartes(sections){
  const newSections = []
  for(let section of sections){  
    if(section == "mil"){
      newSections[newSections.length-1] += section;
      continue
    }
    newSections.push(section)
  }
    return newSections;
}
