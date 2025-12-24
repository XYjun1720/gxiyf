// ====================
// 应用程序状态
// ====================
const AppState = {
    // 图像数据
    originalImage: null,
    frames: [],
    currentGIF: null,
    
    // 处理状态
    isProcessing: false,
    selectedFrameIndex: -1,
    
    // 设置
    grid: { rows: 1, cols: 1 },
    settings: {
        frameDelay: 100,
        playbackSpeed: 1,
        backgroundColor: 'transparent'
    }
};

// ====================
// DOM元素缓存
// ====================
const DOM = {
    // 文件上传
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    selectFileBtn: document.getElementById('selectFileBtn'),
    sampleBtn: document.getElementById('sampleBtn'),
    batchMode: document.getElementById('batchMode'),
    fileInfo: document.getElementById('fileInfo'),
    fileStatus: document.getElementById('fileStatus'),
    
    // 网格设置
    rowsInput: document.getElementById('rows'),
    colsInput: document.getElementById('cols'),
    autoDetectBtn: document.getElementById('autoDetectBtn'),
    
    // GIF设置
    frameDelay: document.getElementById('frameDelay'),
    delayValue: document.getElementById('delayValue'),
    playbackSpeed: document.querySelectorAll('.speed-btn'),
    bgColor: document.getElementById('bgColor'),
    
    // 预览
    originalCanvas: document.getElementById('originalCanvas'),
    gridOverlay: document.getElementById('gridOverlay'),
    imageStats: document.getElementById('imageStats'),
    gifOutput: document.getElementById('gifOutput'),
    gifDisplay: document.getElementById('gifDisplay'),
    gifStats: document.getElementById('gifStats'),
    
    // 帧管理
    framesContainer: document.getElementById('framesContainer'),
    frameCount: document.getElementById('frameCount'),
    
    // 按钮
    generateBtn: document.getElementById('generateBtn'),
    saveBtn: document.getElementById('saveBtn'),
    resetBtn: document.getElementById('resetBtn'),
    playBtn: document.getElementById('playBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    stopBtn: document.getElementById('stopBtn'),
    reverseBtn: document.getElementById('reverseBtn'),
    clearFramesBtn: document.getElementById('clearFramesBtn'),
    
    // 进度
    progressFill: document.getElementById('progressFill'),
    progressPercent: document.getElementById('progressPercent'),
    progressText: document.getElementById('progressText')
};

// ====================
// 工具函数
// ====================

/**
 * 显示消息
 */
function showMessage(message, type = 'info') {
    const existing = document.querySelector('.message');
    if (existing) existing.remove();
    
    const colors = {
        info: '#4299e1',
        success: '#48bb78',
        warning: '#ed8936',
        error: '#f56565'
    };
    
    const icon = {
        info: 'info-circle',
        success: 'check-circle',
        warning: 'exclamation-triangle',
        error: 'exclamation-circle'
    };
    
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.innerHTML = `
        <i class="fas fa-${icon[type]}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.remove();
        }
    }, 3000);
}

/**
 * 更新UI状态
 */
function updateUI() {
    const hasFrames = AppState.frames.length > 0;
    
    DOM.generateBtn.disabled = !hasFrames || AppState.isProcessing;
    DOM.saveBtn.disabled = !AppState.currentGIF;
    
    // 更新帧数
    DOM.frameCount.textContent = `${AppState.frames.length} 帧`;
    
    // 更新按钮文本
    if (AppState.isProcessing) {
        DOM.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
    } else {
        DOM.generateBtn.innerHTML = '<i class="fas fa-cogs"></i> 生成GIF';
    }
}

/**
 * 更新进度
 */
function updateProgress(percent, text) {
    DOM.progressFill.style.width = `${percent}%`;
    DOM.progressPercent.textContent = `${Math.round(percent)}%`;
    DOM.progressText.textContent = text;
}

// ====================
// 文件上传功能
// ====================

/**
 * 初始化文件上传
 */
function initFileUpload() {
    // 点击上传区域
    DOM.uploadArea.addEventListener('click', () => {
        DOM.fileInput.click();
    });
    
    // 选择文件按钮
    DOM.selectFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.fileInput.click();
    });
    
    // 文件选择变化
    DOM.fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        
        if (DOM.batchMode.checked && files.length > 1) {
            handleBatchUpload(files);
        } else {
            handleFileUpload(files[0]);
        }
    });
    
    // 示例按钮
    DOM.sampleBtn.addEventListener('click', loadSampleImage);
    
    // 拖放支持
    setupDragAndDrop();
}

/**
 * 设置拖放功能
 */
function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
        DOM.uploadArea.addEventListener(event, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(event => {
        DOM.uploadArea.addEventListener(event, () => {
            DOM.uploadArea.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(event => {
        DOM.uploadArea.addEventListener(event, () => {
            DOM.uploadArea.classList.remove('drag-over');
        }, false);
    });
    
    // 处理文件拖放
    DOM.uploadArea.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;
        
        if (DOM.batchMode.checked && files.length > 1) {
            handleBatchUpload(files);
        } else {
            handleFileUpload(files[0]);
        }
    }, false);
}

/**
 * 处理单个文件上传
 */
function handleFileUpload(file) {
    if (!file.type.match('image.*')) {
        showMessage('请选择图像文件（PNG、JPG、GIF格式）', 'error');
        return;
    }
    
    DOM.fileStatus.textContent = '加载中...';
    DOM.fileStatus.style.color = '#ed8936';
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        
        img.onload = function() {
            AppState.originalImage = img;
            updateImagePreview(img);
            updateFileInfo(file);
            
            // 自动建议网格
            autoSuggestGrid(img);
            
            // 分割图像
            splitImageToFrames();
            
            DOM.fileStatus.textContent = '已加载';
            DOM.fileStatus.style.color = '#48bb78';
            showMessage('图像加载成功！', 'success');
        };
        
        img.onerror = function() {
            DOM.fileStatus.textContent = '加载失败';
            DOM.fileStatus.style.color = '#f56565';
            showMessage('图像加载失败，请重试', 'error');
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

/**
 * 处理批量上传
 */
async function handleBatchUpload(files) {
    // 过滤图像文件
    const imageFiles = files.filter(file => file.type.match('image.*'));
    
    if (imageFiles.length === 0) {
        showMessage('没有找到图像文件', 'error');
        return;
    }
    
    // 清空现有帧
    AppState.frames = [];
    AppState.originalImage = null;
    
    DOM.fileStatus.textContent = `正在加载 ${imageFiles.length} 个文件...`;
    
    // 批量加载
    let loadedCount = 0;
    
    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        
        await new Promise((resolve) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = new Image();
                
                img.onload = function() {
                    // 添加到帧数组
                    AppState.frames.push({
                        image: img,
                        index: i,
                        delay: AppState.settings.frameDelay,
                        filename: file.name
                    });
                    
                    loadedCount++;
                    
                    // 更新进度
                    const percent = Math.round((loadedCount / imageFiles.length) * 100);
                    DOM.fileStatus.textContent = `正在加载 ${loadedCount}/${imageFiles.length} (${percent}%)`;
                    
                    resolve();
                };
                
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // 加载完成
    DOM.fileStatus.textContent = `已加载 ${imageFiles.length} 个文件`;
    DOM.fileStatus.style.color = '#48bb78';
    
    // 更新文件信息
    const totalSize = imageFiles.reduce((sum, file) => sum + file.size, 0);
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    
    DOM.fileInfo.innerHTML = `
        <div class="info-row">
            <span>文件数量：</span>
            <span>${imageFiles.length} 个</span>
        </div>
        <div class="info-row">
            <span>总大小：</span>
            <span>${sizeMB} MB</span>
        </div>
    `;
    
    // 清空原始图像预览
    const ctx = DOM.originalCanvas.getContext('2d');
    ctx.clearRect(0, 0, DOM.originalCanvas.width, DOM.originalCanvas.height);
    DOM.imageStats.textContent = '批量模式';
    
    // 更新帧显示
    updateFramesDisplay();
    
    showMessage(`成功加载 ${imageFiles.length} 个图像文件`, 'success');
}

/**
 * 加载示例图像
 */
function loadSampleImage() {
    // 创建一个4帧的水平精灵表示例
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 100;
    
    // 绘制4个不同颜色的帧
    const colors = ['#4299e1', '#48bb78', '#ed8936', '#9f7aea'];
    
    for (let i = 0; i < 4; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(i * 100, 0, 100, 100);
        
        // 添加帧编号
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, i * 100 + 50, 60);
    }
    
    // 创建图像
    const img = new Image();
    img.onload = function() {
        AppState.originalImage = img;
        updateImagePreview(img);
        
        // 更新文件信息
        DOM.fileInfo.innerHTML = `
            <div class="info-row">
                <span>文件名：</span>
                <span>示例精灵表.png</span>
            </div>
            <div class="info-row">
                <span>尺寸：</span>
                <span>400 × 100</span>
            </div>
        `;
        
        DOM.fileStatus.textContent = '示例已加载';
        DOM.fileStatus.style.color = '#48bb78';
        
        // 自动设置网格
        DOM.rowsInput.value = 1;
        DOM.colsInput.value = 4;
        AppState.grid.rows = 1;
        AppState.grid.cols = 4;
        
        // 分割图像
        splitImageToFrames();
        
        showMessage('示例图像已加载，请尝试生成GIF', 'info');
    };
    
    img.src = canvas.toDataURL();
}

// ====================
// 图像处理功能
// ====================

/**
 * 更新图像预览
 */
function updateImagePreview(img) {
    const canvas = DOM.originalCanvas;
    const ctx = canvas.getContext('2d');
    
    // 计算预览尺寸
    const maxWidth = 400;
    const maxHeight = 200;
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
    
    // 更新统计信息
    DOM.imageStats.textContent = `${img.width} × ${img.height}`;
    
    // 绘制网格
    drawGrid();
}

/**
 * 绘制网格
 */
function drawGrid() {
    if (!AppState.originalImage) return;
    
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
                    border: 2px solid rgba(237, 137, 54, 0.7);
                    box-sizing: border-box;
                    pointer-events: none;
                "></div>
            `;
        }
    }
    
    DOM.gridOverlay.innerHTML = gridHTML;
}

