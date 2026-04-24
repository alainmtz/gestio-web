import { create } from 'zustand'

export interface CartItem {
  productId: string
  variantId?: string
  name: string
  sku?: string
  quantity: number
  unitPrice: number
  discount: number
}

export interface POSState {
  cartItems: CartItem[]
  selectedCustomerId: string | null
  selectedPaymentMethod: 'CASH' | 'CARD' | 'TRANSFER'
  isPaymentDialogOpen: boolean
  isCustomerDialogOpen: boolean
  searchTerm: string
  selectedCategoryId: string | null
}

export interface POSActions {
  addItem: (item: CartItem) => void
  updateItemQuantity: (productId: string, variantId: string | undefined, quantity: number) => void
  removeItem: (productId: string, variantId: string | undefined) => void
  clearCart: () => void
  setSelectedCustomer: (customerId: string | null) => void
  setPaymentMethod: (method: 'CASH' | 'CARD' | 'TRANSFER') => void
  setPaymentDialogOpen: (open: boolean) => void
  setCustomerDialogOpen: (open: boolean) => void
  setSearchTerm: (term: string) => void
  setSelectedCategory: (categoryId: string | null) => void
  getCartTotal: () => { subtotal: number; discount: number; total: number }
}

export const usePOSStore = create<POSState & POSActions>()((set, get) => ({
  cartItems: [],
  selectedCustomerId: null,
  selectedPaymentMethod: 'CASH',
  isPaymentDialogOpen: false,
  isCustomerDialogOpen: false,
  searchTerm: '',
  selectedCategoryId: null,

  addItem: (item) =>
    set((state) => {
      const existingIndex = state.cartItems.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId
      )
      if (existingIndex >= 0) {
        const newItems = [...state.cartItems]
        newItems[existingIndex].quantity += item.quantity
        return { cartItems: newItems }
      }
      return { cartItems: [...state.cartItems, item] }
    }),

  updateItemQuantity: (productId, variantId, quantity) =>
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item
      ),
    })),

  removeItem: (productId, variantId) =>
    set((state) => ({
      cartItems: state.cartItems.filter(
        (item) => !(item.productId === productId && item.variantId === variantId)
      ),
    })),

  clearCart: () => set({ cartItems: [], selectedCustomerId: null }),

  setSelectedCustomer: (customerId) => set({ selectedCustomerId: customerId }),
  setPaymentMethod: (method) => set({ selectedPaymentMethod: method }),
  setPaymentDialogOpen: (open) => set({ isPaymentDialogOpen: open }),
  setCustomerDialogOpen: (open) => set({ isCustomerDialogOpen: open }),
  setSearchTerm: (term) => set({ searchTerm: term }),
  setSelectedCategory: (categoryId) => set({ selectedCategoryId: categoryId }),

  getCartTotal: () => {
    const { cartItems } = get()
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    )
    const discount = cartItems.reduce(
      (sum, item) => sum + item.discount * item.quantity,
      0
    )
    return { subtotal, discount, total: subtotal - discount }
  },
}))
