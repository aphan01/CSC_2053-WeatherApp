import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';


const apiKey = "8aa0d771c071970f31d1e0042928f68f";

export default function Index() {
  const [current, setCurrent] = useState<any>(null);
  const [hourly48, setHourly48] = useState<any[]>([]);
  const [minutely, setMinutely] = useState<any[]>([]);
  const [latitude, setLatitude] = useState<string>('40.0379');
  const [longitude, setLongitude] = useState<string>('-75.3433');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  
  const fetchWeather = async (lat?: string, lon?: string) => {
    try {
      const latVal = lat || latitude;
      const lonVal = lon || longitude;

      const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latVal}&lon=${lonVal}&units=imperial&appid=${apiKey}`;

      console.log("Fetching from:", url);

      const response = await fetch(url);
      const data = await response.json();

      console.log("Weather API Response:", data);

      if (data.current) setCurrent(data.current);
      if (data.hourly) setHourly48(data.hourly.slice(0, 48)); 
      if (data.minutely) setMinutely(data.minutely);

      setErrorMsg(null);

    } catch (err) {
      console.error("Weather fetch error:", err);
      setErrorMsg("Failed to fetch weather.");
    }
  };

  //  Fetch location on startup
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg("Permission denied.");
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      const lat = loc.coords.latitude.toFixed(5);
      const lon = loc.coords.longitude.toFixed(5);

      setLatitude(lat);
      setLongitude(lon);
      fetchWeather(lat, lon);
    })();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Patrick’s Weather App 🌦️</Text>

      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

      {/* Coordinate Inputs */}
      <TextInput
        style={styles.input}
        value={latitude}
        onChangeText={setLatitude}
        placeholder="Latitude"
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        value={longitude}
        onChangeText={setLongitude}
        placeholder="Longitude"
        keyboardType="numeric"
      />
      <Button title="Refresh Weather" onPress={() => fetchWeather()} />

      {/* 
           CURRENT WEATHER
       */}
      {current && (
        <View style={styles.weatherBox}>
          <Text style={styles.city}>Current Weather</Text>
          <Text style={styles.temp}>{Math.round(current.temp)}°F</Text>
          <Text style={styles.desc}>Feels like: {Math.round(current.feels_like)}°F</Text>
          <Text style={styles.desc}>Humidity: {current.humidity}%</Text>
        </View>
      )}

      {/* 
           MINI BAR GRAPH — NEXT 60 MIN
      */}
      <Text style={styles.sectionTitle}>☔ Next 60 Minutes</Text>

      <View style={styles.graphContainer}>
        {minutely.length > 0 ? (
          <View style={styles.graphRow}>
            {minutely.map((m, i) => {
              const intensity = m.precipitation;  
              const maxHeight = 60;
              const barHeight = Math.min(intensity * 10, maxHeight);

              return (
                <View key={i} style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor:
                          intensity === 0
                            ? '#90CAF9'
                            : intensity < 1
                            ? '#42A5F5'
                            : '#1E88E5',
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={{ fontSize: 16 }}>Loading...</Text>
        )}
      </View>

      <Text style={styles.graphCaption}>
        {minutely.some(m => m.precipitation > 0)
          ? "Rain expected — see intensity above"
          : "No rain expected in the next hour 🌤"}
      </Text>

      {/* 
           48-HOUR FORECAST
       */}
      <Text style={styles.sectionTitle}>🌤 48-Hour Forecast</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {hourly48.map((h, idx) => {
          const dt = new Date(h.dt * 1000);
          const hour = dt.getHours();
          const label =
            hour === 0 ? "12 AM" :
            hour < 12 ? `${hour} AM` :
            hour === 12 ? "12 PM" :
            `${hour - 12} PM`;

          return (
            <View key={idx} style={styles.hourCard}>
              <Text style={styles.hourText}>{label}</Text>

              <Image
                style={styles.iconSmall}
                source={{
                  uri: `https://openweathermap.org/img/wn/${h.weather[0].icon}.png`,
                }}
              />

              <Text style={styles.hourTemp}>
                {Math.round(h.temp)}°
              </Text>

              <Text style={styles.hourRain}>
                {h.pop * 100 > 0 ? `${Math.round(h.pop * 100)}% rain` : "—"}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </ScrollView>
  );
}

// ======================
// STYLES
// ======================

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#E3F2FD",
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0D47A1",
    marginBottom: 20,
  },
  input: {
    width: "80%",
    height: 40,
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  weatherBox: {
    padding: 20,
    marginTop: 20,
    backgroundColor: "white",
    borderRadius: 12,
    alignItems: "center",
    width: "90%",
  },
  city: { fontSize: 22, fontWeight: "bold" },
  temp: { fontSize: 40, fontWeight: "bold", marginVertical: 5 },
  desc: { fontSize: 18 },

  // Titles
  sectionTitle: {
    fontSize: 22,
    marginTop: 25,
    marginBottom: 10,
    fontWeight: "bold",
  },

  // MINUTE GRAPH
  graphContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 12,
    width: "95%",
    marginTop: 10,
  },
  graphRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 80,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 1,
  },
  bar: {
    width: 5,
    borderRadius: 3,
  },
  graphCaption: {
    marginTop: 5,
    fontSize: 16,
    textAlign: "center",
    fontStyle: "italic",
    color: "#0D47A1",
  },

  // HOURLY CARDS
  hourCard: {
    width: 90,
    padding: 10,
    backgroundColor: "white",
    borderRadius: 10,
    marginRight: 10,
    alignItems: "center",
  },
  hourText: {
    fontSize: 16,
    marginBottom: 5,
  },
  iconSmall: { width: 50, height: 50 },
  hourTemp: { fontSize: 20, fontWeight: "bold" },
  hourRain: { fontSize: 14, color: "#1565C0" },

  error: { color: "red", marginVertical: 10 },
});
