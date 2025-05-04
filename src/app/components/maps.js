"use client";
import React, { useEffect, useRef, useState } from "react";
import { GoogleMap, LoadScript } from "@react-google-maps/api";
import { textToSpeech } from "../api/api";

const libraries = ["places"];

const containerStyle = {
    width: "100%",
    height: "25rem",
};

const mapOptions = {
    disableDefaultUI: true,
}

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
    const timeoutRef = useRef(null);
    const prevInstruction = useRef(null)

    const [currentPosition, setCurrentPosition] = useState(null);
    const [currentInstruction, setCurrentInstruction] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);

    // Get and watch user's location
    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const newPosition = { lat: latitude, lng: longitude };
                // const timestamp = new Date(position.timestamp).toLocaleString();
                // console.log("Current Position:", newPosition, "at", timestamp);
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
                        setCurrentInstruction(instruction);
                    }
                } else {
                    console.log("Directions failed: " + status);
                }
            }
        );
    };

    useEffect(() => {
        if (currentInstruction === null || currentInstruction === prevInstruction.current) {
            return
        }
        prevInstruction.current = currentInstruction;
        const speak = async () => {
            try {
                const url = await textToSpeech(currentInstruction);
                setAudioUrl(url);
            } catch (err) {
                console.error("TTS failed:", err);
            }
        };
        speak()
    }, [currentInstruction]);

    // Auto recalculate route when position updates
    useEffect(() => {
        if (!endRef.current || !currentPosition) return;

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

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "100%" }}>
                    <input
                        ref={endRef}
                        placeholder="Destination"
                        style={{ padding: "8px", width: "70%", background: "white", color: "black", border: "none" }}
                    />
                    <button onClick={handleSearch} style={{ width: "30%", height: "auto", padding: "8px", background: "rgba(3, 161, 252)", color: "white", border: "none" }}>
                        Search
                    </button>
                </div>
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={currentPosition || defaultCenter}
                    zoom={14}
                    onLoad={onLoad}
                    options={mapOptions}
                />
            </div>

            {audioUrl && (
                <audio src={audioUrl} autoPlay onEnded={() => setAudioUrl(null)} />
            )}

        </LoadScript>
    );
};

export default MapComponent;
