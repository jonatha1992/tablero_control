# /fix

Flujo para diagnosticar y corregir bugs.

## Proceso

1. **Diagnosticar**:
   - Leer el error completo
   - Identificar el archivo y línea afectada
   - Entender qué debería hacer vs. qué hace

2. **Verificar contexto** con agente `architect` si el bug involucra flujo de datos o estructura

3. **Corregir** con agente `codegen`:
   - Fix mínimo — no refactorizar código no relacionado
   - Mantener convenciones del proyecto

4. **Firebase** con agente `firebase` si el bug es de query/rules/índices

5. **Revisar** con agente `reviewer`:
   - El fix no introduce nuevos problemas
   - No rompe las convenciones

6. **Test** con agente `testing`:
   - Escribir test que reproduzca el bug
   - Verificar que el test pasa con el fix

## Uso

```
/fix [descripción del bug o error]
```

Ejemplo: `/fix las tareas no se actualizan en el kanban al hacer drag`
