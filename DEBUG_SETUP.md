# 🔧 Debug Configuration Setup

Este documento explica la configuración completa de debugging y error tracking para el proyecto POS AI Frontend.

## 📁 Archivos de Configuración Creados

### 1. `.vscode/launch.json` - Configuración de Debug
Configuraciones disponibles:
- **Launch React App (Chrome)** - Inicia la app en Chrome con debugging
- **Debug React App (Edge)** - Inicia la app en Edge con debugging
- **Attach to Chrome** - Se conecta a una instancia existente de Chrome
- **Debug Vite Build** - Debug del proceso de build
- **Debug Component Tests** - Debug de tests con Vitest

### 2. `.vscode/tasks.json` - Tareas Automatizadas
- `npm: dev` - Servidor de desarrollo con problem matcher
- `npm: build` - Build de producción
- `npm: preview` - Preview del build
- `Clean & Rebuild` - Limpia y reconstruye el proyecto

### 3. `.vscode/settings.json` - Configuración del Workspace
- Configuración optimizada para React/Vite
- Error Lens habilitado
- Console Ninja configurado
- File nesting patterns para mejor organización

### 4. `.vscode/extensions.json` - Extensiones Recomendadas
Extensiones esenciales para debugging:
- **Error Lens** - Muestra errores inline
- **Console Ninja** - Enhanced debugging
- **JS Debug** - Debugging mejorado para JavaScript

## 🐛 Sistema de Error Tracking

### `src/utils/errorTracking.js`
Sistema completo de tracking de errores que captura:
- Errores de JavaScript
- Promise rejections no manejados  
- Errores de React (via console.error override)
- Errores manuales
- Issues de performance

### Características del Error Tracker:
```javascript
// Captura automática de errores
window.errorTracker.getErrors()       // Ver todos los errores
window.debugApp.clearErrors()         // Limpiar errores
window.debugApp.exportErrors()        // Exportar reporte
window.debugApp.getSummary()          // Resumen de errores
```

### `src/components/common/DebugPanel.jsx`
Panel visual de debugging con:
- Lista de errores con filtros
- Detalles completos de cada error
- Exportación de reportes
- Herramientas de testing

## 🚀 Cómo Usar

### 1. **Debugging en VS Code**
1. Abre VS Code en el proyecto
2. Ve a la pestaña "Run and Debug" (Ctrl+Shift+D)
3. Selecciona "Launch React App (Chrome)"
4. Presiona F5 o click en "Start Debugging"

### 2. **Breakpoints**
- Clickea en el margen izquierdo del código para agregar breakpoints
- Los breakpoints funcionan en archivos `.jsx`, `.js`, y `.ts`
- Source maps están configurados para debugging preciso

### 3. **Error Tracking en Desarrollo**
```javascript
// En DevTools Console:
window.debugApp.getErrors()     // Ver errores capturados
window.errorTracker.captureException(new Error('Test'))  // Test manual

// En código:
import errorTracker from './utils/errorTracking'
errorTracker.captureException(error, { context: 'extra info' })
```

### 4. **Debug Panel (En Desarrollo)**
- Panel visual accesible desde la app
- Muestra errores en tiempo real
- Filtros por severidad y tipo
- Exportación de reportes JSON

## ⚡ Configuración de Source Maps

### `vite.config.js` Optimizado Para Debugging:
```javascript
build: {
  sourcemap: true,                    // Source maps habilitados
  minify: 'esbuild',                 // Minificación que preserva debugging
  rollupOptions: {
    output: {
      sourcemapExcludeSources: false  // Incluir fuentes en source maps
    }
  }
},
esbuild: {
  sourcemap: true,
  minifyIdentifiers: false,           // No minificar identificadores
  keepNames: true                     // Preservar nombres de funciones
}
```

## 🛠️ Herramientas de Debugging

### 1. **Console Enhanced**
```javascript
// Logging avanzado disponible
console.group('🐛 Debug Info')
console.table(data)
console.trace('Call stack')
console.time('Performance')
console.groupEnd()
```

### 2. **Performance Monitoring**
```javascript
// Captura issues de performance
errorTracker.capturePerformanceIssue('componentRender', 250, 100)
```

### 3. **Error Classification**
- **High**: TypeError, ReferenceError críticos
- **Medium**: Errores de componentes React
- **Low**: WebSocket, issues menores

## 🎯 Mejores Prácticas

### **En Desarrollo:**
1. Mantener DevTools abierto para ver errores
2. Usar `window.debugApp` para inspección rápida
3. Configurar breakpoints en código crítico
4. Revisar Error Tracker regularmente

### **Para Producción:**
1. Error tracking reporta automáticamente a servicio externo
2. Source maps disponibles para debugging post-mortem
3. Performance monitoring activo
4. Logging optimizado sin overhead

### **Debugging de Componentes React:**
1. Usar React Developer Tools extension
2. Breakpoints en lifecycle methods
3. Inspeccionar props y state en tiempo real
4. Error boundaries capturan errores de componente

## 📊 Monitoreo y Reportes

### Métricas Disponibles:
- Total de errores por tipo
- Errores recientes (24h)
- Fingerprinting para agrupar errores similares
- Context completo (URL, viewport, memoria, conexión)

### Exportación:
```json
{
  "errors": [...],
  "summary": {
    "total": 10,
    "byType": {"javascript": 5, "react": 3},
    "bySeverity": {"high": 2, "medium": 6, "low": 2}
  }
}
```

## 🔗 Enlaces Útiles

- [VS Code Debugging Guide](https://code.visualstudio.com/docs/editor/debugging)
- [Vite Debugging](https://vitejs.dev/guide/troubleshooting.html)
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

---

**✨ Configuración completada exitosamente. Happy debugging! 🚀**