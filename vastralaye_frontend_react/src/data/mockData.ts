
import { Product, User, Category, Coupon } from '../types';

export const categories: Category[] = [
  {
    id: '1',
    name: 'Men',
    slug: 'men',
    subcategories: [
      { id: '1-1', name: 'T-Shirts', slug: 'men-tshirts' },
      { id: '1-2', name: 'Shirts', slug: 'men-shirts' },
      { id: '1-3', name: 'Jeans', slug: 'men-jeans' },
      { id: '1-4', name: 'Trousers', slug: 'men-trousers' },
      { id: '1-5', name: 'Jackets', slug: 'men-jackets' },
    ]
  },
  {
    id: '2',
    name: 'Women',
    slug: 'women',
    subcategories: [
      { id: '2-1', name: 'Dresses', slug: 'women-dresses' },
      { id: '2-2', name: 'Tops', slug: 'women-tops' },
      { id: '2-3', name: 'Jeans', slug: 'women-jeans' },
      { id: '2-4', name: 'Skirts', slug: 'women-skirts' },
      { id: '2-5', name: 'Jackets', slug: 'women-jackets' },
    ]
  },
  {
    id: '3',
    name: 'Kids',
    slug: 'kids',
    subcategories: [
      { id: '3-1', name: 'Boys', slug: 'kids-boys' },
      { id: '3-2', name: 'Girls', slug: 'kids-girls' },
    ]
  },
  {
    id: '4',
    name: 'Accessories',
    slug: 'accessories',
    subcategories: [
      { id: '4-1', name: 'Bags', slug: 'accessories-bags' },
      { id: '4-2', name: 'Watches', slug: 'accessories-watches' },
      { id: '4-3', name: 'Jewelry', slug: 'accessories-jewelry' },
    ]
  }
];