/**
 * 自动建议网格设置
 */
function autoSuggestGrid(img) {
    const width = img.width;
    const height = img.height;
    
    // 简单逻辑：如果宽度远大于高度，可能是水平排列
    if (width > height * 2) {
        const suggestedCols = Math.min(10, Math.floor(width / (height * 0.8)));
        DOM.colsInput.value = suggestedCols;
        DOM.rowsInput.value = 1;
        AppState.grid.cols = suggestedCols;
        AppState.grid.rows = 1;
    }
    // 如果高度远大于宽度，可能是垂直排列
    else if (height > width * 2) {
        const suggestedRows = Math.min(10, Math.floor(height / (width * 0.8)));
        DOM.rowsInput.value = suggestedRows;
        DOM.colsInput.value = 1;
        AppState.grid.rows = suggestedRows;
        AppState.grid.cols = 1;
    }
    // 接近正方形，尝试2x2网格
    else {
        DOM.rowsInput.value = 2;
        DOM.colsInput.value = 2;
        AppState.grid.rows = 2;
        AppState.grid.cols = 2;
    }
}

/**
 * 分割图像为帧
 */
function splitImageToFrames() {
    if (!AppState.originalImage) return;
    
    const rows = AppState.grid.rows;
    const cols = AppState.grid.cols;
    const img = AppState.originalImage;
    
    // 清空现有帧
    AppState.frames = [];
    
    // 计算帧尺寸
    const frameWidth = Math.floor(img.width / cols);
    const frameHeight = Math.floor(img.height / rows);
    
    // 创建临时画布
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = frameWidth;
    tempCanvas.height = frameHeight;
    
    // 分割图像
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            // 清空画布
            tempCtx.clearRect(0, 0, frameWidth, frameHeight);
            
            // 绘制当前帧
            tempCtx.drawImage(
                img,
                c * frameWidth, r * frameHeight, frameWidth, frameHeight,
                0, 0, frameWidth, frameHeight
            );
            
            // 创建新图像
            const frameImg = new Image();
            frameImg.src = tempCanvas.toDataURL();
            
            // 添加到帧数组
            AppState.frames.push({
                image: frameImg,
                index: r * cols + c,
                delay: AppState.settings.frameDelay,
                position: { row: r, col: c }
            });
        }
    }
    
    // 更新显示
    updateFramesDisplay();
    drawGrid();
    
    showMessage(`成功分割为 ${rows}×${cols} 网格，共 ${AppState.frames.length} 帧`, 'success');
}

