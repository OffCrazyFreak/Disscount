export interface Product {
  id: number;
  name: string;
  category: string;
  brand: string;
  quantity: string;
  averagePrice: number;
  image: string;
}

export const mockProducts: Product[] = [
  {
    id: 1,
    name: "Afrodita Sun Care  mlijekoš ZF30 200ml OS",
    category: "Piće",
    brand: "Vindija",
    quantity: "1L",
    averagePrice: 1.35,
    image: "/placeholder-product.jpg",
  },
  {
    id: 2,
    name: "Kruh integral",
    category: "Pekarski proizvodi",
    brand: "Klara",
    quantity: "500g",
    averagePrice: 0.85,
    image: "/placeholder-product.jpg",
  },
  {
    id: 3,
    name: "Jogurt prirodni",
    category: "Mliječni proizvodi",
    brand: "Dukat",
    quantity: "180g",
    averagePrice: 0.65,
    image: "/placeholder-product.jpg",
  },
  {
    id: 4,
    name: "Štap za šetnju",
    category: "Sport",
    brand: "Decathlon",
    quantity: "1kom",
    averagePrice: 15.99,
    image: "/placeholder-product.jpg",
  },
  {
    id: 5,
    name: "Stap za pecanje",
    category: "Šport",
    brand: "Shimano",
    quantity: "1kom",
    averagePrice: 89.99,
    image: "/placeholder-product.jpg",
  },
];
