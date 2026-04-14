# /review

Ejecuta una revisión completa del código modificado recientemente.

## Proceso

Usa el agente `reviewer` para revisar el código especificado o los últimos cambios.

Verifica:
- TypeScript correcto (sin `any`, tipos bien definidos)
- Convenciones Next.js/React (server vs client, no useEffect para fetch)
- Firebase correcto (client solo en 'use client', listeners con cleanup)
- Seguridad (no secrets en cliente, inputs sanitizados)
- Performance (no re-renders innecesarios)
- Estilo (cn(), path alias, orden de imports)

Reporta cada problema con severidad: CRÍTICO / IMPORTANTE / MEJORA

## Uso

```
/review [archivo o descripción de lo que revisar]
```

Ejemplo: `/review src/components/tareas/kanban-board.tsx`
