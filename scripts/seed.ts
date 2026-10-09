/**
 * Datos de prueba: restaurante "Klisto Burger" (slug "demo").
 * Uso:  npm run seed
 *
 * Crea (o recrea) el negocio demo con categorías, 10 productos con
 * modificadores, el equipo (dueño, chef y mesero) y pedidos en distintos
 * estados. Si defines SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD, también crea
 * tu usuario de superadministrador.
 *
 * Es seguro ejecutarlo varias veces: borra y vuelve a crear el negocio demo.
 */
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildOrderCode } from "../lib/orders/code";
import { staffEmail } from "../lib/staff";
import { DATA_POLICY_VERSION } from "../lib/validation";

config({ path: ".env.local" });
config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !secret) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local");
  process.exit(1);
}

const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

const SLUG = "demo";
const OWNER_EMAIL = process.env.SEED_DEMO_OWNER_EMAIL ?? "demo@klisto.co";
const OWNER_PASSWORD = process.env.SEED_DEMO_OWNER_PASSWORD ?? "KlistoDemo2026";
const STAFF = [
  { role: "chef" as const, display_name: "Carlos Chef", username: "chef", document: "1012345678" },
  { role: "waiter" as const, display_name: "Mariana Mesera", username: "mesero", document: "1098765432" },
];

type Opt = { name: string; price_delta?: number };
type Group = { name: string; min: number; max: number; options: Opt[] };
type Prod = { name: string; description: string; price: number; available?: boolean; groups?: Group[] };

const TERMINO: Group = {
  name: "Término de la carne",
  min: 1,
  max: 1,
  options: [{ name: "Medio" }, { name: "Tres cuartos" }, { name: "Bien asado" }],
};
const ADICIONES: Group = {
  name: "Adiciones",
  min: 0,
  max: 4,
  options: [
    { name: "Tocineta", price_delta: 4000 },
    { name: "Queso cheddar extra", price_delta: 3000 },
    { name: "Huevo frito", price_delta: 2500 },
    { name: "Jalapeños", price_delta: 2000 },
  ],
};
const SALSAS: Group = {
  name: "Salsas",
  min: 0,
  max: 3,
  options: [{ name: "De la casa" }, { name: "Tártara" }, { name: "BBQ" }, { name: "Piña" }],
};

const MENU: { category: string; products: Prod[] }[] = [
  {
    category: "Hamburguesas",
    products: [
      {
        name: "Klisto Clásica",
        description: "Carne de res 150 g, queso cheddar, lechuga, tomate y salsa de la casa en pan brioche.",
        price: 22900,
        groups: [TERMINO, ADICIONES],
      },
      {
        name: "Doble Smash",
        description: "Dos carnes smash de 100 g, doble cheddar, cebolla caramelizada y pepinillos.",
        price: 28900,
        groups: [TERMINO, ADICIONES],
      },
      {
        name: "Pollo Crispy",
        description: "Pechuga apanada crocante, ensalada de repollo, miel mostaza y queso.",
        price: 24500,
        groups: [ADICIONES],
      },
      {
        name: "Veggie de Garbanzo",
        description: "Medallón de garbanzo y quinua, aguacate, tomate y alioli de cilantro.",
        price: 23500,
        groups: [ADICIONES],
      },
    ],
  },
  {
    category: "Perros y sándwiches",
    products: [
      {
        name: "Perro Klisto",
        description: "Salchicha americana, papita ripio, queso costeño rallado y huevo de codorniz.",
        price: 16900,
        groups: [SALSAS],
      },
      {
        name: "Sándwich Cubano",
        description: "Cerdo desmechado, jamón, queso suizo y pepinillos en pan crujiente.",
        price: 21900,
        available: false, // aparece como "Agotado" en la demo
      },
    ],
  },
  {
    category: "Acompañamientos",
    products: [
      {
        name: "Papas a la francesa",
        description: "Papas crocantes con sal marina.",
        price: 7900,
        groups: [
          {
            name: "Tamaño",
            min: 1,
            max: 1,
            options: [{ name: "Personal" }, { name: "Para compartir", price_delta: 5000 }],
          },
          SALSAS,
        ],
      },
      {
        name: "Aros de cebolla",
        description: "Ocho aros apanados con salsa BBQ.",
        price: 9500,
      },
    ],
  },
  {
    category: "Bebidas",
    products: [
      {
        name: "Limonada de coco",
        description: "Limonada natural granizada con crema de coco.",
        price: 9900,
        groups: [
          {
            name: "Dulce",
            min: 1,
            max: 1,
            options: [{ name: "Normal" }, { name: "Poca azúcar" }, { name: "Sin azúcar" }],
          },
        ],
      },
      {
        name: "Gaseosa 400 ml",
        description: "Coca-Cola, Coca-Cola sin azúcar, Sprite o Quatro.",
        price: 5500,
        groups: [
          {
            name: "Sabor",
            min: 1,
            max: 1,
            options: [
              { name: "Coca-Cola" },
              { name: "Coca-Cola sin azúcar" },
              { name: "Sprite" },
              { name: "Quatro" },
            ],
          },
        ],
      },
    ],
  },
];

