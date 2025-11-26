// ==========================================
// FUNCIONES TÉCNICAS
// ==========================================
/**
 * Base de conocimientos de problemas comunes
 */
const COMMON_ISSUES = {
    no_enciende: {
        keywords: [
            "no enciende",
            "no prende",
            "sin energía",
            "apagado",
            "no funciona",
        ],
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
        difficulty: "Básico",
    },
    no_responde: {
        keywords: ["no responde", "falla", "error", "no funciona correctamente"],
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
        difficulty: "Intermedio",
    },
    ruido_extraño: {
        keywords: ["ruido", "sonido", "zumbido", "vibración", "hace ruido"],
        solutions: [
            "Lubricar partes móviles según manual",
            "Verificar tornillos y sujeciones estén apretados",
            "Revisar que no haya objetos extraños en la máquina",
            "Limpiar ventiladores y componentes internos",
            "Contactar servicio técnico si persiste",
        ],
        priority: "Media",
        estimatedTime: "20-40 minutos",
        requiresTechnician: true,
        difficulty: "Intermedio",
    },
    error_temperatura: {
        keywords: [
            "temperatura",
            "calienta mucho",
            "no calienta",
            "error temp",
            "sobrecalentamiento",
        ],
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
        difficulty: "Avanzado",
    },
    mezcla_incompleta: {
        keywords: [
            "mezcla incompleta",
            "no mezcla bien",
            "amasado irregular",
            "mal mezclado",
        ],
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
        difficulty: "Básico",
    },
    fuga_aceite: {
        keywords: ["fuga", "aceite", "gotea", "derrame", "pérdida de aceite"],
        solutions: [
            "Identificar punto exacto de la fuga",
            "Verificar nivel de aceite en el sistema",
            "Revisar sellos y juntas",
            "Reapretar conexiones de mangueras",
            "Reemplazar componentes dañados",
        ],
        priority: "Alta",
        estimatedTime: "45-90 minutos",
        requiresTechnician: true,
        difficulty: "Avanzado",
    },
};
/**
 * Base de datos de técnicos disponibles
 */
const TECHNICIANS = {
    TECH001: {
        name: "Carlos Restrepo",
        specialties: ["panadería", "cárnicos", "chocolates"],
        zone: "Bogotá",
        available: true,
        rating: 4.8,
        phone: "+57 300 123 4567",
        experience: "8 años",
    },
    TECH002: {
        name: "Ana Rodríguez",
        specialties: ["agroindustria", "horeca", "vending"],
        zone: "Medellín",
        available: true,
        rating: 4.9,
        phone: "+57 301 234 5678",
        experience: "12 años",
    },
    TECH003: {
        name: "Luis Martínez",
        specialties: ["panadería", "chocolates", "equipos industriales"],
        zone: "Cali",
        available: false,
        rating: 4.7,
        phone: "+57 302 345 6789",
        experience: "6 años",
    },
    TECH004: {
        name: "María González",
        specialties: ["cárnicos", "agroindustria", "mantenimiento preventivo"],
        zone: "Barranquilla",
        available: true,
        rating: 4.6,
        phone: "+57 303 456 7890",
        experience: "10 años",
    },
};
/**
 * Base de datos de manuales técnicos
 */
const TECHNICAL_MANUALS = {
    PAN001: {
        model: "TA-Mixer 80",
        manuals: {
            instalacion: {
                title: "Manual de Instalación TA-Mixer 80",
                sections: [
                    "Requisitos previos",
                    "Instalación eléctrica",
                    "Conexiones",
                    "Pruebas iniciales",
                ],
                downloadUrl: "/manuals/PAN001_instalacion.pdf",
                language: "es",
            },
            operacion: {
                title: "Manual de Operación TA-Mixer 80",
                sections: [
                    "Controles",
                    "Procedimientos",
                    "Seguridad",
                    "Mantenimiento diario",
                ],
                downloadUrl: "/manuals/PAN001_operacion.pdf",
                language: "es",
            },
            mantenimiento: {
                title: "Manual de Mantenimiento TA-Mixer 80",
                sections: [
                    "Programa de mantenimiento",
                    "Lubricación",
                    "Repuestos",
                    "Troubleshooting",
                ],
                downloadUrl: "/manuals/PAN001_mantenimiento.pdf",
                language: "es",
            },
        },
    },
    CAR001: {
        model: "CutterPro 3000",
        manuals: {
            instalacion: {
                title: "Manual de Instalación CutterPro 3000",
                sections: ["Ubicación", "Instalación", "Calibración", "Seguridad"],
                downloadUrl: "/manuals/CAR001_instalacion.pdf",
                language: "es",
            },
            operacion: {
                title: "Manual de Operación CutterPro 3000",
                sections: ["Preparación", "Operación", "Limpieza", "Seguridad"],
                downloadUrl: "/manuals/CAR001_operacion.pdf",
                language: "es",
            },
            mantenimiento: {
                title: "Manual de Mantenimiento CutterPro 3000",
                sections: [
                    "Mantenimiento preventivo",
                    "Afilado de cuchillas",
                    "Repuestos",
                    "Diagnósticos",
                ],
                downloadUrl: "/manuals/CAR001_mantenimiento.pdf",
                language: "es",
            },
        },
    },
};
/**
 * Períodos de garantía por categoría
 */
