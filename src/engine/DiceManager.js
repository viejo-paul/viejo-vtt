import DiceBox from '@3d-dice/dice-box';

let diceBox = null;

export const DiceManager = {
  init: (containerId) => {
    if (diceBox) return Promise.resolve();

    diceBox = new DiceBox({
      assetPath: '/assets/dice-box/',
      container: containerId,
      scale: 3.5,
      themeColor: '#e5e5e5', 
      fov: 50,
      gravity: 2,
      mass: 5,
      friction: 0.8,
      restitution: 0.5,
      startingHeight: 15,
      lightIntensity: 1.2,
    });

    return diceBox.init();
  },

  // Ajuste de luz seguro (sin crash)
  updateTheme: (theme) => {
    if (!diceBox) return;
    // Si la versión de dice-box no permite cambiar luz en vivo, 
    // al menos no romperemos la aplicación.
    try {
      if (diceBox.setLightIntensity) {
        diceBox.setLightIntensity(theme === 'light' ? 2.0 : 1.2);
      }
    } catch (e) {
      console.warn("Ajuste de luz no soportado");
    }
  },

  roll: async (rollConfig) => {
    if (!diceBox) return [];
    diceBox.clear();
    // Importante: Pasamos la configuración que incluye el color de cada dado
    return await diceBox.roll(rollConfig);
  },

  clear: () => { if (diceBox) diceBox.clear(); },
  resize: () => { if (diceBox) diceBox.resizeWorld(); }
};