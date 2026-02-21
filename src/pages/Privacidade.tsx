import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Privacidade() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-10">Última atualização: 10 de fevereiro de 2026</p>

        <div className="prose prose-sm max-w-none text-foreground/90 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Introdução</h2>
            <p>
              Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos
              suas informações pessoais ao utilizar nossa plataforma de gestão comercial e ponto de venda.
              Estamos comprometidos com a proteção dos seus dados em conformidade com a Lei Geral de
              Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Dados Coletados</h2>
            <p>Coletamos os seguintes tipos de dados:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome, e-mail, telefone, CNPJ, endereço da empresa</li>
              <li><strong>Dados operacionais:</strong> produtos, vendas, movimentações de estoque, documentos fiscais</li>
              <li><strong>Dados de acesso:</strong> endereço IP, tipo de navegador, páginas acessadas, horários de uso</li>
              <li><strong>Dados financeiros:</strong> informações de cobrança e histórico de pagamentos da assinatura</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Finalidade do Tratamento</h2>
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Fornecer e manter os serviços contratados</li>
              <li>Processar pagamentos e gerenciar assinaturas</li>
              <li>Emitir documentos fiscais junto às autoridades competentes</li>
              <li>Enviar comunicações sobre o serviço, atualizações e suporte</li>
              <li>Melhorar a experiência do usuário e desenvolver novas funcionalidades</li>
              <li>Cumprir obrigações legais e regulatórias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Base Legal</h2>
            <p>
              O tratamento dos seus dados pessoais é realizado com base nas seguintes hipóteses legais
              previstas na LGPD: execução de contrato, cumprimento de obrigação legal, legítimo interesse
              do controlador e, quando aplicável, consentimento do titular.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Compartilhamento de Dados</h2>
            <p>Seus dados podem ser compartilhados com:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Autoridades fiscais:</strong> para emissão e transmissão de documentos fiscais (SEFAZ)</li>
              <li><strong>Processadores de pagamento:</strong> para cobrança de assinaturas</li>
              <li><strong>Provedores de infraestrutura:</strong> serviços de hospedagem e armazenamento em nuvem</li>
              <li><strong>Revendedores autorizados:</strong> quando aplicável, para suporte e gestão da licença</li>
            </ul>
            <p>Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins de marketing.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Segurança dos Dados</h2>
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados, incluindo:
              criptografia em trânsito (TLS/SSL), controle de acesso baseado em funções,
              isolamento de dados entre empresas (multi-tenant), backups regulares e
              monitoramento de segurança.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Retenção de Dados</h2>
            <p>
              Seus dados são mantidos enquanto sua conta estiver ativa ou conforme necessário para
              cumprir obrigações legais. Dados fiscais são retidos pelo prazo legal mínimo de 5 anos.
              Após o encerramento da conta, dados não obrigatórios são excluídos em até 90 dias.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Direitos do Titular</h2>
            <p>Conforme a LGPD, você tem direito a:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Confirmar a existência de tratamento dos seus dados</li>
              <li>Acessar, corrigir ou atualizar seus dados pessoais</li>
              <li>Solicitar a exclusão de dados desnecessários ou excessivos</li>
              <li>Solicitar a portabilidade dos seus dados</li>
              <li>Revogar o consentimento, quando aplicável</li>
              <li>Obter informações sobre com quem seus dados foram compartilhados</li>
            </ul>
            <p>
              Para exercer seus direitos, entre em contato conosco através dos canais informados
              na seção de contato.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Cookies e Tecnologias de Rastreamento</h2>
            <p>
              Utilizamos cookies essenciais para autenticação e funcionamento da Plataforma.
              Não utilizamos cookies de rastreamento para publicidade. Cookies de sessão são
              automaticamente removidos ao fechar o navegador.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Alterações nesta Política</h2>
            <p>
              Esta Política pode ser atualizada periodicamente. Alterações significativas serão
              comunicadas por e-mail ou notificação na Plataforma com antecedência mínima de 15 dias.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Contato</h2>
            <p>
              Para questões relacionadas à privacidade e proteção de dados, entre em contato com
              nosso Encarregado de Proteção de Dados (DPO) através do e-mail disponível na
              página de configurações da Plataforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
