import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { getPensionadoByCedula } from '../functions/pensionadoFunctions.js';
export const consultarDatosPensionadoTool = tool(async ({ cedula }) => {
    const datos = await getPensionadoByCedula(cedula);
    if (!datos) {
        return JSON.stringify({ encontrado: false });
    }
    if (datos.sexo === 'M')
        datos.sexo = 'Masculino';
    else if (datos.sexo === 'F')
        datos.sexo = 'Femenino';
    const camposFaltantes = Object.entries(datos)
        .filter(([campo, valor]) => campo !== 'cedula' && (valor === null || valor === ''))
        .map(([campo]) => campo);
    return JSON.stringify({ encontrado: true, datos, campos_faltantes: camposFaltantes });
}, {
    name: 'consultar_datos_pensionado',
    description: 'Consulta la base de datos de pensionados por número de cédula. Retorna los datos disponibles y la lista de campos que faltan y deben pedirse al cliente.',
    schema: z.object({
        cedula: z.string().describe('Número de cédula del pensionado (solo dígitos)'),
    }),
});
