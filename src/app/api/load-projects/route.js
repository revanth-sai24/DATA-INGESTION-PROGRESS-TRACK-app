import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'public', 'sample-projects.csv');

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ projects: [] });
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

        return NextResponse.json({ projects: data || [] });
    } catch (error) {
        console.error('Error loading projects from CSV:', error);
        return NextResponse.json({ projects: [] }, { status: 500 });
    }
}