/**
 * 更新帧显示
 */
function updateFramesDisplay() {
    const container = DOM.framesContainer;
    
    if (AppState.frames.length === 0) {
        container.innerHTML = `
            <div class="empty-frames">
                <i class="fas fa-th-large fa-3x"></i>
                <p>分割后的帧将显示在这里</p>
                <p class="hint">上传图像并设置行列数开始分割</p>
            </div>
        `;
        updateUI();
        return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    // 创建帧缩略图
    AppState.frames.forEach((frame, index) => {
        const frameItem = document.createElement('div');
        frameItem.className = 'frame-item';
        frameItem.draggable = true;
        frameItem.dataset.index = index;
        
        // 创建图像
        const img = document.createElement('img');
        img.src = frame.image.src;
        img.alt = `帧 ${index + 1}`;
        
        // 帧编号
        const frameNumber = document.createElement('div');
        frameNumber.className = 'frame-number';
        frameNumber.textContent = index + 1;
        
        frameItem.appendChild(img);
        frameItem.appendChild(frameNumber);
        container.appendChild(frameItem);
        
        // 添加拖放事件
        frameItem.addEventListener('dragstart', handleDragStart);
        frameItem.addEventListener('dragover', handleDragOver);
        frameItem.addEventListener('drop', handleDrop);
        frameItem.addEventListener('dragend', handleDragEnd);
    });
    
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
        showMessage('没有可用的帧！请先上传图像。', 'warning');
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
            quality: 10,
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
            
            // 短暂延迟
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // 生成GIF
        updateProgress(90, '正在生成GIF...');
        
        gif.on('progress', function(p) {
            const progress = 90 + Math.floor(p * 10);
            updateProgress(progress, '正在编码...');
        });
        
        gif.on('finished', function(blob) {
            // 创建URL
            const url = URL.createObjectURL(blob);
            
            // 更新预览
            DOM.gifOutput.src = url;
            DOM.gifOutput.style.display = 'block';
            DOM.gifDisplay.querySelector('.empty-preview').style.display = 'none';
            
            // 更新统计信息
            const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
            DOM.gifStats.textContent = `${AppState.frames.length}帧 · ${sizeMB}MB`;
            
            // 保存到状态
            AppState.currentGIF = {
                blob: blob,
                url: url,
                frames: AppState.frames.length,
                size: blob.size
            };
            
            // 更新UI
            updateProgress(100, '生成完成！');
            AppState.isProcessing = false;
            updateUI();
            
            showMessage('GIF生成成功！', 'success');
            
            // 3秒后重置进度
            setTimeout(() => updateProgress(0, '准备就绪'), 3000);
        });
        
        gif.render();
        
    } catch (error) {
        console.error('生成GIF时出错:', error);
        showMessage('生成失败: ' + error.message, 'error');
        
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
        showMessage('没有可保存的GIF', 'warning');
        return;
    }
    
    const link = document.createElement('a');
    link.href = AppState.currentGIF.url;
    link.download = `动画_${new Date().getTime()}.gif`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showMessage('GIF已开始下载', 'success');
}