// Sin horario: el demo de la landing debe aceptar pedidos a cualquier hora.
// (En Configuración del panel se puede definir un horario real.)
const HOURS = {};

function check<T>(label: string, result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function ensureUser(client: SupabaseClient, email: string, password: string, name: string) {
  const created = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: name },
  });
  if (!created.error) return created.data.user.id;

  // Ya existe: buscarlo y actualizar la contraseña.
  for (let page = 1; page < 50; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const user = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      await client.auth.admin.updateUserById(user.id, { password });
      return user.id;
    }
    if (data.users.length < 200) break;
  }
  throw new Error(`No se pudo crear ni encontrar el usuario ${email}: ${created.error.message}`);
}

function bogotaDate(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(d);
}

async function main() {
  console.log("→ Borrando el negocio demo anterior (si existe)…");
  check("borrar demo", await db.from("businesses").delete().eq("slug", SLUG));

  console.log("→ Creando Klisto Burger…");
  const business = check(
    "crear negocio",
    await db
      .from("businesses")
      .insert({
        slug: SLUG,
        name: "Klisto Burger",
        business_type: "restaurant",
        primary_color: "#FF6A2B",
        phone: "3001234567",
        address: "Cra. 7 # 45-12, Chapinero, Bogotá",
        opening_hours: HOURS,
        plan: "pro",
        subscription_status: "active",
        trial_ends_at: null,
      })
      .select("id")
      .single(),
  ) as { id: string };

  console.log("→ Creando el equipo…");
  const ownerId = await ensureUser(db, OWNER_EMAIL, OWNER_PASSWORD, "Dueña Demo");
  // Un usuario solo puede pertenecer a un negocio.
  check("limpiar membresías", await db.from("business_members").delete().eq("user_id", ownerId));
  check(
    "dueño",
    await db.from("business_members").insert({
      business_id: business.id,
      user_id: ownerId,
      role: "owner",
      display_name: "Dueña Demo",
    }),
  );
  for (const s of STAFF) {
    const id = await ensureUser(db, staffEmail(SLUG, s.username), s.document, s.display_name);
    check("limpiar membresías", await db.from("business_members").delete().eq("user_id", id));
    check(
      s.username,
      await db.from("business_members").insert({
        business_id: business.id,
        user_id: id,
        role: s.role,
        display_name: s.display_name,
        username: s.username,
      }),
    );
  }

  console.log("→ Cargando el menú…");
  const productIds: Record<string, { id: string; price: number; groups: { name: string; options: { id: string; name: string; price_delta: number }[] }[] }> = {};
  for (const [ci, cat] of MENU.entries()) {
    const category = check(
      "categoría",
      await db.from("categories").insert({ business_id: business.id, name: cat.category, sort_order: ci }).select("id").single(),
    ) as { id: string };

    for (const [pi, p] of cat.products.entries()) {
      const product = check(
        "producto",
        await db
          .from("products")
          .insert({
            business_id: business.id,
            category_id: category.id,
            name: p.name,
            description: p.description,
            price: p.price,
            is_available: p.available ?? true,
            sort_order: pi,
          })
          .select("id")
          .single(),
      ) as { id: string };
      productIds[p.name] = { id: product.id, price: p.price, groups: [] };

      for (const [gi, g] of (p.groups ?? []).entries()) {
        const group = check(
          "grupo",
          await db
            .from("modifier_groups")
            .insert({
              business_id: business.id,
              product_id: product.id,
              name: g.name,
              min_select: g.min,
              max_select: g.max,
              sort_order: gi,
            })
            .select("id")
            .single(),
        ) as { id: string };
        const options = check(
          "opciones",
          await db
            .from("modifier_options")
            .insert(
              g.options.map((o, oi) => ({
                business_id: business.id,
                group_id: group.id,
                name: o.name,
                price_delta: o.price_delta ?? 0,
                sort_order: oi,
              })),
            )
            .select("id, name, price_delta"),
        ) as { id: string; name: string; price_delta: number }[];
        productIds[p.name].groups.push({ name: g.name, options });
      }
    }
  }

  console.log("→ Creando pedidos de ejemplo…");
  type Line = { product: string; qty: number; options?: string[]; notes?: string };
  const pick = (line: Line) => {
    const p = productIds[line.product];
    const mods = p.groups.flatMap((g) =>
      g.options.filter((o) => line.options?.includes(o.name)).map((o) => ({ group: g.name, option: o.name, price_delta: o.price_delta })),
    );
    const unit = p.price + mods.reduce((a, m) => a + m.price_delta, 0);
    return {
      product_id: p.id,
      product_name: line.product,
      unit_price: unit,
      quantity: line.qty,
      modifiers: mods,
      notes: line.notes ?? null,
      line_total: unit * line.qty,
    };
  };

  const FLOW = ["preparing", "packing", "ready", "delivered"] as const;
  type Status = "received" | (typeof FLOW)[number] | "cancelled";

  const sample: { name: string; phone: string; daysAgo: number; minutesAgo: number; status: Status; lines: Line[]; notes?: string }[] = [
    // Hoy: en distintos estados para ver la cocina y el seguimiento.
    { name: "Sofía López Ortiz", phone: "3001234521", daysAgo: 0, minutesAgo: 3, status: "received", lines: [{ product: "Klisto Clásica", qty: 2, options: ["Tres cuartos", "Tocineta"], notes: "Sin cebolla" }, { product: "Limonada de coco", qty: 2, options: ["Poca azúcar"] }] },
    { name: "Andrés Felipe Rojas", phone: "3157654321", daysAgo: 0, minutesAgo: 9, status: "preparing", lines: [{ product: "Doble Smash", qty: 1, options: ["Medio", "Jalapeños"] }, { product: "Papas a la francesa", qty: 1, options: ["Para compartir", "De la casa"] }] },
    { name: "Valentina Gómez", phone: "3209876543", daysAgo: 0, minutesAgo: 14, status: "packing", lines: [{ product: "Pollo Crispy", qty: 1 }, { product: "Gaseosa 400 ml", qty: 1, options: ["Sprite"] }] },
    { name: "Juan Camilo Pérez", phone: "3114567890", daysAgo: 0, minutesAgo: 22, status: "ready", lines: [{ product: "Perro Klisto", qty: 3, options: ["De la casa", "Piña"] }], notes: "Paso en 5 minutos" },
    { name: "Laura Martínez", phone: "3012223344", daysAgo: 0, minutesAgo: 40, status: "delivered", lines: [{ product: "Veggie de Garbanzo", qty: 1 }, { product: "Aros de cebolla", qty: 1 }] },
    { name: "Diego Herrera", phone: "3056667788", daysAgo: 0, minutesAgo: 55, status: "cancelled", lines: [{ product: "Klisto Clásica", qty: 1, options: ["Bien asado"] }] },
    // Días anteriores: para los reportes.
    ...Array.from({ length: 18 }, (_, i) => ({
      name: ["Camila Ruiz", "Mateo Castro", "Isabella Vargas", "Santiago Moreno", "Mariana Silva", "Samuel Torres"][i % 6],
      phone: `3${String(100000000 + i * 7654321).slice(0, 9)}`,
      daysAgo: 1 + (i % 6),
      minutesAgo: 60 * (2 + (i % 5)),
      status: "delivered" as Status,
      lines: [
        { product: ["Klisto Clásica", "Doble Smash", "Pollo Crispy", "Perro Klisto"][i % 4], qty: 1 + (i % 2), options: i % 4 < 2 ? ["Medio"] : [] },
        { product: i % 3 ? "Papas a la francesa" : "Limonada de coco", qty: 1, options: i % 3 ? ["Personal"] : ["Normal"] },
      ],
    })),
  ];

  const dailyCounter: Record<string, number> = {};
  for (const o of sample) {
    let orderDate: string;
    let dailyNumber: number;
    if (o.daysAgo === 0) {
      const next = check("consecutivo", await db.rpc("next_order_number", { p_business_id: business.id })) as {
        order_date: string;
        daily_number: number;
      }[];
      orderDate = next[0].order_date;
      dailyNumber = next[0].daily_number;
    } else {
      orderDate = bogotaDate(o.daysAgo);
      dailyNumber = dailyCounter[orderDate] = (dailyCounter[orderDate] ?? 0) + 1;
      check(
        "contador",
        await db.from("daily_order_counters").upsert({ business_id: business.id, day: orderDate, last_number: dailyNumber }),
      );
    }

    const items = o.lines.map(pick);
    const total = items.reduce((a, i) => a + i.line_total, 0);
    const createdAt = new Date(Date.now() - o.daysAgo * 86_400_000 - o.minutesAgo * 60_000).toISOString();

    const order = check(
      "pedido",
      await db
        .from("orders")
        .insert({
          business_id: business.id,
          order_date: orderDate,
          daily_number: dailyNumber,
          code: buildOrderCode({ customerName: o.name, phone: o.phone, dailyNumber }),
          customer_name: o.name,
          customer_phone: o.phone,
          notes: o.notes ?? null,
          subtotal: total,
          total,
          data_consent_at: createdAt,
          data_policy_version: DATA_POLICY_VERSION,
          created_at: createdAt,
        })
        .select("id, code, tracking_token")
        .single(),
    ) as { id: string; code: string; tracking_token: string };

    check("items", await db.from("order_items").insert(items.map((i) => ({ ...i, order_id: order.id, business_id: business.id }))));

    // Avanzar por el flujo (el trigger valida cada paso).
    const steps: Status[] =
      o.status === "cancelled" ? ["cancelled"] : FLOW.slice(0, FLOW.indexOf(o.status as (typeof FLOW)[number]) + 1);
    for (const status of steps) {
      check(
        `estado ${status}`,
        await db
          .from("orders")
          .update({ status, ...(status === "cancelled" ? { cancel_reason: "El cliente no pudo recoger" } : {}) })
          .eq("id", order.id),
      );
    }

    if (o.daysAgo === 0) console.log(`   ${order.code.padEnd(14)} ${o.status.padEnd(10)} /demo/pedido/${order.tracking_token}`);
  }

  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    console.log("→ Creando superadministrador…");
    const adminId = await ensureUser(db, process.env.SEED_ADMIN_EMAIL, process.env.SEED_ADMIN_PASSWORD, "Admin Klisto");
    check("admin", await db.from("platform_admins").upsert({ user_id: adminId }));
  }

  console.log(`
Listo. Datos de acceso del demo:
  Página pública:  /demo
  Dueño:           ${OWNER_EMAIL} / ${OWNER_PASSWORD}
  Chef:            negocio "demo", usuario "chef",   contraseña ${STAFF[0].document}
  Mesero:          negocio "demo", usuario "mesero", contraseña ${STAFF[1].document}
${process.env.SEED_ADMIN_EMAIL ? `  Superadmin:      ${process.env.SEED_ADMIN_EMAIL}\n` : ""}`);
}

main().catch((error) => {
  console.error("Error cargando los datos de prueba:", error);
  process.exit(1);
});
