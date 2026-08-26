/**
 * Heurísticas deterministas de intención.
 *
 * Regla del negocio: todo mensaje del usuario es una TAREA, un EVENTO o una CONSULTA.
 * Si el texto expresa que algo debe hacerse, el sistema decide solo — nunca pregunta
 * "¿es una tarea o un evento?". Estas funciones son la red de seguridad determinista
 * detrás de los prompts del LLM, que son probabilísticos.
 */

/** Frases que expresan intención/obligación: el usuario está pidiendo algo por hacer. */
export const INTENT_PATTERNS: RegExp[] = [
  /\bnecesito\b/i,
  /\bnecesitamos\b/i,
  /\btengo que\b/i,
  /\btenemos que\b/i,
  /\bhay que\b/i,
  /\bhabr[ií]a que\b/i,
  /\bme falta\b/i,
  /\bfalta\b/i,
  /\bdeber[ií]a\b/i,
  /\bquiero\b/i,
  /\bvoy a\b/i,
  /\bacordate de\b/i,
  /\bpendiente\b/i,
  /\bser[ií]a bueno\b/i,
  /\balguien tiene que\b/i,
  /\balguien deber[ií]a\b/i,
];

/** Prefijos de intención a recortar para que el título quede accionable. */
export const INTENT_PREFIX =
  /^\s*(?:y\s+)?(?:necesito|necesitamos|tengo que|tenemos que|hay que|habr[ií]a que|me falta|falta|deber[ií]a|quiero|voy a|acordate de|ser[ií]a bueno|alguien tiene que|alguien deber[ií]a)\s+/i;

/**
 * Señales de EVENTO: el núcleo es estar en un lugar o momento, no producir algo.
 * Desplazamiento/presencia primero, después sustantivos de agenda.
 */
const EVENT_PATTERNS: RegExp[] = [
  /\bir a\b/i,
  /\bir al\b/i,
  /\basistir\b/i,
  /\bpasar por\b/i,
  /\bacercar(?:me|se|nos)\b/i,
  /\bvisitar\b/i,
  /\bviajar\b/i,
  /\bjuntar(?:me|se|nos)\b/i,
  /\breunir(?:me|se|nos)\b/i,
  /\bpresentar(?:me|se|nos) en\b/i,
  /\breuni[óo]n\b/i,
  /\bcita\b/i,
  /\bturno\b/i,
  /\bexamen\b/i,
  /\bparcial\b/i,
  /\bentrevista\b/i,
  /\bcapacitaci[óo]n\b/i,
  /\baudiencia\b/i,
  /\bcharla\b/i,
  /\bevento\b/i,
];

/** Señales de TAREA: el núcleo es producir o resolver algo. */
const TASK_PATTERNS: RegExp[] = [
  /\bhacer\b/i,
  /\barmar\b/i,
  /\bescribir\b/i,
  /\bredactar\b/i,
  /\bmandar\b/i,
  /\benviar\b/i,
  /\brevisar\b/i,
  /\bcorregir\b/i,
  /\bcomprar\b/i,
  /\bcargar\b/i,
  /\bactualizar\b/i,
  /\bterminar\b/i,
  /\bpreparar\b/i,
  /\bel tema de\b/i,
  /\binforme\b/i,
];

/** True si el texto expresa algo por hacer (tarea o evento). */
export function hasActionIntent(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return INTENT_PATTERNS.some((re) => re.test(trimmed));
}

/**
 * Decide entre evento y tarea por el verbo núcleo.
 * Ante duda genuina devuelve 'task': el preview es reversible, preguntar no.
 */
export function classifyActionKind(text: string): 'event' | 'task' {
  const trimmed = text.trim();
  const eventHits = EVENT_PATTERNS.filter((re) => re.test(trimmed)).length;
  const taskHits = TASK_PATTERNS.filter((re) => re.test(trimmed)).length;
  return eventHits > taskHits ? 'event' : 'task';
}

/** Recorta el prefijo de intención y capitaliza. Devuelve un título accionable. */
export function buildActionTitle(text: string): string {
  const firstSentence = text.split(/[.\n]/)[0]?.trim() || text.trim();
  const stripped = firstSentence.replace(INTENT_PREFIX, '').trim();
  const base = stripped || firstSentence;
  return (base.charAt(0).toUpperCase() + base.slice(1)).slice(0, 120);
}
