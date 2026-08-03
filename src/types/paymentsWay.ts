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
  /**
   * id de dentix_clients. Puede ser null cuando el cliente no está en el listado
   * predefinido, igual que hacen exequias y hdi_seguro.
   */
  clientId: number | null;
  totalInstallments?: number;
  /**
   * Producto ('mascotas' | 'bienestar_plus') para la columna service_type.
   *
   * Cuando viene definido, el flujo reutiliza la suscripción pendiente del mismo
   * producto y cédula en lugar de crear una nueva fila. Si no viene, el
   * comportamiento es el de siempre: insertar y nada más.
   */
  serviceType?: string;
}

/**
 * Contenido de la columna `link_data` (jsonb).
 *
 * Las llaves `link_generado` y `link_corto` son un contrato COMPARTIDO con el backend
 * que procesa los pagos: no renombrarlas. Las demás son adicionales nuestras, igual
 * que hdi_seguro agrega `solicitud_id`.
 */
export interface LinkData {
  link_generado: string;
  link_corto: string | null;
  fecha_vencimiento?: string;
  actualizado_en?: string;
  /** Links previos que quedaron reemplazados, por si llega un pago sobre uno de ellos */
  links_anteriores?: Array<{
    link_generado: string;
    payment_person_id: string;
    reemplazado_en: string;
  }>;
}
