# Bruno API Test Generator - Memory

## Project Structure
- Bruno collection root: `D:\claude\mediev-h3-game\bruno\`
- Environment file: `bruno/environments/dev.bru`
- Collection manifest: `bruno/bruno.json` (version "1")
- Folder descriptors: each subfolder needs a `folder.bru` with `meta { name, seq }`

## Authentication Pattern
- JWT via cookie HttpOnly named `access_token` (stateless, NO sessions)
- Login: `POST /api/auth/login` with `{ username, password }` body
- Existing login test saves token to env var `jwt_token` (not `access_token`) - NOTE: the cookie flow means Bruno tests may not need to manually pass the token for public endpoints; for protected endpoints, the cookie is set automatically if Bruno shares the session
- Endpoints WITHOUT `authenticateToken` middleware are fully public (no auth test needed for 401)

## Endpoint Auth Status (confirmed from routes/api.js)
- `GET /api/map/region` - PUBLIC (no authenticateToken)
- `GET /api/terrain-types` - PUBLIC
- `GET /api/map/cell-details/:h3_index` - PUBLIC
- `GET /api/players/:id` - PUBLIC
- `GET /api/game/world-state` - PUBLIC
- `GET /api/military/unit-types` - PUBLIC
- Everything else requires `authenticateToken`

## /api/map/region Endpoint (confirmed)
- Method: GET
- Auth: none (public)
- Query params: `minLat`, `maxLat`, `minLng`, `maxLng` (all required), `res` (optional, default 8)
- Response: JSON array of hexagon objects (NOT wrapped in `{ success, data }`)
- Response shape per item:
  ```
  h3_index: string
  terrain_type_id: number
  terrain_color: string (fallback '#9e9e9e', never null)
  has_road: boolean (fallback false)
  is_capital: boolean (fallback false)
  player_id: number | null
  player_color: string | null
  building_type_id: number (fallback 0, never null)
  icon_slug: string | null
  location_name: string | null
  settlement_type: string | null
  coord_x: number
  coord_y: number
  ```
- Error 400 cases:
  - Any of the 4 required params missing: `{ error: "Missing bounding box parameters" }`
  - Any param is non-numeric (NaN after parseFloat): `{ error: "Invalid bounding box parameters" }`
- Empty bounding box / no DB rows: returns `[]` with status 200
- Data source: `v_map_display` view (materialized view with player JOIN for is_capital)

## Response Format Inconsistency
- Map endpoints return raw arrays or objects (NOT `{ success: true, data: ... }`)
- Game/military/auth endpoints use `{ success: true/false, data/error: ... }` pattern
- Always check individual endpoint code before assuming wrapper format

## Bruno Syntax Notes
- `res.body: isArray` works for array assertions
- Script assertions via `script:post-response` for complex structural checks
- `bru.setVar()` for session-scope variables, `bru.setEnvVar()` for persistent env vars
- `auth: none` for public endpoints; `auth: inherit` follows folder-level auth config
- Folder-level auth set in `folder.bru` with `auth { mode: inherit }`

## Environment Variables Used
- `base_url`: http://localhost:3000
- `jwt_token`: JWT token string (set by login test)
- `username` / `password`: test credentials
- `region_minLat/maxLat/minLng/maxLng`: bounding box for map tests (set to Madrid area ~40.4-40.5, -3.8--3.7)

## Test File Conventions
- Files in `bruno/map/` for map endpoints, `bruno/auth/` for auth, etc.
- Each folder needs `folder.bru` with `meta { name, seq }`
- `seq` controls execution order within a folder
- Use descriptive names: "Map Region - Error Sin Parametros"
