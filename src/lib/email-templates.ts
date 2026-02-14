/**
 * Transactional email HTML templates for AnthoSystem.
 */

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 560px;
  margin: 0 auto;
  padding: 40px 24px;
  background: #ffffff;
`;

const btnStyle = `
  display: inline-block;
  padding: 12px 32px;
  background: #6366f1;
  color: #ffffff;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
`;

export function welcomeEmail(userName: string): { subject: string; html: string } {
  return {
    subject: "Bem-vindo ao AnthoSystem! 🎉",
    html: `
      <div style="${baseStyle}">
        <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 8px;">Bem-vindo, ${userName}!</h1>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          Sua conta no AnthoSystem foi criada com sucesso. Você já pode começar a configurar sua empresa e registrar vendas.
        </p>
        <div style="margin: 32px 0;">
          <h3 style="color: #1a1a2e; font-size: 16px;">Próximos passos:</h3>
          <ul style="color: #6b7280; font-size: 14px; line-height: 2;">
            <li>Complete o cadastro da sua empresa</li>
            <li>Adicione seus produtos</li>
            <li>Configure dados fiscais (NFC-e/SAT)</li>
            <li>Comece a vender no PDV</li>
          </ul>
        </div>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          AnthoSystem — Sistema de Vendas e Gestão Comercial
        </p>
      </div>
    `,
  };
}

export function passwordRecoveryEmail(resetLink: string): { subject: string; html: string } {
  return {
    subject: "Recuperação de Senha — AnthoSystem",
    html: `
      <div style="${baseStyle}">
        <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 8px;">Recuperação de Senha</h1>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          Você solicitou a recuperação de senha. Clique no botão abaixo para definir uma nova senha:
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="${btnStyle}">Redefinir Senha</a>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">
          Se você não solicitou esta alteração, ignore este e-mail. O link expira em 1 hora.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          AnthoSystem — Sistema de Vendas e Gestão Comercial
        </p>
      </div>
    `,
  };
}

export function inviteEmail(inviterName: string, companyName: string, inviteLink: string): { subject: string; html: string } {
  return {
    subject: `${inviterName} convidou você para ${companyName}`,
    html: `
      <div style="${baseStyle}">
        <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 8px;">Convite para ${companyName}</h1>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          <strong>${inviterName}</strong> convidou você para acessar o AnthoSystem da empresa <strong>${companyName}</strong>.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${inviteLink}" style="${btnStyle}">Aceitar Convite</a>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">
          Ao clicar, você será direcionado para criar sua senha de acesso.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
          AnthoSystem — Sistema de Vendas e Gestão Comercial
        </p>
      </div>
    `,
  };
}
