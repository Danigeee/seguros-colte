// ==========================================
// FUNCIONES DE VENTAS
// ==========================================
/**
 * Datos simulados de productos para demostración
 */
const PRODUCTS = {
    PAN001: {
        name: "TA-Mixer 80 (Amasadora Industrial)",
        price: 3200000,
        stock: 12,
        category: "panaderia",
        description: "Amasadora industrial de alta capacidad para panaderías profesionales",
        specifications: {
            capacity: "80 kg",
            power: "3.5 kW",
            dimensions: "120x80x140 cm",
            weight: "350 kg",
        },
    },
    PAN002: {
        name: "PanExpress 60 (Divisora de Masa)",
        price: 2100000,
        stock: 8,
        category: "panaderia",
        description: "Divisora automática de masa para producción continua",
        specifications: {
            capacity: "60 porciones/min",
            power: "2.2 kW",
            dimensions: "90x60x120 cm",
            weight: "280 kg",
        },
    },
    PAN003: {
        name: "HornoMaster 90 (Horno Rotativo)",
        price: 5400000,
        stock: 5,
        category: "panaderia",
        description: "Horno rotativo profesional con control digital avanzado",
        specifications: {
            capacity: "18 bandejas",
            power: "45 kW",
            dimensions: "200x150x220 cm",
            weight: "1200 kg",
        },
    },
    CAR001: {
        name: "CutterPro 3000 (Cutter Cárnico)",
        price: 4500000,
        stock: 7,
        category: "carnicos",
        description: "Cutter profesional para procesamiento de carne",
        specifications: {
            capacity: "30 kg",
            power: "5.5 kW",
            dimensions: "110x70x130 cm",
            weight: "450 kg",
        },
    },
    CAR002: {
        name: "EmbutiFast 50 (Embutidora Automática)",
        price: 3800000,
        stock: 10,
        category: "carnicos",
        description: "Embutidora automática para producción de embutidos",
        specifications: {
            capacity: "50 kg/h",
            power: "3.0 kW",
            dimensions: "85x65x115 cm",
            weight: "320 kg",
        },
    },
    CHO001: {
        name: "ChocoMaster 3000 (Templadora de Chocolate)",
        price: 6000000,
        stock: 4,
        category: "chocolates",
        description: "Templadora automática de chocolate con control de temperatura",
        specifications: {
            capacity: "30 kg/h",
            power: "4.2 kW",
            dimensions: "120x80x150 cm",
            weight: "380 kg",
        },
    },
    CHO002: {
        name: "RefinaPlus 20 (Refinadora de Cacao)",
        price: 2900000,
        stock: 6,
        category: "chocolates",
        description: "Refinadora de cacao para producción artesanal",
        specifications: {
            capacity: "20 kg/h",
            power: "2.8 kW",
            dimensions: "95x75x125 cm",
            weight: "290 kg",
        },
    },
    AGR001: {
        name: "AgroPulper 100 (Despulpadora de Frutas)",
        price: 2500000,
        stock: 9,
        category: "agroindustria",
        description: "Despulpadora industrial para procesamiento de frutas",
        specifications: {
            capacity: "100 kg/h",
            power: "3.5 kW",
            dimensions: "100x70x120 cm",
            weight: "220 kg",
        },
    },
    HOC001: {
        name: "VitrinaCool 120 (Vitrina Refrigerada)",
        price: 1700000,
        stock: 15,
        category: "horeca",
        description: "Vitrina refrigerada para exhibición de productos",
        specifications: {
            capacity: "120 litros",
            power: "1.2 kW",
            dimensions: "120x60x180 cm",
            weight: "150 kg",
        },
    },
    VEN001: {
        name: "VendiMax 24 (Máquina Expendedora)",
        price: 8000000,
        stock: 3,
        category: "vending",
        description: "Máquina expendedora automática con sistema de pago múltiple",
        specifications: {
            capacity: "24 productos",
            power: "1.5 kW",
            dimensions: "180x90x200 cm",
            weight: "280 kg",
        },
    },
};
/**
 * Datos simulados de promociones activas
 */
