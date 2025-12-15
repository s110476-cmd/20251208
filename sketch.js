// Global quiz variables
let quizTable;
let questions = [];
let currentQuestion;
let feedbackText = ""; // Used to show feedback temporarily

// Sprite and animation variables
const FRAMES = 8;
let walkSheet, runSheet, attackSheet;
let currentSheet;
let currentFrames = FRAMES;
let frameW, frameH;
let frameIndex = 0;
let frameDelay = 6;
let frameTimer = 0;

let posX, posY;
let speed = 4;
let scaleFactor = 3;
let facing = 1;

// Attack settings
const ATTACK_FRAMES = 16;
let attacking = false;
let prevSheet = null;
let prevFrames = FRAMES;

// NPC character (character 2)
let stopSheet;
let smileSheet;
const STOP_FRAMES = 7;
const SMILE_FRAMES = 8;
let stopFrameW, stopFrameH;
let smileFrameW, smileFrameH;
let stopFrameIndex = 0;
let stopFrameTimer = 0;
let stopFrameDelay = 6;

// Dialogue and input
let inputBox = null;
const nearThreshold = 250;

// Variables for cycling background
let bgImages = [];
let currentBgIndex = 0;
let canChangeBg = true;

function preload() {
    // Load cycling background images from folder 3/
    bgImages.push(loadImage('3/01.jpg'));
    bgImages.push(loadImage('3/02.jpg'));
    bgImages.push(loadImage('3/03.png'));
    bgImages.push(loadImage('3/04.jpg'));

    // Load quiz data
    quizTable = loadTable('quiz.csv', 'csv', 'header');

    // Load character sprites
    walkSheet = loadImage('1/走路/all 1.png');
    runSheet = loadImage('1/跑步/all 2.png');
    attackSheet = loadImage('1/揮刀/all 2.png');
    stopSheet = loadImage('2/stop/all stop.png');
    smileSheet = loadImage('2/smile/all smile.png');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    imageMode(CENTER);
    noSmooth();

    // Parse CSV using column indices to be safe from quoted headers
    for (let row of quizTable.rows) {
        questions.push({
            question: row.get(0),
            answer: row.get(1),
            correct: row.get(2),
            wrong: row.get(3),
            hint: row.get(4),
        });
    }

    // Player setup
    currentSheet = walkSheet;
    frameW = currentSheet.width / FRAMES;
    frameH = currentSheet.height;

    // NPC setup
    stopFrameW = stopSheet.width / STOP_FRAMES; 
    stopFrameH = stopSheet.height;
    smileFrameW = smileSheet.width / SMILE_FRAMES;
    smileFrameH = smileSheet.height;

    posX = width / 2 + 100;
    posY = height * 0.8; // Lower character position to 80% of screen height

    // Input box for answers
    inputBox = createInput('');
    inputBox.size(200, 30);
    inputBox.hide();
    inputBox.elt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });

    // Start with the first question
    askQuestion();
}

function askQuestion() {
    if (questions.length > 0) {
        currentQuestion = random(questions);
        feedbackText = ""; // Clear old feedback
    }
}

function checkAnswer() {
    if (!currentQuestion) return;
    const userAnswer = inputBox.value().trim();

    if (userAnswer === currentQuestion.answer) {
        feedbackText = currentQuestion.correct;
        setTimeout(askQuestion, 2000); // New question after 2s
    } else {
        feedbackText = currentQuestion.wrong;
    }
    inputBox.value('');
}

