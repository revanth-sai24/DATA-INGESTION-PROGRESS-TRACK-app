import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'public', 'sample-tasks.csv');

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ tasks: [] });
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');

        const { data, errors } = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true
        });

        if (errors.length > 0) {
            console.error('CSV parsing errors:', errors);
        }

        return NextResponse.json({ tasks: data || [] });
    } catch (error) {
        console.error('Error loading tasks from CSV:', error);
        return NextResponse.json({ tasks: [] }, { status: 500 });
    }
}
