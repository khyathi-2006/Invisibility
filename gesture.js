import {
  FilesetResolver,
  HandLandmarker
} from "@mediapipe/tasks-vision";

let handDetector = null;

export async function initializeHands() {
  if (handDetector) {
    return handDetector;
  }

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );

  handDetector = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
    },
    runningMode: "VIDEO",
    numHands: 2
  });

  console.log("MediaPipe Hands Ready");

  return handDetector;
}

export async function detectGesture(hands, video) {
  if (!hands || !video || video.readyState < 2) {
    return "";
  }

  try {
    const result = hands.detectForVideo(video, performance.now());

    if (
      !result ||
      !result.landmarks ||
      result.landmarks.length === 0
    ) {
      return "";
    }

    const hand = result.landmarks[0];

    const thumbTip = hand[4];
    const indexTip = hand[8];

    const distance = Math.hypot(
      thumbTip.x - indexTip.x,
      thumbTip.y - indexTip.y
    );

    if (distance < 0.05) {
      return "pinch";
    }

    return "";
  } catch (error) {
    console.error("Gesture Detection Error:", error);
    return "";
  }
}
