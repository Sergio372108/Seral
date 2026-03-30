# Mensajería Privada con Firebase

Aplicación de mensajería simple, segura y privada con correcciones de bugs y mejoras.

---

##  Bugs corregidos

| Bug | Estado |
|-----|--------|
| Emisor no ve sus mensajes |  Corregido |
| Mensajes desaparecen al recargar |  Corregido |
| Notificaciones no se borran |  Corregido |
| Mensajes no persistentes |  Corregido |

---

## Configuración rápida

### 1. Firebase (OBLIGATORIO)

1. Crea proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita **Authentication** (Email/Password)
3. Crea **Firestore Database**
4. Configura **Reglas** (ver abajo)
5. Crea **Índices** (ver abajo)
6. Copia credenciales a `src/config/firebase.ts`

### 2. Reglas de Firestore

Ve a Firestore Database > Reglas y pega:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Índices necesarios

Ve a Firestore Database > Índices y crea:

| Colección | Campo 1 | Orden 1 | Campo 2 | Orden 2 |
|-----------|---------|---------|---------|---------|
| messages | from | Asc | timestamp | Desc |
| messages | to | Asc | timestamp | Desc |

---

##  Ejecutar localmente

```bash
# Instalar dependencias
npm install

# Configurar Firebase (interactivo)
npm run setup

# Terminal 1 - Servidor
npm run server

# Terminal 2 - Frontend
npm run dev
```

Abre: http://localhost:5173

---

##  Características

-  **Autenticación Firebase** - Login seguro
-  **Mensajes en tiempo real** - Conexión instantánea
-  **Persistencia** - Los mensajes se guardan en la nube
-  **Notificaciones** - Badge con contador de no leídos
- **Doble check** - Indicador de mensaje leído
-   **Estado online** - Indicador de conexión
-  **Responsive** - Funciona en móvil y desktop

---

##  Verificación

Lee `VERIFICACION.md` para instrucciones detalladas de cómo probar que todo funciona.

---

##  Solución de problemas

### "Error al enviar mensaje"
→ Configura las reglas de Firestore (Paso 2 arriba)

### "The query requires an index"
→ Crea los índices que pide Firebase (Paso 3 arriba)

### "No hay usuario actual"
→ Recarga la página e inicia sesión de nuevo

---

##  Archivos importantes

- `src/hooks/useMessages.ts` - Sistema de mensajes
- `src/hooks/usePresence.ts` - Estado online/offline
- `src/pages/Chat.tsx` - Interfaz de chat
- `VERIFICACION.md` - Guía de pruebas
- `FIREBASE_RULES.md` - Reglas de seguridad
