# Administration website

Angular 22 and TypeScript application for listing, creating, editing and deleting charity events.
The list includes past and suspended events. Staff can filter by status or text. Events with registrations show a protected delete action, backed by an API check and a foreign-key constraint.

Run `npm ci`, then `npm start -- --port 4300` for development; the proxy forwards `/api` to port 8080.
Build with `npm run build -- --configuration production --base-href /admin/`.
Express serves `dist/admin-app/browser` at `/admin/`.

The edit page loads registrations separately, so a failed registration-list request does not discard event fields.
Coordinates are optional but must be entered as a pair. Authentication is outside the assessment scope.
