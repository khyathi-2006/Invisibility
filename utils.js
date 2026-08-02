export function calculateDistance(
    point1,
    point2
){

    return Math.sqrt(
        Math.pow(
            point1.x - point2.x,
            2
        )
        +
        Math.pow(
            point1.y - point2.y,
            2
        )
    );

}



/*
    Resize canvas according to video
*/
export function resizeCanvas(
    video,
    canvas
){

    canvas.width =
        video.videoWidth;

    canvas.height =
        video.videoHeight;

}



/*
    Copy canvas image
*/
export function cloneImageData(
    imageData
){

    return new ImageData(
        new Uint8ClampedArray(
            imageData.data
        ),
        imageData.width,
        imageData.height
    );

}



/*
    Convert canvas to downloadable image
*/
export function downloadCanvas(
    canvas,
    filename="screenshot.png"
){

    const link =
        document.createElement("a");


    link.download =
        filename;


    link.href =
        canvas.toDataURL(
            "image/png"
        );


    link.click();

}



/*
    Sleep helper
*/
export function sleep(ms){

    return new Promise(
        resolve =>
        setTimeout(resolve,ms)
    );

}
