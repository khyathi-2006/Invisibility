import { initializeSegmentation, detectPerson } from "./segmentation.js";
import { initializeHands, detectGesture } from "./gesture.js";


const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");


const startBtn = document.getElementById("startBtn");
const captureBtn = document.getElementById("captureBtn");
const screenshotBtn = document.getElementById("screenshotBtn");


const statusText = document.getElementById("statusText");
const fpsText = document.getElementById("fps");


let stream = null;
let running = false;

let backgroundImage = null;
let invisible = false;

let segmentation = null;
let hands = null;


let lastTime = performance.now();
let frames = 0;

let lastGestureTime = 0;



/*
    Start Camera
*/
async function startCamera(){


    if(running){

        console.log("Camera already running");
        return;

    }



    if(!navigator.mediaDevices ||
       !navigator.mediaDevices.getUserMedia){


        statusText.textContent =
            "Camera API not supported";


        return;

    }



    try{


        console.log("STEP 1: Starting camera");


        statusText.textContent =
            "Requesting camera access...";



        video.setAttribute(
            "playsinline",
            true
        );



        stream =
            await navigator.mediaDevices.getUserMedia({

                video:{

                    facingMode:"user",

                    width:{
                        ideal:1280
                    },

                    height:{
                        ideal:720
                    }

                },

                audio:false

            });



        console.log(
            "STEP 2: Camera permission granted"
        );



        video.srcObject = stream;



        await new Promise((resolve)=>{


            video.onloadedmetadata = ()=>{

                resolve();

            };


        });



        await video.play();



        console.log(
            "STEP 3: Video started",
            video.videoWidth,
            video.videoHeight
        );



        canvas.width =
            video.videoWidth || 1280;


        canvas.height =
            video.videoHeight || 720;




        statusText.textContent =
            "Loading AI models...";



        console.log(
            "STEP 4: Loading segmentation"
        );



        segmentation =
            await initializeSegmentation();



        console.log(
            "STEP 5: Segmentation loaded"
        );



        hands =
            await initializeHands();



        console.log(
            "STEP 6: Hands loaded"
        );



        running = true;



        statusText.textContent =
            "Camera running";



        render();



    }

    catch(error){


        console.error(
            "CAMERA ERROR:",
            error
        );



        console.error(
            error.name,
            error.message
        );



        if(error.name === "NotAllowedError"){


            statusText.textContent =
                "Camera permission denied";


        }
        else if(error.name === "NotFoundError"){


            statusText.textContent =
                "Camera not found";


        }
        else if(error.name === "NotReadableError"){


            statusText.textContent =
                "Camera already in use";


        }
        else{


            statusText.textContent =
                "Camera Error: " +
                error.message;


        }


    }


}







/*
    Capture Background
*/
function captureBackground(){


    if(!running){


        statusText.textContent =
            "Start camera first";


        return;


    }



    const temp =
        document.createElement("canvas");



    temp.width =
        canvas.width;



    temp.height =
        canvas.height;



    const tctx =
        temp.getContext("2d");



    tctx.drawImage(

        video,

        0,

        0,

        canvas.width,

        canvas.height

    );



    backgroundImage =
        tctx.getImageData(

            0,

            0,

            canvas.width,

            canvas.height

        );



    statusText.textContent =
        "Background captured";


}








/*
    Render Loop
*/
async function render(){


    if(!running)
        return;



    if(video.readyState < 2){


        requestAnimationFrame(render);

        return;


    }




    ctx.drawImage(

        video,

        0,

        0,

        canvas.width,

        canvas.height

    );



    const frame =
        ctx.getImageData(

            0,

            0,

            canvas.width,

            canvas.height

        );




    const mask =
        await detectPerson(

            segmentation,

            video

        );



    const gesture =
        await detectGesture(

            hands,

            video

        );




    const now =
        Date.now();



    if(
        gesture === "pinch" &&
        now - lastGestureTime > 1000
    ){


        invisible =
            !invisible;


        lastGestureTime =
            now;


    }




    if(
        invisible &&
        backgroundImage &&
        mask
    ){


        applyInvisibility(

            frame,

            mask,

            backgroundImage

        );



        ctx.putImageData(

            frame,

            0,

            0

        );



        statusText.textContent =
            "Invisible Mode ON";


    }

    else{


        statusText.textContent =
            "Normal Mode";


    }



    calculateFPS();



    requestAnimationFrame(render);


}




/*
    Apply Invisible Effect
*/
function applyInvisibility(
    frame,
    mask,
    background
){


    const data =
        frame.data;



    const bg =
        background.data;




    for(
        let i = 0;
        i < data.length;
        i += 4
    ){


        const person =
            mask[i / 4];



        if(person > 0.5){


            data[i] =
                bg[i];


            data[i+1] =
                bg[i+1];


            data[i+2] =
                bg[i+2];


        }


    }


}



/*
    FPS
*/
function calculateFPS(){


    frames++;


    const now =
        performance.now();



    if(now - lastTime >= 1000){


        fpsText.textContent =
            frames;


        frames = 0;


        lastTime =
            now;


    }


}


/*
    Screenshot
*/
function screenshot(){


    const link =
        document.createElement("a");



    link.download =
        "ghost-screenshot.png";

    link.href =
        canvas.toDataURL(
            "image/png"
        );



    link.click();


}


/*
    Buttons
*/
if(startBtn)
    startBtn.onclick = startCamera;


if(captureBtn)
    captureBtn.onclick = captureBackground;


if(screenshotBtn)
    screenshot.onclick = screenshot;
