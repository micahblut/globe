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

  // A region's id and display name are always derived the same way, so
  // callers only ever supply the two things that actually vary: the
  // region's own key/name and (rarely) extra properties to carry through.
  function regionFactory(countryId, countryName) {
    return function (regionKey, regionName, extraProperties) {
      return {
        id: `${countryId}-${regionKey}`,
        name: `${countryName} — ${regionName}`,
        regionName,
        regionKey,
        properties: extraProperties,
      };
    };
  }

  // The boundary asset already contains these eight customary regions,
  // prepared from Japan's 47 prefectures.
  const japanRegion = regionFactory(JAPAN_COUNTRY_ID, "Japan");
  const JAPAN_REGIONS = [
    japanRegion("HOKKAIDO", "Hokkaido"),
    japanRegion("TOHOKU", "Tohoku"),
    japanRegion("KANTO", "Kanto"),
    japanRegion("CHUBU", "Chubu"),
    japanRegion("KANSAI", "Kansai"),
    japanRegion("CHUGOKU", "Chugoku"),
    japanRegion("SHIKOKU", "Shikoku"),
    japanRegion("KYUSHU-OKINAWA", "Kyushu/Okinawa"),
  ];

  // The first eight US targets are Census Divisions. The official Pacific
  // Division is represented by three tracker targets so Alaska and Hawaii
  // can be watched independently.
  const usRegion = regionFactory(UNITED_STATES_COUNTRY_ID, "USA");
  const US_TRACKING_REGIONS = [
    usRegion("NEW-ENGLAND", "New England", {
      censusRegion: "Northeast",
      censusDivision: "New England",
    }),
    usRegion("MIDDLE-ATLANTIC", "Middle Atlantic", {
      censusRegion: "Northeast",
      censusDivision: "Middle Atlantic",
    }),
    usRegion("EAST-NORTH-CENTRAL", "East North Central", {
      censusRegion: "Midwest",
      censusDivision: "East North Central",
    }),
    usRegion("WEST-NORTH-CENTRAL", "West North Central", {
      censusRegion: "Midwest",
      censusDivision: "West North Central",
    }),
    usRegion("SOUTH-ATLANTIC", "South Atlantic", {
      censusRegion: "South",
      censusDivision: "South Atlantic",
    }),
    usRegion("EAST-SOUTH-CENTRAL", "East South Central", {
      censusRegion: "South",
      censusDivision: "East South Central",
    }),
    usRegion("WEST-SOUTH-CENTRAL", "West South Central", {
      censusRegion: "South",
      censusDivision: "West South Central",
    }),
    usRegion("MOUNTAIN", "Mountain", {
      censusRegion: "West",
      censusDivision: "Mountain",
    }),
    usRegion("PACIFIC-COAST", "Pacific Coast", {
      censusRegion: "West",
      censusDivision: "Pacific",
    }),
    usRegion("ALASKA", "Alaska", {
      censusRegion: "West",
      censusDivision: "Pacific",
    }),
    usRegion("HAWAII", "Hawaii", {
      censusRegion: "West",
      censusDivision: "Pacific",
    }),
  ];

  const chinaRegion = regionFactory(CHINA_COUNTRY_ID, "China");
  const CHINA_REGIONS = [
    chinaRegion("NORTH", "North China"),
    chinaRegion("NORTHEAST", "Northeast China"),
    chinaRegion("EAST", "East China"),
    chinaRegion("SOUTH-CENTRAL", "South Central China"),
    chinaRegion("SOUTHWEST", "Southwest China"),
    chinaRegion("NORTHWEST", "Northwest China"),
  ];

  // India has five Zonal Councils. Its eight northeastern states are covered
  // by the separate North Eastern Council, included here as a sixth target.
  const indiaRegion = regionFactory(INDIA_COUNTRY_ID, "India");
  const INDIA_REGIONS = [
    indiaRegion("NORTHERN", "Northern Zonal Council"),
    indiaRegion("CENTRAL", "Central Zonal Council"),
    indiaRegion("EASTERN", "Eastern Zonal Council"),
    indiaRegion("WESTERN", "Western Zonal Council"),
    indiaRegion("SOUTHERN", "Southern Zonal Council"),
    indiaRegion("NORTH-EASTERN", "North Eastern Council"),
  ];

  const brazilRegion = regionFactory(BRAZIL_COUNTRY_ID, "Brazil");
  const BRAZIL_REGIONS = [
    brazilRegion("NORTH", "North"),
    brazilRegion("NORTHEAST", "Northeast"),
    brazilRegion("CENTRAL-WEST", "Central-West"),
    brazilRegion("SOUTHEAST", "Southeast"),
    brazilRegion("SOUTH", "South"),
  ];

  const russiaRegion = regionFactory(RUSSIA_COUNTRY_ID, "Russia");
  const RUSSIA_REGIONS = [
    russiaRegion("CENTRAL", "Central Federal District"),
    russiaRegion("NORTHWESTERN", "Northwestern Federal District"),
    russiaRegion("SOUTHERN", "Southern Federal District"),
    russiaRegion("NORTH-CAUCASIAN", "North Caucasian Federal District"),
    russiaRegion("VOLGA", "Volga Federal District"),
    russiaRegion("URAL", "Ural Federal District"),
    russiaRegion("SIBERIAN", "Siberian Federal District"),
    russiaRegion("FAR-EASTERN", "Far Eastern Federal District"),
  ];

  const canadaRegion = regionFactory(CANADA_COUNTRY_ID, "Canada");
  const CANADA_REGIONS = [
    canadaRegion("ATLANTIC", "Atlantic Provinces"),
    canadaRegion("CENTRAL", "Central Canada"),
    canadaRegion("PRAIRIES", "Prairie Provinces"),
    canadaRegion("WEST-COAST", "West Coast"),
    canadaRegion("NORTHERN", "Northern Territories"),
  ];

  const australiaRegion = regionFactory(AUSTRALIA_COUNTRY_ID, "Australia");
  const AUSTRALIA_REGIONS = [
    australiaRegion("NEW-SOUTH-WALES", "New South Wales"),
    australiaRegion("VICTORIA", "Victoria"),
    australiaRegion("QUEENSLAND", "Queensland"),
    australiaRegion("SOUTH-AUSTRALIA", "South Australia"),
    australiaRegion("WESTERN-AUSTRALIA", "Western Australia"),
    australiaRegion("TASMANIA", "Tasmania"),
    australiaRegion("NORTHERN-TERRITORY", "Northern Territory"),
    australiaRegion(
      "AUSTRALIAN-CAPITAL-TERRITORY",
      "Australian Capital Territory"
    ),
  ];

  const indonesiaRegion = regionFactory(INDONESIA_COUNTRY_ID, "Indonesia");
  const INDONESIA_REGIONS = [
    indonesiaRegion("SUMATRA", "Sumatra"),
    indonesiaRegion("JAVA", "Java"),
    indonesiaRegion("KALIMANTAN", "Kalimantan"),
    indonesiaRegion("SULAWESI", "Sulawesi"),
    indonesiaRegion("LESSER-SUNDA", "Lesser Sunda Islands"),
    indonesiaRegion("MALUKU", "Maluku Islands"),
    indonesiaRegion("PAPUA", "Papua"),
  ];

  const ukRegion = regionFactory(UNITED_KINGDOM_COUNTRY_ID, "United Kingdom");
  const UNITED_KINGDOM_REGIONS = [
    ukRegion("ENGLAND", "England"),
    ukRegion("SCOTLAND", "Scotland"),
    ukRegion("WALES", "Wales"),
    ukRegion("NORTHERN-IRELAND", "Northern Ireland"),
  ];

  const US_PACIFIC_TRACKING_REGIONS = US_TRACKING_REGIONS.filter((region) =>
    ["PACIFIC-COAST", "ALASKA", "HAWAII"].includes(region.regionKey)
  );

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

  // A subdivided country renders as several separate region paths, each
  // stroked around its own full perimeter — so the seam between two
  // sibling regions gets the same stroke as the country's actual border.
  // This dissolves each subdivided country's regions back into a single
  // outline (via the shared arcs already baked into its topology) so the
  // globe can stroke real country borders more heavily than region seams,
  // without changing the interactive/fill layer at all.
  function buildCountryBorders(countries, topologies) {
    const availableTopologies = topologies || {};
    const subdivisionByParentId = new Map(
      COUNTRY_SUBDIVISIONS.map((subdivision) => [subdivision.parentId, subdivision])
    );

    return countries.map((country) => {
      const subdivision = subdivisionByParentId.get(String(country.id));
      const topology = subdivision && availableTopologies[subdivision.topologyKey];
      if (!subdivision || !topology) return country;

      try {
        const regions = topology.objects && topology.objects.regions;
        if (!regions || !Array.isArray(regions.geometries)) {
          throw new Error("topology is missing its `regions` geometry collection.");
        }
        return {
          ...country,
          geometry: topojson.merge(topology, regions.geometries),
        };
      } catch (err) {
        console.error(
          `Could not merge ${subdivision.countryName} regions into a border outline; using the country boundary instead.`,
          err
        );
        return country;
      }
    });
  }

  function migrateLegacyWatchedIds(watchedIds, places) {
    const renderedIds = new Set((places || []).map((place) => String(place.id)));
    let changed = false;

    COUNTRY_SUBDIVISIONS.forEach(({ parentId, regions }) => {
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
    buildCountryBorders,
    migrateLegacyWatchedIds,
  };
})(window);
