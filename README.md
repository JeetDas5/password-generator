# Password Generator

A modern Next.js application for securely managing generated passwords and vault items. It includes user registration/login, encrypted vault storage, export/import features, and optional two-factor authentication (2FA).

This README explains how to run the project locally, what environment variables are required, and common development commands (PowerShell examples).

## Features

- User registration and login (JWT-based)
- Encrypted vault items (create, edit, delete, export/import)
- 2FA setup and verification (TOTP)
- MongoDB for persistence
- Export to ZIP/JSON (client-side)

## Tech stack

- Next.js (app router)
- React
- MongoDB / Mongoose
- TypeScript
- Tailwind CSS
- Axios, bcrypt, jsonwebtoken, speakeasy, qrcode

## Requirements

- Node.js (LTS recommended, e.g. Node 18+)
- npm (comes with Node)
- A running MongoDB instance (URI required in env)

## Quick start (PowerShell)

1. Install dependencies

```powershell
npm install
```

2. Create a `.env.local` file at the repository root and add the required environment variables (example below).

3. Run the development server

```powershell
npm run dev
```

Open http://localhost:3000 in your browser.

## Environment variables

Create a `.env.local` with at least the following values (example):

```
MONGO_URI=mongodb://localhost:27017/password-generator
JWT_SECRET=your_jwt_secret_here
# Optionally add other env variables needed by your deployment (e.g. NEXT_PUBLIC_BASE_URL)
```

Adjust values for production. Keep secrets out of source control.

## NPM scripts

The `package.json` includes these scripts (use PowerShell or your preferred shell):

- `npm run dev` — Start the Next.js dev server (uses Turbopack by default)
- `npm run build` — Build the production app
- `npm start` — Start the production server after build
- `npm run lint` — Run ESLint

Example (PowerShell):

```powershell
npm run build
npm start
```

## Database

This project uses MongoDB via `mongoose`. Point `MONGO_URI` at a writable database. For local development you can run MongoDB in a container or use a local install.

## Development tips

- Update frontend files under `src/app` and `src/components`.
- Server routes (API) live in `src/app/api`.
- Common utilities are in `src/lib` (auth, crypto, db helpers).


## Contributing

Contributions are welcome. Open issues or PRs on the repository. Keep changes small and provide clear commit messages.


