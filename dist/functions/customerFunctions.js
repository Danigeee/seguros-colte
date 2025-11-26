// ==========================================
// FUNCIONES DE SERVICIO AL CLIENTE
// ==========================================
/**
 * Base de conocimientos FAQ (Preguntas Frecuentes)
 */
const FAQ_DATABASE = {
    pagos: [
        {
            question: "¿Cuáles son las formas de pago disponibles?",
            answer: "Aceptamos: Efectivo, Tarjetas de crédito/débito, Transferencias bancarias, Cheques, Financiación hasta 12 meses sin interés.",
            keywords: ["pago", "formas", "tarjeta", "efectivo", "financiación"],
        },
        {
            question: "¿Ofrecen financiación?",
            answer: "Sí, ofrecemos financiación hasta 12 meses sin interés para compras superiores a $2.000.000. También trabajamos con entidades financieras para créditos a mayor plazo.",
            keywords: ["financiación", "crédito", "cuotas", "interés"],
        },
        {
            question: "¿Cuál es el tiempo de procesamiento de pagos?",
            answer: "- Efectivo: Procesamiento inmediato\n- Tarjetas: 1-2 días hábiles\n- Transferencias: 1-3 días hábiles\n- Cheques: 3-5 días hábiles",
            keywords: ["procesamiento", "tiempo", "días", "hábiles"],
        },
    ],
    logistica: [
        {
            question: "¿Realizan envíos a toda Colombia?",
            answer: "Sí, enviamos a todo el territorio nacional. Tenemos cobertura especial en Antioquia, Córdoba, Chocó, Norte de Santander, Guainía, Boyacá y Arauca.",
            keywords: ["envíos", "colombia", "cobertura", "nacional"],
        },
        {
            question: "¿Cuánto tiempo toma el envío?",
            answer: "- Bogotá y área metropolitana: 1-2 días\n- Ciudades principales: 3-5 días\n- Zonas rurales: 5-8 días\n- Instalación incluida: +2 días adicionales",
            keywords: ["tiempo", "envío", "días", "entrega"],
        },
        {
            question: "¿El envío tiene costo?",
            answer: "Envío GRATIS para compras superiores a $1.500.000. Para compras menores, el costo varía según destino: $50.000 - $200.000.",
            keywords: ["costo", "envío", "gratis", "precio"],
        },
    ],
    garantias: [
        {
            question: "¿Qué garantía tienen los productos?",
            answer: "Garantía estándar:\n- Panadería: 2 años\n- Cárnicos: 3 años\n- Chocolates: 2 años\n- Agroindustria: 2 años\n- Horeca: 1 año\n- Vending: 2 años",
            keywords: ["garantía", "años", "cobertura", "productos"],
        },
        {
            question: "¿Qué cubre la garantía?",
            answer: "La garantía cubre defectos de fabricación, fallas en componentes originales, mano de obra y repuestos. NO cubre daños por mal uso, desgaste normal o modificaciones no autorizadas.",
            keywords: ["cubre", "incluye", "defectos", "repuestos"],
        },
        {
            question: "¿Cómo hacer válida la garantía?",
            answer: "Para hacer válida la garantía necesitas: Factura de compra, Descripción del problema, Número de serie del equipo, Contactar al 1-234-5678 ext. 3",
            keywords: ["hacer", "válida", "requisitos", "factura"],
        },
    ],
    instalacion: [
        {
            question: "¿Incluye instalación?",
            answer: "La instalación está incluida GRATIS en equipos superiores a $2.000.000. Para otros equipos, el costo es del 15% del valor del producto.",
            keywords: ["instalación", "incluida", "costo", "gratis"],
        },
        {
            question: "¿Cuánto tiempo toma la instalación?",
            answer: "- Equipos básicos: 2-4 horas\n- Equipos complejos: 4-8 horas\n- Sistemas completos: 1-2 días\n- Incluye capacitación básica del personal",
            keywords: ["tiempo", "instalación", "horas", "días"],
        },
        {
            question: "¿Qué necesito para la instalación?",
            answer: "Requisitos para instalación:\n- Espacio adecuado\n- Conexión eléctrica apropiada\n- Acceso para equipos pesados\n- Personal disponible para capacitación",
            keywords: ["requisitos", "necesario", "espacio", "eléctrica"],
        },
    ],
};
/**
 * Base de datos de órdenes simuladas
 */
