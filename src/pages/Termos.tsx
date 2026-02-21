import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Termos() {
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

        <h1 className="text-3xl font-bold text-foreground mb-2">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-10">Última atualização: 10 de fevereiro de 2026</p>

        <div className="prose prose-sm max-w-none text-foreground/90 space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar ou utilizar nossa plataforma de gestão comercial e ponto de venda ("Plataforma"), você concorda
              em estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos,
              não poderá acessar ou utilizar nossos serviços.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">2. Descrição do Serviço</h2>
            <p>
              A Plataforma fornece um sistema de gestão comercial online (SaaS) que inclui, entre outros:
              ponto de venda (PDV), controle de estoque, gestão financeira, emissão de documentos fiscais
              (NF-e, NFC-e), relatórios gerenciais e ferramentas de administração empresarial.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">3. Cadastro e Conta</h2>
            <p>
              Para utilizar a Plataforma, é necessário criar uma conta fornecendo informações verdadeiras,
              completas e atualizadas. Você é responsável por manter a confidencialidade das suas credenciais
              de acesso e por todas as atividades realizadas em sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">4. Planos e Pagamentos</h2>
            <p>
              O acesso aos serviços está condicionado à contratação de um plano de assinatura.
              Os valores, funcionalidades e limites de cada plano estão descritos na página de preços.
              O não pagamento poderá resultar na suspensão ou cancelamento do acesso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">5. Uso Aceitável</h2>
            <p>Você concorda em não:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Utilizar a Plataforma para fins ilegais ou não autorizados</li>
              <li>Tentar acessar sistemas ou dados de outros usuários</li>
              <li>Interferir no funcionamento da Plataforma ou de seus servidores</li>
              <li>Reproduzir, duplicar ou revender qualquer parte do serviço sem autorização</li>
              <li>Utilizar a Plataforma para emitir documentos fiscais fraudulentos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">6. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo, design, código-fonte, marcas e demais elementos da Plataforma são
              de propriedade exclusiva da empresa e estão protegidos pelas leis de propriedade intelectual.
              Os dados inseridos por você permanecem de sua propriedade.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">7. Disponibilidade e Suporte</h2>
            <p>
              Nos comprometemos a manter a Plataforma disponível 24 horas por dia, 7 dias por semana,
              ressalvados períodos de manutenção programada ou eventos de força maior.
              O suporte técnico está disponível nos canais informados na Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">8. Limitação de Responsabilidade</h2>
            <p>
              A Plataforma é fornecida "como está". Não nos responsabilizamos por danos indiretos,
              incidentais ou consequentes decorrentes do uso ou da impossibilidade de uso dos serviços,
              incluindo perda de dados, lucros cessantes ou interrupção de negócios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">9. Rescisão</h2>
            <p>
              Qualquer parte pode rescindir esta relação a qualquer momento. Após a rescisão,
              seus dados ficarão disponíveis para exportação por 30 dias, após os quais poderão ser excluídos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">10. Alterações nos Termos</h2>
            <p>
              Reservamos o direito de modificar estes Termos a qualquer momento. Alterações significativas
              serão comunicadas com antecedência de 30 dias. O uso continuado da Plataforma após as alterações
              constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground">11. Foro</h2>
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil.
              Fica eleito o foro da comarca da sede da empresa para dirimir quaisquer controvérsias.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
