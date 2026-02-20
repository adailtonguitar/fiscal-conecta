import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle, ShoppingCart, LayoutDashboard, Package, FileText, DollarSign,
  Landmark, Receipt, Users, Building2, ClipboardList, UserCheck, Factory,
  Truck, Tags, BarChart3, ArrowUpDown, Settings, Tag, TrendingUp,
  AlertTriangle, FileSpreadsheet, GitGraph, Percent, ArrowRightLeft,
  Gift, Brain, Monitor, ChefHat, CreditCard, Download, Search, ChevronDown, ChevronRight,
  Keyboard, ScrollText, Shield
} from "lucide-react";

interface TutorialSection {
  icon: any;
  title: string;
  description: string;
  steps: string[];
  tips?: string[];
  shortcuts?: { key: string; action: string }[];
}

const tutorials: TutorialSection[] = [
  {
    icon: ShoppingCart,
    title: "PDV — Ponto de Venda",
    description: "Tela principal para realizar vendas rápidas com leitor de código de barras, busca de produtos e múltiplas formas de pagamento.",
    steps: [
      "Abra o caixa informando o saldo inicial (F1 ou botão 'Abrir Caixa').",
      "Adicione produtos digitando o código de barras, SKU ou nome no campo de busca e pressione Enter.",
      "Para multiplicar: digite '5*código' para adicionar 5 unidades de uma vez.",
      "Ajuste quantidades clicando na quantidade do item ou usando F9.",
      "Aplique desconto no item (F7) ou desconto global (F8).",
      "Finalize a venda com F2 ou F12, escolha a forma de pagamento.",
      "O troco é calculado automaticamente para pagamentos em dinheiro.",
      "Ao finalizar, o comprovante é exibido para impressão.",
    ],
    tips: [
      "Use o modo tela cheia para uma experiência mais imersiva.",
      "O modo treinamento permite simular vendas sem registrar dados.",
      "F11 repete a última venda automaticamente.",
      "Produtos de balança (EAN-13 com prefixo 2) são reconhecidos automaticamente.",
    ],
    shortcuts: [
      { key: "F2 / F12", action: "Finalizar venda" },
      { key: "F3", action: "Buscar produto" },
      { key: "F4", action: "Abrir gaveta" },
      { key: "F5", action: "Fidelidade" },
      { key: "F6", action: "Cancelar venda" },
      { key: "F7", action: "Desconto no item" },
      { key: "F8", action: "Desconto global" },
      { key: "F9", action: "Alterar quantidade" },
      { key: "F10", action: "Consulta de preço" },
      { key: "F11", action: "Repetir última venda" },
      { key: "Delete", action: "Remover item selecionado" },
      { key: "↑ / ↓", action: "Navegar entre itens do carrinho" },
    ],
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description: "Visão geral do negócio com indicadores de vendas, faturamento, estoque baixo e atalhos rápidos.",
    steps: [
      "Acesse pelo menu lateral clicando em 'Dashboard'.",
      "Visualize o resumo de vendas do dia, semana e mês.",
      "Confira os produtos com estoque baixo no card de alertas.",
      "Use os cards de acesso rápido para navegar para as funções mais usadas.",
    ],
    tips: [
      "Os dados são atualizados automaticamente a cada acesso.",
      "Clique nos cards para navegar diretamente para o módulo desejado.",
    ],
  },
  {
    icon: Package,
    title: "Produtos & Estoque",
    description: "Cadastro completo de produtos, controle de estoque, inventário, lotes e curva ABC.",
    steps: [
      "Em 'Produtos', clique em 'Novo Produto' para cadastrar.",
      "Preencha nome, SKU, preço, unidade, NCM e código de barras.",
      "Use a importação CSV para cadastrar múltiplos produtos de uma vez.",
      "Importe produtos de NF-e XML para preencher dados fiscais automaticamente.",
      "Em 'Movimentações > Estoque', registre entradas e saídas manuais.",
      "Use o 'Inventário' para contagens físicas e ajuste automático de estoque.",
    ],
    tips: [
      "Configure o 'Ponto de Reposição' para receber alertas de estoque baixo.",
      "A 'Curva ABC' ajuda a identificar os produtos mais importantes para o faturamento.",
      "O módulo 'Lotes & Validade' controla produtos perecíveis.",
      "O módulo 'Perdas' registra avarias, vencimentos e outros descarte.",
    ],
  },
  {
    icon: FileText,
    title: "Vendas & Histórico",
    description: "Consulta de todas as vendas realizadas com filtros por período, forma de pagamento e status.",
    steps: [
      "Acesse 'Vendas > Histórico' para ver todas as vendas.",
      "Use os filtros de data para consultar períodos específicos.",
      "Clique em uma venda para ver os detalhes completos.",
      "Em 'Relatório de Vendas', veja gráficos e estatísticas detalhadas.",
    ],
    tips: [
      "O relatório de vendas permite exportar dados para análise.",
      "Use o módulo 'Promoções' para criar descontos automáticos por produto ou categoria.",
      "O módulo 'Fiado' controla vendas a prazo com controle de parcelas.",
    ],
  },
  {
    icon: DollarSign,
    title: "Caixa",
    description: "Gerenciamento de sessões de caixa com abertura, sangrias, suprimentos e fechamento.",
    steps: [
      "Acesse 'Movimentações > Caixa' para gerenciar as sessões.",
      "Abra o caixa informando o saldo inicial.",
      "Registre sangrias (retiradas) e suprimentos (adições) durante o turno.",
      "No fechamento, informe os valores contados por forma de pagamento.",
      "O sistema calcula automaticamente a diferença entre esperado e contado.",
    ],
    tips: [
      "Cada terminal pode ter seu próprio caixa aberto simultaneamente.",
      "O histórico de sessões anteriores fica disponível para consulta.",
    ],
  },
  {
    icon: Landmark,
    title: "Financeiro",
    description: "Controle completo de contas a pagar e receber, com categorização e fluxo de caixa.",
    steps: [
      "Em 'Movimentações > Financeiro', cadastre receitas e despesas.",
      "Informe descrição, valor, vencimento, categoria e centro de custo.",
      "Marque lançamentos como pagos/recebidos quando liquidados.",
      "Use os filtros para visualizar por status (pendente, pago, vencido).",
    ],
    tips: [
      "O 'Lucro Diário' mostra o resultado operacional de cada dia.",
      "O 'Painel de Lucro' apresenta análises mais detalhadas de rentabilidade.",
      "A 'DRE' gera o demonstrativo contábil automaticamente.",
      "O 'Fluxo de Caixa Projetado' prevê a situação financeira futura.",
      "Alertas Financeiros avisam sobre vencimentos e limites.",
      "A 'Conciliação Bancária' compara extratos com lançamentos.",
    ],
  },
  {
    icon: Receipt,
    title: "Fiscal",
    description: "Emissão e gestão de documentos fiscais (NFC-e, NF-e, SAT) com integração SEFAZ.",
    steps: [
      "Configure o certificado digital em 'Fiscal > Config. Fiscal'.",
      "Informe CSC, série e ambiente (homologação ou produção).",
      "Os documentos fiscais são emitidos automaticamente ao finalizar vendas no PDV.",
      "Em 'Fiscal > Documentos', consulte, cancele ou reimprima documentos.",
      "Use 'Comparar XML' para conferir notas de entrada vs. sistema.",
    ],
    tips: [
      "O módulo de auditoria registra todas as operações fiscais.",
      "O 'Assinador Digital' é necessário para certificados A3.",
      "Em contingência, as notas são armazenadas e enviadas quando o SEFAZ voltar.",
    ],
  },
  {
    icon: ClipboardList,
    title: "Cadastros",
    description: "Cadastro de empresas, clientes, fornecedores, funcionários, transportadoras e categorias.",
    steps: [
      "Acesse cada cadastro pelo menu 'Cadastro' na barra lateral.",
      "Clique em 'Novo' para adicionar um registro.",
      "Preencha os campos obrigatórios e salve.",
      "Use a busca para localizar registros existentes.",
      "Edite ou desative registros conforme necessário.",
    ],
    tips: [
      "Clientes podem ser importados via CSV.",
      "O CNPJ é consultado automaticamente na Receita Federal.",
      "Funcionários podem ser vinculados a usuários do sistema para comissões.",
      "Categorias organizam produtos e lançamentos financeiros.",
    ],
  },
  {
    icon: ScrollText,
    title: "Orçamentos",
    description: "Crie orçamentos para clientes e converta-os em vendas com um clique.",
    steps: [
      "No PDV, monte o carrinho com os produtos desejados.",
      "Clique em 'Salvar Orçamento' para gerar o documento.",
      "Em 'Movimentações > Orçamentos', visualize todos os orçamentos.",
      "Clique no ícone de carrinho para converter o orçamento em venda.",
      "O PDV será aberto com os itens já carregados no carrinho.",
    ],
    tips: [
      "Orçamentos têm validade configurável (padrão: 30 dias).",
      "Após a venda, o orçamento é marcado como 'Convertido' automaticamente.",
    ],
  },
  {
    icon: Gift,
    title: "Programa de Fidelidade",
    description: "Programa de pontos para clientes com acúmulo automático em vendas e resgate de recompensas.",
    steps: [
      "Em 'Fidelidade', configure as regras: pontos por real, valor de resgate, bônus.",
      "No PDV, selecione o cliente (F5) antes de finalizar a venda.",
      "Os pontos são creditados automaticamente após a venda.",
      "O cliente pode resgatar pontos como desconto em compras futuras.",
    ],
    tips: [
      "O multiplicador de aniversário aumenta os pontos em datas especiais.",
      "Configure o mínimo de pontos necessário para resgate.",
    ],
  },
  {
    icon: Tag,
    title: "Etiquetas",
    description: "Geração e impressão de etiquetas em 4 formatos: gôndola, adesiva, prateleira e balança.",
    steps: [
      "Acesse 'Etiquetas' no menu lateral.",
      "Selecione os produtos que precisam de etiqueta.",
      "Escolha o modelo de etiqueta no dropdown (Gôndola, Adesiva, Prateleira ou Balança).",
      "Visualize a pré-visualização e clique em 'Imprimir'.",
    ],
    tips: [
      "Etiquetas são geradas automaticamente quando o preço do produto é alterado.",
      "Use 'Adesiva' para produtos pequenos, 'Prateleira' para trilhos e 'Balança' para pesáveis.",
    ],
  },
  {
    icon: ChefHat,
    title: "Produção",
    description: "Controle de produção para transformar matérias-primas em produtos acabados.",
    steps: [
      "Cadastre a ficha técnica (receita) do produto com os insumos necessários.",
      "Registre uma ordem de produção informando a quantidade desejada.",
      "O sistema calcula automaticamente o consumo de insumos.",
      "Ao finalizar a produção, o estoque é atualizado (baixa dos insumos, entrada do produto).",
    ],
  },
  {
    icon: Monitor,
    title: "Terminais",
    description: "Configuração de múltiplos terminais de venda para operação simultânea.",
    steps: [
      "Acesse 'Terminais' no menu lateral.",
      "Cada terminal opera com seu próprio caixa independente.",
      "Configure o ID do terminal no PDV (canto superior).",
      "Monitore todos os terminais ativos em tempo real.",
    ],
  },
  {
    icon: Brain,
    title: "Relatórios com IA",
    description: "Análises inteligentes geradas por inteligência artificial sobre vendas, estoque e finanças.",
    steps: [
      "Acesse 'Relatórios > Relatórios IA'.",
      "Selecione o tipo de relatório: Geral, Vendas, Estoque ou Financeiro.",
      "Clique em 'Gerar Relatório' e aguarde a análise.",
      "O relatório traz indicadores, alertas e recomendações práticas.",
    ],
    tips: [
      "Use o botão 'Atualizar' para gerar uma análise com dados mais recentes.",
      "Os relatórios consideram os últimos 30 dias de operação.",
    ],
  },
  {
    icon: Settings,
    title: "Configurações",
    description: "Configurações gerais do sistema, dados da empresa, integrações e preferências.",
    steps: [
      "Acesse 'Configurações' no menu lateral.",
      "Configure os dados da empresa (nome, CNPJ, endereço, logo).",
      "Configure integrações como TEF (máquinas de cartão) e PIX.",
      "Gerencie as configurações do contador para envio automático de relatórios.",
    ],
  },
  {
    icon: Users,
    title: "Usuários & Permissões",
    description: "Gerenciamento de usuários com perfis de acesso: Admin, Gerente, Supervisor e Caixa.",
    steps: [
      "Em 'Cadastro > Usuários', convide novos usuários por email.",
      "Defina o perfil de acesso: Admin (tudo), Gerente, Supervisor ou Caixa.",
      "O perfil 'Caixa' tem acesso limitado ao PDV e consultas básicas.",
      "Ative ou desative usuários conforme necessário.",
    ],
    tips: [
      "Cada perfil tem permissões granulares por módulo (visualizar, criar, editar, excluir).",
      "O limite de desconto varia por perfil.",
    ],
  },
  {
    icon: Download,
    title: "Instalar App",
    description: "Instale o sistema como aplicativo no celular ou computador para acesso rápido e offline.",
    steps: [
      "Acesse 'Instalar App' no menu lateral.",
      "Siga as instruções para seu dispositivo (Android, iOS ou Desktop).",
      "O app funciona offline e sincroniza quando conectar à internet.",
    ],
  },
];

