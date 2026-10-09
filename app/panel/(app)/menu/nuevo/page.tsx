import type { Metadata } from "next";
import Link from "next/link";
import { requirePanel } from "@/lib/auth";
import { getServerSupabase } from "@/lib/supabase/server";
import { PageShell, Card } from "@/components/panel/page-shell";
import { ProductForm } from "@/components/panel/menu-forms";

export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage({ searchParams }: PageProps<"/panel/menu/nuevo">) {
  const { business } = await requirePanel(["owner"]);
  const { categoria } = await searchParams;
  const supabase = await getServerSupabase();
  const { data: categories } = await supabase.from("categories").select("id, name").eq("business_id", business.id).order("sort_order");

  return (
    <PageShell title="Nuevo producto" description="Después de crearlo podrás agregarle opciones como término, tamaño o adiciones.">
      {categories?.length ? (
        <Card>
          <ProductForm categories={categories} defaultCategoryId={typeof categoria === "string" ? categoria : undefined} />
        </Card>
      ) : (
        <p>
          Primero crea una categoría en{" "}
          <Link href="/panel/menu" className="font-semibold underline">
            Menú
          </Link>
          .
        </p>
      )}
    </PageShell>
  );
}
