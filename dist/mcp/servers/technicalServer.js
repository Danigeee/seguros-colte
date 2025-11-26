import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// Crear servidor MCP para soporte técnico
const server = new McpServer({
    name: "technical-server",
    version: "1.0.0",
});
// Base de conocimientos de problemas comunes
const COMMON_ISSUES = {
    no_enciende: {
        keywords: ["no enciende", "no prende", "sin energía", "apagado"],
        solutions: [
            "Verificar conexión eléctrica y cable de alimentación",
            "Revisar fusibles y breakers del tablero principal",
            "Comprobar interruptor principal del equipo",
            "Verificar que el voltaje sea el correcto (220V/380V)",
            "Revisar conexiones internas si es técnico calificado",
        ],
        priority: "Alta",
        estimatedTime: "30-60 minutos",
        requiresTechnician: false,
    },
    no_funciona: {
        keywords: ["no funciona", "no responde", "falla", "error"],
        solutions: [
            "Reiniciar el equipo (desconectar 30 segundos)",
            "Verificar configuración según manual de usuario",
            "Comprobar todas las conexiones de red/cables",
            "Revisar configuración de software/panel digital",
            "Actualizar firmware si está disponible",
        ],
        priority: "Media",
        estimatedTime: "15-45 minutos",
        requiresTechnician: false,
    },
    ruido_extraño: {
        keywords: ["ruido", "sonido", "zumbido", "vibración"],
        solutions: [
            "Lubricar partes móviles según manual",
            "Verificar tornillos y sujeciones estén apretados",
            "Revisar que no haya objetos extraños en la amasadora/cutter",
            "Limpiar ventiladores y componentes internos",
            "Contactar servicio técnico si persiste",
        ],
        priority: "Media",
        estimatedTime: "20-40 minutos",
        requiresTechnician: true,
    },
    error_temperatura: {
        keywords: ["temperatura", "calienta mucho", "no calienta", "error temp"],
        solutions: [
            "Verificar sensores de temperatura",
            "Revisar termostato y panel de control",
            "Limpiar resistencias y ventiladores",
            "Ajustar parámetros en el panel digital",
            "Solicitar revisión técnica si persiste",
        ],
        priority: "Alta",
        estimatedTime: "30-60 minutos",
        requiresTechnician: true,
    },
    mezcla_incompleta: {
        keywords: ["mezcla incompleta", "no mezcla bien", "amasado irregular"],
        solutions: [
            "Verificar cantidad y tipo de ingredientes",
            "Ajustar velocidad y tiempo de amasado",
            "Revisar palas o brazos de la amasadora",
            "Limpiar el recipiente y accesorios",
            "Consultar manual técnico para calibración",
        ],
        priority: "Baja",
        estimatedTime: "10-20 minutos",
        requiresTechnician: false,
    },
};
// Base de datos de técnicos disponibles
const TECHNICIANS = {
    TECH001: {
        name: "Carlos Restrepo",
        specialties: ["panadería", "cárnicos", "chocolates"],
        zone: "Bogotá",
        available: true,
        rating: 4.8,
    },
    TECH002: {
        name: "Ana Rodríguez",
        specialties: ["agroindustria", "horeca", "vending"],
        zone: "Medellín",
        available: true,
        rating: 4.9,
    },
    TECH003: {
        name: "Luis Martínez",
        specialties: ["panadería", "chocolates", "equipos industriales"],
        zone: "Cali",
        available: false,
        rating: 4.7,
    },
};
// Herramienta para diagnóstico técnico
server.registerTool("diagnose_technical_issue", {
    title: "Diagnóstico Técnico Inteligente",
    description: "Diagnostica problemas técnicos con productos y proporciona soluciones paso a paso",
    inputSchema: {
        issueDescription: z
            .string()
            .describe("Descripción detallada del problema"),
        productModel: z
            .string()
            .describe("Modelo del producto con problemas (ej: CAM001, ALM002)"),
        symptoms: z
            .array(z.string())
            .optional()
            .describe("Lista de síntomas específicos observados"),
        urgency: z
            .enum(["baja", "media", "alta", "critica"])
            .optional()
            .default("media")
            .describe("Nivel de urgencia del problema"),
    },
}, async ({ issueDescription, productModel, symptoms, urgency }) => {
    // Análisis inteligente basado en palabras clave
    let matchedIssue = null;
    let matchedKey = "";
    let confidence = 0;
    for (const [key, issue] of Object.entries(COMMON_ISSUES)) {
        const allText = [issueDescription, ...(symptoms || [])]
            .join(" ")
            .toLowerCase();
        const matches = issue.keywords.filter((keyword) => allText.includes(keyword));
        if (matches.length > 0) {
            const currentConfidence = matches.length / issue.keywords.length;
            if (currentConfidence > confidence) {
                confidence = currentConfidence;
                matchedIssue = issue;
                matchedKey = key;
            }
        }
    }
    const confidencePercentage = Math.round(confidence * 100);
    if (!matchedIssue || confidence < 0.3) {
        return {
            content: [
                {
                    type: "text",
                    text: `🔧 DIAGNÓSTICO TÉCNICO - ${productModel}\n\n` +
                        `❓ Problema reportado: ${issueDescription}\n` +
                        `⚠️ No se pudo identificar un diagnóstico específico\n` +
                        `📊 Confianza del análisis: ${confidencePercentage}%\n\n` +
                        `🔍 RECOMENDACIONES GENERALES:\n` +
                        `1. Verificar conexiones básicas (energía, cables)\n` +
                        `2. Reiniciar el dispositivo completamente\n` +
                        `3. Consultar manual del usuario\n` +
                        `4. Contactar soporte técnico especializado\n\n` +
                        `📋 Síntomas reportados: ${symptoms?.join(", ") || "Ninguno especificado"}\n` +
                        `🚨 Urgencia: ${urgency}\n` +
                        `📞 Soporte: +57 1 234 5678 ext. 2`,
                },
            ],
        };
    }
    const requiresVisit = matchedIssue.requiresTechnician || urgency === "critica";
    return {
        content: [
            {
                type: "text",
                text: `🔧 DIAGNÓSTICO TÉCNICO - ${productModel}\n\n` +
                    `❓ Problema identificado: ${matchedKey
                        .replace(/_/g, " ")
                        .toUpperCase()}\n` +
                    `📊 Confianza del diagnóstico: ${confidencePercentage}%\n` +
                    `⚡ Prioridad: ${matchedIssue.priority}\n` +
                    `⏱️ Tiempo estimado de solución: ${matchedIssue.estimatedTime}\n` +
                    `🚨 Urgencia reportada: ${urgency}\n\n` +
                    `🛠️ SOLUCIONES RECOMENDADAS:\n` +
                    matchedIssue.solutions
                        .map((solution, index) => `${index + 1}. ${solution}`)
                        .join("\n") +
                    "\n\n" +
                    `📋 Síntomas analizados: ${symptoms?.join(", ") || "Descripción general"}\n\n` +
                    (requiresVisit
                        ? `👨‍🔧 REQUIERE VISITA TÉCNICA:\n` +
                            `   • Problema complejo o crítico\n` +
                            `   • Se recomienda asistencia profesional\n` +
                            `   • Programar cita con técnico especializado\n\n`
                        : `✅ PUEDE RESOLVERSE REMOTAMENTE:\n` +
                            `   • Siga las instrucciones paso a paso\n` +
                            `   • Contacte si persiste el problema\n\n`) +
                    `📞 CONTACTO SOPORTE:\n` +
                    `   • Teléfono: +57 1 234 5678 ext. 2\n` +
                    `   • Email: soporte@fenixproducciones.com\n` +
                    `   • Horario: Lunes a Viernes 8:00 AM - 6:00 PM`,
            },
        ],
    };
});
// Herramienta para programar mantenimiento
server.registerTool("schedule_maintenance", {
    title: "Programador de Mantenimiento",
    description: "Programa mantenimiento técnico preventivo o correctivo",
    inputSchema: {
        customerId: z.string().describe("ID del cliente"),
        productId: z.string().describe("ID del producto o modelo"),
        preferredDate: z.string().describe("Fecha preferida (YYYY-MM-DD)"),
        maintenanceType: z
            .enum(["preventivo", "correctivo", "emergencia", "instalacion"])
            .describe("Tipo de mantenimiento"),
        preferredTime: z
            .enum(["mañana", "tarde", "noche"])
            .optional()
            .default("mañana")
            .describe("Horario preferido"),
        address: z.string().describe("Dirección para la visita técnica"),
        contactPhone: z.string().describe("Teléfono de contacto"),
    },
}, async ({ customerId, productId, preferredDate, maintenanceType, preferredTime, address, contactPhone, }) => {
    const appointmentId = `MT-${Date.now()}`;
    // Simular verificación de disponibilidad basada en fecha y horario
    const requestDate = new Date(preferredDate);
    const today = new Date();
    const isWeekend = requestDate.getDay() === 0 || requestDate.getDay() === 6;
    const isPastDate = requestDate < today;
    // Encontrar técnico disponible
    const availableTechnicians = Object.entries(TECHNICIANS)
        .filter(([_, tech]) => tech.available)
        .sort((a, b) => b[1].rating - a[1].rating);
    if (isPastDate) {
        return {
            content: [
                {
                    type: "text",
                    text: `❌ Error en programación de mantenimiento:\n\n` +
                        `📅 La fecha ${preferredDate} ya pasó\n` +
                        `🔄 Fechas disponibles a partir de: ${new Date(today.getTime() + 86400000).toISOString().split("T")[0]}\n` +
                        `📞 Contactar para reprogramar: +57 1 234 5678 ext. 2`,
                },
            ],
            isError: true,
        };
    }
    if (availableTechnicians.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: `⚠️ No hay técnicos disponibles para la fecha solicitada\n\n` +
                        `📅 Fecha solicitada: ${preferredDate}\n` +
                        `🔄 Fechas alternativas disponibles:\n` +
                        `   • ${new Date(today.getTime() + 172800000)
                            .toISOString()
                            .split("T")[0]}\n` +
                        `   • ${new Date(today.getTime() + 259200000)
                            .toISOString()
                            .split("T")[0]}\n` +
                        `   • ${new Date(today.getTime() + 345600000)
                            .toISOString()
                            .split("T")[0]}\n` +
                        `📞 Contactar para reprogramar: +57 1 234 5678 ext. 2`,
                },
            ],
        };
    }
    const assignedTechnician = availableTechnicians[0][1];
    const timeSlots = {
        mañana: "8:00 AM - 12:00 PM",
        tarde: "1:00 PM - 5:00 PM",
        noche: "6:00 PM - 8:00 PM",
    };
    const costs = {
        preventivo: 80000,
        correctivo: 120000,
        emergencia: 200000,
        instalacion: 150000,
    };
    const isAvailable = !isWeekend && Math.random() > 0.2; // 80% probabilidad en días laborales
    if (!isAvailable) {
        return {
            content: [
                {
                    type: "text",
                    text: `⚠️ Horario no disponible para ${preferredDate}\n\n` +
                        `🕐 Horario solicitado: ${timeSlots[preferredTime]}\n` +
                        `📅 Fechas alternativas disponibles:\n` +
                        `   • ${new Date(requestDate.getTime() + 86400000)
                            .toISOString()
                            .split("T")[0]} - ${timeSlots[preferredTime]}\n` +
                        `   • ${new Date(requestDate.getTime() + 172800000)
                            .toISOString()
                            .split("T")[0]} - ${timeSlots[preferredTime]}\n` +
                        `   • ${preferredDate} - ${preferredTime === "mañana"
                            ? "1:00 PM - 5:00 PM"
                            : "8:00 AM - 12:00 PM"}\n` +
                        `📞 Contactar para confirmar: +57 1 234 5678 ext. 2`,
                },
            ],
        };
    }
    return {
        content: [
            {
                type: "text",
                text: `✅ MANTENIMIENTO PROGRAMADO EXITOSAMENTE\n\n` +
                    `🆔 ID de cita: ${appointmentId}\n` +
                    `👤 Cliente: ${customerId}\n` +
                    `📦 Producto/Modelo: ${productId}\n` +
                    `📅 Fecha: ${preferredDate}\n` +
                    `🕐 Horario: ${timeSlots[preferredTime]}\n` +
                    `🔧 Tipo: ${maintenanceType.toUpperCase()}\n\n` +
                    `👨‍🔧 TÉCNICO ASIGNADO:\n` +
                    `   • Nombre: ${assignedTechnician.name}\n` +
                    `   • Especialidades: ${assignedTechnician.specialties.join(", ")}\n` +
                    `   • Calificación: ⭐ ${assignedTechnician.rating}/5.0\n` +
                    `   • Zona: ${assignedTechnician.zone}\n\n` +
                    `📍 DIRECCIÓN DE SERVICIO:\n` +
                    `   ${address}\n\n` +
                    `📞 CONTACTO:\n` +
                    `   • Cliente: ${contactPhone}\n` +
                    `   • Técnico: +57 300 ${Math.floor(Math.random() * 900) + 100} ${Math.floor(Math.random() * 9000) + 1000}\n\n` +
                    `💰 INFORMACIÓN DE COSTOS:\n` +
                    `   • Visita técnica: $${costs[maintenanceType].toLocaleString()}\n` +
                    `   • Diagnóstico incluido: Sí\n` +
                    `   • Repuestos: Cotización adicional\n\n` +
                    `📋 RECOMENDACIONES:\n` +
                    `   • Tener disponible el manual del producto\n` +
                    `   • Asegurar acceso al área de trabajo\n` +
                    `   • Preparar documentos de compra/garantía\n\n` +
                    `🔔 RECORDATORIOS:\n` +
                    `   • SMS 24 horas antes\n` +
                    `   • Llamada 2 horas antes\n` +
                    `   • Cancelación gratuita hasta 4 horas antes`,
            },
        ],
    };
});
// Herramienta para verificar garantía
server.registerTool("check_warranty_status", {
    title: "Verificador de Garantía",
    description: "Verifica el estado de garantía de un producto con detalles completos",
    inputSchema: {
        serialNumber: z.string().describe("Número de serie del producto"),
        productModel: z.string().optional().describe("Modelo del producto"),
        purchaseDate: z
            .string()
            .optional()
            .describe("Fecha de compra (YYYY-MM-DD)"),
    },
}, async ({ serialNumber, productModel, purchaseDate }) => {
    // Simular verificación de garantía
    const mockPurchaseDate = purchaseDate ||
        `2023-${Math.floor(Math.random() * 12) + 1}-${Math.floor(Math.random() * 28) + 1}`;
    const purchaseDateObj = new Date(mockPurchaseDate);
    const currentDate = new Date();
    const daysDiff = Math.floor((currentDate.getTime() - purchaseDateObj.getTime()) /
        (1000 * 60 * 60 * 24));
    // Diferentes períodos de garantía según el tipo de producto
    const warrantyPeriods = {
        CAM: 730, // 2 años para cámaras
        ALM: 1095, // 3 años para alarmas
        CER: 1460, // 4 años para cercas eléctricas
    };
    const productType = productModel?.substring(0, 3) || serialNumber.substring(0, 3);
    const warrantyPeriod = warrantyPeriods[productType] || 365;
    const remainingDays = warrantyPeriod - daysDiff;
    const isUnderWarranty = remainingDays > 0;
    // Simular información adicional
    const warrantyType = isUnderWarranty
        ? "Garantía del fabricante"
        : "Garantía vencida";
    const coverageLevel = daysDiff < warrantyPeriod * 0.5
        ? "Completa"
        : daysDiff < warrantyPeriod * 0.8
            ? "Parcial"
            : "Básica";
    return {
        content: [
            {
                type: "text",
                text: `🛡️ ESTADO DE GARANTÍA DETALLADO\n\n` +
                    `🔢 Número de serie: ${serialNumber}\n` +
                    `📦 Modelo: ${productModel || "No especificado"}\n` +
                    `📅 Fecha de compra: ${mockPurchaseDate}\n` +
                    `📊 Estado: ${isUnderWarranty ? "✅ BAJO GARANTÍA" : "❌ GARANTÍA VENCIDA"}\n\n` +
                    `⏱️ INFORMACIÓN TEMPORAL:\n` +
                    (isUnderWarranty
                        ? `   • Días restantes: ${remainingDays} días\n` +
                            `   • Fecha de vencimiento: ${new Date(purchaseDateObj.getTime() +
                                warrantyPeriod * 24 * 60 * 60 * 1000).toLocaleDateString()}\n` +
                            `   • Porcentaje restante: ${Math.round((remainingDays / warrantyPeriod) * 100)}%\n`
                        : `   • Vencida hace: ${Math.abs(remainingDays)} días\n` +
                            `   • Fecha de vencimiento: ${new Date(purchaseDateObj.getTime() +
                                warrantyPeriod * 24 * 60 * 60 * 1000).toLocaleDateString()}\n`) +
                    "\n" +
                    `📋 COBERTURA DE GARANTÍA:\n` +
                    (isUnderWarranty
                        ? `   • Nivel de cobertura: ${coverageLevel}\n` +
                            `   • Defectos de fabricación: ✅ Cubierto\n` +
                            `   • Fallas técnicas: ✅ Cubierto\n` +
                            `   • Repuestos originales: ✅ Cubierto\n` +
                            `   • Mano de obra: ✅ Cubierto\n` +
                            `   • Daños por mal uso: ❌ No cubierto\n` +
                            `   • Daños por agua: ❌ No cubierto\n`
                        : `   • Cobertura expirada\n` +
                            `   • Servicio técnico: Tarifa estándar\n` +
                            `   • Repuestos: Costo adicional\n`) +
                    "\n" +
                    `💰 INFORMACIÓN DE COSTOS:\n` +
                    (isUnderWarranty
                        ? `   • Diagnóstico: GRATIS\n` +
                            `   • Reparación: GRATIS (si aplica garantía)\n` +
                            `   • Visita técnica: GRATIS\n` +
                            `   • Repuestos: GRATIS (defectos de fábrica)\n`
                        : `   • Diagnóstico: $50,000\n` +
                            `   • Visita técnica: $80,000\n` +
                            `   • Reparación: Según cotización\n` +
                            `   • Repuestos: Precio de lista\n`) +
                    "\n" +
                    `📞 PROCESO DE RECLAMACIÓN:\n` +
                    `   1. Contactar soporte técnico\n` +
                    `   2. Proporcionar número de serie\n` +
                    `   3. Describir el problema detalladamente\n` +
                    `   4. Programar visita técnica (si es necesario)\n` +
                    `   5. Evaluación y diagnóstico\n\n` +
                    `📧 CONTACTOS PARA GARANTÍA:\n` +
                    `   • Email: garantias@fenixproducciones.com\n` +
                    `   • Teléfono: +57 1 234 5678 ext. 3\n` +
                    `   • WhatsApp: +57 300 123 4567\n` +
                    `   • Horario: Lunes a Viernes 8:00 AM - 5:00 PM\n\n` +
                    (isUnderWarranty && remainingDays < 90
                        ? `⚠️ AVISO: Su garantía vence en menos de 3 meses.\n` +
                            `💡 Considere adquirir una extensión de garantía.\n`
                        : ""),
            },
        ],
    };
});
// Herramienta para obtener manuales técnicos
server.registerTool("get_technical_manual", {
    title: "Biblioteca de Manuales Técnicos",
    description: "Obtiene manuales técnicos, guías de instalación y documentación",
    inputSchema: {
        productModel: z.string().describe("Modelo del producto"),
        documentType: z
            .enum([
            "manual_usuario",
            "manual_tecnico",
            "guia_instalacion",
            "diagrama_cableado",
            "especificaciones",
            "troubleshooting",
        ])
            .describe("Tipo de documento solicitado"),
        language: z
            .enum(["español", "ingles"])
            .optional()
            .default("español")
            .describe("Idioma del documento"),
    },
}, async ({ productModel, documentType, language }) => {
    // Simular biblioteca de documentos
    const documents = {
        PAN001: {
            manual_usuario: { pages: 45, size: "2.3 MB", version: "v3.2" },
            manual_tecnico: { pages: 78, size: "4.1 MB", version: "v3.2" },
            guia_instalacion: { pages: 12, size: "1.8 MB", version: "v2.1" },
            diagrama_cableado: { pages: 6, size: "850 KB", version: "v2.0" },
            especificaciones: { pages: 8, size: "650 KB", version: "v3.0" },
            troubleshooting: { pages: 25, size: "1.5 MB", version: "v2.8" },
        },
        CHO001: {
            manual_usuario: { pages: 32, size: "1.9 MB", version: "v2.5" },
            manual_tecnico: { pages: 65, size: "3.8 MB", version: "v2.5" },
            guia_instalacion: { pages: 18, size: "2.2 MB", version: "v1.8" },
            diagrama_cableado: { pages: 10, size: "1.1 MB", version: "v1.9" },
            especificaciones: { pages: 6, size: "580 KB", version: "v2.3" },
            troubleshooting: { pages: 22, size: "1.3 MB", version: "v2.1" },
        },
    };
    const productDocs = documents[productModel];
    if (!productDocs) {
        return {
            content: [
                {
                    type: "text",
                    text: `❌ No se encontraron documentos para el modelo ${productModel}\n\n` +
                        `📋 Modelos disponibles en biblioteca:\n` +
                        Object.keys(documents).join(", ") +
                        "\n\n" +
                        `📞 Para solicitar documentos de otros modelos:\n` +
                        `   • Email: documentos@fenixproducciones.com\n` +
                        `   • Teléfono: +57 1 234 5678 ext. 4`,
                },
            ],
            isError: true,
        };
    }
    const requestedDoc = productDocs[documentType];
    if (!requestedDoc) {
        return {
            content: [
                {
                    type: "text",
                    text: `❌ Documento "${documentType}" no disponible para ${productModel}\n\n` +
                        `📋 Documentos disponibles:\n` +
                        Object.keys(productDocs)
                            .map((doc) => `   • ${doc.replace(/_/g, " ")}`)
                            .join("\n"),
                },
            ],
            isError: true,
        };
    }
    const downloadUrl = `https://docs.fenixproducciones.com/${productModel}/${documentType}_${language}.pdf`;
    const qrCode = `QR-${productModel}-${documentType}`;
    return {
        content: [
            {
                type: "text",
                text: `📚 MANUAL TÉCNICO ENCONTRADO\n\n` +
                    `📦 Producto: ${productModel}\n` +
                    `📄 Documento: ${documentType.replace(/_/g, " ").toUpperCase()}\n` +
                    `🌐 Idioma: ${language}\n` +
                    `📊 Páginas: ${requestedDoc.pages}\n` +
                    `💾 Tamaño: ${requestedDoc.size}\n` +
                    `🔢 Versión: ${requestedDoc.version}\n\n` +
                    `⬇️ OPCIONES DE DESCARGA:\n` +
                    `   • Link directo: ${downloadUrl}\n` +
                    `   • Código QR: ${qrCode}\n` +
                    `   • Email automático: Disponible\n\n` +
                    `📋 CONTENIDO DEL DOCUMENTO:\n` +
                    (documentType === "manual_usuario"
                        ? `   • Características del producto\n` +
                            `   • Instrucciones de uso\n` +
                            `   • Configuración básica\n` +
                            `   • Mantenimiento preventivo\n` +
                            `   • Solución de problemas básicos\n`
                        : documentType === "manual_tecnico"
                            ? `   • Especificaciones técnicas detalladas\n` +
                                `   • Diagramas de componentes\n` +
                                `   • Procedimientos de reparación\n` +
                                `   • Códigos de error\n` +
                                `   • Calibración y ajustes\n`
                            : documentType === "guia_instalacion"
                                ? `   • Requisitos previos\n` +
                                    `   • Herramientas necesarias\n` +
                                    `   • Paso a paso de instalación\n` +
                                    `   • Configuración inicial\n` +
                                    `   • Verificación de funcionamiento\n`
                                : documentType === "diagrama_cableado"
                                    ? `   • Esquemas eléctricos\n` +
                                        `   • Conexiones de alimentación\n` +
                                        `   • Cableado de señales\n` +
                                        `   • Códigos de colores\n` +
                                        `   • Puntos de conexión\n`
                                    : documentType === "especificaciones"
                                        ? `   • Dimensiones físicas\n` +
                                            `   • Características eléctricas\n` +
                                            `   • Condiciones ambientales\n` +
                                            `   • Certificaciones\n` +
                                            `   • Compatibilidades\n`
                                        : `   • Problemas comunes\n` +
                                            `   • Soluciones paso a paso\n` +
                                            `   • Códigos de error\n` +
                                            `   • Herramientas de diagnóstico\n` +
                                            `   • Contactos de soporte\n`) +
                    "\n" +
                    `📧 ENVÍO POR EMAIL:\n` +
                    `   Para recibir el documento por correo electrónico,\n` +
                    `   envíe solicitud a: documentos@fenixproducciones.com\n` +
                    `   Incluya: modelo, tipo de documento e idioma\n\n` +
                    `⚡ ACCESO RÁPIDO:\n` +
                    `   • Portal web: docs.fenixproducciones.com\n` +
                    `   • App móvil: Fenix Docs (iOS/Android)\n` +
                    `   • Soporte técnico: +57 1 234 5678 ext. 4`,
            },
        ],
    };
});
// Iniciar servidor solo si se ejecuta directamente
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("🔧 Servidor MCP Técnico iniciado correctamente");
}
// Solo ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error("❌ Error iniciando servidor técnico:", error);
        process.exit(1);
    });
}
export { server };
