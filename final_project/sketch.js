let rotX = 0;
let rotY = 0;

let dragging = false;
let lastX, lastY;

let autoSpin = 0;

let roofNodes = [];

let fragments = [];
let maxReality = 150;
let globalAngle = 0;

let osc;
let osc2;
let recordedNotes = [];
let noteIndex = 0;
let lastNoteTime = 0;

let collapse = false;
let collapseStart = false;
let collapseTime = 0;
let collapseAge;

let flashCount = 3;
let flashGap = 250;
let flashLength = 120;

let music;
let cam;

let handpose;
let predictions = [];

let handX = 0;
let handY = 0;
let lastHandX = 0;
let lastHandY = 0;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  angleMode(RADIANS);

  // initialise the oscillator https://p5js.org/reference/p5.sound/ and https://p5js.org/tutorials/simple-melody-app/
  osc = new p5.Oscillator();
  osc.setType("sine");
  osc.start();
  osc.amp(0);

  osc2 = new p5.Oscillator();
  osc2.setType("triangle");
  osc2.start();
  osc2.amp(0);

  // initialise the fragments
  for (let i = 0; i < maxReality; i++) {
    fragments.push(
      new Fragment(
        random(-300, 300),
        random(-100, 100),
        random(-300, 300),
        "reality",
        0
      )
    );
  }

  // adding one dream fragment
  fragments.push(new Fragment(0, 0, 0, "dream", 4));

  // learn video capture in the website https://p5js.org/examples/imported-media-video-capture/
  cam = createCapture(VIDEO);
  cam.size(320, 240);
  cam.hide();

  // learn the handpose on website https://archive-docs.ml5js.org/#/reference/handpose
  handpose = ml5.handpose(cam, modelLoaded);

  handpose.on("predict", (results) => {
    predictions = results;
  });
}

function modelLoaded() {
  console.log("Model Loaded!");
}

function preload() {
  music = loadSound("1.mp3");
}

function draw() {
  background(10, 10, 20);

  //
  push();
  translate(-width / 2 + 20, -height / 2 + 20, -500);

  //mirror
  scale(-1, 1);

  texture(cam);
  plane(320, 240);

  pop();

  collapseAge = millis() - collapseTime;

  autoSpin += 0.01;

  rotateX(rotX);
  rotateY(rotY + autoSpin);

  drawMusicBox();

  globalAngle += 0.002;

  push();

  for (let f of fragments) {
    f.update();
    f.display();
  }

  if (collapse) {
    playRecordedLoop();

    for (let i = 0; i < flashCount; i++) {
      let start = i * flashGap;
      let end = start + flashLength;

      if (collapseAge > start && collapseAge < end) {
        push();

        noStroke();
        fill(255, 255, 255, 120);

        sphere(1000);

        pop();

        osc2.freq(60);
        osc2.amp(0.4, 0.01);
        osc2.amp(0, 0.2);
      }
    }
  }

  // freeze moment
  if (collapse && collapseAge < 1000) {
    pop();
    return;
  }

  pop();

  // written by chatgpt5.2
  infectionCheck();
  recursiveSpread();

  if (fragments.length > 500 && !collapseStart) {
    collapse = true;
    collapseStart = true;
    collapseTime = millis();
  }

  if (collapse && music.isPlaying()) {
    music.stop();
  }

  // learn how to use hand in the sketch https://github.com/ml5js/ml5-library/blob/main/examples/p5js/Handpose/Handpose_Webcam/sketch.js
  if (predictions.length > 0) {
    let hand = predictions[0];
    let palm = hand.landmarks[9];

    let currentX = palm[0];
    let currentY = palm[1];

    // initialise
    if (lastHandX === 0 && lastHandY === 0) {
      lastHandX = currentX;
      lastHandY = currentY;
    }

    let dx = currentX - lastHandX;
    let dy = currentY - lastHandY;

    dx = lerp(0, dx, 0.5);
    dy = lerp(0, dy, 0.5);

    rotY += -dx * 0.01;
    rotX += -dy * 0.01;

    rotX = constrain(rotX, -PI / 2, PI / 2);

    lastHandX = currentX;
    lastHandY = currentY;
  }
}