const ORDERS_DATABASE = {
    "ORD-2024-001": {
        id: "ORD-2024-001",
        customer: "Panadería Los Alpes",
        products: [
            { id: "PAN001", name: "TA-Mixer 80", quantity: 1, price: 3200000 },
        ],
        status: "En tránsito",
        orderDate: "2024-11-15",
        shippingDate: "2024-11-18",
        estimatedDelivery: "2024-11-20",
        total: 3200000,
        trackingNumber: "TRK789123456",
        shippingAddress: "Calle 45 #12-34, Bogotá",
        installationDate: "2024-11-21",
    },
    "ORD-2024-002": {
        id: "ORD-2024-002",
        customer: "Cárnicos Premium",
        products: [
            { id: "CAR001", name: "CutterPro 3000", quantity: 1, price: 4500000 },
            { id: "CAR002", name: "EmbutiFast 50", quantity: 1, price: 3800000 },
        ],
        status: "Entregado",
        orderDate: "2024-11-10",
        shippingDate: "2024-11-12",
        deliveryDate: "2024-11-15",
        total: 8300000,
        trackingNumber: "TRK789654321",
        shippingAddress: "Carrera 15 #28-45, Medellín",
        installationDate: "2024-11-16",
    },
    "ORD-2024-003": {
        id: "ORD-2024-003",
        customer: "Chocolates Artesanales",
        products: [
            { id: "CHO001", name: "ChocoMaster 3000", quantity: 1, price: 6000000 },
        ],
        status: "Procesando",
        orderDate: "2024-11-19",
        shippingDate: null,
        estimatedDelivery: "2024-11-25",
        total: 6000000,
        trackingNumber: null,
        shippingAddress: "Avenida 30 #45-67, Cali",
        installationDate: "2024-11-26",
    },
};
/**
 * Tipos de reclamos y sus códigos
 */
const COMPLAINT_TYPES = {
    producto_defectuoso: {
        code: "PRD",
        description: "Producto llegó defectuoso o con fallas",
        priority: "Alta",
        sla: "24 horas",
        department: "Calidad",
    },
    entrega_tardia: {
        code: "LOG",
        description: "Retraso en la entrega del producto",
        priority: "Media",
        sla: "48 horas",
        department: "Logística",
    },
    servicio_tecnico: {
        code: "TEC",
        description: "Problemas con instalación o servicio técnico",
        priority: "Alta",
        sla: "12 horas",
        department: "Técnico",
    },
    facturacion: {
        code: "FAC",
        description: "Problemas con facturación o cobros",
        priority: "Media",
        sla: "24 horas",
        department: "Contabilidad",
    },
    otro: {
        code: "GEN",
        description: "Otros tipos de reclamos",
        priority: "Baja",
        sla: "72 horas",
        department: "Servicio al Cliente",
    },
};
/**
 * Información de la empresa
 */
const COMPANY_INFO = {
    name: "InduEquipos Andina S.A.S.",
    description: "Empresa líder en equipos industriales para procesamiento de alimentos",
    established: "2010",
    headquarters: "Bogotá, Colombia",
    coverage: [
        "Antioquia",
        "Córdoba",
        "Chocó",
        "Norte de Santander",
        "Guainía",
        "Boyacá",
        "Arauca",
    ],
    specialties: [
        "Equipos para panadería y repostería",
        "Maquinaria para procesamiento cárnico",
        "Equipos para chocolatería artesanal",
        "Maquinaria agroindustrial",
        "Equipos para hoteles y restaurantes",
        "Máquinas expendedoras",
    ],
    certifications: ["ISO 9001", "ISO 14001", "INVIMA", "HACCP"],
    awards: ["Mejor Proveedor Industrial 2023", "Excelencia en Servicio 2022"],
    socialMedia: {
        website: "https://www.induequipos.com",
        facebook: "https://facebook.com/induequipos",
        instagram: "@induequipos",
        linkedin: "https://linkedin.com/company/induequipos",
    },
};
// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================
/**
 * Busca respuestas en la base de conocimientos de preguntas frecuentes
 */
