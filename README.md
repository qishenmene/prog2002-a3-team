# PROG2002 Web Development II — Assessment 3

City charity events website for Southern Cross University. This is the
Assessment 3 build, which extends the Assessment 2 project with a
registrations feature, a full CRUD API, and a separate admin-side website.

## Live deployment (SCU cPanel)

| Website | URL |
| --- | --- |
| Client-side site | https://24832627.it.scu.edu.au/ |
| Admin-side site | https://24832627.it.scu.edu.au/admin/ |
| RESTful API | https://24832627.it.scu.edu.au/api/events |

Each team member deploys their own copy under their own student domain.

## Repository structure

```
api/          Express API (server.js, api-controller.js, event_db.js)
client-app/   Angular client-side website (client-facing pages)
admin-app/    Angular admin-side website (event management)
clientside/   Legacy Assessment 2 static pages (fallback only)
database/     charityevents_db.sql — schema plus seed data
```

Both Angular applications are TypeScript + standalone components, built with
Angular v22.

## Local development

```bash
# 1. Database
mysql -u <user> -p < database/charityevents_db.sql

# 2. API credentials
cp api/db-details.example.js api/db-details.js   # then fill in your own values

# 3. API (http://localhost:8080)
cd api && npm install && npm start

# 4. Client site (http://localhost:4200)
cd client-app && npm install && npx ng serve

# 5. Admin site (http://localhost:4300)
cd admin-app && npm install && npx ng serve --port 4300
```

`api/db-details.js` is gitignored and must never be committed.

## Deployment (cPanel)

Deployment target is a SCU cPanel account with the **Setup Node.js App**
feature (Passenger). Both websites and the API are served by a single Node
process on one host: `/` is the client site, `/admin` is the admin site, and
`/api` is the REST API.

### 1. Build the Angular applications

```bash
cd client-app && npx ng build --configuration production
cd ../admin-app && npx ng build --configuration production --base-href /admin/
```

Outputs:

- `client-app/dist/client-app/browser`
- `admin-app/dist/admin-app/browser`

The `--base-href /admin/` flag is required for the admin site — without it the
built `index.html` points its assets at the domain root and the admin pages
load blank.

### 2. Prepare the deployment package

The server application root (`a3app`) must contain:

```
a3app/
├── api/                                 server + controller + event_db + db-details.js
├── client-app/dist/client-app/browser/  built client site
├── admin-app/dist/admin-app/browser/    built admin site
└── package.json                         copy of api/package.json (for npm install)
```

> **Package with Python `zipfile` or 7-Zip — not PowerShell.**
> PowerShell's `Compress-Archive` writes `\` as the zip path separator. Linux
> extracts those entries as flat files whose names literally contain
> backslashes (e.g. `api\server.js`), so the app never starts.

### 3. Import the database

Create a MySQL database and user in cPanel, then import
`database/charityevents_db.sql` (phpMyAdmin or the command line).

> **Collation fix:** the dump is a MySQL 8 export and uses the
> `utf8mb4_0900_ai_ci` collation. The SCU server rejects it with
> `Unknown collation`. Replace every occurrence with `utf8mb4_general_ci`
> before importing:

```bash
sed 's/utf8mb4_0900_ai_ci/utf8mb4_general_ci/g' charityevents_db.sql > charityevents-import.sql
```

### 4. Create the Node.js application

In cPanel go to **SOFTWARE → Setup Node.js App → Create Application**:

| Field | Value |
| --- | --- |
| Node.js version | 18.x |
| Application mode | Production |
| Application root | `a3app` |
| Application URL | your domain, path left empty |
| Application startup file | `api/server.js` |

After creating the application:

1. Click **Run NPM Install** (installs `express` and `mysql2`).
2. Click **Restart**.

### 5. Database credentials on the server

`api/event_db.js` resolves credentials in this order:

1. environment variables `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME`
2. a local `api/db-details.js` file (gitignored)

On the SCU cPanel, the **Environment variables** form did not propagate to the
Node process — logging `process.env` at startup showed `DB_HOST`, `DB_USER`,
`DB_NAME` and `DB_PASSWORD` as `undefined`, and the app crashed with
`Access denied for user ''@'localhost'`. The deployment therefore ships a
server-side `api/db-details.js` containing the database name, user and
password. That file is gitignored, so credentials never reach the repository.

### 6. Restarting the application

Passenger reloads the app whenever `a3app/tmp/restart.txt` is modified, so the
app can be restarted over FTP without opening the cPanel UI — re-upload any
file to that path and wait a few seconds.

### 7. Verify the deployment

```bash
curl https://<your-domain>/api/events                  # JSON array of events
curl -o /dev/null -w "%{http_code}\n" https://<your-domain>/            # 200, client site
curl -o /dev/null -w "%{http_code}\n" https://<your-domain>/admin/      # 200, admin site
curl -o /dev/null -w "%{http_code}\n" https://<your-domain>/admin/edit/1  # 200, admin deep link
curl -o /dev/null -w "%{http_code}\n" https://<your-domain>/event/3       # 200, client deep link
```

Then confirm the event endpoints end to end:

| Request | Expected |
| --- | --- |
| `GET /api/admin/events/:id` | `200` for an existing event, including past or suspended events |
| `POST /api/events` | `201` with the new `event_id` |
| `PUT /api/events/:id` | `200` |
| `DELETE /api/events/:id` | `200` when the event has no registrations |
| `DELETE /api/events/:id` (event has registrations) | `400`, deletion refused |
| `GET /api/events/:id` after deletion | `404` |

## Deployment troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| App returns `502 Incomplete response` | The Node process crashed at startup. `event_db.js` calls `connect()` at module load, so a bad database credentials file kills the app before it can respond. Check `api/db-details.js`. |
| `Unknown collation: 'utf8mb4_0900_ai_ci'` | See step 3 — swap the collation for `utf8mb4_general_ci`. |
| App never starts, files have odd names with `\` | The zip was built with PowerShell `Compress-Archive`. Repackage with Python `zipfile`. |
| `/admin` loads blank, assets 404 | The admin app was built without `--base-href /admin/`. |
| Environment variables appear to do nothing | Use `api/db-details.js` instead — see step 5. |
