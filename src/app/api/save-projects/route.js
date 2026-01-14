import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function POST(request) {
    try {
        const { projects } = await request.json();

        const csvData = projects.map(project => {
            // Handle both string projects (legacy) and object projects (new)
            if (typeof project === 'string') {
                return {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    name: project,
                    description: '',
                    color: '#3B82F6',
                    status: 'active',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            } else {
                return {
                    id: project.id || Date.now().toString() + Math.random().toString(36).substr(2, 5),
                    name: project.name || '',
                    description: project.description || '',
                    color: project.color || '#3B82F6',
                    status: project.status || 'active',
                    createdAt: project.createdAt || new Date().toISOString(),
                    updatedAt: project.updatedAt || new Date().toISOString()
                };
            }
        });

        // Preserve header row even when projects list is empty
        const headers = ['id', 'name', 'description', 'color', 'status', 'createdAt', 'updatedAt'].join(',');
        const csv = csvData.length > 0 ? Papa.unparse(csvData) : `${headers}\n`;
        const filePath = path.join(process.cwd(), 'public', 'sample-projects.csv');

        fs.writeFileSync(filePath, csv, 'utf8');

        return NextResponse.json({ success: true, message: 'Projects saved to CSV' });
    } catch (error) {
        console.error('Error saving projects:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
