// 应用程序状态
const AppState = {
    originalImage: null,
    frames: [],
    currentGif: null,
    isProcessing: false,
    history: JSON.parse(localStorage.getItem('gifHistory') || '[]'),
    currentEditTool: null,
    selectedFrameIndex: null
};

// DOM元素
const elements = {
    // 输入元素
    spriteInput: document.getElementById('spriteInput'),
    batchInput: document.getElementById('batchInput'),
    batchMode: document.getElementById('batchMode'),
    rowsInput: document.getElementById('rows'),
    colsInput: document.getElementById('cols'),
    frameDelayInput: document.getElementById('frameDelay'),
    playbackSpeed: document.getElementById('playbackSpeed'),
    bgColor: document.getElementById('bgColor'),
    
    // 按钮
    generateBtn: document.getElementById('generateBtn'),
    saveBtn: document.getElementById('saveBtn'),
    resetBtn: document.getElementById('resetBtn'),
    autoDetectBtn: document.getElementById('autoDetectBtn'),
    playBtn: document.getElementById('playBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    stopBtn: document.getElementById('stopBtn'),
    sortBtn: document.getElementById('sortBtn'),
    reverseBtn: document.getElementById('reverseBtn'),
    clearFramesBtn: document.getElementById('clearFramesBtn'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    
    // 预览元素
    originalCanvas: document.getElementById('originalCanvas'),
    gridOverlay: document.getElementById('gridOverlay'),
    gifOutput: document.getElementById('gifOutput'),
    gifContainer: document.getElementById('gifContainer'),
    framesContainer: document.getElementById('framesContainer'),
    frameCount: document.getElementById('frameCount'),
    
    // 进度和状态
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    fileInfo: document.getElementById('fileInfo'),
    historyList: document.getElementById('historyList'),
    
    // 其他
    uploadArea: document.getElementById('uploadArea'),
    editControls: document.getElementById('editControls')
};

// 初始化应用程序
function initApp() {
    setupEventListeners();
    loadHistory();
    updateUI();
    
    // 设置拖放功能
    setupDragAndDrop();
    
    console.log('精灵表GIF生成器已初始化');
}

// 设置事件监听器
function setupEventListeners() {
    // 文件上传
    elements.spriteInput.addEventListener('change', handleFileUpload);
    elements.batchInput.addEventListener('change', handleBatchUpload);
    elements.batchMode.addEventListener('change', toggleBatchMode);
    elements.uploadArea.addEventListener('click', () => elements.spriteInput.click());
    
    // 分割设置变化
    elements.rowsInput.addEventListener('change', updateGrid);
    elements.colsInput.addEventListener('change', updateGrid);
    
    // 按钮事件
    elements.generateBtn.addEventListener('click', generateGIF);
    elements.saveBtn.addEventListener('click', saveGIF);
    elements.resetBtn.addEventListener('click', resetApp);
    elements.autoDetectBtn.addEventListener('click', autoDetectGrid);
    
    // GIF控制
    elements.playBtn.addEventListener('click', playGIF);
    elements.pauseBtn.addEventListener('click', pauseGIF);
    elements.stopBtn.addEventListener('click', stopGIF);
    
    // 帧操作
    elements.sortBtn.addEventListener('click', sortFrames);
    elements.reverseBtn.addEventListener('click', reverseFrames);
    elements.clearFramesBtn.addEventListener('click', clearFrames);
    
    // 历史记录
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    
    // 预设效果
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => applyPreset(btn.dataset.effect));
    });
    
    // 编辑工具
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => activateEditTool(btn.dataset.tool));
    });
    
    // 使用说明模态框
    document.getElementById('docsLink').addEventListener('click', (e) => {
        e.preventDefault();
        showInstructions();
    });
    
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('instructionsModal').style.display = 'none';
    });
    
    // 窗口点击关闭模态框
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('instructionsModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 设置拖放功能
function setupDragAndDrop() {
    const uploadArea = elements.uploadArea;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        uploadArea.classList.add('drag-over');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('drag-over');
    }
    
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (elements.batchMode.checked) {
            handleBatchFiles(files);
        } else {
            handleSingleFile(files[0]);
        }
    }
}

// 处理文件上传
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) handleSingleFile(file);
}

