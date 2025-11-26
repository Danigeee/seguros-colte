import colombia from '../data/colombia.json';
export function contactCustomerService() {
    const customerServiceData = {
        whatsapp: "https://wa.me/573335655669",
        description: "Linea de atención especializada para ventas.",
    };
    console.log('contactCustomerService executed');
    return JSON.stringify(customerServiceData);
}
// Función para eliminar tildes y diéresis
function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
// Lista de departamentos permitidos
const allowedDepartments = [
    "Antioquia",
    "Córdoba",
    "Chocó",
    "Norte de Santander",
    "Guainía",
    "Boyacá",
    "Arauca"
];
// Función para validar si el municipio ingresado pertenece a Antioquia, Córdoba, Chocó, Norte de Santander, Guainía, Boyacá o Arauca. Leerlo del archivo colombia.json
export function validateCity(city) {
    console.log('validateCity executed');
    const normalizedCity = removeAccents(city.toLowerCase());
    const filteredDepartments = colombia.filter((dept) => allowedDepartments.includes(dept.departamento));
    const cityExists = filteredDepartments.some((dept) => dept.ciudades.some((c) => removeAccents(c.toLowerCase()) === normalizedCity));
    if (cityExists) {
        return "Perfecto, tu ciudad está dentro de nuestra cobertura.";
    }
    return "Lo siento, actualmente no tenemos cobertura en tu ciudad. Puedes comunicarte en el siguiente enlace: https://wa.me/573186925681";
}
export function getProductInfo(product) {
    const products = {
        "cámara": {
            description: "Cámara de seguridad para interiores y exteriores.",
            price: "$200.000",
            features: ["Resolución HD", "Visión nocturna", "Detección de movimiento"],
        },
        "alarma": {
            description: "Alarma para proteger tu hogar o negocio.",
            price: "$150.000",
            features: ["Sirena de alta potencia", "Sensor de movimiento", "Control remoto"],
        },
        "cerca eléctrica": {
            description: "Cerca eléctrica para proteger tu propiedad.",
            price: "$300.000",
            features: ["Alarma de alta potencia", "Sensor de movimiento", "Control remoto"],
        },
    };
    console.log('getProductInfo executed');
    const productInfo = products[product];
    if (productInfo) {
        return JSON.stringify(productInfo);
    }
    return "Lo siento, no tenemos información sobre ese producto.";
}
// Función para solucionar problema con camara que no da imagen
export function troubleshootIssue(issue) {
    console.log('troubleshootIssue executed');
    let result;
    if (issue === "no hay imagen" || issue === "no da imagen" || issue === "no hay video") {
        result = "1. Verifica que la cámara esté conectada a la corriente y encendida.\n2. Asegúrate de que la cámara esté conectada al router mediante un cable Ethernet.\n3. Reinicia la cámara y el router.\n4. Si el problema persiste, restablece la cámara a los valores de fábrica.";
    }
    else if (issue === "imagen borrosa" || issue === "imagen distorsionada") {
        result = "1. Limpia la lente de la cámara con un paño suave y seco.\n2. Ajusta la resolución de la cámara en la aplicación móvil.\n3. Verifica que la cámara esté enfocada correctamente.";
    }
    else if (issue === "imagen con ruido" || issue === "imagen con interferencias") {
        result = "1. Aleja la cámara de dispositivos electrónicos que puedan causar interferencias.\n2. Verifica que la cámara esté conectada a una fuente de energía estable.\n3. Actualiza el firmware de la cámara.";
    }
    else {
        result = "Lo siento, no tengo información sobre ese problema.";
    }
    return JSON.stringify(result);
}
