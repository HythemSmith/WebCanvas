// Function to convert frame data to grayscale
function toGrayscale(frameData) {
  const grayScaleData = [];

  for (let i = 0; i < frameData.length; i += 4) {
    const r = frameData[i];
    const g = frameData[i + 1];
    const b = frameData[i + 2];
    const gray = 0.299 * r + 0.587 * g + 0.114 * b; // Grayscale conversion formula
    grayScaleData.push(gray);
  }

  return grayScaleData;
}

// Function to apply Gaussian blur to an image
function gaussianBlur(frameData, width, height) {
  const blurredData = new Array(frameData.length);

  // Gaussian blur kernel
  const kernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1],
  ];

  const kernelSize = 3;
  const kernelRadius = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0;
      let weight = 0;

      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const pixelX = x + kx - kernelRadius;
          const pixelY = y + ky - kernelRadius;

          if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
            const kernelValue = kernel[ky][kx];
            const pixelIndex = pixelY * width + pixelX;
            sum += frameData[pixelIndex] * kernelValue;
            weight += kernelValue;
          }
        }
      }

      const index = y * width + x;
      blurredData[index] = sum / weight;
    }
  }

  return blurredData;
}

// Function to compute gradient magnitude and direction using the Sobel operator
function sobelOperator(frameData, width, height) {
  const gradientMagnitude = new Array(frameData.length);
  const gradientDirection = new Array(frameData.length);

  // Sobel operator kernels
  const sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1],
  ];

  const sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1],
  ];

  const kernelSize = 3;
  const kernelRadius = Math.floor(kernelSize / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let gx = 0;
      let gy = 0;

      for (let ky = 0; ky < kernelSize; ky++) {
        for (let kx = 0; kx < kernelSize; kx++) {
          const pixelX = x + kx - kernelRadius;
          const pixelY = y + ky - kernelRadius;

          if (pixelX >= 0 && pixelX < width && pixelY >= 0 && pixelY < height) {
            const pixelIndex = pixelY * width + pixelX;
            const kernelValueX = sobelX[ky][kx];
            const kernelValueY = sobelY[ky][kx];
            gx += frameData[pixelIndex] * kernelValueX;
            gy += frameData[pixelIndex] * kernelValueY;
          }
        }
      }

      const index = y * width + x;
      gradientMagnitude[index] = Math.sqrt(gx * gx + gy * gy);
      gradientDirection[index] = Math.atan2(gy, gx);
    }
  }

  return { gradientMagnitude, gradientDirection };
}

// Function to perform non-maximum suppression
function nonMaximumSuppression(
  gradientMagnitude,
  gradientDirection,
  width,
  height
) {
  const suppressedMagnitude = new Array(gradientMagnitude.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      let angle = gradientDirection[index];

      // Get neighboring pixels
      let dx1, dy1, dx2, dy2;
      if (angle < 0) angle += Math.PI;
      angle *= 180 / Math.PI;
      if ((angle >= 0 && angle < 22.5) || (angle >= 157.5 && angle < 180)) {
        dx1 = -1;
        dy1 = 0;
        dx2 = 1;
        dy2 = 0;
      } else if (angle >= 22.5 && angle < 67.5) {
        dx1 = -1;
        dy1 = 1;
        dx2 = 1;
        dy2 = -1;
      } else if (angle >= 67.5 && angle < 112.5) {
        dx1 = 0;
        dy1 = 1;
        dx2 = 0;
        dy2 = -1;
      } else {
        dx1 = -1;
        dy1 = -1;
        dx2 = 1;
        dy2 = 1;
      }

      const neighborIndex1 = (y + dy1) * width + (x + dx1);
      const neighborIndex2 = (y + dy2) * width + (x + dx2);

      // Perform non-maximum suppression
      const currentMagnitude = gradientMagnitude[index];
      const neighborMagnitude1 =
        neighborIndex1 >= 0 && neighborIndex1 < gradientMagnitude.length
          ? gradientMagnitude[neighborIndex1]
          : 0;
      const neighborMagnitude2 =
        neighborIndex2 >= 0 && neighborIndex2 < gradientMagnitude.length
          ? gradientMagnitude[neighborIndex2]
          : 0;

      if (
        currentMagnitude >= neighborMagnitude1 &&
        currentMagnitude >= neighborMagnitude2
      ) {
        suppressedMagnitude[index] = currentMagnitude;
      } else {
        suppressedMagnitude[index] = 0;
      }
    }
  }

  return suppressedMagnitude;
}

// Function to apply hysteresis thresholding
function hysteresisThresholding(
  gradientMagnitude,
  lowThreshold,
  highThreshold,
  width,
  height
) {
  const edgeData = new Array(gradientMagnitude.length).fill(0);

  const stack = [];
  const visited = new Array(gradientMagnitude.length).fill(false);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;

      if (gradientMagnitude[index] >= highThreshold && !visited[index]) {
        stack.push(index);
        visited[index] = true;

        while (stack.length > 0) {
          const currentIndex = stack.pop();
          edgeData[currentIndex] = 255; // Set as edge pixel
          const currentY = Math.floor(currentIndex / width);
          const currentX = currentIndex % width;

          // Check neighbors
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              const neighborX = currentX + dx;
              const neighborY = currentY + dy;
              const neighborIndex = neighborY * width + neighborX;

              if (
                neighborX >= 0 &&
                neighborX < width &&
                neighborY >= 0 &&
                neighborY < height &&
                gradientMagnitude[neighborIndex] >= lowThreshold &&
                !visited[neighborIndex]
              ) {
                stack.push(neighborIndex);
                visited[neighborIndex] = true;
              }
            }
          }
        }
      }
    }
  }

  return edgeData;
}

// Process each frame from the video tag
function processFrame(frameData, width, height) {
  // Step 1: Convert to Grayscale
  const grayScaleData = toGrayscale(frameData);

  // Step 2: Apply Gaussian blur
  const blurredData = gaussianBlur(grayScaleData, width, height);

  // Step 3: Compute gradient magnitude and direction
  const { gradientMagnitude, gradientDirection } = sobelOperator(
    blurredData,
    width,
    height
  );

  // Step 4: Perform non-maximum suppression
  const suppressedMagnitude = nonMaximumSuppression(
    gradientMagnitude,
    gradientDirection,
    width,
    height
  );

  // Step 5: Apply hysteresis thresholding
  const edgeData = hysteresisThresholding(
    suppressedMagnitude,
    20,
    50,
    width,
    height
  );

  return edgeData;
}

// Main function
document.addEventListener("DOMContentLoaded", () => {
  const video = document.getElementById("video");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // Set canvas size equal to video size
  video.addEventListener("loadedmetadata", function () {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
  });

  // Draw Canny edges on canvas
  video.addEventListener("play", function () {
    const drawFrame = () => {
      if (video.paused || video.ended) {
        return;
      }

      // Draw video frame on canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get image data from canvas
      const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Process the frame
      const edgeData = processFrame(
        frameData.data,
        canvas.width,
        canvas.height
      );

      // Put the processed data onto the canvas
      const processedImageData = new Uint8ClampedArray(edgeData);
      const processedFrameData = new ImageData(
        processedImageData,
        canvas.width,
        canvas.height
      );
      ctx.putImageData(processedFrameData, 0, 0);

      requestAnimationFrame(drawFrame);
    };

    drawFrame();
  });
});
