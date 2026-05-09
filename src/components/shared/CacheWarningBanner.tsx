import { useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, RefreshCw, X } from 'lucide-react'

interface CacheWarning {
  queryHash: string
  error: Error
}

export function CacheWarningBanner() {
  const queryClient = useQueryClient()
  const [warnings, setWarnings] = useState<CacheWarning[]>([])

  useEffect(() => {
    function scanQueries() {
      const allQueries = queryClient.getQueryCache().getAll()
      const fallbacks: CacheWarning[] = []

      for (const query of allQueries) {
        const state = query.state
        if (state.error && state.data !== undefined && state.fetchStatus !== 'fetching') {
          fallbacks.push({
            queryHash: query.queryHash,
            error: state.error as Error,
          })
        }
      }

      setWarnings((prev) => {
        const prevHashes = new Set(prev.map((w) => w.queryHash))
        const merged = [...prev]
        for (const fb of fallbacks) {
          if (!prevHashes.has(fb.queryHash)) {
            merged.push(fb)
          }
        }
        return merged
      })
    }

    scanQueries()

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated') {
        const state = event.query.state

        const isFallback = state.error && state.data !== undefined && state.fetchStatus !== 'fetching'
        if (isFallback) {
          setWarnings((prev) => {
            if (prev.some((w) => w.queryHash === event.query.queryHash)) return prev
            return [...prev, { queryHash: event.query.queryHash, error: state.error as Error }]
          })
        } else {
          setWarnings((prev) => prev.filter((w) => w.queryHash !== event.query.queryHash))
        }
      }
    })

    return unsubscribe
  }, [queryClient])

  const retry = useCallback(
    (queryHash: string) => {
      const query = queryClient.getQueryCache().get(queryHash)
      if (query) query.fetch()
    },
    [queryClient],
  )

  if (warnings.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {warnings.map((warning) => (
        <div
          key={warning.queryHash}
          className="rounded-lg border border-amber-200 bg-amber-50 p-3 shadow-lg"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">Datos en caché</p>
              <p className="text-xs text-amber-700 mt-0.5 line-clamp-2 leading-relaxed">
                {warning.error.message}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => retry(warning.queryHash)}
                className="rounded p-1 text-amber-600 hover:bg-amber-100 transition-colors"
                title="Reintentar"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() =>
                  setWarnings((prev) => prev.filter((w) => w.queryHash !== warning.queryHash))
                }
                className="rounded p-1 text-amber-600 hover:bg-amber-100 transition-colors"
                title="Descartar"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
