# /test-feature

Crea tests completos para una feature o componente.

## Proceso

Usa el agente `testing` para:

1. Identificar qué necesita tests (componentes, hooks, rules, API routes)
2. Crear tests de componente con Testing Library
3. Crear tests de hooks con renderHook
4. Crear tests de reglas Firestore con Firebase Emulator si aplica
5. Verificar que todos los casos del checklist están cubiertos

Ejecutar con: `npm run test:run`

## Uso

```
/test-feature [feature o componente a testear]
```

Ejemplo: `/test-feature módulo de tareas — kanban y drag & drop`
