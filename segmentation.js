import {
    FilesetResolver,
    ImageSegmenter
} from "@mediapipe/tasks-vision";


let segmenter;


/*
    Load MediaPipe Selfie Segmentation
*/
export async function initializeSegmentation(){

    const vision =
        await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
        );


    segmenter =
        await ImageSegmenter.createFromOptions(
            vision,
            {
                baseOptions:{
                    modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite"
                },

                runningMode:"VIDEO",

                outputCategoryMask:true
            }
        );


    return segmenter;

}



/*
    Detect human body mask
*/
export async function detectPerson(
    segmenter,
    video
){

    const result =
        segmenter.segmentForVideo(
            video,
            performance.now()
        );


    const mask =
        result.categoryMask;


    if(!mask){

        return new Float32Array(
            video.videoWidth *
            video.videoHeight
        );

    }


    const values =
        mask.getAsFloat32Array();


    return values;

}