const WARRANTY_PERIODS = {
    panaderia: { years: 2, description: "Amasadoras y hornos" },
    carnicos: { years: 3, description: "Cutters y embutidoras" },
    chocolates: { years: 2, description: "Templadoras y refinadoras" },
    agroindustria: { years: 2, description: "Despulpadoras y procesadoras" },
    horeca: { years: 1, description: "Vitrinas y equipos de exhibición" },
    vending: { years: 2, description: "Máquinas expendedoras" },
};
// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================
/**
 * Diagnostica problemas técnicos con productos y proporciona soluciones paso a paso
 */
export function diagnoseTechnicalIssue(params) {
    console.log("diagnoseTechnicalIssue ejecutado con parámetros:", params);
    const { issueDescription, productModel = "Modelo no especificado", symptoms = [], urgency = "media", } = params;
    // Análisis inteligente basado en palabras clave
    let matchedIssue = null;
    let matchedKey = "";
    let confidence = 0;
    const allText = [issueDescription, ...symptoms].join(" ").toLowerCase();
    for (const [key, issue] of Object.entries(COMMON_ISSUES)) {
        const matches = issue.keywords.filter((keyword) => allText.includes(keyword.toLowerCase()));
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
        return JSON.stringify({
            diagnostico: {
                producto: productModel,
                problema: issueDescription,
                confianza: `${confidencePercentage}%`,
                estado: "No identificado",
            },
            recomendacionesGenerales: [
                "Verificar conexiones básicas (energía, cables)",
                "Reiniciar el dispositivo completamente",
                "Consultar manual del usuario",
                "Contactar soporte técnico especializado",
            ],
            sintomas: symptoms,
            urgencia: urgency,
            contactoSoporte: "+57 1 234 5678 ext. 2",
        }, null, 2);
    }
    const requiresVisit = matchedIssue.requiresTechnician || urgency === "critica";
    const diagnosticResult = {
        diagnostico: {
            producto: productModel,
            problemaIdentificado: matchedKey.replace(/_/g, " ").toUpperCase(),
            confianza: `${confidencePercentage}%`,
            prioridad: matchedIssue.priority,
            tiempoEstimado: matchedIssue.estimatedTime,
            dificultad: matchedIssue.difficulty,
            requiereVisita: requiresVisit,
        },
        solucionesRecomendadas: matchedIssue.solutions,
        siguientesPasos: requiresVisit
            ? [
                "Programar visita técnica",
                "Preparar área de trabajo",
                "Tener manual disponible",
            ]
            : [
                "Seguir soluciones paso a paso",
                "Documentar resultados",
                "Contactar si persiste",
            ],
        urgencia: urgency,
        contacto: {
            soporte: "+57 1 234 5678 ext. 2",
            emergencias: urgency === "critica" ? "+57 300 911 2233" : null,
        },
    };
    return JSON.stringify(diagnosticResult, null, 2);
}
/**
 * Programa visitas técnicas para instalación o mantenimiento de equipos
 */
