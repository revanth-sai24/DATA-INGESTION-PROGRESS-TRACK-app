# 📊 Sample Data Documentation

## Overview

The Task Manager comes pre-loaded with sample data to help you get started quickly. This includes realistic example tasks and projects that demonstrate all the features of the application.

## Sample Data Files

### 📋 sample-tasks.csv

Located at: `/public/sample-tasks.csv`

Contains 15 sample tasks with:

- **Various statuses**: Todo, In Progress, Done
- **Multiple projects**: Website Redesign, Backend API, Marketing Website, Mobile App, DevOps, UX Research
- **Different priorities**: High, Medium, Low
- **Realistic descriptions**: Full task descriptions with technical details
- **Tags**: Categorized with relevant tags (design, backend, testing, etc.)
- **Subtasks**: Some tasks include subtasks to demonstrate the feature
- **Time tracking**: Pre-filled time elapsed for demonstration
- **Due dates**: Realistic due dates spread across the month

### 📁 sample-projects.csv

Located at: `/public/sample-projects.csv`

Contains 6 sample projects:

1. **Website Redesign** - Frontend development project
2. **Backend API** - API development and authentication
3. **Marketing Website** - Marketing materials and landing pages
4. **Mobile App** - Cross-platform mobile development
5. **DevOps** - Infrastructure and automation
6. **UX Research** - User research and testing

## How It Works

### First Time Load

When you first open the application:

1. The app checks if you have any existing tasks or projects
2. It checks if sample data has been loaded before (via localStorage flag)
3. If both checks pass, it fetches the CSV files from `/public/`
4. Data is parsed using PapaParse
5. Tasks and projects are loaded into the application
6. A welcome message appears confirming the load
7. A flag is set in localStorage to prevent reloading on refresh

### Loading Sample Data Again

You can reload sample data at any time by:

1. Clicking the **Refresh icon** (🔄) in the header
2. This clears the localStorage flag
3. The page reloads automatically
4. Sample data loads again (this will **replace** any existing data)

**Warning**: Loading sample data will replace all your current tasks and projects!

## Sample Data Structure

### Task Fields

```csv
ID,Title,Description,Status,Project,Priority,DueDate,EstimatedTime,Tags,CreatedAt,Subtasks,TimeElapsed
```

Example row:

```csv
1,Design Homepage Mockup,Create wireframes and high-fidelity mockups...,Todo,Website Redesign,High,2026-01-20,8,design;ui;figma,2026-01-10T09:00:00.000Z,Hero Section;Navigation Bar;Footer Design,0
```

### Project Fields

```csv
ProjectName,Description,CreatedAt,TaskCount,CompletedCount
```

Example row:

```csv
Website Redesign,Complete overhaul of company website with modern design...,2026-01-05T09:00:00.000Z,4,1
```

## Customizing Sample Data

### To Modify Sample Tasks:

1. Edit `/public/sample-tasks.csv`
2. Follow the CSV format exactly
3. Use semicolons (;) to separate multiple values in Tags and Subtasks
4. Use ISO date format for dates: `YYYY-MM-DDTHH:mm:ss.sssZ`
5. Ensure all required fields are present

### To Modify Sample Projects:

1. Edit `/public/sample-projects.csv`
2. Maintain the CSV structure
3. Project names must match those used in tasks

## Sample Data Examples

### High Priority Task with Subtasks

```
Title: Setup CI/CD Pipeline
Status: In Progress
Priority: High
Subtasks: Configure Actions; Setup Tests; Deploy Script
Time Elapsed: 8945 seconds (≈ 2.5 hours)
Tags: devops, automation, github
```

### Completed Task

```
Title: Create Product Landing Page
Status: Done
Priority: Medium
Time Elapsed: 18234 seconds (≈ 5 hours)
Project: Marketing Website
```

### Task with Multiple Tags

```
Title: Performance Optimization
Tags: performance, optimization, react
Subtasks: Lazy Loading, Code Splitting, Image Optimization
```

## Benefits of Sample Data

1. **Instant Understanding**: See all features in action immediately
2. **Learn by Example**: Understand how to structure tasks and projects
3. **Test Features**: Try time tracking, filters, search with real data
4. **See Analytics**: Charts populated with meaningful data
5. **UI Demonstration**: See how the app looks with content

## When Sample Data Loads

✅ **Will Load**:

- First time opening the app
- After clicking "Load Sample Data" button
- After manually clearing localStorage and refreshing

❌ **Will NOT Load**:

- If you have existing tasks or projects
- If you've already loaded sample data once
- After normal page refreshes (data persists in memory during session)

## Preventing Sample Data Load

If you don't want sample data to load:

1. Create at least one task or project manually first
2. Or, remove the CSV files from `/public/` directory
3. Or, comment out the `loadSampleData()` call in the code

## Sample Data vs Your Data

| Feature          | Sample Data                   | Your Data                      |
| ---------------- | ----------------------------- | ------------------------------ |
| **Persistence**  | Reloads on flag clear         | Session-based (export to save) |
| **Modification** | Edit CSV files                | Edit through UI                |
| **Export**       | Can be exported like any data | Yes, use Export button         |
| **Import**       | Automatic on first load       | Manual CSV import              |
| **Reset**        | Click refresh button          | Clear and reload sample        |

## Code Location

The sample data loading logic is in `/src/app/page.js`:

```javascript
// Load sample data on first visit
const loadSampleData = useCallback(async () => {
  // Check if data already exists
  const hasExistingData = tasks.length > 0 || projects.length > 0;
  const hasLoadedSample = localStorage.getItem("sampleDataLoaded");

  if (hasExistingData || hasLoadedSample) {
    return;
  }

  // Fetch and parse sample CSV files...
}, [tasks.length, projects.length]);
```

## Tips for Using Sample Data

1. **Explore Features**: Use sample tasks to test all features
2. **Modify Don't Delete**: Edit sample tasks to learn the UI
3. **Export First**: Before loading fresh sample data, export current work
4. **Use as Template**: Sample data structure shows best practices
5. **Clear When Ready**: Delete sample tasks when you're ready to add your own

## Troubleshooting

**Q: Sample data not loading?**

- Check browser console for errors
- Ensure CSV files exist in `/public/` folder
- Clear localStorage and refresh

**Q: Sample data loads every time?**

- This shouldn't happen - check if localStorage is enabled
- Verify the flag is being set correctly

**Q: Want to start fresh without sample data?**

- Export your current work first
- Clear localStorage: `localStorage.removeItem('sampleDataLoaded')`
- Delete all tasks and projects through UI
- Or refresh and sample data reloads

## Advanced: Creating Your Own Sample Sets

You can create multiple sample data sets:

1. Create `sample-tasks-advanced.csv`
2. Create `sample-tasks-minimal.csv`
3. Modify the `loadSampleData()` function to load different sets
4. Add UI buttons to switch between sample sets

Example:

```javascript
const loadCustomSample = async (filename) => {
  const response = await fetch(`/${filename}.csv`);
  // ... parse and load
};
```

---

**Remember**: Sample data is a learning tool. Export to CSV regularly to save your real work!
