// ====================
// 全局状态和配置
// ====================
const AppState = {
    originalImage: null,
    frames: [],
    currentGIF: null,
    isProcessing: false,
    selectedFrameIndex: -1,
    editHistory: [],
    historyIndex: -1,
    
    // 网格设置
    grid: {
        rows: 1,
        cols: 1,
        showGrid: true
    },
    
    // GIF设置
    settings: {
        frameDelay: 100,
        playbackSpeed: 1,
        backgroundColor: 'transparent',
        loop: true,
        quality: 10
    },
    
    // 编辑历史
    editStack: {
        undo: [],
        redo: []
    },
    
    // 历史记录
    history: JSON.parse(localStorage.getItem('gifHistory') || '[]')
};

// ====================
// DOM元素缓存
// ====================
const DOM = {
    // 上传相关
    uploadArea: document.getElementById('uploadArea'),
    spriteInput: document.getElementById('spriteInput'),
    batchMode: document.getElementById('batchMode'),
    batchInput: document.getElementById('batchInput'),
    fileStatus: document.getElementById('fileStatus'),
    fileInfo: document.getElementById('fileInfo'),
    
    // 网格设置
    rowsInput: document.getElementById('rows'),
    colsInput: document.getElementById('cols'),
    autoDetectBtn: document.getElementById('autoDetectBtn'),
    
    // 动画设置
    frameDelay: document.getElementById('frameDelay'),
    delayValue: document.getElementById('delayValue'),
    playbackSpeed: document.querySelectorAll('.speed-btn'),
    bgColor: document.getElementById('bgColor'),
    
    // 预览相关
    originalCanvas: document.getElementById('originalCanvas'),
    gridOverlay: document.getElementById('gridOverlay'),
    originalStats: document.getElementById('originalStats'),
    gifContainer: document.getElementById('gifContainer'),
    gifOutput: document.getElementById('gifOutput'),
    emptyGif: document.getElementById('emptyGif'),
    gifStats: document.getElementById('gifStats'),
    
    // 帧管理
    framesContainer: document.getElementById('framesContainer'),
    frameCount: document.getElementById('frameCount'),
    emptyFrames: document.getElementById('emptyFrames'),
    
    // 编辑工具
    editNotice: document.getElementById('editNotice'),
    editControls: document.getElementById('editControls'),
    editButtons: document.querySelectorAll('.edit-btn'),
    
    // 按钮
    generateBtn: document.getElementById('generateBtn'),
    saveBtn: document.getElementById('saveBtn'),
    resetBtn: document.getElementById('resetBtn'),
    playBtn: document.getElementById('playBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    stopBtn: document.getElementById('stopBtn'),
    loopBtn: document.getElementById('loopBtn'),
    
    // 工具按钮
    sortBtn: document.getElementById('sortBtn'),
    reverseBtn: document.getElementById('reverseBtn'),
    clearFramesBtn: document.getElementById('clearFramesBtn'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    zoomOutBtn: document.getElementById('zoomOutBtn'),
    fitCanvasBtn: document.getElementById('fitCanvasBtn'),
    
    // 编辑历史
    undoBtn: document.getElementById('undoBtn'),
    redoBtn: document.getElementById('redoBtn'),
    applyEditBtn: document.getElementById('applyEditBtn'),
    
    // 进度条
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText'),
    progressPercent: document.getElementById('progressPercent'),
    
    // 快速操作
    quickButtons: document.querySelectorAll('.quick-btn'),
    presetButtons: document.querySelectorAll('.preset-btn'),
    
    // 历史记录
    historyList: document.getElementById('historyList'),
    clearHistoryBtn: document.getElementById('clearHistoryBtn'),
    
    // 模态框
    instructionsModal: document.getElementById('instructionsModal'),
    sampleModal: document.getElementById('sampleModal')
};

// ====================
// 工具函数
// ====================

/**
 * 更新UI状态
 */
function updateUI() {
    // 更新按钮状态
    DOM.generateBtn.disabled = AppState.frames.length === 0 || AppState.isProcessing;
    DOM.saveBtn.disabled = !AppState.currentGIF;
    DOM.playBtn.disabled = !AppState.currentGIF;
    DOM.pauseBtn.disabled = !AppState.currentGIF;
    DOM.stopBtn.disabled = !AppState.currentGIF;
    
    // 更新编辑按钮状态
    const hasSelection = AppState.selectedFrameIndex !== -1;
    DOM.undoBtn.disabled = AppState.editStack.undo.length === 0;
    DOM.redoBtn.disabled = AppState.editStack.redo.length === 0;
    DOM.applyEditBtn.style.display = 'none';
    
    // 更新编辑提示
    DOM.editNotice.style.display = hasSelection ? 'none' : 'block';
    DOM.editControls.style.display = hasSelection ? 'block' : 'none';
    
    // 更新帧数显示
    DOM.frameCount.textContent = `${AppState.frames.length} 帧`;
    
    // 更新进度按钮
    DOM.generateBtn.innerHTML = AppState.isProcessing ? 
        '<i class="fas fa-spinner fa-spin"></i> 生成中...' : 
        '<i class="fas fa-play"></i> 生成GIF动画';
}

/**
 * 更新进度显示
 */
function updateProgress(percent, text) {
    DOM.progressBar.style.width = `${percent}%`;
    DOM.progressPercent.textContent = `${Math.round(percent)}%`;
    DOM.progressText.textContent = text;
}

/**
 * 显示消息
 */
function showMessage(message, type = 'info') {
    const colors = {
        info: '#3498db',
        success: '#2ecc71',
        warning: '#f39c12',
        error: '#e74c3c'
    };
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${colors[type]};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        ">
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
            ${message}
        </div>
    `;
    
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
}

// ====================
// 图像处理函数
// ====================

/**
 * 处理文件上传
 */
function handleFileUpload(file) {
    if (!file.type.match('image.*')) {
        showMessage('请选择图像文件！', 'error');
        return;
    }
    
    DOM.fileStatus.textContent = '加载中...';
    DOM.fileStatus.style.color = '#f39c12';
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            AppState.originalImage = img;
            updateOriginalPreview(img);
            updateFileInfo(file);
            splitImageToFrames();
            DOM.fileStatus.textContent = '已加载';
            DOM.fileStatus.style.color = '#2ecc71';
            showMessage('图像加载成功！', 'success');
        };
        img.onerror = function() {
            DOM.fileStatus.textContent = '加载失败';
            DOM.fileStatus.style.color = '#e74c3c';
            showMessage('图像加载失败，请重试', 'error');
        };
        img.src = e.target.result;
    };
    reader.onerror = function() {
        DOM.fileStatus.textContent = '读取失败';
        DOM.fileStatus.style.color = '#e74c3c';
    };
    reader.readAsDataURL(file);
}

/**
 * 更新文件信息显示
 */
function updateFileInfo(file) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const dimensions = AppState.originalImage ? 
        `${AppState.originalImage.width} × ${AppState.originalImage.height}` : '未知';
    
    DOM.fileInfo.innerHTML = `
        <div class="info-item">
            <span>文件名：</span>
            <span class="value">${file.name}</span>
        </div>
        <div class="info-item">
            <span>文件大小：</span>
            <span class="value">${sizeMB} MB</span>
        </div>
        <div class="info-item">
            <span>图像尺寸：</span>
            <span class="value">${dimensions}</span>
        </div>
    `;
    
    DOM.originalStats.textContent = dimensions;
}

/**
 * 更新原始图像预览
 */
function updateOriginalPreview(img) {
    const canvas = DOM.originalCanvas;
    const ctx = canvas.getContext('2d');
    
    // 计算适合预览的尺寸
    const maxWidth = 400;
    const maxHeight = 300;
    
    let width = img.width;
    let height = img.height;
    
    if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
    }
    
    if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width = width * ratio;
    }
    
    // 设置画布尺寸
    canvas.width = width;
    canvas.height = height;
    
    // 绘制图像
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, width, height);
    
    // 绘制网格
    drawGrid();
}

/**
 * 绘制网格
 */
function drawGrid() {
    if (!AppState.grid.showGrid || !AppState.originalImage) return;
    
    const rows = AppState.grid.rows;
    const cols = AppState.grid.cols;
    const canvas = DOM.originalCanvas;
    
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
                    border: 2px solid rgba(231, 76, 60, 0.6);
                    box-sizing: border-box;
                    pointer-events: none;
                    z-index: 10;
                "></div>
            `;
        }
    }
    
    DOM.gridOverlay.innerHTML = gridHTML;
}