export function searchFAQ(params) {
    console.log("searchFAQ ejecutado con parámetros:", params);
    const { query, category = "todas" } = params;
    const searchQuery = query.toLowerCase();
    let results = [];
    const categoriesToSearch = category === "todas" ? Object.keys(FAQ_DATABASE) : [category];
    for (const cat of categoriesToSearch) {
        const categoryFAQs = FAQ_DATABASE[cat];
        if (categoryFAQs) {
            const matches = categoryFAQs.filter((faq) => faq.question.toLowerCase().includes(searchQuery) ||
                faq.answer.toLowerCase().includes(searchQuery) ||
                faq.keywords.some((keyword) => keyword.toLowerCase().includes(searchQuery) ||
                    searchQuery.includes(keyword.toLowerCase())));
            results.push(...matches.map((match) => ({ ...match, category: cat })));
        }
    }
    // Ordenar por relevancia (más coincidencias de palabras clave)
    results.sort((a, b) => {
        const aScore = a.keywords.filter((keyword) => searchQuery.includes(keyword.toLowerCase())).length;
        const bScore = b.keywords.filter((keyword) => searchQuery.includes(keyword.toLowerCase())).length;
        return bScore - aScore;
    });
    const searchResults = {
        consulta: query,
        categoria: category,
        resultados: results.length,
        respuestas: results.map((result) => ({
            categoria: result.category,
            pregunta: result.question,
            respuesta: result.answer,
            relevancia: result.keywords.filter((keyword) => searchQuery.includes(keyword.toLowerCase())).length,
        })),
        sugerencias: results.length === 0
            ? [
                "Verificar ortografía de la consulta",
                "Intentar con palabras clave más específicas",
                "Contactar directamente a servicio al cliente",
            ]
            : [],
        contacto: results.length === 0 ? "+57 1 234 5678 ext. 1" : null,
    };
    return JSON.stringify(searchResults, null, 2);
}
/**
 * Rastrea el estado de una orden y proporciona información detallada
 */
export function trackOrder(params) {
    console.log("trackOrder ejecutado con parámetros:", params);
    const { orderId, customerInfo } = params;
    const order = ORDERS_DATABASE[orderId];
    if (!order) {
        const availableOrders = Object.keys(ORDERS_DATABASE);
        return JSON.stringify({
            error: true,
            mensaje: `Orden ${orderId} no encontrada`,
            sugerencias: [
                "Verificar el número de orden",
                "Revisar el email de confirmación",
                "Contactar servicio al cliente",
            ],
            ordenesEjemplo: availableOrders,
            contacto: "+57 1 234 5678 ext. 1",
        }, null, 2);
    }
    // Calcular progreso del envío
    const statusProgress = {
        Procesando: 25,
        "Preparando envío": 50,
        "En tránsito": 75,
        Entregado: 100,
    };
    const progress = statusProgress[order.status] || 0;
    // Calcular tiempo de entrega
    const orderDate = new Date(order.orderDate);
    const today = new Date();
    const daysElapsed = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    const trackingInfo = {
        orden: {
            id: order.id,
            cliente: order.customer,
            fechaOrden: order.orderDate,
            total: `$${order.total.toLocaleString()}`,
        },
        estado: {
            actual: order.status,
            progreso: `${progress}%`,
            diasTranscurridos: daysElapsed,
        },
        productos: order.products.map((product) => ({
            id: product.id,
            nombre: product.name,
            cantidad: product.quantity,
            precio: `$${product.price.toLocaleString()}`,
        })),
        envio: {
            direccion: order.shippingAddress,
            fechaEnvio: order.shippingDate || "Pendiente",
            fechaEntregaEstimada: order.estimatedDelivery || "Por confirmar",
            fechaEntregaReal: order.deliveryDate || null,
            numeroSeguimiento: order.trackingNumber || "Pendiente",
        },
        instalacion: {
            fechaProgramada: order.installationDate || "Por programar",
            incluida: order.total > 2000000 ? "Sí" : "No",
            costo: order.total > 2000000 ? "Incluida" : "15% del valor del producto",
        },
        proximosPasos: order.status === "Entregado"
            ? [
                "Verificar funcionamiento del equipo",
                "Programar capacitación si es necesaria",
                "Contactar para cualquier consulta",
            ]
            : order.status === "En tránsito"
                ? [
                    "Preparar espacio para recepción",
                    "Estar disponible en horario de entrega",
                    "Verificar documentos de entrega",
                ]
                : [
                    "Orden en proceso de preparación",
                    "Recibirá notificación cuando se envíe",
                    "Puede contactar para más información",
                ],
        contacto: "+57 1 234 5678 ext. 1",
    };
    return JSON.stringify(trackingInfo, null, 2);
}
/**
 * Gestiona reclamos de clientes y proporciona soluciones
 */
