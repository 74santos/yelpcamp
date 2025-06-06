  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const style = prefersDark 
    ? 'mapbox://styles/mapbox/navigation-night-v1' 
    : 'mapbox://styles/mapbox/navigation-day-v1';

  mapboxgl.accessToken = maptoken;
  const map = new mapboxgl.Map({
    container: 'map',
    style,
    center: [-98.5795, 39.8283], // Center of US
    zoom: 4
  });
  // Add zoom and rotation controls  
  map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');


  // Convert campgrounds to GeoJSON
  const geoJsonCampgrounds = {
    type: 'FeatureCollection',
    features: campgrounds.map(camp => ({
      type: 'Feature',
      geometry: camp.geometry,
      properties: {
        id: camp._id,
        title: camp.title,
        location: camp.location
      }
    }))
  };

  map.on('load', () => {
    map.addSource('campgrounds', {
      type: 'geojson',
      data: geoJsonCampgrounds,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Cluster circles
    map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'campgrounds',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#F38D68',
          10,
          '#9CD08F',
          30,
          '#4EA5D9'
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          18,
          10,
          25,
          30,
          40
        ],
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff',
        
      }
    });

    // Cluster count labels
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'campgrounds',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 14
      }
    });

    // Individual unclustered points
    map.addLayer({
      id: 'unclustered-point',
      type: 'circle',
      source: 'campgrounds',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': 'orange',
        'circle-radius': 6,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#fff'
      }
    });

    // Click on unclustered point
    map.on('click', 'unclustered-point', (e) => {
      console.log(e.features[0].properties);
      const { id, title, location } = e.features[0].properties;
      const coordinates = e.features[0].geometry.coordinates.slice();
      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`<strong>${title}</strong><br>${location}<br><a href="/campgrounds/${id}">View Campground</a>`)
        .addTo(map);
    });

    // Zoom on cluster click
    map.on('click', 'clusters', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
      const clusterId = features[0].properties.cluster_id;
      map.getSource('campgrounds').getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom,
          duration: 1000
        });
      });
    });
    

    // Cursor changes
    map.on('mouseenter', 'clusters', () => map.getCanvas().style.cursor = 'pointer');
    map.on('mouseleave', 'clusters', () => map.getCanvas().style.cursor = '');
  });

