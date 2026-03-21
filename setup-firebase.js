#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

console.log('🔥 Configuración de Firebase para Mensajería Privada');
console.log('=====================================================\n');

console.log('Sigue estos pasos para obtener tus credenciales:');
console.log('1. Ve a https://console.firebase.google.com/');
console.log('2. Crea un nuevo proyecto');
console.log('3. Ve a Configuración del proyecto > General');
console.log('4. En "Tus aplicaciones", selecciona el icono de </> (Web)');
console.log('5. Copia las credenciales que aparecen\n');

async function main() {
  const apiKey = await question('API Key: ');
  const authDomain = await question('Auth Domain: ');
  const projectId = await question('Project ID: ');
  const storageBucket = await question('Storage Bucket: ');
  const messagingSenderId = await question('Messaging Sender ID: ');
  const appId = await question('App ID: ');

  const configContent = `import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "${apiKey}",
  authDomain: "${authDomain}",
  projectId: "${projectId}",
  storageBucket: "${storageBucket}",
  messagingSenderId: "${messagingSenderId}",
  appId: "${appId}"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
`;

  writeFileSync('./src/config/firebase.ts', configContent);
  
  console.log('\n✅ Configuración guardada exitosamente!');
  console.log('Archivo actualizado: src/config/firebase.ts');
  console.log('\nAhora puedes ejecutar:');
  console.log('  npm run server  - Iniciar el servidor');
  console.log('  npm run dev     - Iniciar el frontend');
  
  rl.close();
}

main().catch(console.error);
