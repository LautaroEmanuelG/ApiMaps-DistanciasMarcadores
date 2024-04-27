const mapDiv = document.getElementById('map');
const inputPlaces = document.getElementById('place_input');
let map;
let autocomplete;
let marker;
let markers = [];
const destino = { lat: -32.94502721277474, lng: -68.79579630726008 };

async function initMap() {
  //@ts-ignore
  const { Map } = await google.maps.importLibrary('maps');

  map = new Map(document.getElementById('map'), {
    center: destino,
    zoom: 14,
  });

  marker = new google.maps.Marker({
    position: destino,
    map: map,
  });

  map.addListener('click', function (e) {
    // Creamos un nuevo marcador en la ubicación del clic
    let newMarker = new google.maps.Marker({
      position: e.latLng,
      map: map,
    });

    // Añadimos un controlador de eventos de clic al marcador
    newMarker.addListener('click', function () {
      // Eliminamos el marcador del mapa
      newMarker.setMap(null);

      // Eliminamos el marcador del array de marcadores
      const index = markers.indexOf(newMarker);
      if (index > -1) {
        markers.splice(index, 1);
      }
      // Eliminamos el marcador de la lista HTML
      document.getElementById(newMarker.id).remove();
    });

    // Añadimos el nuevo marcador al array de marcadores
    markers.push(newMarker);

    // Guardamos las coordenadas del marcador
    const coordinates = e.latLng.toJSON();

    // Creamos un nuevo elemento de lista para el marcador
    let newListItem = document.createElement('li');
    newListItem.textContent = `Latitud ${e.latLng
      .lat()
      .toFixed(2)}, Longitud ${e.latLng.lng().toFixed(2)}`;
    newListItem.id = newMarker.id;

    // Calculamos la distancia al punto -64, -34
    const point = new google.maps.LatLng(-34, -64);
    calcularDistancia(coordinates, destino);

    // Añadimos el nuevo elemento de lista a la lista HTML
    document.getElementById('lista-marcadores').appendChild(newListItem);
  });

  initAutocomplete();
  mapearCoordenadas(markers);
}

const initAutocomplete = () => {
  autocomplete = new google.maps.places.Autocomplete(inputPlaces);
  autocomplete.addListener('place_changed', function () {
    const place = autocomplete.getPlace();
    map.setCenter(place.geometry.location);
    markers.push(
      new google.maps.Marker({
        position: place.geometry.location,
        map: map,
      })
    );
  });
};

const calcularDistancia = async (origen, destino) => {
  console.log('origen', origen, 'destino', destino);
  const data = {
    origin: {
      location: {
        latLng: {
          latitude: origen.lat,
          longitude: origen.lng,
        },
      },
    },
    destination: {
      location: {
        latLng: {
          latitude: destino.lat,
          longitude: destino.lng,
        },
      },
    },
    travelMode: 'DRIVE',
    routingPreference: 'TRAFFIC_AWARE',
    // departureTime: "2023-10-15T15:01:23.045123456Z",
    computeAlternativeRoutes: false,
    routeModifiers: {
      avoidTolls: false,
      avoidHighways: false,
      avoidFerries: false,
    },
    languageCode: 'en-US',
    units: 'IMPERIAL',
  };

  // Mostrar el elemento de carga
  document.getElementById('loading').style.display = 'block';

  fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': 'API_KEY',
      'X-Goog-FieldMask':
        'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
    },
    body: JSON.stringify(data),
  })
    .then(response => response.json())
    .then(data => {
      if (!data.error_message) {
        // Manejar la respuesta de la API
        console.log('Respuesta de la API de Google Maps Directions:', data);
        console.log('Distancia:', data.routes[0].distanceMeters, 'metros');
        console.log('Duración:', data.routes[0].duration, 'segundos');

        // Obtener el elemento con el id "distancia"
        const distanciaElement = document.getElementById('distancia');

        // Calcular la distancia en km y el tiempo en minutos
        const distanciaKm = data.routes[0].distanceMeters / 1000;
        const tiempoMin = data.routes[0].duration.slice(0, -1) / 60;

        // Imprimir la distancia y el tiempo en el elemento
        distanciaElement.textContent = `Distancia: ${distanciaKm.toFixed(
          2
        )} km, Tiempo: ${tiempoMin.toFixed(2)} min`;
      } else {
        console.error(
          'Error en la API de Google Maps Directions:',
          data.error_message
        );
      }

      // Ocultar el elemento de carga
      document.getElementById('loading').style.display = 'none';
    })
    .catch(error => {
      console.error('Error:', error);

      // Ocultar el elemento de carga
      document.getElementById('loading').style.display = 'none';
    });
};

//Mapear cordenadas en el html
const mapearCoordenadas = markers => {
  const lista = document.querySelector('.lista');
  //Cargar el array markers y mostrarlo en el html
  markers.forEach(marker => {
    const li = document.createElement('li');
    li.textContent = `Lat: ${marker.position.lat()} - Lng: ${marker.position.lng()}`;
    lista.appendChild(li);
  });
};
