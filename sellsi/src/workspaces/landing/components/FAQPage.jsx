import React, { useMemo, useState } from 'react';
import ContactModal from '../../../shared/components/modals/ContactModal';

const FAQPage = () => {
  const [isContactOpen, setIsContactOpen] = useState(false);

  const faqSections = useMemo(
    () => [
      {
        title: 'Generalidades sobre Sellsi',
        items: [
          {
            question: '¿Qué es Sellsi y cómo funciona?',
            answer:
              'Sellsi es un marketplace B2B (Business-to-Business) diseñado para simplificar el comercio entre empresas en Chile. Nuestra plataforma tecnológica conecta a compradores que buscan insumos o productos al por mayor con proveedores verificados, centralizando cotizaciones, negociaciones y facturación en un solo lugar seguro e intuitivo.',
          },
          {
            question: '¿Tiene algún costo registrarse en la plataforma?',
            answer:
              'El registro en Sellsi es gratuito. Puedes crear tu cuenta como comprador o proveedor sin costo inicial y comenzar a explorar las oportunidades de negocio que ofrece nuestro ecosistema digital.',
          },
          {
            question: '¿Es seguro operar en Sellsi?',
            answer:
              'Absolutamente. La seguridad es uno de nuestros pilares. Operamos con protección de datos avanzada y verificamos a todos los proveedores y transacciones para garantizar que operes con total confianza y transparencia.',
          },
          {
            question: '¿Cómo puedo contactar a soporte si tengo un problema?',
            answer:
              'Nuestro equipo de soporte está disponible para ayudarte. Puedes escribirnos a través del formulario de contacto en el sitio web o al correo contacto@sellsi.cl. Respondemos todas las solicitudes en menos de 24 horas hábiles.',
          },
        ],
      },
      {
        title: 'Para Compradores (Empresas que buscan productos)',
        items: [
          {
            question: '¿Qué ventajas tengo al comprar a través de Sellsi?',
            answer:
              'Al usar Sellsi, optimizas tus tiempos de compra evitando cadenas de correos interminables. Puedes cotizar en línea con múltiples proveedores, negociar precios por volumen y cerrar tratos en tiempo récord, todo desde una interfaz centralizada.',
          },
          {
            question: '¿Cómo obtengo mi factura?',
            answer:
              'Simplificamos tu gestión administrativa. Una vez cerrada la transacción y procesada la compra, obtendrás tus facturas de manera instantánea y automática directamente en nuestra plataforma.',
          },
          {
            question: '¿Los proveedores están verificados?',
            answer:
              'Sí. En Sellsi nos aseguramos de conectar a las empresas solo con proveedores confiables y validados, asegurando que recibas productos de calidad y cumplimiento en los plazos acordados.',
          },
        ],
      },
      {
        title: 'Para Proveedores (Empresas que venden)',
        items: [
          {
            question: '¿Cómo me ayuda Sellsi a aumentar mis ventas?',
            answer:
              'Sellsi te da acceso a una demanda calificada sin necesidad de salir a prospectar en frío. Te conectamos con una red de empresas en Chile que ya están listas para comprar lo que ofreces, permitiéndote cerrar ventas por volumen más rápido.',
          },
          {
            question: '¿Puedo digitalizar mi catálogo de productos en la plataforma?',
            answer:
              'Sí. Sellsi te permite digitalizar tu catálogo para que sea visible a miles de compradores potenciales. Esto facilita que recibas cotizaciones directas sobre productos específicos de tu oferta.',
          },
          {
            question: '¿Cómo funcionan las negociaciones de precio?',
            answer:
              'Nuestra plataforma permite la negociación transparente. Puedes gestionar pedidos y negociar precios por volumen directamente con los interesados, manteniendo el control de tus márgenes y centralizando la operación en un solo lugar.',
          },
        ],
      },
    ],
    []
  );

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white">
      <section className="relative w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 py-20 md:py-24 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.15]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(59, 130, 246, 0.08) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px',
            }}
          ></div>
        </div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute top-1/3 -right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
          <div
            className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
          ></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 text-center">
          <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-orange-500 bg-clip-text text-transparent tracking-wide uppercase">
            Preguntas Frecuentes
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
            Todo lo que necesitas saber de{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-[#2E52B2] to-[#1e3a8a] bg-clip-text text-transparent">
                Sellsi
              </span>
              <svg
                className="absolute -bottom-1 sm:-bottom-2 left-0 w-full"
                height="12"
                viewBox="0 0 200 12"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,7 Q50,0 100,7 T200,7"
                  stroke="#F59E0B"
                  strokeWidth="3"
                  fill="none"
                  opacity="0.6"
                />
              </svg>
            </span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto">
            Resolvemos tus dudas sobre nuestra plataforma.
          </p>
        </div>
      </section>

      <section className="relative w-full py-16 md:py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16 space-y-12">
          {faqSections.map((section, sectionIndex) => (
            <div key={section.title} className="space-y-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-blue-600 uppercase tracking-wide">
                  Sección {sectionIndex + 1}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  {section.title}
                </h2>
              </div>
              <div className="space-y-4">
                {section.items.map((item, itemIndex) => (
                  <details
                    key={item.question}
                    className="group rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-blue-200"
                    open={sectionIndex === 0 && itemIndex === 0}
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left text-lg font-semibold text-gray-900 transition-colors hover:text-blue-700 bg-gray-50 rounded-t-xl hover:bg-gray-100 group-open:bg-blue-50">
                      <span>{item.question}</span>
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 transition-all duration-300 group-open:rotate-180 group-open:bg-gradient-to-br group-open:from-blue-500 group-open:to-blue-600 group-open:text-white">
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-6 pb-6 text-base leading-relaxed text-gray-900 bg-white/60 rounded-b-xl">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="w-full pb-20 md:pb-24 lg:pb-28">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
          <div className="relative overflow-hidden rounded-3xl group bg-gradient-to-r from-blue-600 to-blue-700 p-10 md:p-14 shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-all duration-300">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-3xl opacity-20 group-hover:opacity-35 blur-2xl transition duration-500"></div>
            <div className="absolute -top-12 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl"></div>
            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-orange-400/20 blur-2xl"></div>
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="text-white space-y-3">
                <h3 className="text-2xl sm:text-3xl font-extrabold">
                  ¿Tienes dudas? No dudes en contactarnos
                </h3>
                <p className="text-base sm:text-lg text-blue-100 max-w-2xl">
                  Nuestro equipo está listo para ayudarte a resolver cualquier consulta y acompañarte en tu proceso con Sellsi.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsContactOpen(true)}
                className="group/button relative inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-bold text-blue-700 shadow-[0_6px_20px_rgba(2,6,23,0.2)] transition-all duration-300 hover:scale-105 hover:shadow-[0_8px_30px_rgba(2,6,23,0.25)]"
              >
                <span className="relative z-10">Contactarnos</span>
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4h16v12H4V4zm0 12l4-4h8l4 4"
                  />
                </svg>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent to-transparent group-hover/button:from-blue-50 group-hover/button:to-blue-100 rounded-xl transition-all duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </section>

      <ContactModal open={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
};

export default FAQPage;
