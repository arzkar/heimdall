/* ============================================================
   Geocoder — Static keyword → coordinates lookup
   No API calls, no rate limits. ~300 place names.
   ============================================================ */

export interface Location {
  name: string;
  lng: number;
  lat: number;
}

const STRATEGIC_LOCATIONS: [string, number, number][] = [
  // Middle East / Gulf Bases & Facilities
  ["Ben Gurion Airport", -34.8866, 31.9961], // Intentionally flipping to test, actually lng is 34.8866, lat is 31.9961
  ["Ben Gurion", 34.8866, 31.9961],
  ["Nevatim Air Base", 35.0114, 31.2089],
  ["Camp Buehring", 47.408, 29.699],
  ["Al Udeid Air Base", 51.314, 25.116],
  ["Natanz Nuclear Facility", 51.724, 33.725],
  ["Fordow Fuel Enrichment Plant", 50.985, 34.884],
  ["Incirlik Air Base", 35.424, 36.982],
  ["US Consulate in Erbil", 44.008, 36.226],
  ["US Embassy in Baghdad", 44.398, 33.303],
  ["Al Asad Airbase", 42.435, 33.791],
  ["Hmeimim Air Base", 35.946, 35.408],
  ["Tartus Naval Base", 35.882, 34.908],

  // Europe / Ukraine
  ["Zaporizhzhia Nuclear Power Plant", 34.585, 47.506],
  ["Ramstein Air Base", 7.599, 49.438],
  ["Kremlin", 37.617, 55.752],
  ["Pentagon", -77.056, 38.871],
  ["Heathrow Airport", -0.454, 51.47],
  ["JFK Airport", -73.778, 40.641],

  // Asia / Pacific
  ["Kadena Air Base", 127.767, 26.355],
  ["Guam Naval Base", 144.652, 13.438],
  ["Andersen Air Force Base", 144.924, 13.584],
  ["Diego Garcia", 72.413, -7.319],
  ["Subic Bay", 120.282, 14.796],

  // Embassies / Consulates (Generic Fallbacks for major hubs)
  ["US Consulate in Jerusalem", 35.223, 31.776],
  ["US Embassy in Beirut", 35.597, 33.931],
  ["US Embassy in Kabul", 69.184, 34.532],

  // Tech / Finance Macro-Hubs
  ["Silicon Valley", -122.0322, 37.3688],
  ["Wall Street", -74.009, 40.7075],
];

