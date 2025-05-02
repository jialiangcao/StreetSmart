'use client'
import React, { useState, useRef } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';

const MapComponent = () => {
  const API_KEY = process.env.NEXT_PUBLIC_API_KEY;
  const [address, setAddress] = useState('');
  const inputRef = useRef(null);
  const mapRef = useRef(null);

  const handleSearch = () => {
    
  };

  return (
    <APIProvider apiKey={API_KEY}>
      <div style={{ marginBottom: '10px' }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Type location here"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ width: '300px', padding: '8px' }}
        />
        <button onClick={handleSearch} style={{ padding: '8px' }}>
          Search
        </button>
      </div>
      <Map
        ref={mapRef}
        style={{ width: '500px', height: '500px' }}
        defaultCenter={{ lat: 40.768742, lng: -73.965179 }}
        defaultZoom={12}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      />
    </APIProvider>
  );
};

export default MapComponent;
