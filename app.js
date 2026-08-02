import { initializeSegmentation, detectPerson } from "./segmentation.js";
import { initializeHands, detectGesture } from "./gesture.js";

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const statusText = document.getElementById("statusText");
const fpsText = document.getElementById("fps");

let stream = null;
let running = false;

let segmentation = null;
let hands = null;

let backgroundImage = null;
let invisible = false;

let lastGesture = "";
let gestureLock = false;

let frames = 0;
let lastTime = performance.now();


// ============================
// START CAMERA
// ============================

async function startCamera() {

    try {

        console.log("Camera starting");

        statusText.textContent = "Requesting camera...";

        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: "user"
            },
            audio: false
        });

        console.log("Camera permission OK");

        video.srcObject = stream;

        video.onloadeddata = async () => {

            console.log("Video ready", video.videoWidth, video.videoHeight);

            canvas.width = video.videoWidth || 1280;
            canvas.height = video.videoHeight || 720;

            try {

                statusText.textContent = "Loading AI models...";

                console.log("Loading segmentation");

                segmentation = await initializeSegmentation();

                console.log("Segmentation loaded");

                hands = await initializeHands();

                console.log("Hands loaded");

                running = true;

                statusText.textContent = "Camera running";

                render();

            } catch (error) {

                console.error("AI loading error", error);

                statusText.textContent = "AI Error: " + error.message;

            }

        };

        await video.play();

    } catch (error) {

        console.error("Camera error", error);

        statusText.textContent =
            "Camera Error: " +
            (error.message || error.name || String(error));

    }

}


// ============================
// CAPTURE BACKGROUND
// ============================

function captureBackground() {

    if (!running) {
        statusText.textContent = "Start camera first";
        return;
    }

    backgroundImage = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    statusText.textContent = "Background Captured";

}


// ============================
// RENDER LOOP
// ============================

async function render() {

    if (!running) return;

    try {

        ctx.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        let frame = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );

        const maskResult = await detectPerson(segmentation, video);

if (!maskResult) {
    requestAnimationFrame(render);
    return;
}

const mask = maskResult.data;
const maskWidth = maskResult.width;
const maskHeight = maskResult.height;

console.log("Mask:", maskWidth, maskHeight);

const gesture = await detectGesture(hands, video);

        // Toggle invisibility using pinch
        if (
            gesture === "pinch" &&
            lastGesture !== "pinch" &&
            !gestureLock
        ) {

            invisible = !invisible;

            gestureLock = true;

            setTimeout(() => {
                gestureLock = false;
            }, 1000);

        }

        lastGesture = gesture;

        if (invisible && backgroundImage) {

    for (let y = 0; y < canvas.height; y++) {

        for (let x = 0; x < canvas.width; x++) {

            const frameIndex = (y * canvas.width + x) * 4;

            const maskX = Math.floor(x * maskWidth / canvas.width);
            const maskY = Math.floor(y * maskHeight / canvas.height);

            const maskIndex = maskY * maskWidth + maskX;

            if (mask[maskIndex] === 1) {

                frame.data[frameIndex] = backgroundImage.data[frameIndex];
                frame.data[frameIndex + 1] = backgroundImage.data[frameIndex + 1];
                frame.data[frameIndex + 2] = backgroundImage.data[frameIndex + 2];

            }

        }

    }

    ctx.putImageData(frame, 0, 0);

    statusText.textContent = "Invisible Mode ON";
} else {

            if (backgroundImage) {
                statusText.textContent = "Ready";
            } else {
                statusText.textContent = "Camera running";
            }

        }

    } catch (error) {

        console.error("Processing error:", error);

        statusText.textContent = "Processing Error";

    } finally {

        updateFPS();

        requestAnimationFrame(render);

    }

}


// ============================
// FPS
// ============================

function updateFPS() {

    frames++;

    const now = performance.now();

    if (now - lastTime >= 1000) {

        fpsText.textContent = frames;

        frames = 0;

        lastTime = now;

    }

}


// ============================
// SCREENSHOT
// ============================

function screenshot() {

    const link = document.createElement("a");

    link.download = "ghost-screenshot.png";

    link.href = canvas.toDataURL("image/png");

    link.click();

}


// ============================
// BUTTON EVENTS
// ============================

window.addEventListener("DOMContentLoaded", () => {

    console.log("APP.JS LOADED");

    const startBtn = document.getElementById("startBtn");
    const captureBtn = document.getElementById("captureBtn");
    const screenshotBtn = document.getElementById("screenshotBtn");

    if (!startBtn || !captureBtn || !screenshotBtn) {

        console.error("Buttons not found.");

        return;

    }

    startBtn.addEventListener("click", async () => {

        if (running) return;

        await startCamera();

    });

    captureBtn.addEventListener("click", captureBackground);

    screenshotBtn.addEventListener("click", screenshot);

});
