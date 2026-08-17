import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polygon, MapPressEvent, UserLocationChangeEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  ZONE_POLYGONS,
  detectZone,
  getInitialRegion,
  filterEnabledZones,
  ZoneInfo,
  STORE_LOCATION,
} from '../../utils/deliveryZones';
import { fetchDeliveryZones, DeliveryZones } from '../../services/storeService';
import { searchAddress, reverseGeocode, GeocodingResult } from '../../utils/geocoding';
import Theme from '../../theme';

const INITIAL_REGION = getInitialRegion();

interface AddressDetails {
  address: string;
  houseNumber?: string;
  city?: string;
}

interface MapZonePickerProps {
  onZoneDetected: (zone: ZoneInfo | null) => void;
  selectedLocation: { latitude: number; longitude: number } | null;
  onLocationChange: (lat: number, lng: number) => void;
  onMapTouchActive?: (active: boolean) => void;
  onAddressSelected?: (details: AddressDetails) => void;
}

export default function MapZonePicker({
  onZoneDetected,
  selectedLocation,
  onLocationChange,
  onMapTouchActive,
  onAddressSelected,
}: MapZonePickerProps) {
  console.log('[MapZonePicker] render');
  const mapRef = useRef<MapView>(null);
  const releaseTouchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [locating, setLocating] = useState(false);
  const [enabledZones, setEnabledZones] = useState<DeliveryZones>({
    zone1: true,
    zone2: true,
    zone3: true,
  });
  const userLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapReadyRef = useRef(false);
  const mapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    console.log('[MapZonePicker] mount effect');
    mapTimeoutRef.current = setTimeout(() => {
      if (!mapReadyRef.current) {
        console.log('[MapZonePicker] map timeout - not ready after 10s');
        setMapError(true);
      }
    }, 10000);
    return () => {
      console.log('[MapZonePicker] unmount effect');
      if (mapTimeoutRef.current) clearTimeout(mapTimeoutRef.current);
    };
  }, []);

  const handleMapReady = useCallback(() => {
    console.log('[MapZonePicker] MapView onMapReady fired');
    mapReadyRef.current = true;
    setMapReady(true);
    setMapError(false);
    if (mapTimeoutRef.current) {
      clearTimeout(mapTimeoutRef.current);
      mapTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    console.log('[MapZonePicker] fetchDeliveryZones');
    fetchDeliveryZones().then((z) => {
      console.log('[MapZonePicker] zones loaded:', z);
      setEnabledZones(z);
    }).catch((e) => console.error('[MapZonePicker] fetchDeliveryZones error:', e));
  }, []);

  useEffect(() => {
    return () => {
      if (releaseTouchTimerRef.current) {
        clearTimeout(releaseTouchTimerRef.current);
      }
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
      onMapTouchActive?.(false);
    };
  }, [onMapTouchActive]);

  useEffect(() => {
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    const q = searchQuery.trim();
    if (q.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      const results = await searchAddress(q);
      setSearchResults(results);
      setShowResults(results.length > 0);
      setSearching(false);
    }, 300);

    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, [searchQuery]);

  const setMapTouchActive = useCallback((active: boolean) => {
    if (releaseTouchTimerRef.current) {
      clearTimeout(releaseTouchTimerRef.current);
      releaseTouchTimerRef.current = null;
    }

    onMapTouchActive?.(active);

    if (active) {
      releaseTouchTimerRef.current = setTimeout(() => {
        onMapTouchActive?.(false);
        releaseTouchTimerRef.current = null;
      }, 1200);
    }
  }, [onMapTouchActive]);

  const visiblePolygons = filterEnabledZones(enabledZones);

  const selectLocation = (lat: number, lng: number) => {
    console.log('[MapZonePicker] selectLocation:', lat, lng);
    onLocationChange(lat, lng);
    const zone = detectZone(lat, lng);
    console.log('[MapZonePicker] detected zone:', zone);
    if (zone) {
      const key = zone.id as keyof DeliveryZones;
      if (!enabledZones[key]) {
        console.log('[MapZonePicker] zone disabled:', key);
        onZoneDetected(null);
        return zone;
      }
    }
    onZoneDetected(zone);
    return zone;
  };

  const handleMapPress = async (event: MapPressEvent) => {
    console.log('[MapZonePicker] MapView onPress fired');
    try {
      const { coordinate } = event.nativeEvent;
      selectLocation(coordinate.latitude, coordinate.longitude);
      if (onAddressSelected) {
        const result = await reverseGeocode(coordinate.latitude, coordinate.longitude);
        if (result) {
          onAddressSelected({
            address: result.address || result.placeName || '',
            houseNumber: result.houseNumber,
            city: result.city || 'Catania',
          });
        }
      }
    } catch (e) {
      console.error('[MapZonePicker] handleMapPress error:', e);
    }
  };

  const handleUserLocationChange = useCallback((event: UserLocationChangeEvent) => {
    const coords = event.nativeEvent?.coordinate;
    if (coords) {
      userLocationRef.current = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    }
  }, []);

  const locateAndAnimate = (loc: { latitude: number; longitude: number }) => {
    selectLocation(loc.latitude, loc.longitude);
    mapRef.current?.animateCamera({
      center: { latitude: loc.latitude, longitude: loc.longitude },
      zoom: 14,
    }, { duration: 500 });
  };

  const handleCurrentLocation = async () => {
    setLocating(true);
    const cached = userLocationRef.current;
    if (cached) {
      locateAndAnimate(cached);
      await reverseGeocodeAndNotify(cached.latitude, cached.longitude);
      setLocating(false);
      return;
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to use current location.');
        setLocating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      userLocationRef.current = coords;
      locateAndAnimate(coords);
      await reverseGeocodeAndNotify(coords.latitude, coords.longitude);
    } catch {
      Alert.alert('Error', 'Failed to get current location. Please try again or tap the map.');
    } finally {
      setLocating(false);
    }
  };

  const reverseGeocodeAndNotify = async (lat: number, lng: number) => {
    if (!onAddressSelected) return;
    const result = await reverseGeocode(lat, lng);
    if (result) {
      onAddressSelected({
        address: result.address || result.placeName || '',
        houseNumber: result.houseNumber,
        city: result.city || 'Catania',
      });
    }
  };

  const handleSearchSelect = (result: GeocodingResult) => {
    setSearchQuery(result.placeName.split(',')[0] || result.placeName);
    setShowResults(false);
    selectLocation(result.latitude, result.longitude);
    mapRef.current?.animateCamera({
      center: { latitude: result.latitude, longitude: result.longitude },
      zoom: 16,
    }, { duration: 500 });
    if (onAddressSelected) {
      onAddressSelected({
        address: result.address || result.placeName || '',
        houseNumber: result.houseNumber,
        city: result.city || 'Catania',
      });
    }
  };

  const renderSearchItem = ({ item }: { item: GeocodingResult }) => (
    <TouchableOpacity
      style={styles.searchItem}
      onPress={() => handleSearchSelect(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.searchItemTitle} numberOfLines={2}>
        {item.address || item.placeName}
      </Text>
      <Text style={styles.searchItemSubtitle} numberOfLines={1}>
        {item.city || ''}
      </Text>
    </TouchableOpacity>
  );

  console.log('[MapZonePicker] rendering JSX, mapReady:', mapReady, 'mapError:', mapError);

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputRow}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={(v) => {
              setSearchQuery(v);
              if (!v.trim()) setShowResults(false);
            }}
            placeholder="Search address..."
            placeholderTextColor={Theme.colors.textDisabled}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searching && (
            <Text style={styles.searchSpinner}>⏳</Text>
          )}
          {searchQuery.length > 0 && !searching && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowResults(false);
              }}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {showResults && searchResults.length > 0 && (
          <View style={styles.resultsDropdown}>
            <FlatList
              data={searchResults}
              renderItem={renderSearchItem}
              keyExtractor={(item) => `${item.latitude}-${item.longitude}-${item.placeName}`}
              keyboardShouldPersistTaps="handled"
              style={styles.resultsList}
              nestedScrollEnabled
            />
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.locateButton, locating && styles.locateButtonDisabled]}
        onPress={handleCurrentLocation}
        disabled={locating}
        activeOpacity={0.8}
      >
        <Text style={styles.locateIcon}>{locating ? '⏳' : '📍'}</Text>
        <Text style={styles.locateText}>
          {locating ? 'Locating...' : 'Use current location'}
        </Text>
      </TouchableOpacity>

      <View style={styles.container}>
        {!mapReady && !mapError && (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color={Theme.colors.primary} />
            <Text style={styles.mapPlaceholderText}>Loading map...</Text>
          </View>
        )}
        {mapError && (
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapErrorIcon}>⚠️</Text>
            <Text style={styles.mapPlaceholderText}>Unable to load map</Text>
            <Text style={styles.mapErrorDesc}>
              Check your internet connection and Google Maps API configuration.
            </Text>
            <TouchableOpacity
              style={styles.mapRetryBtn}
              onPress={() => {
                mapReadyRef.current = false;
                setMapReady(false);
                setMapError(false);
                mapTimeoutRef.current = setTimeout(() => {
                  if (!mapReadyRef.current) setMapError(true);
                }, 10000);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.mapRetryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={INITIAL_REGION}
          onPress={handleMapPress}
          showsUserLocation={false}
          showsMyLocationButton={false}
          onUserLocationChange={handleUserLocationChange}
          onPanDrag={() => setMapTouchActive(true)}
          toolbarEnabled={false}
          moveOnMarkerPress={false}
          onMapReady={handleMapReady}
        >
          {visiblePolygons.map((zone) => (
            <Polygon
              key={zone.id}
              coordinates={zone.coordinates}
              fillColor={'rgba(34,197,94,0.15)'}
              strokeColor={'#22c55e'}
              strokeWidth={0}
              tappable={false}
            />
          ))}

          <Marker
            coordinate={STORE_LOCATION}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.storeMarker} />
          </Marker>

          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.selectedMarker} />
            </Marker>
          )}
        </MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Theme.spacing.sm,
  },
  searchContainer: {
    position: 'relative',
    zIndex: 10,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadii.md,
    backgroundColor: Theme.colors.surface,
    minHeight: 48,
    paddingHorizontal: Theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: Theme.fontSizes.md,
    color: Theme.colors.text,
    paddingVertical: Theme.spacing.sm,
  },
  searchSpinner: {
    fontSize: 16,
    marginLeft: Theme.spacing.xs,
  },
  clearBtn: {
    padding: Theme.spacing.xs,
    marginLeft: Theme.spacing.xs,
  },
  clearBtnText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  resultsDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadii.md,
    marginTop: Theme.spacing.xs,
    maxHeight: 200,
    ...Theme.shadows.md,
  },
  resultsList: {
    maxHeight: 198,
  },
  searchItem: {
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.border,
  },
  searchItemTitle: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.medium,
    color: Theme.colors.text,
  },
  searchItemSubtitle: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  locateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadii.lg,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderWidth: 1.5,
    borderColor: Theme.colors.primary,
    minHeight: 44,
  },
  locateButtonDisabled: {
    opacity: 0.6,
  },
  locateIcon: {
    fontSize: 16,
  },
  locateText: {
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
    color: Theme.colors.primary,
  },
  container: {
    height: 280,
    borderRadius: Theme.borderRadii.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Theme.colors.border,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.surface,
    gap: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.lg,
    zIndex: 1,
  },
  mapPlaceholderText: {
    fontSize: Theme.fontSizes.sm,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeights.medium,
    fontFamily: Theme.fontFamily.medium,
  },
  mapErrorIcon: {
    fontSize: 32,
  },
  mapErrorDesc: {
    fontSize: Theme.fontSizes.xs,
    color: Theme.colors.textDisabled,
    textAlign: 'center',
    lineHeight: 18,
  },
  mapRetryBtn: {
    marginTop: Theme.spacing.sm,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadii.md,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.lg,
  },
  mapRetryBtnText: {
    color: Theme.colors.textInverse,
    fontSize: Theme.fontSizes.sm,
    fontWeight: Theme.fontWeights.semiBold,
    fontFamily: Theme.fontFamily.semiBold,
  },
  storeMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Theme.colors.primary,
    borderWidth: 2,
    borderColor: '#fff',
  },
  selectedMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
});
