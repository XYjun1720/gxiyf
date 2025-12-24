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
    
    // 设置
    grid: { rows: 1, cols: 1 },
    settings: {
        frameDelay: 100,
        playbackSpeed: 1,
        backgroundColor: 'transparent'
    }
};

// ====================
// DOM元素
// ====================
const DOM = {
    // 文件上传
    uploadArea: document.getElementById('uploadArea'),
    fileInput: document.getElementById('fileInput'),
    fileInfo: document.getElementById('fileInfo'),
    batchMode: document.getElementById('batchMode'),
    
    // 网格设置
    rowsInput: document.getElementById('rows'),
    colsInput: document.getElementById('cols'),
    autoDetectBtn: document.getElementById('autoDetectBtn'),
    
    // GIF设置
    frameDelay: document.getElementById('frameDelay'),
    delayValue: document.getElementById('delayValue'),
    bgColor: document.getElementById('bgColor'),
    
    // 预览
    originalCanvas: document.getElementById('originalCanvas'),
    gridOverlay: document.getElementById('gridOverlay'),
    imageStats: document.getElementById('imageStats'),
    gifOutput: document.getElementById('gifOutput'),
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

// 显示消息
function showMessage(message, type = 'info') {
    console.log(`[${type}] ${message}`);
    alert(message);
}

// 更新UI状态
function updateUI() {
    const hasFrames = AppState.frames.length > 0;
    
    DOM.generateBtn.disabled = !hasFrames || AppState.isProcessing;
    DOM.saveBtn.disabled = !AppState.currentGIF;
    DOM.playBtn.disabled = !AppState.currentGIF;
    DOM.pauseBtn.disabled = !AppState.currentGIF;
    
    // 更新帧数
    DOM.frameCount.textContent = `${AppState.frames.length} 帧`;
    
    // 更新按钮文本
    if (AppState.isProcessing) {
        DOM.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
    } else {
        DOM.generateBtn.innerHTML = '<i class="fas fa-cogs"></i> 生成GIF';
    }
}

// 更新进度
function updateProgress(percent, text) {
    DOM.progressFill.style.width = `${percent}%`;
    DOM.progressPercent.textContent = `${Math.round(percent)}%`;
    DOM.progressText.textContent = text;
}

// 网格数值调整
function changeGrid(target, delta) {
    const input = document.getElementById(target);
    let value = parseInt(input.value) + delta;
    value = Math.max(1, Math.min(20, value));
    input.value = value;
    
    if (target === 'rows') {
        AppState.grid.rows = value;
    } else {
        AppState.grid.cols = value;
    }
    
    if (AppState.originalImage) {
        splitImageToFrames();
    }
}

// ====================
// 文件上传功能
// ====================

// 初始化文件上传
function initFileUpload() {
    // 点击上传区域
    DOM.uploadArea.addEventListener('click', () => {
        DOM.fileInput.click();
    });
    
    // 文件选择变化
    DOM.fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length === 0) return;
        
        const isBatchMode = DOM.batchMode.checked;
        
        if (isBatchMode && files.length > 1) {
            handleBatchUpload(files);
        } else {
            handleFileUpload(files[0]);
        }
    });
    
    // 拖放支持
    setupDragAndDrop();
}

// 设置拖放功能
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
            DOM.uploadArea.style.background = '#bee3f8';
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(event => {
        DOM.uploadArea.addEventListener(event, () => {
            DOM.uploadArea.style.background = '#ebf8ff';
        }, false);
    });
    
    // 处理文件拖放
    DOM.uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length === 0) return;
        
        const isBatchMode = DOM.batchMode.checked;
        
        if (isBatchMode && files.length > 1) {
            handleBatchUpload(files);
        } else {
            handleFileUpload(files[0]);
        }
    }, false);
}

