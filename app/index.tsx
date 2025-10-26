import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Button, Image, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Index() {
  const [weather, setWeather] = useState<any>(null);
  const [latitude, setLatitude] = useState<string>('40.0379');
  const [longitude, setLongitude] = useState<string>('-75.3433');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);

  // ✅ Replace with your actual OpenWeatherMap API key
  const apiKey = 'c6259f32c862a6c498c87d182ea451c3';

  // 🔹 Function to fetch weather data from the API
  const fetchWeather = async (lat?: string, lon?: string) => {
    try {
      const latitudeVal = lat || latitude;
      const longitudeVal = lon || longitude;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitudeVal}&lon=${longitudeVal}&appid=${apiKey}&units=imperial`;

      console.log('Fetching from URL:', url); // ✅ Log URL for debugging

      const response = await fetch(url);
      const data = await response.json();

      console.log('Weather API Response:', data); // ✅ See full API response

      if (data.cod !== 200) {
        // If API returns an error (like invalid key or bad request)
        setErrorMsg(data.message || 'Unable to fetch weather data.');
        setWeather(null);
      } else {
        setWeather(data);
        setErrorMsg(null);
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      setErrorMsg('Network or fetch error occurred.');
    }
  };

  // 🔹 Ask for location permission and get current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      if (currentLocation) {
        const lat = currentLocation.coords.latitude.toFixed(5);
        const lon = currentLocation.coords.longitude.toFixed(5);
        setLatitude(lat);
        setLongitude(lon);
        fetchWeather(lat, lon);
      }
    })();
  }, []);

  // 🔹 Main UI
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather App</Text>

      {/* Error message */}
      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

      {/* Input fields */}
      <Text>Enter Coordinates:</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter latitude"
        keyboardType="numeric"
        value={latitude}
        onChangeText={setLatitude}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter longitude"
        keyboardType="numeric"
        value={longitude}
        onChangeText={setLongitude}
      />

      <Button title="Get Weather" onPress={() => fetchWeather()} />

      {/* Weather display */}
      {weather && weather.main && weather.weather ? (
        <View style={styles.weatherBox}>
          <Text style={styles.city}>{weather.name || 'Your Location'}</Text>
          <Image
            style={styles.icon}
            source={{
              uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}.png`,
            }}
          />
          <Text style={styles.temp}>Temperature: {weather.main.temp}°F</Text>
          <Text style={styles.desc}>
            Conditions: {weather.weather[0].description}
          </Text>
        </View>
      ) : (
        !errorMsg && <Text>Fetching weather data...</Text>
      )}
    </View>
  );
}

// 🔹 Styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1565C0',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    width: '80%',
    marginVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
  },
  weatherBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  city: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  temp: {
    fontSize: 20,
    marginBottom: 5,
  },
  desc: {
    fontSize: 18,
    textTransform: 'capitalize',
  },
  icon: {
    width: 70,
    height: 70,
    marginVertical: 10,
  },
  error: {
    color: 'red',
    fontSize: 16,
    marginBottom: 10,
  },
});
