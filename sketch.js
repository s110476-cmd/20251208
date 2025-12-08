// 圖片精靈的總寬高 (這些變數主要用於主角)
const SPRITE_W_TOTAL = 459;
const SPRITE_H = 70;
// 幀數
const FRAMES = 8;
let walkSheet, runSheet, attackSheet;
let currentSheet;
let currentFrames = FRAMES;
let frameW, frameH;
let frameIndex = 0;
let frameDelay = 6; // 調整此值改變動畫速度
let frameTimer = 0;

let posX, posY;
let speed = 4; // 移動速度（可調）
let scaleFactor = 3; // 等比例放大倍數
let facing = 1; // 1 = 右, -1 = 左

// 揮刀設定
const ATTACK_FRAMES = 16; // 1/揮刀/all 2.png 16 幀
let attacking = false;
let prevSheet = null;
let prevFrames = FRAMES;

// 新增：左側不受鍵盤影響的角色（stop 精靈）
let stopSheet;
let smileSheet;
const STOP_FRAMES = 7; // stop 精靈實際幀數
const SMILE_FRAMES = 8; // smile 精靈實際幀數
let stopFrameW, stopFrameH;
let smileFrameW, smileFrameH;
let stopFrameIndex = 0;
let stopFrameTimer = 0;
let stopFrameDelay = 6; // 停留角色的動畫速度

// 新增：對話文字與輸入框
let defaultStopText = "需要我解答嗎?";
let stopText = defaultStopText;
let inputBox = null; // p5 DOM input 元件
const nearThreshold = 250; // 靠近距離閾值

function preload() {
    // 確保這些路徑與您的專案結構相符！
    // 走路精靈 (8 幀，459x70)
    walkSheet = loadImage('1/走路/all 1.png');
    // 跑步精靈 (8 幀，635x51)
    runSheet = loadImage('1/跑步/all 2.png');
    // 揮刀精靈 (16 幀，1307x97)
    attackSheet = loadImage('1/揮刀/all 2.png');
    
    // 新增載入 stop 精靈 (7 幀，401x101)
    stopSheet = loadImage('2/stop/all stop.png');
    // 新增載入 smile 精靈 (8 幀，451x105)
    smileSheet = loadImage('2/smile/all smile.png');
}

function setup() {
    // 創建全視窗畫布
    createCanvas(windowWidth, windowHeight);
    imageMode(CENTER);
    noSmooth(); // 關閉抗鋸齒，使像素圖更清晰

    // 初始使用走路精靈 (主角)
    currentSheet = walkSheet;
    currentFrames = FRAMES;
    frameW = currentSheet.width / currentFrames;
    frameH = currentSheet.height;

    // 設定 stop 精靈的單幀尺寸
    stopFrameW = stopSheet.width / STOP_FRAMES; 
    stopFrameH = stopSheet.height;

    // 設定 smile 精靈的單幀尺寸
    smileFrameW = smileSheet.width / SMILE_FRAMES;
    smileFrameH = smileSheet.height;

    posX = width / 2 + 100; // 主角初始位置稍微偏右
    posY = height / 2;

    // 新增：創建輸入框
    inputBox = createInput('');
    inputBox.position(50, 50); // 初始定位不重要，會在 draw 中更新
    inputBox.size(200, 30);
    inputBox.hide(); // 預設隱藏

    // 為 inputBox 加上 Enter 監聽
    inputBox.elt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const val = inputBox.value().trim();
            if (val.length > 0) {
                stopText = val + "，歡迎你";
            } else {
                stopText = defaultStopText; // 輸入空字串則恢復預設
            }
            inputBox.value(''); // 清空輸入框
            inputBox.hide();
        }
    });
}

