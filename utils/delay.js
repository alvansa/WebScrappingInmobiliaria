
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fakeDelay(min,max) {
    const ms = (Math.random() * (max - min) + min) * 1000;
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {delay,fakeDelay};