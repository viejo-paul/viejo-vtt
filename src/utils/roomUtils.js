// src/utils/roomUtils.js

// 1. Generador de códigos (Exportado para poder usarlo suelto)
export const generateRoomCode = (length = 4) => {
  // Usamos mayúsculas y números para evitar confusión, y quitamos caracteres parecidos (0/O, I/1) si quisieramos ser muy pro,
  // pero para empezar esto vale.
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// 2. Generador de datos completos de sala
export const generateRoomData = (title) => {
  // Encontrar la palabra más larga para el slug
  const words = title.trim().split(/\s+/);
  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, "").toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Generar código
  const code = generateRoomCode();

  // Crear el Slug (URL) y el Código
  return {
    slug: `${longestWord}-${code}`,
    code: code,
    createdAt: Date.now()
  };
};