import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/hooks/useCompany";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export function AiInsightWidget() {
  const { companyId } = useCompany();
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const generateInsight = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-report", {
        body: { report_type: "general", company_id: companyId },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.error.includes("Limite")) {
          toast.warning(data.error);
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setInsight(data.report);
    } catch (err: any) {
      console.error("AI insight error:", err);
      toast.error("Não foi possível gerar o insight. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="bg-gradient-to-br from-primary/5 via-card to-accent/5 rounded-xl border border-primary/20 overflow-hidden"
    >
      <div className="px-5 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Brain className="w-5 h-5 text-primary" />
            <Sparkles className="w-3 h-3 text-amber-500 absolute -top-1 -right-1" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Análise Inteligente</h2>
            <p className="text-[10px] text-muted-foreground">Powered by IA</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {insight && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={generateInsight}
            disabled={loading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {insight ? "Atualizar" : "Gerar Análise"}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {!insight && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-5 py-8 text-center"
          >
            <Brain className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Clique para gerar uma análise inteligente do seu negócio
            </p>
            <Button
              onClick={generateInsight}
              size="sm"
              className="gap-2"
              disabled={loading}
            >
              <Sparkles className="w-4 h-4" />
              Gerar Análise com IA
            </Button>
          </motion.div>
        )}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-5 py-8 text-center"
          >
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground animate-pulse">
              Analisando dados do seu negócio...
            </p>
          </motion.div>
        )}

        {insight && !loading && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 py-4"
          >
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed
              [&>h1]:text-base [&>h1]:font-bold [&>h1]:text-foreground [&>h1]:mb-2
              [&>h2]:text-sm [&>h2]:font-semibold [&>h2]:text-foreground [&>h2]:mb-1.5 [&>h2]:mt-4
              [&>h3]:text-sm [&>h3]:font-medium [&>h3]:text-foreground
              [&>p]:text-muted-foreground [&>p]:mb-2
              [&>ul]:text-muted-foreground [&>ul]:mb-2 [&>ul]:space-y-0.5
              [&>ol]:text-muted-foreground [&>ol]:mb-2
              [&_strong]:text-foreground
              [&_code]:text-primary [&_code]:bg-primary/10 [&_code]:px-1 [&_code]:rounded
            ">
              <ReactMarkdown>{insight}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