// 处理单个文件
function handleSingleFile(file) {
    if (!file.type.match('image.*')) {
        alert('请选择图像文件！');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            AppState.originalImage = img;
            updateOriginalPreview(img);
            updateFileInfo(file);
            updateGrid();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 处理批量上传
function handleBatchUpload(e) {
    const files = Array.from(e.target.files);
    handleBatchFiles(files);
}

function handleBatchFiles(files) {
    const imageFiles = files.filter(file => file.type.match('image.*'));
    
    if (imageFiles.length === 0) {
        alert('请选择图像文件！');
        return;
    }
    
    // 清空现有帧
    AppState.frames = [];
    updateFramesDisplay();
    
    // 加载每张图片作为一帧
    let loadedCount = 0;
    imageFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                AppState.frames.push({
                    image: img,
                    index: index,
                    delay: parseInt(elements.frameDelayInput.value)
                });
                loadedCount++;
                
                if (loadedCount === imageFiles.length) {
                    updateFramesDisplay();
                    updateFileInfo({ name: `${imageFiles.length}个文件`, size: imageFiles.reduce((sum, f) => sum + f.size, 0) });
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// 切换批量模式
function toggleBatchMode() {
    if (elements.batchMode.checked) {
        elements.spriteInput.style.display = 'none';
        elements.batchInput.style.display = 'block';
        elements.uploadArea.querySelector('p').textContent = '拖放多个图像文件，或点击选择';
    } else {
        elements.spriteInput.style.display = 'block';
        elements.batchInput.style.display = 'none';
        elements.uploadArea.querySelector('p').textContent = '拖放图像文件到这里，或点击选择';
    }
}

// 更新原始图像预览
function updateOriginalPreview(img) {
    const canvas = elements.originalCanvas;
    const ctx = canvas.getContext('2d');
    
    // 设置画布尺寸
    const maxWidth = 400;
    const maxHeight = 300;
    let width = img.width;
    let height = img.height;
    
    if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
    }
    if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // 绘制图像
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, width, height);
    
    // 显示网格叠加层
    updateGridOverlay();
}

// 更新网格叠加层
function updateGridOverlay() {
    const rows = parseInt(elements.rowsInput.value);
    const cols = parseInt(elements.colsInput.value);
    const canvas = elements.originalCanvas;
    
    if (!canvas.width || !canvas.height || rows <= 0 || cols <= 0) return;
    
    const frameWidth = canvas.width / cols;
    const frameHeight = canvas.height / rows;
    
    let gridHTML = '';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            gridHTML += `
                <div style="
                    position: absolute;
                    left: ${c * frameWidth}px;
                    top: ${r * frameHeight}px;
                    width: ${frameWidth}px;
                    height: ${frameHeight}px;
                    border: 2px solid rgba(255, 0, 0, 0.5);
                    box-sizing: border-box;
                    pointer-events: none;
                "></div>
            `;
        }
    }
    
    elements.gridOverlay.innerHTML = gridHTML;
}

// 更新网格（分割图像）
function updateGrid() {
    if (!AppState.originalImage) return;
    
    const rows = parseInt(elements.rowsInput.value);
    const cols = parseInt(elements.colsInput.value);
    
    if (rows <= 0 || cols <= 0) return;
    
    // 清空现有帧
    AppState.frames = [];
    
    // 计算每帧的尺寸
    const frameWidth = AppState.originalImage.width / cols;
    const frameHeight = AppState.originalImage.height / rows;
    
    // 创建临时画布用于分割
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = frameWidth;
    tempCanvas.height = frameHeight;
    
    // 分割图像为帧
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // 清空临时画布
            tempCtx.clearRect(0, 0, frameWidth, frameHeight);
            
            // 绘制当前帧
            tempCtx.drawImage(
                AppState.originalImage,
                c * frameWidth, r * frameHeight, frameWidth, frameHeight,
                0, 0, frameWidth, frameHeight
            );
            
            // 创建新图像
            const frameImage = new Image();
            frameImage.src = tempCanvas.toDataURL();
            
            // 添加到帧数组
            AppState.frames.push({
                image: frameImage,
                index: r * cols + c,
                delay: parseInt(elements.frameDelayInput.value),
                originalPosition: { row: r, col: c }
            });
        }
    }
    
    updateFramesDisplay();
    updateGridOverlay();
}

