// Template code for A2 Fall 2021 -- DO NOT DELETE THIS LINE

var canvas;
var gl;

var program;

var near = 0.1;
var far = 8000;

var left = -6.0;
var right = 6.0;
var ytop = 6.0;
var bottom = -6.0;

var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0);
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0);

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(0.4, 0.4, 0.4, 1.0);
var materialShininess = 30.0;


var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix;
var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye = vec3(0, 0, 0);
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var resetTimerFlag = true;
var animFlag = false;
var prevTime = 0.0;
var useTextures = 1;

var delta = 165 / 60;


// ------------ Images for textures stuff --------------
var texSize = 64;

var image1 = new Array()
for (var i = 0; i < texSize; i++) image1[i] = new Array();
for (var i = 0; i < texSize; i++)
    for (var j = 0; j < texSize; j++)
        image1[i][j] = new Float32Array(4);
for (var i = 0; i < texSize; i++) for (var j = 0; j < texSize; j++) {
    var c = (((i & 0x8) == 0) ^ ((j & 0x8) == 0));
    image1[i][j] = [c, c, c, 1];
}

class Vector {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
    }
}

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4 * texSize * texSize);

for (var i = 0; i < texSize; i++)
    for (var j = 0; j < texSize; j++)
        for (var k = 0; k < 4; k++)
            image2[4 * texSize * i + 4 * j + k] = 255 * image1[i][j][k];


var textureArray = [];


function isLoaded(im) {
    if (im.complete) {
        console.log("loaded");
        return true;
    } else {
        console.log("still not loaded!!!!");
        return false;
    }
}

function loadFileTexture(tex, filename) 
{
    tex.textureWebGL = gl.createTexture();
    tex.image = new Image();
    tex.image.src = filename;
    tex.isTextureReady = false;
    tex.image.onload = function () { handleTextureLoaded(tex); }
    // The image is going to be loaded asyncronously (lazy) which could be
    // after the program continues to the next functions. OUCH!
}
    
    
function loadImageTexture(tex, image) {
    tex.textureWebGL = gl.createTexture();
    tex.image = new Image();
    //tex.image.src = "CheckerBoard-from-Memory" ;

    gl.bindTexture(gl.TEXTURE_2D, tex.textureWebGL);
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
                  gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D);
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                    gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);

    tex.isTextureReady = true;

}

function initTextures() {

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length - 1], "red.jpg");

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length - 1], "orange.png");

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length - 1], "o2.png");

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length - 1], "black.jpg");

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length - 1], "ex.png");

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length - 1], "building.jpg");

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length - 1], "wheels.jpg");


}


function handleTextureLoaded(textureObj) {
    gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(textureObj.image.src);

    textureObj.isTextureReady = true;
}

//----------------------------------------------------------------

function setColor(c) 
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program,
        "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"), materialShininess);
}

function toggleTextures() {
    useTextures = 1 - useTextures;
    gl.uniform1i(gl.getUniformLocation(program,
                                        "useTextures"), useTextures);
}

function waitForTextures1(tex) {
    setTimeout( function() {
    console.log("Waiting for: "+ tex.image.src) ;
    wtime = (new Date()).getTime() ;
    if( !tex.isTextureReady )
    {
        console.log(wtime + " not ready yet") ;
        waitForTextures1(tex) ;
    }
    else
    {
        console.log("ready to render") ;
        window.requestAnimFrame(render);
    }
               },5) ;
    
}

// Takes an array of textures and calls render if the textures are created
function waitForTextures(texs) {
    setTimeout( function() {
               var n = 0 ;
               for ( var i = 0 ; i < texs.length ; i++ )
               {
                    console.log("boo"+texs[i].image.src) ;
                    n = n+texs[i].isTextureReady ;
               }
               wtime = (new Date()).getTime() ;
               if( n != texs.length )
               {
               console.log(wtime + " not ready yet") ;
               waitForTextures(texs) ;
               }
               else
               {
               console.log("ready to render") ;
               window.requestAnimFrame(render);
               }
               },5) ;
    
}

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("WebGL isn't available");
    }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.5, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    // Load canonical objects and their attributes
    Cube.init(program);
    Cylinder.init(9, program);
    Cone.init(9, program);
    Sphere.init(36, program);

    gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);

    // record the locations of the matrices that are used in the shaders
    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    // set a default material
    setColor(materialDiffuse);


    // set the callbacks for the UI elements
    document.getElementById("sliderXi").oninput = function () {
        RX = this.value;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderYi").oninput = function () {
        RY = this.value;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderZi").oninput = function () {
        RZ = this.value;
        window.requestAnimFrame(render);
    };

    document.getElementById("animToggleButton").onclick = function () {
        if (animFlag) {
            animFlag = false;
        } else {
            animFlag = true;
            resetTimerFlag = true;
            window.requestAnimFrame(render);
        }
    };

    document.getElementById("textureToggleButton").onclick = function () {
        toggleTextures();
        window.requestAnimFrame(render);
    };

    var controller = new CameraController(canvas);
    controller.onchange = function (xRot, yRot) {
        RX = xRot;
        RY = yRot;
        window.requestAnimFrame(render);
    };

    // load and initialize the textures
    initTextures();

    // Recursive wait for the textures to load
    waitForTextures(textureArray);
    //setTimeout (render, 100) ;
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    setMV();

}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV();
    Sphere.draw();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV();
    Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modelview matrix with the result
