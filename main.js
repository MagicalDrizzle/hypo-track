const TITLE = 'Hypo TC Track Maker';
const VERSION = '20200417a';

const WIDTH = 960;
const HEIGHT = 540;
const MAP_WIDTH = 3000;
const MAP_HEIGHT = MAP_WIDTH/2;
const COLORS = ['#5ebaff','#00faf4','#ffffcc','#ffe775','#ffc140','#ff8f20','#ff6060'];

var loadedMapImg,
    mapImg,
    panLocation,
    zoomAmt,
    beginClickX,
    beginClickY,
    beginPanX,
    beginPanY,
    mouseMode,
    dots,
    categoryToPlace,
    selectedDot;

function setup(){
    setVersion(TITLE + ' v',VERSION);
    document.title = TITLE;

    createCanvas(WIDTH,HEIGHT);

    zoomAmt = 0;
    panLocation = createVector(0);
    loadedMapImg = false;
    dots = [];
    categoryToPlace = 0;

    mapImg = createGraphics(MAP_WIDTH,MAP_HEIGHT);
    
    Promise.all([
        loadImg('resources/map_NW.jpg'),
        loadImg('resources/map_NE.jpg'),
        loadImg('resources/map_SW.jpg'),
        loadImg('resources/map_SE.jpg')
    ]).then(imgs=>{
        let nw = imgs[0];
        let ne = imgs[1];
        let sw = imgs[2];
        let se = imgs[3];
        mapImg.image(nw,0,0,MAP_WIDTH/2,MAP_HEIGHT/2);
        mapImg.image(ne,MAP_WIDTH/2,0,MAP_WIDTH/2,MAP_HEIGHT/2);
        mapImg.image(sw,0,MAP_HEIGHT/2,MAP_WIDTH/2,MAP_HEIGHT/2);
        mapImg.image(se,MAP_WIDTH/2,MAP_HEIGHT/2,MAP_WIDTH/2,MAP_HEIGHT/2);
        loadedMapImg = true;
    });
}

function draw(){
    background(255);
    fill(0);
    noStroke();
    if(loadedMapImg)
    {
        image(mapImg,0,HEIGHT-WIDTH/2,WIDTH,WIDTH/2,panLocation.x,panLocation.y,mapViewWidth(),mapViewHeight());
        let dotSize = 2*pow(1.25,zoomAmt);
        for(let i=0;i<dots.length;i++){
            let d = dots[i];
            let coords = longLatToScreenCoords(d);
            if(i<dots.length-1){
                d1 = dots[i+1];
                coords1 = longLatToScreenCoords(d1);
                if(coords.inBounds || coords1.inBounds){
                    noFill();
                    stroke('#ffffff');
                    strokeWeight(dotSize/5);
                    line(coords.x,coords.y,coords1.x,coords1.y);
                }
            }
            if(coords.inBounds){
                fill(COLORS[d.cat]);
                noStroke();
                ellipse(coords.x,coords.y,dotSize,dotSize);
            }
        }
        fill(255);
        noStroke();
        rect(0,0,WIDTH,HEIGHT-WIDTH/2);
        fill(0);
        textAlign(CENTER,CENTER);
        text('TEST',WIDTH/2,(HEIGHT-WIDTH/2)/2);
    }
    else
        text('Loading...', 30,30);
}

function mouseWheel(evt){
    let delta = evt.delta;
    if(mouseX > 0 && mouseX < WIDTH && mouseY > (HEIGHT-WIDTH/2) && mouseY < HEIGHT && loadedMapImg){
        let ow = mapViewWidth();
        let oh = mapViewHeight();
        zoomAmt -= delta/125;
        zoomAmt = constrain(zoomAmt,0,15);
        let nw = mapViewWidth();
        let nh = mapViewHeight();
        let dw = ow - nw;
        let dh = oh - nh;
        let viewerW = WIDTH;
        let viewerH = WIDTH/2;
        let mx = mouseX;
        let my = mouseY - (HEIGHT - viewerH);
        panLocation.x += dw*mx/viewerW;
        panLocation.y += dh*my/viewerH;
        if(panLocation.x < 0)
            panLocation.x = 0;
        if(panLocation.y < 0)
            panLocation.y = 0;
        if(panLocation.x + nw > MAP_WIDTH)
            panLocation.x = MAP_WIDTH - nw;
        if(panLocation.y + nh > MAP_HEIGHT)
            panLocation.y = MAP_HEIGHT - nh;
    }
}