// 处理单个文件上传
function handleFileUpload(file) {
    if (!file.type.match('image.*')) {
        showMessage('请选择图像文件（PNG、JPG、GIF格式）', 'error');
        return;
    }
    
    DOM.fileInfo.textContent = `正在加载: ${file.name}...`;
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        
        img.onload = function() {
            AppState.originalImage = img;
            updateImagePreview(img);
            
            // 更新文件信息
            const sizeKB = (file.size / 1024).toFixed(1);
            DOM.fileInfo.innerHTML = `
                文件名: ${file.name}<br>
                大小: ${sizeKB} KB<br>
                尺寸: ${img.width} × ${img.height}
            `;
            
            // 自动建议网格
            autoSuggestGrid(img);
            
            // 分割图像
            splitImageToFrames();
            
            showMessage('图像加载成功！', 'success');
        };
        
        img.onerror = function() {
            DOM.fileInfo.textContent = '加载失败';
            showMessage('图像加载失败，请重试', 'error');
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

// 处理批量上传
function handleBatchUpload(files) {
    // 过滤图像文件
    const imageFiles = Array.from(files).filter(file => file.type.match('image.*'));
    
    if (imageFiles.length === 0) {
        showMessage('没有找到图像文件', 'error');
        return;
    }
    
    // 清空现有帧
    AppState.frames = [];
    AppState.originalImage = null;
    
    DOM.fileInfo.textContent = `正在加载 ${imageFiles.length} 个文件...`;
    
    // 批量加载
    let loadedCount = 0;
    
    imageFiles.forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            
            img.onload = function() {
                // 添加到帧数组
                AppState.frames.push({
                    image: img,
                    index: index,
                    delay: AppState.settings.frameDelay,
                    filename: file.name
                });
                
                loadedCount++;
                
                // 更新进度
                DOM.fileInfo.textContent = `已加载 ${loadedCount}/${imageFiles.length} 个文件`;
                
                // 所有文件加载完成
                if (loadedCount === imageFiles.length) {
                    // 清空原始图像预览
                    const ctx = DOM.originalCanvas.getContext('2d');
                    ctx.clearRect(0, 0, DOM.originalCanvas.width, DOM.originalCanvas.height);
                    DOM.imageStats.textContent = '批量模式';
                    
                    // 更新帧显示
                    updateFramesDisplay();
                    
                    const totalSize = imageFiles.reduce((sum, f) => sum + f.size, 0);
                    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
                    
                    DOM.fileInfo.innerHTML = `
                        批量模式: ${imageFiles.length} 个文件<br>
                        总大小: ${sizeMB} MB<br>
                        状态: 已全部加载
                    `;
                    
                    showMessage(`成功加载 ${imageFiles.length} 个图像文件`, 'success');
                }
            };
            
            img.src = e.target.result;
        };
        
        reader.readAsDataURL(file);
    });
}

// ====================
// 图像处理功能
// ====================

// 更新图像预览
function updateImagePreview(img) {
    const canvas = DOM.originalCanvas;
    const ctx = canvas.getContext('2d');
    
    // 计算预览尺寸
    const maxWidth = 300;
    const maxHeight = 180;
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

// 绘制网格
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
                    border: 1px solid rgba(237, 137, 54, 0.7);
                    box-sizing: border-box;
                    pointer-events: none;
                "></div>
            `;
        }
    }
    
    DOM.gridOverlay.innerHTML = gridHTML;
}

// 自动建议网格设置
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
}

// 分割图像为帧
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
}

// 更新帧显示
function updateFramesDisplay() {
    const container = DOM.framesContainer;
    
    if (AppState.frames.length === 0) {
        container.innerHTML = `
            <div class="empty-frames">
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
    });
    
    updateUI();
}

// ====================
// 拖放功能
// ====================
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', this.dataset.index);
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    const draggedIndex = e.dataTransfer.getData('text/plain');
    const targetIndex = this.dataset.index;
    
    if (draggedIndex !== targetIndex) {
        // 交换帧位置
        [AppState.frames[draggedIndex], AppState.frames[targetIndex]] = 
        [AppState.frames[targetIndex], AppState.frames[draggedIndex]];
        
        // 更新显示
        updateFramesDisplay();
    }
}

// ====================
// GIF生成功能 - 关键修复！
// ====================

/**
 * 生成GIF - 使用没有Web Worker的版本
 */
