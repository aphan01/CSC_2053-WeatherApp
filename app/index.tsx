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
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLD_THRESHOLD_F = 45;
const H = Dimensions.get('window').height;
const MAP_H = Math.round(H * 0.38);
const reactionImages = {
  cold: require('../assets/images/lecold.jpg'),
  normal: require('../assets/images/lehappy.png'),
  rain: require('../assets/images/lesad.png'),
};
// 🔑 OpenWeather API key
const apiKey = '8aa0d771c071970f31d1e0042928f68f';

// Simple preset list for dropdown suggestions
const CITY_PRESETS = [
  'Philadelphia, US',
  'New York, US',
  'Los Angeles, US',
  'Chicago, US',
  'Houston, US',
  'London, GB',
  'Paris, FR',
  'Tokyo, JP',
  'Hanoi, VN',
  'Ho Chi Minh City, VN',
];

function getGoOutDecision(current: any) {
  if (!current || !current.weather || !current.weather[0]) return null;

  const temp = current.temp; // already in °F from your API call
  const main = (current.weather[0].main || '').toLowerCase();

  const isRaining =
    main.includes('rain') ||
    main.includes('drizzle') ||
    main.includes('thunderstorm') ||
    !!current.rain;

  if (isRaining) {
    return {
      text: "No, LeBron can't go out.",
      image: reactionImages.rain,
    };
  }

  if (temp < COLD_THRESHOLD_F) {
    return {
      text: "Yes, but LeBron must wear a coat.",
      image: reactionImages.cold,
    };
  }

  return {
    text: 'Yes, LeBron can go out.',
    image: reactionImages.normal,
  };
}

