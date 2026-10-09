# Klisto

**Pide, reserva y recoge ya mismo.**

Klisto es una plataforma por suscripción mensual que le da a cada negocio una página propia
(`klisto.co/nombre-del-negocio`) con código QR. Los clientes piden desde el celular sin
descargar nada, siguen su pedido en tiempo real y reciben un aviso por WhatsApp cuando está listo.

Esta primera versión incluye:

| Parte | Dónde |
|---|---|
| Página comercial de Klisto, con formulario de interesados | `/` |
| Página de pedidos de cada restaurante (menú, carrito y pago al recoger) | `/demo` (o el nombre de cada negocio) |
| Seguimiento del pedido en tiempo real y consulta con código + celular | `/demo/pedido/…` y `/demo/consultar` |
| Panel del negocio: cocina, pedidos, menú, equipo, QR, reportes, WhatsApp y configuración | `/panel` |
| Superadministrador (solo para el equipo de Klisto) | `/admin` |

El módulo de **citas** (peluquerías, barberías, etc.) se construirá después. La base de datos ya está
preparada para recibirlo.

---

## Índice

1. [Qué necesitas](#1-qué-necesitas)
2. [Crear la cuenta y el proyecto en Supabase](#2-crear-la-cuenta-y-el-proyecto-en-supabase)
3. [Crear las tablas de la base de datos](#3-crear-las-tablas-de-la-base-de-datos)
4. [Ajustar la configuración de Supabase](#4-ajustar-la-configuración-de-supabase)
5. [Copiar las claves de Supabase](#5-copiar-las-claves-de-supabase)
6. [Ejecutar Klisto en tu computador](#6-ejecutar-klisto-en-tu-computador)
7. [Publicar en internet con Vercel](#7-publicar-en-internet-con-vercel)
8. [Conectar WhatsApp (opcional)](#8-conectar-whatsapp-opcional)
9. [Uso diario](#9-uso-diario)
10. [Para el equipo técnico](#10-para-el-equipo-técnico)
11. [Solución de problemas](#11-solución-de-problemas)

---

## 1. Qué necesitas

- Un computador con Windows, Mac o Linux y conexión a internet.
- Una cuenta de **GitHub** (gratis): <https://github.com>. Ahí vive el código.
- Una cuenta de **Supabase** (tiene plan gratis): <https://supabase.com>. Es la base de datos y el sistema de usuarios.
- Una cuenta de **Vercel** (tiene plan gratis): <https://vercel.com>. Es donde se publica la página.
- Para probar en tu computador: **Node.js** versión 20 o más reciente. Descárgalo de <https://nodejs.org> (elige la versión "LTS") e instálalo con las opciones por defecto.

> Consejo: crea las cuentas de Supabase y Vercel con "Continuar con GitHub". Así todo queda conectado.

## 2. Crear la cuenta y el proyecto en Supabase

1. Entra a <https://supabase.com> y haz clic en **Start your project**. Inicia sesión.
2. Haz clic en **New project**.
3. Llena los datos:
   - **Name**: `klisto`
   - **Database Password**: haz clic en **Generate a password** y **guárdala en un lugar seguro**.
   - **Region**: elige **South America (São Paulo)**, que es la más cercana a Colombia.
4. Haz clic en **Create new project** y espera uno o dos minutos mientras se crea.

## 3. Crear las tablas de la base de datos

Las tablas, las reglas de seguridad y las funciones están en la carpeta `supabase/migrations` del proyecto.
Hay **4 archivos** y se deben ejecutar **en orden**:

1. `20261009000001_schema.sql`: crea las tablas.
2. `20261009000002_functions.sql`: crea las funciones y las reglas de estados.
3. `20261009000003_rls.sql`: crea la seguridad para que cada negocio solo vea lo suyo.
4. `20261009000004_storage_realtime.sql`: configura las fotos y las actualizaciones en tiempo real.

Para cada archivo, en orden:

1. En Supabase, abre el menú de la izquierda y entra a **SQL Editor**.
2. Haz clic en **New query** (o en el **+**).
3. Abre el archivo en GitHub (o en tu computador), copia **todo** su contenido y pégalo en el editor.
4. Haz clic en **Run** (abajo a la derecha). Debe aparecer **Success. No rows returned**.

Cuando termines, entra a **Table Editor**. Deberías ver tablas como `businesses`, `products` y `orders`.

> Si sabes usar la terminal, también puedes usar la CLI de Supabase: `supabase link` y luego `supabase db push`.

## 4. Ajustar la configuración de Supabase

**a) Que nadie se pueda registrar por su cuenta.** En Klisto, los usuarios los crea el
superadministrador (dueños) o el dueño (meseros y chefs).

- Ve a **Authentication → Sign In / Providers**.
- Desactiva **Allow new users to sign up**. Deja activo el proveedor **Email**.

**b) Contraseñas de meseros y chefs.** Su contraseña es su número de documento (solo números).

- En **Authentication → Sign In / Providers → Email**, revisa que la longitud mínima sea **6**.
- Revisa también que **no** se exijan letras o símbolos en la contraseña.

**c) Tiempo real.** En **Realtime → Settings**, deja permitido el acceso a canales públicos. Si
activas la opción de "solo canales privados", el seguimiento seguirá funcionando, pero se
actualizará cada 20 segundos en lugar de al instante.

## 5. Copiar las claves de Supabase

Ve a **Project Settings** (el ícono de engranaje) y anota estos tres datos:

| Dato | Dónde está | Variable |
|---|---|---|
| URL del proyecto (`https://xxxx.supabase.co`) | **Data API** o botón **Connect** | `NEXT_PUBLIC_SUPABASE_URL` |
| Clave pública (`sb_publishable_…`) | **API Keys** | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Clave secreta (`sb_secret_…`) | **API Keys** → **Secret keys** → **Reveal** | `SUPABASE_SECRET_KEY` |

> **La clave secreta es como la llave maestra de tu base de datos.** No la compartas, no la pegues
> en chats y nunca la pongas en una variable que empiece por `NEXT_PUBLIC_`.
>
> Si tu proyecto muestra las claves antiguas `anon` y `service_role`, también sirven: `anon` va en
> `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `service_role` en `SUPABASE_SECRET_KEY`.

## 6. Ejecutar Klisto en tu computador

1. **Descarga el proyecto.** En GitHub, abre el repositorio y haz clic en **Code → Download ZIP**.
   Descomprímelo en una carpeta fácil de encontrar, por ejemplo `Documentos/klisto`.
2. **Abre una terminal en esa carpeta:**
   - **Windows:** abre la carpeta, haz clic derecho en un espacio vacío y elige **Abrir en Terminal**.
   - **Mac:** abre la app **Terminal**, escribe `cd ` (con un espacio), arrastra la carpeta a la ventana y presiona Enter.
3. **Instala las dependencias.** Escribe esto y presiona Enter (tarda uno o dos minutos):
   ```bash
   npm install
   ```
4. **Crea tu archivo de configuración.** Haz una copia del archivo `.env.example` y llámala
   `.env.local`. Ábrela con el Bloc de notas (o TextEdit) y llena:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` y `SUPABASE_SECRET_KEY` con los datos del paso 5.
   - `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` con **tu** correo y una contraseña fuerte. Será tu
     usuario de superadministrador.

   Deja lo demás como está.
5. **Carga los datos de prueba** (el restaurante demo "Klisto Burger"):
   ```bash
   npm run seed
   ```
   Al final verás los usuarios de prueba.
6. **Enciende Klisto:**
   ```bash
   npm run dev
   ```
   Abre en tu navegador <http://localhost:3000>. Para apagarlo, vuelve a la terminal y presiona `Ctrl + C`.

### Usuarios de prueba

| Quién | Cómo entra (en `/panel/login`) |
|---|---|
| Dueña del restaurante demo | Pestaña **Dueño o administrador**: `demo@klisto.co` / `KlistoDemo2026` |
| Chef | Pestaña **Mesero o chef**: negocio `demo`, usuario `chef`, contraseña `1012345678` |
| Mesera | Pestaña **Mesero o chef**: negocio `demo`, usuario `mesero`, contraseña `1098765432` |
| Tú (superadministrador) | Pestaña **Dueño o administrador** con tu `SEED_ADMIN_EMAIL` |

### Prueba completa en 2 minutos

1. Abre <http://localhost:3000/demo> en el celular o con la ventana angosta. Elige una hamburguesa,
   escoge el término y una adición, escribe "sin cebolla" y haz el pedido.
2. Verás el código del pedido (por ejemplo `SLO-4521-07`) y la línea de tiempo.
3. En otra ventana, entra como **chef** y abre **Cocina**. Toca **Activar sonido**. Avanza el
   pedido hasta **Marcar listo**. La página del cliente se actualiza sola.
4. En la terminal aparece el mensaje de WhatsApp simulado. También lo ves en **Panel → WhatsApp**.

## 7. Publicar en internet con Vercel

1. **Sube el código a GitHub** si aún no está ahí. Si alguien técnico te ayuda, basta con que el
   repositorio exista en tu cuenta.
2. Entra a <https://vercel.com>, haz clic en **Add New… → Project** y elige el repositorio de Klisto.
   Vercel detecta solo que es un proyecto Next.js.
3. Antes de publicar, abre **Environment Variables** y agrega las mismas variables de tu
   `.env.local`, **menos** las que empiezan por `SEED_`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `NEXT_PUBLIC_SITE_URL`: por ahora pon la dirección que te dará Vercel (por ejemplo
     `https://klisto.vercel.app`). Cuando tengas tu dominio, cámbiala por `https://klisto.co`.
   - Las de WhatsApp, si ya las tienes (paso 8).
4. Haz clic en **Deploy** y espera unos minutos.
5. **Tu dominio (`klisto.co`).** En Vercel, abre el proyecto → **Settings → Domains** → **Add** y
   escribe `klisto.co`. Vercel te dirá qué registros DNS debes crear donde compraste el dominio.
   Después actualiza `NEXT_PUBLIC_SITE_URL` y vuelve a publicar (**Deployments → … → Redeploy**).

> Importante: `NEXT_PUBLIC_SITE_URL` se usa en los códigos QR y en los enlaces de WhatsApp. Si la
> cambias, vuelve a descargar los QR desde el panel.

## 8. Conectar WhatsApp (opcional)

Mientras no lo conectes, Klisto funciona en **modo simulado**: los mensajes se muestran en la
terminal y en **Panel → WhatsApp**, pero no se envían.

Klisto usa la **API oficial de WhatsApp Business Cloud de Meta**. No usa herramientas no oficiales,
que pueden hacer que bloqueen el número.

1. Crea una cuenta en **Meta Business** (<https://business.facebook.com>) y verifica tu empresa.
2. En <https://developers.facebook.com>, crea una app de tipo **Business** y agrégale el producto **WhatsApp**.
3. En **WhatsApp → API Setup**, agrega y verifica el número de celular que enviará los mensajes.
   Anota el **Phone number ID**.
4. En **WhatsApp Manager → Plantillas de mensajes**, crea dos plantillas de categoría
   **Utilidad**, en idioma **Español (COL)** (`es_CO`):
   - **`pedido_confirmado`**:
     `Hola {{1}}, recibimos tu pedido {{2}} en {{3}}. Total: {{4}}. Mira el estado aquí: {{5}}`
   - **`pedido_listo`**:
     `{{1}}, tu pedido {{2}} ya está listo para recoger en {{3}}. Muestra este código al recogerlo.`

   Espera a que Meta las apruebe (suele tardar minutos u horas).
5. Crea un **token permanente**: en Meta Business, ve a **Configuración → Usuarios del sistema**,
   crea un usuario de sistema con permiso sobre la app y genera un token con los permisos
   `whatsapp_business_messaging` y `whatsapp_business_management`.
6. Agrega en Vercel (y en tu `.env.local`):
   - `WHATSAPP_TOKEN`: el token permanente.
   - `WHATSAPP_PHONE_NUMBER_ID`: el Phone number ID.

   Vuelve a publicar. En **Panel → WhatsApp** verás "WhatsApp está conectado".

> Meta cobra por conversación según su tarifa vigente para Colombia. Revisa los precios en el
> WhatsApp Manager.

## 9. Uso diario

### Superadministrador (`/admin`)

- **Crear un negocio:** nombre, dirección (`klisto.co/…`), tipo, plan, y el nombre, correo y
  contraseña temporal del dueño. Comparte esos datos con el dueño.
- **Plan y estado de la suscripción:** *En prueba*, *Activa* o *Suspendida*. Si suspendes un
  negocio, su página muestra "temporalmente no disponible" y no recibe pedidos.
- **Interesados:** las personas que llenaron el formulario de la página de Klisto, con enlace directo a WhatsApp.

### Dueño o administrador (`/panel`)

- **Menú:** categorías, productos, precios, fotos, opciones (término, tamaño, adiciones) y el
  botón **Disponible / Agotado**.
- **Equipo:** crea a cada mesero y chef con nombre, usuario y su **número de documento como
  contraseña**. Puedes cambiarla o desactivar a la persona.
- **Código QR:** descárgalo en PNG o SVG, o imprime el cartel.
- **Configuración:** nombre, logo, color, celular, dirección, horario y pausar pedidos.
- **Reportes:** ventas y pedidos por día y productos más vendidos.

### Chef y mesero

| Rol | Ve | Puede |
|---|---|---|
| Chef | Cocina y Pedidos | Empezar a preparar, pasar a empacar, marcar listo y cancelar |
| Mesero | Pedidos y Cocina | Marcar entregado y cancelar |

### Precios de los planes

Edita el archivo `lib/plans.ts` y reemplaza `[PRECIO]` por el valor (por ejemplo `$89.000`).
Ahí también puedes cambiar lo que incluye cada plan.

### Política de datos

La página `/politica-de-datos` es una **plantilla**. Reemplaza los datos entre corchetes
(`[RAZÓN SOCIAL]`, `[NIT]`, etc.) en `app/(marketing)/politica-de-datos/page.tsx` y pide a un
abogado que la revise antes de lanzar.

## 10. Para el equipo técnico

### Comandos

```bash
npm run dev        # servidor de desarrollo
npm run build      # compilación de producción
npm test           # pruebas (código del pedido, estados, precios, WhatsApp, utilidades)
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run seed       # datos de prueba (Klisto Burger, slug "demo")
```

### Stack

Next.js 16 (App Router, Server Actions, `proxy.ts`), React 19, TypeScript, Tailwind CSS v4,
Supabase (Postgres, Auth, Realtime y Storage), Zod y Vitest.

### Estructura

```
app/
  (marketing)/          landing, política de datos, acción de leads
  [slug]/               página pública del negocio, checkout, seguimiento, consulta, manifest PWA
  panel/                login + panel por roles (cocina, pedidos, menú, equipo, QR, reportes…)
  admin/                superadministrador
components/             ui/, marketing/, storefront/, tracking/, panel/, admin/
lib/
  orders/code.ts        código INICIALES-ÚLTIMOS4-CONSECUTIVO
  orders/status.ts      máquina de estados y permisos por rol
  orders/pricing.ts     precio de cada línea (se recalcula en el servidor)
  orders/create-order.ts creación del pedido
  whatsapp.ts           Meta Cloud API + modo simulado
  payments/             interfaz de pagos (pagar al recoger; Wompi preparado)
  supabase/             clientes navegador / servidor / admin
supabase/migrations/    esquema, funciones, RLS, storage y realtime
scripts/seed.ts         datos de prueba
tests/                  pruebas con Vitest
```

### Seguridad y decisiones

- **Multi-empresa con RLS:** todas las tablas llevan `business_id`. Las políticas usan
  `is_member()` y `has_role()`, que son `SECURITY DEFINER`.
- **El público no lee pedidos.** El seguimiento usa la función `get_order_by_token(token)`
  (token aleatorio de 32 caracteres) y la consulta usa `lookup_order(slug, código, celular)`.
- **Los pedidos se crean en el servidor** con la clave secreta. El servidor recalcula los precios
  con el catálogo (no confía en el navegador), verifica la suscripción y el horario, y asigna el
  consecutivo con `next_order_number()`. Este es atómico por negocio y por día en `America/Bogota`.
- **Estados:** la regla vive en `lib/orders/status.ts` (con pruebas) y se repite en el trigger
  `orders_guard_update`. Así nadie puede saltar estados ni actuar fuera de su rol, aunque llame
  directamente a la base de datos. Desde el navegador, el equipo solo puede modificar `status`, `cancel_reason` y
  `payment_status` (permisos por columna).
- **Tiempo real del cliente:** un trigger emite `realtime.send` al canal Broadcast
  `order:<token>`. El navegador vuelve a consultar con el token, sin confiar en el contenido del
  mensaje. Si Realtime no está disponible, consulta cada 20 s.
- **Cocina:** Realtime `postgres_changes` sobre `orders` (respeta RLS), con respaldo cada 15 s.
- **Meseros y chefs:** Supabase Auth exige un correo, así que se usa uno sintético
  `usuario.negocio@staff.klisto.co`. La contraseña es el número de documento, como se pidió.
  Es débil por naturaleza: el dueño debe desactivar de inmediato a quien se retire.
- **Ley 1581:** se guarda la fecha y la versión de la política aceptada en `orders` y `leads`.

### Pendientes sugeridos

- Pagos en línea con Wompi: ver los pasos en `lib/payments/wompi.ts`.
- Módulo de citas: tablas `services`, `staff_schedules` y `appointments` con el mismo patrón.
- Límite de intentos (rate limiting) en la creación de pedidos y en la consulta por código.
- Aplicar automáticamente los límites de cada plan (productos y usuarios).

## 11. Solución de problemas

| Problema | Solución |
|---|---|
| La página dice "Falta configurar Supabase" | Revisa que `.env.local` exista, esté bien escrito y reinicia `npm run dev`. |
| `npm run seed` dice que faltan variables | Revisa `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SECRET_KEY` en `.env.local`. |
| `npm run seed` dice "relation … does not exist" | Faltan tablas: repite el paso 3 en orden. |
| El mesero o chef no puede entrar | Revisa el código del negocio (lo que va después de `klisto.co/`), el usuario y que esté activo en **Equipo**. |
| No se crea un mesero con su cédula | Revisa en Supabase que la contraseña mínima sea de 6 caracteres y no exija letras (paso 4b). |
| El seguimiento no cambia al instante | Revisa el paso 4c. Sin Realtime, igual se actualiza cada 20 segundos. |
| No suena la alerta en la cocina | Toca **Activar sonido**: los navegadores no reproducen sonido hasta que alguien toca la pantalla. |
| No llegan los WhatsApp | Revisa en **Panel → WhatsApp** si dice "Falló" y el motivo. Lo más común es una plantilla no aprobada o con otro nombre o idioma. |
