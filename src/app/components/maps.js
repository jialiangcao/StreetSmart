// 'use client'
// import React, { useState, useRef } from 'react';
// import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';

// const MapComponent = () => {
//   const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
//   const [address, setAddress] = useState('');
//   const [latitude, setLatitude] = useState(0);
//   const [longitude, setLongitude] = useState(0);
//   const inputRef = useRef(null);
//   const mapRef = useRef(null);

//   const getLocation = () => {
//     const options = {
//         maximumAge: 0,
//         enableHighAccuracy: true,
//         timeout: 20000
//     }
//     const success = (pos) => {
//         const coords = pos.coords;
//         setLatitude(coords.latitude)
//         setLongitude(coords.longitude)
//     }

//     const error = (err) => {
//         console.log(err);
//     }
//     navigator.geolocation.getCurrentPosition(
//         success,
//         error,
//         options
//     )
//   }
//   const handleSearch = () => {
//     getLocation();
//   };

//   return (
//     <APIProvider apiKey={API_KEY}>
//       <div style={{ marginBottom: '10px' }}>
//         <input
//           ref={inputRef}
//           type="text"
//           placeholder="Type location here"
//           value={address}
//           onChange={(e) => setAddress(e.target.value)}
//           style={{ width: '300px', padding: '8px' }}
//         />
//         <button onClick={handleSearch} style={{ padding: '8px' }}>
//           Search
//         </button>
//       </div>
//       <Map
//         ref={mapRef}
//         style={{ width: '500px', height: '500px' }}
//         defaultCenter={{ lat: 40.768742, lng: -73.965179 }}
//         defaultZoom={12}
//         gestureHandling={'greedy'}
//         disableDefaultUI={true}
//       />
//     </APIProvider>
//   );
// };

// export default MapComponent;
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, LoadScript } from '@react-google-maps/api';

const containerStyle = {
  width: '70%',
  height: '500px',
};

const defaultCenter = {
  lat: 40.768742,
  lng: -73.965179,
};

const MapComponent = () => {
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

  const endRef = useRef(null);
  const mapRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const panelRef = useRef(null);

  const [currentPosition, setCurrentPosition] = useState(null);

  // Watch user's location
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPosition = { lat: latitude, lng: longitude };
        console.log('Current Position:', newPosition); // ✅ now it's defined
        setCurrentPosition(newPosition);
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );
  
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);
  

  const onLoad = (map) => {
    mapRef.current = map;

    directionsRendererRef.current = new window.google.maps.DirectionsRenderer();
    directionsRendererRef.current.setMap(map);
    directionsRendererRef.current.setPanel(panelRef.current);

    directionsServiceRef.current = new window.google.maps.DirectionsService();

    new window.google.maps.places.Autocomplete(endRef.current);
  };

  // renders directions after submitted location
  const handleSearch = () => {
    const destination = endRef.current.value;
    if (!destination || !currentPosition) return;

    directionsServiceRef.current.route(
      {
        origin: currentPosition,
        destination,
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === 'OK') {
          directionsRendererRef.current.setDirections(result);
        } else {
          alert('Directions failed: ' + status);
        }
      }
    );
  };

  // Auto-recalculate route when position updates 
  useEffect(() => {
    if (currentPosition) {
      handleSearch();
    }
  }, [currentPosition]);

  return (
    <LoadScript googleMapsApiKey={API_KEY} libraries={['places']}>
      <div style={{ marginBottom: '10px' }}>
        <input
          ref={endRef}
          placeholder="Destination"
          style={{ padding: '8px', width: '300px', marginRight: '10px' }}
        />
        <button onClick={handleSearch} style={{ padding: '8px' }}>
          Set Destination
        </button>
      </div>

      <div style={{ display: 'flex' }}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={currentPosition || defaultCenter}
          zoom={14}
          onLoad={onLoad}
          options={{ disableDefaultUI: true }}
        />
        <div
          ref={panelRef}
          style={{
            width: '700px',
            height: '500px',
            overflowY: 'auto',
            padding: '10px',
            background: 'white',
            border: '1px solid #ccc',
          }}
        />
      </div>
    </LoadScript>
  );
};

export default MapComponent;
