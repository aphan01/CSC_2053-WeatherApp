import * as Location from 'expo-location';
import React, { useEffect, useState } from 'react';
import {
  Button,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const H = Dimensions.get('window').height;
const MAP_H = Math.round(H * 0.38);

// 🔑 OpenWeather API key
const apiKey = '8aa0d771c071970f31d1e0042928f68f';

export default function Index() {
  const [current, setCurrent] = useState<any>(null);
  const [hourly48, setHourly48] = useState<any[]>([]);
  const [minutely, setMinutely] = useState<any[]>([]);
  const [latitude, setLatitude] = useState<string>('40.0379');
  const [longitude, setLongitude] = useState<string>('-75.3433');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [locationName, setLocationName] = useState<string>(''); // ⭐ city name

  // 🔹 Fetch weather from One Call + city name from /weather
  const fetchWeather = async (lat?: string, lon?: string) => {
    try {
      const latVal = lat || latitude;
      const lonVal = lon || longitude;

      const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latVal}&lon=${lonVal}&units=imperial&appid=${apiKey}`;
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latVal}&lon=${lonVal}&units=imperial&appid=${apiKey}`;

      console.log('Fetching from:', oneCallUrl, currentUrl);

      const [oneCallRes, currentRes] = await Promise.all([
        fetch(oneCallUrl),
        fetch(currentUrl),
      ]);

      const oneCallData = await oneCallRes.json();
      const currentData = await currentRes.json();

      console.log('OneCall Response:', oneCallData);
      console.log('Current Weather Response:', currentData);

      // One Call pieces
      if (oneCallData.current) setCurrent(oneCallData.current);
      else setCurrent(null);

      if (oneCallData.hourly) setHourly48(oneCallData.hourly.slice(0, 48));
      else setHourly48([]);

      if (oneCallData.minutely) setMinutely(oneCallData.minutely);
      else setMinutely([]);

      // City name
      if (currentData && currentData.name) {
        setLocationName(currentData.name);
      } else {
        setLocationName('');
      }

      setErrorMsg(null);
    } catch (err) {
      console.error('Weather fetch error:', err);
      setErrorMsg('Failed to fetch weather.');
      setCurrent(null);
      setHourly48([]);
      setMinutely([]);
      setLocationName('');
    }
  };

  // 🔹 Request location on startup
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
            <Text style={styles.title}>Patrick’s Weather App 🌦️</Text>

            {/* Error */}
            {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

            {/* Inputs */}
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

            {/* CURRENT WEATHER */}
            {current ? (
              <View style={styles.weatherBox}>
                <Text style={styles.city}>
                  {locationName ? locationName : 'Current Weather'}
                </Text>

                {current.weather && current.weather[0] && (
                  <Image
                    style={styles.icon}
                    source={{
                      uri: `https://openweathermap.org/img/wn/${current.weather[0].icon}.png`,
                    }}
                  />
                )}

                <Text style={styles.temp}>
                  {Math.round(current.temp)}°F
                </Text>
                <Text style={styles.desc}>
                  Feels like: {Math.round(current.feels_like)}°F
                </Text>
                <Text style={styles.desc}>Humidity: {current.humidity}%</Text>
              </View>
            ) : (
              !errorMsg && (
                <Text style={{ marginTop: 12 }}>Fetching weather data...</Text>
              )
            )}

            {/* NEXT 60 MIN PRECIPITATION BAR */}
            <Text style={styles.sectionTitle}>☔ Next 60 Minutes</Text>

            <View style={styles.graphContainer}>
              {minutely && minutely.length > 0 ? (
                <View style={styles.graphRow}>
                  {minutely.map((m, i) => {
                    const intensity = m.precipitation; // mm/hour
                    const maxHeight = 60;
                    const scaled = Math.min(intensity * 10, maxHeight);
                    const baseHeight = 4; // ⭐ minimum height so bars show
                    const barHeight =
                      intensity === 0
                        ? baseHeight
                        : Math.max(baseHeight, scaled);

                    return (
                      <View key={i} style={styles.barWrapper}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: barHeight,
                              backgroundColor:
                                intensity === 0
                                  ? '#BBDEFB'
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
                <Text style={{ fontSize: 16 }}>No minutely data available</Text>
              )}
            </View>

            <Text style={styles.graphCaption}>
              {minutely && minutely.some(m => m.precipitation > 0)
                ? 'Rain expected — see intensity above'
                : 'No rain expected in the next hour 🌤'}
            </Text>

            {/* 48-HOUR FORECAST */}
            <Text style={styles.sectionTitle}>🌤 48-Hour Forecast</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {hourly48.map((h, idx) => {
                const dt = new Date(h.dt * 1000);
                const hour = dt.getHours();
                const label =
                  hour === 0
                    ? '12 AM'
                    : hour < 12
                    ? `${hour} AM`
                    : hour === 12
                    ? '12 PM'
                    : `${hour - 12} PM`;

                return (
                  <View key={idx} style={styles.hourCard}>
                    <Text style={styles.hourText}>{label}</Text>

                    {h.weather && h.weather[0] && (
                      <Image
                        style={styles.iconSmall}
                        source={{
                          uri: `https://openweathermap.org/img/wn/${h.weather[0].icon}.png`,
                        }}
                      />
                    )}

                    <Text style={styles.hourTemp}>
                      {Math.round(h.temp)}°
                    </Text>

                    <Text style={styles.hourRain}>
                      {h.pop * 100 > 0
                        ? `${Math.round(h.pop * 100)}% rain`
                        : '—'}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            {/* MAP */}
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
                  <UrlTile
                    urlTemplate={`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${apiKey}`}
                    zIndex={1}
                    maximumZ={19}
                  />

                  <UrlTile
                    urlTemplate={`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${apiKey}`}
                    zIndex={2}
                    maximumZ={19}
                  />

                  <Marker
                    coordinate={{
                      latitude: parseFloat(latitude),
                      longitude: parseFloat(longitude),
                    }}
                    title={locationName || 'Current location'}
                    description={
                      current && current.weather && current.weather[0]
                        ? `${Math.round(current.temp)}°F, ${current.weather[0].description}`
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
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1565C0',
    textAlign: 'center',
    marginBottom: 8,
  },
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
    marginTop: 10,
  },
  city: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  temp: {
    fontSize: 32,
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '700',
  },
  desc: {
    fontSize: 16,
    textAlign: 'center',
  },
  icon: {
    width: 64,
    height: 64,
    alignSelf: 'center',
    marginVertical: 8,
  },
  error: {
    color: 'red',
    fontSize: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    marginTop: 25,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  graphContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    width: '100%',
    marginTop: 10,
  },
  graphRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 80,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  bar: {
    width: 5,
    borderRadius: 3,
  },
  graphCaption: {
    marginTop: 5,
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#0D47A1',
  },
  hourCard: {
    width: 90,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  hourText: {
    fontSize: 16,
    marginBottom: 5,
  },
  iconSmall: { width: 50, height: 50 },
  hourTemp: { fontSize: 20, fontWeight: 'bold' },
  hourRain: { fontSize: 14, color: '#1565C0' },
  mapCard: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
    height: 320,
  },
  map: { flex: 1 },
});