/**
 * 分割图像为帧
 */
function splitImageToFrames() {
    if (!AppState.originalImage) {
        showMessage('请先上传图像', 'warning');
        return;
    }
    
    const rows = AppState.grid.rows;
    const cols = AppState.grid.cols;
    const img = AppState.originalImage;
    
    // 清空现有帧
    AppState.frames = [];
    AppState.selectedFrameIndex = -1;
    
    // 计算每帧尺寸
    const frameWidth = Math.floor(img.width / cols);
    const frameHeight = Math.floor(img.height / rows);
    
    // 创建临时画布
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = frameWidth;
    tempCanvas.height = frameHeight;
    
    // 分割图像
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            // 清空画布
            tempCtx.clearRect(0, 0, frameWidth, frameHeight);
            
            // 绘制当前帧
            tempCtx.drawImage(
                img,
                col * frameWidth, row * frameHeight, frameWidth, frameHeight,
                0, 0, frameWidth, frameHeight
            );
            
            // 创建新图像
            const frameImg = new Image();
            frameImg.src = tempCanvas.toDataURL();
            
            // 添加到帧数组
            AppState.frames.push({
                image: frameImg,
                index: row * cols + col,
                delay: AppState.settings.frameDelay,
                originalPosition: { row, col }
            });
        }
    }
    
    // 更新显示
    updateFramesDisplay();
    drawGrid();
    showMessage(`成功分割为 ${rows}×${cols} 共 ${AppState.frames.length} 帧`, 'success');
}

