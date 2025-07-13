import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [place, setPlace] = useState('');
  const [aqi, setAqi] = useState(null);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : '';
  }, [darkMode]);

  const geocodePlace = async () => {
    const geoRes = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${place}&count=1`
    );
    if (geoRes.data.results && geoRes.data.results.length > 0) {
      const { latitude, longitude, name } = geoRes.data.results[0];
      return { latitude, longitude, name };
    } else {
      throw new Error('Place not found');
    }
  };

  const fetchAqi = async () => {
    setError('');
    setAqi(null);
    try {
      const { latitude, longitude, name } = await geocodePlace();
      const res = await axios.get(
  `https://aqi-express-backend.onrender.com/fetch-aqi?latitude=${latitude}&longitude=${longitude}`
);

      setAqi({ ...res.data, name });
    } catch (err) {
      setError('Failed to fetch AQI data');
    }
  };

  const getBadgeClass = (aqiValue) => {
    if (aqiValue < 50) return 'aqi-badge good';
    if (aqiValue < 100) return 'aqi-badge moderate';
    if (aqiValue < 150) return 'aqi-badge unhealthy-sensitive';
    return 'aqi-badge unhealthy';
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1 className="title">🌍 Air Quality Predictor</h1>
        <button className="toggle-btn" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <div className="input-group">
        <input
          type="text"
          placeholder="Enter City Name"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
        />
        <button onClick={fetchAqi}>Check AQI</button>
      </div>

      {error && <div className="error">{error}</div>}

      {aqi && (
        <div className="result-card">
          <div className="result-header">
            <h2>📍 {aqi.name}</h2>
            <div className={getBadgeClass(aqi.forecast_aqi)}>
              {aqi.forecast_aqi < 50
                ? '🟢 Good'
                : aqi.forecast_aqi < 100
                ? '🟡 Moderate'
                : aqi.forecast_aqi < 150
                ? '🟠 Sensitive'
                : '🔴 Unhealthy'}
            </div>
          </div>

          <p>
            🌬 <strong>Current AQI:</strong> {aqi.current_aqi}
          </p>
         <p className="predicted-highlight">
  🔮 <strong>Predicted AQI (next 3 hrs):</strong>{' '}
  <span className="predicted-value">{aqi.forecast_aqi}</span>
</p>


          <div className="chart-container">
            <Line
              data={{
                labels: aqi.trend.map((d) => d.time.slice(11, 16)),
                datasets: [
                  {
                    label: 'US AQI',
                    data: aqi.trend.map((d) => d.us_aqi),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.3,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
