import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Server, Brain, Save, CheckCircle2 } from 'lucide-react';

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="ml-4">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-200'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState({
    backendUrl: 'http://localhost:8080',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3',
    autoOptimize: true,
    offlineMode: true,
    notifications: true,
    debugMode: false,
  });

  const update = (key, val) => setConfig(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-3xl">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <SettingsIcon className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-extrabold text-gray-900">Paramètres</h1>
        </div>
        <p className="text-gray-400 text-sm">Configuration du backend, de l'IA et des préférences système.</p>
      </motion.div>

      <div className="space-y-6">
        {/* Backend */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Server className="w-5 h-5 text-elm" />
            <h2 className="font-bold text-gray-800">Connexion Backend</h2>
          </div>
          <SettingRow label="URL du serveur Spring Boot" description="Endpoint REST principal">
            <input
              type="text"
              value={config.backendUrl}
              onChange={e => update('backendUrl', e.target.value)}
              className="w-52 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </SettingRow>
          <SettingRow label="Statut de la connexion" description="Vérifié au dernier démarrage">
            <div className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-green-600 font-medium">Connecté</span>
            </div>
          </SettingRow>
        </motion.div>

        {/* AI */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Brain className="w-5 h-5 text-elm" />
            <h2 className="font-bold text-gray-800">Assistant IA (Ollama)</h2>
          </div>
          <SettingRow label="URL Ollama" description="Serveur local Ollama">
            <input
              type="text"
              value={config.ollamaUrl}
              onChange={e => update('ollamaUrl', e.target.value)}
              className="w-52 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            />
          </SettingRow>
          <SettingRow label="Modèle LLM" description="Modèle Ollama à utiliser">
            <select
              value={config.ollamaModel}
              onChange={e => update('ollamaModel', e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
            >
              <option value="llama3">llama3</option>
              <option value="llama3:8b">llama3:8b</option>
              <option value="mistral">mistral</option>
              <option value="phi3">phi3</option>
            </select>
          </SettingRow>
          <SettingRow label="Mode hors ligne (Offline First)" description="L'IA utilise uniquement le modèle local sans internet">
            <Toggle checked={config.offlineMode} onChange={v => update('offlineMode', v)} />
          </SettingRow>
        </motion.div>

        {/* Preferences */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-card border border-gray-100 p-6">
          <h2 className="font-bold text-gray-800 mb-5">Préférences</h2>
          <SettingRow label="Optimisation automatique" description="Lance Timefold automatiquement après chaque chargement de PDP">
            <Toggle checked={config.autoOptimize} onChange={v => update('autoOptimize', v)} />
          </SettingRow>
          <SettingRow label="Notifications d'alertes" description="Alertes visuelles pour les dépassements de capacité">
            <Toggle checked={config.notifications} onChange={v => update('notifications', v)} />
          </SettingRow>
          <SettingRow label="Mode débogage" description="Affiche les logs techniques dans la console">
            <Toggle checked={config.debugMode} onChange={v => update('debugMode', v)} />
          </SettingRow>
        </motion.div>

        {/* Save Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-md transition-all ${
            saved ? 'bg-green-500' : 'bg-elm hover:bg-elm-light'
          }`}
        >
          {saved ? (
            <><CheckCircle2 className="w-5 h-5" /> Paramètres sauvegardés</>
          ) : (
            <><Save className="w-5 h-5" /> Sauvegarder les paramètres</>
          )}
        </motion.button>
      </div>
    </div>
  );
}