/**
 * 更新帧显示
 */
function updateFramesDisplay() {
    const container = DOM.framesContainer;
    
    if (AppState.frames.length === 0) {
        DOM.emptyFrames.style.display = 'block';
        container.innerHTML = '';
        updateUI();
        return;
    }
    
    DOM.emptyFrames.style.display = 'none';
    
    // 清空容器
    container.innerHTML = '';
    
    // 创建帧缩略图
    AppState.frames.forEach((frame, index) => {
        const frameItem = document.createElement('div');
        frameItem.className = `frame-item ${index === AppState.selectedFrameIndex ? 'active' : ''}`;
        frameItem.draggable = true;
        frameItem.dataset.index = index;
        
        // 缩略图
        const img = document.createElement('img');
        img.src = frame.image.src;
        img.alt = `帧 ${index + 1}`;
        
        // 帧编号
        const frameNumber = document.createElement('div');
        frameNumber.className = 'frame-number';
        frameNumber.textContent = index + 1;
        
        // 选择指示器
        const selector = document.createElement('div');
        selector.className = 'frame-selector';
        selector.innerHTML = '<i class="fas fa-check"></i>';
        
        frameItem.appendChild(img);
        frameItem.appendChild(frameNumber);
        frameItem.appendChild(selector);
        container.appendChild(frameItem);
        
        // 添加事件监听器
        frameItem.addEventListener('click', () => selectFrame(index));
        
        // 拖放功能
        frameItem.addEventListener('dragstart', handleDragStart);
        frameItem.addEventListener('dragover', handleDragOver);
        frameItem.addEventListener('drop', handleDrop);
        frameItem.addEventListener('dragend', handleDragEnd);
    });
    
    updateUI();
}

/**
 * 选择帧
 */