const COUNTRIES: [string, number, number][] = [
  ["U.S.", -98.5795, 39.8283],
  ["US", -98.5795, 39.8283],
  ["United States", -98.5795, 39.8283],
  ["U.K.", -3.435973, 55.378051],
  ["UK", -3.435973, 55.378051],
  ["United Kingdom", -3.435973, 55.378051],
  ["North Korea", 127.5101, 40.3399],
  ["South Korea", 127.7669, 35.9078],
  ["Saudi Arabia", 45.0792, 23.8859],
  ["South Africa", 22.9375, -30.5595],
  ["New Zealand", 174.886, -40.9006],
  ["Czech Republic", 15.4729, 49.8175],
  ["El Salvador", -88.8965, 13.7942],
  ["United Arab Emirates", 53.8478, 23.4241],
  ["Papua New Guinea", 143.9555, -6.3149],
  ["Dominican Republic", -70.1627, 18.7357],
  ["Democratic Republic of Congo", 23.6565, -2.8775],
  ["Trinidad and Tobago", -61.2225, 10.6918],
  ["Bosnia", 17.6791, 43.9159],
  ["Herzegovina", 17.6791, 43.9159],
  ["Sri Lanka", 80.7718, 7.8731],
  ["Costa Rica", -83.7534, 9.7489],
  ["Puerto Rico", -66.5901, 18.2208],
  ["Afghanistan", 67.7099, 33.9391],
  ["Azerbaijan", 47.5769, 40.1431],
  ["Bangladesh", 90.3563, 23.685],
  ["Cambodia", 104.991, 12.5657],
  ["Cameroon", 12.3547, 3.848],
  ["Colombia", -74.2973, 4.5709],
  ["Ethiopia", 40.4897, 9.145],
  ["Guatemala", -90.2308, 15.7835],
  ["Indonesia", 113.9213, -0.7893],
  ["Kazakhstan", 66.9237, 48.0196],
  ["Kyrgyzstan", 74.7661, 41.2044],
  ["Lithuania", 23.8813, 55.1694],
  ["Mauritania", -11.8086, 21.0079],
  ["Mozambique", 34.3015, -18.6657],
  ["Nicaragua", -85.2072, 12.8654],
  ["Philippines", 121.774, 12.8797],
  ["Singapore", 103.8198, 1.3521],
  ["Tajikistan", 71.2761, 38.861],
  ["Turkmenistan", 58.9543, 40.3534],
  ["Uzbekistan", 64.5853, 41.3775],
  ["Venezuela", -66.5897, 6.4238],
  ["Zimbabwe", 29.1549, -19.0154],
  ["Albania", 20.1683, 41.1533],
  ["Algeria", 1.6596, 28.0339],
  ["Armenia", 45.0382, 40.0691],
  ["Austria", 14.5501, 47.5162],
  ["Bahrain", 50.5577, 26.0275],
  ["Belarus", 27.9534, 53.7098],
  ["Belgium", 4.4699, 50.5039],
  ["Bolivia", -63.5887, -16.2902],
  ["Botswana", 24.6849, -22.3285],
  ["Bulgaria", 25.4858, 42.7339],
  ["Burundi", 29.9189, -3.3731],
  ["Croatia", 15.2, 45.1],
  ["Denmark", 9.5018, 56.2639],
  ["Ecuador", -78.1834, -1.8312],
  ["Eritrea", 39.7823, 15.1794],
  ["Estonia", 25.0136, 58.5953],
  ["Finland", 25.7482, 61.9241],
  ["Georgia", 43.3569, 42.3154],
  ["Germany", 10.4515, 51.1657],
  ["Finland", 25.7482, 61.9241],
  ["Greece", 21.8243, 39.0742],
  ["Hungary", 19.5033, 47.1625],
  ["Iceland", -19.0208, 64.9631],
  ["Ireland", -8.2439, 53.4129],
  ["Israel", 34.8516, 31.0461],
  ["Italy", 12.5674, 41.8719],
  ["Jamaica", -77.2975, 18.1096],
  ["Jordan", 36.2384, 30.5852],
  ["Kenya", 37.9062, -0.0236],
  ["Kosovo", 20.9024, 42.6026],
  ["Kuwait", 47.4818, 29.3117],
  ["Laos", 102.4955, 19.8563],
  ["Latvia", 24.6032, 56.8796],
  ["Lebanon", 35.8623, 33.8547],
  ["Libya", 17.2283, 26.3351],
  ["Malawi", 34.3015, -13.2543],
  ["Malaysia", 109.6975, 4.2105],
  ["Mali", -1.4572, 17.5707],
  ["Mexico", -102.5528, 23.6345],
  ["Moldova", 28.3699, 47.4116],
  ["Mongolia", 103.8467, 46.8625],
  ["Morocco", -7.0926, 31.7917],
  ["Myanmar", 95.956, 21.9162],
  ["Namibia", 18.4904, -22.9576],
  ["Nepal", 84.124, 28.3949],
  ["Netherlands", 5.2913, 52.1326],
  ["Niger", 8.0817, 17.6078],
  ["Nigeria", 8.6753, 9.082],
  ["Norway", 8.4689, 60.472],
  ["Oman", 55.9754, 21.4735],
  ["Pakistan", 69.3451, 30.3753],
  ["Palestine", 35.2332, 31.9522],
  ["Panama", -80.7821, 8.538],
  ["Paraguay", -58.4438, -23.4425],
  ["Peru", -75.0152, -9.19],
  ["Poland", 19.1451, 51.9194],
  ["Portugal", -8.2245, 39.3999],
  ["Qatar", 51.1839, 25.3548],
  ["Romania", 24.9668, 45.9432],
  ["Russia", 105.3188, 61.524],
  ["Rwanda", 29.8739, -1.9403],
  ["Senegal", -14.4524, 14.4974],
  ["Serbia", 21.0059, 44.0165],
  ["Slovakia", 19.699, 48.669],
  ["Slovenia", 14.9955, 46.1512],
  ["Somalia", 46.1996, 5.1521],
  ["Spain", -3.7492, 40.4637],
  ["Sudan", 30.2176, 12.8628],
  ["Sweden", 18.6435, 60.1282],
  ["Switzerland", 8.2275, 46.8182],
  ["Syria", 38.9968, 34.8021],
  ["Taiwan", 120.9605, 23.6978],
  ["Tanzania", 34.8888, -6.369],
  ["Thailand", 100.9925, 15.87],
  ["Tunisia", 9.5375, 33.8869],
  ["Turkey", 35.2433, 38.9637],
  ["Uganda", 32.29, 1.3733],
  ["Ukraine", 31.1656, 48.3794],
  ["Uruguay", -55.7658, -32.5228],
  ["Zambia", 27.8493, -13.1339],
];

