/**
 * LocalSignerService — integração com assinadores digitais locais para certificado A3.
 * 
 * Suporta agentes que rodam em localhost (ex: Assinador SERPRO, agentes PKCS#11 genéricos).
 * O agente local faz a ponte entre o navegador e o token/smartcard via REST API.
 * 
 * Fluxo:
 *   Browser → HTTP localhost:porta → Agente local → Token USB/Smartcard → Assinatura
 * 
 * Configuração padrão:
 *   - SERPRO: http://localhost:3003
 *   - Genérico: http://localhost:5765
 */

export interface CertificateInfo {
  thumbprint: string;
  subjectName: string;
  issuerName: string;
  validFrom: string;
  validTo: string;
  serialNumber?: string;
  pkiBrazil?: {
    cpf?: string;
    cnpj?: string;
    companyName?: string;
  };
}

export interface SignerConfig {
  /** URL base do agente local (ex: http://localhost:3003) */
  baseUrl: string;
  /** Nome do agente para exibição */
  agentName: string;
  /** Endpoints customizados */
  endpoints?: {
    status?: string;
    certificates?: string;
    sign?: string;
  };
}

const DEFAULT_CONFIGS: Record<string, SignerConfig> = {
  serpro: {
    baseUrl: "http://localhost:3003",
    agentName: "Assinador SERPRO",
    endpoints: {
      status: "/status",
      certificates: "/certificados",
      sign: "/assinar",
    },
  },
  generic: {
    baseUrl: "http://localhost:5765",
    agentName: "Assinador Local",
    endpoints: {
      status: "/api/status",
      certificates: "/api/certificates",
      sign: "/api/sign",
    },
  },
};

type SignerStatus = "not_started" | "checking" | "connected" | "not_found" | "error";

class LocalSignerService {
  private _status: SignerStatus = "not_started";
  private _error: string | null = null;
  private _config: SignerConfig = DEFAULT_CONFIGS.serpro;

  get status() {
    return this._status;
  }
  get error() {
    return this._error;
  }
  get isReady() {
    return this._status === "connected";
  }
  get agentName() {
    return this._config.agentName;
  }

  /**
   * Configure which signer agent to use.
   */
  setConfig(preset: "serpro" | "generic" | SignerConfig) {
    if (typeof preset === "string") {
      this._config = DEFAULT_CONFIGS[preset] || DEFAULT_CONFIGS.serpro;
    } else {
      this._config = preset;
    }
    this._status = "not_started";
    this._error = null;
  }

  /**
   * Check if the local signer agent is running.
   */
  async checkConnection(): Promise<boolean> {
    this._status = "checking";
    this._error = null;

    const endpoint = this._config.endpoints?.status || "/status";
    const url = `${this._config.baseUrl}${endpoint}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(url, {
        method: "GET",
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (response.ok) {
        this._status = "connected";
        return true;
      }

      this._status = "error";
      this._error = `Agente respondeu com status ${response.status}`;
      return false;
    } catch (err: any) {
      if (err.name === "AbortError") {
        this._status = "not_found";
        this._error = `${this._config.agentName} não encontrado em ${this._config.baseUrl}. Verifique se o programa está aberto.`;
      } else {
        this._status = "not_found";
        this._error = `Não foi possível conectar ao ${this._config.agentName}. Verifique se está instalado e em execução.`;
      }
      return false;
    }
  }

  /**
   * List certificates available on the connected token/smartcard.
   */
  async listCertificates(): Promise<CertificateInfo[]> {
    this.ensureReady();

    const endpoint = this._config.endpoints?.certificates || "/certificados";
    const url = `${this._config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro ao listar certificados: HTTP ${response.status}`);
      }

      const data = await response.json();

      // Normalize different agent response formats
      const certs: any[] = Array.isArray(data) ? data : data.certificados || data.certificates || [];

      return certs.map((c: any) => ({
        thumbprint: c.thumbprint || c.serialNumber || c.serial || "",
        subjectName: c.subjectName || c.subject || c.nome || c.cn || "",
        issuerName: c.issuerName || c.issuer || c.emissor || "",
        validFrom: c.validFrom || c.notBefore || c.validoDesde || "",
        validTo: c.validTo || c.notAfter || c.validoAte || "",
        serialNumber: c.serialNumber || c.serial || "",
        pkiBrazil: {
          cpf: c.cpf || c.pkiBrazil?.cpf || "",
          cnpj: c.cnpj || c.pkiBrazil?.cnpj || "",
          companyName: c.companyName || c.razaoSocial || c.pkiBrazil?.companyName || "",
        },
      }));
    } catch (err: any) {
      throw new Error(err.message || "Erro ao listar certificados do token");
    }
  }

  /**
   * Sign XML content using the selected certificate.
   * @param thumbprint Certificate identifier
   * @param xmlContent XML string or Base64 content to sign
   * @param signatureType Type of signature (e.g., "xmldsig", "xades")
   */
  async signXml(
    thumbprint: string,
    xmlContent: string,
    signatureType = "xmldsig"
  ): Promise<string> {
    this.ensureReady();

    const endpoint = this._config.endpoints?.sign || "/assinar";
    const url = `${this._config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thumbprint,
          certificado: thumbprint,
          xml: xmlContent,
          content: xmlContent,
          type: signatureType,
          algoritmo: "SHA-256",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || errorData.erro || `Erro ao assinar: HTTP ${response.status}`
        );
      }

      const data = await response.json();
      return data.signedXml || data.xmlAssinado || data.signature || data.assinatura || "";
    } catch (err: any) {
      throw new Error(err.message || "Erro ao assinar XML");
    }
  }

  /**
   * Sign a hash using the selected certificate.
   */
  async signHash(
    thumbprint: string,
    hash: string,
    algorithm = "SHA-256"
  ): Promise<string> {
    this.ensureReady();

    const endpoint = this._config.endpoints?.sign || "/assinar";
    const url = `${this._config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thumbprint,
          certificado: thumbprint,
          hash,
          algoritmo: algorithm,
          tipo: "hash",
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao assinar hash: HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.signature || data.assinatura || "";
    } catch (err: any) {
      throw new Error(err.message || "Erro ao assinar hash");
    }
  }

  private ensureReady() {
    if (this._status !== "connected") {
      throw new Error(
        `${this._config.agentName} não está conectado. Verifique a conexão primeiro.`
      );
    }
  }

  reset() {
    this._status = "not_started";
    this._error = null;
  }
}

// Singleton
export const localSignerService = new LocalSignerService();
