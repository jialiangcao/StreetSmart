"use client"

import { useState, useEffect, useRef} from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Video, VideoOff } from "lucide-react"

export default function CameraDetection() {
	const [isRecording, setIsRecording] = useState(false)
	const videoRef = useRef(null);
	const canvasRef = useRef(null);
	let ctx = null;

	useEffect(() => {
		if (!isRecording) return;

		const constraints = { video: true };

		console.log("canvasRef: ", canvasRef);
		console.log("videoRef: ", videoRef);

		// getting the camera data
		try {
			navigator.mediaDevices.getUserMedia(constraints)
				.then((stream) => {
					if (videoRef.current) {
						videoRef.current.srcObject = stream;
					}
					videoRef.current.requestVideoFrameCallback(processFrame);
				}).catch((err) => {
					console.error("something wrong with the stream in useEffect..", err);
				})
		} catch {
			console.log("something wrong with getUserMedia")
		}
	}, [isRecording])

	const processFrame = () => { 
		if (!videoRef.current) {
			console.log("videoRef: null");
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

		const dataURL = canvasRef.current.toDataURL("image/jpeg");

		videoRef.current.requestVideoFrameCallback(processFrame);
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
									{/* This would be replaced with your actual video feed */}
									<div className="absolute inset-0 flex items-center justify-center">
										<video
											className="w-full h-full"
											ref={videoRef}
											autoPlay
										/>
										<canvas
											ref={canvasRef}
										/>
									</div>

									{/* Recording indicator */}
									<div className="absolute top-4 right-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full">
										<div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
										<span className="text-white text-sm font-medium">Recording</span>
									</div>
								</>
							)}
					</div>
				</CardContent>
			</Card>

			<div className="flex justify-center items-center">
				<Button
					onClick={() => setIsRecording(true)}
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

			{/* Detection results area - placeholder for future implementation */}
			{isRecording && (
				<div className="mt-8">
					<h2 className="text-xl font-semibold mb-4">Detection Results</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<Card>
							<CardContent className="p-4">
								<h3 className="font-medium mb-2">Traffic Lights</h3>
								<div className="text-sm text-slate-500">Detection data will appear here</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-4">
								<h3 className="font-medium mb-2">Vehicles</h3>
								<div className="text-sm text-slate-500">Detection data will appear here</div>
							</CardContent>
						</Card>
					</div>
				</div>
			)}
		</div>
	)
}

