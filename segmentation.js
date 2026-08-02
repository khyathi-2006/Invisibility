import {
  FilesetResolver,
  ImageSegmenter
} from "@mediapipe/tasks-vision";

let segmenter = null;

export async function initializeSegmentation() {
  if (segmenter) {
    return segmenter;
  }

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );

  segmenter = await ImageSegmenter.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite"
    },
    runningMode: "VIDEO",
    outputCategoryMask: true
  });

  console.log("MediaPipe Segmentation Ready");

  return segmenter;
}

export async function detectPerson(segmenter, video) {
  if (!segmenter || !video || video.readyState < 2) {
    return null;
  }

  try {
    const result = segmenter.segmentForVideo(
      video,
      performance.now()
    );

    if (!result || !result.categoryMask) {
      return null;
    }

    return result.categoryMask.getAsFloat32Array();
  } catch (error) {
    console.error("Segmentation Error:", error);
    return null;
  }
}