function selectFrame(index) {
    if (index < 0 || index >= AppState.frames.length) return;
    
    AppState.selectedFrameIndex = index;
    
    // 移除所有激活状态
    document.querySelectorAll('.frame-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // 激活选中的帧
    const selectedItem = document.querySelector(`.frame-item[data-index="${index}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active');
        selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // 更新编辑工具
    updateEditTools();
    updateUI();
}

// ====================
// 拖放功能
// ====================
let draggedIndex = null;

function handleDragStart(e) {
    draggedIndex = parseInt(this.dataset.index);
    this.classList.add('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const targetIndex = parseInt(this.dataset.index);
    
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
        // 交换帧位置
        [AppState.frames[draggedIndex], AppState.frames[targetIndex]] = 
        [AppState.frames[targetIndex], AppState.frames[draggedIndex]];
        
        // 更新显示
        updateFramesDisplay();
        
        // 保持选中状态
        selectFrame(targetIndex);
        
        showMessage(`已交换帧 ${draggedIndex + 1} 和 ${targetIndex + 1}`, 'info');
    }
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedIndex = null;
}

// ====================
// GIF生成功能
// ====================

/**
 * 生成GIF
 */
async function generateGIF() {
    if (AppState.frames.length === 0) {
        showMessage('没有可用的帧！请先上传并分割图像。', 'warning');
        return;
    }
    
    // 检查GIF库是否加载
    if (typeof GIF === 'undefined') {
        showMessage('GIF库加载失败，请刷新页面重试', 'error');
        return;
    }
    
    try {
        AppState.isProcessing = true;
        updateUI();
        updateProgress(0, '正在初始化...');
        
        // 获取设置
        const delay = AppState.settings.frameDelay;
        const speed = AppState.settings.playbackSpeed;
        const adjustedDelay = Math.floor(delay / speed);
        
        // 创建GIF实例
        const gif = new GIF({
            workers: 2,
            quality: AppState.settings.quality,
            width: AppState.frames[0].image.width,
            height: AppState.frames[0].image.height,
            background: AppState.settings.backgroundColor === 'transparent' ? null : AppState.settings.backgroundColor,
            workerScript: 'https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js'
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
            if (AppState.settings.backgroundColor !== 'transparent') {
                ctx.fillStyle = AppState.settings.backgroundColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            // 绘制图像
            ctx.drawImage(frame.image, 0, 0);
            
            // 添加到GIF
            gif.addFrame(canvas, { delay: adjustedDelay });
            
            // 更新进度
            const progress = Math.floor((i + 1) / AppState.frames.length * 80);
            updateProgress(progress, `正在添加帧 ${i + 1}/${AppState.frames.length}`);
            
            // 短暂延迟避免阻塞
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // 生成GIF
        updateProgress(90, '正在生成GIF文件...');
        
        gif.on('progress', function(p) {
            const progress = 90 + Math.floor(p * 10);
            updateProgress(progress, '正在编码GIF...');
        });
        
        gif.on('finished', function(blob) {
            // 创建对象URL
            const url = URL.createObjectURL(blob);
            
            // 更新预览
            DOM.gifOutput.src = url;
            DOM.gifOutput.style.display = 'block';
            DOM.emptyGif.style.display = 'none';
            
            // 更新统计信息
            const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
            DOM.gifStats.textContent = `${AppState.frames.length}帧 · ${sizeMB}MB`;
            
            // 保存到状态
            AppState.currentGIF = {
                blob: blob,
                url: url,
                frames: AppState.frames.length,
                delay: delay,
                timestamp: new Date().toISOString(),
                size: blob.size
            };
            
            // 添加到历史记录
            addToHistory(AppState.currentGIF);
            
            // 更新UI
            updateProgress(100, 'GIF生成完成！');
            AppState.isProcessing = false;
            updateUI();
            
            showMessage('GIF生成成功！', 'success');
            
            // 3秒后重置进度
            setTimeout(() => updateProgress(0, '准备就绪'), 3000);
        });
        
        gif.render();
        
    } catch (error) {
        console.error('生成GIF时出错:', error);
        showMessage('生成GIF时出错: ' + error.message, 'error');
        
        AppState.isProcessing = false;
        updateProgress(0, '生成失败');
        updateUI();
    }
}

/**
 * 保存GIF
 */
function saveGIF() {
    if (!AppState.currentGIF) {
        showMessage('没有可保存的GIF！', 'warning');
        return;
    }
    
    try {
        const link = document.createElement('a');
        link.href = AppState.currentGIF.url;
        link.download = `动画_${new Date().getTime()}.gif`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage('GIF已开始下载', 'success');
    } catch (error) {
        showMessage('下载失败: ' + error.message, 'error');
    }
}

// ====================
// 编辑工具函数
// ====================

function updateEditTools() {
    if (AppState.selectedFrameIndex === -1) {
        DOM.editControls.innerHTML = '';
        return;
    }
    
    // 根据当前工具显示不同的控件
    // 这里只实现一个简单的旋转控件作为示例
    DOM.editControls.innerHTML = `
        <div class="edit-tool-controls">
            <div class="form-group">
                <label>旋转角度: <span id="rotateValue">0°</span></label>
                <input type="range" id="rotateSlider" min="0" max="360" value="0" class="slider">
            </div>
            <div class="form-group">
                <label>亮度: <span id="brightnessValue">100%</span></label>
                <input type="range" id="brightnessSlider" min="0" max="200" value="100" class="slider">
            </div>
            <div class="edit-actions">
                <button id="applyEditBtn" class="btn small primary">
                    <i class="fas fa-check"></i> 应用修改
                </button>
                <button id="cancelEditBtn" class="btn small">
                    <i class="fas fa-times"></i> 取消
                </button>
            </div>
        </div>
    `;
    
    // 添加事件监听器
    const rotateSlider = document.getElementById('rotateSlider');
    const brightnessSlider = document.getElementById('brightnessSlider');
    const rotateValue = document.getElementById('rotateValue');
    const brightnessValue = document.getElementById('brightnessValue');
    
    rotateSlider.addEventListener('input', function() {
        rotateValue.textContent = `${this.value}°`;
    });
    
    brightnessSlider.addEventListener('input', function() {
        brightnessValue.textContent = `${this.value}%`;
    });
    
    document.getElementById('applyEditBtn').addEventListener('click', applyEdit);
    document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);
}

function applyEdit() {
    const rotateValue = parseInt(document.getElementById('rotateSlider').value);
    const brightnessValue = parseInt(document.getElementById('brightnessSlider').value);
    
    if (AppState.selectedFrameIndex === -1) return;
    
    const frame = AppState.frames[AppState.selectedFrameIndex];
    
    // 保存当前状态到撤销栈
    AppState.editStack.undo.push({
        image: frame.image.src,
        index: AppState.selectedFrameIndex
    });
    AppState.editStack.redo = [];
    
    // 应用旋转
    if (rotateValue !== 0) {
        applyRotation(frame, rotateValue);
    }
    
    // 应用亮度调整
    if (brightnessValue !== 100) {
        applyBrightness(frame, brightnessValue);
    }
    
    // 更新显示
    updateFramesDisplay();
    selectFrame(AppState.selectedFrameIndex);
    updateUI();
    
    showMessage('修改已应用', 'success');
}

function cancelEdit() {
    DOM.editControls.innerHTML = '';
    showMessage('已取消编辑', 'info');
}

function applyRotation(frame, angle) {
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
}

function applyBrightness(frame, value) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = frame.image.width;
    canvas.height = frame.image.height;
    
    ctx.drawImage(frame.image, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const factor = value / 100;
    
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * factor);       // R
        data[i + 1] = Math.min(255, data[i + 1] * factor); // G
        data[i + 2] = Math.min(255, data[i + 2] * factor); // B
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const adjustedImage = new Image();
    adjustedImage.src = canvas.toDataURL();
    frame.image = adjustedImage;
}

// ====================
// 预设效果
// ====================

function applyPreset(effect) {
    if (AppState.frames.length === 0) {
        showMessage('没有可应用的帧！', 'warning');
        return;
    }
    
    const originalFrames = [...AppState.frames];
    
    switch (effect) {
        case 'blink':
            // 闪烁效果
            const blinkFrames = [];
            originalFrames.forEach(frame => {
                blinkFrames.push(frame);
                // 添加半透明帧
                const blinkFrame = { ...frame };
                blinkFrame.image = createSemiTransparentImage(frame.image, 0.5);
                blinkFrames.push(blinkFrame);
            });
            AppState.frames = blinkFrames;
            break;
            
        case 'bounce':
            // 弹跳效果：正向->反向
            const bounceFrames = [...originalFrames];
            for (let i = originalFrames.length - 2; i > 0; i--) {
                bounceFrames.push({ ...originalFrames[i] });
            }
            AppState.frames = bounceFrames;
            break;
            
        case 'reverse':
            // 反向播放
            AppState.frames = originalFrames.reverse();
            break;
            
        case 'fade':
            // 淡入淡出效果
            const fadeFrames = [];
            for (let i = 0; i < originalFrames.length; i++) {
                const opacity = i / (originalFrames.length - 1);
                const fadeFrame = { ...originalFrames[i] };
                fadeFrame.image = createSemiTransparentImage(fadeFrame.image, opacity);
                fadeFrames.push(fadeFrame);
            }
            AppState.frames = fadeFrames;
            break;
    }
    
    updateFramesDisplay();
    showMessage(`已应用"${effect}"效果`, 'success');
}

function createSemiTransparentImage(image, opacity) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    
    ctx.globalAlpha = opacity;
    ctx.drawImage(image, 0, 0);
    
    const result = new Image();
    result.src = canvas.toDataURL();
    return result;
}

// ====================
// 历史记录功能
// ====================

function addToHistory(gifData) {
    const historyItem = {
        id: Date.now(),
        timestamp: gifData.timestamp,
        frames: gifData.frames,
        delay: gifData.delay,
        size: gifData.size,
        url: gifData.url,
        preview: gifData.url
    };
    
    AppState.history.unshift(historyItem);
    
    // 限制历史记录数量
    if (AppState.history.length > 10) {
        AppState.history.pop();
    }
    
    // 保存到本地存储
    localStorage.setItem('gifHistory', JSON.stringify(AppState.history));
    
    // 更新显示
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const container = DOM.historyList;
    
    if (AppState.history.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clock fa-3x"></i>
                <p>暂无生成记录</p>
                <p class="hint">生成的GIF将自动保存到这里</p>
            </div>
        `;
        return;
    }
    
    let historyHTML = '<div class="history-grid">';
    
    AppState.history.forEach(item => {
        const date = new Date(item.timestamp).toLocaleString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const sizeMB = (item.size / (1024 * 1024)).toFixed(2);
        
        historyHTML += `
            <div class="history-item">
                <img src="${item.preview}" alt="历史记录" class="history-preview">
                <div class="history-info">
                    <div class="history-time">${date}</div>
                    <div class="history-stats">${item.frames}帧 · ${sizeMB}MB</div>
                    <div class="history-actions">
                        <button class="btn small" onclick="loadHistoryItem(${item.id})">
                            <i class="fas fa-eye"></i> 查看
                        </button>
                        <button class="btn small" onclick="downloadHistoryItem(${item.id})">
                            <i class="fas fa-download"></i> 下载
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    historyHTML += '</div>';
    container.innerHTML = historyHTML;
}

function loadHistoryItem(id) {
    const item = AppState.history.find(h => h.id === id);
    if (!item) return;
    
    // 加载GIF预览
    DOM.gifOutput.src = item.url;
    DOM.gifOutput.style.display = 'block';
    DOM.emptyGif.style.display = 'none';
    DOM.gifStats.textContent = `${item.frames}帧 · ${(item.size / (1024 * 1024)).toFixed(2)}MB`;
    
    showMessage('已加载历史记录', 'info');
}

function downloadHistoryItem(id) {
    const item = AppState.history.find(h => h.id === id);
    if (!item) return;
    
    const link = document.createElement('a');
    link.href = item.url;
    link.download = `历史记录_${id}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('历史记录已开始下载', 'success');
}

// ====================
// 事件监听器设置
// ====================

function setupEventListeners() {
    // 文件上传
    DOM.uploadArea.addEventListener('click', () => DOM.spriteInput.click());
    DOM.spriteInput.addEventListener('change', (e) => {
        if (e.target.files[0]) handleFileUpload(e.target.files[0]);
    });
    
    // 拖放上传
    DOM.uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        DOM.uploadArea.classList.add('drag-over');
    });
    
    DOM.uploadArea.addEventListener('dragleave', () => {
        DOM.uploadArea.classList.remove('drag-over');
    });
    
    DOM.uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        DOM.uploadArea.classList.remove('drag-over');
        if (e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    });
    
    // 网格设置
    DOM.rowsInput.addEventListener('change', (e) => {
        AppState.grid.rows = parseInt(e.target.value) || 1;
        if (AppState.originalImage) splitImageToFrames();
    });
    
    DOM.colsInput.addEventListener('change', (e) => {
        AppState.grid.cols = parseInt(e.target.value) || 1;
        if (AppState.originalImage) splitImageToFrames();
    });
    
    // 自动检测网格（简化版）
    DOM.autoDetectBtn.addEventListener('click', () => {
        if (!AppState.originalImage) {
            showMessage('请先上传图像', 'warning');
            return;
        }
        
        // 简单逻辑：尝试检测明显的颜色边界
        const img = AppState.originalImage;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // 检测水平方向的显著变化
        let detectedCols = 1;
        const sampleY = Math.floor(img.height / 2);
        
        for (let x = 1; x < img.width - 1; x++) {
            const leftColor = ctx.getImageData(x - 1, sampleY, 1, 1).data;
            const rightColor = ctx.getImageData(x + 1, sampleY, 1, 1).data;
            
            const diff = Math.abs(leftColor[0] - rightColor[0]) +
                        Math.abs(leftColor[1] - rightColor[1]) +
                        Math.abs(leftColor[2] - rightColor[2]);
            
            if (diff > 50) { // 阈值
                detectedCols++;
            }
        }
        
        detectedCols = Math.max(1, Math.min(10, detectedCols));
        AppState.grid.cols = detectedCols;
        AppState.grid.rows = 1;
        
        DOM.colsInput.value = detectedCols;
        DOM.rowsInput.value = 1;
        
        if (AppState.originalImage) splitImageToFrames();
        showMessage(`检测到 ${detectedCols} 列`, 'info');
    });
    
    // 动画设置
    DOM.frameDelay.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        AppState.settings.frameDelay = value;
        DOM.delayValue.textContent = `${value}ms`;
        
        // 更新所有帧的延迟
        AppState.frames.forEach(frame => {
            frame.delay = value;
        });
    });
    
    // 播放速度按钮
    DOM.playbackSpeed.forEach(btn => {
        btn.addEventListener('click', (e) => {
            DOM.playbackSpeed.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            AppState.settings.playbackSpeed = parseFloat(btn.dataset.speed);
        });
    });
    
    // 背景颜色
    DOM.bgColor.addEventListener('change', (e) => {
        AppState.settings.backgroundColor = e.target.value;
    });
    
    // 主要按钮
    DOM.generateBtn.addEventListener('click', generateGIF);
    DOM.saveBtn.addEventListener('click', saveGIF);
    DOM.resetBtn.addEventListener('click', resetApp);
    
    // GIF控制按钮
    DOM.playBtn.addEventListener('click', () => {
        if (DOM.gifOutput.src) {
            DOM.gifOutput.style.animationPlayState = 'running';
        }
    });
    
    DOM.pauseBtn.addEventListener('click', () => {
        if (DOM.gifOutput.src) {
            DOM.gifOutput.style.animationPlayState = 'paused';
        }
    });
    
    DOM.stopBtn.addEventListener('click', () => {
        if (DOM.gifOutput.src) {
            DOM.gifOutput.currentTime = 0;
            DOM.gifOutput.style.animationPlayState = 'paused';
        }
    });
    
    // 帧操作按钮
    DOM.sortBtn.addEventListener('click', () => {
        AppState.frames.sort((a, b) => a.index - b.index);
        updateFramesDisplay();
        showMessage('已按原始顺序排序', 'info');
    });
    
    DOM.reverseBtn.addEventListener('click', () => {
        AppState.frames.reverse();
        updateFramesDisplay();
        showMessage('已反转帧顺序', 'info');
    });
    
    DOM.clearFramesBtn.addEventListener('click', () => {
        if (confirm('确定要清空所有帧吗？')) {
            AppState.frames = [];
            AppState.selectedFrameIndex = -1;
            updateFramesDisplay();
            showMessage('已清空所有帧', 'info');
        }
    });
    
    // 编辑工具
    DOM.editButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (AppState.selectedFrameIndex === -1) {
                showMessage('请先选择一个帧进行编辑', 'warning');
                return;
            }
            
            const tool = btn.dataset.tool;
            activateEditTool(tool);
        });
    });
    
    // 预设效果
    DOM.presetButtons.forEach(btn => {
        btn.addEventListener('click', () => applyPreset(btn.dataset.effect));
    });
    
    // 快速操作
    DOM.quickButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            handleQuickAction(action);
        });
    });
    
    // 历史记录
    DOM.clearHistoryBtn.addEventListener('click', () => {
        if (confirm('确定要清除所有历史记录吗？')) {
            AppState.history = [];
            localStorage.removeItem('gifHistory');
            updateHistoryDisplay();
            showMessage('已清除历史记录', 'info');
        }
    });
    
    // 初始化数值按钮
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.dataset.target;
            const input = document.getElementById(target);
            let value = parseInt(input.value);
            
            if (this.classList.contains('plus')) {
                value = Math.min(parseInt(input.max), value + 1);
            } else {
                value = Math.max(parseInt(input.min), value - 1);
            }
            
            input.value = value;
            
            if (target === 'rows') {
                AppState.grid.rows = value;
            } else if (target === 'cols') {
                AppState.grid.cols = value;
            }
            
            if (AppState.originalImage) splitImageToFrames();
        });
    });
}

