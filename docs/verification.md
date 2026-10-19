# Verification record

Local verification date: 19 October 2026. These results describe the local production build; school deployment is a separate check.

| Area | Evidence and outcome |
| --- | --- |
| Client build | Angular production build passed. |
| Admin build | Angular production build passed with `/admin/` base href. |
| Event management API | 67 local HTTP/data checks passed, covering create/update validation, real dates, amounts, coordinates, IDs, search input, malformed/oversized JSON, historical registration rejection and protected deletion. |
| Original data | Original event and registration rows matched their pre-test SHA-256 digest after temporary fixtures were removed. Ten events and sixteen registrations remained. Auto-increment counters are not part of this comparison. |
| Formatting | 50 isolated checks passed across Shanghai, Brisbane, Sydney, Los Angeles and New York time zones. Covered calendar-day preservation, invalid dates/times, money and past-event checks. |
| Weather | 18 isolated/local checks passed for the request date, stored coordinates, code translation, missing data, forecast horizon, network/provider failures and HTTP validation. A separate live provider call returned the 25 October forecast for event 3. |
| Browser: public pages | Verified shared cards, location search, URL persistence, clear and browser Back, whitespace-name rejection, whole-number tickets, two-ticket total, saved reference and confirmation focus. Past events have no registration link/form. |
| Browser: administration | Verified suspended-event editing, registration display, missing-event feedback, coordinate-pair validation, status/text filters, protected delete and excessive monetary precision rejection. |
| Responsive layout | At 390 CSS pixels, public Home/Search/Details/Registration and Admin List/Form did not overflow the document. The wide admin table scrolls within its labelled region. |
| Final boundary checks | 13 checks cover paragraph descriptions, blank text, repeated saves before redirect and status dates across Shanghai, Brisbane and Los Angeles. |
| API calendar boundaries | 19 checks used the real local MySQL engine with frozen UTC, Sydney and Queensland session clocks. Upcoming lists, search and registration agreed on the Brisbane event day before and after midnight. Temporary fixtures were removed and original rows matched their pre-test digest. |
| Reference documentation | JSDoc and TypeDoc generated API, client and admin references without errors or warnings. A separate audit found parameter/return tags on 93 named methods/functions; constructors and inline callbacks are outside that count. |

The main paths were exercised in a real browser and against the local MySQL instance. Provider error cases were simulated in isolation; they are not claims of an actual external outage. These checks do not establish that a newer version is deployed on a school server.

Before submission, repeat the live read, registration, event write/delete and deep-link checks on each student's own deployment. Confirm the video link, repository access and confidential peer evaluation separately.
