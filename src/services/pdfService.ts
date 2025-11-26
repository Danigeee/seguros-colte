import PdfPrinter from 'pdfmake';
import path from 'path';
import { supabase } from '../config/supabase';

// Configuración de fuentes para PDFMake
// Asegúrate de tener la carpeta 'fonts' en la raíz del proyecto con estos archivos
const fonts = {
  Roboto: {
    normal: path.join(process.cwd(), 'fonts', 'Roboto-Regular.ttf'),
    bold: path.join(process.cwd(), 'fonts', 'Roboto-Medium.ttf'),
    italics: path.join(process.cwd(), 'fonts', 'Roboto-Italic.ttf'),
    bolditalics: path.join(process.cwd(), 'fonts', 'Roboto-MediumItalic.ttf')
  }
};

export const pdfService = {
  async generateEstimationPdf(estimationId: string): Promise<Buffer> {
    try {
      // 1. Obtener datos de Supabase
      const { data: estimation, error } = await supabase
        .from('estimations')
        .select(`
          *,
          client:clients (
            name,
            address,
            email,
            phone
          ),
          items:estimation_items (
            description,
            quantity,
            unit,
            unit_cost,
            line_total
          )
        `)
        .eq('id', estimationId)
        .single();

      if (error || !estimation) {
        throw new Error(`Error fetching estimation: ${error?.message || 'Not found'}`);
      }

      return this.generatePdfFromData(estimation);

    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  },

  async generatePdfFromData(estimation: any): Promise<Buffer> {
      const client = (estimation as any).client || {};
      const items = ((estimation as any).items || []) as any[];
      const logoUrl = 'https://firebasestorage.googleapis.com/v0/b/ultim-admin-dashboard.appspot.com/o/cemtech%2Flogo_cemtech.png?alt=media&token=443ea967-ac7f-4b81-b4b6-d1e4e7c7978b';
      
      let logoImage: string | null = null;
      try {
          const response = await fetch(logoUrl);
          if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              logoImage = `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`;
          }
      } catch (e) {
          console.warn("Could not fetch logo:", e);
      }

      // Colores corporativos
      const colors = {
          primary: '#2C3E50', // Dark Blue/Grey
          secondary: '#E74C3C', // Accent Red (optional, maybe for totals)
          headerBg: '#F8F9FA',
          tableHeaderBg: '#2C3E50',
          tableHeaderText: '#FFFFFF',
          zebraRow: '#F8F9FA',
          border: '#E0E0E0'
      };

      // 2. Construir el Document Definition
      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 60], // Increased margins
        content: [
          // Header Section with Logo and Info
          {
            columns: [
              {
                // Logo Column
                image: logoImage,
                width: 150,
                fit: [150, 80]
              },
              {
                // Info Column
                stack: [
                  { text: 'ESTIMATE', style: 'mainHeader', alignment: 'right' },
                  { 
                    text: [
                        { text: 'Estimate #: ', bold: true }, `${estimation.sequential_number}\n`,
                        { text: 'Date: ', bold: true }, `${new Date().toLocaleDateString()}\n`,
                    ],
                    alignment: 'right',
                    style: 'headerInfo',
                    margin: [0, 5, 0, 0]
                  }
                ],
                width: '*'
              }
            ],
            columnGap: 20,
            margin: [0, 0, 0, 30]
          },

          // Divider
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: colors.primary }], margin: [0, 0, 0, 20] },

          // Client & Company Info Grid
          {
            columns: [
              {
                stack: [
                  { text: 'FROM', style: 'sectionLabel' },
                  { text: 'Cemtech Enterprise Inc.', style: 'companyName' },
                  { text: '2826 Springdale Rd.', style: 'normalText' },
                  { text: 'Snellville , GA 30039', style: 'normalText' },
                  { text: 'United States', style: 'normalText' },
                  { text: 'Email: Info@cemtechenterprise.com', style: 'normalText', margin: [0, 5, 0, 0] },
                  { text: 'Phone: 678-749-6426', style: 'normalText' },
                  { text: 'Website: Cemtechenterprise.com', style: 'normalText' }
                ]
              },
              {
                stack: [
                  { text: 'BILL TO', style: 'sectionLabel' },
                  { text: client?.name || 'Valued Client', style: 'clientName' },
                  { text: client?.address || '', style: 'normalText' },
                  { text: client?.phone ? `Phone: ${client.phone}` : '', style: 'normalText', margin: [0, 5, 0, 0] },
                  { text: client?.email ? `Email: ${client.email}` : '', style: 'normalText' }
                ]
              }
            ],
            columnGap: 40,
            margin: [0, 0, 0, 40]
          },

          // Items Table
          {
            table: {
              headerRows: 1,
              widths: ['*', 'auto', 'auto', 'auto', 'auto'],
              body: [
                [
                  { text: 'DESCRIPTION', style: 'tableHeader', border: [false, false, false, false], fillColor: colors.tableHeaderBg },
                  { text: 'QTY', style: 'tableHeader', alignment: 'center', border: [false, false, false, false], fillColor: colors.tableHeaderBg },
                  { text: 'UNIT', style: 'tableHeader', alignment: 'center', border: [false, false, false, false], fillColor: colors.tableHeaderBg },
                  { text: 'PRICE', style: 'tableHeader', alignment: 'right', border: [false, false, false, false], fillColor: colors.tableHeaderBg },
                  { text: 'TOTAL', style: 'tableHeader', alignment: 'right', border: [false, false, false, false], fillColor: colors.tableHeaderBg }
                ],
                ...items.map((item, index) => [
                  { 
                      text: item.description || '', 
                      style: 'tableCell', 
                      fillColor: index % 2 === 1 ? colors.zebraRow : null,
                      border: [false, false, false, true],
                      borderColor: colors.border
                  },
                  { 
                      text: item.quantity?.toString() || '0', 
                      style: 'tableCell', 
                      alignment: 'center',
                      fillColor: index % 2 === 1 ? colors.zebraRow : null,
                      border: [false, false, false, true],
                      borderColor: colors.border
                  },
                  { 
                      text: item.unit || '', 
                      style: 'tableCell', 
                      alignment: 'center',
                      fillColor: index % 2 === 1 ? colors.zebraRow : null,
                      border: [false, false, false, true],
                      borderColor: colors.border
                  },
                  { 
                      text: `$${item.unit_cost?.toFixed(2) || '0.00'}`, 
                      style: 'tableCell', 
                      alignment: 'right',
                      fillColor: index % 2 === 1 ? colors.zebraRow : null,
                      border: [false, false, false, true],
                      borderColor: colors.border
                  },
                  { 
                      text: `$${item.line_total?.toFixed(2) || '0.00'}`, 
                      style: 'tableCell', 
                      alignment: 'right',
                      fillColor: index % 2 === 1 ? colors.zebraRow : null,
                      border: [false, false, false, true],
                      borderColor: colors.border
                  }
                ])
              ]
            },
            layout: {
                hLineWidth: (i: number, node: any) => (i === node.table.body.length) ? 1 : 1,
                vLineWidth: () => 0,
                hLineColor: () => colors.border
            }
          },

          // Totals Section
          {
            columns: [
                { width: '*', text: '' },
                {
                    width: 200,
                    table: {
                        widths: ['*', 'auto'],
                        body: [
                            [
                                { text: 'Subtotal:', style: 'totalLabel', alignment: 'right' },
                                { text: `$${estimation.net_total?.toFixed(2) || '0.00'}`, style: 'totalValue', alignment: 'right' }
                            ],
                            // Add Tax or other fields here if needed
                            [
                                { text: 'Total:', style: 'grandTotalLabel', alignment: 'right', margin: [0, 10, 0, 0] },
                                { text: `$${estimation.net_total?.toFixed(2) || '0.00'}`, style: 'grandTotalValue', alignment: 'right', margin: [0, 10, 0, 0] }
                            ]
                        ]
                    },
                    layout: 'noBorders'
                }
            ],
            margin: [0, 20, 0, 0]
          },
          
          // Footer Message
          {
              text: 'Thank you for your business!',
              style: 'footerMessage',
              alignment: 'center',
              margin: [0, 50, 0, 0]
          }
        ],
        styles: {
          mainHeader: {
            fontSize: 24,
            bold: true,
            color: colors.primary,
            letterSpacing: 1
          },
          headerInfo: {
            fontSize: 10,
            color: '#555555',
            lineHeight: 1.3
          },
          sectionLabel: {
            fontSize: 10,
            bold: true,
            color: '#999999',
            margin: [0, 0, 0, 5]
          },
          companyName: {
            fontSize: 12,
            bold: true,
            color: '#333333',
            margin: [0, 0, 0, 2]
          },
          clientName: {
            fontSize: 12,
            bold: true,
            color: '#333333',
            margin: [0, 0, 0, 2]
          },
          normalText: {
            fontSize: 10,
            color: '#555555',
            lineHeight: 1.3
          },
          tableHeader: {
            bold: true,
            fontSize: 10,
            color: colors.tableHeaderText,
            margin: [5, 8, 5, 8]
          },
          tableCell: {
            fontSize: 10,
            color: '#333333',
            margin: [5, 8, 5, 8]
          },
          totalLabel: {
            fontSize: 10,
            bold: true,
            color: '#555555'
          },
          totalValue: {
            fontSize: 10,
            color: '#333333'
          },
          grandTotalLabel: {
            fontSize: 14,
            bold: true,
            color: colors.primary
          },
          grandTotalValue: {
            fontSize: 14,
            bold: true,
            color: colors.primary
          },
          footerMessage: {
              fontSize: 12,
              italics: true,
              color: '#777777'
          }
        },
        defaultStyle: {
          font: 'Roboto'
        }
      };

      // 3. Generar PDF
      const printer = new PdfPrinter(fonts);
      const pdfDoc = printer.createPdfKitDocument(docDefinition);

      return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        pdfDoc.on('data', (chunk) => chunks.push(chunk));
        pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
        pdfDoc.on('error', (err) => reject(err));
        pdfDoc.end();
      });
  }
};
