
//Espera x ms 
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Espera un tiempo entre min en segundos y el max segundos
async function fakeDelay(min,max,log = false) {
    const ms = (Math.random() * (max - min) + min) * 1000;
    if(log){
        console.log(`Esperando ${ms/1000} segundos`);
    }
    return new Promise(resolve => setTimeout(resolve, ms));
}


//Espera un tiempo aleatorio entre ms entre el min y el max
async function fakeDelayms(min,max) {
    const ms = (Math.random() * (max - min) + min);
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {delay,fakeDelay,fakeDelayms};