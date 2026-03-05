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
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
            {/* Top Header */}
            <div className="flex items-center justify-between p-4 bg-black/60 backdrop-blur-md z-10 shrink-0">
                <button
                    onClick={onCancel}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                    <X className="w-6 h-6 text-white" />
                </button>
                <span className="text-white font-medium">Crop Photo</span>
                <button
                    onClick={handleApplyCrop}
                    disabled={isProcessing}
                    className="p-2 bg-brand-purple hover:bg-brand-purple/80 rounded-full transition-colors disabled:opacity-50"
                >
                    {isProcessing ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <Check className="w-6 h-6 text-white" />
                    )}
                </button>
            </div>

            {/* Cropper Container */}
            <div className="relative flex-1 w-full bg-black">
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

            {/* Bottom Controls */}
            <div className="p-6 bg-black/60 backdrop-blur-md shrink-0 flex items-center justify-center gap-4">
                <span className="text-white/70 text-sm">Zoom:</span>
                <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(e.target.value)}
                    className="flex-1 max-w-xs accent-brand-purple"
                />
            </div>
        </div>
    );
};

export default ImageCropper;