const ACTIVE_PROMOTIONS = {
    PROMO001: {
        name: "Descuento Panadería 2024",
        description: "15% de descuento en equipos de panadería",
        category: "panaderia",
        discount: 0.15,
        validUntil: "2024-12-31",
        minQuantity: 1,
        active: true,
    },
    PROMO002: {
        name: "Combo Chocolatería",
        description: "20% de descuento comprando 2 o más equipos de chocolatería",
        category: "chocolates",
        discount: 0.2,
        validUntil: "2024-12-15",
        minQuantity: 2,
        active: true,
    },
    PROMO003: {
        name: "Black Friday Cárnicos",
        description: "25% de descuento en equipos cárnicos",
        category: "carnicos",
        discount: 0.25,
        validUntil: "2024-11-30",
        minQuantity: 1,
        active: true,
    },
};
/**
 * Datos simulados de análisis de ventas
 */
const SALES_DATA = {
    monthly: {
        panaderia: { sales: 45, trend: "up", growth: 12 },
        carnicos: { sales: 32, trend: "stable", growth: 3 },
        chocolates: { sales: 28, trend: "up", growth: 18 },
        agroindustria: { sales: 22, trend: "down", growth: -5 },
        horeca: { sales: 15, trend: "up", growth: 8 },
        vending: { sales: 8, trend: "stable", growth: 2 },
    },
    quarterly: {
        panaderia: { sales: 135, trend: "up", growth: 15 },
        carnicos: { sales: 96, trend: "stable", growth: 5 },
        chocolates: { sales: 84, trend: "up", growth: 22 },
        agroindustria: { sales: 66, trend: "down", growth: -8 },
        horeca: { sales: 45, trend: "up", growth: 10 },
        vending: { sales: 24, trend: "stable", growth: 3 },
    },
};
// ==========================================
// FUNCIONES PRINCIPALES
// ==========================================
/**
 * Obtiene el catálogo de productos con filtros opcionales
 */
export function getProductCatalog(filters = {}) {
    console.log("getProductCatalog ejecutado con filtros:", filters);
    const { category = "todos", minPrice, maxPrice, inStock = true } = filters;
    let filteredProducts = Object.entries(PRODUCTS)
        .filter(([_, product]) => {
        // Filtrar por categoría
        if (category !== "todos" && product.category !== category)
            return false;
        // Filtrar por precio
        if (minPrice && product.price < minPrice)
            return false;
        if (maxPrice && product.price > maxPrice)
            return false;
        // Filtrar por stock
        if (inStock && product.stock <= 0)
            return false;
        return true;
    })
        .map(([id, product]) => ({
        id,
        ...product,
        disponibilidad: product.stock > 10 ? "Alta" : product.stock > 0 ? "Baja" : "Agotado",
        priceFormatted: `$${product.price.toLocaleString()}`,
    }));
    const result = {
        categoria: category,
        totalProductos: filteredProducts.length,
        productos: filteredProducts,
        mensaje: `Catálogo de productos${category !== "todos" ? ` - ${category}` : ""}`,
    };
    return JSON.stringify(result, null, 2);
}
/**
 * Calcula una cotización detallada para productos específicos
 */
