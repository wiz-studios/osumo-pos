"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ShoppingCart, Circle, Edit } from "lucide-react"
import Image from "next/image"
import type { MenuItem } from "@/lib/types"

interface ModernMenuCardProps {
    item: MenuItem
    onClick: (item: MenuItem) => void
    isAdmin?: boolean
}

export function ModernMenuCard({ item, onClick, isAdmin = false }: ModernMenuCardProps) {
    return (
        <Card
            className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
            onClick={() => onClick(item)}
        >
            {/* Image Section with Badges */}
            <div className="relative w-full h-48 md:h-56 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                {item.image_url ? (
                    <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Circle className="h-16 w-16 opacity-20" />
                    </div>
                )}

                {/* Badge Overlays */}
                <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
                    {isAdmin && (
                        <div className={`px-2.5 py-1 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm ${item.available
                            ? 'bg-green-500/90 text-white'
                            : 'bg-gray-500/90 text-white'
                            }`}>
                            {item.available ? 'Available' : 'Unavailable'}
                        </div>
                    )}
                    {item.is_daily_special && (
                        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                            🔥 Daily Special
                        </div>
                    )}
                </div>

                {/* Prep Time Badge */}
                {item.prep_time_minutes > 0 && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium">
                        {item.prep_time_minutes}min
                    </div>
                )}
            </div>

            {/* Content Section */}
            <CardContent className="p-4 space-y-3">
                {/* Name and Price */}
                <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-lg leading-tight line-clamp-2">
                            {item.name}
                        </h3>
                    </div>
                    <span className="font-bold text-xl text-primary">
                        KES {item.price}
                    </span>
                </div>

                {/* Description */}
                {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.description}
                    </p>
                )}

                {/* Tags */}
                <div className="flex gap-1.5 flex-wrap">
                    {item.is_vegan && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            🌱 Vegan
                        </span>
                    )}
                    {item.is_spicy && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                            🌶️ Spicy
                        </span>
                    )}
                </div>

                {/* Action Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onClick(item)
                    }}
                    className={`w-full font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 text-sm whitespace-nowrap ${isAdmin
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200"
                        : "bg-primary hover:bg-primary/90 text-primary-foreground"
                        }`}
                >
                    {isAdmin ? (
                        <>
                            <Edit className="h-4 w-4" />
                            Edit Item
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="h-4 w-4" />
                            Add to Cart
                        </>
                    )}
                </button>
            </CardContent>
        </Card>
    )
}