function gTranslate(x, y, z) {
    modelMatrix = mult(modelMatrix, translate([x, y, z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modelview matrix with the result
function gRotate(theta, x, y, z) {
    modelMatrix = mult(modelMatrix, rotate(theta, [x, y, z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modelview matrix with the result
function gScale(sx, sy, sz) {
    modelMatrix = mult(modelMatrix, scale(sx, sy, sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}

var Time = 0;
var numOfScenes = 0;
var sceneLength = [6, 11, 4, 6, 6];
var timeDiff = 0;
var sceneDuration = 0;

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    at = vec3(at[0], at[1], at[2]);
    eye = vec3(eye[0], eye[1], eye[2]);
    eye[1] = eye[1] + 0;

    // set the projection matrix
    //projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    projectionMatrix = perspective(90, 1, near, far);

    // set the camera matrix
    viewMatrix = lookAt(eye, at, up);

    // initialize the modeling matrix stack
    MS = [];
    modelMatrix = mat4();

    // apply the slider rotations
    gRotate(RZ, 0, 0, 1);
    gRotate(RY, 0, 1, 0);
    gRotate(RX, 1, 0, 0);

    // send all the matrices to the shaders
    setAllMatrices();

    // get real time
    var curTime;
    curTime = (new Date()).getTime() / 1000;
    if (resetTimerFlag) {
        prevTime = curTime;
        resetTimerFlag = false;
    }
    timeDiff = curTime - prevTime;
    TIME += timeDiff;
    prevTime = curTime;

    // move to next scene when duration is done 
    if (sceneDuration >= sceneLength[numOfScenes]) {
        numOfScenes++;
        sceneDuration = 0;
    }
    // move to the next scene
    const scenes = [scene, scene1, scene2, scene3, scene4];
    if (numOfScenes < scenes.length) {
    scenes[numOfScenes](sceneDuration);
}
    sceneDuration = sceneDuration + timeDiff;
    Background();
    window.requestAnimFrame(render);
}

// first car
var car = {
    position: new Vector(),
    rotation: new Vector(),
    
    renderCar: function () {
        this.setupCarTransforms();
        // Render the bottom part of the car
        this.renderCarBase();
        // Render the top part of the car
        this.renderCarTop();
        // Render all four wheels
        this.renderCarWheels();
        gPop(); 
    },

    setupCarTransforms: function() {
        gPush();
        gTranslate(this.position.x, this.position.y, this.position.z);
        gRotate(this.rotation.x, 1, 0, 0);
        gRotate(this.rotation.y, 0, 1, 0);
        gRotate(this.rotation.z, 0, 0, 1);
    },

    // create bottom part of car
    renderCarBase: function() {
        gPush();
        gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
        gScale(1.0, 0.5, 1.7);
        drawCube();
        gPop();
    },

    // create the top part of car
    renderCarTop: function() {
        gPush();
        gTranslate(0, 0.7, 0);
        gPush();
        gl.bindTexture(gl.TEXTURE_2D, textureArray[3].textureWebGL);
        gScale(0.7, 0.6, 0.9);
        drawCube();
        gPop();
        gPop();
    },

    // render wheels at diffrent positions
    renderCarWheels: function() {
        const wheelPositions = [
            { x: 1.1, y: -0.6, z: 1 },
            { x: 1.1, y: -0.6, z: -1 },
            { x: -1.1, y: -0.6, z: 1 },
            { x: -1.1, y: -0.6, z: -1 }
        ];
        wheelPositions.forEach(position => this.renderWheel(position));
    },

    // create the wheels
    renderWheel: function(position) {
        gPush();
        gTranslate(position.x, position.y, position.z);
        gRotate(TIME * 500, 1, 0, 0);
        gRotate(90, 0, -1, 0);
        gScale(0.5, 0.5, 0.1);
        gl.bindTexture(gl.TEXTURE_2D, textureArray[6].textureWebGL);
        drawSphere();
        gPop();
    }
};


// second car
var car2 = {
    position: new Vector(),
    rotation: new Vector(),

    renderCar: function () {
        this.setupTransforms();
        // Render the bottom part of the car
        this.renderBottomBody();
        // Render the top part of the car
        this.renderTopBody();
        // Render all four wheels
        this.renderWheels();
        gPop(); 
    },

    setupTransforms: function() {
        gPush();
        gTranslate(this.position.x, this.position.y, this.position.z);
        gRotate(this.rotation.x, 1, 0, 0);
        gRotate(this.rotation.y, 0, 1, 0);
        gRotate(this.rotation.z, 0, 0, 1);
    },

    // create the bottom body
    renderBottomBody: function() {
        gPush();
        gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
        gScale(1.0, 0.5, 1.7);
        drawCube();
        gPop();
    },

    // create the top body
    renderTopBody: function() {
        gPush();
        gTranslate(0, 0.7, 0);
        gPush();
        gl.bindTexture(gl.TEXTURE_2D, textureArray[3].textureWebGL);
        gScale(0.7, 0.6, 0.9);
        drawCube();
        gPop();  
        gPop();
    },

    // render wheels at positions
    renderWheels: function() {
        const wheelPositions = [
            { x: 1.1, y: -0.6, z: 1 },
            { x: 1.1, y: -0.6, z: -1 },
            { x: -1.1, y: -0.6, z: 1 },
            { x: -1.1, y: -0.6, z: -1 }
        ];
        wheelPositions.forEach(position => this.renderWheel(position));
    },

    // create the wheels
    renderWheel: function(position) {
        gPush();
        gTranslate(position.x, position.y, position.z);
        gRotate(TIME * 500, 1, 0, 0);
        gRotate(90, 0, -1, 0);
        gScale(0.5, 0.5, 0.1);
        gl.bindTexture(gl.TEXTURE_2D, textureArray[6].textureWebGL);
        drawSphere();
        gPop();
    }
};


// create the background
function Background() {
    renderFloor();
    renderRightSideBuildings();
    renderLeftSideBuildings();
}

// create the floor
function renderFloor() {
    gPush();
    gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
    gTranslate(0, -2, 0);
    gScale(50, 1, 75);
    drawCube();
    gPop();
}

// render buliding with diffirent postions on the right
function renderRightSideBuildings() {
    const zPositions = [-42, -31, -20, -9, 2, 13, 24, 35];
    zPositions.forEach(z => {
        renderBuilding(0, z);
    });
}

// render buliding with diffirent postions on the left 
function renderLeftSideBuildings() {
    const zPositions = [-42, -31, -20, -9, 2, 13, 24, 35];
    zPositions.forEach(z => {
        renderBuilding(-15, z);
    });
}

// creating the bulidings
function renderBuilding(x, z) {
    gPush();
    gl.bindTexture(gl.TEXTURE_2D, textureArray[5].textureWebGL);
    gTranslate(x, 0, z);
    gScale(3, 12, 3);
    drawCube();
    gPop();
}


// first scene
function scene(sceneDuration) {
    if (sceneDuration === 0) {
        // initialize the car's position
        car.position = {x: -8, y: 0, z: -45};
        // set initial camera view
        at = vec3(car.position.x, car.position.y, car.position.z);
        eye = vec3(car.position.x, 1, car.position.z);
        eye[2] = -50;
    } else {
        // adjust positions and camera through the scene
        moveAndAdjustCamera(sceneDuration);
    }
    car.renderCar();
}

// move and adjust camera for first scene
function moveAndAdjustCamera(sceneDuration) {
    if (sceneDuration < 5) {
        // move car and adjust camera position
        car.position.z += 0.01 * delta;
        at[2] += 0.012 * delta;
        eye[1] += 0.0050 * delta;
        eye[2] += 0.032 * delta;
    } else if (sceneDuration < 8) {
        // move car and adjust camera position
        car.position.z += 0.01 * delta;
        at[2] += 0.012 * delta;
        eye[1] += 0.032 * delta;
        eye[2] += 0.053 * delta;
    }
}

// Second scene
function scene1(sceneDuration) {
    if (sceneDuration === 0) {
        // initialize car2's position
        car2.position = {x: -8, y: 0, z: 45};
        car2.rotation.y = 180;
        at = vec3(car2.position.x, car2.position.y, car2.position.z);
        eye = vec3(car2.position.x, 4, 3);
    } else {
        // Adjust camera and car2's position throughout the scene
        moveAndAdjustCamera1(sceneDuration);
    }
    // Render both cars
    car.renderCar();
    car2.renderCar();
}

// move and adjust camera for second scene
function moveAndAdjustCamera1(sceneDuration) {
    if (sceneDuration <= 6) {
        //adjust camera position
        at = vec3(car2.position.x, car2.position.y, car2.position.z);
        eye = vec3(car2.position.x + 3 * Math.sin(sceneDuration), eye[1], car2.position.z + 3 * Math.cos(sceneDuration));
    } else if (sceneDuration <= 11) {
        // adjust camera postiion
        at = vec3(car2.position.x, car2.position.y, car2.position.z);
        eye[1] += 0.0055 * delta;
    }
    // update car postion
    car2.position.z -= 0.01 * delta;
    eye[2] -= 0.01 * delta;
}

// Third scene
function scene2(sceneDuration) {
    if (sceneDuration === 0) {
        // initialize camera
        at = vec3(car.position.x, car.position.y, car.position.z);
        eye = vec3(car.position.x, 3, car.position.z + 5);
    } else {
        // Adjust camera and car's position throughout the scene
        moveAndAdjustCamera2(sceneDuration);
    }
    // Render both cars
    car.renderCar();
    car2.renderCar();
}

// move and adjust camera for third scene
function moveAndAdjustCamera2(sceneDuration) {
    if (sceneDuration <= 4) {
        // Update position and camera during the scene
        car.position.z += 0.02 * delta;
        at[2] += 0.02 * delta;
        eye[2] += 0.02 * delta;
    }
}

// Fourth scene
function scene3(sceneDuration) {
    if (sceneDuration === 0) {
        // initialize the positions of both cars
        car.position.z += 0.02 * delta;  
        car2.position.z -= 0.01 * delta; 
    }
    // Adjust positions and camera throughout the scene
    moveAndAdjustCamera3(sceneDuration);

    // Render both cars
    car.renderCar();
    car2.renderCar();
}

// move and adjust camera for fourth scene
function moveAndAdjustCamera3(sceneDuration) {
    // Move the cars towards each other
    car.position.z += 0.023 * delta;
    car2.position.z -= 0.023 * delta;

    // adjust camera
    at = vec3(car2.position.x, car2.position.y, car2.position.z);
    eye[2] += 0.0045 * delta;
}

// Fifth scene
function scene4(sceneDuration) {
    if (sceneDuration === 0) {
        // Set initial positions of both cars on the road
        car.position.z += 0.02 * delta;
        car2.position.z -= 0.02 * delta;
    } else {
        // adjust the camera throughout the scene
        moveAndAdjustCamera4(sceneDuration);
    }
    // Render both cars
    car.renderCar();
    car2.renderCar();
}

// move and adjust camera for fifth scene
function moveAndAdjustCamera4(sceneDuration) {
    if (sceneDuration <= 5) {
        // adjust camera
        at = vec3(car2.position.x, car2.position.y, car2.position.z);
        eye[1] += 0.0045 * delta;

        // explosion when cars collide
        gPush();
        gTranslate(car.position.x, car.position.y, car.position.z);
        gScale(2.5, 2.5, 2.5);
        gl.bindTexture(gl.TEXTURE_2D, textureArray[4].textureWebGL);
        drawSphere();
        gPop();
    }
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
    var controller = this;
    this.onchange = null;
    this.xRot = 0;
    this.yRot = 0;
    this.scaleFactor = 3.0;
    this.dragging = false;
    this.curX = 0;
    this.curY = 0;

    // Assign a mouse down handler to the HTML element.
    element.onmousedown = function (ev) {
        controller.dragging = true;
        controller.curX = ev.clientX;
        controller.curY = ev.clientY;
    };

    // Assign a mouse up handler to the HTML element.
    element.onmouseup = function (ev) {
        controller.dragging = false;
    };

    // Assign a mouse move handler to the HTML element.
    element.onmousemove = function (ev) {
        if (controller.dragging) {
            // Determine how far we have moved since the last mouse move
            // event.
            var curX = ev.clientX;
            var curY = ev.clientY;
            var deltaX = (controller.curX - curX) / controller.scaleFactor;
            var deltaY = (controller.curY - curY) / controller.scaleFactor;
            controller.curX = curX;
            controller.curY = curY;
            // Update the X and Y rotation angles based on the mouse motion.
            controller.yRot = (controller.yRot + deltaX) % 360;
            controller.xRot = (controller.xRot + deltaY);
            // Clamp the X rotation to prevent the camera from going upside
            // down.
            if (controller.xRot < -90) {
                controller.xRot = -90;
            } else if (controller.xRot > 90) {
                controller.xRot = 90;
            }
            // Send the onchange event to any listener.
            if (controller.onchange != null) {
                controller.onchange(controller.xRot, controller.yRot);
            }
        }
    };
}