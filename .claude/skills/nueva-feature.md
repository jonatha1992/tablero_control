# /nueva-feature

Flujo completo para implementar una nueva feature en el proyecto.

## Proceso

1. **Planificar** con el agente `architect`:
   - Identificar archivos a crear/modificar
   - Definir flujo de datos (Firestore → hook → store → componente)
   - Listar dependencias

2. **Implementar** con el agente `codegen`:
   - Crear/actualizar tipos en `src/types/`
   - Crear helpers Firebase en `src/lib/firebase/`
   - Crear hooks en `src/hooks/`
   - Crear/actualizar stores Zustand si se necesita
   - Crear componentes en `src/components/`
   - Crear/actualizar páginas en `src/app/`
   - Crear API routes si se necesitan

3. **UI** con el agente `ui` si hay componentes visuales complejos:
   - Revisar componentes disponibles en `src/components/ui/`
   - Reusar antes de crear nuevo

4. **Firebase** con el agente `firebase` si hay queries nuevas:
   - Verificar que las queries tienen índices
   - Actualizar reglas si hay nuevas colecciones/operaciones

5. **Tests** con el agente `testing`:
   - Tests de componentes nuevos
   - Tests de hooks
   - Tests de reglas Firestore si se modificaron

6. **Revisar** con el agente `reviewer`:
   - Ejecutar checklist completo sobre el código generado

## Uso

```
/nueva-feature [descripción de la feature]
```

Ejemplo: `/nueva-feature módulo de reportes con exportación PDF`
