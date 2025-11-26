# Age Verification Fix - Blocking Confirmation

Replace the `addToCart` function in `app/dashboard/pos/page.tsx` (line 172) with:

```typescript
const addToCart = (item: MenuItem, quantity: number, notes: string) => {
    // Age Verification - Block if not confirmed
    if (item.requires_id === true) {
        const confirmed = window.confirm(
            `⚠️ AGE VERIFICATION\n\n` +
            `Customer must be 18+\n\n` +
            `Have you verified ID?\n\n` +
            `OK = Add to cart | Cancel = Don't add`
        )
        
        if (!confirmed) {
            toast({
                title: "Item Not Added",
                description: "Age verification not confirmed.",
                variant: "destructive",
            })
            return
        }
    }

    const cartItemId = `${item.id}-${notes}`
    setCart(prev => {
        const existing = prev.find(i => i.id === cartItemId)
        if (existing) {
            return prev.map(i => i.id === cartItemId ? { ...i, quantity: i.quantity + quantity } : i)
        }
        return [...prev, { menuItem: item, quantity, notes, id: cartItemId }]
    })
}
```

This BLOCKS adding beer until staff confirms ID check.
