# Students Helper — PROG2002 A3

Students Helper lists charity events and accepts event registrations. The public website and administration website are Angular 22 applications that use one Express API and MySQL database.

## School websites

| Member | Public website | Administration |
| --- | --- | --- |
| Shixiang Tang | https://24832740.it.scu.edu.au/ | https://24832740.it.scu.edu.au/admin/ |
| Jihan Qu | https://24832627.it.scu.edu.au/ | https://24832627.it.scu.edu.au/admin/ |

The 24832740 deployment was checked on 19 October 2026. Each member maintains a separate deployment. The [verification record](docs/verification.md) documents the local checks.

## Files

| Folder | Contents |
| --- | --- |
| `api/` | Express routes, validation and database connection |
| `client-app/` | Home, search, event details and registration |
| `admin-app/` | Event list, create and edit forms |
| `clientside/` | A2 pages retained as a fallback |
| `database/` | Database schema and sample data |
| `docs/` | Design, ERD, storyboards, verification and video outline |
| `tools/` | JSDoc and TypeDoc configuration |

## Run locally

Use Node.js 24 for the Angular builds. Import `database/charityevents_db.sql` into MySQL, then copy `api/db-details.example.js` to `api/db-details.js` and enter the local database details. The credentials file is ignored by Git.

Run the API in its own terminal:

```bash
cd api
npm ci
npm start
```

Run the public application from the repository root in another terminal:

```bash
cd client-app
npm ci
npm start
```

Run the administration application in a third terminal:

```bash
cd admin-app
npm ci
npm start -- --port 4300
```

The API listens on port 8080. The Angular development proxies forward `/api` requests from ports 4200 and 4300 to the API.

## Deploy to cPanel

Build both applications from the repository root:

```bash
cd client-app
npm ci
npm run build
cd ../admin-app
npm ci
npm run build -- --base-href /admin/
```

The application directory on the school server has this structure:

```text
a3app/
  api/
  client-app/dist/client-app/browser/
  admin-app/dist/admin-app/browser/
  package.json
  package-lock.json
```

The root `package.json` uses the dependencies from `api/package.json` and sets `api/server.js` as its startup file. The prepared deployment archive already has this structure.

Create a database and database user in cPanel. Import the portable SQL export included with the submission package into the selected database. The portable export uses `utf8mb4_general_ci` for the school server. Create `api/db-details.js` on the server with that database's private connection details.

In **Setup Node.js App**, use:

| Setting | Value |
| --- | --- |
| Node.js version used for this deployment | 18.20.8 |
| Mode | Production |
| Application root | `a3app` |
| Application URL | The student's domain root |
| Startup file | `api/server.js` |

Run NPM Install and restart the application. Express serves the public application at `/`, administration at `/admin/`, and JSON endpoints at `/api`.

Check the homepage, search, an event, registration, `/admin/` and an admin edit deep link. Use a temporary event to check create, update and delete. An event with registrations must be protected from deletion.

`api/event_db.js` reads `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` and `DB_NAME` when they are set; otherwise it reads `api/db-details.js`. The verified personal deployment uses the private file. Keep that file out of source archives and Git.

## Main endpoints

| Request | Result |
| --- | --- |
| `GET /api/events` | Available upcoming events |
| `GET /api/events/search` | Events filtered by date, location and category |
| `GET /api/events/:id` | Event details and registrations, newest first |
| `GET /api/events/all` | All events and registration counts for administration |
| `GET /api/admin/events/:id` | Editable event details, including past or suspended events |
| `POST /api/registrations` | Saves a registration and returns its reference |
| `POST /api/events` | Creates an event |
| `PUT /api/events/:id` | Updates an event |
| `DELETE /api/events/:id` | Deletes an event only when it has no registrations |
| `GET /api/events/:id/weather` | Event-date forecast or an availability message |

Invalid input returns `400`; missing events return `404`. Duplicate registrations return `400`, while registration for a past or suspended event returns `409`. The database also enforces one registration per email per event and prevents deletion of events with registrations.

Weather requests use the event's stored date and coordinates with `Australia/Brisbane` time. A missing forecast or provider error is displayed in the weather panel while the rest of the event page remains usable.

## Project documentation

- [Design and ERD](docs/project-design.md)
- [Storyboards](docs/storyboards.svg)
- [Verification](docs/verification.md)
- [Video outline](docs/demo-guide.md)

Generate the API, client and admin code references:

```bash
cd tools
npm ci
npm run docs
```

The generated pages are written to `docs/generated/api`, `docs/generated/client` and `docs/generated/admin`. Source comments and generator settings are versioned; generated HTML is excluded from Git.
