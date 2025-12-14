# Signature Burn-in Server (TypeScript)

This is a standalone Node + Express server that accepts a signature image and burns it into a PDF at specified coordinates, preserving aspect ratio. It also stores metadata in MongoDB.

Quick start

1. Change to the `server/` folder:

```bash
cd server
```

2. Install dependencies:

```bash
npm install
```

3. Create an `.env` file (or use `.env.example`):

```text
PORT=4000
MONGO_URI=mongodb://localhost:27017/signatures
SERVER_BASE_URL=http://localhost:4000
```

4. Place the source PDFs you want to sign in `server/input` named `<pdfId>.pdf`.

5. Run in development mode:

```bash
npm run dev
```

Build & run (production):

```bash
npm run build
npm start
```

API

- POST `/sign-pdf` — body JSON:

```json
{
  "pdfId": "example-pdf",
  "signatureBase64": "data:image/png;base64,...",
  "coordinates": {
    "page": 3,
    "x": 120,
    "y": 200,
    "width": 200,
    "height": 60,
    "pageRenderWidth": 800,
    "pageRenderHeight": 1120
  }
}
```

Response: `{ "url": "http://.../signed/signed-<timestamp>.pdf", "id": "<db id>" }`

Notes

- This simple server expects the original PDF to exist at `server/input/<pdfId>.pdf`. In production you would fetch PDFs from object storage or accept file uploads.
- The server stores a metadata record in MongoDB collection `pdfrecords`.