export function manageComplaint(params) {
    console.log("manageComplaint ejecutado con parámetros:", params);
    const { customerName, customerEmail, complaintType, description, orderId, priority = "media", } = params;
    const complaintInfo = COMPLAINT_TYPES[complaintType];
    if (!complaintInfo) {
        return JSON.stringify({
            error: true,
            mensaje: `Tipo de reclamo '${complaintType}' no válido`,
            tiposDisponibles: Object.keys(COMPLAINT_TYPES),
            descripcionesTipos: Object.entries(COMPLAINT_TYPES).map(([key, value]) => ({
                tipo: key,
                descripcion: value.description,
            })),
        }, null, 2);
    }
    // Generar número de caso
    const caseNumber = `${complaintInfo.code}-${Date.now().toString().slice(-6)}`;
    // Determinar prioridad final
    const finalPriority = priority === "critica" ? "crítica" : complaintInfo.priority;
    // Calcular tiempo de resolución
    const today = new Date();
    const resolutionDate = new Date(today);
    const hoursToAdd = {
        "12 horas": 12,
        "24 horas": 24,
        "48 horas": 48,
        "72 horas": 72,
    };
    const hours = hoursToAdd[complaintInfo.sla] || 24;
    resolutionDate.setHours(today.getHours() + hours);
    const complaintRecord = {
        numeroCaso: caseNumber,
        cliente: {
            nombre: customerName,
            email: customerEmail,
            ordenAsociada: orderId || "No especificada",
        },
        reclamo: {
            tipo: complaintType,
            descripcionTipo: complaintInfo.description,
            descripcion: description,
            prioridad: finalPriority,
            departamentoAsignado: complaintInfo.department,
        },
        tiempos: {
            fechaCreacion: today.toISOString().split("T")[0],
            slaResolucion: complaintInfo.sla,
            fechaResolucionEstimada: resolutionDate.toISOString().split("T")[0],
            horaResolucionEstimada: resolutionDate.toTimeString().slice(0, 5),
        },
        proximosEstepos: [
            "Reclamo registrado en el sistema",
            "Asignado al departamento correspondiente",
            "Recibirá actualizaciones por email",
            "Contacto del especialista en máximo 2 horas",
        ],
        solucionesInmediatas: complaintType === "producto_defectuoso"
            ? [
                "Verificar garantía del producto",
                "Programar visita técnica si es necesario",
                "Evaluar reemplazo o reparación",
            ]
            : complaintType === "entrega_tardia"
                ? [
                    "Rastrear ubicación actual del envío",
                    "Contactar transportadora",
                    "Ofrecer compensación por retraso",
                ]
                : [
                    "Revisar detalles específicos del caso",
                    "Contactar departamento especializado",
                    "Proporcionar solución personalizada",
                ],
        compensacion: finalPriority === "crítica" || complaintType === "entrega_tardia"
            ? "Evaluaremos compensación según el caso"
            : "Resolución sin costo adicional",
        contacto: {
            email: "reclamos@induequipos.com",
            telefono: "+57 1 234 5678 ext. 5",
            horario: "24/7 para casos críticos, 8AM-6PM para otros casos",
            codigoCaso: caseNumber,
        },
    };
    return JSON.stringify(complaintRecord, null, 2);
}
/**
 * Obtiene información general de la empresa
 */
