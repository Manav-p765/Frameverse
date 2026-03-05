export const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.addEventListener("load", () => resolve(img));
        img.addEventListener("error", (err) => reject(err));
        img.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return null;
    }

    // Set logical size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    // Return base64 string AND raw Blob to upload properly
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Canvas is empty"));
                return;
            }
            blob.name = "cropped.jpeg";

            const fileUrl = window.URL.createObjectURL(blob);
            const reader = new FileReader();

            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                resolve({
                    file: blob,              // The File/Blob to append to FormData
                    url: reader.result,      // The Data URL string for the <img> src preview
                });
            };
        }, "image/jpeg", 0.95);
    });
};
