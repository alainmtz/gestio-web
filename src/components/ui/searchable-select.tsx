import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { cn } from '@/lib/utils'
import { Input } from './input'

export interface SearchableSelectOption {
  id: string
  label: string
  [key: string]: any
}

interface SearchableSelectProps {
  value?: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
  defaultOpen?: boolean
}

const NONE_VALUE = '__none__'

function toInternal(v: string | undefined) {
  return v === '' || v === undefined ? NONE_VALUE : v
}

function fromInternal(v: string) {
  return v === NONE_VALUE ? '' : v
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'No se encontraron resultados',
  disabled,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [triggerRef, setTriggerRef] = useState<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) {
      setSearch('')
    }
  }, [open])

  // Normalise options: replace empty-string id with sentinel
  const internalOptions = options.map((o) => ({ ...o, id: toInternal(o.id) }))

  const filteredOptions = internalOptions.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  )

  const internalValue = toInternal(value)
  const selectedOption = internalOptions.find((o) => o.id === internalValue)

  return (
    <SelectPrimitive.Root
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      value={internalValue}
      onValueChange={(v) => onValueChange(fromInternal(v))}
    >
      <SelectPrimitive.Trigger
        ref={setTriggerRef}
        className={cn(
          'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder}>
          {selectedOption?.label || placeholder}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-background shadow-md"
          position="popper"
          sideOffset={4}
        >
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <SelectPrimitive.Viewport className="max-h-64 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <SelectPrimitive.Item
                  key={option.id}
                  value={option.id}
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      {option.id === internalValue && (
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 15 15"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.21183 11.3592 6.82408 11.4389 6.53518 11.2505L3.54483 9.14801C3.25128 8.95621 3.23988 8.52294 3.52599 8.32459C3.81209 8.12624 4.24576 8.11484 4.54678 8.30011L6.75292 9.90295L11.4669 3.72684Z"
                            fill="currentColor"
                          />
                        </svg>
                      )}
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            )}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}