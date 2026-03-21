import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD0UOCR8gNHU9yooKxtxxw-dAbIHKU0ESU",
  authDomain: "mensajeria-privada-82e05.firebaseapp.com",
  projectId: "mensajeria-privada-82e05",
  storageBucket: "mensajeria-privada-82e05.firebasestorage.app",
  messagingSenderId: "959738663208",
  appId: "1:959738663208:web:8eb377268963ec2fc5801d"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