// 自动检测网格（简单实现）
function autoDetectGrid() {
    if (!AppState.originalImage) {
        alert('请先上传图像！');
        return;
    }
    
    // 这是一个简化的自动检测，实际应用中需要更复杂的算法
    // 这里假设精灵表是均匀网格，尝试检测明显的颜色边界
    
    const img = AppState.originalImage;
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // 简化：尝试检测垂直和水平方向的颜色变化
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const data = imageData.data;
    
    // 分析水平方向（寻找可能的列边界）
    const horizontalChanges = [];
    for (let x = 1; x < img.width; x++) {
        let colorDiff = 0;
        for (let y = 0; y < img.height; y += 5) { // 抽样检测
            const idx1 = (y * img.width + (x - 1)) * 4;
            const idx2 = (y * img.width + x) * 4;
            
            const rDiff = Math.abs(data[idx1] - data[idx2]);
            const gDiff = Math.abs(data[idx1 + 1] - data[idx2 + 1]);
            const bDiff = Math.abs(data[idx1 + 2] - data[idx2 + 2]);
            
            colorDiff += (rDiff + gDiff + bDiff) / 3;
        }
        
        // 如果颜色变化超过阈值，可能是帧边界
        if (colorDiff > (img.height / 5) * 10) {
            horizontalChanges.push(x);
        }
    }
    
    // 简化：假设是均匀网格，根据边界数量推断列数
    let detectedCols = 1;
    if (horizontalChanges.length > 0) {
        // 计算边界之间的平均间隔
        const intervals = [];
        for (let i = 1; i < horizontalChanges.length; i++) {
            intervals.push(horizontalChanges[i] - horizontalChanges[i - 1]);
        }
        
        if (intervals.length > 0) {
            const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
            detectedCols = Math.round(img.width / avgInterval);
        }
    }
    
    // 设置检测结果（简化：行数设为1或2）
    elements.colsInput.value = Math.max(1, Math.min(50, detectedCols));
    elements.rowsInput.value = 1; // 简化为1行
    
    updateGrid();
    alert(`自动检测完成：建议设置为 ${elements.rowsInput.value} 行 ${elements.colsInput.value} 列`);
}

// 更新帧显示
function updateFramesDisplay() {
    const container = elements.framesContainer;
    
    if (AppState.frames.length === 0) {
        container.innerHTML = '<p class="empty-frames">分割后的帧将显示在这里</p>';
        elements.frameCount.textContent = '0帧';
        return;
    }
    
    elements.frameCount.textContent = `${AppState.frames.length}帧`;
    
    // 清空容器
    container.innerHTML = '';
    
    // 创建帧缩略图
    AppState.frames.forEach((frame, index) => {
        const frameItem = document.createElement('div');
        frameItem.className = 'frame-item';
        frameItem.draggable = true;
        frameItem.dataset.index = index;
        
        // 设置拖放事件
        frameItem.addEventListener('dragstart', handleDragStart);
        frameItem.addEventListener('dragover', handleDragOver);
        frameItem.addEventListener('drop', handleDropFrame);
        frameItem.addEventListener('dragend', handleDragEnd);
        
        // 点击选择帧
        frameItem.addEventListener('click', () => selectFrame(index));
        
        // 创建缩略图
        const img = document.createElement('img');
        img.src = frame.image.src;
        img.alt = `帧 ${index + 1}`;
        
        const frameNumber = document.createElement('div');
        frameNumber.className = 'frame-number';
        frameNumber.textContent = index + 1;
        
        frameItem.appendChild(img);
        frameItem.appendChild(frameNumber);
        container.appendChild(frameItem);
    });
}

// 拖放帧排序功能
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDropFrame(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedItem !== this) {
        const fromIndex = parseInt(draggedItem.dataset.index);
        const toIndex = parseInt(this.dataset.index);
        
        // 交换帧位置
        [AppState.frames[fromIndex], AppState.frames[toIndex]] = 
        [AppState.frames[toIndex], AppState.frames[fromIndex]];
        
        // 更新显示
        updateFramesDisplay();
    }
    
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedItem = null;
}

