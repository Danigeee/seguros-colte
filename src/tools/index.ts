// Exportaciones limpias y mínimas de herramientas
import { crmTools } from "./crmTools";
import { bienestarTools } from "./bienestarTools";
import { sharedTools } from "./sharedTools";

export { crmTools } from "./crmTools";
export { lookupOrCreateClientTool, manageQuoteContextTool, searchAndAddItemTool } from "./crmTools";

export { bienestarTools } from "./bienestarTools";
export { consultBienestarSpecialistTool, searchBienestarDocumentsTool } from "./bienestarTools";

export { sharedTools } from "./sharedTools";
export { sendPaymentLinkEmailTool, } from "./sharedTools";

// Nota: este archivo proporciona una entrada sencilla a las herramientas del proyecto.