// ====================
// 事件监听器设置
// ====================

function setupEventListeners() {
    // 文件上传
    initFileUpload();
    
    // 网格设置
    DOM.rowsInput.addEventListener('change', (e) => {
        AppState.grid.rows = parseInt(e.target.value) || 1;
        if (AppState.originalImage) splitImageToFrames();
    });
    
    DOM.colsInput.addEventListener('change', (e) => {
        AppState.grid.cols = parseInt(e.target.value) || 1;
        if (AppState.originalImage) splitImageToFrames();
    });
    
    // 数值按钮
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action;
            const target = this.dataset.target;
            const input = document.getElementById(target);
            let value = parseInt(input.value);
            
            if (action === 'increase') {
                value = Math.min(20, value + 1);
            } else {
                value = Math.max(1, value - 1);
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
    
    // 自动检测网格
    DOM.autoDetectBtn.addEventListener('click', () => {
        if (!AppState.originalImage) {
            showMessage('请先上传图像', 'warning');
            return;
        }
        
        autoSuggestGrid(AppState.originalImage);
        splitImageToFrames();
        showMessage('已自动检测网格设置', 'info');
    });
    
    // 帧延迟
    DOM.frameDelay.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        AppState.settings.frameDelay = value;
        DOM.delayValue.textContent = `${value}ms`;
        
        // 更新所有帧的延迟
        AppState.frames.forEach(frame => {
            frame.delay = value;
        });
    });
    
    // 播放速度
    DOM.playbackSpeed.forEach(btn => {
        btn.addEventListener('click', function() {
            DOM.playbackSpeed.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            AppState.settings.playbackSpeed = parseFloat(this.dataset.speed);
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
    
    // 帧操作按钮
    DOM.reverseBtn.addEventListener('click', () => {
        AppState.frames.reverse();
        updateFramesDisplay();
        showMessage('已反转帧顺序', 'info');
    });
    
    DOM.clearFramesBtn.addEventListener('click', () => {
        if (confirm('确定要清空所有帧吗？')) {
            AppState.frames = [];
            updateFramesDisplay();
            showMessage('已清空所有帧', 'info');
        }
    });
    
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
            DOM.gifOutput.style.animation = 'none';
            setTimeout(() => {
                DOM.gifOutput.style.animation = '';
            }, 10);
        }
    });
}

