import { getProviders } from './providers';
import type { AssistantMessage } from '@/lib/groq/assistant';

// Índice del último proveedor usado — round-robin entre los disponibles
let currentIndex = 0;

export async function chatWithRotation(
  systemPrompt: string,
  messages: AssistantMessage[],
): Promise<{ message: string; provider: string }> {
  const providers = getProviders();

  // Intentar desde el proveedor actual, rotar si falla
  for (let attempt = 0; attempt < providers.length; attempt++) {
    const idx = (currentIndex + attempt) % providers.length;
    const provider = providers[idx];

    try {
      const message = await provider.chat(systemPrompt, messages);
      if (!message) throw new Error('Respuesta vacía');

      // Avanzar índice para el próximo request (round-robin)
      currentIndex = (idx + 1) % providers.length;

      return { message, provider: provider.name };
    } catch (err) {
      console.warn(`[ai/rotate] ${provider.name} falló (intento ${attempt + 1}/${providers.length}):`, err);
    }
  }

  throw new Error('Todos los proveedores de IA fallaron.');
}
