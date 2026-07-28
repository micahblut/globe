// Converts selected countries into smaller trackable map regions before they
// are handed to the globe renderer. Keeping this transformation separate
// makes it straightforward to add subdivisions for other large countries.
(function (global) {
  const JAPAN_COUNTRY_ID = "392";
  const UNITED_STATES_COUNTRY_ID = "840";
  const CHINA_COUNTRY_ID = "156";
  const INDIA_COUNTRY_ID = "356";
  const BRAZIL_COUNTRY_ID = "076";
  const RUSSIA_COUNTRY_ID = "643";
  const CANADA_COUNTRY_ID = "124";
  const AUSTRALIA_COUNTRY_ID = "036";
  const INDONESIA_COUNTRY_ID = "360";
  const UNITED_KINGDOM_COUNTRY_ID = "826";

  // The boundary asset already contains these eight customary regions,
  // prepared from Japan's 47 prefectures.
  const JAPAN_REGIONS = [
    {
      id: "392-HOKKAIDO",
      name: "Japan — Hokkaido",
      regionName: "Hokkaido",
      regionKey: "HOKKAIDO",
    },
    {
      id: "392-TOHOKU",
      name: "Japan — Tohoku",
      regionName: "Tohoku",
      regionKey: "TOHOKU",
    },
    {
      id: "392-KANTO",
      name: "Japan — Kanto",
      regionName: "Kanto",
      regionKey: "KANTO",
    },
    {
      id: "392-CHUBU",
      name: "Japan — Chubu",
      regionName: "Chubu",
      regionKey: "CHUBU",
    },
    {
      id: "392-KANSAI",
      name: "Japan — Kansai",
      regionName: "Kansai",
      regionKey: "KANSAI",
    },
    {
      id: "392-CHUGOKU",
      name: "Japan — Chugoku",
      regionName: "Chugoku",
      regionKey: "CHUGOKU",
    },
    {
      id: "392-SHIKOKU",
      name: "Japan — Shikoku",
      regionName: "Shikoku",
      regionKey: "SHIKOKU",
    },
    {
      id: "392-KYUSHU-OKINAWA",
      name: "Japan — Kyushu/Okinawa",
      regionName: "Kyushu/Okinawa",
      regionKey: "KYUSHU-OKINAWA",
    },
  ];

  // The first eight US targets are Census Divisions. The official Pacific
  // Division is represented by three tracker targets so Alaska and Hawaii
  // can be watched independently.
  const US_TRACKING_REGIONS = [
    {
      id: "840-NEW-ENGLAND",
      name: "USA — New England",
      regionName: "New England",
      regionKey: "NEW-ENGLAND",
      properties: { censusRegion: "Northeast", censusDivision: "New England" },
    },
    {
      id: "840-MIDDLE-ATLANTIC",
      name: "USA — Middle Atlantic",
      regionName: "Middle Atlantic",
      regionKey: "MIDDLE-ATLANTIC",
      properties: { censusRegion: "Northeast", censusDivision: "Middle Atlantic" },
    },
    {
      id: "840-EAST-NORTH-CENTRAL",
      name: "USA — East North Central",
      regionName: "East North Central",
      regionKey: "EAST-NORTH-CENTRAL",
      properties: { censusRegion: "Midwest", censusDivision: "East North Central" },
    },
    {
      id: "840-WEST-NORTH-CENTRAL",
      name: "USA — West North Central",
      regionName: "West North Central",
      regionKey: "WEST-NORTH-CENTRAL",
      properties: { censusRegion: "Midwest", censusDivision: "West North Central" },
    },
    {
      id: "840-SOUTH-ATLANTIC",
      name: "USA — South Atlantic",
      regionName: "South Atlantic",
      regionKey: "SOUTH-ATLANTIC",
      properties: { censusRegion: "South", censusDivision: "South Atlantic" },
    },
    {
      id: "840-EAST-SOUTH-CENTRAL",
      name: "USA — East South Central",
      regionName: "East South Central",
      regionKey: "EAST-SOUTH-CENTRAL",
      properties: { censusRegion: "South", censusDivision: "East South Central" },
    },
    {
      id: "840-WEST-SOUTH-CENTRAL",
      name: "USA — West South Central",
      regionName: "West South Central",
      regionKey: "WEST-SOUTH-CENTRAL",
      properties: { censusRegion: "South", censusDivision: "West South Central" },
    },
    {
      id: "840-MOUNTAIN",
      name: "USA — Mountain",
      regionName: "Mountain",
      regionKey: "MOUNTAIN",
      properties: { censusRegion: "West", censusDivision: "Mountain" },
    },
    {
      id: "840-PACIFIC-COAST",
      name: "USA — Pacific Coast",
      regionName: "Pacific Coast",
      regionKey: "PACIFIC-COAST",
      properties: { censusRegion: "West", censusDivision: "Pacific" },
    },
    {
      id: "840-ALASKA",
      name: "USA — Alaska",
      regionName: "Alaska",
      regionKey: "ALASKA",
      properties: { censusRegion: "West", censusDivision: "Pacific" },
    },
    {
      id: "840-HAWAII",
      name: "USA — Hawaii",
      regionName: "Hawaii",
      regionKey: "HAWAII",
      properties: { censusRegion: "West", censusDivision: "Pacific" },
    },
  ];

  const US_PACIFIC_TRACKING_REGIONS = US_TRACKING_REGIONS.filter((region) =>
    ["PACIFIC-COAST", "ALASKA", "HAWAII"].includes(region.regionKey)
  );

  const CHINA_REGIONS = [
    {
      id: "156-NORTH",
      name: "China — North China",
      regionName: "North China",
      regionKey: "NORTH",
    },
    {
      id: "156-NORTHEAST",
      name: "China — Northeast China",
      regionName: "Northeast China",
      regionKey: "NORTHEAST",
    },
    {
      id: "156-EAST",
      name: "China — East China",
      regionName: "East China",
      regionKey: "EAST",
    },
    {
      id: "156-SOUTH-CENTRAL",
      name: "China — South Central China",
      regionName: "South Central China",
      regionKey: "SOUTH-CENTRAL",
    },
    {
      id: "156-SOUTHWEST",
      name: "China — Southwest China",
      regionName: "Southwest China",
      regionKey: "SOUTHWEST",
    },
    {
      id: "156-NORTHWEST",
      name: "China — Northwest China",
      regionName: "Northwest China",
      regionKey: "NORTHWEST",
    },
  ];

  // India has five Zonal Councils. Its eight northeastern states are covered
  // by the separate North Eastern Council, included here as a sixth target.
  const INDIA_REGIONS = [
    {
      id: "356-NORTHERN",
      name: "India — Northern Zonal Council",
      regionName: "Northern Zonal Council",
      regionKey: "NORTHERN",
    },
    {
      id: "356-CENTRAL",
      name: "India — Central Zonal Council",
      regionName: "Central Zonal Council",
      regionKey: "CENTRAL",
    },
    {
      id: "356-EASTERN",
      name: "India — Eastern Zonal Council",
      regionName: "Eastern Zonal Council",
      regionKey: "EASTERN",
    },
    {
      id: "356-WESTERN",
      name: "India — Western Zonal Council",
      regionName: "Western Zonal Council",
      regionKey: "WESTERN",
    },
    {
      id: "356-SOUTHERN",
      name: "India — Southern Zonal Council",
      regionName: "Southern Zonal Council",
      regionKey: "SOUTHERN",
    },
    {
      id: "356-NORTH-EASTERN",
      name: "India — North Eastern Council",
      regionName: "North Eastern Council",
      regionKey: "NORTH-EASTERN",
    },
  ];

  const BRAZIL_REGIONS = [
    {
      id: "076-NORTH",
      name: "Brazil — North",
      regionName: "North",
      regionKey: "NORTH",
    },
    {
      id: "076-NORTHEAST",
      name: "Brazil — Northeast",
      regionName: "Northeast",
      regionKey: "NORTHEAST",
    },
    {
      id: "076-CENTRAL-WEST",
      name: "Brazil — Central-West",
      regionName: "Central-West",
      regionKey: "CENTRAL-WEST",
    },
    {
      id: "076-SOUTHEAST",
      name: "Brazil — Southeast",
      regionName: "Southeast",
      regionKey: "SOUTHEAST",
    },
    {
      id: "076-SOUTH",
      name: "Brazil — South",
      regionName: "South",
      regionKey: "SOUTH",
    },
  ];

  const RUSSIA_REGIONS = [
    {
      id: "643-CENTRAL",
      name: "Russia — Central Federal District",
      regionName: "Central Federal District",
      regionKey: "CENTRAL",
    },
    {
      id: "643-NORTHWESTERN",
      name: "Russia — Northwestern Federal District",
      regionName: "Northwestern Federal District",
      regionKey: "NORTHWESTERN",
    },
    {
      id: "643-SOUTHERN",
      name: "Russia — Southern Federal District",
      regionName: "Southern Federal District",
      regionKey: "SOUTHERN",
    },
    {
      id: "643-NORTH-CAUCASIAN",
      name: "Russia — North Caucasian Federal District",
      regionName: "North Caucasian Federal District",
      regionKey: "NORTH-CAUCASIAN",
    },
    {
      id: "643-VOLGA",
      name: "Russia — Volga Federal District",
      regionName: "Volga Federal District",
      regionKey: "VOLGA",
    },
    {
      id: "643-URAL",
      name: "Russia — Ural Federal District",
      regionName: "Ural Federal District",
      regionKey: "URAL",
    },
    {
      id: "643-SIBERIAN",
      name: "Russia — Siberian Federal District",
      regionName: "Siberian Federal District",
      regionKey: "SIBERIAN",
    },
    {
      id: "643-FAR-EASTERN",
      name: "Russia — Far Eastern Federal District",
      regionName: "Far Eastern Federal District",
      regionKey: "FAR-EASTERN",
    },
  ];

  const CANADA_REGIONS = [
    {
      id: "124-ATLANTIC",
      name: "Canada — Atlantic Provinces",
      regionName: "Atlantic Provinces",
      regionKey: "ATLANTIC",
    },
    {
      id: "124-CENTRAL",
      name: "Canada — Central Canada",
      regionName: "Central Canada",
      regionKey: "CENTRAL",
    },
    {
      id: "124-PRAIRIES",
      name: "Canada — Prairie Provinces",
      regionName: "Prairie Provinces",
      regionKey: "PRAIRIES",
    },
    {
      id: "124-WEST-COAST",
      name: "Canada — West Coast",
      regionName: "West Coast",
      regionKey: "WEST-COAST",
    },
    {
      id: "124-NORTHERN",
      name: "Canada — Northern Territories",
      regionName: "Northern Territories",
      regionKey: "NORTHERN",
    },
  ];

  const AUSTRALIA_REGIONS = [
    {
      id: "036-NEW-SOUTH-WALES",
      name: "Australia — New South Wales",
      regionName: "New South Wales",
      regionKey: "NEW-SOUTH-WALES",
    },
    {
      id: "036-VICTORIA",
      name: "Australia — Victoria",
      regionName: "Victoria",
      regionKey: "VICTORIA",
    },
    {
      id: "036-QUEENSLAND",
      name: "Australia — Queensland",
      regionName: "Queensland",
      regionKey: "QUEENSLAND",
    },
    {
      id: "036-SOUTH-AUSTRALIA",
      name: "Australia — South Australia",
      regionName: "South Australia",
      regionKey: "SOUTH-AUSTRALIA",
    },
    {
      id: "036-WESTERN-AUSTRALIA",
      name: "Australia — Western Australia",
      regionName: "Western Australia",
      regionKey: "WESTERN-AUSTRALIA",
    },
    {
      id: "036-TASMANIA",
      name: "Australia — Tasmania",
      regionName: "Tasmania",
      regionKey: "TASMANIA",
    },
    {
      id: "036-NORTHERN-TERRITORY",
      name: "Australia — Northern Territory",
      regionName: "Northern Territory",
      regionKey: "NORTHERN-TERRITORY",
    },
    {
      id: "036-AUSTRALIAN-CAPITAL-TERRITORY",
      name: "Australia — Australian Capital Territory",
      regionName: "Australian Capital Territory",
      regionKey: "AUSTRALIAN-CAPITAL-TERRITORY",
    },
  ];

  const INDONESIA_REGIONS = [
    {
      id: "360-SUMATRA",
      name: "Indonesia — Sumatra",
      regionName: "Sumatra",
      regionKey: "SUMATRA",
    },
    {
      id: "360-JAVA",
      name: "Indonesia — Java",
      regionName: "Java",
      regionKey: "JAVA",
    },
    {
      id: "360-KALIMANTAN",
      name: "Indonesia — Kalimantan",
      regionName: "Kalimantan",
      regionKey: "KALIMANTAN",
    },
    {
      id: "360-SULAWESI",
      name: "Indonesia — Sulawesi",
      regionName: "Sulawesi",
      regionKey: "SULAWESI",
    },
    {
      id: "360-LESSER-SUNDA",
      name: "Indonesia — Lesser Sunda Islands",
      regionName: "Lesser Sunda Islands",
      regionKey: "LESSER-SUNDA",
    },
    {
      id: "360-MALUKU",
      name: "Indonesia — Maluku Islands",
      regionName: "Maluku Islands",
      regionKey: "MALUKU",
    },
    {
      id: "360-PAPUA",
      name: "Indonesia — Papua",
      regionName: "Papua",
      regionKey: "PAPUA",
    },
  ];

  const UNITED_KINGDOM_REGIONS = [
    {
      id: "826-ENGLAND",
      name: "United Kingdom — England",
      regionName: "England",
      regionKey: "ENGLAND",
    },
    {
      id: "826-SCOTLAND",
      name: "United Kingdom — Scotland",
      regionName: "Scotland",
      regionKey: "SCOTLAND",
    },
    {
      id: "826-WALES",
      name: "United Kingdom — Wales",
      regionName: "Wales",
      regionKey: "WALES",
    },
    {
      id: "826-NORTHERN-IRELAND",
      name: "United Kingdom — Northern Ireland",
      regionName: "Northern Ireland",
      regionKey: "NORTHERN-IRELAND",
    },
  ];

  const COUNTRY_SUBDIVISIONS = [
    {
      parentId: JAPAN_COUNTRY_ID,
      topologyKey: "japan",
      countryName: "Japan",
      regions: JAPAN_REGIONS,
    },
    {
      parentId: UNITED_STATES_COUNTRY_ID,
      topologyKey: "unitedStates",
      countryName: "United States of America",
      regions: US_TRACKING_REGIONS,
    },
    {
      parentId: CHINA_COUNTRY_ID,
      topologyKey: "china",
      countryName: "China",
      regions: CHINA_REGIONS,
    },
    {
      parentId: INDIA_COUNTRY_ID,
      topologyKey: "india",
      countryName: "India",
      regions: INDIA_REGIONS,
    },
    {
      parentId: BRAZIL_COUNTRY_ID,
      topologyKey: "brazil",
      countryName: "Brazil",
      regions: BRAZIL_REGIONS,
    },
    {
      parentId: RUSSIA_COUNTRY_ID,
      topologyKey: "russia",
      countryName: "Russia",
      regions: RUSSIA_REGIONS,
    },
    {
      parentId: CANADA_COUNTRY_ID,
      topologyKey: "canada",
      countryName: "Canada",
      regions: CANADA_REGIONS,
    },
    {
      parentId: AUSTRALIA_COUNTRY_ID,
      topologyKey: "australia",
      countryName: "Australia",
      regions: AUSTRALIA_REGIONS,
    },
    {
      parentId: INDONESIA_COUNTRY_ID,
      topologyKey: "indonesia",
      countryName: "Indonesia",
      regions: INDONESIA_REGIONS,
    },
    {
      parentId: UNITED_KINGDOM_COUNTRY_ID,
      topologyKey: "unitedKingdom",
      countryName: "United Kingdom",
      regions: UNITED_KINGDOM_REGIONS,
    },
  ];

  function buildPreparedRegions(topology, definitions, countryName) {
    const regions = topology && topology.objects && topology.objects.regions;
    if (!regions || !Array.isArray(regions.geometries)) {
      throw new Error(
        `${countryName} topology is missing its \`regions\` geometry collection.`
      );
    }

    const sourceFeatures = topojson.feature(topology, regions).features;
    const regionsByKey = new Map(
      sourceFeatures.map((feature) => [
        feature.properties && feature.properties.regionKey,
        feature,
      ])
    );

    return definitions.map((region) => {
      const sourceFeature = regionsByKey.get(region.regionKey);
      if (!sourceFeature) {
        throw new Error(`${countryName} boundary data is missing ${region.regionName}.`);
      }

      return {
        ...sourceFeature,
        id: region.id,
        properties: {
          ...sourceFeature.properties,
          ...(region.properties || {}),
          name: region.name,
          countryName,
          regionName: region.regionName,
        },
      };
    });
  }

  function replaceCountry(countries, parentId, topology, buildRegions, countryName) {
    const countryIndex = countries.findIndex((feature) => String(feature.id) === parentId);
    if (countryIndex === -1 || !topology) return countries;

    try {
      const regions = buildRegions(topology);
      return [
        ...countries.slice(0, countryIndex),
        ...regions,
        ...countries.slice(countryIndex + 1),
      ];
    } catch (err) {
      // A bad optional subdivision asset should not prevent the world map
      // from loading; fall back to the country and expose the issue.
      console.error(
        `Could not create ${countryName} regions; using the country boundary instead.`,
        err
      );
      return countries;
    }
  }

  function applyCountrySubdivisions(countries, topologies) {
    const availableTopologies = topologies || {};
    return COUNTRY_SUBDIVISIONS.reduce(
      (places, subdivision) =>
        replaceCountry(
          places,
          subdivision.parentId,
          availableTopologies[subdivision.topologyKey],
          (topology) =>
            buildPreparedRegions(
              topology,
              subdivision.regions,
              subdivision.countryName
            ),
          subdivision.countryName
        ),
      countries
    );
  }

  function migrateLegacyWatchedIds(watchedIds, places) {
    const renderedIds = new Set((places || []).map((place) => String(place.id)));
    const subdivisions = [
      ...COUNTRY_SUBDIVISIONS.map(({ parentId, regions }) => ({
        parentId,
        regions,
      })),
      { parentId: "840-PACIFIC", regions: US_PACIFIC_TRACKING_REGIONS },
    ];
    let changed = false;

    subdivisions.forEach(({ parentId, regions }) => {
      const subdivisionIsActive = regions.every((region) => renderedIds.has(region.id));
      if (!subdivisionIsActive || !watchedIds.has(parentId)) return;

      // A completed parent country stays completed when it gains children.
      // Users can then unmark individual regions if they want finer history.
      watchedIds.delete(parentId);
      regions.forEach((region) => watchedIds.add(region.id));
      changed = true;
    });

    return changed;
  }

  global.MapRegions = {
    applyCountrySubdivisions,
    migrateLegacyWatchedIds,
  };
})(window);
