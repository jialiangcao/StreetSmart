"use client";
import { useRef, useEffect, useState } from 'react';
import Image from "next/image";
import styles from "./page.module.css";
import MapComponent from "./components/maps";
import { FaHome } from 'react-icons/fa';

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
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: 'environment' } } });
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

    const buttonStyle = {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'white' }}>
            <div style={{
                backgroundColor: 'white',
                padding: '.55rem',
                display: 'flex',
                alignItems: 'center', // Vertically align items
                color: 'black',
            }}>
                {/* Home Button on the Left */}
                <button
                    onClick={() => window.location.href = '/'}
                    style={buttonStyle}
                    aria-label="Go to Home"
                >
                    <FaHome size={30} color="black" />
                </button>

                {/* Text Horizontally Centered */}
                <h2 style={{ textAlign: 'center', margin: 0, flexGrow: .9 }}>Street Smart</h2>
            </div>
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: 18,
                    left: 0,
                    right: 0,
                    marginLeft: 'auto',
                    marginRight: 'auto',
                    width: '100%',
                    maxWidth: '28rem',
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    zIndex: 50,
                    textAlign: 'center',
                    animation: 'fade-in-down 0.5s ease-out'
                }}>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{notification}</p>
                </div>
            )}

            <div style={{ position: 'relative', height: '50%', overflow: 'hidden' }}>
                <main style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{ paddingLeft: '.5rem', paddingRight: '.5rem', borderRadius: '1.5rem', objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <div style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '1rem',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                    }}>
                        <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: 'red',
                            animation: 'blink 3s infinite'
                        }}></div>
                        <span> Keep the camera centered</span>
                    </div>
                </main>
            </div>
            <style>
                {`
                @keyframes blink {
                    0%, 50%, 100% { opacity: 1; }
                    25%, 75% { opacity: 0; }
                }
                @keyframes fade-in-down {
                  0% {
                    opacity: 0;
                    transform: translateY(-20px);
                  }
                  100% {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }
            `}
            </style>

            <div style={{
                height: '60%',
                backgroundColor: 'white',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                paddingLeft: '0.5rem',
                paddingRight: '0.5rem'
            }}>
                <MapComponent />
            </div>
        </div>
    );
}
