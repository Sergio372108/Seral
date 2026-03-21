# Solución de Errores de Envío de Mensajes

## ❌ Error: "Error al enviar el mensaje"

### Causas más comunes:

1. **Reglas de Firestore incorrectas** (90% de los casos)
2. **Faltan índices en Firestore**
3. **Usuario no autenticado**

---

## ✅ SOLUCIÓN PASO A PASO

### Paso 1: Configurar Reglas de Firestore

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** > **Reglas**
4. **BORRA TODO** el contenido actual
5. **PEGA ESTO** (reglas para desarrollo):

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

6. Haz clic en **"Publicar"**

---

### Paso 2: Crear Índices

1. Ve a **Firestore Database** > **Índices**
2. Haz clic en **"Crear índice compuesto"**
3. Crea estos 2 índices:

**Índice 1:**
- Colección: `messages`
- Campo 1: `from` (Ascendente)
- Campo 2: `timestamp` (Descendente)

**Índice 2:**
- Colección: `messages`
- Campo 1: `to` (Ascendente)
- Campo 2: `timestamp` (Descendente)

4. Espera a que los índices estén en estado "Habilitado" (puede tardar unos minutos)

---

### Paso 3: Verificar Autenticación

1. Abre la app en el navegador
2. Presiona **F12** para abrir la consola
3. Ve a la pestaña **"Console"**
4. Busca errores en rojo

Si ves errores como:
- `"No hay usuario actual"` → Recarga la página y vuelve a iniciar sesión
- `"permission-denied"` → Las reglas de Firestore están mal configuradas

---

## 🔍 Depuración

### Ver errores en la consola:

1. Presiona **F12** en el navegador
2. Ve a la pestaña **"Console"**
3. Intenta enviar un mensaje
4. Mira los mensajes de error en rojo

### Errores comunes y soluciones:

| Error | Solución |
|-------|----------|
| `permission-denied` | Configura las reglas de Firestore (Paso 1) |
| `The query requires an index` | Crea el índice que pide Firebase (Paso 2) |
| `No hay usuario actual` | Recarga y vuelve a iniciar sesión |
| `Error al enviar mensaje` | Revisa la consola (F12) para más detalles |

---

## 🧪 Probar que funciona

Después de configurar todo:

1. **Registra dos usuarios diferentes** (en dos navegadores o ventanas de incógnito)
2. **Inicia sesión** con ambos usuarios
3. **Selecciona el contacto** en la lista
4. **Escribe un mensaje** y presiona Enter o el botón de enviar
5. **Verifica** que:
   - El emisor ve su mensaje inmediatamente
   - El receptor recibe el mensaje en tiempo real
   - Al recargar la página, los mensajes siguen ahí

---

## 📞 Si sigue sin funcionar

1. Abre la consola (F12)
2. Copia todos los errores que aparecen en rojo
3. Revisa que:
   - Las reglas de Firestore están publicadas
   - Los índices están habilitados (no en "Construyendo")
   - Estás autenticado (tu nombre aparece en la esquina)

---

## ✅ Checklist de verificación

- [ ] Proyecto Firebase creado
- [ ] Authentication habilitado (Email/Password)
- [ ] Firestore Database creada
- [ ] Reglas de Firestore configuradas (Paso 1)
- [ ] Índices creados (Paso 2)
- [ ] Credenciales en `src/config/firebase.ts`
- [ ] Usuario registrado e iniciado sesión
- [ ] Dos usuarios registrados (para probar)
