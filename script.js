// Sobel operator kernels
const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
];

const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
];

// Function to apply the Sobel operator to a 2D array
function sobelEdgeDetection(dataframe) {
    const width = dataframe[0].length;
    const height = dataframe.length;
    const gradientMagnitude = new Array(height).fill().map(() => new Array(width).fill(0));

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            let gx = 0;
            let gy = 0;

            for (let ky = 0; ky < 3; ky++) {
                for (let kx = 0; kx < 3; kx++) {
                    gx += sobelX[ky][kx] * dataframe[y + ky - 1][x + kx - 1];
                    gy += sobelY[ky][kx] * dataframe[y + ky - 1][x + kx - 1];
                }
            }

            gradientMagnitude[y][x] = Math.sqrt(gx * gx + gy * gy);
        }
    }

    return gradientMagnitude;
}

// Process each frame from the video tag
function processFrame(frameData, width, height) {
    // Convert frameData to a 2D array
    const dataframe = [];
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            // Average the RGB values to get grayscale
            const grayValue = (frameData[index] + frameData[index + 1] + frameData[index + 2]) / 3;
            row.push(grayValue);
        }
        dataframe.push(row);
    }

    // Apply Sobel edge detection
    const edgeData = sobelEdgeDetection(dataframe);

    // Convert edgeData back to a 1D array
    const edgeDataArray = edgeData.flat();

    return edgeDataArray;
}

// Main function
document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size equal to video size
    video.addEventListener('loadedmetadata', function() {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    });

    // Draw Sobel edges on canvas
    video.addEventListener('play', function() {
        const drawFrame = () => {
            if (video.paused || video.ended) {
                return;
            }

            // Draw video frame on canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Get image data from canvas
            const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Process the frame
            const edgeData = processFrame(frameData.data, canvas.width, canvas.height);

            // Put the processed data onto the canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const outputImageData = ctx.createImageData(canvas.width, canvas.height);
            for (let i = 0; i < edgeData.length; i++) {
                const value = edgeData[i];
                outputImageData.data[i * 4] = value;
                outputImageData.data[i * 4 + 1] = value;
                outputImageData.data[i * 4 + 2] = value;
                outputImageData.data[i * 4 + 3] = 255; // Alpha channel
            }
            ctx.putImageData(outputImageData, 0, 0);

            requestAnimationFrame(drawFrame);
        };

        drawFrame();
    });
});