export function getCompanyInfo(infoType) {
    console.log("getCompanyInfo ejecutado para tipo:", infoType);
    if (infoType === "contacto") {
        return JSON.stringify({
            empresa: COMPANY_INFO.name,
            contacto: {
                sede: COMPANY_INFO.headquarters,
                telefonoGeneral: "+57 1 234 5678",
                email: "info@induequipos.com",
                horarioAtencion: "Lunes a viernes 8:00 AM - 6:00 PM",
                sabados: "8:00 AM - 12:00 PM",
                emergenciasTecnicas: "+57 300 911 2233",
            },
            redesSociales: COMPANY_INFO.socialMedia,
            cobertura: COMPANY_INFO.coverage,
        }, null, 2);
    }
    if (infoType === "productos") {
        return JSON.stringify({
            empresa: COMPANY_INFO.name,
            especialidades: COMPANY_INFO.specialties,
            categorias: [
                "Panadería y Repostería",
                "Procesamiento Cárnico",
                "Chocolatería Artesanal",
                "Agroindustria",
                "Hoteles y Restaurantes",
                "Máquinas Expendedoras",
            ],
            servicios: [
                "Venta de equipos nuevos",
                "Instalación y puesta en marcha",
                "Capacitación de personal",
                "Mantenimiento preventivo",
                "Servicio técnico especializado",
                "Repuestos originales",
            ],
        }, null, 2);
    }
    // Información completa por defecto
    const fullInfo = {
        empresa: {
            nombre: COMPANY_INFO.name,
            descripcion: COMPANY_INFO.description,
            fundacion: COMPANY_INFO.established,
            sede: COMPANY_INFO.headquarters,
        },
        cobertura: {
            departamentos: COMPANY_INFO.coverage,
            alcanceNacional: "Envíos a toda Colombia",
            zonasEspecializadas: "Instalación y servicio técnico en zonas de cobertura",
        },
        especialidades: COMPANY_INFO.specialties,
        certificaciones: COMPANY_INFO.certifications,
        reconocimientos: COMPANY_INFO.awards,
        contacto: {
            telefono: "+57 1 234 5678",
            email: "info@induequipos.com",
            horario: "Lunes a viernes 8:00 AM - 6:00 PM",
            emergencias: "+57 300 911 2233",
        },
        redesSociales: COMPANY_INFO.socialMedia,
        departamentos: {
            ventas: "ext. 1",
            servicioTecnico: "ext. 2",
            garantias: "ext. 3",
            manuales: "ext. 4",
            reclamos: "ext. 5",
        },
    };
    return JSON.stringify(fullInfo, null, 2);
}
/**
 * Programa una llamada de seguimiento con el cliente
 */
export function scheduleFollowUp(params) {
    console.log("scheduleFollowUp ejecutado con parámetros:", params);
    const { customerName, customerPhone, preferredDate, preferredTime = "10:00", reason, priority = "media", } = params;
    const today = new Date();
    let followUpDate = new Date(today);
    if (preferredDate) {
        followUpDate = new Date(preferredDate);
    }
    else {
        // Programar para el siguiente día hábil
        followUpDate.setDate(today.getDate() + 1);
        if (followUpDate.getDay() === 0) {
            // Domingo
            followUpDate.setDate(followUpDate.getDate() + 1);
        }
        else if (followUpDate.getDay() === 6) {
            // Sábado
            followUpDate.setDate(followUpDate.getDate() + 2);
        }
    }
    const followUpId = `CALL-${Date.now().toString().slice(-6)}`;
    const followUpSchedule = {
        id: followUpId,
        cliente: {
            nombre: customerName,
            telefono: customerPhone,
        },
        programacion: {
            fecha: followUpDate.toISOString().split("T")[0],
            hora: preferredTime,
            duracionEstimada: "15-30 minutos",
        },
        motivo: reason,
        prioridad: priority,
        agente: "Servicio al Cliente",
        preparacion: [
            "Revisar historial del cliente",
            "Preparar información relevante",
            "Tener casos similares como referencia",
        ],
        objetivos: [
            "Resolver dudas o inquietudes",
            "Verificar satisfacción del cliente",
            "Ofrecer productos o servicios adicionales",
            "Mantener relación comercial positiva",
        ],
        confirmacion: {
            metodo: "Llamada de confirmación 2 horas antes",
            reagendamiento: "Disponible con 2 horas de anticipación",
            contacto: "+57 1 234 5678 ext. 1",
        },
    };
    return JSON.stringify(followUpSchedule, null, 2);
}
