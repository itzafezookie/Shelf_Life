# 📚 Shelf Life - Reading Progress Tracker

A modern, intuitive web application for tracking your reading progress, managing your book library, and analyzing your reading habits.

## ✨ Features

### 📖 Reading Management
- **Current Book Tracking**: Set and track your currently reading book with real-time progress
- **Reading Sessions**: Start, pause, and stop reading sessions with automatic time tracking
- **Progress Analytics**: View reading speed, estimated completion time, and daily page targets
- **Due Date Monitoring**: Set due dates and get alerts when you're at risk of missing them

### 📚 Library Management
- **Book Search**: Search and add books using the Open Library API
- **Custom Book Entry**: Manually add books with custom details
- **Genre Organization**: Categorize books by genres with visual analytics
- **Status Tracking**: Organize books by reading status (current, completed, to-read)

### 📊 Analytics & Insights
- **Reading Speed**: Track pages per minute across all sessions
- **Session History**: Detailed view of all reading sessions with timestamps
- **Genre Distribution**: Visual pie chart of your reading preferences
- **Progress Statistics**: Comprehensive stats for each book including total time and pages read

### 🔄 Data Management
- **Export Data**: Download your complete reading data as JSON
- **Import Data**: Restore or transfer data between devices
- **Local Storage**: All data stored locally in your browser
- **Session Exclusion**: Mark sessions to exclude from pace calculations

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No installation required - runs entirely in the browser

### Quick Start
1. **Clone or download** this repository
2. **Open `index.html`** in your web browser
3. **Start adding books** to your library
4. **Set a current book** and begin tracking your reading sessions

### Local Development
For the best experience, serve the files through a local web server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server -p 8000

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## 📱 Usage Guide

### Adding Your First Book
1. Navigate to the **Library** tab
2. Click **"+ Add Book"**
3. Search for a book using the Open Library integration, or add manually
4. Set genres, due dates, and other details
5. Click **"Add to Library"**

### Starting a Reading Session
1. Go to the **Reading** tab
2. Select your current book from the library
3. Click **"Start Session"** when you begin reading
4. Use **Pause/Resume** as needed during breaks
5. Click **"Stop Session"** when finished and enter your ending page

### Viewing Analytics
- **Reading Tab**: See current book progress, reading speed, and time estimates
- **Library Tab**: Browse all books with status indicators and quick actions
- **Genres Tab**: Visual breakdown of your reading preferences
- **Sessions Tab**: Detailed history of all reading sessions

### Data Management
- **Export**: Library tab → "Export Data" → Downloads JSON file
- **Import**: Library tab → "Import Data" → Select previously exported JSON file

## 🛠️ Technical Details

### Built With
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Framework**: Alpine.js for reactive UI components
- **Charts**: Chart.js for data visualization
- **API**: Open Library API for book search
- **Storage**: Browser localStorage for data persistence

### Browser Compatibility
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

### File Structure
```
shelf-life/
├── index.html          # Main application file
├── app.js             # Core application logic
├── styles.css         # Application styling
├── manifest.json      # PWA manifest
├── sw.js             # Service worker for offline support
├── default-cover.svg  # Default book cover images
└── icons/            # Application icons
```

## 🔒 Privacy & Data

- **Local Storage Only**: All data is stored locally in your browser
- **No Account Required**: No sign-up or personal information needed
- **Offline Capable**: Works without internet connection (except book search)
- **Export Control**: You own and control all your data

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome! Feel free to:
- Report bugs or issues
- Suggest new features
- Submit pull requests
- Share your reading analytics

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Open Library** for providing the book search API
- **Alpine.js** for the lightweight reactive framework
- **Chart.js** for beautiful data visualizations
- **Reading community** for inspiration and feedback

---

**Happy Reading!** 📖✨

*Track your progress, achieve your goals, and discover insights about your reading habits with Shelf Life.*