export function scheduleTechnicalVisit(params) {
    console.log("scheduleTechnicalVisit ejecutado con parámetros:", params);
    const { customerName, customerPhone, address, serviceType, preferredDate, urgency = "media", equipmentModel = "No especificado", zone = "Bogotá", } = params;
    // Buscar técnico disponible según especialidad y zona
    const availableTechnicians = Object.entries(TECHNICIANS)
        .filter(([_, tech]) => tech.available && tech.zone === zone)
        .map(([id, tech]) => ({ id, ...tech }));
    if (availableTechnicians.length === 0) {
        return JSON.stringify({
            error: true,
            mensaje: `No hay técnicos disponibles en ${zone}`,
            alternativas: [
                "Reagendar para otra fecha",
                "Considerar técnico de zona cercana",
                "Servicio remoto por video llamada",
            ],
            contacto: "+57 1 234 5678 ext. 2",
        }, null, 2);
    }
    // Seleccionar mejor técnico
    const selectedTechnician = availableTechnicians.reduce((best, current) => current.rating > best.rating ? current : best);
    // Generar número de caso
    const caseNumber = `TECH-${Date.now().toString().slice(-6)}`;
    // Calcular fecha de visita
    const today = new Date();
    let visitDate = new Date(today);
    if (urgency === "critica") {
        visitDate.setDate(today.getDate() + 1); // Mañana
    }
    else if (urgency === "alta") {
        visitDate.setDate(today.getDate() + 2); // Pasado mañana
    }
    else {
        visitDate.setDate(today.getDate() + 5); // En 5 días
    }
    if (preferredDate) {
        const preferred = new Date(preferredDate);
        if (preferred > today) {
            visitDate = preferred;
        }
    }
    const visitInfo = {
        numeroCaso: caseNumber,
        cliente: {
            nombre: customerName,
            telefono: customerPhone,
            direccion: address,
        },
        servicio: {
            tipo: serviceType,
            equipo: equipmentModel,
            urgencia: urgency,
        },
        tecnico: {
            nombre: selectedTechnician.name,
            telefono: selectedTechnician.phone,
            experiencia: selectedTechnician.experience,
            calificacion: selectedTechnician.rating,
            especialidades: selectedTechnician.specialties,
        },
        programacion: {
            fecha: visitDate.toISOString().split("T")[0],
            horario: urgency === "critica" ? "8:00 AM - 12:00 PM" : "2:00 PM - 6:00 PM",
            duracionEstimada: serviceType === "instalacion" ? "2-4 horas" : "1-2 horas",
        },
        preparativos: [
            "Tener el equipo accesible",
            "Contar con espacio de trabajo adecuado",
            "Tener manual del equipo disponible",
            "Asegurar suministro eléctrico estable",
        ],
        condiciones: [
            "Servicio sujeto a disponibilidad",
            "Reagendamiento con 24 horas de anticipación",
            "Costo de visita según tipo de servicio",
            "Garantía del trabajo realizado",
        ],
    };
    return JSON.stringify(visitInfo, null, 2);
}
/**
 * Obtiene información técnica detallada y manuales de productos
 */
export function getTechnicalManual(params) {
    console.log("getTechnicalManual ejecutado con parámetros:", params);
    const { productModel, manualType = "operacion", language = "es" } = params;
    const manualData = TECHNICAL_MANUALS[productModel];
    if (!manualData) {
        return JSON.stringify({
            error: true,
            mensaje: `No se encontraron manuales para el modelo ${productModel}`,
            modelosDisponibles: Object.keys(TECHNICAL_MANUALS),
            contacto: "Solicitar manual específico: soporte@induequipos.com",
        }, null, 2);
    }
    const manual = manualData.manuals[manualType];
    if (!manual) {
        return JSON.stringify({
            error: true,
            mensaje: `Tipo de manual '${manualType}' no disponible para ${productModel}`,
            tiposDisponibles: Object.keys(manualData.manuals),
            modelo: manualData.model,
        }, null, 2);
    }
    const manualInfo = {
        modelo: manualData.model,
        tipoManual: manualType,
        idioma: language,
        manual: {
            titulo: manual.title,
            secciones: manual.sections,
            urlDescarga: manual.downloadUrl,
            version: "v2.1",
            fechaActualizacion: "2024-10-15",
        },
        informacionAdicional: {
            formatosDisponibles: ["PDF", "Video tutorial"],
            tamaño: "2.5 MB",
            requisitosSistema: "Adobe Reader o compatible",
        },
        soporte: {
            email: "manuales@induequipos.com",
            telefono: "+57 1 234 5678 ext. 4",
            horario: "Lunes a viernes 8:00 AM - 6:00 PM",
        },
    };
    return JSON.stringify(manualInfo, null, 2);
}
/**
 * Verifica el estado de garantía de un producto
 */