function draw() {
    // Draw the current background image from the array
    image(bgImages[currentBgIndex], width / 2, height / 2, width, height);

    // --- 1. NPC (Character 2) Logic ---
    const npcPosX = width / 2 - 200;
    const npcPosY = posY;
    let isNear = abs(posX - npcPosX) < nearThreshold;
    let npcFacing = (posX < npcPosX) ? -1 : 1;

    // Draw NPC sprite
    push();
    translate(npcPosX, npcPosY);
    scale(npcFacing, 1);
    image(isNear ? smileSheet : stopSheet, 0, 0, (isNear ? smileFrameW : stopFrameW) * scaleFactor, (isNear ? smileFrameH : stopFrameH) * scaleFactor, (stopFrameIndex % (isNear ? SMILE_FRAMES : STOP_FRAMES)) * (isNear ? smileFrameW : stopFrameW), 0, (isNear ? smileFrameW : stopFrameW), (isNear ? smileFrameH : stopFrameH));
    pop();
    
    // Update NPC animation
    stopFrameTimer++;
    if (stopFrameTimer >= stopFrameDelay) {
        stopFrameTimer = 0;
        stopFrameIndex++;
    }
    
    // --- 2. Dialogue and Input Logic ---
    let textToShow = "";
    const characterHeight = (isNear ? smileFrameH : stopFrameH) * scaleFactor;
    const textY = npcPosY - characterHeight / 2 - 10;
    
    if (isNear) {
        textToShow = feedbackText || (currentQuestion ? currentQuestion.question : "Loading...");
        if (inputBox.elt.style.display === 'none') {
            inputBox.show();
            inputBox.elt.focus();
        }
        
        // --- UI for Player 1 Input ---
        const labelText = "請作答：";
        textSize(18); // Set size for accurate width measurement
        const labelWidth = textWidth(labelText);
        const PADDING = 15;
        const containerWidth = labelWidth + inputBox.width + (PADDING * 3);
        const containerHeight = inputBox.height + (PADDING * 2);
        const containerX = posX - containerWidth / 2;
        const containerY = posY - (frameH * scaleFactor / 2) - containerHeight - 10; // 10px above head
        
        push();
        fill('#fff0f3');
        stroke(0);
        strokeWeight(1);
        rect(containerX, containerY, containerWidth, containerHeight, 10);
        pop();

        fill(0);
        noStroke();
        textAlign(LEFT, CENTER);
        const labelX = containerX + PADDING;
        const labelY = containerY + containerHeight / 2;
        text(labelText, labelX, labelY);

        const inputBoxX = labelX + labelWidth + PADDING;
        const inputBoxY = containerY + PADDING;
        inputBox.position(inputBoxX, inputBoxY);
        
    } else {
        textToShow = "靠近我開始測驗！";
        if (inputBox.elt.style.display !== 'none') {
            inputBox.hide();
        }
    }
    
    // Draw Dialogue Text for NPC
    fill(0);
    textSize(20);
    textAlign(CENTER, BOTTOM);
    text(textToShow, npcPosX, textY);


    // --- 3. Player (Character 1) Movement ---
    if (attacking) {
        return;
    }

    let moving = false;
    if (keyIsDown(RIGHT_ARROW)) {
        currentSheet = runSheet;
        facing = 1;
        posX += speed;
        moving = true;
    } else if (keyIsDown(LEFT_ARROW)) {
        currentSheet = walkSheet;
        facing = -1;
        posX -= speed;
        moving = true;
    } else {
        frameIndex = 0;
    }
    
    currentFrames = (currentSheet === attackSheet) ? ATTACK_FRAMES : FRAMES;
    frameW = currentSheet.width / currentFrames;
    frameH = currentSheet.height;

    posX = constrain(posX, (frameW*scaleFactor)/2, width - (frameW*scaleFactor)/2);

    // Draw player sprite
    push();
    translate(posX, posY);
    scale(facing, 1);
    image(currentSheet, 0, 0, frameW * scaleFactor, frameH * scaleFactor, frameIndex * frameW, 0, frameW, frameH);
    pop();

    if (moving) {
        frameTimer++;
        if (frameTimer >= frameDelay) {
            frameTimer = 0;
            frameIndex = (frameIndex + 1) % currentFrames;
        }
    }
    
    // --- Background Cycling Logic ---
    const leftEdge = (frameW * scaleFactor) / 2;
    const rightEdge = width - (frameW * scaleFactor) / 2;

    if (posX >= rightEdge) {
        if (canChangeBg) {
            currentBgIndex = (currentBgIndex + 1) % bgImages.length; // Next image
            canChangeBg = false; // Prevent rapid changing
        }
    } else if (posX <= leftEdge) {
        if (canChangeBg) {
            // Go to the previous image, wrapping around
            currentBgIndex = (currentBgIndex - 1 + bgImages.length) % bgImages.length;
            canChangeBg = false; // Prevent rapid changing
        }
    } else {
        canChangeBg = true;
    }
}

function keyPressed() {
    if (keyCode === 32 && !attacking) {
        // Attack logic can be added here
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    posY = height * 0.8; // Adjust Y position on resize as well
}