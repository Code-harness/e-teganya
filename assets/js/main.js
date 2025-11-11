const API_KEY = "d460c8640ea4eea0ec62e6bd90d3576c";

const cityElem = document.getElementById("city");
const tempElem = document.getElementById("temp");
const weatherIconElem = document.getElementById("weatherIcon");
const hourlyForecastElem = document.getElementById("hourlyForecast");
const airConditionsElem = document.getElementById("airConditions");
const weeklyForecastElem = document.getElementById("weeklyForecast");

document.getElementById("searchBtn").addEventListener("click", () => {
  const city = document.getElementById("cityName").value.trim();
  if (city) fetchWeatherByCity(city);
});

// Default: Kigali
fetchWeatherByCity("Kigali");

// Ask for location
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    fetchWeatherByCoords(latitude, longitude);
  });
}

async function fetchWeatherByCity(city) {
  try {
    const geoRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    const geoData = await geoRes.json();
    if (geoData.cod !== 200) {
      alert("City not found");
      return;
    }
    const { lat, lon } = geoData.coord;
    fetchWeatherByCoords(lat, lon, geoData.name);
  } catch (error) {
    console.error(error);
  }
}

async function fetchWeatherByCoords(lat, lon, cityName = "") {
  try {
    // Use the free 5-day/3-hour forecast
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );
    const data = await res.json();

    if (!data.list || data.list.length === 0) return;

    const name = cityName || "Current Location";
    cityElem.textContent = name;

    // Current weather: first item in list
    const current = data.list[0];
    tempElem.textContent = `${Math.round(current.main.temp)}°C`;
    weatherIconElem.src = `http://openweathermap.org/img/wn/${current.weather[0].icon}.png`;

    // Hourly Forecast: next 6 entries
    hourlyForecastElem.innerHTML = "";
    data.list.slice(0, 6).forEach((hour) => {
      const hourDiv = document.createElement("div");
      hourDiv.classList.add("hourly");
      hourDiv.innerHTML = `
        <p>${new Date(hour.dt * 1000).getHours()}:00</p>
        <img src="http://openweathermap.org/img/wn/${hour.weather[0].icon}.png" />
        <h2>${Math.round(hour.main.temp)}°C</h2>
      `;
      hourlyForecastElem.appendChild(hourDiv);
    });

    // Air Conditions: use current
    airConditionsElem.innerHTML = "";
    const conditions = [
      { label: "Feels Like", value: `${Math.round(current.main.feels_like)}°C` },
      { label: "Humidity", value: `${current.main.humidity}%` },
      { label: "Wind", value: `${current.wind.speed} m/s` },
      { label: "Pressure", value: `${current.main.pressure} hPa` },
    ];
    conditions.forEach((cond) => {
      const condDiv = document.createElement("div");
      condDiv.classList.add("cond_card");
      condDiv.innerHTML = `
        <img src="./assets/images/humid.png" />
        <p>${cond.label}</p>
        <h2>${cond.value}</h2>
      `;
      airConditionsElem.appendChild(condDiv);
    });

    // Weekly Forecast: group by day
    const dailyMap = {};
    data.list.forEach((item) => {
      const dateStr = new Date(item.dt * 1000).toLocaleDateString("en-US");
      if (!dailyMap[dateStr]) dailyMap[dateStr] = [];
      dailyMap[dateStr].push(item);
    });

    weeklyForecastElem.innerHTML = "";
    Object.keys(dailyMap).slice(0, 7).forEach((dateStr) => {
      const dayData = dailyMap[dateStr][0]; // pick first entry of the day
      const dayDiv = document.createElement("div");
      dayDiv.classList.add("fore_card_data");
      const dateObj = new Date(dayData.dt * 1000);
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      dayDiv.innerHTML = `
        <p>${formattedDate}</p>
        <p>${Math.round(dayData.main.temp)}°C</p>
        <img src="http://openweathermap.org/img/wn/${dayData.weather[0].icon}.png" />
        <p>${dayData.weather[0].description}</p>
      `;
      weeklyForecastElem.appendChild(dayDiv);
    });
  } catch (error) {
    console.error(error);
  }
}
