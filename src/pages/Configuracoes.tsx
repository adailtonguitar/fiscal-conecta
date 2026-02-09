import { useState } from "react";
import { Store, Palette, Save, Globe, FileText } from "lucide-react";
import { motion } from "framer-motion";

export default function Configuracoes() {
  const [companyName, setCompanyName] = useState("Minha Loja");
  const [cnpj, setCnpj] = useState("00.000.000/0001-00");
  const [ie, setIe] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#1a9e7a");

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Personalize seu sistema PDV</p>
      </div>

      {/* White Label */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl card-shadow border border-border overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">White Label</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Nome da Empresa</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Cor Principal</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <span className="text-sm font-mono text-muted-foreground">{primaryColor}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Dados Fiscais */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card rounded-xl card-shadow border border-border overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Dados Fiscais</h2>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">CNPJ</label>
            <input
              type="text"
              value={cnpj}
              onChange={(e) => setCnpj(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Inscrição Estadual</label>
            <input
              type="text"
              value={ie}
              onChange={(e) => setIe(e.target.value)}
              placeholder="Isento"
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
        </div>
      </motion.div>

      {/* Sync Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl card-shadow border border-border overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Sincronização</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Sincronização Automática</p>
              <p className="text-xs text-muted-foreground mt-0.5">Sincronizar vendas quando houver conexão</p>
            </div>
            <button className="w-11 h-6 bg-primary rounded-full relative transition-colors">
              <span className="w-5 h-5 bg-primary-foreground rounded-full absolute right-0.5 top-0.5 transition-transform" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Backup Automático</p>
              <p className="text-xs text-muted-foreground mt-0.5">Backup diário dos dados locais</p>
            </div>
            <button className="w-11 h-6 bg-primary rounded-full relative transition-colors">
              <span className="w-5 h-5 bg-primary-foreground rounded-full absolute right-0.5 top-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Save */}
      <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all">
        <Save className="w-4 h-4" />
        Salvar Configurações
      </button>
    </div>
  );
}