function handleQuickAction(action) {
    if (AppState.selectedFrameIndex === -1) {
        showMessage('请先选择一个帧', 'warning');
        return;
    }
    
    switch (action) {
        case 'reverse':
            // 反向当前帧顺序
            AppState.frames[AppState.selectedFrameIndex].image = 
                createFlippedImage(AppState.frames[AppState.selectedFrameIndex].image, true, false);
            break;
        case 'duplicate':
            // 复制当前帧
            const frame = AppState.frames[AppState.selectedFrameIndex];
            const newFrame = {
                ...frame,
                index: AppState.frames.length
            };
            AppState.frames.splice(AppState.selectedFrameIndex + 1, 0, newFrame);
            break;
        case 'remove':
            // 删除当前帧
            if (AppState.frames.length > 1) {
                AppState.frames.splice(AppState.selectedFrameIndex, 1);
                AppState.selectedFrameIndex = Math.max(0, AppState.selectedFrameIndex - 1);
            }
            break;
    }
    
    updateFramesDisplay();
    showMessage(`已执行"${action}"操作`, 'info');
}

function createFlippedImage(image, horizontal = false, vertical = false) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    
    if (horizontal) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
    }
    if (vertical) {
        ctx.translate(0, canvas.height);
        ctx.scale(1, -1);
    }
    
    ctx.drawImage(image, 0, 0);
    
    const result = new Image();
    result.src = canvas.toDataURL();
    return result;
}

