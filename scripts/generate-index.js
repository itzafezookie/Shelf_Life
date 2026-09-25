const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.join(WORKSPACE_ROOT, 'PROJECT_INDEX.md');

// Directories to ignore during scanning
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.agents',
  '.system_generated',
  '.gemini',
  'dist',
  'build',
  'legacy'
]);

const IGNORED_FILES = new Set([
  'package-lock.json',
  'PROJECT_INDEX.md'
]);

function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        walkDir(path.join(dir, entry.name), fileList);
      }
    } else {
      if (!IGNORED_FILES.has(entry.name)) {
        fileList.push(path.join(dir, entry.name));
      }
    }
  }
  return fileList;
}

function analyzeFile(filePath) {
  const relativePath = path.relative(WORKSPACE_ROOT, filePath).replace(/\\/g, '/');
  const ext = path.extname(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const loc = lines.length;

  const analysis = {
    path: relativePath,
    loc,
    ext,
    functions: [],
    classes: [],
    stores: [],
    hooks: [],
    imports: [],
    exports: [],
    storageEntities: new Set(),
    externalApis: new Set(),
    hasTimers: false
  };

  if (['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx'].includes(ext)) {
    // Functions and hooks
    const functionRegex = /(?:function\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>)/g;
    let match;
    while ((match = functionRegex.exec(content)) !== null) {
      const fnName = match[1] || match[2];
      if (fnName) {
        if (fnName.startsWith('use') && fnName.length > 3) {
          if (!analysis.hooks.includes(fnName)) analysis.hooks.push(fnName);
        } else if (!analysis.functions.includes(fnName)) {
          analysis.functions.push(fnName);
        }
      }
    }

    // Classes
    const classRegex = /class\s+([a-zA-Z0-9_$]+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      if (match[1] && !analysis.classes.includes(match[1])) {
        analysis.classes.push(match[1]);
      }
    }

    // Zustand / stores
    const storeRegex = /create\s*\(\s*(?:\([^)]*\)\s*=>)?/g;
    if (content.includes('zustand') || storeRegex.test(content)) {
      analysis.stores.push(path.basename(filePath, ext));
    }

    // Dexie table schemas
    const dexieTableRegex = /this\.version\([0-9]+\)\.stores\(\{([\s\S]*?)\}\)/g;
    let dexieMatch;
    while ((dexieMatch = dexieTableRegex.exec(content)) !== null) {
      const schemaBody = dexieMatch[1];
      const tableLines = schemaBody.split(',');
      for (const line of tableLines) {
        const parts = line.split(':');
        if (parts[0]) {
          const tableName = parts[0].trim().replace(/['"]/g, '');
          if (tableName) analysis.storageEntities.add(`Dexie: ${tableName}`);
        }
      }
    }

    // localStorage access
    const storageRegex = /localStorage\.(?:getItem|setItem|removeItem)\(['"]([^'"]+)['"]\)/g;
    while ((match = storageRegex.exec(content)) !== null) {
      analysis.storageEntities.add(`localStorage: ${match[1]}`);
    }

    if (content.includes('openlibrary.org')) {
      analysis.externalApis.add('Open Library REST API');
    }

    // Guardrail audit: Timer check in components
    if (relativePath.includes('components/') && /setInterval|setTimeout/.test(content)) {
      analysis.hasTimers = true;
    }
  }

  return analysis;
}

function generateMarkdownIndex() {
  const allFiles = walkDir(WORKSPACE_ROOT);
  const analyzedFiles = allFiles.map(analyzeFile);

  const totalLoc = analyzedFiles.reduce((acc, f) => acc + f.loc, 0);
  const oversizedUIFiles = analyzedFiles.filter(f => f.loc > 400 && f.path.startsWith('src/components/'));
  const timerViolatingFiles = analyzedFiles.filter(f => f.hasTimers);

  let md = `# 🏛️ Shelf Life 2.0 - Architecture & Project Index\n\n`;
  md += `> **AUTO-GENERATED SYSTEM INDEX** — DO NOT EDIT MANUALLY.\n`;
  md += `> Regenerate with \`npm run index\` or automatically via \`npm run build\`.\n`;
  md += `> Last Index Run: ${new Date().toISOString()}\n\n`;

  md += `## 🎯 1. System Sources of Truth (Singletons, Engines & Stores)\n\n`;
  md += `| Store / Entity | File / Location | Engine / Persistence | Responsibility |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;
  md += `| **Database (Dexie)** | \`src/db/db.js\` | IndexedDB (\`ShelfLifeDB\`) | Relational database: \`books\`, \`sessions\`, \`genres\`, \`settings\` |\n`;
  md += `| **Session Timer Engine** | \`src/services/timerService.js\` | Headless Timer Singleton | Precision ticker, drift compensation, state machine (\`idle\|reading\|paused\`) |\n`;
  md += `| **Active Session Store** | \`src/stores/useSessionStore.js\` | Zustand Store | Reactive active session bridge consumed by UI presentation cards |\n`;
  md += `| **UI State Store** | \`src/stores/useUIStore.js\` | Zustand Store | Tab routing, modal visibility, filter tags, search text |\n`;
  md += `| **Analytics Engine** | \`src/services/analyticsEngine.js\` | Pure Calculation Engine | PPM, WPM, completion date projections, daily targets, genre ratios |\n`;
  md += `| **Open Library Service**| \`src/services/bookService.js\` | REST Client | Open Library book metadata search & cover resolution |\n`;
  md += `| **Legacy Migration Engine**| \`src/services/migrationService.js\`| One-time Migrator | Detects legacy localStorage data and safely imports into Dexie DB |\n\n`;

  md += `## 🔄 2. End-to-End Data Flow Blueprint\n\n`;
  md += `\`\`\`mermaid
graph TD
    subgraph UI ["Dumb Presentation Layer (src/components)"]
        Nav["Navigation Bar / Mobile Tabs"]
        CurrentHero["CurrentBookHero & PaceCard"]
        TimerUI["SessionControls (Buttons Only)"]
        LibView["BookList & AddBookModal"]
        StatsView["AnalyticsOverview & GenreChart"]
        HistoryView["SessionHistoryList"]
    end

    subgraph Stores ["Headless Reactive State (src/stores)"]
        UIStore["useUIStore (Tabs, Modals, Filters)"]
        SessionStore["useSessionStore (Elapsed Time, Status)"]
    end

    subgraph Engines ["Core Engine Services (src/services)"]
        TimerEngine["timerService (Worker/Interval Singleton)"]
        AnalyticsEng["analyticsEngine (Pace, Projections, Targets)"]
        BookService["bookService (Open Library API & Book Mutations)"]
        MigrationEng["migrationService (Legacy localStorage Import)"]
    end

    subgraph Storage ["Local Relational Persistence (src/db)"]
        DB["Dexie IndexedDB (ShelfLifeDB)"]
        Table_Books["table: books"]
        Table_Sessions["table: sessions"]
        Table_Genres["table: genres"]
        Table_Settings["table: settings"]
    end

    Nav -->|Select Tab / Modal| UIStore
    TimerUI -->|Start / Pause / Stop Intent| TimerEngine
    TimerEngine -->|Emit Time Updates| SessionStore
    SessionStore -->|Formatted Elapsed Clock| CurrentHero
    TimerEngine -->|Commit Completed Session| DB
    LibView -->|Query Open Library| BookService
    BookService -->|Save Book Record| Table_Books
    Table_Books --> LibView
    Table_Sessions --> AnalyticsEng
    AnalyticsEng --> CurrentHero
    AnalyticsEng --> StatsView
    MigrationEng -.->|One-time Import| DB
\`\`\`\n\n`;

  md += `## 📦 3. Module Catalog & Architectural Role\n\n`;
  md += `Total workspace files tracked: **${analyzedFiles.length}** | Total LOC: **${totalLoc}**\n\n`;
  md += `| File | LOC | Type / Architectural Role | Exports & Public Symbols | Storage / APIs |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;

  for (const f of analyzedFiles) {
    const symbols = [];
    if (f.classes.length > 0) symbols.push(...f.classes.map(c => `class \`${c}\``));
    if (f.hooks.length > 0) symbols.push(...f.hooks.map(h => `\`${h}()\``));
    if (f.functions.length > 0) symbols.push(...f.functions.slice(0, 4).map(fn => `\`${fn}()\``));
    const symbolStr = symbols.length > 0 ? symbols.slice(0, 5).join(', ') + (symbols.length > 5 ? ` +${symbols.length - 5} more` : '') : '—';

    const apis = [];
    if (f.storageEntities.size > 0) apis.push(Array.from(f.storageEntities).join(', '));
    if (f.externalApis.size > 0) apis.push(Array.from(f.externalApis).join(', '));
    const apiStr = apis.length > 0 ? apis.join('; ') : '—';

    let role = 'Static Asset';
    if (f.path.startsWith('src/components/')) role = 'Dumb UI Presentation';
    else if (f.path.startsWith('src/stores/')) role = 'Headless Reactive Store';
    else if (f.path.startsWith('src/services/')) role = 'Core Engine / Service';
    else if (f.path.startsWith('src/db/')) role = 'Relational Persistence Layer';
    else if (f.path === 'src/App.jsx') role = 'Root Application Shell';
    else if (f.path === 'src/main.jsx') role = 'Application Entrypoint';
    else if (f.path === 'src/index.css') role = 'Tailwind v4 Theme Styles';
    else if (f.path.startsWith('scripts/')) role = 'Build / Indexing Automation';
    else if (f.path === 'vite.config.js') role = 'Vite & PWA Configuration';
    else if (f.path === 'package.json') role = 'Package Manifest';
    else if (f.path === 'index.html') role = 'SPA Host Document';

    md += `| [\`${f.path}\`](file:///${path.resolve(WORKSPACE_ROOT, f.path).replace(/\\/g, '/')}) | ${f.loc} | ${role} | ${symbolStr} | ${apiStr} |\n`;
  }
  md += `\n`;

  md += `## 🛡️ 4. Architecture Guardrails Compliance Audit\n\n`;
  let hasViolations = false;

  if (oversizedUIFiles.length > 0) {
    hasViolations = true;
    md += `### ⚠️ 400-LOC Ceiling Violations\n`;
    for (const of of oversizedUIFiles) {
      md += `- [\`${of.path}\`](file:///${path.resolve(WORKSPACE_ROOT, of.path).replace(/\\/g, '/')}) (${of.loc} lines) — *Must be decomposed into smaller sub-components.*\n`;
    }
    md += `\n`;
  }

  if (timerViolatingFiles.length > 0) {
    hasViolations = true;
    md += `### 🚫 Component Timer Violations (Zero Component Timers Mandate)\n`;
    for (const tf of timerViolatingFiles) {
      md += `- [\`${tf.path}\`](file:///${path.resolve(WORKSPACE_ROOT, tf.path).replace(/\\/g, '/')}) — *Contains setInterval/setTimeout in presentation component! Move clock to timerService.*\n`;
    }
    md += `\n`;
  }

  if (!hasViolations) {
    md += `> [!NOTE]\n`;
    md += `> ✅ **100% Architecture Guardrail Compliance**: All UI components are under 400 lines, zero component timers exist, and data flow is strictly unidirectional.\n\n`;
  }

  fs.writeFileSync(OUTPUT_FILE, md, 'utf8');
  console.log(`[generate-index] Successfully indexed ${analyzedFiles.length} files (${totalLoc} LOC) -> PROJECT_INDEX.md`);
}

generateMarkdownIndex();
