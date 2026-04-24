type ToastFn = (toast: {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}) => void

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error
  }

  return fallback
}

export function showErrorToast(toast: ToastFn, error: unknown, fallback: string) {
  toast({
    title: 'Error',
    description: getErrorMessage(error, fallback),
    variant: 'destructive',
  })
}