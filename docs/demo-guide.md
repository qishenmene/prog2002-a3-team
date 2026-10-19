# Demonstration guide

Recording plan for the team demonstration. The complete video must fit within 15 minutes. Each member covers their own changes and the corresponding code.

| Time | Demonstration |
| --- | --- |
| 0:00–1:00 | Introduce Students Helper, both team members and the client/admin split. Show the repository and the live school URL. |
| 1:00–3:00 | Explain the ERD, event-registration relationship, composite unique key and deletion restriction. Show the seeded records. |
| 3:00–6:00 | Demonstrate Home, a location/category search, shareable search URL and event details with newest registrations. Explain Angular component → ApiService → Express → MySQL → JSON → template. |
| 6:00–8:00 | Register using a disposable demonstration email. Show validation, ticket total, saved reference, then the new record on event details. Try the same email again to explain duplicate protection. |
| 8:00–11:00 | Create a disposable event in the admin app, edit it, suspend it and show that public listings hide it while staff can still edit it. Delete the event while it has no registrations. Show why registered events are protected. |
| 11:00–12:00 | Show a forecast for a near-term event. Explain stored coordinates, the event date and the forecast horizon. Show the message on a more distant event. |
| 12:00–13:30 | Show an API request with invalid data, the generated code documentation and responsive navigation. Summarise each member's actual changes. |

Before recording, open both deployed websites and prepare one temporary event for the demonstration. Remove that event and its test registration after filming. Upload the video to SCU OneDrive, check that the marker can open its link, and send the individual peer evaluation to the tutor separately.

Useful files to explain:

- `database/charityevents_db.sql`: keys, relationships and seed data.
- `api/event-validation.js`: server validation before SQL.
- `api/api-controller.js`: event reads/writes, guarded registration insert and deletion protection.
- `client-app/src/app/services/api.service.ts`: typed HTTP contract.
- `client-app/src/app/pages/register/register.ts`: form, total and confirmation.
- `api/weather.js`: event-date forecast and unavailable cases.
- `admin-app/src/app/pages/event-form/event-form.ts`: event fields and associated registrations.
