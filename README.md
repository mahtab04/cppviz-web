# CppViz — C++ Memory Layout Visualizer

An interactive, **fully client-side** web application that visualizes how C++ structs, classes, and variables are laid out in memory. Understand padding, alignment, stack frames, and pointer relationships — all without a backend.

> **Live Demo**: [https://USERNAME.github.io/cppviz-web/](https://USERNAME.github.io/cppviz-web/)

---

## Features

### Core Analysis

| Feature | Description |
|---------|-------------|
| **Struct/Class Layout** | Byte-grid visualization showing field offsets, padding bytes, alignment, vtable pointers, base classes, bitfields, and `alignas` |
| **Stack Frame Analysis** | Visual stack diagram with local variable types, sizes, and offsets |
| **Heap & Pointer Analysis** | Static detection of `new`/`malloc` allocations and pointer relationships |
| **Platform Targets** | x86-64 Linux, x86-32 Linux, x86-64 MSVC, x86-32 MSVC with correct ABI rules |

### Advanced Visualizations

- **Cache-Line Overlay** — toggle 64-byte cache-line boundaries on the byte grid
- **Endianness Visualization** — byte indices (B0–Bn) within multi-byte fields with LSB/MSB labels
- **Platform Comparison** — side-by-side byte grids comparing the same struct across two targets
- **Struct Optimization Suggestions** — reorders fields to minimize padding, shows bytes saved

### Editor & Tooling

- **Monaco Editor** with full C++ syntax highlighting, bracket pair colorization
- **C++ Autocomplete & Snippets** — 18 built-in snippets (struct, class, template, smart pointers, etc.)
- **Keyboard Shortcuts** — `Ctrl+Enter` to analyze, `Ctrl+Shift+Enter` to compile & run
- **Inline Error Markers** — compiler errors shown directly in the editor with line highlights
- **8 Themes** — Night Owl, GitHub Dark, Monokai Pro, Dracula, One Dark Pro + 3 built-in Monaco themes

### Compilation & Execution

- **Godbolt Integration** — compile and run C++ code remotely via [Compiler Explorer](https://godbolt.org) API
- **6 Compilers** — GCC 14.1, GCC 13.2, Clang 18.1, Clang 17.0, MSVC 19 (latest), MSVC 2022
- **Tabbed Output** — stdout, stderr, and compiler messages in separate panels

### Export & Code Generation

- **Export as PNG** — save struct layout visualizations as images
- **Export as JSON** — download raw analysis data
- **Code Generation** — generates an optimized C++ struct with fields reordered for minimal padding, with one-click copy

### Example Gallery

Pre-loaded code snippets for common patterns:
Struct Padding · Packed vs Unpacked · Virtual Inheritance · Pointer Chains · Stack Variables · Dynamic Arrays

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | React 18 |
| **Language** | TypeScript 5.5 |
| **Build** | Vite 5 |
| **Editor** | Monaco Editor (same engine as VS Code) |
| **Styling** | Tailwind CSS 3.4 |
| **Export** | html-to-image |
| **Compilation** | Godbolt Compiler Explorer API |
| **Deployment** | GitHub Pages + GitHub Actions |

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/cppviz-web.git
cd cppviz-web

# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev
```

### Production Build

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
```

---

## Project Structure

```
cppviz-web/
├── .github/workflows/deploy.yml    # GitHub Actions → GitHub Pages
├── index.html                      # Vite entry point
├── vite.config.ts                  # Vite config (base path for GitHub Pages)
├── tailwind.config.ts              # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json
│
└── src/
    ├── main.tsx                    # App entry point
    ├── app/
    │   └── App.tsx                 # Root component, state management, tabs
    │
    ├── features/
    │   ├── analyzer/               # C++ memory analysis engine
    │   │   ├── api.ts              # Unified analysis entry point
    │   │   ├── index.ts            # Barrel exports
    │   │   ├── engine/
    │   │   │   ├── layout-engine.ts      # Struct layout (Itanium + MSVC ABI)
    │   │   │   ├── optimizer.ts          # Field reordering optimizer
    │   │   │   ├── pointer-analyzer.ts   # Heap/pointer detection
    │   │   │   └── stack-analyzer.ts     # Stack frame analysis
    │   │   └── parser/
    │   │       └── parser.ts             # Regex-based C++ parser
    │   │
    │   ├── editor/                 # Monaco Editor integration
    │   │   ├── index.ts
    │   │   ├── components/
    │   │   │   └── CodeEditor.tsx         # Editor wrapper with error markers
    │   │   ├── config/
    │   │   │   ├── cpp-language.ts        # C++ autocomplete & snippets
    │   │   │   └── themes.ts             # 8 custom/built-in themes
    │   │   └── workers/
    │   │       └── monacoWorker.ts        # Monaco web worker
    │   │
    │   ├── runner/                 # Remote compilation via Godbolt
    │   │   ├── index.ts
    │   │   ├── components/
    │   │   │   └── OutputPanel.tsx        # Tabbed stdout/stderr/compiler output
    │   │   └── services/
    │   │       └── godbolt.ts             # Godbolt API client
    │   │
    │   └── visualizer/             # Memory layout visualizations
    │       ├── index.ts
    │       └── components/
    │           ├── ByteGrid.tsx           # Byte-level grid (cache lines, endianness)
    │           ├── ComparisonView.tsx     # Side-by-side platform comparison
    │           ├── LayoutStats.tsx        # Size/alignment/padding statistics
    │           ├── MemoryMapView.tsx      # Pointer/heap diagram
    │           ├── StackFrameView.tsx     # Stack frame visualization
    │           └── StructLayoutView.tsx   # Main struct view (optimizer, export, codegen)
    │
    ├── shared/
    │   ├── constants/
    │   │   └── examples.ts               # 7 pre-loaded C++ examples
    │   ├── types/
    │   │   └── index.ts                  # Shared TypeScript interfaces
    │   ├── ui/
    │   │   └── Toolbar.tsx               # Target/compiler/theme selectors
    │   └── utils/
    │       └── colors.ts                 # Field color palette
    │
    └── styles/
        └── index.css                     # Tailwind + custom styles
```

---

## How It Works

CppViz runs **entirely in the browser** — no backend server required.

1. **Parsing** — A regex-based C++ parser extracts struct/class definitions, fields, base classes, bitfields, `__attribute__((packed))`, and `alignas` directives.

2. **Layout Engine** — Implements both **Itanium ABI** (GCC/Clang on Linux) and **MSVC ABI** rules to compute field offsets, padding, alignment, and total struct size. Handles virtual tables, virtual bases, and bitfield packing.

3. **Stack Analysis** — Parses function bodies to identify local variables and estimate stack frame layout based on type sizes and alignment for the selected target.

4. **Pointer Analysis** — Detects `new`, `new[]`, `malloc`, `calloc`, `realloc` calls and tracks pointer assignments to build a heap allocation map.

5. **Optimization** — Sorts fields by alignment (descending) to produce a minimal-padding layout and calculates exact byte savings.

6. **Remote Compilation** — Optionally sends code to [Godbolt Compiler Explorer](https://godbolt.org) for real compilation and execution, returning stdout/stderr.

---

## Deployment

### GitHub Pages (automated)

Every push to `main` triggers the GitHub Actions workflow that builds and deploys to GitHub Pages.

1. Push your code to a GitHub repo named `cppviz-web`
2. Go to **Settings → Pages → Source** and select **GitHub Actions**
3. The site will be live at `https://<username>.github.io/cppviz-web/`

### Manual Deploy

```bash
npm run build
# Upload the dist/ folder to any static hosting (Netlify, Vercel, S3, etc.)
```

> **Note**: If deploying to a subpath (like GitHub Pages), the `base` in `vite.config.ts` is automatically set to `/cppviz-web/` when built via GitHub Actions. For root-domain hosting, it defaults to `/`.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` | Analyze memory layout |
| `Ctrl+Shift+Enter` | Compile & run via Godbolt |

---

## License

MIT