// 选择帧进行编辑
function selectFrame(index) {
    AppState.selectedFrameIndex = index;
    
    // 移除所有激活状态
    document.querySelectorAll('.frame-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 激活选中的帧
    const frameItem = document.querySelector(`.frame-item[data-index="${index}"]`);
    if (frameItem) {
        frameItem.classList.add('active');
    }
    
    // 显示编辑控件
    if (AppState.currentEditTool) {
        showEditControls(AppState.currentEditTool);
    }
}

// 生成GIF
async function generateGIF() {
    if (AppState.frames.length === 0) {
        alert('没有可用的帧！请先上传并分割图像。');
        return;
    }
    
    // 更新UI状态
    AppState.isProcessing = true;
    updateProgress(0, '正在初始化GIF生成...');
    elements.generateBtn.disabled = true;
    elements.saveBtn.disabled = true;
    
    try {
        // 获取GIF设置
        const delay = parseInt(elements.frameDelayInput.value);
        const speed = parseFloat(elements.playbackSpeed.value);
        const adjustedDelay = delay / speed;
        
        // 创建GIF实例
        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: AppState.frames[0].image.width,
            height: AppState.frames[0].image.height,
            background: elements.bgColor.value === 'transparent' ? null : elements.bgColor.value,
            workerScript: 'gif.worker.js'
        });
        
        // 添加帧到GIF
        for (let i = 0; i < AppState.frames.length; i++) {
            const frame = AppState.frames[i];
            
            // 创建临时画布
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = frame.image.width;
            canvas.height = frame.image.height;
            
            // 设置背景
            if (elements.bgColor.value !== 'transparent') {
                ctx.fillStyle = elements.bgColor.value;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            // 绘制图像
            ctx.drawImage(frame.image, 0, 0);
            
            // 添加到GIF
            gif.addFrame(canvas, { delay: adjustedDelay });
            
            // 更新进度
            updateProgress((i + 1) / AppState.frames.length * 100, `正在添加帧 ${i + 1}/${AppState.frames.length}`);
            
            // 短暂延迟以避免阻塞UI
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // 生成GIF
        updateProgress(90, '正在生成GIF文件...');
        
        gif.on('finished', function(blob) {
            // 创建对象URL
            const url = URL.createObjectURL(blob);
            
            // 更新预览
            elements.gifOutput.src = url;
            elements.gifOutput.style.display = 'block';
            elements.gifContainer.querySelector('.empty-preview').style.display = 'none';
            
            // 保存到状态
            AppState.currentGif = {
                blob: blob,
                url: url,
                frames: AppState.frames.length,
                delay: delay,
                timestamp: new Date().toISOString()
            };
            
            // 添加到历史记录
            addToHistory(AppState.currentGif);
            
            // 更新UI
            updateProgress(100, 'GIF生成完成！');
            elements.saveBtn.disabled = false;
            elements.playBtn.disabled = false;
            elements.pauseBtn.disabled = false;
            elements.stopBtn.disabled = false;
            AppState.isProcessing = false;
            elements.generateBtn.disabled = false;
            
            // 3秒后重置进度
            setTimeout(() => {
                updateProgress(0, '准备就绪');
            }, 3000);
        });
        
        gif.on('progress', function(p) {
            updateProgress(90 + p * 10, '正在编码GIF...');
        });
        
        gif.render();
        
    } catch (error) {
        console.error('生成GIF时出错:', error);
        alert('生成GIF时出错: ' + error.message);
        
        // 重置UI状态
        AppState.isProcessing = false;
        updateProgress(0, '生成失败');
        elements.generateBtn.disabled = false;
    }
}

// 保存GIF
function saveGIF() {
    if (!AppState.currentGif) {
        alert('没有可保存的GIF！请先生成GIF。');
        return;
    }
    
    const link = document.createElement('a');
    link.href = AppState.currentGif.url;
    link.download = `sprite-animation-${new Date().getTime()}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// 播放GIF控制
function playGIF() {
    if (elements.gifOutput.src) {
        elements.gifOutput.style.animationPlayState = 'running';
    }
}

function pauseGIF() {
    if (elements.gifOutput.src) {
        elements.gifOutput.style.animationPlayState = 'paused';
    }
}

function stopGIF() {
    if (elements.gifOutput.src) {
        elements.gifOutput.style.animation = 'none';
        setTimeout(() => {
            elements.gifOutput.style.animation = '';
        }, 10);
    }
}

// 帧操作功能
function sortFrames() {
    AppState.frames.sort((a, b) => a.index - b.index);
    updateFramesDisplay();
}

function reverseFrames() {
    AppState.frames.reverse();
    updateFramesDisplay();
}

function clearFrames() {
    if (confirm('确定要清空所有帧吗？')) {
        AppState.frames = [];
        updateFramesDisplay();
    }
}

// 应用预设效果
function applyPreset(effect) {
    if (AppState.frames.length === 0) {
        alert('没有可应用的帧！');
        return;
    }
    
    const originalFrames = [...AppState.frames];
    
    switch (effect) {
        case 'reverse':
            AppState.frames.reverse();
            break;
            
        case 'blink':
            // 闪烁效果：复制每帧一次
            const blinkFrames = [];
            AppState.frames.forEach(frame => {
                blinkFrames.push(frame);
                blinkFrames.push({ ...frame, delay: 50 }); // 快速闪烁
            });
            AppState.frames = blinkFrames;
            break;
            
        case 'bounce':
            // 弹跳效果：正向然后反向
            const bounceFrames = [...AppState.frames];
            for (let i = AppState.frames.length - 2; i > 0; i--) {
                bounceFrames.push(AppState.frames[i]);
            }
            AppState.frames = bounceFrames;
            break;
            
        case 'fade':
            // 淡入淡出效果：为每帧创建淡入版本
            const fadeFrames = [];
            for (let i = 0; i < AppState.frames.length; i++) {
                const originalFrame = AppState.frames[i];
                
                // 创建淡入版本
                const fadeInFrame = {
                    ...originalFrame,
                    image: createFadeImage(originalFrame.image, i / AppState.frames.length)
                };
                fadeFrames.push(fadeInFrame);
                
                // 添加原始帧
                fadeFrames.push(originalFrame);
                
                // 创建淡出版本
                const fadeOutFrame = {
                    ...originalFrame,
                    image: createFadeImage(originalFrame.image, 1 - (i / AppState.frames.length))
                };
                fadeFrames.push(fadeOutFrame);
            }
            AppState.frames = fadeFrames;
            break;
    }
    
    updateFramesDisplay();
    alert(`已应用"${effect}"效果！`);
}

// 创建淡入淡出图像
function createFadeImage(image, opacity) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    
    ctx.globalAlpha = opacity;
    ctx.drawImage(image, 0, 0);
    
    const fadedImage = new Image();
    fadedImage.src = canvas.toDataURL();
    return fadedImage;
}

// 编辑工具
function activateEditTool(tool) {
    AppState.currentEditTool = tool;
    showEditControls(tool);
    
    if (AppState.selectedFrameIndex === null) {
        alert('请先选择一个帧进行编辑！');
        return;
    }
    
    applyEditTool(tool);
}

function showEditControls(tool) {
    const controls = elements.editControls;
    controls.style.display = 'block';
    
    let controlsHTML = '';
    
    switch (tool) {
        case 'rotate':
            controlsHTML = `
                <div class="form-group">
                    <label>旋转角度:</label>
                    <input type="range" id="rotateAngle" min="0" max="360" value="0">
                    <span id="angleValue">0°</span>
                </div>
                <button id="applyRotate" class="btn small">应用旋转</button>
            `;
            break;
            
        case 'brightness':
            controlsHTML = `
                <div class="form-group">
                    <label>亮度:</label>
                    <input type="range" id="brightnessValue" min="0" max="200" value="100">
                    <span id="brightnessPercent">100%</span>
                </div>
                <button id="applyBrightness" class="btn small">应用亮度</button>
            `;
            break;
            
        case 'contrast':
            controlsHTML = `
                <div class="form-group">
                    <label>对比度:</label>
                    <input type="range" id="contrastValue" min="0" max="200" value="100">
                    <span id="contrastPercent">100%</span>
                </div>
                <button id="applyContrast" class="btn small">应用对比度</button>
            `;
            break;
            
        case 'crop':
            controlsHTML = `
                <div class="form-group">
                    <label>裁剪区域:</label>
                    <div>
                        <label>X: <input type="number" id="cropX" value="0" min="0"></label>
                        <label>Y: <input type="number" id="cropY" value="0" min="0"></label>
                    </div>
                    <div>
                        <label>宽度: <input type="number" id="cropWidth" value="100" min="1"></label>
                        <label>高度: <input type="number" id="cropHeight" value="100" min="1"></label>
                    </div>
                </div>
                <button id="applyCrop" class="btn small">应用裁剪</button>
            `;
            break;
    }
    
    controls.innerHTML = controlsHTML;
    
    // 添加控件事件监听器
    setupEditControlListeners(tool);
}

function setupEditControlListeners(tool) {
    switch (tool) {
        case 'rotate':
            const rotateSlider = document.getElementById('rotateAngle');
            const angleValue = document.getElementById('angleValue');
            
            rotateSlider.addEventListener('input', function() {
                angleValue.textContent = `${this.value}°`;
            });
            
            document.getElementById('applyRotate').addEventListener('click', applyRotation);
            break;
            
        case 'brightness':
            const brightnessSlider = document.getElementById('brightnessValue');
            const brightnessPercent = document.getElementById('brightnessPercent');
            
            brightnessSlider.addEventListener('input', function() {
                brightnessPercent.textContent = `${this.value}%`;
            });
            
            document.getElementById('applyBrightness').addEventListener('click', applyBrightness);
            break;
            
        case 'contrast':
            const contrastSlider = document.getElementById('contrastValue');
            const contrastPercent = document.getElementById('contrastPercent');
            
            contrastSlider.addEventListener('input', function() {
                contrastPercent.textContent = `${this.value}%`;
            });
            
            document.getElementById('applyContrast').addEventListener('click', applyContrast);
            break;
            
        case 'crop':
            document.getElementById('applyCrop').addEventListener('click', applyCrop);
            break;
    }
}

function applyRotation() {
    if (AppState.selectedFrameIndex === null) return;
    
    const angle = parseInt(document.getElementById('rotateAngle').value);
    const frame = AppState.frames[AppState.selectedFrameIndex];
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 计算旋转后的尺寸
    const radians = angle * Math.PI / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    
    canvas.width = frame.image.width * cos + frame.image.height * sin;
    canvas.height = frame.image.width * sin + frame.image.height * cos;
    
    // 旋转和绘制
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);
    ctx.drawImage(frame.image, -frame.image.width / 2, -frame.image.height / 2);
    
    // 更新帧图像
    const rotatedImage = new Image();
    rotatedImage.src = canvas.toDataURL();
    frame.image = rotatedImage;
    
    updateFramesDisplay();
    selectFrame(AppState.selectedFrameIndex); // 重新选择以更新显示
}

function applyBrightness() {
    if (AppState.selectedFrameIndex === null) return;
    
    const value = parseInt(document.getElementById('brightnessValue').value) / 100;
    const frame = AppState.frames[AppState.selectedFrameIndex];
    
    applyImageFilter(frame.image, function(imageData) {
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * value);     // R
            data[i + 1] = Math.min(255, data[i + 1] * value); // G
            data[i + 2] = Math.min(255, data[i + 2] * value); // B
        }
        return imageData;
    }, frame);
}

function applyContrast() {
    if (AppState.selectedFrameIndex === null) return;
    
    const value = parseInt(document.getElementById('contrastValue').value) / 100;
    const frame = AppState.frames[AppState.selectedFrameIndex];
    
    applyImageFilter(frame.image, function(imageData) {
        const data = imageData.data;
        const factor = (259 * (value * 255 + 255)) / (255 * (259 - value * 255));
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = factor * (data[i] - 128) + 128;     // R
            data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
            data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
        }
        return imageData;
    }, frame);
}

function applyCrop() {
    if (AppState.selectedFrameIndex === null) return;
    
    const x = parseInt(document.getElementById('cropX').value);
    const y = parseInt(document.getElementById('cropY').value);
    const width = parseInt(document.getElementById('cropWidth').value);
    const height = parseInt(document.getElementById('cropHeight').value);
    
    const frame = AppState.frames[AppState.selectedFrameIndex];
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(frame.image, x, y, width, height, 0, 0, width, height);
    
    const croppedImage = new Image();
    croppedImage.src = canvas.toDataURL();
    frame.image = croppedImage;
    
    updateFramesDisplay();
    selectFrame(AppState.selectedFrameIndex);
}

function applyImageFilter(image, filterFunction, frame) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    
    ctx.drawImage(image, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const filteredData = filterFunction(imageData);
    
    ctx.putImageData(filteredData, 0, 0);
    
    const filteredImage = new Image();
    filteredImage.src = canvas.toDataURL();
    frame.image = filteredImage;
    
    updateFramesDisplay();
    selectFrame(AppState.selectedFrameIndex);
}

// 历史记录功能
function addToHistory(gifData) {
    const historyItem = {
        id: Date.now(),
        timestamp: gifData.timestamp,
        frames: gifData.frames,
        delay: gifData.delay,
        url: gifData.url,
        preview: gifData.url // 使用相同的URL作为预览
    };
    
    AppState.history.unshift(historyItem);
    
    // 限制历史记录数量
    if (AppState.history.length > 10) {
        AppState.history.pop();
    }
    
    // 保存到本地存储
    localStorage.setItem('gifHistory', JSON.stringify(AppState.history));
    
    // 更新显示
    loadHistory();
}

function loadHistory() {
    const historyList = elements.historyList;
    
    if (AppState.history.length === 0) {
        historyList.innerHTML = '<p class="empty-history">暂无生成记录</p>';
        return;
    }
    
    let historyHTML = '<div class="history-grid">';
    
    AppState.history.forEach(item => {
        const date = new Date(item.timestamp).toLocaleString();
        
        historyHTML += `
            <div class="history-item">
                <img src="${item.preview}" alt="历史记录 ${item.id}">
                <div class="history-info">
                    <p><strong>${date}</strong></p>
                    <p>${item.frames}帧，延迟: ${item.delay}ms</p>
                    <button class="btn small" onclick="loadFromHistory(${item.id})">加载</button>
                </div>
            </div>
        `;
    });
    
    historyHTML += '</div>';
    historyList.innerHTML = historyHTML;
}

function loadFromHistory(id) {
    const item = AppState.history.find(h => h.id === id);
    if (!item) return;
    
    // 加载GIF预览
    elements.gifOutput.src = item.url;
    elements.gifOutput.style.display = 'block';
    elements.gifContainer.querySelector('.empty-preview').style.display = 'none';
    
    alert(`已加载历史记录中的GIF（${item.frames}帧）`);
}

function clearHistory() {
    if (confirm('确定要清除所有历史记录吗？')) {
        AppState.history = [];
        localStorage.removeItem('gifHistory');
        loadHistory();
    }
}

// 重置应用程序
function resetApp() {
    if (confirm('确定要重置所有设置吗？这将清除所有上传的图像和帧。')) {
        AppState.originalImage = null;
        AppState.frames = [];
        AppState.currentGif = null;
        AppState.selectedFrameIndex = null;
        
        // 重置UI
        elements.originalCanvas.getContext('2d').clearRect(0, 0, 
            elements.originalCanvas.width, elements.originalCanvas.height);
        elements.gridOverlay.innerHTML = '';
        elements.gifOutput.src = '';
        elements.gifOutput.style.display = 'none';
        elements.gifContainer.querySelector('.empty-preview').style.display = 'block';
        elements.fileInfo.textContent = '';
        
        // 重置输入
        elements.rowsInput.value = 1;
        elements.colsInput.value = 1;
        elements.frameDelayInput.value = 100;
        elements.playbackSpeed.value = 1;
        elements.bgColor.value = 'white';
        elements.batchMode.checked = false;
        toggleBatchMode();
        
        updateFramesDisplay();
        updateUI();
        
        alert('应用程序已重置！');
    }
}

// 更新文件信息
function updateFileInfo(file) {
    const fileSize = file.size ? ` (${formatFileSize(file.size)})` : '';
    elements.fileInfo.innerHTML = `
        <p><strong>文件:</strong> ${file.name}</p>
        <p><strong>状态:</strong> 已加载${fileSize}</p>
    `;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 更新进度
function updateProgress(percent, text) {
    elements.progressBar.style.width = `${percent}%`;
    elements.progressText.textContent = text;
}

// 更新UI状态
function updateUI() {
    const hasFrames = AppState.frames.length > 0;
    elements.generateBtn.disabled = !hasFrames || AppState.isProcessing;
    elements.saveBtn.disabled = !AppState.currentGif;
    
    // 更新按钮文本
    elements.generateBtn.innerHTML = AppState.isProcessing ? 
        '<i class="fas fa-spinner fa-spin"></i> 生成中...' : 
        '<i class="fas fa-cogs"></i> 生成GIF';
}

// 显示使用说明
function showInstructions() {
    document.getElementById('instructionsModal').style.display = 'flex';
}

// 初始化应用程序
document.addEventListener('DOMContentLoaded', initApp);