function mousePressed(){
    if(mouseButton === LEFT){
        beginClickX = mouseX;
        beginClickY = mouseY;
        if(keyIsDown(SHIFT)){
            mouseMode = 3;
        }else{
            mouseMode = 0;
            for(let i=dots.length-1;i>=0;i--){
                let d = dots[i];
                let c = longLatToScreenCoords(d);
                if(c.inBounds && sqrt(sq(c.x-mouseX)+sq(c.y-mouseY))<pow(1.25,zoomAmt)){
                    selectedDot = d;
                    mouseMode = 2;
                    break;
                }
            }
        }
    }
}

function mouseReleased(){
    if(mouseButton === LEFT){
        if(mouseMode === 0){
            dots.push(new Dot(mouseLong(),mouseLat(),categoryToPlace));
        }else if(mouseMode === 2){
            selectedDot.long = mouseLong();
            selectedDot.lat = mouseLat();
        }else if(mouseMode === 3){
            for(let i=dots.length-1;i>=0;i--){
                let d = dots[i];
                let c = longLatToScreenCoords(d);
                if(c.inBounds && sqrt(sq(c.x-mouseX)+sq(c.y-mouseY))<pow(1.25,zoomAmt)){
                    dots.splice(i,1);
                    break;
                }
            }
        }
        beginClickX = undefined;
        beginClickY = undefined;
        beginPanX = undefined;
        beginPanY = undefined;
    }
}

function mouseDragged(){
    if(mouseButton === LEFT){
        if(mouseMode === 2 && selectedDot){
            selectedDot.long = mouseLong();
            selectedDot.lat = mouseLat();
        }else{
            mouseMode = 1;
            let mvw = mapViewWidth();
            let mvh = mapViewHeight();
            let viewerW = WIDTH;
            let viewerH = WIDTH/2;
            if(beginPanX === undefined)
                beginPanX = panLocation.x;
            if(beginPanY === undefined)
                beginPanY = panLocation.y;
            let dx = mouseX - beginClickX;
            let dy = mouseY - beginClickY;
            panLocation.x = beginPanX - mvw*dx/viewerW;
            panLocation.y = beginPanY - mvh*dy/viewerH;
            if(panLocation.x < 0)
                panLocation.x = 0;
            if(panLocation.y < 0)
                panLocation.y = 0;
            if(panLocation.x + mvw > MAP_WIDTH)
                panLocation.x = MAP_WIDTH - mvw;
            if(panLocation.y + mvh > MAP_HEIGHT)
                panLocation.y = MAP_HEIGHT - mvh;
        }
    }
}

function keyTyped(){
    if(key === 'd')
        categoryToPlace = 0;
    else if(key === 's')
        categoryToPlace = 1;
    else if(key === '1')
        categoryToPlace = 2;
    else if(key === '2')
        categoryToPlace = 3;
    else if(key === '3')
        categoryToPlace = 4;
    else if(key === '4')
        categoryToPlace = 5;
    else if(key === '5')
        categoryToPlace = 6;
    else return;
    return false;
}

function mapViewWidth(){
    return MAP_WIDTH*pow(1.25,-zoomAmt);
}

function mapViewHeight(){
    return MAP_HEIGHT*pow(1.25,-zoomAmt);
}

function mouseLong(){
    let left = panLocation.x/MAP_WIDTH*360-180;
    let right = (panLocation.x+mapViewWidth())/MAP_WIDTH*360-180;
    return left+mouseX/WIDTH*(right-left);
}

function mouseLat(){
    let top = 90-panLocation.y/MAP_HEIGHT*180;
    let bottom = 90-(panLocation.y+mapViewHeight())/MAP_HEIGHT*180;
    return top+(mouseY-(HEIGHT-WIDTH/2))/(WIDTH/2)*(bottom-top);
}

function longLatToScreenCoords(long,lat){
    if(long instanceof Dot){
        lat = long.lat;
        long = long.long;
    }
    let x = ((long+180)/360*MAP_WIDTH-panLocation.x)/mapViewWidth()*WIDTH;
    let y = ((90-lat)/180*MAP_HEIGHT-panLocation.y)/mapViewHeight()*WIDTH/2+HEIGHT-WIDTH/2;
    let inBounds = x >= 0 && x < WIDTH && y >= (HEIGHT-WIDTH/2) && y < HEIGHT;
    return {x, y, inBounds};
}

function loadImg(path){     // wrap p5.loadImage in a promise
    return new Promise((resolve,reject)=>{
        setTimeout(()=>{
            loadImage(path,resolve,reject);
        });
    });
}

class Dot{
    constructor(long,lat,cat){
        this.long = long || 0;
        this.lat = lat || 0;
        this.cat = cat || 0;
    }
}