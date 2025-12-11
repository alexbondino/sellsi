import React, { useState, useMemo } from 'react';
import { useScrollReveal } from './hooks/useScrollReveal';

// ✅ URL de la función de Supabase para envío de emails
  const supabaseFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-form`;const ContactSection = ({ contactRef, onSubmit }) => {
  const [headerRef, headerVisible] = useScrollReveal({ threshold: 0.2 });
  const [formRef, formVisible] = useScrollReveal({ threshold: 0.1 });

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [touchedFields, setTouchedFields] = useState({ nombre: false, email: false, mensaje: false });

  const isValidEmail = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [email]
  );
  const isFormValid =
    nombre.trim().length > 1 && isValidEmail && mensaje.trim().length > 1;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setStatus(null);
    try {
      // Si se pasa onSubmit como prop, usarlo (retrocompatibilidad)
      if (onSubmit) {
        await onSubmit({ nombre, email, mensaje });
      } else {
        // ✅ Llamada directa a la función de Supabase
        const response = await fetch(supabaseFunctionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            name: nombre,
            email: email,
            message: `[AGENDAR DEMO]\n\n${mensaje}`,
          }),
        });

        if (!response.ok) {
          throw new Error('Error al enviar el mensaje');
        }
      }
      
      setStatus('ok');
      setNombre('');
      setEmail('');
      setMensaje('');
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      ref={contactRef}
      className="relative w-full bg-white py-20 md:py-28 lg:py-36 overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] bg-gradient-to-br from-blue-400/25 via-blue-300/15 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-gradient-to-tr from-purple-400/20 via-purple-300/12 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '1.5s' }}></div>
        <div className="absolute top-2/3 right-1/3 w-72 h-72 bg-gradient-to-bl from-pink-300/15 to-transparent rounded-full blur-2xl"></div>
        {/* Radial gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(46,82,178,0.06),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.05),transparent_50%)]"></div>
        {/* Dot pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #2E52B2 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Floating particles */}
        <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-blue-400/40 rounded-full animate-pulse" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-pulse" style={{ animationDuration: '4s', animationDelay: '1s' }}></div>
        <div className="absolute bottom-[30%] left-[20%] w-1 h-1 bg-blue-300/50 rounded-full animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }}></div>
        <div className="absolute bottom-[20%] right-[25%] w-2 h-2 bg-purple-300/40 rounded-full animate-pulse" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}></div>
        <div className="absolute top-[40%] right-[8%] w-1.5 h-1.5 bg-blue-400/35 rounded-full animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-[45%] left-[12%] w-1 h-1 bg-purple-400/45 rounded-full animate-pulse" style={{ animationDuration: '3.8s', animationDelay: '0.8s' }}></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-6 sm:px-8 md:px-12 lg:px-16">
        <div 
          ref={headerRef}
          className={`text-center mb-16 transition-all duration-1000 ${
            headerVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full mb-6">
            <div className="w-2 h-2 bg-gradient-to-r from-[#2E52B2] to-purple-600 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold bg-gradient-to-r from-[#2E52B2] to-purple-600 bg-clip-text text-transparent tracking-wide uppercase">Escríbenos</span>
          </div>

          <h2 className="text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
            ¿Listo para{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-[#2E52B2] to-purple-600 bg-clip-text text-transparent">empezar</span>
              <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none">
                <path d="M0,7 Q50,0 100,7 T200,7" stroke="#2E52B2" strokeWidth="3" fill="none" opacity="0.4"/>
              </svg>
            </span>
            ?
          </h2>

          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            Estamos aquí para ayudarte. Cuéntanos si eres{' '}
            <span className="font-bold text-[#2E52B2]">comprador</span> o{' '}
            <span className="font-bold text-[#F59E0B]">proveedor</span>{' '}
            y qué necesitas.
          </p>
          <p className="text-lg text-gray-500 mt-3">
            Respondemos en menos de 24 horas hábiles
          </p>
        </div>

        {status === 'ok' && (
          <div className="mb-10 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-800 font-semibold text-lg">Mensaje enviado con éxito. Te responderemos pronto.</p>
            </div>
          </div>
        )}
        {status === 'error' && (
          <div className="mb-10 p-6 bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-2xl shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-800 font-semibold text-lg">Error al enviar. Por favor, intenta nuevamente.</p>
            </div>
          </div>
        )}

        <div 
          ref={formRef}
          className={`relative group transition-all duration-1000 ${
            formVisible 
              ? 'opacity-100 translate-y-0 scale-100' 
              : 'opacity-0 translate-y-12 scale-95'
          }`}
        >
          {/* Glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-3xl opacity-20 group-hover:opacity-30 blur-2xl transition duration-500"></div>

          <form onSubmit={handleSubmit} className="relative space-y-8 bg-white/80 backdrop-blur-sm py-10 px-4 lg:p-12 rounded-3xl shadow-2xl border border-gray-200/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group/input relative">
                <label htmlFor="nombre" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#2E52B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Nombre
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="nombre"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    onFocus={() => setFocusedField('nombre')}
                    onBlur={() => { setFocusedField(null); setTouchedFields(prev => ({ ...prev, nombre: true })); }}
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-[#2E52B2] focus:bg-white outline-none transition-all duration-300 shadow-sm hover:border-gray-300 hover:shadow-md text-gray-900 font-medium"
                    placeholder="Tu nombre completo"
                    required
                  />
                  {/* Validation icon */}
                  {touchedFields.nombre && nombre.trim().length > 1 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-scale-in">
                      <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {/* Focus indicator line */}
                  {focusedField === 'nombre' && (
                    <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#2E52B2] to-blue-400 animate-expand-width"></div>
                  )}
                </div>
              </div>
              <div className="group/input relative">
                <label htmlFor="email" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#2E52B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Correo Electrónico
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => { setFocusedField(null); setTouchedFields(prev => ({ ...prev, email: true })); }}
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-[#2E52B2] focus:bg-white outline-none transition-all duration-300 shadow-sm hover:border-gray-300 hover:shadow-md text-gray-900 font-medium"
                    placeholder="tu@empresa.com"
                    required
                  />
                  {/* Validation icon */}
                  {touchedFields.email && isValidEmail && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-scale-in">
                      <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full shadow-lg">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {touchedFields.email && email.length > 0 && !isValidEmail && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-scale-in">
                      <div className="flex items-center justify-center w-6 h-6 bg-red-500 rounded-full">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {/* Focus indicator line */}
                  {focusedField === 'email' && (
                    <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#2E52B2] to-blue-400 animate-expand-width"></div>
                  )}
                </div>
              </div>
            </div>

            <div className="group/input relative">
              <label htmlFor="mensaje" className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-[#2E52B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Mensaje
              </label>
              <div className="relative">
                <textarea
                  id="mensaje"
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  onFocus={() => setFocusedField('mensaje')}
                  onBlur={() => { setFocusedField(null); setTouchedFields(prev => ({ ...prev, mensaje: true })); }}
                  rows="6"
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-[#2E52B2] focus:bg-white outline-none transition-all duration-300 resize-none shadow-sm hover:border-gray-300 hover:shadow-md text-gray-900 font-medium"
                  placeholder="Cuéntanos qué necesitas y si eres comprador o proveedor..."
                  required
                ></textarea>
                {/* Validation icon */}
                {touchedFields.mensaje && mensaje.trim().length > 1 && (
                  <div className="absolute right-4 top-4 animate-scale-in">
                    <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full shadow-lg">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
                {/* Focus indicator line */}
                {focusedField === 'mensaje' && (
                  <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[#2E52B2] to-blue-400 animate-expand-width"></div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <svg className="w-5 h-5 text-[#2E52B2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-medium">Respuesta en menos de 24h</span>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="group/btn relative w-full sm:w-auto px-6 py-5 bg-gradient-to-r from-[#2E52B2] to-blue-600 hover:from-[#254195] hover:to-[#2E52B2] text-white font-bold rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-500/50 hover:scale-105 overflow-hidden flex items-center justify-center"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Mensaje
                      <svg className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700"></div>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
