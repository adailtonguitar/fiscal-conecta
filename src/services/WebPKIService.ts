/**
 * WebPKIService — integration with Lacuna Web PKI for A3 certificate signing.
 * Handles certificate listing, selection, and XML signing via the local Web PKI agent.
 */
import LacunaWebPKI from "web-pki";

export interface CertificateInfo {
  thumbprint: string;
  subjectName: string;
  issuerName: string;
  validFrom: string;
  validTo: string;
  pkiBrazil?: {
    cpf?: string;
    cnpj?: string;
    companyName?: string;
  };
}

type WebPKIStatus = "not_started" | "initializing" | "ready" | "not_installed" | "error";

class WebPKIService {
  private pki: any = null;
  private _status: WebPKIStatus = "not_started";
  private _error: string | null = null;
  private initPromise: Promise<void> | null = null;

  get status() {
    return this._status;
  }

  get error() {
    return this._error;
  }

  get isReady() {
    return this._status === "ready";
  }

  /**
   * Initialize the Web PKI component. Safe to call multiple times.
   */
  async init(license?: string): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this._status = "initializing";
    this._error = null;

    this.initPromise = new Promise<void>((resolve, reject) => {
      this.pki = new LacunaWebPKI(license);

      this.pki.init({
        ready: () => {
          this._status = "ready";
          resolve();
        },
        notInstalled: () => {
          this._status = "not_installed";
          this._error = "Web PKI não está instalado. Instale em https://get.webpkiplugin.com";
          this.pki.redirectToInstallPage();
          reject(new Error(this._error));
        },
        defaultFail: (ex: any) => {
          this._status = "error";
          this._error = ex?.message || "Erro ao inicializar Web PKI";
          reject(new Error(this._error));
        },
      });
    });

    return this.initPromise;
  }

  /**
   * List all available digital certificates on the machine.
   */
  async listCertificates(): Promise<CertificateInfo[]> {
    this.ensureReady();

    return new Promise((resolve, reject) => {
      this.pki.listCertificates({
        selectId: "certificateSelect",
        selectOptionFormatter: (cert: any) => cert.subjectName,
      }).success((certs: any[]) => {
        const mapped: CertificateInfo[] = certs.map((c) => ({
          thumbprint: c.thumbprint,
          subjectName: c.subjectName,
          issuerName: c.issuerName,
          validFrom: c.validityStart,
          validTo: c.validityEnd,
          pkiBrazil: c.pkiBrazil
            ? {
                cpf: c.pkiBrazil.cpf,
                cnpj: c.pkiBrazil.cnpj,
                companyName: c.pkiBrazil.companyName,
              }
            : undefined,
        }));
        resolve(mapped);
      }).fail((err: any) => {
        reject(new Error(err?.message || "Erro ao listar certificados"));
      });
    });
  }

  /**
   * Sign data (hash or raw bytes) using the selected certificate.
   * @param thumbprint Certificate thumbprint
   * @param dataToSign Base64-encoded data to sign
   * @param digestAlgorithm Algorithm (default: SHA-256)
   */
  async signHash(
    thumbprint: string,
    dataToSign: string,
    digestAlgorithm = "SHA-256"
  ): Promise<string> {
    this.ensureReady();

    return new Promise((resolve, reject) => {
      this.pki
        .signHash({
          thumbprint,
          hash: dataToSign,
          digestAlgorithm,
        })
        .success((signature: string) => {
          resolve(signature);
        })
        .fail((err: any) => {
          reject(new Error(err?.message || "Erro ao assinar dados"));
        });
    });
  }

  /**
   * Sign raw data using the selected certificate.
   */
  async signData(thumbprint: string, dataToSign: string): Promise<string> {
    this.ensureReady();

    return new Promise((resolve, reject) => {
      this.pki
        .signData({
          thumbprint,
          data: dataToSign,
          digestAlgorithm: "SHA-256",
        })
        .success((signature: string) => {
          resolve(signature);
        })
        .fail((err: any) => {
          reject(new Error(err?.message || "Erro ao assinar dados"));
        });
    });
  }

  /**
   * Read the full certificate encoding (Base64 DER).
   */
  async readCertificate(thumbprint: string): Promise<string> {
    this.ensureReady();

    return new Promise((resolve, reject) => {
      this.pki
        .readCertificate(thumbprint)
        .success((certContent: string) => {
          resolve(certContent);
        })
        .fail((err: any) => {
          reject(new Error(err?.message || "Erro ao ler certificado"));
        });
    });
  }

  private ensureReady() {
    if (this._status !== "ready") {
      throw new Error(
        "Web PKI não está inicializado. Chame init() primeiro."
      );
    }
  }

  /**
   * Reset the service state (e.g., on logout or page change).
   */
  reset() {
    this._status = "not_started";
    this._error = null;
    this.initPromise = null;
    this.pki = null;
  }
}

// Singleton instance
export const webPKIService = new WebPKIService();