async function generateGIF() {
    if (AppState.frames.length === 0) {
        showMessage('没有可用的帧！请先上传图像。', 'warning');
        return;
    }
    
    // 检查GIF库是否加载
    if (typeof GIF === 'undefined') {
        showMessage('GIF库加载失败，请确保gif.js文件存在', 'error');
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
        
        console.log('开始生成GIF，帧数:', AppState.frames.length);
        console.log('GIF设置:', {
            delay: adjustedDelay,
            background: AppState.settings.backgroundColor,
            width: AppState.frames[0].image.width,
            height: AppState.frames[0].image.height
        });
        
        // 创建GIF实例 - 关键：不使用Worker以避免跨域问题
        const gifOptions = {
            workers: 0,  // 不使用Worker
            quality: 7,  // 质量设置（1-10，10最好但文件更大）
            width: AppState.frames[0].image.width,
            height: AppState.frames[0].image.height,
            background: AppState.settings.backgroundColor === 'transparent' ? null : AppState.settings.backgroundColor,
            // 重要：不指定workerScript，避免跨域问题
            workerScript: undefined
        };
        
        console.log('GIF选项:', gifOptions);
        
        const gif = new GIF(gifOptions);
        
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
            const progress = Math.floor((i + 1) / AppState.frames.length * 90);
            updateProgress(progress, `正在添加帧 ${i + 1}/${AppState.frames.length}`);
            
            // 短暂延迟避免阻塞
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // 生成GIF
        updateProgress(95, '正在生成GIF文件...');
        
        gif.on('progress', function(p) {
            const progress = 95 + Math.floor(p * 5);
            updateProgress(progress, '正在编码...');
        });
        
        gif.on('finished', function(blob) {
            console.log('GIF生成完成，大小:', blob.size, 'bytes');
            
            // 创建URL
            const url = URL.createObjectURL(blob);
            
            // 更新预览
            DOM.gifOutput.src = url;
            DOM.gifOutput.style.display = 'block';
            DOM.gifDisplay.querySelector('.empty-preview').style.display = 'none';
            
            // 更新统计信息
            const sizeKB = (blob.size / 1024).toFixed(1);
            DOM.gifStats.textContent = `${AppState.frames.length}帧 · ${sizeKB}KB`;
            
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
            
            showMessage(`GIF生成成功！大小: ${sizeKB}KB`, 'success');
            
            // 3秒后重置进度
            setTimeout(() => updateProgress(0, '准备就绪'), 3000);
        });
        
        // 开始渲染GIF
        gif.render();
        
    } catch (error) {
        console.error('生成GIF时出错:', error);
        showMessage('生成失败: ' + error.message, 'error');
        
        AppState.isProcessing = false;
        updateProgress(0, '生成失败');
        updateUI();
    }
}

// 保存GIF
function saveGIF() {
    if (!AppState.currentGIF) {
        showMessage('没有可保存的GIF', 'warning');
        return;
    }
    
    const timestamp = new Date().getTime();
    const link = document.createElement('a');
    link.href = AppState.currentGIF.url;
    link.download = `sprite_animation_${timestamp}.gif`;
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
    
    // 播放速度按钮
    document.querySelectorAll('.speed-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
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
}

// 重置应用程序
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
        DOM.gifDisplay.querySelector('.empty-preview').style.display = 'flex';
        DOM.fileInfo.textContent = '等待上传文件...';
        DOM.imageStats.textContent = '未加载';
        DOM.gifStats.textContent = '等待生成';
        
        // 重置输入
        DOM.rowsInput.value = 1;
        DOM.colsInput.value = 1;
        DOM.frameDelay.value = 100;
        DOM.delayValue.textContent = '100ms';
        DOM.bgColor.value = 'transparent';
        
        // 重置播放速度按钮
        document.querySelectorAll('.speed-btn').forEach((btn, index) => {
            btn.classList.toggle('active', index === 0);
        });
        
        updateFramesDisplay();
        updateUI();
        updateProgress(0, '准备就绪');
        
        showMessage('已重置所有设置', 'success');
    }
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
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .fa-spinner {
            animation: spin 1s linear infinite;
        }
        
        .frame-item.dragging {
            opacity: 0.5;
        }
    `;
    document.head.appendChild(style);
    
    console.log('应用程序初始化完成');
}

// 启动应用程序
document.addEventListener('DOMContentLoaded', initApp);