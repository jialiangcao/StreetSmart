"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Video, VideoOff } from "lucide-react"
import { predictTraffic, predictCar, textToSpeech } from "./api/api";
import MapComponent from "./components/maps";

export default function CameraDetection() {
  const [isRecording, setIsRecording] = useState(false)
  const [trafficResult, setTrafficResult] = useState(null)
  const [carResult, setCarResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const processingTimeoutRef = useRef(null);
  let ctx = null;

  useEffect(() => {
    if (!isRecording) {
      // Clean up video stream when stopping recording
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      // Clear any pending processing timeouts
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      return;
    }

    const constraints = { video: true };

    // Getting the camera data
    try {
      navigator.mediaDevices.getUserMedia(constraints)
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          videoRef.current.requestVideoFrameCallback(processFrame);
        }).catch((err) => {
          console.error("Error accessing camera:", err);
        })
    } catch (error) {
      console.error("Error with getUserMedia:", error)
    }

    return () => {
      // Cleanup function for when component unmounts or recording stops
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [isRecording])

  const processFrame = async () => { 
    if (!videoRef.current || !isRecording) {
      return;
    }

    ctx = canvasRef.current.getContext("2d");

    const videoWidth = videoRef.current.videoWidth;
    const videoHeight = videoRef.current.videoHeight;
  
    if (videoWidth && videoHeight) {
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      ctx.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
    }

    // Process images at a reasonable interval to avoid overwhelming the server
    if (!isProcessing) {
      // Set processing flag to avoid multiple simultaneous requests
      setIsProcessing(true);
      
      try {
        // Convert canvas to blob for sending to server
        canvasRef.current.toBlob(async (blob) => {
          if (blob) {
            const imageFile = new File([blob], "camera-frame.jpg", { type: "image/jpeg" });
            
            // Send to backend APIs in parallel
            const [trafficPrediction, carPrediction] = await Promise.all([
              predictTraffic(imageFile),
              //predictCar(imageFile)
            ]);
            
            // Update state with results
            setTrafficResult(trafficPrediction);
            //setCarResult(carPrediction);
            
          }
        }, 'image/jpeg', 0.8); // 0.8 quality is a good balance between size and quality
      } catch (error) {
        console.error("Error processing image:", error);
      } finally {
        // Reset processing flag after a short delay to control request frequency
        processingTimeoutRef.current = setTimeout(() => {
          setIsProcessing(false);
        }, 1000); // Process at most once per second
      }
    }

    // Continue requesting frames
    if (isRecording) {
      videoRef.current.requestVideoFrameCallback(processFrame);
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (isRecording) {
      // Reset results when stopping recording
      setTrafficResult(null);
      setCarResult(null);
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Traffic Light & Vehicle Detection</h1>

      <Card className="mb-6">
        <CardContent className="p-0 relative">
          {/* Camera feed display area */}
          <div className="aspect-video bg-slate-900 flex items-center justify-center relative overflow-hidden rounded-md">
            {!isRecording ? (
              <div className="text-center">
                <Camera className="h-16 w-16 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400">Camera feed will appear here</p>
              </div>
            ) : (
              <>
                {/* Video feed */}
                <video
                  className="w-full h-full object-cover"
                  ref={videoRef}
                  autoPlay
                />
                <canvas
                  ref={canvasRef}
                  className="hidden" // Hide canvas but keep it for processing
                />

                {/* Recording indicator */}
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
                  <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-white text-sm font-medium">Recording</span>
                </div>
                
                {/* Processing indicator */}
                {isProcessing && (
                  <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1.5 rounded-full">
                    <span className="text-white text-sm font-medium">Processing...</span>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <MapComponent />

      <div className="flex justify-center items-center">
        <Button
          onClick={toggleRecording}
          className={`gap-2 ${isRecording ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
          size="lg"
        >
          {isRecording ? (
            <>
              <VideoOff className="h-5 w-5" />
              Stop Recording
            </>
          ) : (
            <>
              <Video className="h-5 w-5" />
              Start Recording
            </>
          )}
        </Button>
      </div>

      {/* Detection results area */}
      {isRecording && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Detection Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Traffic Lights</h3>
                <div className="text-sm">
                  {trafficResult ? (
                    <div>
                      <p className="font-semibold">Status: <span className={`${
                        trafficResult.status === 'red' ? 'text-red-500' : 
                        trafficResult.status === 'green' ? 'text-green-500' : 
                        trafficResult.status === 'yellow' ? 'text-yellow-500' : 'text-slate-500'
                      }`}>{trafficResult.status || 'Unknown'}</span></p>
                      <p>Confidence: {trafficResult.confidence ? `${Math.round(trafficResult.confidence * 100)}%` : 'N/A'}</p>
                      {trafficResult.location && (
                        <p>Location: {`${trafficResult.location.x}, ${trafficResult.location.y}`}</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-500">Waiting for traffic light detection...</div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium mb-2">Vehicles</h3>
                <div className="text-sm">
                  {carResult ? (
                    <div>
                      <p>Detected: {carResult.count || 0} vehicle(s)</p>
                      {carResult.vehicles && carResult.vehicles.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold">Vehicle Types:</p>
                          <ul className="list-disc pl-5 mt-1">
                            {carResult.vehicles.map((vehicle, index) => (
                              <li key={index}>{vehicle.type} ({Math.round(vehicle.confidence * 100)}%)</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-500">Waiting for vehicle detection...</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
