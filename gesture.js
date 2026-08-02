import {
    FilesetResolver,
    HandLandmarker
}
from
"https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22";



let handDetector = null;



export async function initializeHands(){


    const vision =
    await FilesetResolver.forVisionTasks(

        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"

    );



    handDetector =
    await HandLandmarker.createFromOptions(

        vision,

        {

            baseOptions:{

                modelAssetPath:

                "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"

            },


            runningMode:"VIDEO",


            numHands:2


        }

    );



    console.log(
        "MediaPipe Hands Ready"
    );



    return handDetector;


}







export async function detectGesture(
    hands,
    video
){


    if(!hands)
        return "";



    const result =
    hands.detectForVideo(

        video,

        performance.now()

    );



    if(
        !result.landmarks ||
        result.landmarks.length===0
    ){

        return "";

    }



    const hand =
    result.landmarks[0];



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



    if(distance < 0.05){

        return "pinch";

    }



    return "";


}