export default function Index() {
  const [current, setCurrent] = useState<any>(null);
  const [hourly48, setHourly48] = useState<any[]>([]);
  const [minutely, setMinutely] = useState<any[]>([]);
  const [latitude, setLatitude] = useState<string>('40.0379');
  const [longitude, setLongitude] = useState<string>('-75.3433');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [cityQuery, setCityQuery] = useState<string>('');

  const [filteredCities, setFilteredCities] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  // Fetch weather from One Call + city name
  const fetchWeather = async (lat?: string, lon?: string) => {
    try {
      const latVal = lat || latitude;
      const lonVal = lon || longitude;

      const oneCallUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${latVal}&lon=${lonVal}&units=imperial&appid=${apiKey}`;
      const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latVal}&lon=${lonVal}&units=imperial&appid=${apiKey}`;

      const [oneCallRes, currentRes] = await Promise.all([
        fetch(oneCallUrl),
        fetch(currentUrl),
      ]);

      const oneCallData = await oneCallRes.json();
      const currentData = await currentRes.json();

      if (oneCallData.current) setCurrent(oneCallData.current);
      else setCurrent(null);

      if (oneCallData.hourly) setHourly48(oneCallData.hourly.slice(0, 48));
      else setHourly48([]);

      if (oneCallData.minutely) setMinutely(oneCallData.minutely);
      else setMinutely([]);

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

  // 🔍 Search by city name (used by input + dropdown)
  const fetchByCityName = async (nameOverride?: string) => {
    const query = (nameOverride ?? cityQuery).trim();
    if (!query) return;

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        query,
      )}&units=imperial&appid=${apiKey}`;

      const res = await fetch(url);
      const data = await res.json();
      console.log('City search response:', data);

      if (data.cod !== 200) {
        setErrorMsg(data.message || 'City not found');
        return;
      }

      const latNum = data.coord.lat;
      const lonNum = data.coord.lon;

      const latStr = latNum.toFixed(5);
      const lonStr = lonNum.toFixed(5);

      setLatitude(latStr);
      setLongitude(lonStr);
      setLocationName(data.name || '');
      setErrorMsg(null);

      setShowDropdown(false);
      setFilteredCities([]);

      await fetchWeather(latStr, lonStr);
    } catch (err) {
      console.error('City search error:', err);
      setErrorMsg('Failed to search by city name.');
    }
  };

  // Handle typing in city search input
  const handleCityChange = (text: string) => {
    setCityQuery(text);

    const trimmed = text.trim();
    if (!trimmed) {
      setFilteredCities([]);
      setShowDropdown(false);
      return;
    }

    const lower = trimmed.toLowerCase();
    const matches = CITY_PRESETS.filter(city =>
      city.toLowerCase().includes(lower),
    ).slice(0, 6);

    setFilteredCities(matches);
    setShowDropdown(matches.length > 0);
  };

  // When user taps on a dropdown suggestion
  const handleCitySelect = (city: string) => {
    setCityQuery(city);
    setShowDropdown(false);
    setFilteredCities([]);
    fetchByCityName(city);
  };

  // Request location on startup
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
  const decision = current ? getGoOutDecision(current) : null;
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
            <Text style={styles.title}>Weather App 🌦️</Text>

            {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}

            {/* Coordinate search */}
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
              <Button title="Get Weather by Coords" onPress={() => fetchWeather()} />
            </View>

            {/* City name search with dropdown */}
            <Text style={styles.label}>Or search by city name:</Text>
            <View style={{ marginBottom: 8 }}>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8, marginBottom: 0 }]}
                  placeholder="e.g. Philadelphia, US"
                  value={cityQuery}
                  onChangeText={handleCityChange}
                  returnKeyType="search"
                  onSubmitEditing={() => fetchByCityName()}
                />
                <Button title="Search" onPress={() => fetchByCityName()} />
              </View>

              {showDropdown && (
                <View style={styles.dropdown}>
                  {filteredCities.map(city => (
                    <TouchableOpacity
                      key={city}
                      style={styles.dropdownItem}
                      onPress={() => handleCitySelect(city)}
                    >
                      <Text style={styles.dropdownText}>{city}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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

                <Text style={styles.temp}>{Math.round(current.temp)}°F</Text>
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

            {/* MAP – right under current weather */}
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
            

            {/* NEXT 60 MIN PRECIPITATION BAR */}
            <Text style={styles.sectionTitle}>☔ Next 60 Minutes</Text>

            <Text style={styles.precipUnitLabel}>
              Rain intensity (mm/hr)
            </Text>

            {/* Time markers */}
            <View style={styles.timeLabels}>
              <Text style={styles.timeLabel}>0</Text>
              <Text style={styles.timeLabel}>15</Text>
              <Text style={styles.timeLabel}>30</Text>
              <Text style={styles.timeLabel}>45</Text>
              <Text style={styles.timeLabel}>60</Text>
            </View>

            <View style={styles.graphContainer}>
              {minutely && minutely.length > 0 ? (
                (() => {
                  const maxPrec = Math.max(...minutely.map(m => m.precipitation || 0));

                  return (
                    <>
                      {/* Bars */}
                      <View style={styles.graphRow}>
                        {minutely.map((m, i) => {
                          const intensity = m.precipitation;
                          const maxHeight = 70;
                          const scaled = Math.min(intensity * 12, maxHeight);
                          const barHeight = Math.max(scaled, 4);

                          return (
                            <View key={i} style={styles.barWrapper}>
                              <View
                                style={[
                                  styles.bar,
                                  {
                                    height: barHeight,
                                    backgroundColor:
                                      intensity === 0
                                        ? '#B3E5FC'
                                        : intensity < 1
                                        ? '#4FC3F7'
                                        : '#0288D1',
                                  },
                                ]}
                              />
                            </View>
                          );
                        })}
                      </View>

                      {/* Summary */}
                      <Text style={styles.graphCaption}>
                        Max intensity in next 60 min: {maxPrec.toFixed(2)} mm/hr
                      </Text>

                      {/* Legend */}
                      <View style={styles.legendRow}>
                        <View style={[styles.legendBox, { backgroundColor: '#B3E5FC' }]} />
                        <Text style={styles.legendText}>Light</Text>

                        <View style={[styles.legendBox, { backgroundColor: '#4FC3F7' }]} />
                        <Text style={styles.legendText}>Moderate</Text>

                        <View style={[styles.legendBox, { backgroundColor: '#0288D1' }]} />
                        <Text style={styles.legendText}>Heavy</Text>
                      </View>
                    </>
                  );
                })()
              ) : (
                <Text style={{ fontSize: 16 }}>No minutely data available</Text>
              )}
            </View>
            {decision && (
              <View style={styles.decisionCard}>
                <Text style={styles.decisionTitle}>Can LeBron go out?</Text>
                <Text style={styles.decisionText}>{decision.text}</Text>
                <Image source={decision.image} style={styles.decisionImage} />
              </View>
            )}

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

                    <Text style={styles.hourTemp}>{Math.round(h.temp)}°</Text>

                    <Text style={styles.hourRain}>
                      {h.pop * 100 > 0
                        ? `${Math.round(h.pop * 100)}% rain`
                        : '—'}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Styles
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
  label: {
    fontSize: 14,
    color: '#0b2e4e',
    marginTop: 12,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
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
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    height: 320,
  },
  map: { flex: 1 },
  dropdown: {
    marginTop: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c7c7c7',
    overflow: 'hidden',
    maxHeight: 180,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: 15,
  },
  precipUnitLabel: {
    fontSize: 14,
    color: '#0B3954',
    marginTop: -5,
    marginBottom: 4,
  },
  timeLabels: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  timeLabel: {
    fontSize: 12,
    color: '#0B3954',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#0B3954',
  },
  decisionCard: {
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  decisionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    color: '#0B3954',
  },
  decisionText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  decisionImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    resizeMode: 'cover',
  },
});