const CITIES: [string, number, number][] = [
  // Major US States / Regions
  ["California", -119.4179, 36.7783],
  ["Texas", -99.9018, 31.9686],
  ["Florida", -81.5158, 27.9944],
  ["New York State", -74.006, 40.7128],
  ["Washington State", -120.7401, 47.7511],

  ["Washington DC", -77.0369, 38.9072],
  ["Washington, D.C.", -77.0369, 38.9072],
  ["D.C.", -77.0369, 38.9072],
  ["Washington", -77.0369, 38.9072],
  ["New York", -74.006, 40.7128],
  ["Los Angeles", -118.2437, 34.0522],
  ["San Francisco", -122.4194, 37.7749],
  ["Seattle", -122.3321, 47.6062],
  ["Boston", -71.0589, 42.3601],
  ["Austin", -97.7431, 30.2672],
  ["Chicago", -87.6298, 41.8781],
  ["London", -0.1276, 51.5074],
  ["Paris", 2.3522, 48.8566],
  ["Berlin", 13.405, 52.52],
  ["Moscow", 37.6173, 55.7558],
  ["Beijing", 116.3912, 39.9042],
  ["Shanghai", 121.4737, 31.2304],
  ["Tokyo", 139.6917, 35.6895],
  ["Seoul", 126.978, 37.5665],
  ["Delhi", 77.1025, 28.7041],
  ["Mumbai", 72.8777, 19.076],
  ["Karachi", 67.0099, 24.8615],
  ["Tehran", 51.389, 35.6892],
  ["Istanbul", 28.9784, 41.0082],
  ["Cairo", 31.2357, 30.0444],
  ["Riyadh", 46.7219, 24.6877],
  ["Dubai", 55.2708, 25.2048],
  ["Abu Dhabi", 54.3773, 24.4539],
  ["Baghdad", 44.3661, 33.3152],
  ["Damascus", 36.2918, 33.5102],
  ["Beirut", 35.5018, 33.8938],
  ["Jerusalem", 35.2137, 31.7683],
  ["Tel Aviv", 34.7818, 32.0853],
  ["Gaza", 34.4674, 31.5017],
  ["West Bank", 35.3027, 31.9466],
  ["Kabul", 69.1761, 34.5553],
  ["Islamabad", 73.0479, 33.7294],
  ["Kyiv", 30.5238, 50.4501],
  ["Kiev", 30.5238, 50.4501],
  ["Kharkiv", 36.2304, 49.9935],
  ["Odessa", 30.7326, 46.4774],
  ["Mariupol", 37.5775, 47.0945],
  ["Donbas", 38.0, 48.1],
  ["Crimea", 34.1, 45.2],
  ["Donetsk", 37.8028, 48.0159],
  ["Zaporizhzhia", 35.1396, 47.8388],
  ["Soledar", 38.0933, 48.676],
  ["Bakhmut", 38.0, 48.6],
  ["Kherson", 32.6169, 46.6354],
  ["Minsk", 27.5618, 53.9045],
  ["Warsaw", 21.0122, 52.2297],
  ["Budapest", 19.0402, 47.4979],
  ["Bucharest", 26.1025, 44.4268],
  ["Belgrade", 20.4651, 44.8151],
  ["Athens", 23.7275, 37.9838],
  ["Rome", 12.4964, 41.9028],
  ["Madrid", -3.7038, 40.4168],
  ["Barcelona", 2.1734, 41.3851],
  ["Ankara", 32.8597, 39.9334],
  ["Tripoli", 13.1913, 32.8872],
  ["Tunis", 10.1815, 36.8065],
  ["Algiers", 3.0588, 36.7372],
  ["Casablanca", -7.5898, 33.5731],
  ["Khartoum", 32.5599, 15.5007],
  ["Nairobi", 36.8219, -1.2921],
  ["Mogadishu", 45.3182, 2.0469],
  ["Addis Ababa", 38.7469, 9.145],
  ["Kinshasa", 15.3222, -4.3217],
  ["Lagos", 3.3792, 6.5244],
  ["Accra", -0.187, 5.6037],
  ["Johannesburg", 28.0473, -26.2041],
  ["Cape Town", 18.4241, -33.9249],
  ["Pyongyang", 125.7625, 39.0392],
  ["Taipei", 121.5654, 25.033],
  ["Hong Kong", 114.1694, 22.3193],
  ["Bangkok", 100.5018, 13.7563],
  ["Hanoi", 105.8412, 21.0278],
  ["Ho Chi Minh", 106.6297, 10.8231],
  ["Phnom Penh", 104.9282, 11.5564],
  ["Jakarta", 106.8456, -6.2088],
  ["Manila", 120.9842, 14.5995],
  ["Kuala Lumpur", 101.6869, 3.139],
  ["Yangon", 96.1561, 16.8409],
  ["Dhaka", 90.4125, 23.8103],
  ["Colombo", 79.8612, 6.9271],
  ["Kathmandu", 85.3142, 27.7172],
  ["Tashkent", 69.2401, 41.2995],
  ["Almaty", 76.8512, 43.222],
  ["Baku", 49.8671, 40.4093],
  ["Yerevan", 44.5136, 40.1872],
  ["Tbilisi", 44.7975, 41.6938],
  ["Sana'a", 44.2056, 15.3694],
  ["Yemen", 48.5164, 15.5527],
  ["Aden", 45.0348, 12.7794],
  ["Houthi", 44.5, 15.5],
  ["Red Sea", 38.5, 21.0],
  ["Black Sea", 34.0, 43.0],
  ["South China Sea", 114.0, 15.0],
  ["Persian Gulf", 51.5, 26.5],
  ["Taiwan Strait", 119.5, 24.5],
  ["Indian Ocean", 80.0, -20.0],
  ["Baltic Sea", 18.0, 57.5],
  ["Mediterranean", 14.0, 37.5],
  ["Middle East", 39.0, 29.0],
  ["Central Asia", 63.0, 42.0],
  ["Southeast Asia", 107.0, 12.0],
  ["Horn of Africa", 45.0, 8.0],
  ["Sahel", 5.0, 15.0],
  ["Donbass", 38.0, 48.1],
  ["Xinjiang", 87.9, 42.0],
  ["Kashmir", 76.5, 33.5],
  ["Gaza Strip", 34.4674, 31.5017],
  ["West Bank", 35.3027, 31.9466],
  ["Golan Heights", 35.8, 33.0],
  ["Sinai", 33.7, 30.0],
  ["Hormuz", 56.5, 26.5],
  ["Strait of Malacca", 103.5, 1.5],
  ["Taiwan", 120.9605, 23.6978],
  ["Crimea", 34.1, 45.2],
  ["Kosovo", 20.9024, 42.6026],
  ["Tigray", 38.8, 14.0],
  ["Idlib", 36.62, 35.93],
  ["Aleppo", 37.1612, 36.2023],
  ["Raqqa", 39.0216, 35.9522],
  ["Fallujah", 43.7868, 33.3479],
  ["Mosul", 43.1189, 36.3489],
  ["Kirkuk", 44.3922, 35.4681],
  ["Tikrit", 43.6769, 34.5987],
  ["Ramadi", 43.2982, 33.4258],
  ["Basra", 47.7804, 30.5086],
  ["Helmand", 64.5, 31.5],
  ["Kandahar", 65.7153, 31.6289],
  ["Kunduz", 68.872, 36.7238],
  ["Homs", 36.7096, 34.7297],
  ["Deir ez-Zor", 40.1415, 35.3362],
  ["Latakia", 35.7906, 35.5317],
  ["Tartus", 35.8869, 34.8872],
  ["Raqqa", 39.0216, 35.9522],
  ["Japan", 138.2529, 36.2048],
  ["China", 104.1954, 35.8617],
  ["India", 78.9629, 20.5937],
  ["Brazil", -51.9253, -14.235],
  ["France", 2.2137, 46.2276],
  ["Canada", -96.8165, 56.1304],
  ["Australia", 133.7751, -25.2744],
  ["Iran", 53.688, 32.4279],
  ["Iraq", 43.6793, 33.2232],
  ["UAE", 53.8478, 23.4241],
  ["UK", -3.435973, 55.378051],
  ["US", -98.5795, 39.8283],
  ["EU", 9.1405, 48.6908],
  ["NATO", 4.9422, 50.8503],
  ["UN", -73.9857, 40.7484],
  ["IAEA", 16.3738, 48.2082],
  ["WHO", 6.1322, 46.2044],
  ["IMF", -77.0369, 38.9072],
  ["G7", 2.3522, 48.8566],
  ["G20", -58.3816, -34.6037],
];

