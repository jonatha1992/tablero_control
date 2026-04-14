# Agentes de Desarrollo

Esta carpeta contenía originalmente agentes de IA, pero se ha reorganizado.

Los **agentes de IA para asistir el desarrollo** ahora viven en la raíz del proyecto como archivos `.agent-*.md`:

- **`.agent-architect.md`**: Define la arquitectura, estructura y decisiones de diseño del proyecto.
- **`.agent-codegen.md`**: Define patrones de código, convenciones y templates para generación de código.
- **`.agent-testing.md`**: Define estrategias, patrones y casos de testing.

Estos agentes son **guias para Qwen Code y Claude** — no son parte de la aplicación en sí.

## Agentes que implementará la aplicación

La aplicación tendrá su propio sistema de IA para:
- Generar resúmenes ejecutivos del dashboard
- Crear reportes automáticos
- Detectar alertas y anomalías
- Sugerir planificación
- Analizar tendencias
- Clasificar tareas automáticamente

Estos se implementarán como **API routes** que llaman a un servicio de IA externo (OpenAI u otro), no como agentes embebidos en el frontend.