export function checkWarrantyStatus(params) {
    console.log("checkWarrantyStatus ejecutado con parámetros:", params);
    const { productId, serialNumber = "SN123456789", purchaseDate, category, } = params;
    if (!purchaseDate) {
        return JSON.stringify({
            error: true,
            mensaje: "Fecha de compra requerida para verificar garantía",
            instrucciones: "Proporcione la fecha de compra en formato YYYY-MM-DD",
        }, null, 2);
    }
    const purchase = new Date(purchaseDate);
    const today = new Date();
    const monthsElapsed = (today.getFullYear() - purchase.getFullYear()) * 12 +
        (today.getMonth() - purchase.getMonth());
    // Determinar período de garantía
    let warrantyInfo = WARRANTY_PERIODS.panaderia; // Default
    if (category && WARRANTY_PERIODS[category]) {
        warrantyInfo = WARRANTY_PERIODS[category];
    }
    const warrantyMonths = warrantyInfo.years * 12;
    const monthsRemaining = warrantyMonths - monthsElapsed;
    const isUnderWarranty = monthsRemaining > 0;
    const warrantyExpiry = new Date(purchase);
    warrantyExpiry.setFullYear(purchase.getFullYear() + warrantyInfo.years);
    const status = {
        producto: {
            id: productId,
            numeroSerie: serialNumber,
            categoria: category || "No especificada",
        },
        garantia: {
            vigente: isUnderWarranty,
            fechaCompra: purchaseDate,
            fechaVencimiento: warrantyExpiry.toISOString().split("T")[0],
            periodoTotal: `${warrantyInfo.years} años`,
            tiempoTranscurrido: `${monthsElapsed} meses`,
            tiempoRestante: isUnderWarranty ? `${monthsRemaining} meses` : "Vencida",
        },
        cobertura: {
            incluyeRepuestos: true,
            incluyeManoObra: true,
            incluyeVisitas: true,
            exclusiones: [
                "Daños por mal uso",
                "Desgaste normal",
                "Modificaciones no autorizadas",
                "Daños por agua o humedad",
            ],
        },
        siguientesPasos: isUnderWarranty
            ? [
                "Contactar servicio técnico para reclamación",
                "Preparar comprobante de compra",
                "Describir el problema detalladamente",
            ]
            : [
                "Garantía vencida - servicio con costo",
                "Solicitar cotización de reparación",
                "Considerar extensión de garantía",
            ],
        contacto: {
            garantias: "garantias@induequipos.com",
            telefono: "+57 1 234 5678 ext. 3",
            horario: "Lunes a viernes 8:00 AM - 5:00 PM",
        },
    };
    return JSON.stringify(status, null, 2);
}
/**
 * Programa mantenimiento preventivo para equipos
 */
export function schedulePreventiveMaintenance(params) {
    console.log("schedulePreventiveMaintenance ejecutado con parámetros:", params);
    const { productId, customerName, lastMaintenanceDate, maintenanceType = "preventivo", zone = "Bogotá", } = params;
    // Calcular próxima fecha de mantenimiento
    const today = new Date();
    let nextMaintenance = new Date(today);
    if (lastMaintenanceDate) {
        const lastMaint = new Date(lastMaintenanceDate);
        nextMaintenance = new Date(lastMaint);
        nextMaintenance.setMonth(lastMaint.getMonth() + 6); // Cada 6 meses
    }
    else {
        nextMaintenance.setMonth(today.getMonth() + 1); // En 1 mes si es el primero
    }
    // Buscar técnico especialista
    const specialist = Object.values(TECHNICIANS).find((tech) => tech.available &&
        tech.zone === zone &&
        tech.specialties.includes("mantenimiento preventivo")) ||
        Object.values(TECHNICIANS).find((tech) => tech.available && tech.zone === zone);
    const maintenanceSchedule = {
        cliente: customerName,
        producto: productId,
        tipoMantenimiento: maintenanceType,
        programacion: {
            fechaSugerida: nextMaintenance.toISOString().split("T")[0],
            frecuenciaRecomendada: "Cada 6 meses",
            duracionEstimada: "2-3 horas",
        },
        tecnicoAsignado: specialist
            ? {
                nombre: specialist.name,
                telefono: specialist.phone,
                especialidades: specialist.specialties,
            }
            : "Por asignar",
        actividadesIncluidas: [
            "Inspección general del equipo",
            "Lubricación de partes móviles",
            "Limpieza de componentes internos",
            "Verificación de conexiones eléctricas",
            "Calibración de parámetros",
            "Pruebas de funcionamiento",
            "Reporte técnico completo",
        ],
        beneficios: [
            "Prevención de fallas imprevistas",
            "Extensión de vida útil del equipo",
            "Optimización del rendimiento",
            "Mantenimiento de garantía",
        ],
        costo: {
            mantenimientoPreventivo: "$200.000 - $400.000",
            mantenimientoCorrectivo: "$500.000 - $1.200.000",
            ahorroPotencial: "60-70%",
        },
        contacto: "+57 1 234 5678 ext. 2",
    };
    return JSON.stringify(maintenanceSchedule, null, 2);
}
