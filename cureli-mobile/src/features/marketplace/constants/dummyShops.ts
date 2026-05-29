export interface DummyShop {
  shopId: string;
  name: string;
  tagline: string;
  area: string;
  category: string;
  rating: number;
  isOpen: boolean;
  deliveryTime: string;
}

export const DUMMY_SHOPS: DummyShop[] = [
  {
    shopId: "shop_001",
    name: "Apollo Pharmacy",
    tagline: "Trusted healthcare at your doorstep",
    area: "Kakkanad",
    category: "General Pharmacy",
    rating: 4.5,
    isOpen: true,
    deliveryTime: "20–30 min",
  },
  {
    shopId: "shop_002",
    name: "MedPlus",
    tagline: "More medicines, more savings",
    area: "Edapally",
    category: "General Pharmacy",
    rating: 4.2,
    isOpen: true,
    deliveryTime: "25–35 min",
  },
  {
    shopId: "shop_003",
    name: "Oushadhi Medicals",
    tagline: "Kerala government certified medicines",
    area: "Ernakulam",
    category: "Ayurvedic & General",
    rating: 4.6,
    isOpen: true,
    deliveryTime: "30–45 min",
  },
  {
    shopId: "shop_004",
    name: "Sree Pharmacy",
    tagline: "Your neighbourhood health partner",
    area: "Vytilla",
    category: "General Pharmacy",
    rating: 4.1,
    isOpen: false,
    deliveryTime: "35–50 min",
  },
  {
    shopId: "shop_005",
    name: "Kerala Ayurveda Pharmacy",
    tagline: "Authentic Ayurvedic medicines & wellness",
    area: "Fort Kochi",
    category: "Ayurvedic",
    rating: 4.7,
    isOpen: true,
    deliveryTime: "40–55 min",
  },
  {
    shopId: "shop_006",
    name: "City Medicals",
    tagline: "Fast delivery across Kochi",
    area: "Palarivattom",
    category: "General Pharmacy",
    rating: 4.0,
    isOpen: true,
    deliveryTime: "20–30 min",
  },
  {
    shopId: "shop_007",
    name: "Aluva Medical Store",
    tagline: "Serving Aluva families since 1998",
    area: "Aluva",
    category: "General Pharmacy",
    rating: 4.3,
    isOpen: false,
    deliveryTime: "45–60 min",
  },
  {
    shopId: "shop_008",
    name: "Thrippunithura Pharmacy",
    tagline: "Quality medicines at fair prices",
    area: "Thrippunithura",
    category: "General Pharmacy",
    rating: 4.4,
    isOpen: true,
    deliveryTime: "30–40 min",
  },
  {
    shopId: "shop_009",
    name: "LifeCare Medicals",
    tagline: "Complete healthcare solutions",
    area: "Kakkanad",
    category: "General & Surgical",
    rating: 4.2,
    isOpen: true,
    deliveryTime: "25–35 min",
  },
  {
    shopId: "shop_010",
    name: "Green Leaf Ayurveda",
    tagline: "Nature's best, delivered to you",
    area: "Edapally",
    category: "Ayurvedic",
    rating: 4.5,
    isOpen: true,
    deliveryTime: "35–50 min",
  },
];

// ── Search helper ─────────────────────────────────────────────
// Matches against name, area, category, tagline.
// Case-insensitive substring match on all fields.

export function searchShops(query: string): DummyShop[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return DUMMY_SHOPS.filter(
    (shop) =>
      shop.name.toLowerCase().includes(q) ||
      shop.area.toLowerCase().includes(q) ||
      shop.category.toLowerCase().includes(q) ||
      shop.tagline.toLowerCase().includes(q),
  );
}