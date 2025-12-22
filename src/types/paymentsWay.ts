export interface CreatePersonRequest {
  firstname: string;
  lastname: string;
  ididentificationtype: string; // "4" para Cédula de Ciudadanía
  identification: string;
  email: string;
  phone: string;
}

export interface CreatePersonResponse {
  id: string | number;
  firstname: string;
  lastname: string;
  identification: string;
  email: string;
  phone: string;
  // ... otros campos si son necesarios
}

export interface CreatePaymentLinkRequest {
  amount: number;
  descripcion: string;
  currency: string; // "COP"
  terminal_id: number;
  id_form: number;
  fecha_vencimiento: string; // YYYY/MM/DD
  status: boolean;
  services: number[]; // [1]
  idperson: number;
}

export interface CreatePaymentLinkResponse {
  id: string;
  amount: string;
  descripcion: string;
  linkgenerado: string;
  linkcorto: string;
  // ... otros campos
}

export interface PaymentFlowRequest {
  firstname: string;
  lastname: string;
  identification: string;
  email: string;
  phone: string;
  amount: number;
  description: string;
  clientId: number;
  totalInstallments?: number;
}
