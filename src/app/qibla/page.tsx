"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Compass, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";

export default function QiblaPage() {
    const router = useRouter();
    const [heading, setHeading] = useState<number>(0); // Default 0
    const [qiblaResult, setQiblaResult] = useState<number | null>(null);
    const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
    const [status, setStatus] = useState<string>("Initializing...");
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);

    // Manual Rotation State
    const [isDragging, setIsDragging] = useState(false);
    const [startAngle, setStartAngle] = useState(0);
    const [currentRotation, setCurrentRotation] = useState(0);

    // Kaaba Coordinates
    const KAABA_LAT = 21.422487;
    const KAABA_LONG = 39.826206;

    useEffect(() => {
        // 1. Get Location
        if ("geolocation" in navigator) {
            const timeoutId = setTimeout(() => {
                if (!coords) {
                    // Fallback to Jakarta if valid location access takes too long
                    const jakarta = { latitude: -6.2088, longitude: 106.8456 };
                    setCoords(jakarta);
                    setQiblaResult(calculateQibla(jakarta.latitude, jakarta.longitude));
                    setStatus("Location timed out. Using Jakarta as default.");
                }
            }, 5000);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    clearTimeout(timeoutId);
                    const { latitude, longitude } = position.coords;
                    setCoords({ latitude, longitude });
                    const qibla = calculateQibla(latitude, longitude);
                    setQiblaResult(qibla);
                    setStatus("Waiting for compass...");
                },
                (error) => {
                    clearTimeout(timeoutId);
                    console.error(error);
                    // Fallback to Jakarta
                    const jakarta = { latitude: -6.2088, longitude: 106.8456 };
                    setCoords(jakarta);
                    setQiblaResult(calculateQibla(jakarta.latitude, jakarta.longitude));
                    setStatus("Location access denied. Using Jakarta as default.");
                }
            );
        } else {
            setStatus("Geolocation is not supported. Using Jakarta as default.");
            const jakarta = { latitude: -6.2088, longitude: 106.8456 };
            setCoords(jakarta);
            setQiblaResult(calculateQibla(jakarta.latitude, jakarta.longitude));
        }
    }, []);

    useEffect(() => {
        // 2. Setup Device Orientation
        const handleOrientation = (event: DeviceOrientationEvent | any) => {
            if (isManualMode) return;

            let compass = event.alpha;

            // iOS specific property
            if (event.webkitCompassHeading) {
                compass = event.webkitCompassHeading;
            }

            // Android absolute orientation
            if (event.absolute && event.alpha !== null) {
                // Convert alpha (counter-clockwise 0-360) to heading (clockwise 0-360)
                // In deviceorientationabsolute, alpha=0 is North.
                // Rotation is usually counter-clockwise.
                // So heading = 360 - alpha.
                compass = 360 - event.alpha;
            }

            if (compass !== null && compass !== undefined) {
                // Normalize to 0-360
                const headingVal = (compass + 360) % 360;
                setHeading(headingVal);
            }
        };

        const initCompass = async () => {
            if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
                // iOS 13+ requires permission
                setStatus("Tap to enable compass.");
            } else {
                // Android / Standard
                // Try absolute first
                if ('ondeviceorientationabsolute' in (window as any)) {
                    (window as any).addEventListener("deviceorientationabsolute", handleOrientation, true);
                } else {
                    window.addEventListener("deviceorientation", handleOrientation, true);
                }
                setPermissionGranted(true);

                // Check if we are actually receiving data
                setTimeout(() => {
                    setHeading(prev => {
                        if (prev === 0) {
                            // Try fallback to standard event if absolute failed or didn't fire
                            if ('ondeviceorientationabsolute' in (window as any)) {
                                (window as any).removeEventListener("deviceorientationabsolute", handleOrientation, true);
                                window.addEventListener("deviceorientation", handleOrientation, true);
                            } else {
                                setStatus("Compass not detected. Rotate manually.");
                                setIsManualMode(true);
                            }
                        } else {
                            setStatus("Compass active.");
                        }
                        return prev;
                    });
                }, 1000);
            }
        };

        initCompass();

        return () => {
            if ('ondeviceorientationabsolute' in (window as any)) {
                (window as any).removeEventListener("deviceorientationabsolute", handleOrientation, true);
            }
            window.removeEventListener("deviceorientation", handleOrientation, true);
        };
    }, [isManualMode]);

    const requestAccess = async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission();
                if (permission === "granted") {
                    setPermissionGranted(true);
                    setIsManualMode(false);
                    // iOS listener
                    window.addEventListener("deviceorientation", (event: any) => {
                        let compass = event.webkitCompassHeading || event.alpha;
                        if (compass) setHeading(compass);
                    }, true);
                    setStatus("Compass active.");
                } else {
                    setStatus("Permission denied. Rotate manually.");
                    setIsManualMode(true);
                }
            } catch (e) {
                console.error(e);
                setStatus("Error requesting permission.");
                setIsManualMode(true);
            }
        }
    };

    function calculateQibla(latitude: number, longitude: number) {
        const latRad = degToRad(latitude);
        const longRad = degToRad(longitude);
        const kaabaLatRad = degToRad(KAABA_LAT);
        const kaabaLongRad = degToRad(KAABA_LONG);

        const y = Math.sin(kaabaLongRad - longRad);
        const x = Math.cos(latRad) * Math.tan(kaabaLatRad) - Math.sin(latRad) * Math.cos(kaabaLongRad - longRad);

        let qibla = radToDeg(Math.atan2(y, x));
        return (qibla + 360) % 360;
    }

    function degToRad(deg: number) {
        return deg * (Math.PI / 180);
    }

    function radToDeg(rad: number) {
        return rad * (180 / Math.PI);
    }

    // Manual Rotation Logic
    const handleStart = (clientX: number, clientY: number, rect: DOMRect) => {
        setIsDragging(true);
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
        setStartAngle(angle - currentRotation);
        setIsManualMode(true); // Switch to manual on interaction
        setStatus("Manual mode");
    };

    const handleMove = (clientX: number, clientY: number, rect: DOMRect) => {
        if (!isDragging) return;
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
        const newRotation = angle - startAngle;
        setCurrentRotation(newRotation);
        // Map rotation back to heading concept:
        // visual rotation = -heading.
        // so heading = -visual rotation.
        setHeading(-newRotation);
    };

    const onMouseDown = (e: React.MouseEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        handleStart(e.clientX, e.clientY, rect);
    };

    const onMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            const rect = e.currentTarget.getBoundingClientRect();
            handleMove(e.clientX, e.clientY, rect);
        }
    };

    const onTouchStart = (e: React.TouchEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        handleStart(e.touches[0].clientX, e.touches[0].clientY, rect);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        if (isDragging) {
            const rect = e.currentTarget.getBoundingClientRect();
            handleMove(e.touches[0].clientX, e.touches[0].clientY, rect);
        }
    };

    const compassStyle = {
        transform: `rotate(${-1 * (heading || 0)}deg)`,
        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
        cursor: 'grab'
    };

    const qiblaMarkerStyle = {
        transform: `rotate(${qiblaResult || 0}deg)`,
    };

    return (
        <main
            className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-50 pb-24 relative overflow-hidden flex flex-col items-center"
            onMouseUp={() => setIsDragging(false)}
            onTouchEnd={() => setIsDragging(false)}
        >
            {/* Header */}
            <div className="w-full max-w-md p-6 flex items-center justify-between z-10">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                    <ArrowLeft className="w-6 h-6" />
                </Button>
                <h1 className="text-lg font-bold">Qibla Compass</h1>
                <div className="w-10" />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md px-6 relative z-10">

                {/* Status/Permission */}
                {(status.includes("Permission") || status.includes("Tap")) && !permissionGranted && (
                    <div className="text-center mb-10 w-full">
                        <p className="text-sm text-muted-foreground mb-4">{status}</p>
                        <Button onClick={requestAccess} className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-8">
                            Enable Compass
                        </Button>
                    </div>
                )}
                {/* Helper Text for manual */}
                {isManualMode && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-6 animate-pulse">
                        Rotate the compass manually to align N to North
                    </p>
                )}


                {/* Compass Visualization */}
                <div
                    className="relative w-72 h-72 mb-12 select-none"
                    onMouseDown={onMouseDown}
                    onMouseMove={onMouseMove}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                >
                    {/* Compass Card - Rotates with device heading */}
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex items-center justify-center will-change-transform" style={compassStyle}>

                        {/* NSEW Indicators */}
                        <div className="absolute top-4 text-xs font-bold text-red-500">N</div>
                        <div className="absolute bottom-4 text-xs font-bold text-slate-400">S</div>
                        <div className="absolute right-4 text-xs font-bold text-slate-400">E</div>
                        <div className="absolute left-4 text-xs font-bold text-slate-400">W</div>

                        {/* Degree Marks (Optional simple ones) */}
                        <div className="absolute inset-4 border rounded-full border-slate-100 dark:border-slate-800 dashed-border opacity-50"></div>

                        {/* Kaaba Marker - Fixed to the Compass Card at the correct angle */}
                        {qiblaResult !== null && (
                            <div className="absolute inset-0" style={qiblaMarkerStyle}>
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    {/* Kaaba Icon / Qibla Pointer */}
                                    <div className="relative">
                                        <div className="w-8 h-8 bg-black border-2 border-amber-400 rounded-md flex items-center justify-center shadow-lg transform -translate-y-1">
                                            <div className="w-full h-[2px] bg-amber-400 absolute top-2"></div>
                                        </div>
                                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-amber-500 absolute top-[-10px] left-1/2 -translate-x-1/2"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Center Point */}
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 z-10"></div>
                    </div>

                    {/* Fixed Decoration (Does NOT rotate - The 'Needle' pointing roughly to top (Use phone alignment)) */}
                    {/* In digital compass apps, typically you align the phone. The card rotates. 
                       Here we have a fixed indicator at the top representing 'Straight Ahead' */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                        <div className="w-1 h-4 bg-red-500 rounded-full mb-1"></div>
                    </div>

                </div>

                {/* Info Card */}
                <Card className="w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-none shadow-sm pointer-events-none">
                    <CardContent className="p-6 text-center space-y-2">
                        <div className="flex justify-center items-end gap-2 text-violet-600 dark:text-violet-400">
                            <span className="text-4xl font-bold tracking-tighter">
                                {qiblaResult ? Math.round(qiblaResult) : "--"}°
                            </span>
                            <span className="mb-1.5 font-medium">Qibla Direction</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            {status}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
