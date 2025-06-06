


mapboxgl.accessToken = mapToken;

  const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v11', // or "satellite-streets-v12"
      center: campground ,
      zoom: 9
  });


  function limitWords(str, numWords) {
    return str.split(" ").slice(0, numWords).join(" ") + "...";
  }


  map.addControl(new mapboxgl.NavigationControl());
  new mapboxgl.Marker()
      .setLngLat(campground )
      .setPopup(new mapboxgl.Popup({ offset: 15 }).setHTML(`<h6>${campTitle}</h6><p>${campLocation}</br>${limitWords(campDescription, 4)}</p>`))
      .addTo(map);