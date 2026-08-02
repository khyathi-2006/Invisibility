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


let stream;
let running = false;

let backgroundImage = null;
let invisible = false;

let segmentation;
let hands;


let lastTime = performance.now();
let frames = 0;
let fps = 0;


/*
    Start webcam
*/
async function startCamera(){

    if(!navigator.mediaDevices){

        statusText.textContent =
            "Browser does not support camera";

        return;

    }


    try{

        console.log("STEP 1: Starting camera");

        statusText.textContent =
            "Requesting camera access...";


        stream = await navigator.mediaDevices.getUserMedia({

            video:true,
            audio:false

        });


        console.log("STEP 2: Camera permission granted");


        video.srcObject = stream;


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


        console.log("STEP 4: Loading segmentation");


        segmentation =
            await initializeSegmentation();


        console.log("STEP 5: Segmentation loaded");


        hands =
            await initializeHands();


        console.log("STEP 6: Hands loaded");


        running = true;


        statusText.textContent =
            "Camera running";


        render();


    }
    catch(error){

        console.error(
            "FAILED AT:",
            error
        );


        statusText.textContent =
            "ERROR: " +
            error.name +
            " | " +
            error.message;

    }

}



/*
    Capture background
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

        temp.width,

        temp.height

    );



    backgroundImage =
        tctx.getImageData(

            0,

            0,

            temp.width,

            temp.height

        );



    statusText.textContent =
        "Background captured";


}





/*
    Main rendering loop
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




    if(gesture === "pinch"){

        invisible = !invisible;

    }




    if(invisible && backgroundImage){


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
    Replace person pixels
*/
function applyInvisibility(frame, mask, background){


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


            data[i + 1] =
                bg[i + 1];


            data[i + 2] =
                bg[i + 2];

        }


    }


}






/*
    FPS calculation
*/
function calculateFPS(){


    frames++;


    const now =
        performance.now();



    if(now - lastTime >= 1000){


        fps = frames;


        frames = 0;


        lastTime = now;


        fpsText.textContent =
            fps;


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
startBtn.onclick =
    startCamera;


captureBtn.onclick =
    captureBackground;


screenshotBtn.onclick =
    screenshot;
