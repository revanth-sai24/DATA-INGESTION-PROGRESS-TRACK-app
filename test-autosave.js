console.log("Testing auto-save functionality...");

// Test task data
const testTask = {
    id: 'test-001',
    title: 'Test Task',
    description: 'Testing auto-save to CSV',
    status: 'In Progress',
    project: 'Test Project',
    priority: 'High',
    createdAt: new Date().toISOString()
};

console.log("Sample task:", testTask);
console.log("Auto-save should trigger when you create/edit tasks in the app!");