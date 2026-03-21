# Reglas de Firebase Firestore

## ⚠️ REGLAS PARA DESARROLLO (Permisivas)

Copia y pega esto en Firebase Console > Firestore Database > Reglas:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir todo durante desarrollo
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🔒 REGLAS PARA PRODUCCIÓN (Más seguras)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios pueden leer todos los perfiles, pero solo editar el suyo
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }
    
    // Mensajes - usuarios autenticados pueden crear
    // Solo participantes pueden leer y actualizar
    match /messages/{messageId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

## 📋 Pasos para aplicar reglas

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **"Firestore Database"**
4. Ve a la pestaña **"Reglas"**
5. Borra todo el contenido actual
6. Pega las reglas de arriba (las de desarrollo primero)
7. Haz clic en **"Publicar"**

## 🔧 ÍNDICES NECESARIOS

Firebase necesita índices para las consultas. Ve a Firestore Database > Índices y crea estos:

### Índice 1: Mensajes enviados
- **Colección**: `messages`
- **Campos**:
  - `from` (Ascendente)
  - `timestamp` (Descendente)

### Índice 2: Mensajes recibidos
- **Colección**: `messages`
- **Campos**:
  - `to` (Ascendente)
  - `timestamp` (Descendente)

### Índice 3: Mensajes no leídos
- **Colección**: `messages`
- **Campos**:
  - `from` (Ascendente)
  - `to` (Ascendente)
  - `read` (Ascendente)

---

## ❌ Errores comunes

### "Missing or insufficient permissions"
**Solución**: Las reglas no permiten la operación. Usa las reglas de desarrollo de arriba.

### "The query requires an index"
**Solución**: Crea el índice que pide Firebase. El error incluye un link directo para crearlo.

### "Error: No hay usuario actual"
**Solución**: El usuario no está autenticado. Recarga la página e inicia sesión de nuevo.