export const products: Product[] = [
  {
    id: '1',
    name: 'Classic White T-Shirt',
    description: 'A timeless classic white t-shirt made from 100% organic cotton.',
    price: 699,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category: 'men',
    subcategory: 'men-tshirts',
    colors: ['white', 'black', 'gray'],
    sizes: ['S', 'M', 'L', 'XL'],
    in_stock: true,
    rating: 4.5,
    reviews: 128,
    featured: true,
    bestSeller: true,
    createdAt: '2023-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Slim Fit Jeans',
    description: 'Classic slim fit jeans with a modern twist. Perfect for any casual occasion.',
    price: 1499,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category: 'men',
    subcategory: 'men-jeans',
    colors: ['blue', 'black', 'gray'],
    sizes: ['30', '32', '34', '36'],
    in_stock: true,
    rating: 4.2,
    reviews: 95,
    createdAt: '2023-02-12T14:45:00Z'
  },
  {
    id: '3',
    name: 'Floral Summer Dress',
    description: 'Beautiful floral pattern dress perfect for summer days.',
    price: 1299,
    discountPrice: 999,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category: 'women',
    subcategory: 'women-dresses',
    colors: ['red', 'blue', 'green'],
    sizes: ['XS', 'S', 'M', 'L'],
    in_stock: true,
    rating: 4.8,
    reviews: 215,
    featured: true,
    newArrival: true,
    createdAt: '2023-03-05T09:15:00Z'
  },
  {
    id: '4',
    name: 'High-Waist Skinny Jeans',
    description: 'Modern high-waist skinny jeans with stretch comfort.',
    price: 1899,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category: 'women',
    subcategory: 'women-jeans',
    colors: ['blue', 'black'],
    sizes: ['26', '28', '30', '32'],
    in_stock: true,
    rating: 4.3,
    reviews: 167,
    bestSeller: true,
    createdAt: '2023-04-18T11:30:00Z'
  },
  {
    id: '5',
    name: 'Kids Dinosaur T-Shirt',
    description: 'Fun dinosaur printed t-shirt for kids who love adventure.',
    price: 499,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category: 'kids',
    subcategory: 'kids-boys',
    colors: ['green', 'blue', 'orange'],
    sizes: ['3-4Y', '5-6Y', '7-8Y'],
    in_stock: true,
    rating: 4.7,
    reviews: 89,
    createdAt: '2023-05-10T08:45:00Z'
  },
  {
    id: '6',
    name: 'Girls Party Dress',
    description: 'Elegant party dress for little princesses.',
    price: 999,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category: 'kids',
    subcategory: 'kids-girls',
    colors: ['pink', 'purple', 'white'],
    sizes: ['3-4Y', '5-6Y', '7-8Y'],
    in_stock: true,
    rating: 4.9,
    reviews: 76,
    featured: true,
    createdAt: '2023-06-01T15:20:00Z'
  },
  {
    id: '7',
    name: 'Leather Messenger Bag',
    description: 'Stylish leather messenger bag for work and casual use.',
    price: 2999,
    discountPrice: 2499,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category: 'accessories',
    subcategory: 'accessories-bags',
    colors: ['brown', 'black'],
    sizes: ['ONE SIZE'],
    in_stock: true,
    rating: 4.6,
    reviews: 104,
    createdAt: '2023-07-08T13:10:00Z'
  },
  {
    id: '8',
    name: 'Classic Analog Watch',
    description: 'Elegant analog watch with leather strap.',
    price: 1799,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category: 'accessories',
    subcategory: 'accessories-watches',
    colors: ['silver', 'gold', 'rose-gold'],
    sizes: ['ONE SIZE'],
    in_stock: true,
    rating: 4.4,
    reviews: 128,
    newArrival: true,
    bestSeller: true,
    createdAt: '2023-08-15T10:30:00Z'
  },
  {
    id: '9',
    name: 'Formal Business Shirt',
    description: 'Professional formal shirt for business meetings and office wear.',
    price: 1299,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category: 'men',
    subcategory: 'men-shirts',
    colors: ['white', 'blue', 'light-blue'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    in_stock: true,
    rating: 4.3,
    reviews: 85,
    createdAt: '2023-09-20T09:40:00Z'
  },
  {
    id: '10',
    name: 'Women\'s Casual Blouse',
    description: 'Lightweight casual blouse perfect for everyday wear.',
    price: 899,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category: 'women',
    subcategory: 'women-tops',
    colors: ['white', 'black', 'red', 'blue'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    in_stock: true,
    rating: 4.2,
    reviews: 112,
    newArrival: true,
    createdAt: '2023-10-05T14:15:00Z'
  },
  {
    id: '11',
    name: 'Winter Jacket',
    description: 'Warm winter jacket with faux fur hood.',
    price: 3499,
    discountPrice: 2999,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category: 'men',
    subcategory: 'men-jackets',
    colors: ['black', 'navy', 'olive'],
    sizes: ['S', 'M', 'L', 'XL'],
    in_stock: true,
    rating: 4.7,
    reviews: 142,
    featured: true,
    createdAt: '2023-11-10T11:25:00Z'
  },
  {
    id: '12',
    name: 'Midi Skirt',
    description: 'Elegant midi skirt for both casual and formal occasions.',
    price: 1199,
    images: ['/placeholder.svg', '/placeholder.svg'],
    category: 'women',
    subcategory: 'women-skirts',
    colors: ['black', 'navy', 'beige'],
    sizes: ['XS', 'S', 'M', 'L'],
    in_stock: true,
    rating: 4.4,
    reviews: 78,
    bestSeller: true,
    createdAt: '2023-12-18T13:50:00Z'
  }
];

export const users: User[] = [
  {
    id: '1',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@jokroup.com',
    password: 'admin123',
    role: 'admin',
    avatar: '/placeholder.svg',
    addresses: [
      {
        id: '1',
        name: 'Home',
        line1: '123 Admin Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        phone: '9876543210',
        default: true
      }
    ],
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'user',
    addresses: [
      {
        id: '2',
        name: 'Home',
        line1: '456 Main St',
        city: 'Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
        phone: '9876543211',
        default: true
      },
      {
        id: '3',
        name: 'Office',
        line1: '789 Work Ave',
        line2: 'Floor 5',
        city: 'Delhi',
        state: 'Delhi',
        postalCode: '110002',
        country: 'India',
        phone: '9876543212',
        default: false
      }
    ],
    createdAt: '2023-01-15T10:30:00Z'
  },
  {
    id: '3',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    password: 'password456',
    role: 'user',
    avatar: '/placeholder.svg',
    addresses: [
      {
        id: '4',
        name: 'Home',
        line1: '101 Residential Blvd',
        city: 'Bangalore',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
        phone: '9876543213',
        default: true
      }
    ],
    createdAt: '2023-02-20T15:45:00Z'
  }
];

export const coupons: Coupon[] = [
  {
    id: '1',
    code: 'WELCOME10',
    description: '10% off on your first order',
    discountType: 'percentage',
    discountValue: 10,
    minimumPurchase: 500,
    validFrom: '2023-01-01T00:00:00Z',
    validTo: '2025-12-31T23:59:59Z',
    maxUses: 1000,
    usedCount: 450,
    active: true
  },
  {
    id: '2',
    code: 'SUMMER2023',
    description: '15% off on summer collection',
    discountType: 'percentage',
    discountValue: 15,
    minimumPurchase: 1000,
    validFrom: '2023-04-01T00:00:00Z',
    validTo: '2023-06-30T23:59:59Z',
    maxUses: 500,
    usedCount: 320,
    active: false
  },
  {
    id: '3',
    code: 'FLAT200',
    description: 'Flat ₹200 off on orders above ₹2000',
    discountType: 'fixed',
    discountValue: 200,
    minimumPurchase: 2000,
    validFrom: '2023-03-15T00:00:00Z',
    validTo: '2025-03-15T23:59:59Z',
    usedCount: 180,
    active: true
  }
];
