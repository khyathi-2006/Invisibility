import {
    FilesetResolver,
    HandLandmarker
} from "@mediapipe/tasks-vision";


let handLandmarker;


/*
    Initialize MediaPipe Hands
*/
export async function initializeHands(){

    const vision =
        await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
        );


    handLandmarker =
        await HandLandmarker.createFromOptions(
            vision,
            {
                baseOptions:{
                    modelAssetPath:
                    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
                },

                runningMode:"VIDEO",

                numHands:2
            }
        );


    return handLandmarker;

}



/*
    Detect pinch gesture

    Thumb tip  -> landmark 4
    Index tip  -> landmark 8
*/
export async function detectGesture(
    hands,
    video
){

    const result =
        hands.detectForVideo(
            video,
            performance.now()
        );


    if(
        !result.landmarks ||
        result.landmarks.length===0
    ){

        return null;

    }



    for(
        const hand of result.landmarks
    ){

        const thumb =
            hand[4];

        const index =
            hand[8];


        const distance =
            Math.sqrt(
                Math.pow(
                    thumb.x-index.x,
                    2
                )
                +
                Math.pow(
                    thumb.y-index.y,
                    2
                )
            );



        /*
            Pinch detected
        */

        if(distance < 0.05){

            return "pinch";

        }

    }


    return null;

}