export function calculateQuote(params) {
    console.log("calculateQuote ejecutado con parámetros:", params);
    const { productId, quantity, customerType = "nuevo", includeInstallation = false, includeWarrantyExtension = false, } = params;
    const product = PRODUCTS[productId];
    if (!product) {
        const availableProducts = Object.keys(PRODUCTS).join(", ");
        return JSON.stringify({
            error: true,
            mensaje: `Producto ${productId} no encontrado`,
            productosDisponibles: availableProducts,
        });
    }
    // Verificar stock
    if (quantity > product.stock) {
        return JSON.stringify({
            error: true,
            mensaje: `Stock insuficiente. Disponible: ${product.stock}, Solicitado: ${quantity}`,
            stockDisponible: product.stock,
        });
    }
    // Calcular precios base
    const basePrice = product.price * quantity;
    // Aplicar descuentos por tipo de cliente
    const customerDiscounts = {
        nuevo: 0,
        recurrente: 0.05,
        empresarial: 0.1,
    };
    const customerDiscount = customerDiscounts[customerType] || 0;
    // Aplicar descuentos por cantidad
    let quantityDiscount = 0;
    if (quantity >= 5)
        quantityDiscount = 0.15;
    else if (quantity >= 3)
        quantityDiscount = 0.1;
    else if (quantity >= 2)
        quantityDiscount = 0.05;
    // Calcular descuento total
    const totalDiscount = Math.max(customerDiscount, quantityDiscount);
    const discountAmount = basePrice * totalDiscount;
    const subtotal = basePrice - discountAmount;
    // Costos adicionales
    const installationCost = includeInstallation ? product.price * 0.15 : 0;
    const warrantyExtensionCost = includeWarrantyExtension
        ? product.price * 0.08
        : 0;
    // Total final
    const total = subtotal + installationCost + warrantyExtensionCost;
    const cotizacion = {
        producto: {
            id: productId,
            nombre: product.name,
            categoria: product.category,
            precioUnitario: `$${product.price.toLocaleString()}`,
        },
        cantidad: quantity,
        cliente: {
            tipo: customerType,
            descuentoAplicado: `${(customerDiscount * 100).toFixed(0)}%`,
        },
        detallePrecios: {
            subtotal: `$${basePrice.toLocaleString()}`,
            descuentoCantidad: `${(quantityDiscount * 100).toFixed(0)}%`,
            descuentoCliente: `${(customerDiscount * 100).toFixed(0)}%`,
            descuentoTotal: `$${discountAmount.toLocaleString()}`,
            subtotalConDescuento: `$${subtotal.toLocaleString()}`,
        },
        serviciosAdicionales: {
            instalacion: includeInstallation
                ? `$${installationCost.toLocaleString()}`
                : "No incluida",
            garantiaExtendida: includeWarrantyExtension
                ? `$${warrantyExtensionCost.toLocaleString()}`
                : "No incluida",
        },
        total: `$${total.toLocaleString()}`,
        validez: "30 días",
        condiciones: [
            "Precios sujetos a cambios sin previo aviso",
            "Instalación programada según disponibilidad",
            "Garantía estándar incluida",
            "Términos de pago: 50% anticipo, 50% contra entrega",
        ],
    };
    return JSON.stringify(cotizacion, null, 2);
}
/**
 * Proporciona análisis de ventas y tendencias del mercado
 */
