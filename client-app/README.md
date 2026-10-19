# Client website

Angular 22 and TypeScript application with Home, Search, Event Details and Registration routes.
`Header`, `Nav`, `Footer` and `EventCard` are shared components. Event and registration data come from `/api`; the weather panel requests the event-date forecast separately.

Run `npm ci` and `npm start` for the development server. The proxy sends `/api` requests to port 8080.
Build with `npm run build -- --configuration production`. Express serves `dist/client-app/browser` at `/`.

Search filters are stored in the URL. Registration validates required fields, records the response ID, and moves keyboard focus to the confirmation.
See the repository README for database setup, deployment and documentation commands.
