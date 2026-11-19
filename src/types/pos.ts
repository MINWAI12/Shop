export type SizeKey = 'S' | 'M' | 'L' | 'XL' | 'Free';

export const SIZES: SizeKey[] = ['S', 'M', 'L', 'XL', 'Free'];

export type CategoryKey = 'tops' | 'bottoms' | 'outerwear';

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  tops: 'အင်္ကျီ',
  bottoms: 'ဘောင်းဘီ / စကတ်',
  outerwear: 'အပေါ်ဝတ်',
};

export type PaymentMethod = 'cash' | 'kbzpay' | 'wavepay' | 'card';

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'ငွေသား (Cash)',
  kbzpay: 'KBZPay',
  wavepay: 'WavePay',
  card: 'ဘဏ်ကတ် (Card)',
};

export type DiscountType = 'percent' | 'fixed';

export type TabKey = 'register' | 'inventory' | 'history' | 'settings';

export type SizeStock = Record<SizeKey, number>;

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: CategoryKey;
  price: number;
  cost: number;
  image: string;
  stock: SizeStock;
}

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  size: SizeKey;
  price: number;
  cost: number;
  quantity: number;
  image: string;
}

export interface HeldOrder {
  id: string;
  createdAt: string;
  customerName: string;
  note: string;
  discountType: DiscountType;
  discountValue: number;
  items: CartItem[];
}

export interface SaleItem {
  productId: string;
  sku: string;
  name: string;
  size: SizeKey;
  price: number;
  cost: number;
  quantity: number;
}

export interface SaleRecord {
  id: string;
  receiptNo: string;
  createdAt: string;
  items: SaleItem[];
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  totalCost: number;
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  changeDue?: number;
  customerName: string;
  note: string;
  status: 'completed' | 'voided';
  voidedAt?: string;
}

export interface StoreSettings {
  storeName: string;
  address: string;
  phone: string;
  taxRate: number;
  receiptFooter: string;
}
