// Top 3 issues implemented: GitHub Skills activity, filters/search/sort, and prettier interface
// Dark mode toggle logic
function setTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const toggleBtn = document.getElementById('dark-mode-toggle');
  if (toggleBtn) toggleBtn.textContent = theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
}
function toggleTheme() {
  const current = document.body.getAttribute('data-theme') || 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}
document.addEventListener("DOMContentLoaded", () => {
  // Dark mode setup
  const savedTheme = localStorage.getItem('theme') || 'light';
  setTheme(savedTheme);
  const toggleBtn = document.getElementById('dark-mode-toggle');
  if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);

  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const messageDiv = document.getElementById("message");
  // Filter/search/sort controls
  const categoryFilter = document.getElementById("category-filter");
  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");

  let allActivities = {};

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      allActivities = activities;
      renderActivities();
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Render activities with filters, search, and sort
  function renderActivities() {
    // Clear previous
    activitiesList.innerHTML = "";
    if (activitySelect) activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

    // Get filter/sort values
    const category = categoryFilter ? categoryFilter.value : "";
    const search = searchInput ? searchInput.value.toLowerCase() : "";
    const sortBy = sortSelect ? sortSelect.value : "name";

    // Convert to array for sorting/filtering
    let activityArr = Object.entries(allActivities);

    // Filter by category
    if (category) {
      activityArr = activityArr.filter(([, details]) => details.category === category);
    }
    // Filter by search
    if (search) {
      activityArr = activityArr.filter(([name, details]) =>
        name.toLowerCase().includes(search) ||
        details.description.toLowerCase().includes(search)
      );
    }
    // Sort
    activityArr.sort((a, b) => {
      if (sortBy === "name") return a[0].localeCompare(b[0]);
      if (sortBy === "category") return a[1].category.localeCompare(b[1].category);
      if (sortBy === "schedule") return a[1].schedule.localeCompare(b[1].schedule);
      return 0;
    });

    // Render
    activityArr.forEach(([name, details]) => {
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
      // Add registration form to each card
      const registerForm = `
        <form class="register-form" data-activity="${name}">
          <input type="email" class="register-email" required placeholder="your-email@mergington.edu" />
          <button type="submit">Register</button>
        </form>
      `;
      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Category:</strong> ${details.category}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
        ${registerForm}
      `;
      activitiesList.appendChild(activityCard);
      // Add option to select dropdown
      if (activitySelect) {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      }
    });
    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
    // Add event listeners to register forms
    document.querySelectorAll(".register-form").forEach((form) => {
      form.addEventListener("submit", handleRegister);
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

  // Handle registration from activity card
  async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const activity = form.getAttribute("data-activity");
    const emailInput = form.querySelector(".register-email");
    const email = emailInput.value;
    if (!email) return;
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        form.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  }

  // Firework effect logic
  function launchFirework() {
    const firework = document.createElement('div');
    firework.className = 'firework-effect';
    document.body.appendChild(firework);
    // Animate upward
    setTimeout(() => {
      firework.classList.add('explode');
    }, 300);
    // Remove after animation
    setTimeout(() => {
      firework.remove();
    }, 1800);
  }

  // Add filter/search/sort listeners
  if (categoryFilter) categoryFilter.addEventListener("change", renderActivities);
  if (searchInput) searchInput.addEventListener("input", renderActivities);
  if (sortSelect) sortSelect.addEventListener("change", renderActivities);

  // Initialize app
  fetchActivities();
  const fireworkBtn = document.getElementById('firework-btn');
  if (fireworkBtn) fireworkBtn.addEventListener('click', launchFirework);
});
