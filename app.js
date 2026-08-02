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


let lastGesture = "";
let gestureCooldown = false;



// ==========================
// START CAMERA
// ==========================

async function startCamera(){

    if(running){
        return;
    }


    try{

        console.log("STEP 1: Checking camera");


        if(!navigator.mediaDevices){

            throw new Error(
                "Camera API not supported"
            );

        }


        console.log(
            "Secure Context:",
            window.isSecureContext
        );


        statusText.textContent =
            "Requesting camera permission...";



        stream =
        await navigator.mediaDevices.getUserMedia({

            video:{
                width:{
                    ideal:1280
                },

                height:{
                    ideal:720
                },

                facingMode:"user"
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
            "Camera Error:",
            error
        );


        statusText.textContent =
            "Camera Error: " +
            String(error);



        if(stream){

            stream
            .getTracks()
            .forEach(track=>track.stop());

        }


    }

}



// ==========================
// CAPTURE BACKGROUND
// ==========================

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



    const tempCtx =
        temp.getContext("2d");



    tempCtx.drawImage(

        video,

        0,

        0,

        temp.width,

        temp.height

    );



    backgroundImage =
        tempCtx.getImageData(

            0,

            0,

            temp.width,

            temp.height

        );



    statusText.textContent =
        "Background captured";


}



// ==========================
// RENDER LOOP
// ==========================

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




    try{


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




        if(
            gesture === "pinch" &&
            lastGesture !== "pinch" &&
            !gestureCooldown
        ){


            invisible =
                !invisible;



            gestureCooldown = true;


            setTimeout(()=>{

                gestureCooldown = false;

            },1000);


        }



        lastGesture =
            gesture;



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


    }


    catch(error){

        console.error(
            "Processing error:",
            error
        );

    }




    calculateFPS();


    requestAnimationFrame(render);


}



// ==========================
// INVISIBILITY EFFECT
// ==========================

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
        let i=0;
        i<data.length;
        i+=4
    ){


        const person =
            mask[i/4];



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



// ==========================
// FPS
// ==========================

function calculateFPS(){


    frames++;


    const now =
        performance.now();



    if(
        now-lastTime >=1000
    ){


        fpsText.textContent =
            frames;



        frames = 0;


        lastTime = now;


    }


}



// ==========================
// SCREENSHOT
// ==========================

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




// ==========================
// BUTTON EVENTS
// ==========================

startBtn.addEventListener(
    "click",
    startCamera
);


captureBtn.addEventListener(
    "click",
    captureBackground
);


screenshotBtn.addEventListener(
    "click",
    screenshot
);
