const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let img = new Image();
let paletteArray = [];

document.getElementById("upload").onchange = e=>{
    img.src = URL.createObjectURL(e.target.files[0]);
};

function convertSprite(){

    ctx.clearRect(0,0,64,64);
    ctx.drawImage(img,0,0,64,64);

    let imageData = ctx.getImageData(0,0,64,64);

    reduceColors(imageData);
    imageData = autoCenterSprite(imageData);

    ctx.putImageData(imageData,0,0);

    extractPalette(imageData);

    document.getElementById("download").href =
        canvas.toDataURL("image/png");
}

/* COLOR REDUCTION */

function reduceColors(imageData){

    let data=imageData.data;

    for(let i=0;i<data.length;i+=4){
        data[i]   = Math.floor(data[i]/32)*32;
        data[i+1] = Math.floor(data[i+1]/32)*32;
        data[i+2] = Math.floor(data[i+2]/32)*32;
    }
}

/* AUTO CENTER */

function autoCenterSprite(imageData){

    const w=64,h=64;
    const data=imageData.data;

    let minX=w,minY=h,maxX=0,maxY=0;

    for(let y=0;y<h;y++){
        for(let x=0;x<w;x++){
            let i=(y*w+x)*4;
            if(data[i+3]>0){
                minX=Math.min(minX,x);
                minY=Math.min(minY,y);
                maxX=Math.max(maxX,x);
                maxY=Math.max(maxY,y);
            }
        }
    }

    const spriteWidth=maxX-minX+1;
    const spriteHeight=maxY-minY+1;

    const offsetX=Math.floor((w-spriteWidth)/2)-minX;
    const offsetY=Math.floor((h-spriteHeight)/2)-minY;

    const newImage=new ImageData(w,h);

    for(let y=0;y<h;y++){
        for(let x=0;x<w;x++){

            let src=(y*w+x)*4;

            if(data[src+3]===0) continue;

            let nx=x+offsetX;
            let ny=y+offsetY;

            if(nx<0||ny<0||nx>=w||ny>=h) continue;

            let dst=(ny*w+nx)*4;

            newImage.data[dst]=data[src];
            newImage.data[dst+1]=data[src+1];
            newImage.data[dst+2]=data[src+2];
            newImage.data[dst+3]=data[src+3];
        }
    }

    return newImage;
}

/* PALETTE */

function extractPalette(imageData){

    const colors=new Set();
    let data=imageData.data;

    for(let i=0;i<data.length;i+=4){
        if(data[i+3]===0) continue;
        colors.add(`${data[i]},${data[i+1]},${data[i+2]}`);
    }

    paletteArray=Array.from(colors).slice(0,16);
    renderPalette();
}

function renderPalette(){

    const paletteDiv=document.getElementById("palette");
    paletteDiv.innerHTML="";

    paletteArray.forEach(color=>{

        const box=document.createElement("div");
        box.className="colorBox";
        box.style.backgroundColor=`rgb(${color})`;
        box.draggable=true;

        box.addEventListener("dragstart",()=>{
            box.classList.add("dragging");
        });

        box.addEventListener("dragend",()=>{
            box.classList.remove("dragging");
        });

        paletteDiv.appendChild(box);
    });

    enableDragSort();
}

/* DRAG SORT */

function enableDragSort(){

    const paletteDiv=document.getElementById("palette");

    paletteDiv.addEventListener("dragover",e=>{
        e.preventDefault();

        const dragging=document.querySelector(".dragging");
        const after=getDragAfterElement(paletteDiv,e.clientX);

        if(after==null){
            paletteDiv.appendChild(dragging);
        }else{
            paletteDiv.insertBefore(dragging,after);
        }
    });

    paletteDiv.addEventListener("drop",updatePaletteOrder);
}

function getDragAfterElement(container,x){

    const elements=[...container.querySelectorAll(".colorBox:not(.dragging)")];

    return elements.reduce((closest,child)=>{
        const box=child.getBoundingClientRect();
        const offset=x-box.left-box.width/2;

        if(offset<0 && offset>closest.offset){
            return {offset:offset,element:child};
        }else{
            return closest;
        }
    },{offset:Number.NEGATIVE_INFINITY}).element;
}

function updatePaletteOrder(){

    const boxes=document.querySelectorAll(".colorBox");

    paletteArray=[...boxes].map(box=>
        box.style.backgroundColor.replace("rgb(","").replace(")","")
    );

    console.log("Palette Order:",paletteArray);
}
