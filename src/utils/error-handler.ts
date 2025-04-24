import { toast } from 'sonner';

export function handleError(error: unknown, message: string) {
  console.error(message, error);
  toast.error(message);
  throw error;
}

export function handleSuccess(message: string) {
  toast.success(message);
} 