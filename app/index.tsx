import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import { Button, Dimensions, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';


const H = Dimensions.get("window").height;
const MAP_H = Math.round(H * 0.38);

export default function Index() {
  const [weather, setWeather] = useState<any>(null);
  const [latitude, setLatitude] = useState<string>('40.0379');
  const [longitude, setLongitude] = useState<string>('-75.3433');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);

  // ✅ Replace with your actual OpenWeatherMap API key
  const apiKey = 'c6259f32c862a6c498c87d182ea451c3';

  // 🔹 Fetch weather data from OpenWeatherMap
  const fetchWeather = async (lat?: string, lon?: string) => {
    try {
      const latitudeVal = lat || latitude;
      const longitudeVal = lon || longitude;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitudeVal}&lon=${longitudeVal}&appid=${apiKey}&units=imperial`;

      console.log('Fetching from URL:', url);
      const response = await fetch(url);
      const data = await response.json();
      console.log('Weather API Response:', data);

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

  // 🔹 Request location and load initial data
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#E3F2FD' }}>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, padding: 20 }}
      >
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Weather App</Text>

        {/* Error Message */}
        {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

        {/* Input Fields */}
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
        <View style={{ marginTop: 8 }}>
            <Button title="Get Weather" onPress={() => fetchWeather()} />
        </View>

        {/* Weather Display */}
        {weather && weather.main && weather.weather ? (
          <View style={styles.weatherBox}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.city}>
              {weather.name || 'Your Location'}
            </Text>
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
          !errorMsg && <Text style={{ marginTop: 12 }}>Fetching weather data...</Text>
        )}

        {/* 🌎 Map + Weather Overlay */}
        {Platform.OS !== 'web' && latitude && longitude && (
          <View style={styles.mapCard}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={{
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              latitudeDelta: 5,
              longitudeDelta: 5,
            }}
          >
            {/* 🔥 Temperature heat overlay */}
            <UrlTile
              urlTemplate={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`}
              zIndex={1}
              maximumZ={19}
            />

            {/* ☁️ Cloud overlay (optional, can remove if cluttered) */}
            <UrlTile
              urlTemplate={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`}
              zIndex={2}
              maximumZ={19}
            />

            {/* 📍 Marker for current location */}
            <Marker
              coordinate={{
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
              }}
              title={weather?.name || 'Location'}
              description={
                weather
                  ? `${weather.main.temp}°F, ${weather.weather[0].description}`
                  : 'Loading...'
              }
            />
          </MapView>
          </View>
        )}
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
}

// 🔹 Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: 20,
    gap: 10,  
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1565C0',
    textAlign: 'center',
    marginBottom: 8,
  },
  label: { fontSize: 14, color: '#0b2e4e', marginTop: 4, marginBottom: 6 },
  input: {
    height: 44,
    borderColor: '#c7c7c7',
    borderWidth: 1,
    width: '100%',
    marginBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  weatherBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  city: {
    fontSize: 20, 
    fontWeight: '600', 
    marginBottom: 6, 
    textAlign: 'center'
  },
  temp: {
    fontSize: 18, 
    marginBottom: 4, 
    textAlign: 'center'
  },
  desc: {
    fontSize: 16, 
    textTransform: 'capitalize', 
    textAlign: 'center'
  },
  icon: {
    width: 64, 
    height: 64, 
    alignSelf: 'center', 
    marginVertical: 8
  },
  error: {
    color: 'red', 
    fontSize: 15, 
    marginBottom: 8, 
    textAlign: 'center'
  },
  mapCard: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 320,           
  },
  map: { flex: 1 },
});
