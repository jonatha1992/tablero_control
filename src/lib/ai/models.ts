/**
 * Model names in one place, because a retired model breaks every feature that
 * hardcoded it and the error message blames the key, not the model.
 *
 * Verified against the live APIs on 2026-08-06 with the keys in use:
 *   - `gemini-2.5-flash` and `gemini-2.5-flash-lite` answer HTTP 404
 *     "This model is no longer available to new users".
 *   - The whole `gemini-2.0-*` family answers HTTP 429 with quota 0 on the
 *     free tier, which fails just as hard, only later.
 *   - The `-latest` aliases always resolve to a served model, so they do not
 *     rot on their own the way a pinned version does.
 */

// Medido contra la API real el 2026-08-06 con el prompt del planner (extracción
// de eventos a JSON), variando el techo de tokens:
//
//   modelo                     maxOutputTokens   resultado
//   gemini-flash-lite-latest         400         0.8-1.5 s   JSON OK
//   gemini-flash-lite-latest        2048         0.8 s       JSON OK
//   gemini-flash-latest              400         3.5 s       JSON TRUNCADO
//   gemini-flash-latest             2048         4.2 s       JSON OK
//
// El mecanismo: `gemini-flash-latest` razona antes de responder y esos tokens
// (`thoughtsTokenCount`, medido entre 383 y 652) se descuentan del **mismo**
// `maxOutputTokens`. Con techo 400 la respuesta vuelve con
// `finishReason: MAX_TOKENS` y 13 tokens de JSON — cortado. No lo arregla pedir
// `responseMimeType: application/json`, porque no es un problema de formato
// sino de presupuesto. Los modelos lite razonan 0 tokens.
//
// Regla: para JSON, usar lite; o un modelo que razone con techo >= 2048.
export const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL ?? 'gemini-flash-lite-latest';

// Visión: lite también gana. Leyó bien un PNG generado con texto ("OCR 42") en
// 4.2 s contra 6.0 s del flash completo, con el mismo resultado.
export const GEMINI_VISION_MODEL = process.env.GEMINI_VISION_MODEL ?? 'gemini-flash-lite-latest';

export const GROQ_TEXT_MODEL = process.env.GROQ_TEXT_MODEL ?? 'llama-3.3-70b-versatile';

// NVIDIA NIM. Verificados vivos el 2026-08-06.
//
// No hay `NVIDIA_VISION_MODEL` por gusto de simetría: es el único fallback de
// imagen que existe en toda la cadena, porque GroqCloud no sirve ningún modelo
// con entrada de imagen.
export const NVIDIA_TEXT_MODEL = process.env.NVIDIA_TEXT_MODEL ?? 'nvidia/nemotron-3-nano-30b-a3b';
export const NVIDIA_VISION_MODEL =
  process.env.NVIDIA_VISION_MODEL ?? 'nvidia/nemotron-nano-12b-v2-vl';
