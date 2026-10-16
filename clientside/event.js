/**
 * Loads and displays the selected charity event on the Event Details page.
 *
 * @author Shixiang Tang
 * @version 1.0
 * @since 2026-10-05
 */

const eventCategory = document.getElementById("eventCategory");
const eventName = document.getElementById("eventName");
const eventDate = document.getElementById("eventDate");
const eventTime = document.getElementById("eventTime");
const eventAddress = document.getElementById("eventAddress");
const eventPurpose = document.getElementById("eventPurpose");
const eventDescription = document.getElementById("eventDescription");
const eventTicketPrice = document.getElementById("eventTicketPrice");
const eventGoalRaised = document.getElementById("eventGoalRaised");
const eventGoalAmount = document.getElementById("eventGoalAmount");
const progressBar = document.getElementById("progressBar");
const registerButton = document.getElementById("registerButton");
const eventError = document.getElementById("eventError");
const backLink = document.getElementById("backLink");

/**
 * Sets the back link according to the page used to open the event.
 *
 * @returns {void}
 */
function setBackLink() {
    const eventSource = localStorage.getItem("eventSource");

    if (eventSource === "search.html") {
        backLink.href = "search.html";
        backLink.innerHTML = "← Back to Search";
    } else {
        backLink.href = "index.html";
        backLink.innerHTML = "← Back to Home";
    }
}

/**
 * Loads the selected event from the API using the event ID stored in local storage.
 *
 * @returns {void}
 */
function loadEvent() {
    const eventId = localStorage.getItem("eventId");

    if (eventId === null) {
        eventError.innerHTML = "No event has been selected.";
        return;
    }

    fetch("/api/events/" + eventId)
        .then(function (response) {
            return response.json();
        })
        .then(function (event) {
            if (event.message) {
                eventError.innerHTML = event.message;
                return;
            }

            eventError.innerHTML = "";

            eventCategory.innerHTML = event.category_name;
            eventName.innerHTML = event.event_name;
            eventDate.innerHTML = event.event_date;
            eventTime.innerHTML = event.event_time;
            eventAddress.innerHTML = event.event_address;
            eventPurpose.innerHTML = event.event_purpose;
            eventDescription.innerHTML = event.event_description;

            if (Number(event.event_ticket_price) === 0) {
                eventTicketPrice.innerHTML = "Free";
            } else {
                eventTicketPrice.innerHTML =
                    "$" + event.event_ticket_price;
            }

            eventGoalRaised.innerHTML =
                "$" + event.event_goal_raised_amount;

            eventGoalAmount.innerHTML =
                "$" + event.event_goal_amount;

            let progress =
                event.event_goal_raised_amount /
                event.event_goal_amount *
                100;

            if (progress > 100) {
                progress = 100;
            }

            progressBar.style.width = progress + "%";
        })
        .catch(function (error) {
            eventError.innerHTML =
                "Unable to load this event. Please try again.";

            console.log(error);
        });
}

/**
 * Displays the registration feature message.
 *
 * @returns {void}
 */
function showRegistrationMessage() {
    alert("This feature is currently under construction.");
}

registerButton.onclick = function () {
    showRegistrationMessage();
};

setBackLink();
loadEvent();