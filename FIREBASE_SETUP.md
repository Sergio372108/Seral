# Configuración de Firebase - PASO A PASO

## ⚠️ IMPORTANTE: Configurar Reglas de Firestore

Después de crear tu proyecto en Firebase, DEBES configurar las reglas de seguridad de Firestore o la app NO funcionará.

### Paso 1: Ir a Firestore Database

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. En el menú lateral, haz clic en **"Firestore Database"**
4. Ve a la pestaña **"Reglas"**

### Paso 2: Copiar estas reglas

Reemplaza TODO el contenido con esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura/escritura de usuarios autenticados
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
    }
    
    // Permitir mensajes entre usuarios
    match /messages/{messageId} {
      allow read: if request.auth != null && 
        (resource.data.participants[0] == request.auth.token.name ||
         resource.data.participants[1] == request.auth.token.name ||
         resource.data.from == request.auth.token.name ||
         resource.data.to == request.auth.token.name);
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
        (resource.data.to == request.auth.token.name ||
         resource.data.from == request.auth.token.name);
    }
  }
}
```

### Paso 3: Publicar reglas

1. Haz clic en **"Publicar"**
2. Confirma los cambios

---

## 🔧 Solución de Problemas Comunes

### "Error: Missing or insufficient permissions"

**Causa**: Las reglas de Firestore no están configuradas correctamente.

**Solución**: Sigue los pasos de arriba para configurar las reglas.

### "No se ven los mensajes al recargar"

**Causa**: La consulta de Firestore necesita un índice compuesto.

**Solución**: 
1. Abre la consola del navegador (F12)
2. Busca el error que dice "The query requires an index"
3. Haz clic en el link que te da Firebase para crear el índice
4. Espera unos minutos a que se cree el índice

O crea el índice manualmente:
1. Ve a Firestore Database > Índices
2. Haz clic en "Crear índice compuesto"
3. Colección: `messages`
4. Campos:
   - `from` (Ascendente)
   - `to` (Ascendente)
   - `timestamp` (Descendente)
5. Guardar

### "Los mensajes no llegan en tiempo real"

**Causa**: Problema de conexión o índices faltantes.

**Solución**: 
1. Verifica tu conexión a internet
2. Crea los índices necesarios (ver arriba)
3. Recarga la página

---

## ✅ Verificación Rápida

Después de configurar todo, verifica:

1. [ ] Proyecto Firebase creado
2. [ ] Authentication habilitado (Email/Password)
3. [ ] Firestore Database creada
4. [ ] Reglas de seguridad configuradas
5. [ ] Índices compuestos creados
6. [ ] Credenciales en `src/config/firebase.ts`

---

## 🚀 Comandos para ejecutar

```bash
# Instalar dependencias (solo la primera vez)
npm install

# Configurar Firebase
npm run setup

# Terminal 1 - Servidor backend
npm run server

# Terminal 2 - Frontend  
npm run dev
```

La app estará en: http://localhost:5173
