# Cambios

## 0.1.43

- Build Docker: cinco reintentos acotados para descargas npm tras el timeout del evento 613.
- El build recibe el SHA del desplegador, sin depender de Git dentro de Alpine.
- Las reconstrucciones Docker conservan la versión de la release y actualizan sus metadatos.
- Prueba de regresión de metadatos sin Git.