function drawMusicBox() {
  roofNodes = [];

  stroke(255);
  strokeWeight(1);
  noFill();

  // top
  let top = createVector(0, -180, 0);

  drawNode(top);

  let r = 120;
  let y = -120;

  // roof
  for (let i = 0; i < 12; i++) {
    let a = map(i, 0, 12, 0, TWO_PI);

    let x = cos(a) * r;
    let z = sin(a) * r;

    let node = createVector(x, y, z);

    roofNodes.push(node);

    line(top.x, top.y, top.z, x, y, z);

    drawNode(node);
  }

  // dome ring
  for (let i = 0; i < roofNodes.length; i++) {
    let a = roofNodes[i];
    let b = roofNodes[(i + 1) % roofNodes.length];

    line(a.x, a.y, a.z, b.x, b.y, b.z);
  }

  drawPillars();

  push();
  rotateY(frameCount * 0.02);
  drawPlatform();
  pop();

  drawBase();
}

// nodes
function drawNode(v) {
  push();
  translate(v.x, v.y, v.z);
  noStroke();
  fill(255);
  sphere(4);
  pop();
}

// pillars
function drawPillars() {
  let r = 100;

  for (let i = 0; i < 4; i++) {
    let a = map(i, 0, 4, 0, TWO_PI);

    let x = cos(a) * r;
    let z = sin(a) * r;

    line(x, -120, z, x, 0, z);

    drawNode(createVector(x, -120, z));
    drawNode(createVector(x, 0, z));
  }
}

// platform
function drawPlatform() {
  let r = 100;

  let nodes = [];

  for (let i = 0; i < 20; i++) {
    let a = map(i, 0, 20, 0, TWO_PI);

    let x = cos(a) * r;
    let z = sin(a) * r;

    nodes.push(createVector(x, 0, z));

    drawNode(createVector(x, 0, z));
  }

  for (let i = 0; i < nodes.length; i++) {
    let a = nodes[i];
    let b = nodes[(i + 1) % nodes.length];

    line(a.x, a.y, a.z, b.x, b.y, b.z);
  }
}

// base
function drawBase() {
  let r = 130;
  let y = 40;

  let nodes = [];

  for (let i = 0; i < 30; i++) {
    let a = map(i, 0, 30, 0, TWO_PI);

    let x = cos(a) * r;
    let z = sin(a) * r;

    nodes.push(createVector(x, y, z));

    drawNode(createVector(x, y, z));
  }

  for (let i = 0; i < nodes.length; i++) {
    let a = nodes[i];
    let b = nodes[(i + 1) % nodes.length];

    line(a.x, a.y, a.z, b.x, b.y, b.z);
  }
}

// advanced knowledge about class learned from https://www.w3schools.com/js/js_classes.asp
class Fragment {
  constructor(x, y, z, type, depth) {
    this.pos = createVector(x, y, z);
    this.type = type;
    this.depth = depth;

    this.size = random(10, 25);
    this.angle = random(TWO_PI);
    this.orbitAngle = random(TWO_PI);
    this.orbitRadius = random(80, 300);
    this.height = random(-200, 200);
    this.speed = random(0.005, 0.02);
  }

  update() {
    if (this.type === "dream") {
      this.orbitAngle += this.speed;

      this.pos.x = cos(this.orbitAngle) * this.orbitRadius;
      this.pos.z = sin(this.orbitAngle) * this.orbitRadius;
      this.pos.y = this.height;
    }

    if (collapse && collapseAge > 500) {
      this.orbitRadius *= random(0.8, 1.4);

      this.angle += 0.1;
    }
  }

  display() {
    push();

    translate(this.pos.x, this.pos.y, this.pos.z);

    rotateY(this.angle);

    if (this.type === "dream") {
      drawingContext.shadowBlur = 20;
      drawingContext.shadowColor = "rgba(255,0,150,0.8)";

      fill(random(100, 255), random(100, 255), random(100, 255), 120);
    } else {
      drawingContext.shadowBlur = 0;
      fill(180, 180, 180, 80);
    }

    beginShape();

    vertex(-this.size / 2, this.size / 2, 0);
    vertex(0, -this.size / 2, 0);
    vertex(this.size / 2, this.size / 2, 0);

    endShape(CLOSE);

    pop();
  }