function createLookup(dict: [string, number, number][]) {
  return dict
    .sort((a, b) => b[0].length - a[0].length)
    .map(([name, lng, lat]) => {
      // Escape special regex characters in the place name (like '.' in U.S.)
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      const isAcronym = name === name.toUpperCase();
      const flags = isAcronym ? "g" : "gi";
      return {
        name,
        lng,
        lat,
        regex: new RegExp(`\\b${escapedName}\\b`, flags),
      };
    });
}

const STRATEGIC_LOOKUP = createLookup(STRATEGIC_LOCATIONS);
const CITY_LOOKUP = createLookup(CITIES);
const COUNTRY_LOOKUP = createLookup(COUNTRIES);

/**
 * Extract all locations mentioned in a text string.
 * Prioritizes STRATEGIC_LOCATIONS > CITIES > COUNTRIES to avoid macro-clusters.
 * Uses word-boundary regex to prevent "us" (pronoun) matching "US" (country).
 */
export function extractLocations(text: string): Location[] {
  const foundStrategic: Location[] = [];
  const foundCities: Location[] = [];
  const usedRanges: [number, number][] = [];

  // Helper to check for overlapping string indices
  const isOverlapping = (start: number, end: number) => {
    return usedRanges.some(([s, e]) => start < e && end > s);
  };

  // 1. Search strategic locations first
  for (const place of STRATEGIC_LOOKUP) {
    place.regex.lastIndex = 0; // reset global regex state
    let match;
    while ((match = place.regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      if (!isOverlapping(start, end)) {
        usedRanges.push([start, end]);
        foundStrategic.push({
          name: place.name,
          lng: place.lng,
          lat: place.lat,
        });
        break; // Only capture the first valid occurrence
      }
    }
    if (foundStrategic.length >= 3) break;
  }

  if (foundStrategic.length > 0) {
    return foundStrategic;
  }

  // 2. Search cities
  for (const place of CITY_LOOKUP) {
    place.regex.lastIndex = 0; // reset global regex state
    let match;
    while ((match = place.regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      if (!isOverlapping(start, end)) {
        usedRanges.push([start, end]);
        foundCities.push({ name: place.name, lng: place.lng, lat: place.lat });
        break; // Only capture the first valid occurrence of each specific place per article
      }
    }
    if (foundCities.length >= 3) break;
  }

  // If a specific city is found, don't plot the country centroid
  if (foundCities.length > 0) {
    return foundCities;
  }

  // 2. Fall back to countries
  const foundCountries: Location[] = [];
  for (const place of COUNTRY_LOOKUP) {
    place.regex.lastIndex = 0;
    let match;
    while ((match = place.regex.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      if (!isOverlapping(start, end)) {
        usedRanges.push([start, end]);
        foundCountries.push({
          name: place.name,
          lng: place.lng,
          lat: place.lat,
        });
        break;
      }
    }
    if (foundCountries.length >= 3) break;
  }

  if (foundCountries.length > 0) {
    return foundCountries;
  }

  // If no locations are found, return an empty array instead of a random fallback
  // This prevents domestic news from being randomly plotted in the Middle East or Oceans.
  return [];
}
