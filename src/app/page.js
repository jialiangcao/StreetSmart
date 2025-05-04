"use client";
import { useRef, useEffect, useState } from 'react';
import Image from "next/image";
import styles from "./page.module.css";
import MapComponent from "./components/maps";

export default function Home() {
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const [trafficPrediction, setTrafficPrediction] = useState([])
    const [carPrediction, setCarPrediction] = useState([])
    const [notification, setNotification] = useState(null)

    useEffect(() => {
        let intervalId;

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                videoRef.current.srcObject = stream;

                // Start capturing frames every second
                intervalId = setInterval(captureAndSendFrame, 3000);
            } catch (error) {
                console.error('Error accessing camera:', error);
            }
        };

        const captureAndSendFrame = () => {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const ctx = canvas.getContext('2d');

            // Set canvas dimensions to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw current video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert canvas image to JPEG Blob
            canvas.toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('image', blob, 'frame.jpg');

                try {
                    const trafficResponse = await fetch('http://127.0.0.1:5000/traffic', {
                        method: 'POST',
                        body: formData,
                    });

                    const carResponse = await fetch('http://127.0.0.1:5000/car', {
                        method: 'POST',
                        body: formData,
                    })

                    const trafficData = await trafficResponse.json();
                    const carData = await carResponse.json()
                    setTrafficPrediction(trafficData.trafficPrediction || [])
                    setCarPrediction(carData.carPrediction || []);
                } catch (error) {
                    console.error('Error sending frame:', error);
                }
            }, 'image/jpeg', 0.8);
        };

        startCamera();

        return () => {
            clearInterval(intervalId);
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (carPrediction?.length <= 0) {
            return
        }
        carPrediction.forEach((prediction) => {
            if (prediction.class_name == "car") {
                const audio = new Audio('/car.mp3')
                audio.play()
                setNotification("🚗 Car Detected!")
                const timer = setTimeout(() => {
                    setNotification(null);
                }, 3000);

                return () => clearTimeout(timer);
            }
        })
    }, [carPrediction])

    useEffect(() => {
        if (trafficPrediction?.length <= 0) {
            return
        }
        trafficPrediction.forEach((prediction) => {
            if (prediction.class_name == "red" || prediction.class_name == "pedred") {
                const audio = new Audio('/red.mp3')
                audio.play()
                setNotification("🛑 The light is red!")
                const timer = setTimeout(() => {
                    setNotification(null);
                }, 3000);

                return () => clearTimeout(timer);
            } else if (prediction.class_name == "green" || prediction.class_name == "pedgreen") {
                const audio = new Audio('/green.mp3')
                audio.play()
                setNotification("🟢 The light is green!")
                const timer = setTimeout(() => {
                    setNotification(null);
                }, 3000);
            }
        })

    }, [trafficPrediction])

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Notification - appears at top when active */}
            {notification && (
                <div className="fixed top-0 left-0 right-0 mx-auto w-full max-w-md bg-red-500 text-white px-4 py-3 rounded-b-md shadow-lg z-50 text-center animate-fade-in-down">
                    <p className="text-sm font-medium">{notification}</p>
                </div>
            )}

            {/* Webcam Section - Top Half */}
            <div className="relative h-1/2 bg-black overflow-hidden">
                <main className="absolute inset-0 flex items-center justify-center">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="object-cover w-full h-full"
                    />
                    <canvas
                        ref={canvasRef}
                        style={{ display: 'none' }}
                    />
                </main>
            </div>

            {/* Map Section - Bottom Half */}
            <div className="h-1/2 bg-white rounded-t-3xl shadow-lg overflow-hidden">
                <MapComponent />
            </div>
        </div>
    );
}
