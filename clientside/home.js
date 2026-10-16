/**
 * Loads and displays available charity events on the Home page.
 *
 * @author Shixiang Tang
 * @version 1.0
 * @since 2026-10-05
 */

const eventList = document.getElementById("eventList");

/**
 * Loads available upcoming events from the API and displays them on the Home page.
 *
 * @returns {void}
 */
function loadEvents() {
    fetch("/api/events")
        .then(function (response) {
            return response.json();
        })
        .then(function (events) {
            if (events.message) {
                eventList.innerHTML =
                    "<p>" + events.message + "</p>";
                return;
            }

            eventList.innerHTML = "";

            for (let i = 0; i < events.length; i++) {
                const eventCard = document.createElement("div");

                eventCard.className = "event-card";

                eventCard.innerHTML =
                    "<p class='event-card-category'>" +
                    events[i].category_name +
                    "</p>" +

                    "<h3>" +
                    events[i].event_name +
                    "</h3>" +

                    "<p>" +
                    events[i].event_address +
                    "</p>";

                const detailsLink = document.createElement("a");

                detailsLink.className = "event-card-link";
                detailsLink.href = "event.html";
                detailsLink.innerHTML = "View Details →";

                detailsLink.onclick = function () {
                    localStorage.setItem(
                        "eventId",
                        events[i].event_id
                    );

                    localStorage.setItem(
                        "eventSource",
                        "index.html"
                    );
                };

                eventCard.appendChild(detailsLink);
                eventList.appendChild(eventCard);
            }
        })
        .catch(function (error) {
            eventList.innerHTML =
                "<p>Unable to load events. Please try again later.</p>";

            console.log(error);
        });
}

loadEvents();