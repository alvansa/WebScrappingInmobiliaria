// utils/stealth.js
const { randomInt } = require('crypto');

// Objeto contenedor para mantener el contexto
const HumanBehaviorSimulator = {
  /**
   * Simula comportamiento humano completo
   * @param {Page} page - Instancia de Puppeteer Page
   */
  async simulateHumanBehavior(page) {
    try {
      await this.simulateMouseMovements(page);
      await this.simulateHumanScroll(page);
      await this.randomMicroInteractions(page);
      await this.randomDelay(100, 3000);
    } catch (error) {
      console.error('Error en simulateHumanBehavior:', error);
    }
  },

  async simulateMouseMovements(page, count = 3) {
    const viewport = await page.viewport();
    for (let i = 0; i < count; i++) {
      const x = randomInt(0, viewport.width);
      const y = randomInt(0, viewport.height);
      await page.mouse.move(x, y);
      await this.randomDelay(50, 500);
    }
  },

  async simulateHumanScroll(page) {
    await page.evaluate(async () => {
      await new Promise(resolve => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  },

  async randomMicroInteractions(page) {
    const actions = [
      () => page.keyboard.press('Tab'),
      () => page.mouse.click(0, 0, { button: 'right' }),
      () => page.mouse.wheel({ deltaY: randomInt(-100, 100) })
    ];
    const action = actions[randomInt(0, actions.length - 1)];
    await action();
  },

  randomDelay(min, max) {
    const delay = randomInt(min, max);
    return new Promise(resolve => setTimeout(resolve, delay));
  }
};

// Exportamos las funciones individualmente manteniendo el contexto
module.exports = {
  simulateHumanBehavior: HumanBehaviorSimulator.simulateHumanBehavior.bind(HumanBehaviorSimulator),
  simulateMouseMovements: HumanBehaviorSimulator.simulateMouseMovements.bind(HumanBehaviorSimulator),
  simulateHumanScroll: HumanBehaviorSimulator.simulateHumanScroll.bind(HumanBehaviorSimulator),
  randomMicroInteractions: HumanBehaviorSimulator.randomMicroInteractions.bind(HumanBehaviorSimulator),
  randomDelay: HumanBehaviorSimulator.randomDelay.bind(HumanBehaviorSimulator)
};