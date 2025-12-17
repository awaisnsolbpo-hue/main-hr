# Project Restructure Plan

## Current Structure (Mixed - Not Ideal)
```
/
├── src/                    # Frontend source
├── server/                 # Backend server
├── package.json            # Frontend deps
├── node_modules/           # Frontend deps
├── vite.config.ts          # Frontend config
└── ...                     # Other frontend files
```

## New Structure (Clean Separation)
```
/
├── frontend/               # All frontend code
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── ...
├── backend/                # All backend code
│   ├── src/
│   ├── package.json
│   └── ...
├── package.json            # Root - runs both servers
└── README.md               # Main documentation
```

## Steps to Restructure

1. Create `frontend/` folder
2. Move all frontend files to `frontend/`
3. Rename `server/` to `backend/`
4. Create root `package.json` with scripts to run both
5. Update all documentation
6. Update import paths

## Files to Move to `frontend/`
- src/
- public/ (if exists)
- index.html
- package.json
- package-lock.json
- node_modules/
- vite.config.ts
- tsconfig*.json
- tailwind.config.ts
- postcss.config.js
- eslint.config.js
- components.json
- vitest.config.ts

## Files to Keep in Root
- README.md
- SETUP.md
- SECURITY.md
- QUICKSTART.md
- .gitignore
- .env.example (for both)

## Files to Move/Rename
- server/ → backend/
