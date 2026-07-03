import puppeteer from 'puppeteer';

let browserPromise = null;

async function getBrowser() {
    if (!browserPromise) {
        browserPromise = puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
    }
    return browserPromise;
}

function buildHtmlTemplate(user, data) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Audit Report - ${user.name}</title>
        <style>
            @media print {
                body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 20px; }
                h1 { color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 10px; }
                .section { margin-bottom: 20px; }
                .metric { font-weight: bold; }
                .no-print { display: none !important; }
            }
            body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; margin: 0; padding: 40px; }
            h1 { color: #0056b3; border-bottom: 2px solid #0056b3; padding-bottom: 10px; }
            .section { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .metric { font-weight: bold; }
        </style>
    </head>
    <body>
        <h1>Professional Profile & Audit Report</h1>
        <div class="section">
            <p><span class="metric">Name:</span> ${user.name}</p>
            <p><span class="metric">Email:</span> ${user.email}</p>
            <p><span class="metric">Generated At:</span> ${new Date().toLocaleString()}</p>
        </div>
        <div class="section">
            <h2>Summary</h2>
            <p>This document certifies the professional insights and platform activities associated with the user.</p>
        </div>
    </body>
    </html>
    `;
}

export async function handleReportRequest(req, res, pathname, session) {
    if (req.method !== 'GET') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Method not allowed' }));
    }

    const type = pathname === '/api/reports/export/pdf' ? 'pdf' : 'image';
    
    try {
        const browser = await getBrowser();
        const page = await browser.newPage();
        
        // Mock data for the report (in a real scenario, fetch from DB)
        const mockData = {};
        
        const html = buildHtmlTemplate(session, mockData);
        await page.setContent(html, { waitUntil: 'networkidle0' });

        if (type === 'pdf') {
            const pdfBuffer = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
            });
            await page.close();
            
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="report_${session.sub}.pdf"`,
                'Content-Length': pdfBuffer.length
            });
            return res.end(pdfBuffer);
        } else {
            const imageBuffer = await page.screenshot({
                type: 'png',
                fullPage: true,
                deviceScaleFactor: 2
            });
            await page.close();
            
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Disposition': `attachment; filename="report_${session.sub}.png"`,
                'Content-Length': imageBuffer.length
            });
            return res.end(imageBuffer);
        }
    } catch (error) {
        console.error('Report generation error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Failed to generate report' }));
    }
}
