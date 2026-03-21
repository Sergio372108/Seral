import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth, db } from '@/config/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface User {
  uid: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, telegramId?: string | null) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  firebaseUser: FirebaseUser | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Convertir username a email (Firebase requiere email)
const usernameToEmail = (username: string) => `${username}@mensajeria.local`;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // Obtener datos adicionales del usuario desde Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        
        setUser({
          uid: firebaseUser.uid,
          username: userData?.username || firebaseUser.displayName || '',
          email: firebaseUser.email || ''
        });
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    const email = usernameToEmail(username);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('Usuario no encontrado');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Contraseña incorrecta');
      } else {
        throw new Error('Error al iniciar sesión: ' + error.message);
      }
    }
  };

  // telegramId es opcional — si no se pasa o es null, se guarda como null
  const register = async (username: string, password: string, telegramId?: string | null) => {
    const email = usernameToEmail(username);
    
    try {
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;
      
      // Actualizar el perfil con el username
      await updateProfile(newUser, { displayName: username });
      
      // Crear documento del usuario en Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        username,
        email,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        online: true,
        telegramId: telegramId || null, // ← se guarda si existe, null si no
      });
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('El usuario ya existe');
      } else {
        throw new Error('Error al registrarse: ' + error.message);
      }
    }
  };

  const logout = async () => {
    // Actualizar estado offline antes de cerrar sesión
    if (firebaseUser) {
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        online: false,
        lastSeen: serverTimestamp()
      }, { merge: true });
    }
    
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, firebaseUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};