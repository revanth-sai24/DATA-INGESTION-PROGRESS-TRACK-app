# 🚀 Advanced Task Manager & Data Ingestion Progress Tracker

A professional-grade task management and data ingestion monitoring application built with Next.js 15, React 19, and Material-UI 7.

## ✨ Key Features

### 📋 Task Management

- **CSV-based Data Storage** - No backend required, data persists in portable CSV files
- **Advanced Task Features** - Subtasks, time tracking, tags, priorities, due dates
- **Multiple Views** - Card view and sortable table view
- **Bulk Operations** - Select and manage multiple tasks at once
- **Comments System** - Add notes and updates to any task
- **Archive Management** - Keep completed tasks organized

### 📊 Analytics & Visualizations

- **Real-time Charts** - Status distribution, priority breakdown, completion trends
- **Project Progress** - Track progress across multiple projects
- **7-Day Trends** - Visual completion trends over time
- **Interactive Dashboards** - Built with Recharts

### 🎨 User Experience

- **Dark Mode** - Toggle between light and dark themes
- **Keyboard Shortcuts** - Power user features (Ctrl+N, Ctrl+Z, Ctrl+F)
- **Undo/Redo** - Full history tracking with one-click restore
- **Search & Filter** - Find tasks instantly across all fields
- **Responsive Design** - Works beautifully on desktop and mobile

### 🤖 Data Ingestion Assistant

- **Conversational Interface** - AI-powered setup wizard
- **Source & Target Connections** - PostgreSQL, ADLS, and more
- **Pipeline Configuration** - Schema and table selection
- **Real-time Monitoring** - Track ingestion progress and results

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for Task Manager  
Open [http://localhost:3000/chat](http://localhost:3000/chat) for Data Ingestion Assistant

### Sample Data

**New!** The app comes pre-loaded with sample data on first visit:

- 15 realistic sample tasks across 6 projects
- Demonstrates all features (subtasks, time tracking, tags, priorities)
- Automatically loads when you first open the app
- Click the **Refresh** button (🔄) in header to reload sample data anytime

See **[SAMPLE_DATA.md](SAMPLE_DATA.md)** for full documentation on sample data.

### First Steps

1. **Create a Project** - Use the sidebar to organize your tasks
2. **Add Tasks** - Fill in the form with details, tags, and estimated time
3. **Track Time** - Click the play button to start tracking work time
4. **View Analytics** - Switch to Analytics tab for visual insights
5. **Export Data** - Click download icon to save your tasks as CSV

## 📚 Documentation

- **[FEATURES.md](FEATURES.md)** - Complete feature list with detailed descriptions
- **[USAGE_GUIDE.md](USAGE_GUIDE.md)** - Step-by-step tutorials and workflows
- **[SAMPLE_DATA.md](SAMPLE_DATA.md)** - Sample data documentation and customization
- **[VISUAL_SHOWCASE.md](VISUAL_SHOWCASE.md)** - Visual design and UI elements
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Technical implementation details

## 🛠️ Tech Stack

- **Framework:** Next.js 15.3.2 with Turbopack
- **UI Library:** Material-UI (MUI) 7.1.0
- **State Management:** React 19 hooks (useState, useMemo, useCallback)
- **Data Visualization:** Recharts 2.x
- **CSV Handling:** PapaParse 5.x
- **Date Handling:** date-fns 4.x
- **Styling:** Emotion CSS-in-JS

## 📂 Project Structure

```
app/
├── src/
│   ├── app/
│   │   ├── page.js          # Main Task Manager (Enhanced)
│   │   ├── page-old.js      # Original backup
│   │   ├── layout.jsx       # Root layout
│   │   ├── providers.jsx    # Redux provider
│   │   └── chat/
│   │       └── page.jsx     # Data Ingestion Assistant
│   └── redux/
│       ├── store.js         # Redux store
│       ├── thunks.js        # Async actions
│       └── slices/          # Redux slices
├── public/
│   ├── sample-tasks.csv     # Sample task data (15 tasks)
│   └── sample-projects.csv  # Sample project data (6 projects)
├── package.json             # Dependencies
├── FEATURES.md              # Feature documentation
├── USAGE_GUIDE.md          # User guide
├── SAMPLE_DATA.md          # Sample data documentation
└── README.md               # This file
```

## 🎯 Key Capabilities

### Data Management

- ✅ Export tasks to CSV with all metadata
- ✅ Import tasks from CSV files
- ✅ **Pre-loaded sample data** with realistic tasks and projects
- ✅ No data loss - portable and version-controllable
- ✅ Works completely offline

### Task Features

- ✅ Subtasks with progress tracking
- ✅ Time tracking with play/pause
- ✅ Multiple tags per task
- ✅ Priority levels (High, Medium, Low)
- ✅ Due dates with overdue warnings
- ✅ Comments and notes

### Productivity Tools

- ✅ Bulk operations (mark done, archive, delete)
- ✅ Advanced search across all fields
- ✅ Filter by status, project, priority
- ✅ Sort by any column
- ✅ Keyboard shortcuts
- ✅ Undo/Redo functionality

### Analytics

- ✅ Status distribution pie chart
- ✅ Priority breakdown visualization
- ✅ 7-day completion trend line chart
- ✅ Project progress bar chart

## ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + N` - Jump to new task form
- `Ctrl/Cmd + Z` - Undo last action
- `Ctrl/Cmd + Shift + Z` - Redo
- `Ctrl/Cmd + F` - Focus search box

## 🎨 UI Themes

### Light Mode (Default)

- Clean, professional appearance
- High contrast for readability
- Blue primary, red secondary

### Dark Mode

- Easy on eyes for night work
- Light blue primary, pink secondary
- Reduced eye strain

Toggle with the 🌙/☀️ icon in the header

## 💾 Data Persistence

Tasks are stored in **CSV format** for maximum portability:

```csv
ID,Title,Description,Status,Project,Priority,DueDate,Tags,TimeElapsed...
1,Homepage Design,Create new homepage,Todo,Website,High,2026-01-15,design;ui,7234
2,API Development,Build REST API,In Progress,Backend,Medium,2026-01-20,api;backend,18562
```

### Backup Strategy

1. Regular exports (weekly recommended)
2. Keep CSV files in cloud storage or version control
3. Import to restore or migrate data

## 🔧 Development

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🐛 Troubleshooting

**Q: My tasks disappeared after refresh**  
A: Export to CSV regularly. This is your save file!

**Q: Import not working**  
A: Ensure CSV has proper headers. Use an exported file as template.

**Q: Charts not showing**  
A: Add some tasks first. Charts need data to render.

## 📊 Performance

- Optimized with React.useMemo for computed values
- Efficient re-rendering with proper dependencies
- Recommended: Keep under 500 active tasks
- Tip: Archive completed tasks regularly

## 🚀 Deployment

This app can be deployed to:

- Vercel (recommended for Next.js)
- Netlify
- Any static hosting (after `npm run build`)

```bash
# Deploy to Vercel
vercel deploy
```

## 🤝 Contributing

This is a personal project, but feel free to:

- Report issues
- Suggest features
- Submit pull requests

## 📄 License

MIT License - feel free to use for personal or commercial projects

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Material-UI](https://mui.com/)
- Charts powered by [Recharts](https://recharts.org/)
- CSV parsing by [PapaParse](https://www.papaparse.com/)

## 🎓 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)

---

**Built with ❤️ using modern web technologies**

For detailed feature documentation, see [FEATURES.md](FEATURES.md)  
For usage tutorials, see [USAGE_GUIDE.md](USAGE_GUIDE.md)