  spawn() {
    if (this.depth <= 0) return;

    let angle = random(TWO_PI);
    let distOffset = random(40, 80);

    let newX = this.pos.x + cos(angle) * distOffset;
    let newZ = this.pos.z + sin(angle) * distOffset;

    fragments.push(new Fragment(newX, 0, newZ, "dream", this.depth - 1));
  }
}

// written by chatgpt5.2
function infectionCheck() {
  for (let i = 0; i < fragments.length; i++) {
    for (let j = 0; j < fragments.length; j++) {
      if (i === j) continue;

      let a = fragments[i];
      let b = fragments[j];

      if (
        a.type === "dream" &&
        b.type === "reality" &&
        dist(a.pos.x, a.pos.z, b.pos.x, b.pos.z) < 10
      ) {
        b.type = "dream";
        b.depth = 3;
      }
    }
  }
}

// written by chatgpt5.2
function recursiveSpread() {
  for (let f of fragments) {
    if (f.type === "dream" && random() < 0.01) {
      f.spawn();
    }
  }
}

function playSound(x, z) {
  let freq = map(x, -300, 300, 200, 800);
  let amp = map(z, -300, 300, 0.05, 0.3);

  osc.freq(freq);

  osc.amp(amp, 0.05);
  osc.amp(0, 0.3);

  recordedNotes.push({
    freq: freq,
    amp: amp,
  });
}

function playRecordedLoop() {
  if (millis() - lastNoteTime > 250) {
    if (recordedNotes.length > 0) {
      let note = recordedNotes[noteIndex];

      osc.freq(note.freq);
      osc.amp(note.amp, 0.05);
      osc.amp(0, 0.3);

      osc2.freq(note.freq * random(0.5, 2));
      osc2.amp(0.05, 0.05);
      osc2.amp(0, 0.3);

      noteIndex = (noteIndex + 1) % recordedNotes.length;

      lastNoteTime = millis();
    }
  }
}

// interaction
// mouse click to spawn dream fragment from music box
function mousePressed() {
  // To unlock the sound in view page
  userStartAudio();

  if (!music.isPlaying()) {
    music.loop();
  }

  dragging = true;

  lastX = mouseX;
  lastY = mouseY;

  let d = dist(mouseX, mouseY, width / 2, height / 2);

  // in the range of music box to spawn fragment
  if (d < 150) {
    let angle = random(TWO_PI);
    let r = random(120);

    let x = cos(angle) * r;
    let z = sin(angle) * r;

    fragments.push(new Fragment(x, 0, z, "dream", 4));

    playSound(x, z);
  }
}

// function mouseDragged(){

//   if(dragging){

//     let dx = mouseX-lastX
//     let dy = mouseY-lastY

//     rotY += dx*0.01

//     rotX += dy*0.01

//     rotX = constrain(rotX,-PI/2,PI/2)

//     lastX = mouseX
//     lastY = mouseY

//   }
// }

function mouseReleased() {
  dragging = false;
}

function keyPressed() {
  if (key === "r") {
    fragments = [];

    collapse = false;
    collapseStart = false;

    recordedNotes = [];
    noteIndex = 0;

    for (let i = 0; i < maxReality; i++) {
      fragments.push(
        new Fragment(
          random(-300, 300),
          random(-100, 100),
          random(-300, 300),
          "reality",
          0
        )
      );
    }

    fragments.push(new Fragment(0, 0, 0, "dream", 4));
  }
}

function cleanupFragments() {
  let maxDist = 1500;

  let newFragments = [];

  for (let i = 0; i < fragments.length; i++) {
    let f = fragments[i];

    let d = dist(0, 0, 0, f.pos.x, f.pos.y, f.pos.z);

    if (d < maxDist) {
      newFragments.push(f);
    } else {
      if (random() < 0.7) {
        newFragments.push(f);
      }
    }
  }

  fragments = newFragments;
}
