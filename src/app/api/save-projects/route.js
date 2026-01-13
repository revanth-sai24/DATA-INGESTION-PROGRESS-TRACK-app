import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function POST(request) {
    try {
        const { projects } = await request.json();

        const csvData = projects.map(project => ({
            name: project,
            createdAt: new Date().toISOString()
        }));

        const csv = Papa.unparse(csvData);
        const filePath = path.join(process.cwd(), 'public', 'sample-projects.csv');

        fs.writeFileSync(filePath, csv, 'utf8');

        return NextResponse.json({ success: true, message: 'Projects saved to CSV' });
    } catch (error) {
        console.error('Error saving projects:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
