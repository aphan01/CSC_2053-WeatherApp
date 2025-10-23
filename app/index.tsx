import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Button, Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { UrlTile } from 'react-native-maps';

// ✅ Replace with your actual OpenWeatherMap API key
const apiKey = 'c6259f32c862a6c498c87d182ea451c3';

export default function Index() {
  const [weather, setWeather] = useState<any>(null);
  const [latitude, setLatitude] = useState<string>('40.0379');
  const [longitude, setLongitude] = useState<string>('-75.3433');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);

  // 🔹 Fetch weather data
  const fetchWeather = async (lat?: string, lon?: string) => {
    try {
      const latitudeVal = lat || latitude;
      const longitudeVal = lon || longitude;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitudeVal}&lon=${longitudeVal}&appid=${apiKey}&units=imperial`;

      console.log('Fetching from URL:', url);
      const response = await fetch(url);
      const data = await response.json();

      if (data.cod !== 200) {
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Patrick’s Weather App 🌦️</Text>

      {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

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

      {/* Weather info */}
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

      {/* 🌧️ Weather Radar Map */}
      <View style={styles.mapContainer}>
        <Text style={styles.mapTitle}>Live Radar Map</Text>
        <MapView
          style={styles.map}
          mapType="none" // ✅ Hide base Apple Map to show radar clearly
          initialRegion={{
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            latitudeDelta: 1,
            longitudeDelta: 1,
          }}
        >
          {/* Base tile for context */}
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            zIndex={1}
          />

          {/* 🌦️ OpenWeatherMap radar overlay */}
          <UrlTile
            urlTemplate={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${apiKey}`}
            zIndex={2} // ✅ Ensures radar appears above the map
            maximumZ={19}
          />
        </MapView>
      </View>
    </ScrollView>
  );
}

// 🔹 Styling
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
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
  mapContainer: {
    height: 300,
    width: '100%',
    marginTop: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
});
