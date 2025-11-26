import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// Crear servidor MCP para ventas
const server = new McpServer({
    name: "sales-server",
    version: "1.0.0",
});
// Datos simulados de productos
const PRODUCTS = {
    PAN001: {
        name: "TA-Mixer 80 (Amasadora Industrial)",
        price: 3200000,
        stock: 12,
        category: "panaderia",
    },
    PAN002: {
        name: "PanExpress 60 (Divisora de Masa)",
        price: 2100000,
        stock: 8,
        category: "panaderia",
    },
    PAN003: {
        name: "HornoMaster 90 (Horno Rotativo)",
        price: 5400000,
        stock: 5,
        category: "panaderia",
    },
    CAR001: {
        name: "CutterPro 3000 (Cutter Cárnico)",
        price: 4500000,
        stock: 7,
        category: "carnicos",
    },
    CAR002: {
        name: "EmbutiFast 50 (Embutidora Automática)",
        price: 3800000,
        stock: 10,
        category: "carnicos",
    },
    CHO001: {
        name: "ChocoMaster 3000 (Templadora de Chocolate)",
        price: 6000000,
        stock: 4,
        category: "chocolates",
    },
    CHO002: {
        name: "RefinaPlus 20 (Refinadora de Cacao)",
        price: 2900000,
        stock: 6,
        category: "chocolates",
    },
    AGR001: {
        name: "AgroPulper 100 (Despulpadora de Frutas)",
        price: 2500000,
        stock: 9,
        category: "agroindustria",
    },
    HOC001: {
        name: "VitrinaCool 120 (Vitrina Refrigerada)",
        price: 1700000,
        stock: 15,
        category: "horeca",
    },
    VEN001: {
        name: "VendiMax 24 (Máquina Expendedora)",
        price: 8000000,
        stock: 3,
        category: "vending",
    },
};
// Herramienta para obtener catálogo de productos
server.registerTool("get_product_catalog", {
    title: "Catálogo de Productos",
    description: "Obtiene el catálogo completo de productos disponibles para venta con filtros opcionales",
    inputSchema: {
        category: z
            .enum([
            "panaderia",
            "carnicos",
            "chocolates",
            "agroindustria",
            "horeca",
            "vending",
            "todos",
        ])
            .optional()
            .default("todos")
            .describe("Categoría de productos a mostrar"),
        minPrice: z.number().optional().describe("Precio mínimo para filtrar"),
        maxPrice: z.number().optional().describe("Precio máximo para filtrar"),
        inStock: z
            .boolean()
            .optional()
            .default(true)
            .describe("Solo mostrar productos en stock"),
    },
}, async ({ category, minPrice, maxPrice, inStock }) => {
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
    }));
    return {
        content: [
            {
                type: "text",
                text: `🛍️ Catálogo de Productos (${category}):\n\n` +
                    `📊 Total de productos: ${filteredProducts.length}\n\n` +
                    filteredProducts
                        .map((product) => `📦 ${product.name} (${product.id})\n` +
                        `   💰 Precio: $${product.price.toLocaleString()}\n` +
                        `   📈 Stock: ${product.stock} unidades (${product.disponibilidad})\n` +
                        `   🏷️ Categoría: ${product.category}\n`)
                        .join("\n"),
            },
        ],
    };
});
// Herramienta para calcular cotizaciones
server.registerTool("calculate_quote", {
    title: "Calculadora de Cotizaciones",
    description: "Calcula una cotización detallada para productos específicos con descuentos automáticos",
    inputSchema: {
        productId: z.string().describe("ID del producto (ej: CAM001, ALM002)"),
        quantity: z.number().min(1).describe("Cantidad solicitada"),
        customerType: z
            .enum(["nuevo", "recurrente", "empresarial"])
            .optional()
            .default("nuevo")
            .describe("Tipo de cliente para aplicar descuentos"),
        includeInstallation: z
            .boolean()
            .optional()
            .default(false)
            .describe("Incluir costo de instalación"),
        includeWarrantyExtension: z
            .boolean()
            .optional()
            .default(false)
            .describe("Incluir extensión de garantía"),
    },
}, async ({ productId, quantity, customerType, includeInstallation, includeWarrantyExtension, }) => {
    const product = PRODUCTS[productId];
    if (!product) {
        return {
            content: [
                {
                    type: "text",
                    text: `❌ Producto ${productId} no encontrado\n\n` +
                        `📋 Productos disponibles:\n` +
                        Object.keys(PRODUCTS).join(", "),
                },
            ],
            isError: true,
        };
    }
    // Verificar stock
    if (quantity > product.stock) {
        return {
            content: [
                {
                    type: "text",
                    text: `⚠️ Stock insuficiente para ${product.name}\n` +
                        `📦 Stock disponible: ${product.stock} unidades\n` +
                        `📝 Cantidad solicitada: ${quantity} unidades\n` +
                        `🔄 Tiempo de reabastecimiento: 7-10 días hábiles`,
                },
            ],
            isError: true,
        };
    }
    const unitPrice = product.price;
    const subtotal = unitPrice * quantity;
    // Calcular descuentos por cantidad
    let quantityDiscount = 0;
    if (quantity >= 20)
        quantityDiscount = 0.2;
    else if (quantity >= 10)
        quantityDiscount = 0.15;
    else if (quantity >= 5)
        quantityDiscount = 0.1;
    // Calcular descuentos por tipo de cliente
    let customerDiscount = 0;
    if (customerType === "empresarial")
        customerDiscount = 0.12;
    else if (customerType === "recurrente")
        customerDiscount = 0.08;
    // Combinar descuentos (no acumulativos, tomar el mayor)
    const totalDiscount = Math.max(quantityDiscount, customerDiscount);
    // Servicios adicionales
    let installationCost = 0;
    let warrantyCost = 0;
    if (includeInstallation) {
        installationCost =
            product.category === "cercas"
                ? 150000
                : product.category === "alarmas"
                    ? 100000
                    : 50000;
    }
    if (includeWarrantyExtension) {
        warrantyCost = Math.round(unitPrice * 0.15); // 15% del precio unitario
    }
    const discountAmount = subtotal * totalDiscount;
    const subtotalWithDiscount = subtotal - discountAmount;
    const total = subtotalWithDiscount + installationCost + warrantyCost;
    return {
        content: [
            {
                type: "text",
                text: `💰 COTIZACIÓN DETALLADA\n\n` +
                    `📦 Producto: ${product.name} (${productId})\n` +
                    `🔢 Cantidad: ${quantity} unidades\n` +
                    `💵 Precio unitario: $${unitPrice.toLocaleString()}\n` +
                    `💸 Subtotal: $${subtotal.toLocaleString()}\n\n` +
                    `🎯 DESCUENTOS APLICADOS:\n` +
                    `   • Por cantidad (${quantity} unidades): ${(quantityDiscount * 100).toFixed(1)}%\n` +
                    `   • Por tipo de cliente (${customerType}): ${(customerDiscount * 100).toFixed(1)}%\n` +
                    `   • Descuento total aplicado: ${(totalDiscount * 100).toFixed(1)}%\n` +
                    `   • Valor del descuento: -$${discountAmount.toLocaleString()}\n\n` +
                    `🛠️ SERVICIOS ADICIONALES:\n` +
                    `   • Instalación: ${includeInstallation
                        ? `$${installationCost.toLocaleString()}`
                        : "No incluida"}\n` +
                    `   • Extensión de garantía: ${includeWarrantyExtension
                        ? `$${warrantyCost.toLocaleString()}`
                        : "No incluida"}\n\n` +
                    `✅ TOTAL FINAL: $${total.toLocaleString()}\n\n` +
                    `📊 Stock disponible: ${product.stock} unidades\n` +
                    `🚚 Tiempo de entrega: 2-3 días hábiles\n` +
                    `📞 Válida por: 15 días`,
            },
        ],
    };
});
// Herramienta para verificar inventario
server.registerTool("check_inventory", {
    title: "Verificador de Inventario",
    description: "Verifica la disponibilidad de productos en inventario con detalles de reabastecimiento",
    inputSchema: {
        productId: z.string().describe("ID del producto a verificar"),
        requiredQuantity: z
            .number()
            .optional()
            .describe("Cantidad requerida para verificar disponibilidad"),
    },
}, async ({ productId, requiredQuantity }) => {
    const product = PRODUCTS[productId];
    if (!product) {
        return {
            content: [
                {
                    type: "text",
                    text: `❌ Producto ${productId} no encontrado\n\n` +
                        `📋 Productos disponibles para consulta:\n` +
                        Object.entries(PRODUCTS)
                            .map(([id, p]) => `   • ${id}: ${p.name}`)
                            .join("\n"),
                },
            ],
            isError: true,
        };
    }
    const status = product.stock > 10
        ? "✅ Stock alto"
        : product.stock > 5
            ? "⚠️ Stock medio"
            : product.stock > 0
                ? "🔴 Stock bajo"
                : "❌ Agotado";
    const availability = requiredQuantity
        ? product.stock >= requiredQuantity
            ? "✅ Disponible"
            : "❌ Insuficiente"
        : "N/A";
    // Simular próximos ingresos
    const nextDelivery = new Date();
    nextDelivery.setDate(nextDelivery.getDate() + Math.floor(Math.random() * 14) + 7);
    return {
        content: [
            {
                type: "text",
                text: `📦 ESTADO DE INVENTARIO\n\n` +
                    `🏷️ Producto: ${product.name} (${productId})\n` +
                    `🔢 Stock actual: ${product.stock} unidades\n` +
                    `📊 Estado: ${status}\n` +
                    `💰 Precio actual: $${product.price.toLocaleString()}\n\n` +
                    (requiredQuantity
                        ? `🎯 CONSULTA ESPECÍFICA:\n` +
                            `   • Cantidad requerida: ${requiredQuantity} unidades\n` +
                            `   • Disponibilidad: ${availability}\n` +
                            `   • Faltante: ${requiredQuantity > product.stock
                                ? requiredQuantity - product.stock
                                : 0} unidades\n\n`
                        : "") +
                    `🚚 INFORMACIÓN DE REABASTECIMIENTO:\n` +
                    `   • Próximo ingreso: ${nextDelivery.toLocaleDateString()}\n` +
                    `   • Cantidad esperada: ${Math.floor(Math.random() * 50) + 20} unidades\n` +
                    `   • Proveedor: Fenix Distribuciones S.A.S.\n\n` +
                    `⏱️ TIEMPOS DE ENTREGA:\n` +
                    `   • En stock: 1-2 días hábiles\n` +
                    `   • Bajo pedido: 7-10 días hábiles\n` +
                    `   • Importación: 15-20 días hábiles`,
            },
        ],
    };
});
// Herramienta para obtener promociones activas
server.registerTool("get_active_promotions", {
    title: "Promociones Activas",
    description: "Obtiene las promociones y ofertas especiales vigentes",
    inputSchema: {
        customerSegment: z
            .enum(["individual", "empresarial", "distribuidor"])
            .optional()
            .default("individual")
            .describe("Segmento de cliente"),
        category: z
            .enum([
            "panaderia",
            "carnicos",
            "chocolates",
            "agroindustria",
            "horeca",
            "vending",
            "todos",
        ])
            .optional()
            .default("todos")
            .describe("Categoría de productos"),
    },
}, async ({ customerSegment, category }) => {
    // Promociones simuladas
    const promotions = [
        {
            id: "PROMO001",
            title: "Combo Panadería Total",
            description: "Amasadora + Horno con 18% descuento",
            products: ["PAN001", "PAN003"],
            discount: 0.18,
            validUntil: "2024-12-31",
            segment: ["individual", "empresarial"],
        },
        {
            id: "PROMO002",
            title: "Descuento Cárnicos Pro",
            description: "12% en compras mayores a $7,000,000 en equipos cárnicos",
            minAmount: 7000000,
            discount: 0.12,
            validUntil: "2024-12-15",
            segment: ["empresarial", "distribuidor"],
            category: "carnicos",
        },
        {
            id: "PROMO003",
            title: "ChocoPack",
            description: "Refinadora + Templadora con envío gratis",
            products: ["CHO001", "CHO002"],
            benefit: "Envío gratis",
            validUntil: "2024-11-30",
            segment: ["individual", "empresarial"],
            category: "chocolates",
        },
    ];
    const applicablePromotions = promotions.filter((promo) => promo.segment.includes(customerSegment) &&
        (!promo.category || promo.category === category || category === "todos"));
    return {
        content: [
            {
                type: "text",
                text: `🎉 PROMOCIONES ACTIVAS\n\n` +
                    `👤 Segmento: ${customerSegment}\n` +
                    `🏷️ Categoría: ${category}\n` +
                    `📅 Fecha: ${new Date().toLocaleDateString()}\n\n` +
                    (applicablePromotions.length > 0
                        ? applicablePromotions
                            .map((promo) => `🎯 ${promo.title} (${promo.id})\n` +
                            `   📝 ${promo.description}\n` +
                            `   ${promo.discount
                                ? `💰 Descuento: ${promo.discount * 100}%`
                                : `🎁 Beneficio: ${promo.benefit}`}\n` +
                            `   📅 Válida hasta: ${promo.validUntil}\n` +
                            (promo.products
                                ? `   📦 Productos: ${promo.products.join(", ")}\n`
                                : "") +
                            (promo.minAmount
                                ? `   💵 Monto mínimo: $${promo.minAmount.toLocaleString()}\n`
                                : ""))
                            .join("\n")
                        : `❌ No hay promociones disponibles para ${customerSegment} en ${category}`) +
                    `\n\n📞 Para aplicar promociones contactar:\n` +
                    `   • Email: ventas@induequipos.com\n` +
                    `   • Teléfono: +57 1 234 5678\n` +
                    `   • WhatsApp: +57 300 123 4567`,
            },
        ],
    };
});
// Iniciar servidor solo si se ejecuta directamente
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("🛍️ Servidor MCP de Ventas iniciado correctamente");
}
// Solo ejecutar si es el archivo principal
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch((error) => {
        console.error("❌ Error iniciando servidor de ventas:", error);
        process.exit(1);
    });
}
export { server };