function activateEditTool(tool) {
    AppState.currentEditTool = tool;
    updateEditTools();
    showMessage(`已激活"${tool}"工具`, 'info');
}

function resetApp() {
    if (confirm('确定要重置所有设置吗？这将清除所有上传的图像和帧。')) {
        AppState.originalImage = null;
        AppState.frames = [];
        AppState.currentGIF = null;
        AppState.selectedFrameIndex = -1;
        AppState.grid.rows = 1;
        AppState.grid.cols = 1;
        
        // 重置UI
        const ctx = DOM.originalCanvas.getContext('2d');
        ctx.clearRect(0, 0, DOM.originalCanvas.width, DOM.originalCanvas.height);
        DOM.gridOverlay.innerHTML = '';
        DOM.gifOutput.src = '';
        DOM.gifOutput.style.display = 'none';
        DOM.emptyGif.style.display = 'block';
        DOM.fileInfo.innerHTML = '';
        DOM.fileStatus.textContent = '等待上传';
        DOM.originalStats.textContent = '未加载';
        DOM.gifStats.textContent = '等待生成';
        
        // 重置输入
        DOM.rowsInput.value = 1;
        DOM.colsInput.value = 1;
        DOM.frameDelay.value = 100;
        DOM.delayValue.textContent = '100ms';
        DOM.bgColor.value = 'transparent';
        
        // 重置播放速度按钮
        DOM.playbackSpeed.forEach((btn, index) => {
            btn.classList.toggle('active', index === 1); // 第二个按钮是1x
        });
        
        updateFramesDisplay();
        updateUI();
        updateProgress(0, '准备就绪');
        
        showMessage('应用程序已重置', 'success');
    }
}

