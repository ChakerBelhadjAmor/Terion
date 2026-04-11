import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const INITIAL_MESSAGE = null;

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-primary"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

export default function AIAssistant() {
  const { overloaded, nearCapacity, params, utilization, pdpLoaded } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const buildContext = () => {
    const worstAtelier = [...utilization].sort((a, b) => b.utilization - a.utilization)[0];
    return {
      overloaded: overloaded.map(u => `${u.atelier} (${u.utilization}%)`),
      nearCapacity: nearCapacity.map(u => `${u.atelier} (${u.utilization}%)`),
      worstAtelier: worstAtelier ? `${worstAtelier.atelier} à ${worstAtelier.utilization}%` : null,
      params,
    };
  };

  const initGreeting = () => {
    const ctx = buildContext();
    let greeting = `${getGreeting()} ! J'ai analysé votre PDP.\n\n`;

    if (ctx.overloaded.length > 0) {
      greeting += `⚠️ **${ctx.overloaded.length} atelier(s) en surcharge** : ${ctx.overloaded.join(', ')}.\n\n`;
    } else if (ctx.nearCapacity.length > 0) {
      greeting += `🟡 **${ctx.nearCapacity.length} atelier(s) proches de la capacité** : ${ctx.nearCapacity.join(', ')}.\n\n`;
    } else {
      greeting += `✅ Tous les ateliers sont **en dessous de leur capacité**. La production est bien équilibrée.\n\n`;
    }

    if (ctx.worstAtelier) {
      greeting += `L'atelier le plus chargé est **${ctx.worstAtelier}**. `;
    }

    greeting += `Souhaitez-vous que je vous propose des suggestions d'optimisation ?`;
    return greeting;
  };

  const handleOpen = () => {
    setOpen(true);
    if (!initialized && pdpLoaded) {
      setTimeout(() => {
        setMessages([{ role: 'assistant', content: initGreeting() }]);
        setInitialized(true);
      }, 600);
    } else if (!initialized) {
      setMessages([{
        role: 'assistant',
        content: `${getGreeting()} ! Chargez un fichier PDP pour que je puisse analyser votre plan de charge et vous fournir des recommandations personnalisées.`
      }]);
      setInitialized(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // Try real Ollama backend first
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          context: buildContext(),
        }),
        signal: AbortSignal.timeout(8000),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        throw new Error('Backend unavailable');
      }
    } catch {
      // Fallback to smart local responses
      const reply = generateLocalReply(userMsg, buildContext());
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } finally {
      setLoading(false);
    }
  };

  const generateLocalReply = (msg, ctx) => {
    const lower = msg.toLowerCase();
    if (lower.includes('suggestion') || lower.includes('optimis') || lower.includes('oui')) {
      if (ctx.overloaded.length > 0) {
        return `Voici mes suggestions pour réduire la surcharge :\n\n` +
          `1. **Ajouter un 3ème poste** sur ${ctx.overloaded[0]} — cela augmenterait la capacité de ~33%.\n` +
          `2. **Reporter 2 lots** de la semaine 3 à la semaine 5 pour lisser la charge.\n` +
          `3. **Optimiser l'efficacité** : passer de ${ctx.params.efficiency}% à 90% via une maintenance préventive ciblée.\n\n` +
          `Voulez-vous simuler l'un de ces scénarios ?`;
      }
      return `La charge est bien équilibrée. Je recommande de maintenir l'efficacité actuelle à **${ctx.params.efficiency}%** et de planifier une révision mensuelle du PDP.`;
    }
    if (lower.includes('capacit')) {
      return `La capacité disponible est calculée comme suit :\n` +
        `**${ctx.params.weeks} sem × ${ctx.params.daysPerWeek} j × ${ctx.params.shiftsPerDay} postes × ${ctx.params.hoursPerShift}h × ${ctx.params.efficiency}%**\n\n` +
        `= **${(ctx.params.weeks * ctx.params.daysPerWeek * ctx.params.shiftsPerDay * ctx.params.hoursPerShift * ctx.params.efficiency / 100).toFixed(0)} heures** par atelier.`;
    }
    if (lower.includes('atelier') || lower.includes('charg')) {
      if (ctx.worstAtelier) {
        return `L'atelier le plus sollicité est **${ctx.worstAtelier}**. Je vous conseille de surveiller cet atelier en priorité et d'envisager une redistribution des lots si la tendance se confirme.`;
      }
    }
    if (lower.includes('semaine') || lower.includes('poste') || lower.includes('shift')) {
      return `Vous pouvez ajuster le nombre de postes et de semaines dans l'onglet **Simulation**. Les graphiques se mettent à jour en temps réel. Essayez d'augmenter les postes sur les ateliers surchargés !`;
    }
    return `Je suis à votre disposition pour analyser votre plan de charge, identifier des goulots d'étranglement, ou simuler des scénarios d'optimisation. Que souhaitez-vous savoir ?`;
  };

  const renderMessage = (content) => {
    return content.split('\n').map((line, i) => {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className={line.startsWith('•') || line.match(/^\d\./) ? 'ml-2' : ''} dangerouslySetInnerHTML={{ __html: formatted || '&nbsp;' }} />;
    });
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-elm rounded-2xl shadow-xl flex items-center justify-center text-white hover:bg-elm-light transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleOpen}
        title="Assistant IA"
      >
        <MessageCircle className="w-6 h-6" />
        {pdpLoaded && !open && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-accent rounded-full border-2 border-white animate-pulse" />
        )}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 w-96 bg-white rounded-2xl shadow-card-hover border border-gray-100 flex flex-col overflow-hidden"
            style={{ maxHeight: '540px' }}
          >
            {/* Header */}
            <div className="bg-elm px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">Assistant Teriak</p>
                <p className="text-white/50 text-xs">Alimenté par Llama 3 · Ollama</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin bg-gray-50/50">
              {messages.length === 0 && (
                <div className="flex justify-center items-center h-24">
                  <TypingIndicator />
                </div>
              )}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg bg-elm flex items-center justify-center mr-2 mt-1 shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-3 py-2.5 rounded-xl text-sm leading-relaxed space-y-1 ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-white text-gray-700 shadow-sm border border-gray-100 rounded-bl-sm'
                    }`}
                  >
                    {renderMessage(msg.content)}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-elm flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 rounded-bl-sm">
                    <TypingIndicator />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  placeholder="Posez une question..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white disabled:opacity-40 hover:bg-primary-dark transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
