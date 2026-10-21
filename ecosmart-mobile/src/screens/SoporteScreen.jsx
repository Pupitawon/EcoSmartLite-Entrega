import React, { useState } from "react";
import { 
  HelpCircle, 
  Mail, 
  Send, 
  ChevronDown 
} from "lucide-react";

export default function SoporteScreen({ darkMode }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [enviado, setEnviado] = useState(false);

  const faqs = [
    {
      q: "¿Cómo escaneo un código QR de reciclaje?",
      a: "Ve a la pestaña QR en el menú inferior, apunta la cámara de tu teléfono al código ubicado en la estación de reciclaje y los puntos se acreditarán automáticamente."
    },
    {
      q: "¿Dónde puedo canjear mis puntos EcoSmart?",
      a: "En la sección de 'Inicio', presiona el botón 'Canjear Puntos' para ver el catálogo de recompensas y cupones disponibles."
    },
    {
      q: "¿Qué hago si una estación de reciclaje está llena?",
      a: "Puedes enviarnos un reporte directo usando el formulario de soporte indicando la ubicación de la estación."
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mensaje.trim()) return;
    setEnviado(true);
    setTimeout(() => {
      setMensaje("");
      setEnviado(false);
    }, 2500);
  };

  return (
    <div className={`flex-1 flex flex-col gap-4 p-4 pb-24 transition-colors ${
      darkMode ? "text-white" : "text-zinc-900"
    }`}>
      {/* Cabecera de la Vista */}
      <div className="flex items-center gap-2 pb-2 border-b border-zinc-700/40 mt-1">
        <HelpCircle className="w-5 h-5 text-purple-400" />
        <h3 className="font-bold text-base">Ayuda y Soporte</h3>
      </div>

      <div className="space-y-4">
        {/* Sección FAQ */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
            Preguntas Frecuentes
          </h4>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`border rounded-xl overflow-hidden transition-all ${
                  darkMode ? "border-zinc-800 bg-zinc-900/80" : "border-zinc-200 bg-white shadow-sm"
                }`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-3 text-left flex items-center justify-between gap-2 text-xs font-semibold"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      openFaq === index ? "rotate-180 text-purple-400" : "text-zinc-500"
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className={`px-3 pb-3 text-[11px] border-t pt-2 ${
                    darkMode ? "text-zinc-400 border-zinc-800/40" : "text-zinc-600 border-zinc-100"
                  }`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Formulario de Contacto Directo */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
            Envíanos un mensaje
          </h4>
          {enviado ? (
            <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 p-3 rounded-xl text-center text-xs font-medium">
              ¡Mensaje enviado! Te responderemos pronto.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Describe tu problema o sugerencia..."
                rows={3}
                className={`w-full p-2.5 text-xs rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  darkMode
                    ? "bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500"
                    : "bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400"
                }`}
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-purple-900/30"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar Reporte
              </button>
            </form>
          )}
        </div>

        {/* Contacto Directo */}
        <div className="pt-3 border-t border-zinc-700/40 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-purple-400" /> soporte@ecosmart.cl
          </span>
          <span>Atención 24/7</span>
        </div>
      </div>
    </div>
  );
}