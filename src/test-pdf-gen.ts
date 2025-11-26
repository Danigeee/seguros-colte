import { pdfService } from './services/pdfService';
import fs from 'fs';
import path from 'path';

async function testPdfGeneration() {
    console.log("Starting PDF generation test...");

    const mockEstimation = {
        id: '123456',
        sequential_number: 'EST-2025-001',
        net_total: 1250.00,
        client: {
            name: 'John Doe',
            address: '123 Main St, Springfield, IL',
            email: 'john.doe@example.com',
            phone: '555-123-4567'
        },
        items: [
            {
                description: 'Concrete Slab Repair',
                quantity: 1,
                unit: 'LS',
                unit_cost: 500.00,
                line_total: 500.00
            },
            {
                description: 'Sidewalk Replacement',
                quantity: 50,
                unit: 'SF',
                unit_cost: 15.00,
                line_total: 750.00
            }
        ]
    };

    try {
        const pdfBuffer = await pdfService.generatePdfFromData(mockEstimation);
        const outputPath = path.join(process.cwd(), 'test-estimation.pdf');
        fs.writeFileSync(outputPath, pdfBuffer);
        console.log(`PDF generated successfully at: ${outputPath}`);
    } catch (error) {
        console.error("Error generating PDF:", error);
    }
}

testPdfGeneration();