// ====================
// 初始化应用程序
// ====================

function initApp() {
    console.log('正在初始化精灵表GIF生成器...');
    
    // 设置事件监听器
    setupEventListeners();
    
    // 更新UI状态
    updateUI();
    
    // 加载历史记录
    updateHistoryDisplay();
    
    // 设置CSS动画
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .frame-item.dragging {
            opacity: 0.5;
            transform: scale(0.95);
        }
        
        .frame-item.active {
            border-color: #e74c3c !important;
            box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.2);
        }
        
        .drag-over {
            background: rgba(52, 152, 219, 0.1) !important;
            border-color: #3498db !important;
        }
        
        .speed-btn.active {
            background: #3498db !important;
            color: white !important;
            border-color: #3498db !important;
        }
        
        .num-btn {
            padding: 5px 12px;
            border: 1px solid #ddd;
            background: white;
            cursor: pointer;
            font-size: 1rem;
        }
        
        .num-btn:hover {
            background: #f0f0f0;
        }
        
        .num-btn:first-child {
            border-radius: 4px 0 0 4px;
        }
        
        .num-btn:last-child {
            border-radius: 0 4px 4px 0;
        }
        
        .input-with-buttons {
            display: flex;
        }
        
        .input-with-buttons input {
            border-radius: 0;
            border-left: none;
            border-right: none;
            text-align: center;
        }
        
        .slider {
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: #ddd;
            outline: none;
        }
        
        .slider::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #3498db;
            cursor: pointer;
        }
        
        .range-labels {
            display: flex;
            justify-content: space-between;
            margin-top: 5px;
            font-size: 0.8rem;
            color: #666;
        }
        
        .history-grid {
            display: grid;
            gap: 10px;
        }
        
        .history-item {
            display: flex;
            gap: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
        }
        
        .history-preview {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 4px;
        }
        
        .history-info {
            flex: 1;
        }
        
        .history-time {
            font-weight: bold;
            color: #2c3e50;
        }
        
        .history-stats {
            font-size: 0.9rem;
            color: #666;
            margin: 5px 0;
        }
        
        .history-actions {
            display: flex;
            gap: 5px;
        }
    `;
    document.head.appendChild(style);
    
    console.log('应用程序初始化完成！');
    showMessage('精灵表GIF生成器已就绪！', 'success');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);

// 全局导出函数（供HTML内联调用）
window.loadHistoryItem = loadHistoryItem;
window.downloadHistoryItem = downloadHistoryItem;
::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
