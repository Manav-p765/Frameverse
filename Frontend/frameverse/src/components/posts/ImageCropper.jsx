import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../../utils/cropImage";
import { Check, X } from "lucide-react";

const ImageCropper = ({ imageSrc, onCropComplete, onCancel }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Default aspect ratio set to 1 on 1 (Square). 
    // Change to 4/5 or 16/9 if preferred for Instagram-like feeds.
    const aspect = 1;

    const onCropChange = useCallback((crop) => {
        setCrop(crop);
    }, []);

    const onZoomChange = useCallback((zoom) => {
        setZoom(zoom);
    }, []);

    const onCropCompleteEvent = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleApplyCrop = async () => {
        if (!croppedAreaPixels) return;

        setIsProcessing(true);
        try {
            // Returns { file: Blob, url: DataURL String }
            const croppedResult = await getCroppedImg(imageSrc, croppedAreaPixels);
            onCropComplete(croppedResult);
        } catch (e) {
            console.error("Cropping failed", e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black overflow-hidden select-none">
            {/* Cropper Area */}
            <div className="absolute inset-0">
                <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={onCropChange}
                    onCropComplete={onCropCompleteEvent}
                    onZoomChange={onZoomChange}
                    objectFit="contain"
                    showGrid={true}
                />
            </div>

            {/* Navigation Header Overlay */}
            <div
                className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/95 via-black/70 to-transparent"
                style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}
            >
                <button
                    onClick={onCancel}
                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white"
                >
                    <X className="w-6 h-6" />
                </button>
                <span className="text-white font-semibold text-lg drop-shadow-md">Crop Photo</span>
                <button
                    onClick={handleApplyCrop}
                    disabled={isProcessing}
                    className="px-6 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                    {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        "Apply"
                    )}
                </button>
            </div>

            {/* Zoom Controls Overlay */}
            <div
                className="absolute bottom-0 left-0 right-0 z-10 p-6 flex flex-col gap-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent"
                style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
            >
                <div className="flex items-center gap-4">
                    <span className="text-white/80 text-sm font-medium">Zoom</span>
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(e.target.value)}
                        className="flex-1 accent-brand-purple"
                    />
                </div>
            </div>
        </div>
    );
};

export default ImageCropper;
