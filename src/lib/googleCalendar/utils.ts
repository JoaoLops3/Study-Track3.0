export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error: any) {
      retries++;
      
      if (retries > maxRetries) {
        throw error;
      }

      // Se for erro 403 ou 429, não tentar novamente
      if (error.status === 403 || error.status === 429) {
        throw error;
      }

      console.log(`Tentativa ${retries} falhou, tentando novamente em ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Dobrar o delay para a próxima tentativa
    }
  }
} 