function draw() {
    // 設置背景顏色
    background('#bde0fe');

    // ----------------------------------------------------
    // 1. 繪製左側的 NPC 角色 (stop/smile) 與對話邏輯
    // ----------------------------------------------------
    const stopPosX = width / 2 - 200;
    const stopPosY = posY;

    // 判斷距離，接近則切換 smile 精靈
    let dist = abs(posX - stopPosX);
    let useSmile = dist < nearThreshold;

    // 判斷 NPC 應該面向哪裡
    let stopFacing = 1;
    if (posX < stopPosX) {
        stopFacing = -1; // 主角在左邊，NPC要反向顯示
    }

    // 繪製 NPC 精靈
    push();
    translate(stopPosX, stopPosY);
    scale(stopFacing, 1);

    if (useSmile) {
        // 顯示 smile 精靈 (8幀循環)
        const sxSmile = stopFrameIndex % SMILE_FRAMES * smileFrameW;
        image(smileSheet, 0, 0, smileFrameW * scaleFactor, smileFrameH * scaleFactor, sxSmile, 0, smileFrameW, smileFrameH);
    } else {
        // 顯示 stop 精靈 (7幀循環)
        const sxStop = (stopFrameIndex % STOP_FRAMES) * stopFrameW;
        image(stopSheet, 0, 0, stopFrameW * scaleFactor, stopFrameH * scaleFactor, sxStop, 0, stopFrameW, stopFrameH);
    }
    pop();

    // 更新 NPC 動畫幀
    stopFrameTimer++;
    if (stopFrameTimer >= stopFrameDelay) {
        stopFrameTimer = 0;
        stopFrameIndex = (stopFrameIndex + 1);
    }
    
    // ----------------------------------------------------
    // 2. 處理對話文字與輸入框顯示/定位
    // ----------------------------------------------------
    if (useSmile) {
        // NPC 顯示對話文字 (角色 2)
        fill(0);
        textSize(20);
        textAlign(CENTER, BOTTOM);
        // 計算文字 Y 座標 (在 NPC 頭上)
        const textY = stopPosY - stopFrameH * scaleFactor / 2 - 10; 
        text(stopText, stopPosX, textY);

        // 顯示輸入框
        if (inputBox.elt.style.display === 'none') {
            inputBox.show();
            inputBox.elt.focus(); // 讓輸入框自動獲得焦點
        }
        
        // 將輸入框定位在主角上方 (角色 1)
        inputBox.position(posX - inputBox.width / 2, posY - frameH * scaleFactor / 2 - 40);

        // 繪製主角上方的提示文字/對話框 (角色 1)
        if (inputBox.elt.style.display !== 'none') {
            // 繪製對話框背景
            fill(255, 255, 200, 200); 
            noStroke();
            rectMode(CENTER);
            rect(posX, posY - frameH * scaleFactor / 2 - 20, inputBox.width + 10, 45, 5); // 圓角矩形

            // 繪製提示文字
            fill(0);
            textSize(14);
            textAlign(CENTER, CENTER);
            text("請輸入文字 (Enter送出)", posX, posY - frameH * scaleFactor / 2 - 20);
        }

    } else {
        // 角色 1 遠離時，隱藏輸入框並重設文字
        if (inputBox.elt.style.display !== 'none') {
            inputBox.hide();
            inputBox.value(''); // 清空輸入框
            stopText = defaultStopText;
        }
    }


    // ----------------------------------------------------
    // 3. 主角移動與動畫 (攻擊優先)
    // ----------------------------------------------------

    // 若正在攻擊，優先處理攻擊動畫
    if (attacking) {
        // ... (攻擊處理程式碼不變)
        if (currentSheet !== attackSheet) {
            currentSheet = attackSheet;
            currentFrames = ATTACK_FRAMES;
            frameIndex = 0;
            frameTimer = 0;
            frameW = currentSheet.width / currentFrames;
            frameH = currentSheet.height;
        }

        const sxA = frameIndex * frameW;
        push();
        translate(posX, posY);
        scale(facing, 1);
        image(currentSheet, 0, 0, frameW * scaleFactor, frameH * scaleFactor, sxA, 0, frameW, frameH);
        pop();
        
        frameTimer++;
        if (frameTimer >= frameDelay) {
            frameTimer = 0;
            frameIndex++;
            if (frameIndex >= currentFrames) {
                // 攻擊結束，還原到先前精靈
                attacking = false;
                currentSheet = prevSheet || walkSheet;
                currentFrames = prevFrames;
                frameIndex = 0;
                frameTimer = 0;
                frameW = currentSheet.width / currentFrames;
                frameH = currentSheet.height;
            }
        }
        return; // 攻擊期間不處理其他動作
    }

    // 判斷按鍵狀態並切換精靈與方向、移動
    let moving = false;
    if (keyIsDown(RIGHT_ARROW)) {
        if (currentSheet !== runSheet) {
            currentSheet = runSheet;
            currentFrames = FRAMES;
            frameIndex = 0;
            frameTimer = 0;
            frameW = currentSheet.width / currentFrames;
            frameH = currentSheet.height;
        }
        facing = 1;
        posX += speed;
        moving = true;
    } else if (keyIsDown(LEFT_ARROW)) {
        if (currentSheet !== walkSheet) {
            currentSheet = walkSheet;
            currentFrames = FRAMES;
            frameIndex = 0;
            frameTimer = 0;
            frameW = currentSheet.width / currentFrames;
            frameH = currentSheet.height;
        }
        facing = -1;
        posX -= speed;
        moving = true;
    } else {
        // 不移動時，將動畫停留在第一幀
        frameIndex = 0;
        frameTimer = 0;
    }

    // 限制主角不要跑出畫布
    const dw = frameW * scaleFactor;
    const halfW = dw / 2;
    posX = constrain(posX, halfW, width - halfW);

    // 繪製主角精靈
    const sx = frameIndex * frameW;
    const sy = 0;
    const sw = frameW;
    const sh = frameH;

    push();
    translate(posX, posY);
    scale(facing, 1); // 水平翻轉
    image(currentSheet, 0, 0, sw * scaleFactor, sh * scaleFactor, sx, sy, sw, sh);
    pop();

    // 更新主角動畫幀（當角色在移動時進行動畫）
    if (moving) {
        frameTimer++;
        if (frameTimer >= frameDelay) {
            frameTimer = 0;
            frameIndex = (frameIndex + 1) % currentFrames;
        }
    }
}

function keyPressed() {
    // 空白鍵（32）啟動揮刀動畫
    if (keyCode === 32 && !attacking) {
        attacking = true;
        prevSheet = currentSheet;
        prevFrames = currentFrames;
        // 攻擊切換邏輯會在 draw() 的開始處處理，這裡只需設置狀態
    }
    
    // 如果輸入框是顯示的，且按下 Enter，則 Enter 的處理會由 inputBox.elt.addEventListener 處理
    // 不需在 keyPressed 這裡重複處理 Enter
}

function windowResized() {
    // 當視窗大小改變時，重新調整畫布大小以保持全視窗
    resizeCanvas(windowWidth, windowHeight);
    posY = height / 2; // 保持垂直置中
    
    // 重新定位輸入框 (如果它在顯示中，draw() 會在下一幀處理定位)
    if (inputBox && inputBox.elt.style.display !== 'none') {
        inputBox.position(posX - inputBox.width / 2, posY - frameH * scaleFactor / 2 - 40);
    }
}