export type StaticMenuItem = {
  code: string
  name: string
  description?: string
  priceKes: number
  isVegan?: boolean
  isSpicy?: boolean
  prepTimeMinutes?: number
  photoUrl?: string
  categoryCode: string
}

export type StaticMenuCategory = {
  code: string
  name: string
  displayOrder?: number
}

export const menuCategories: StaticMenuCategory[] = [
  { code: 'starters', name: 'Starters', displayOrder: 1 },
  { code: 'mains', name: 'Mains', displayOrder: 2 },
  { code: 'poultry', name: 'Poultry', displayOrder: 3 },
  { code: 'fish', name: 'Fish', displayOrder: 4 },
  // Add more as needed from reference
]

export const menuItems: StaticMenuItem[] = [
  {
    code: 'peanut-soup',
    name: 'Peanut Soup',
    description:
      'Locally harvested red peanuts blended with soy sauce, garlic, lime, coconut cream; served with garlic bread.',
    priceKes: 850,
    categoryCode: 'starters',
    photoUrl: 'https://www.amaica.co.ke/wp-content/uploads/2020/06/Peanut-Soup.jpg',
  },
  {
    code: 'ox-tail-soup',
    name: 'Ox-Tail Soup',
    priceKes: 650,
    categoryCode: 'starters',
    photoUrl: 'https://www.amaica.co.ke/wp-content/uploads/2020/06/Ox-tail-Soup.jpg',
  },
  {
    code: 'veggie-samosa',
    name: 'Vegetable Samosa',
    description:
      'Mixed vegetables, spring onion, ginger, garlic, dhania and leeks sautéed and stuffed in a thin folded dough.',
    priceKes: 300,
    categoryCode: 'starters',
    photoUrl: 'https://www.amaica.co.ke/wp-content/uploads/2020/06/Veg-Samosa.jpg',
  },
  {
    code: 'mbaazi-curry',
    name: 'Mbaazi (Pigeon Pea) Curry',
    description: 'Pigeon peas stewed in a coconut curry sauce.',
    priceKes: 1550,
    categoryCode: 'mains',
  },
  {
    code: 'ingokho',
    name: 'Ingokho (Kuku Kienyeji)',
    description:
      'Organic road-runner chicken on the bone, steamed; traditional Luhya delicacy.',
    priceKes: 1550,
    categoryCode: 'poultry',
    photoUrl: 'https://www.amaica.co.ke/wp-content/uploads/2020/06/Inghoko.jpg',
  },
  // Extend with more entries as desired
]

export function getItemsByCategory(categoryCode: string): StaticMenuItem[] {
  return menuItems.filter((i) => i.categoryCode === categoryCode)
}


