document.addEventListener("DOMContentLoaded", () => {

  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const categoryFilter = document.getElementById("category-filter");
  const sortActivities = document.getElementById("sort-activities");
  const searchActivities = document.getElementById("search-activities");

  // Hardcoded categories for demo (in real app, should come from backend)
  const activityCategories = {
    "Chess Club": "Academic",
    "Programming Class": "Academic",
    "Gym Class": "Sports",
    "Soccer Team": "Sports",
    "Basketball Team": "Sports",
    "Art Club": "Arts",
    "Drama Club": "Arts",
    "Math Club": "Academic",
    "Debate Team": "Academic"
  };

  let allActivities = {};

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      allActivities = activities;
      renderToolbarControls(activities);
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function renderToolbarControls(activities) {
    // Populate category filter
    const categories = new Set();
    Object.keys(activities).forEach((name) => {
      if (activityCategories[name]) {
        categories.add(activityCategories[name]);
      }
    });
    // Remove all except 'All'
    while (categoryFilter.options.length > 1) {
      categoryFilter.remove(1);
    }
    Array.from(categories)
      .sort()
      .forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        categoryFilter.appendChild(opt);
      });
  }

  function renderActivities() {
    // Get filter/sort/search values
    const selectedCategory = categoryFilter ? categoryFilter.value : "";
    const sortBy = sortActivities ? sortActivities.value : "name";
    const searchText = searchActivities ? searchActivities.value.trim().toLowerCase() : "";

    // Clear list and dropdown
    activitiesList.innerHTML = "";
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    // Filter, sort, and search
    let filtered = Object.entries(allActivities).filter(([name, details]) => {
      // Category filter
      if (selectedCategory && activityCategories[name] !== selectedCategory) return false;
      // Search filter
      if (searchText) {
        const combined = `${name} ${details.description} ${details.schedule}`.toLowerCase();
        if (!combined.includes(searchText)) return false;
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a[0].localeCompare(b[0]);
      } else if (sortBy === "schedule") {
        return a[1].schedule.localeCompare(b[1].schedule);
      }
      return 0;
    });

    // Render
    filtered.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";
      const spotsLeft = details.max_participants - details.participants.length;
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Category:</strong> ${activityCategories[name] || "Other"}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Toolbar event listeners
  if (categoryFilter) categoryFilter.addEventListener("change", renderActivities);
  if (sortActivities) sortActivities.addEventListener("change", renderActivities);
  if (searchActivities) searchActivities.addEventListener("input", renderActivities);

  // Initialize app
  fetchActivities();
});