/**
 * 重置应用程序
 */
function resetApp() {
    if (confirm('确定要重置所有设置吗？')) {
        AppState.originalImage = null;
        AppState.frames = [];
        AppState.currentGIF = null;
        AppState.grid.rows = 1;
        AppState.grid.cols = 1;
        
        // 重置UI
        const ctx = DOM.originalCanvas.getContext('2d');
        ctx.clearRect(0, 0, DOM.originalCanvas.width, DOM.originalCanvas.height);
        DOM.gridOverlay.innerHTML = '';
        DOM.gifOutput.src = '';
        DOM.gifOutput.style.display = 'none';
        DOM.gifDisplay.querySelector('.empty-preview').style.display = 'block';
        DOM.fileInfo.innerHTML = '';
        DOM.fileStatus.textContent = '等待上传';
        DOM.imageStats.textContent = '未加载';
        DOM.gifStats.textContent = '等待生成';
        
        // 重置输入
        DOM.rowsInput.value = 1;
        DOM.colsInput.value = 1;
        DOM.frameDelay.value = 100;
        DOM.delayValue.textContent = '100ms';
        DOM.bgColor.value = 'transparent';
        
        // 重置播放速度按钮
        DOM.playbackSpeed.forEach((btn, index) => {
            btn.classList.toggle('active', index === 1);
        });
        
        // 重置批量模式
        DOM.batchMode.checked = false;
        
        updateFramesDisplay();
        updateUI();
        updateProgress(0, '准备就绪');
        
        showMessage('已重置所有设置', 'success');
    }
}

/**
 * 更新文件信息
 */
function updateFileInfo(file) {
    const sizeKB = (file.size / 1024).toFixed(1);
    DOM.fileInfo.innerHTML = `
        <div class="info-row">
            <span>文件名：</span>
            <span>${file.name}</span>
        </div>
        <div class="info-row">
            <span>大小：</span>
            <span>${sizeKB} KB</span>
        </div>
    `;
}

// ====================
// 初始化应用程序
// ====================

function initApp() {
    console.log('初始化精灵表GIF生成器...');
    
    // 设置事件监听器
    setupEventListeners();
    
    // 更新UI状态
    updateUI();
    
    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
        .frame-item.dragging {
            opacity: 0.5;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .fa-spinner {
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
    
    console.log('应用程序初始化完成');
    showMessage('精灵表GIF生成器已就绪！', 'info');
}

// 启动应用程序
document.addEventListener('DOMContentLoaded', initApp);