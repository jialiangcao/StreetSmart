"use client";
import React, { useEffect, useRef, useState } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { textToSpeech } from "../api/api";

const libraries = ["places"];

const containerStyle = {
  width: "70%",
  height: "500px",
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
  const timeoutRef = useRef(null);

  const [currentPosition, setCurrentPosition] = useState(null);
  const [currentInstruction, setCurrentInstruction] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);

  // Get and watch user's location
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newPosition = { lat: latitude, lng: longitude };
        const timestamp = new Date(position.timestamp).toLocaleString();
        console.log("Current Position:", newPosition, "at", timestamp);
        setCurrentPosition(newPosition);
      },
      (error) => {
        console.error("Geolocation error:", error);
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

  const handleSearch = () => {
    const destination = endRef.current.value;
    if (!destination || !currentPosition) return;

    directionsServiceRef.current.route(
      {
        origin: currentPosition,
        destination,
        travelMode: window.google.maps.TravelMode.WALKING,
      },
      async (result, status) => {
        if (status === "OK") {
          directionsRendererRef.current.setDirections(result);

          const steps = result.routes[0].legs[0].steps;
          if (steps.length > 0) {
            const instruction = steps[0].instructions.replace(/<[^>]+>/g, "");
            console.log("Speaking Instruction:", instruction);
            setCurrentInstruction(instruction);

            try {
              const url = await textToSpeech(instruction);
              setAudioUrl(url);
              console.log("TTS completed for:", instruction);
            } catch (err) {
              console.error("TTS failed:", err);
            }
          }
        } else {
          alert("Directions failed: " + status);
        }
      }
    );
  };

  // Auto recalculate route when position updates
  useEffect(() => {
    if (!currentPosition) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      handleSearch();
    }, 3000);

    return () => clearTimeout(timeoutRef.current);
  }, [currentPosition]);

  return (
    <LoadScript googleMapsApiKey={API_KEY} libraries={libraries}>
      <div style={{ marginBottom: "10px" }}>
        <input
          ref={endRef}
          placeholder="Destination"
          style={{ padding: "8px", width: "300px", marginRight: "10px" }}
        />
        <button onClick={handleSearch} style={{ padding: "8px" }}>
          Set Destination
        </button>
      </div>

      <div style={{ display: "flex" }}>
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
            width: "700px",
            height: "500px",
            overflowY: "auto",
            padding: "10px",
            background: "white",
            border: "1px solid #ccc",
          }}
        />
      </div>
      {audioUrl && (
        <audio src={audioUrl} autoPlay onEnded={() => setAudioUrl(null)} />
      )}
    </LoadScript>
  );
};

export default MapComponent;
