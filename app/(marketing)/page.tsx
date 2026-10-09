import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContactForm } from "@/components/marketing/contact-form";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import {
  IconAlert,
  IconBag,
  IconBell,
  IconCalendar,
  IconCart,
  IconCheck,
  IconChef,
  IconClock,
  IconPercent,
  IconQr,
  IconScissors,
  IconUser,
} from "@/components/ui/icons";
import { PLANS } from "@/lib/plans";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Problem />
      <RestaurantSteps />
      <ServicesSteps />
      <Industries />
      <Plans />
      <Faq />
      <Contact />
    </>
  );
}

function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  className = "",
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`scroll-mt-20 py-16 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 max-w-2xl">
          {eyebrow && <p className="mb-3 text-sm font-bold uppercase tracking-wider text-brand-dark">{eyebrow}</p>}
          <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{title}</h2>
          {intro && <p className="mt-4 text-lg leading-relaxed text-ink-soft">{intro}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

function Hero() {
  return (
    <section className="overflow-hidden bg-mist">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Badge tone="brand" className="mb-5">Sin apps · Sin comisiones por venta</Badge>
          <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Pide, reserva y recoge <span className="text-brand">ya mismo.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
            Klisto le da a tu negocio una página propia con código QR. Tus clientes piden o reservan desde el celular, sin
            descargar nada, y siguen su pedido en vivo. Tú pagas una tarifa fija al mes y te quedas con el 100 % de cada venta.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/#contacto" size="lg">
              Quiero Klisto para mi negocio
            </ButtonLink>
            <ButtonLink href="/demo" size="lg" variant="outline">
              Ver demo
            </ButtonLink>
          </div>
          <ul className="mt-8 grid gap-2 text-sm font-semibold text-ink-soft sm:grid-cols-3">
            {["Funciona en el navegador", "Avisos por WhatsApp", "Listo en un día"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <IconCheck size={18} className="text-ready-ink" strokeWidth={3} /> {t}
              </li>
            ))}
          </ul>
        </div>
        <PhoneMockup />
      </div>
    </section>
  );
}

function Problem() {
  const items = [
    {
      icon: <IconClock />,
      title: "Filas que espantan clientes",
      text: "En la hora pico la gente se va antes de pedir. Cada persona que se cansa de esperar es una venta perdida.",
    },
    {
      icon: <IconAlert />,
      title: "Errores en la comanda",
      text: "“Era sin cebolla”. Los pedidos dictados a gritos o en papel se confunden, y el reproceso sale caro.",
    },
    {
      icon: <IconPercent />,
      title: "Comisiones que se comen la ganancia",
      text: "Las apps de domicilio cobran hasta 30 % por pedido. Con Klisto pagas una tarifa fija y nada más.",
    },
    {
      icon: <IconCalendar />,
      title: "Agendas desordenadas",
      text: "Citas por WhatsApp, cuaderno y llamadas. Se cruzan horarios y los clientes no llegan.",
    },
  ];
  return (
    <Section eyebrow="El problema" title="Atender bien no debería ser tan difícil" intro="Los negocios de barrio y las cadenas pequeñas pierden plata todos los días por cosas que ya tienen solución.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => (
          <article key={i.title} className="rounded-2xl border border-line p-6">
            <span className="mb-4 grid size-12 place-items-center rounded-xl bg-brand-soft text-brand-dark">{i.icon}</span>
            <h3 className="font-display text-lg font-bold">{i.title}</h3>
            <p className="mt-2 text-ink-soft">{i.text}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Steps({ steps }: { steps: { icon: ReactNode; title: string; text: string }[] }) {
  return (
    <ol className={`grid gap-4 sm:grid-cols-2 ${steps.length === 5 ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
      {steps.map((s, i) => (
        <li key={s.title} className="relative rounded-2xl bg-white p-6 shadow-[0_1px_0_#D9DBE0]">
          <div className="mb-4 flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-xl bg-ink text-white">{s.icon}</span>
            <span className="font-display text-3xl font-extrabold text-line">{String(i + 1).padStart(2, "0")}</span>
          </div>
          <h3 className="font-display text-lg font-bold">{s.title}</h3>
          <p className="mt-2 text-ink-soft">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

function RestaurantSteps() {
  return (
    <Section
      id="como-funciona"
      eyebrow="Para restaurantes"
      title="Cómo funciona en tu restaurante"
      intro="Del QR a la mano del cliente en cinco pasos, sin meseros corriendo ni papelitos."
      className="bg-mist"
    >
      <Steps
        steps={[
          { icon: <IconQr />, title: "Escanea el QR", text: "El cliente abre tu menú desde la mesa, la fila o tus redes. No descarga nada." },
          { icon: <IconCart />, title: "Arma su pedido", text: "Elige productos, adiciones y escribe notas como “sin cebolla”." },
          { icon: <IconUser />, title: "Confirma con su celular", text: "Recibe un código único como SLO-4521-05 y un enlace para seguir su pedido." },
          { icon: <IconChef />, title: "Tu cocina lo ve al instante", text: "Llega a la pantalla de cocina con alerta sonora y todos los detalles." },
          { icon: <IconBell />, title: "Le avisamos que está listo", text: "Su pantalla se actualiza sola y recibe un WhatsApp para pasar a recoger." },
        ]}
      />
      <div className="mt-8">
        <ButtonLink href="/demo" variant="dark" size="lg">
          Probar el demo de Klisto Burger
        </ButtonLink>
      </div>
    </Section>
  );
}

function ServicesSteps() {
  return (
    <Section
      eyebrow="Para peluquerías y servicios"
      title="Citas sin llamadas ni cuadernos"
      intro={
        <>
          <Badge tone="dark" className="mr-2 align-middle">Próximamente</Badge>
          Estamos terminando el módulo de citas para peluquerías, barberías, spas y más.
        </>
      }
    >
      <Steps
        steps={[
          { icon: <IconScissors />, title: "Elige el servicio", text: "Corte, barba, uñas o masaje, con precio y duración claros." },
          { icon: <IconUser />, title: "Escoge con quién", text: "El cliente elige su estilista o barbero favorito." },
          { icon: <IconCalendar />, title: "Reserva el horario", text: "Solo ve los espacios libres. Se acabaron los cruces." },
          { icon: <IconBell />, title: "Recordatorio por WhatsApp", text: "Le recordamos su cita para que no se le olvide llegar." },
        ]}
      />
    </Section>
  );
}

function Industries() {
  const list = [
    "Restaurantes", "Cafeterías", "Panaderías", "Peluquerías", "Barberías",
    "Spas", "Consultorios", "Veterinarias", "Lavaderos", "Talleres",
  ];
  return (
    <Section id="industrias" eyebrow="Industrias" title="Hecho para negocios que atienden gente todos los días" className="bg-ink text-white [&_h2]:text-white [&_p]:text-white/75">
      <ul className="flex flex-wrap gap-3">
        {list.map((i) => (
          <li key={i} className="rounded-full border border-white/20 px-5 py-3 font-display text-lg font-semibold text-white">
            {i}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Plans() {
  return (
    <Section
      id="planes"
      eyebrow="Planes"
      title="Una tarifa fija al mes. Cero comisiones."
      intro="Sin contratos amarrados: puedes cambiar de plan o cancelar cuando quieras. Todos incluyen 14 días de prueba."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.id}
            className={`flex flex-col rounded-2xl p-6 sm:p-8 ${
              plan.recommended ? "bg-ink text-white ring-4 ring-brand" : "border border-line bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
              {plan.recommended && <Badge tone="brand">Recomendado</Badge>}
            </div>
            <p className={`mt-2 ${plan.recommended ? "text-white/75" : "text-ink-soft"}`}>{plan.tagline}</p>
            <p className="mt-6">
              <span className="font-display text-4xl font-extrabold">{plan.price}</span>{" "}
              <span className={plan.recommended ? "text-white/75" : "text-muted"}>COP/mes</span>
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-3">
                  <IconCheck size={20} strokeWidth={3} className={`mt-0.5 shrink-0 ${plan.recommended ? "text-brand" : "text-ready-ink"}`} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <ButtonLink
              href={`/#contacto`}
              size="lg"
              variant={plan.recommended ? "primary" : "outline"}
              className="mt-8 w-full"
            >
              Empezar con {plan.name}
            </ButtonLink>
          </article>
        ))}
      </div>
    </Section>
  );
}

const FAQ = [
  {
    q: "¿Mis clientes tienen que descargar una aplicación?",
    a: "No. Klisto funciona en el navegador del celular. Escanean el QR o abren tu enlace y listo. Si quieren, pueden agregarlo a su pantalla de inicio como una app.",
  },
  {
    q: "¿Cobran comisión por cada pedido?",
    a: "No. Pagas una tarifa fija mensual según tu plan. Lo que vendes es 100 % tuyo.",
  },
  {
    q: "¿Cómo pagan mis clientes?",
    a: "Por ahora pagan al recoger, en tu caja, como siempre. Muy pronto podrán pagar en línea con Nequi, PSE y tarjetas a través de Wompi.",
  },
  {
    q: "¿Necesito comprar equipos?",
    a: "No. La pantalla de cocina funciona en cualquier tablet, computador o celular con internet. El QR lo imprimes tú.",
  },
  {
    q: "¿Mis meseros y chefs pueden tener su propio usuario?",
    a: "Sí. Desde tu panel creas a cada persona con su nombre de usuario. El chef ve la pantalla de cocina y el mesero los pedidos listos para entregar.",
  },
  {
    q: "¿Qué pasa con los datos de mis clientes?",
    a: "Cada cliente autoriza el tratamiento de sus datos según la Ley 1581 de 2012. Los datos de tu negocio están separados de los de los demás y solo tu equipo puede verlos.",
  },
  {
    q: "¿Cuánto tarda en estar funcionando?",
    a: "Si tienes tu menú a la mano, tu página puede quedar lista el mismo día. En el plan Premium te ayudamos a cargarlo.",
  },
];

function Faq() {
  return (
    <Section id="preguntas" eyebrow="Preguntas frecuentes" title="Lo que más nos preguntan" className="bg-mist">
      <div className="max-w-3xl space-y-3">
        {FAQ.map((item) => (
          <details key={item.q} className="group rounded-2xl bg-white p-1 shadow-[0_1px_0_#D9DBE0]">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-5 py-3 font-display text-lg font-semibold">
              {item.q}
              <span className="text-2xl leading-none text-brand-dark transition-transform group-open:rotate-45" aria-hidden="true">
                +
              </span>
            </summary>
            <p className="px-5 pb-5 text-ink-soft">{item.a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

function Contact() {
  return (
    <Section
      id="contacto"
      eyebrow="Hablemos"
      title="Quiero Klisto para mi negocio"
      intro="Déjanos tus datos y te escribimos por WhatsApp para mostrarte Klisto con tu propio menú."
    >
      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-line p-6 sm:p-8">
          <ContactForm />
        </div>
        <aside className="space-y-4 rounded-2xl bg-brand-soft p-6 sm:p-8">
          <span className="grid size-12 place-items-center rounded-xl bg-brand text-ink">
            <IconBag />
          </span>
          <h3 className="font-display text-2xl font-bold">¿Quieres verlo funcionando ya?</h3>
          <p className="text-ink-soft">
            Entra al demo de Klisto Burger, haz un pedido de prueba y mira cómo cambia su estado en tiempo real.
          </p>
          <ButtonLink href="/demo" variant="dark" size="lg">
            Ver demo
          </ButtonLink>
        </aside>
      </div>
    </Section>
  );
}
