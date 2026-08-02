import { initializeSegmentation, detectPerson } 
from "./segmentation.js";

import { initializeHands, detectGesture } 
from "./gesture.js";



const video =
document.getElementById("video");


const canvas =
document.getElementById("canvas");


const ctx =
canvas.getContext("2d");



const startBtn =
document.getElementById("startBtn");


const captureBtn =
document.getElementById("captureBtn");


const screenshotBtn =
document.getElementById("screenshotBtn");



const statusText =
document.getElementById("statusText");


const fpsText =
document.getElementById("fps");





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





// ==========================
// CAMERA START
// ==========================

async function startCamera(){


try{


console.log("Camera starting");



stream =
await navigator.mediaDevices.getUserMedia({

    video:{
        width:1280,
        height:720,
        facingMode:"user"
    },

    audio:false

});



console.log("Camera permission OK");



video.srcObject = stream;



await video.play();



video.onloadeddata = async ()=>{


console.log(
"Video ready",
video.videoWidth,
video.videoHeight
);



canvas.width =
video.videoWidth || 1280;


canvas.height =
video.videoHeight || 720;



statusText.textContent =
"Loading AI models...";



segmentation =
await initializeSegmentation();



console.log(
"Segmentation loaded"
);



hands =
await initializeHands();



console.log(
"Hands loaded"
);



running = true;



statusText.textContent =
"Camera running";



render();



};



}


catch(error){


console.error(
"Camera error",
error
);



statusText.textContent =
"Camera Error: "
+
(error.message || error);


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



backgroundImage =
ctx.getImageData(

0,

0,

canvas.width,

canvas.height

);



statusText.textContent =
"Background captured";



}







// ==========================
// AI LOOP
// ==========================


async function render(){



if(!running)
return;




ctx.drawImage(

video,

0,

0,

canvas.width,

canvas.height

);



let frame =
ctx.getImageData(

0,

0,

canvas.width,

canvas.height

);




let mask =
await detectPerson(

segmentation,

video

);



let gesture =
await detectGesture(

hands,

video

);





if(

gesture === "pinch"

&&

lastGesture !== "pinch"

&&

!gestureLock

){



invisible =
!invisible;



gestureLock = true;



setTimeout(()=>{

gestureLock=false;

},1000);



}



lastGesture =
gesture;





if(

invisible

&&

backgroundImage

&&

mask

){



for(
let i=0;
i<frame.data.length;
i+=4
){



if(mask[i/4] > 0.5){


frame.data[i] =
backgroundImage.data[i];


frame.data[i+1] =
backgroundImage.data[i+1];


frame.data[i+2] =
backgroundImage.data[i+2];


}



}



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



updateFPS();



requestAnimationFrame(render);



}







// ==========================
// FPS
// ==========================


function updateFPS(){


frames++;


let now =
performance.now();



if(now-lastTime >=1000){


fpsText.textContent =
frames;


frames=0;


lastTime=now;


}



}






// ==========================
// SCREENSHOT
// ==========================


function screenshot(){


let link =
document.createElement("a");



link.download =
"ghost.png";



link.href =
canvas.toDataURL();



link.click();



}







startBtn.onclick =
startCamera;


captureBtn.onclick =
captureBackground;


screenshotBtn.onclick =
screenshot;
