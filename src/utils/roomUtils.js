// src/utils/roomUtils.js

export const generateRoomData = (title) => {
  // 1. Encontrar la palabra más larga
  const words = title.trim().split(/\s+/);
  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, "").toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // 2. Generar 6 caracteres aleatorios (letras y números)
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomCode = '';
  for (let i = 0; i < 6; i++) {
    randomCode += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  // 3. Crear el Slug (URL) y el Código
  return {
    slug: `${longestWord}-${randomCode}`,
    code: randomCode,
    createdAt: Date.now()
  };
};