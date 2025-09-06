// -----------------------------
// Weather App with Effects
// -----------------------------

const apiKey = "4d8fb5b93d4af21d66a2948710284366"; // replace with your own key
const currentUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastUrlBase = "https://api.openweathermap.org/data/2.5/forecast?units=metric";
// -----------------------------
// Weather App with Effects
// -----------------------------


// DOM references
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const weatherCard = document.getElementById("weatherCard");
const hourlySection = document.querySelector(".hourly-section");
const weatherIcon = document.querySelector(".weather-icon");
const cityElem = document.querySelector(".city");
const tempElem = document.querySelector(".temp");
const descElem = document.querySelector(".description");
const humidityElem = document.querySelector(".humidity");
const windElem = document.querySelector(".wind");
const lastUpdatedElem = document.querySelector(".last-updated");
const hourlyContainer = document.getElementById("hourlyUpdates");
const loader = document.getElementById("loader");
const messageBox = document.getElementById("message");
const rainContainer = document.querySelector(".rain-background");
const heroContainer = document.querySelector(".hero-container");

// ---------------- Utilities ----------------
function showLoader(show = true) {
  loader.style.display = show ? "flex" : "none";
}
function showMessage(text = "", isError = false) {
  if (!text) {
    messageBox.style.display = "none";
    return;
  }
  messageBox.style.display = "block";
  messageBox.textContent = text;
  messageBox.style.background = isError ? "rgba(255,0,0,0.15)" : "rgba(255,255,255,0.9)";
  messageBox.style.color = isError ? "#b22222" : "#333";
  messageBox.scrollIntoView({ behavior: "smooth", block: "center" });
}
function getIcon(main) {
  main = (main || "").toLowerCase();
  if (main.includes("cloud")) return "images/clouds.png";
  if (main.includes("rain")) return "images/rain.png";
  if (main.includes("drizzle")) return "images/drizzle.png";
  if (main.includes("mist")) return "images/mist.png";
  if (main.includes("snow")) return "images/snow.png";
  return "images/clear.png";
}
function formatLocalTime(offsetSeconds) {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + offsetSeconds * 1000).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

// ---------------- Background + Effects ----------------
function setBackground(condition) {
  rainContainer.innerHTML = ""; // clear old effects
  const c = (condition || "").toLowerCase();

  if (c.includes("rain") || c.includes("drizzle")) {
    document.body.style.background = "linear-gradient(135deg, #4b79a1, #283e51)";
    createRain();
  } else if (c.includes("snow")) {
    document.body.style.background = "linear-gradient(135deg, #e0eafc, #cfdef3)";
    createSnow();
  } else if (c.includes("cloud")) {
    document.body.style.background = "linear-gradient(135deg, #bdc3c7, #2c3e50)";
  } else {
    document.body.style.background = "linear-gradient(135deg, #74ebd5, #9face6)";
  }
}

function createRain() {
  for (let i = 0; i < 60; i++) {
    const drop = document.createElement("div");
    drop.className = "raindrop";
    drop.style.left = `${Math.random() * 100}%`;
    drop.style.animationDuration = `${0.5 + Math.random()}s`;
    drop.style.animationDelay = `${Math.random()}s`;
    rainContainer.appendChild(drop);
  }
}
function createSnow() {
  for (let i = 0; i < 30; i++) {
    const snow = document.createElement("div");
    snow.className = "snowflake";
    snow.textContent = ["❄", "❅", "❆"][Math.floor(Math.random() * 3)];
    snow.style.left = `${Math.random() * 100}%`;
    snow.style.animationDuration = `${2 + Math.random() * 3}s`;
    rainContainer.appendChild(snow);
  }
}

// ---------------- Hourly Forecast ----------------
function buildHourly(list, offset) {
  hourlyContainer.innerHTML = "";
  list.slice(0, 8).forEach((item, idx) => {
    const local = new Date((item.dt + offset) * 1000);
    const time = local.toLocaleTimeString([], { hour: "numeric" });
    const temp = Math.round(item.main.temp);
    const icon = getIcon(item.weather[0].main);

    const card = document.createElement("div");
    card.className = "hour-card";
    if (idx === 0) card.classList.add("current");
    card.innerHTML = `
      <p>${time}</p>
      <img src="${icon}" alt="${item.weather[0].description}">
      <p>${temp}°C</p>
    `;
    hourlyContainer.appendChild(card);
  });
}

// ---------------- Fetch ----------------
async function fetchWeather(city) {
  // Collapse hero immediately so loader/message/results are visible
  heroContainer.classList.add("compact");

  if (!apiKey || apiKey === "YOUR_API_KEY") {
    showMessage("Add your OpenWeatherMap API key in script.js (apiKey).", true);
    return;
  }

  showMessage("");
  showLoader(true);

  cityInput.disabled = true;
  searchBtn.disabled = true;

  try {
    const resp = await fetch(`${currentUrl}${encodeURIComponent(city)}&appid=${apiKey}`);
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Request failed (${resp.status}). ${errText || "Check city name or API key."}`);
    }
    const data = await resp.json();

    // ✅ Force snow for Nuuk (testing only)
    if (data.name && data.name.toLowerCase() === "nuuk") {
      data.weather[0].main = "Snow";
      data.weather[0].description = "forced snowy test";
    }

    // Show sections once data is loaded
    weatherCard.style.display = "block";
    hourlySection.style.display = "block";

    cityElem.textContent = `${data.name}, ${data.sys.country}`;
    tempElem.textContent = `${Math.round(data.main.temp)}°C`;
    descElem.textContent = data.weather[0].description;
    humidityElem.textContent = `${data.main.humidity}%`;
    windElem.textContent = `${data.wind.speed} km/h`;
    weatherIcon.src = getIcon(data.weather[0].main);
    lastUpdatedElem.textContent = `City time: ${formatLocalTime(data.timezone)}`;

    setBackground(data.weather[0].main, data.timezone);
    fetchForecast(data.coord.lat, data.coord.lon, data.timezone);
  } catch (e) {
    console.error(e);
    showMessage(
      e.message.includes("401")
        ? "Invalid API key. Update the apiKey in script.js."
        : "Could not load weather. " + e.message,
      true
    );
  } finally {
    showLoader(false);
    cityInput.disabled = false;
    searchBtn.disabled = false;
  }
}

async function fetchForecast(lat, lon, offset) {
  try {
    const resp = await fetch(`${forecastUrlBase}&lat=${lat}&lon=${lon}&appid=${apiKey}`);
    if (!resp.ok) return;
    const data = await resp.json();
    buildHourly(data.list, offset);
  } catch (e) {
    console.error(e);
  }
}

// ---------------- Events ----------------
function initiateSearch() {
  const val = cityInput.value.trim();
  if (val) fetchWeather(val);
}
searchBtn.addEventListener("click", e => {
  e.preventDefault();
  initiateSearch();
});
cityInput.addEventListener("keyup", e => {
  if (e.key === "Enter") initiateSearch();
});

// ---------------- Initial ----------------
window.addEventListener("load", () => {
  weatherCard.style.display = "none";
  hourlySection.style.display = "none";
  showMessage(""); 
});
