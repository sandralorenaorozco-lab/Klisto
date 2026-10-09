import type { MemberRole, OrderStatus } from "@/lib/orders/status";

export type BusinessType = "restaurant" | "services";
export type SubscriptionStatus = "trial" | "active" | "suspended";
export type PlanTier = "basico" | "pro" | "premium";

export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type DayHours = { open: string; close: string; closed?: boolean };
export type OpeningHours = Partial<Record<DayKey, DayHours>>;

export type PublicBusiness = {
  id: string;
  slug: string;
  name: string;
  business_type: BusinessType;
  logo_url: string | null;
  primary_color: string;
  phone: string | null;
  address: string | null;
  opening_hours: OpeningHours;
  timezone: string;
  accepting_orders: boolean;
  available: boolean;
};

export type Business = Omit<PublicBusiness, "available"> & {
  plan: PlanTier;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string | null;
  created_at: string;
};

export type ModifierOption = {
  id: string;
  group_id: string;
  name: string;
  price_delta: number;
  is_available: boolean;
  sort_order: number;
};

export type ModifierGroup = {
  id: string;
  product_id: string;
  name: string;
  min_select: number;
  max_select: number;
  sort_order: number;
  options: ModifierOption[];
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  sort_order: number;
  modifier_groups: ModifierGroup[];
};

export type Category = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  products: Product[];
};

export type OrderItemModifier = { group: string; option: string; price_delta: number };

export type OrderItem = {
  id?: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  modifiers: OrderItemModifier[];
  notes: string | null;
};

export type Order = {
  id: string;
  business_id: string;
  code: string;
  daily_number: number;
  order_date: string;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
  status: OrderStatus;
  total: number;
  payment_method: "pay_at_pickup" | "wompi";
  payment_status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
  ready_at: string | null;
  order_items: OrderItem[];
};

export type TrackedOrder = {
  code: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone_last4: string;
  notes: string | null;
  total: number;
  payment_method: "pay_at_pickup" | "wompi";
  payment_status: string;
  created_at: string;
  preparing_at: string | null;
  packing_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  items: OrderItem[];
  business: {
    slug: string;
    name: string;
    logo_url: string | null;
    primary_color: string;
    phone: string | null;
    address: string | null;
  };
};

export type Member = {
  id: string;
  business_id: string;
  user_id: string;
  role: MemberRole;
  display_name: string;
  username: string | null;
  is_active: boolean;
};
