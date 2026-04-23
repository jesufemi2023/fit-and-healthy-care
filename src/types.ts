export interface Product {
  id: string;
  name: string;
  product_code: string;
  image_url: string;
  image_desc_url?: string;
  price_naira: number;
  discount_percent: number;
  short_desc: string;
  long_desc?: string;
  health_benefits: string[];
  package?: string;
  usage?: string;
  ingredients?: string;
  warning?: string;
  stock_quantity?: number;
  nafdac_no?: string;
}

export interface PackageData {
  id: string;
  name: string;
  description: string;
  price: number;
  discount: number;
  package_image_url?: string;
  health_benefits: string[];
  symptoms: string[];
  package_code?: string;
  is_combo?: boolean;
  products?: Product[];
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'pod' | 'transfer';

export interface Order {
  id: string;
  created_at: string;
  profile_id?: string;
  shipping_address?: string;
  landmark?: string;
  delivery_date?: string;
  delivery_date_type?: string;
  payment_method?: PaymentMethod;
  payment_receipt_url?: string;
  sender_name?: string;
  items?: any[];
  total_amount: number;
  status: OrderStatus;
  access_token: string;
  distributor_id?: string;
}

export interface Consultation {
  id: string;
  patient_name: string;
  phone: string;
  illness?: string;
  symptoms: string;
  ai_recommendation?: string;
  recommended_products: string[];
  created_at: string;
  distributor_id?: string;
  access_token: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug?: string;
  content: string;
  meta_description?: string;
  category?: string;
  tags: string[];
  image_url?: string;
  recommended_package_id?: string;
  recommended_package?: PackageData;
  created_at: string;
}
