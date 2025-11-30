import type { MenuItem } from "@/lib/types"

// Keywords that indicate a food item (not a drink)
const FOOD_KEYWORDS = ["beef", "stew", "nyama", "chicken", "goat", "fish", "meat", "ugali", "chapati", "rice", "mukimo"]

// Keywords that indicate a drink item
const DRINK_KEYWORDS = ["drink", "soda", "juice", "tea", "coffee", "water", "beer", "wine", "cocktail", "smoothie", "milkshake", "coke", "pepsi", "fanta", "sprite", "stoney", "tusker", "white cap"]

// Categories that are drinks
const DRINK_CATEGORIES = ["drinks", "beverages", "beers", "sodas", "juices", "teas", "coffees", "wines", "spirits"]

/**
 * Checks if an item is a food item (not a drink)
 */
export function isFoodItem(item: MenuItem): boolean {
    const itemName = item.name.toLowerCase()
    const hasDrinkKeyword = DRINK_KEYWORDS.some(keyword => itemName.includes(keyword))

    if (hasDrinkKeyword) return false

    return FOOD_KEYWORDS.some(keyword => itemName.includes(keyword))
}

/**
 * Checks if an item is a drink
 */
export function isDrinkItem(item: MenuItem, categories: { id: string; name: string }[]): boolean {
    const itemName = item.name.toLowerCase()

    // Check if item name contains drink keywords
    if (DRINK_KEYWORDS.some(keyword => itemName.includes(keyword))) {
        return true
    }

    // Check if item is in a drink category
    const itemCategory = categories.find(cat => cat.id === item.category_id)
    if (itemCategory) {
        const categoryName = itemCategory.name.toLowerCase()
        if (DRINK_CATEGORIES.some(drinkCat => categoryName.includes(drinkCat))) {
            return true
        }
    }

    return false
}

interface DrinkSuggestion {
    name: string
    price: number
    icon: string
    menuItem?: MenuItem
}

/**
 * Default drink suggestions for Kenyan market
 */
const KENYAN_DRINK_SUGGESTIONS: DrinkSuggestion[] = [
    {
        name: "Stoney Tangawizi",
        price: 120,
        icon: "🥤",
    },
    {
        name: "Coca-Cola 500ml",
        price: 100,
        icon: "🥤",
    },
    {
        name: "Tusker Lager",
        price: 250,
        icon: "🍺",
    }
]

/**
 * Gets drink suggestions based on the menu items available
 * Falls back to default suggestions if no drinks found in menu
 */
export function getDrinkSuggestions(items: MenuItem[], maxSuggestions: number = 2): DrinkSuggestion[] {
    // Try to find actual drinks from the menu
    const drinks = items.filter(item => {
        const name = item.name.toLowerCase()
        return name.includes("stoney") ||
            name.includes("coca-cola") ||
            name.includes("coke") ||
            name.includes("tusker") ||
            name.includes("soda") ||
            name.includes("tangawizi")
    })

    if (drinks.length > 0) {
        // Return up to maxSuggestions drinks from menu
        return drinks.slice(0, maxSuggestions).map(drink => ({
            name: drink.name,
            price: drink.price,
            icon: "🥤",
            menuItem: drink
        }))
    }

    // Fallback to default suggestions
    return KENYAN_DRINK_SUGGESTIONS.slice(0, maxSuggestions)
}