export function getSalesAnalytics(params = {}) {
    console.log("getSalesAnalytics ejecutado con parámetros:", params);
    const { timeframe = "mensual", productCategory = "todos", includeComparisons = true, } = params;
    const dataKey = timeframe === "trimestral" ? "quarterly" : "monthly";
    const salesData = SALES_DATA[dataKey];
    let analysis;
    if (productCategory === "todos") {
        // Análisis general
        const totalSales = Object.values(salesData).reduce((sum, category) => sum + category.sales, 0);
        const categories = Object.entries(salesData)
            .map(([name, data]) => ({
            categoria: name,
            ventas: data.sales,
            tendencia: data.trend,
            crecimiento: `${data.growth}%`,
            participacion: `${((data.sales / totalSales) * 100).toFixed(1)}%`,
        }))
            .sort((a, b) => b.ventas - a.ventas);
        analysis = {
            periodo: timeframe,
            resumen: {
                ventasTotales: totalSales,
                categoriaLider: categories[0].categoria,
                mejorCrecimiento: categories.reduce((max, cat) => parseInt(cat.crecimiento) > parseInt(max.crecimiento) ? cat : max).categoria,
            },
            categorias: categories,
            tendenciasGenerales: {
                categoriasMejor: categories.filter((c) => c.tendencia === "up").length,
                categoriasEstables: categories.filter((c) => c.tendencia === "stable")
                    .length,
                categoriasBaja: categories.filter((c) => c.tendencia === "down").length,
            },
        };
    }
    else {
        // Análisis específico por categoría
        const categoryData = salesData[productCategory];
        if (!categoryData) {
            return JSON.stringify({
                error: true,
                mensaje: `Categoría ${productCategory} no encontrada`,
                categoriasDisponibles: Object.keys(salesData),
            });
        }
        analysis = {
            periodo: timeframe,
            categoria: productCategory,
            ventas: categoryData.sales,
            tendencia: categoryData.trend,
            crecimiento: `${categoryData.growth}%`,
            estado: categoryData.trend === "up"
                ? "Creciendo"
                : categoryData.trend === "down"
                    ? "Decreciendo"
                    : "Estable",
            recomendaciones: [
                categoryData.trend === "up"
                    ? "Mantener estrategia actual"
                    : "Evaluar nuevas estrategias",
                categoryData.growth > 10
                    ? "Considerar expansión de inventario"
                    : "Optimizar rotación",
                "Monitorear competencia en el sector",
            ],
        };
    }
    if (includeComparisons) {
        const prevPeriod = timeframe === "mensual" ? "mes anterior" : "trimestre anterior";
        analysis.comparaciones = {
            periodoAnterior: prevPeriod,
            nota: "Comparaciones basadas en datos históricos simulados",
        };
    }
    return JSON.stringify(analysis, null, 2);
}
/**
 * Obtiene las promociones activas
 */
export function getActivePromotions(category) {
    console.log("getActivePromotions ejecutado para categoría:", category);
    let promotions = Object.entries(ACTIVE_PROMOTIONS)
        .filter(([_, promo]) => promo.active)
        .filter(([_, promo]) => !category || category === "todas" || promo.category === category)
        .map(([id, promo]) => ({
        id,
        nombre: promo.name,
        descripcion: promo.description,
        categoria: promo.category,
        descuento: `${(promo.discount * 100).toFixed(0)}%`,
        validaHasta: promo.validUntil,
        cantidadMinima: promo.minQuantity,
        activa: promo.active,
    }));
    const result = {
        categoria: category || "todas",
        totalPromociones: promotions.length,
        promociones: promotions,
        mensaje: promotions.length > 0
            ? "Promociones activas disponibles"
            : "No hay promociones activas",
    };
    return JSON.stringify(result, null, 2);
}
/**
 * Verifica disponibilidad de inventario
 */
export function checkInventory(productId) {
    console.log("checkInventory ejecutado para producto:", productId);
    if (productId) {
        const product = PRODUCTS[productId];
        if (!product) {
            return JSON.stringify({
                error: true,
                mensaje: `Producto ${productId} no encontrado`,
                productosDisponibles: Object.keys(PRODUCTS),
            });
        }
        return JSON.stringify({
            producto: {
                id: productId,
                nombre: product.name,
                categoria: product.category,
                stock: product.stock,
                disponibilidad: product.stock > 10 ? "Alta" : product.stock > 0 ? "Baja" : "Agotado",
                precio: `$${product.price.toLocaleString()}`,
            },
        });
    }
    // Inventario general
    const inventory = Object.entries(PRODUCTS).map(([id, product]) => ({
        id,
        nombre: product.name,
        categoria: product.category,
        stock: product.stock,
        disponibilidad: product.stock > 10 ? "Alta" : product.stock > 0 ? "Baja" : "Agotado",
    }));
    const summary = {
        totalProductos: inventory.length,
        enStock: inventory.filter((p) => p.stock > 0).length,
        stockBajo: inventory.filter((p) => p.stock > 0 && p.stock <= 10).length,
        agotados: inventory.filter((p) => p.stock === 0).length,
        productos: inventory,
    };
    return JSON.stringify(summary, null, 2);
}
