import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export async function POST(request) {
    try {
        const { tasks } = await request.json();

        const csvData = tasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description || '',
            status: task.status,
            project: task.project || '',
            priority: task.priority,
            dueDate: task.dueDate || '',
            createdAt: task.createdAt || '',
            estimatedTime: task.estimatedTime || '',
            tags: Array.isArray(task.tags) ? task.tags.join(';') : '',
            timeElapsed: task.timeTracking ? task.timeTracking.elapsed || 0 : 0
        }));

        // Ensure CSV file keeps its header even when there are no rows
        const headers = [
            'id',
            'title',
            'description',
            'status',
            'project',
            'priority',
            'dueDate',
            'createdAt',
            'estimatedTime',
            'tags',
            'timeElapsed'
        ].join(',');

        const csv = csvData.length > 0 ? Papa.unparse(csvData) : `${headers}\n`;
        const filePath = path.join(process.cwd(), 'public', 'sample-tasks.csv');

        fs.writeFileSync(filePath, csv, 'utf8');

        return NextResponse.json({ success: true, message: 'Tasks saved to CSV' });
    } catch (error) {
        console.error('Error saving tasks:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
