import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

const CropImageModal = ({ image, onCropComplete, onClose }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => {
        setCrop(crop);
    };

    const onCropCompleteCallback = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const onZoomChange = (zoom) => {
        setZoom(zoom);
    };

    const createImage = (url) =>
        new Promise((resolve, reject) => {
            const image = new Image();
            image.addEventListener("load", () => resolve(image));
            image.addEventListener("error", (error) => reject(error));
            image.setAttribute("crossOrigin", "anonymous"); // needed to avoid cross-origin issues on CodeSandbox
            image.src = url;
        });

    const getCroppedImg = async (imageSrc, pixelCrop) => {
        const image = await createImage(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
            return null;
        }

        // set canvas size to match the bounding box
        canvas.width = image.width;
        canvas.height = image.height;

        // draw image
        ctx.drawImage(image, 0, 0);

        const croppedCanvas = document.createElement("canvas");

        const croppedCtx = croppedCanvas.getContext("2d");

        if (!croppedCtx) {
            return null;
        }

        croppedCanvas.width = pixelCrop.width;
        croppedCanvas.height = pixelCrop.height;

        croppedCtx.drawImage(
            canvas,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
        );

        // As a blob
        return new Promise((resolve, reject) => {
            croppedCanvas.toBlob((file) => {
                resolve(file);
            }, "image/jpeg");
        });
    };

    const handleCrop = async () => {
        try {
            const croppedImageBlob = await getCroppedImg(image, croppedAreaPixels);
            // Create a File object from the Blob
            const file = new File([croppedImageBlob], "cropped-image.jpg", {
                type: "image/jpeg",
            });
            onCropComplete(file);
        } catch (e) {
            console.error(e);
            alert("Failed to crop image.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-800 flex flex-col h-[80vh] max-h-[600px]">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-900 z-10">
                    <h2 className="text-xl font-bold text-white">Crop Photo</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
                    >
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="relative flex-1 w-full bg-black">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteCallback}
                        onZoomChange={onZoomChange}
                    />
                </div>

                <div className="p-6 bg-gray-900 border-t border-gray-800">
                    <div className="mb-6">
                        <label className="text-sm text-gray-400 mb-2 block font-medium">Zoom</label>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => {
                                setZoom(e.target.value);
                            }}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCrop}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Apply Crop
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CropImageModal;
