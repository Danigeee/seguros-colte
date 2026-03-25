export interface MeFiaPayload {
  nombresApellidos: string;
  tipoIdentificacion: string;
  numeroIdentificacion: string;
  fechaNacimiento: string; // ISO or similar format
  lugarNacimiento: string;
  sexo: string;
  direccionResidencia: string;
  ciudad: string;
  departamento: string;
  paisResidencia: string;
  telefono: string;
  email: string;
}
