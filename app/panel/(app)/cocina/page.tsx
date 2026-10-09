import type { Metadata } from "next";
import { requirePanel } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { fetchOrders } from "@/lib/data/orders";
import { ACTIVE_STATUSES } from "@/lib/orders/status";
import { KitchenBoard } from "@/components/panel/kitchen-board";

export const metadata: Metadata = { title: "Cocina" };

export default async function KitchenPage() {
  const { business, member } = await requirePanel(["owner", "chef", "waiter"]);
  const supabase = await getServerSupabase();
  const orders = await fetchOrders(supabase, business.id, { statuses: ACTIVE_STATUSES });

  return <KitchenBoard businessId={business.id} role={member.role} initialOrders={orders} />;
}
