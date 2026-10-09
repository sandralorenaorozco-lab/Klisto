import type { Metadata } from "next";
import { DATA_POLICY_VERSION } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos personales",
};

// IMPORTANTE: esta es una plantilla base. Reemplaza los datos entre corchetes
// y haz que un abogado la revise antes de publicar en producción.
export default function DataPolicyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:py-20">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-dark">Ley 1581 de 2012 · Decreto 1377 de 2013</p>
      <h1 className="mt-3 font-display text-4xl font-bold leading-tight">Política de tratamiento de datos personales</h1>
      <p className="mt-3 text-sm text-muted">Versión {DATA_POLICY_VERSION}</p>

      <div className="mt-10 space-y-8 leading-relaxed text-ink-soft [&_h2]:mb-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        <section>
          <h2>1. Responsable del tratamiento</h2>
          <p>
            [RAZÓN SOCIAL], identificada con NIT [NIT], con domicilio en [CIUDAD], dirección [DIRECCIÓN], correo
            [CORREO DE CONTACTO] y teléfono [TELÉFONO] (en adelante, &quot;Klisto&quot;).
          </p>
          <p className="mt-3">
            Cuando un cliente hace un pedido en la página de un negocio que usa Klisto, ese negocio es el
            <strong> responsable</strong> de los datos de su cliente y Klisto actúa como <strong>encargado</strong> del
            tratamiento, procesándolos únicamente para prestar el servicio.
          </p>
        </section>

        <section>
          <h2>2. Datos que recolectamos</h2>
          <ul>
            <li>Clientes de los negocios: nombre, número de celular, contenido del pedido y notas.</li>
            <li>Interesados en Klisto: nombre, negocio, celular, correo, ciudad y mensaje.</li>
            <li>Usuarios de los negocios: nombre, usuario y datos de acceso.</li>
          </ul>
          <p className="mt-3">No recolectamos datos sensibles ni datos de niñas, niños o adolescentes.</p>
        </section>

        <section>
          <h2>3. Finalidades</h2>
          <ul>
            <li>Recibir, preparar y entregar tu pedido, y mostrarte su estado en tiempo real.</li>
            <li>Enviarte por WhatsApp la confirmación del pedido y el aviso de que está listo.</li>
            <li>Permitirte consultar tu pedido con su código y tu celular.</li>
            <li>Contactar a los interesados para presentarles el servicio.</li>
            <li>Generar estadísticas agregadas para el negocio (ventas, productos más vendidos).</li>
            <li>Cumplir obligaciones legales y atender requerimientos de autoridades.</li>
          </ul>
        </section>

        <section id="derechos" className="scroll-mt-24">
          <h2>4. Tus derechos</h2>
          <p>Como titular de los datos tienes derecho a:</p>
          <ul className="mt-3">
            <li>Conocer, actualizar y rectificar tus datos personales.</li>
            <li>Solicitar prueba de la autorización que otorgaste.</li>
            <li>Ser informado sobre el uso que se les ha dado.</li>
            <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
            <li>Revocar la autorización o pedir la supresión de tus datos cuando no exista un deber legal de conservarlos.</li>
            <li>Acceder gratuitamente a tus datos personales.</li>
          </ul>
        </section>

        <section>
          <h2>5. Cómo ejercer tus derechos</h2>
          <p>
            Escríbenos a [CORREO DE CONTACTO] indicando tu nombre, celular y la solicitud. Atenderemos las consultas en
            máximo diez (10) días hábiles y los reclamos en máximo quince (15) días hábiles, según los artículos 14 y 15 de
            la Ley 1581 de 2012.
          </p>
        </section>

        <section>
          <h2>6. Seguridad y conservación</h2>
          <p>
            Usamos medidas técnicas para proteger tu información: conexiones cifradas, separación de los datos de cada
            negocio y acceso restringido por roles. Conservamos los datos mientras sean necesarios para las finalidades
            descritas y para cumplir obligaciones legales y contables.
          </p>
        </section>

        <section>
          <h2>7. Transferencia y transmisión</h2>
          <p>
            Para prestar el servicio usamos proveedores tecnológicos (alojamiento de datos y mensajería de WhatsApp de
            Meta) que pueden estar fuera de Colombia y que cumplen estándares adecuados de protección de datos.
          </p>
        </section>

        <section>
          <h2>8. Vigencia</h2>
          <p>
            Esta política rige desde su publicación. Cualquier cambio sustancial se informará en esta misma página.
          </p>
        </section>
      </div>
    </article>
  );
}