export default function Ajuda() {
  const [search, setSearch] = useState("");
  const [openSection, setOpenSection] = useState<string | null>(null);

  const filtered = tutorials.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.steps.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <HelpCircle className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Central de Ajuda</h1>
          <p className="text-sm text-muted-foreground">Tutoriais e guias de todas as funções do sistema</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tutorial... (ex: PDV, estoque, fiscal)"
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Tutorial list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground">Nenhum tutorial encontrado para "{search}".</p>
          </div>
        )}

        {filtered.map((section) => {
          const isOpen = openSection === section.title;
          const Icon = section.icon;

          return (
            <div key={section.title} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenSection(isOpen ? null : section.title)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm">{section.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{section.description}</p>
                </div>
                {isOpen ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
                      <p className="text-sm text-muted-foreground">{section.description}</p>

                      {/* Steps */}
                      <div>
                        <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                          📋 Passo a passo
                        </h4>
                        <ol className="space-y-2">
                          {section.steps.map((step, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                              <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-foreground/90">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Tips */}
                      {section.tips && section.tips.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                            💡 Dicas
                          </h4>
                          <ul className="space-y-1.5">
                            {section.tips.map((tip, i) => (
                              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                                <span className="text-primary">•</span>
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Shortcuts */}
                      {section.shortcuts && section.shortcuts.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                            ⌨️ Atalhos de teclado
                          </h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {section.shortcuts.map((sc, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm">
                                <kbd className="px-2 py-1 rounded bg-muted text-foreground font-mono text-xs border border-border">
                                  {sc.key}
                                </kbd>
                                <span className="text-muted-foreground text-xs">{sc.action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
