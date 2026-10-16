/**
 * Provides event searching and filtering functions for the Search page.
 *
 * @author Shixiang Tang
 * @version 1.0
 * @since 2026-10-05
 */

const searchForm = document.getElementById("searchForm");
const dateInput = document.getElementById("dateInput");
const locationInput = document.getElementById("locationInput");
const categoryInput = document.getElementById("categoryInput");
const clearFilters = document.getElementById("clearFilters");
const searchError = document.getElementById("searchError");
const searchResults = document.getElementById("searchResults");

/**
 * Loads event categories from the API into the category dropdown.
 *
 * @returns {void}
 */
function loadCategories() {
    fetch("/api/categories")
        .then(function (response) {
            return response.json();
        })
        .then(function (categories) {
            if (categories.message) {
                searchError.innerHTML = categories.message;
                return;
            }

            categoryInput.innerHTML =
                "<option value=''>All Categories</option>";

            for (let i = 0; i < categories.length; i++) {
                const option = document.createElement("option");

                option.value = categories[i].category_id;
                option.innerHTML = categories[i].category_name;

                categoryInput.appendChild(option);
            }

            restoreSearch();
        })
        .catch(function (error) {
            searchError.innerHTML =
                "Unable to load event categories.";

            console.log(error);
        });
}

/**
 * Displays event search results on the page.
 *
 * @param {Array} events the events returned by the search API
 * @returns {void}
 */
function displayEvents(events) {
    searchResults.innerHTML = "";

    if (events.length === 0) {
        searchError.innerHTML =
            "No matching events were found.";
        return;
    }

    searchError.innerHTML = "";

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
                "search.html"
            );
        };

        eventCard.appendChild(detailsLink);
        searchResults.appendChild(eventCard);
    }
}

/**
 * Saves the current search filters in local storage.
 *
 * @returns {void}
 */
function saveSearch() {
    localStorage.setItem("searchDate", dateInput.value);
    localStorage.setItem("searchLocation", locationInput.value);
    localStorage.setItem("searchCategory", categoryInput.value);
    localStorage.setItem("searchPerformed", "true");
}

/**
 * Restores the previous search filters and reloads the matching results.
 *
 * @returns {void}
 */
function restoreSearch() {
    const searchPerformed =
        localStorage.getItem("searchPerformed");

    if (searchPerformed === "true") {
        dateInput.value =
            localStorage.getItem("searchDate");

        locationInput.value =
            localStorage.getItem("searchLocation");

        categoryInput.value =
            localStorage.getItem("searchCategory");

        searchEvents();
    }
}

/**
 * Searches for events using the selected search criteria.
 *
 * @returns {void}
 */
function searchEvents() {
    let searchUrl = "/api/events/search?";
    let hasCriteria = false;

    searchError.innerHTML = "";
    searchResults.innerHTML = "";

    saveSearch();

    if (dateInput.value !== "") {
        searchUrl =
            searchUrl +
            "date=" +
            dateInput.value;

        hasCriteria = true;
    }

    if (locationInput.value !== "") {
        if (hasCriteria) {
            searchUrl = searchUrl + "&";
        }

        searchUrl =
            searchUrl +
            "location=" +
            locationInput.value;

        hasCriteria = true;
    }

    if (categoryInput.value !== "") {
        if (hasCriteria) {
            searchUrl = searchUrl + "&";
        }

        searchUrl =
            searchUrl +
            "category=" +
            categoryInput.value;

        hasCriteria = true;
    }

    if (!hasCriteria) {
        searchUrl = "/api/events";
    }

    fetch(searchUrl)
        .then(function (response) {
            return response.json();
        })
        .then(function (events) {
            if (events.message) {
                searchError.innerHTML = events.message;
                return;
            }

            displayEvents(events);
        })
        .catch(function (error) {
            searchError.innerHTML =
                "Unable to search for events. Please try again.";

            console.log(error);
        });
}

/**
 * Clears all search filters, saved search data, and search results.
 *
 * @returns {void}
 */
function clearSearchFilters() {
    dateInput.value = "";
    locationInput.value = "";
    categoryInput.value = "";

    searchError.innerHTML = "";
    searchResults.innerHTML = "";

    localStorage.removeItem("searchDate");
    localStorage.removeItem("searchLocation");
    localStorage.removeItem("searchCategory");
    localStorage.removeItem("searchPerformed");
}

searchForm.onsubmit = function () {
    searchEvents();
    return false;
};

clearFilters.onclick = function () {
    clearSearchFilters();
};

loadCategories();