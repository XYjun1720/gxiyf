// ====================
// 全局状态和配置
// ====================
const AppState = {
    originalImage: null,
    frames: [],
    currentGIF: null,
    isProcessing: false,
    selectedFrameIndex: -1,
    
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
    sampleBtn: document.getElementById('sampleBtn'),
    
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
// 核心修复：文件上传功能
// ====================

/**
 * 修复文件上传功能
 */
function setupFileUpload() {
    console.log('正在设置文件上传功能...');
    
    // 1. 修复点击上传区域触发文件选择
    if (DOM.uploadArea) {
        DOM.uploadArea.addEventListener('click', function(e) {
            console.log('上传区域被点击');
            // 如果是批量模式，触发批量输入
            if (DOM.batchMode && DOM.batchMode.checked && DOM.batchInput) {
                DOM.batchInput.click();
            } else {
                DOM.spriteInput.click();
            }
        });
        
        // 添加视觉反馈
        DOM.uploadArea.style.cursor = 'pointer';
    } else {
        console.error('找不到上传区域元素！');
    }
    
    // 2. 修复单个文件上传
    if (DOM.spriteInput) {
        DOM.spriteInput.addEventListener('change', function(e) {
            console.log('单个文件选择变化，文件数量:', e.target.files.length);
            if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
            }
        });
    }
    
    // 3. 修复批量模式切换
    if (DOM.batchMode) {
        DOM.batchMode.addEventListener('change', function(e) {
            console.log('批量模式切换:', e.target.checked);
            if (e.target.checked) {
                // 切换到批量模式
                if (DOM.uploadArea.querySelector('p')) {
                    DOM.uploadArea.querySelector('p').innerHTML = 
                        '<strong>选择多张图片</strong><br><small>按住 Ctrl 或 Shift 多选</small>';
                }
            } else {
                // 切换回单文件模式
                if (DOM.uploadArea.querySelector('p')) {
                    DOM.uploadArea.querySelector('p').innerHTML = 
                        '<strong>选择精灵表图像</strong><br><small>支持 PNG, JPG, GIF 格式</small>';
                }
            }
        });
    }
    
    // 4. 修复批量文件上传
    if (DOM.batchInput) {
        DOM.batchInput.addEventListener('change', function(e) {
            console.log('批量文件选择变化，文件数量:', e.target.files.length);
            if (e.target.files && e.target.files.length > 0) {
                handleBatchUpload(Array.from(e.target.files));
            }
        });
    }
    
    // 5. 修复拖放上传功能
    if (DOM.uploadArea) {
        // 阻止默认拖放行为
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            DOM.uploadArea.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // 高亮效果
        ['dragenter', 'dragover'].forEach(eventName => {
            DOM.uploadArea.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            DOM.uploadArea.addEventListener(eventName, unhighlight, false);
        });
        
        function highlight() {
            DOM.uploadArea.classList.add('drag-over');
        }
        
        function unhighlight() {
            DOM.uploadArea.classList.remove('drag-over');
        }
        
        // 处理文件拖放
        DOM.uploadArea.addEventListener('drop', function(e) {
            console.log('文件拖放事件');
            const dt = e.dataTransfer;
            const files = dt.files;
            
            if (files.length === 0) return;
            
            // 检查是否是批量模式
            const isBatchMode = DOM.batchMode && DOM.batchMode.checked;
            
            if (isBatchMode && files.length > 1) {
                // 批量处理多文件
                handleBatchUpload(Array.from(files));
            } else {
                // 单文件处理（取第一个文件）
                handleFileUpload(files[0]);
            }
        }, false);
    }
    
    // 6. 修复示例按钮（如果存在）
    if (DOM.sampleBtn) {
        DOM.sampleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            loadSampleImage();
        });
    }
    
    console.log('文件上传功能设置完成');
}

/**
 * 处理单个文件上传
 */
function handleFileUpload(file) {
    console.log('处理单个文件:', file.name, file.type, file.size);
    
    if (!file.type.match('image.*')) {
        showMessage('请选择图像文件（PNG、JPG、GIF格式）！', 'error');
        return;
    }
    
    if (DOM.fileStatus) {
        DOM.fileStatus.textContent = '加载中...';
        DOM.fileStatus.style.color = '#f39c12';
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        console.log('文件读取成功');
        const img = new Image();
        
        img.onload = function() {
            console.log('图像加载成功，尺寸:', img.width, 'x', img.height);
            AppState.originalImage = img;
            updateOriginalPreview(img);
            updateFileInfo(file);
            
            // 自动设置合理的网格（根据图像尺寸猜测）
            autoSuggestGrid(img);
            
            // 分割图像
            splitImageToFrames();
            
            if (DOM.fileStatus) {
                DOM.fileStatus.textContent = '已加载';
                DOM.fileStatus.style.color = '#2ecc71';
            }
            
            showMessage('图像加载成功！', 'success');
        };
        
        img.onerror = function() {
            console.error('图像加载失败');
            if (DOM.fileStatus) {
                DOM.fileStatus.textContent = '加载失败';
                DOM.fileStatus.style.color = '#e74c3c';
            }
            showMessage('图像加载失败，请检查文件格式', 'error');
        };
        
        img.src = e.target.result;
    };
    
    reader.onerror = function() {
        console.error('文件读取失败');
        if (DOM.fileStatus) {
            DOM.fileStatus.textContent = '读取失败';
            DOM.fileStatus.style.color = '#e74c3c';
        }
        showMessage('文件读取失败，请重试', 'error');
    };
    
    reader.readAsDataURL(file);
}

/**
 * 处理批量文件上传
 */
function handleBatchUpload(files) {
    console.log('处理批量文件上传，数量:', files.length);
    
    // 过滤出图像文件
    const imageFiles = files.filter(file => file.type.match('image.*'));
    
    if (imageFiles.length === 0) {
        showMessage('没有找到图像文件！', 'error');
        return;
    }
    
    if (imageFiles.length < files.length) {
        showMessage(`找到 ${imageFiles.length} 个图像文件，${files.length - imageFiles.length} 个非图像文件已忽略`, 'warning');
    }
    
    // 清空现有帧
    AppState.frames = [];
    AppState.selectedFrameIndex = -1;
    AppState.originalImage = null;
    
    if (DOM.fileStatus) {
        DOM.fileStatus.textContent = `正在加载 ${imageFiles.length} 个文件...`;
        DOM.fileStatus.style.color = '#f39c12';
    }
    
    // 批量加载图片
    let loadedCount = 0;
    const totalFiles = imageFiles.length;
    
    // 更新文件信息显示
    if (DOM.fileInfo) {
        DOM.fileInfo.innerHTML = `
            <div class="info-item">
                <span>批量模式：</span>
                <span class="value">${totalFiles} 个文件</span>
            </div>
            <div class="info-item">
                <span>已加载：</span>
                <span class="value" id="batchProgress">0/${totalFiles}</span>
            </div>
        `;
    }
    
    // 重置画布
    if (DOM.originalCanvas) {
        const ctx = DOM.originalCanvas.getContext('2d');
        ctx.clearRect(0, 0, DOM.originalCanvas.width, DOM.originalCanvas.height);
        DOM.originalCanvas.width = 400;
        DOM.originalCanvas.height = 300;
    }
    
    if (DOM.originalStats) {
        DOM.originalStats.textContent = '批量模式';
    }
    
    // 加载每个文件
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
                    filename: file.name,
                    size: file.size
                });
                
                loadedCount++;
                
                // 更新进度
                if (DOM.fileInfo) {
                    const progressElement = document.getElementById('batchProgress');
                    if (progressElement) {
                        progressElement.textContent = `${loadedCount}/${totalFiles}`;
                    }
                }
                
                // 所有文件加载完成
                if (loadedCount === totalFiles) {
                    if (DOM.fileStatus) {
                        DOM.fileStatus.textContent = '批量加载完成';
                        DOM.fileStatus.style.color = '#2ecc71';
                    }
                    
                    // 更新文件信息
                    const totalSize = imageFiles.reduce((sum, f) => sum + f.size, 0);
                    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
                    
                    if (DOM.fileInfo) {
                        DOM.fileInfo.innerHTML = `
                            <div class="info-item">
                                <span>批量模式：</span>
                                <span class="value">${totalFiles} 个文件</span>
                            </div>
                            <div class="info-item">
                                <span>总大小：</span>
                                <span class="value">${sizeMB} MB</span>
                            </div>
                            <div class="info-item">
                                <span>状态：</span>
                                <span class="value">已加载所有文件</span>
                            </div>
                        `;
                    }
                    
                    // 更新帧显示
                    updateFramesDisplay();
                    
                    // 如果是批量模式，自动设置为每张图片一帧
                    DOM.rowsInput.value = 1;
                    DOM.colsInput.value = 1;
                    AppState.grid.rows = 1;
                    AppState.grid.cols = 1;
                    
                    showMessage(`成功加载 ${totalFiles} 个图像文件`, 'success');
                }
            };
            
            img.onerror = function() {
                console.error('图像加载失败:', file.name);
                loadedCount++;
                
                if (loadedCount === totalFiles) {
                    updateFramesDisplay();
                    showMessage(`加载完成（部分文件可能有问题）`, 'warning');
                }
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = function() {
            console.error('文件读取失败:', file.name);
            loadedCount++;
            
            if (loadedCount === totalFiles) {
                updateFramesDisplay();
                showMessage(`加载完成（部分文件可能有问题）`, 'warning');
            }
        };
        
        reader.readAsDataURL(file);
    });
}

/**
 * 自动建议网格设置（根据图像尺寸）
 */
function autoSuggestGrid(img) {
    if (!img) return;
    
    // 根据图像宽高比和尺寸猜测可能的网格
    const width = img.width;
    const height = img.height;
    
    let suggestedRows = 1;
    let suggestedCols = 1;
    
    // 如果图像宽度明显大于高度，可能是水平排列的精灵表
    if (width > height * 1.5) {
        suggestedRows = 1;
        suggestedCols = Math.min(10, Math.floor(width / (height * 0.8)));
    }
    // 如果高度明显大于宽度，可能是垂直排列的精灵表
    else if (height > width * 1.5) {
        suggestedCols = 1;
        suggestedRows = Math.min(10, Math.floor(height / (width * 0.8)));
    }
    // 接近正方形，可能是网格排列
    else {
        // 尝试找到能整除的网格
        for (let r = 1; r <= 5; r++) {
            for (let c = 1; c <= 5; c++) {
                const frameWidth = width / c;
                const frameHeight = height / r;
                
                // 检查是否接近正方形帧
                if (Math.abs(frameWidth - frameHeight) < Math.max(frameWidth, frameHeight) * 0.3) {
                    suggestedRows = r;
                    suggestedCols = c;
                    break;
                }
            }
            if (suggestedRows > 1) break;
        }
    }
    
    // 确保至少1x1
    suggestedRows = Math.max(1, suggestedRows);
    suggestedCols = Math.max(1, suggestedCols);
    
    // 更新UI
    DOM.rowsInput.value = suggestedRows;
    DOM.colsInput.value = suggestedCols;
    AppState.grid.rows = suggestedRows;
    AppState.grid.cols = suggestedCols;
    
    console.log('自动建议网格:', suggestedRows, '行 x', suggestedCols, '列');
}

/**
 * 加载示例图像
 */
function loadSampleImage() {
    console.log('加载示例图像');
    
    // 创建一个简单的示例精灵表（4帧水平排列）
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 400;
    canvas.height = 100;
    
    // 绘制4个不同颜色的矩形作为示例
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12'];
    
    for (let i = 0; i < 4; i++) {
        ctx.fillStyle = colors[i];
        ctx.fillRect(i * 100, 0, 100, 100);
        
        // 添加帧编号
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`帧 ${i + 1}`, i * 100 + 50, 60);
    }
    
    // 创建图像对象
    const img = new Image();
    img.onload = function() {
        AppState.originalImage = img;
        updateOriginalPreview(img);
        
        // 更新文件信息
        if (DOM.fileInfo) {
            DOM.fileInfo.innerHTML = `
                <div class="info-item">
                    <span>文件名：</span>
                    <span class="value">示例精灵表.png</span>
                </div>
                <div class="info-item">
                    <span>图像尺寸：</span>
                    <span class="value">400 × 100</span>
                </div>
                <div class="info-item">
                    <span>类型：</span>
                    <span class="value">示例图像</span>
                </div>
            `;
        }
        
        if (DOM.fileStatus) {
            DOM.fileStatus.textContent = '示例已加载';
            DOM.fileStatus.style.color = '#2ecc71';
        }
        
        if (DOM.originalStats) {
            DOM.originalStats.textContent = '400 × 100';
        }
        
        // 自动设置网格（4x1）
        DOM.rowsInput.value = 1;
        DOM.colsInput.value = 4;
        AppState.grid.rows = 1;
        AppState.grid.cols = 4;
        
        // 分割图像
        splitImageToFrames();
        
        showMessage('示例图像加载成功！请尝试生成GIF', 'success');
    };
    
    img.src = canvas.toDataURL();
}

// ====================
// 其他核心功能（保持原样，但简化了）
// ====================

/**
 * 更新UI状态
 */
function updateUI() {
    const hasFrames = AppState.frames.length > 0;
    
    if (DOM.generateBtn) {
        DOM.generateBtn.disabled = !hasFrames || AppState.isProcessing;
    }
    
    if (DOM.saveBtn) {
        DOM.saveBtn.disabled = !AppState.currentGIF;
    }
    
    if (DOM.generateBtn && AppState.isProcessing) {
        DOM.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成中...';
    } else if (DOM.generateBtn) {
        DOM.generateBtn.innerHTML = '<i class="fas fa-play"></i> 生成GIF动画';
    }
    
    // 更新帧数显示
    if (DOM.frameCount) {
        DOM.frameCount.textContent = `${AppState.frames.length} 帧`;
    }
}

/**
 * 更新进度显示
 */
function updateProgress(percent, text) {
    if (DOM.progressBar) {
        DOM.progressBar.style.width = `${percent}%`;
    }
    
    if (DOM.progressPercent) {
        DOM.progressPercent.textContent = `${Math.round(percent)}%`;
    }
    
    if (DOM.progressText) {
        DOM.progressText.textContent = text;
    }
}

/**
 * 显示消息
 */
function showMessage(message, type = 'info') {
    console.log(`${type}: ${message}`);
    
    // 移除现有消息
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const colors = {
        info: '#3498db',
        success: '#2ecc71',
        warning: '#f39c12',
        error: '#e74c3c'
    };
    
    const icons = {
        info: 'info-circle',
        success: 'check-circle',
        warning: 'exclamation-triangle',
        error: 'exclamation-circle'
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
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
        ">
            <i class="fas fa-${icons[type]}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    // 3秒后自动消失
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

/**
 * 更新原始图像预览
 */
function updateOriginalPreview(img) {
    if (!DOM.originalCanvas || !img) return;
    
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
    
    if (DOM.gridOverlay) {
        DOM.gridOverlay.innerHTML = gridHTML;
    }
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
    if (!DOM.framesContainer) return;
    
    const container = DOM.framesContainer;
    
    if (AppState.frames.length === 0) {
        if (DOM.emptyFrames) {
            DOM.emptyFrames.style.display = 'block';
        }
        container.innerHTML = '';
        updateUI();
        return;
    }
    
    if (DOM.emptyFrames) {
        DOM.emptyFrames.style.display = 'none';
    }
    
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
        
        frameItem.appendChild(img);
        frameItem.appendChild(frameNumber);
        container.appendChild(frameItem);
        
        // 添加事件监听器
        frameItem.addEventListener('click', () => selectFrame(index));
    });
    
    updateUI();
}

/**
 * 选择帧
 */
function selectFrame(index) {
    if (index < 0 || index >= AppState.frames.length) return;
    
    AppState.selectedFrameIndex = index;
    updateFramesDisplay();
}

// ====================
// GIF生成功能（简化版）
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
            if (DOM.gifOutput) {
                DOM.gifOutput.src = url;
                DOM.gifOutput.style.display = 'block';
            }
            
            if (DOM.emptyGif) {
                DOM.emptyGif.style.display = 'none';
            }
            
            // 更新统计信息
            const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
            if (DOM.gifStats) {
                DOM.gifStats.textContent = `${AppState.frames.length}帧 · ${sizeMB}MB`;
            }
            
            // 保存到状态
            AppState.currentGIF = {
                blob: blob,
                url: url,
                frames: AppState.frames.length,
                delay: delay,
                timestamp: new Date().toISOString(),
                size: blob.size
            };
            
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
// 事件监听器设置
// ====================

function setupEventListeners() {
    console.log('正在设置事件监听器...');
    
    // 1. 首先设置文件上传功能
    setupFileUpload();
    
    // 2. 网格设置
    if (DOM.rowsInput) {
        DOM.rowsInput.addEventListener('change', (e) => {
            AppState.grid.rows = parseInt(e.target.value) || 1;
            if (AppState.originalImage) splitImageToFrames();
        });
    }
    
    if (DOM.colsInput) {
        DOM.colsInput.addEventListener('change', (e) => {
            AppState.grid.cols = parseInt(e.target.value) || 1;
            if (AppState.originalImage) splitImageToFrames();
        });
    }
    
    // 3. 自动检测网格（简化版）
    if (DOM.autoDetectBtn) {
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
            
            if (DOM.colsInput) DOM.colsInput.value = detectedCols;
            if (DOM.rowsInput) DOM.rowsInput.value = 1;
            
            if (AppState.originalImage) splitImageToFrames();
            showMessage(`检测到 ${detectedCols} 列`, 'info');
        });
    }
    
    // 4. 动画设置
    if (DOM.frameDelay) {
        DOM.frameDelay.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            AppState.settings.frameDelay = value;
            if (DOM.delayValue) {
                DOM.delayValue.textContent = `${value}ms`;
            }
            
            // 更新所有帧的延迟
            AppState.frames.forEach(frame => {
                frame.delay = value;
            });
        });
    }
    
    // 5. 播放速度按钮
    if (DOM.playbackSpeed) {
        DOM.playbackSpeed.forEach(btn => {
            btn.addEventListener('click', (e) => {
                DOM.playbackSpeed.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                AppState.settings.playbackSpeed = parseFloat(btn.dataset.speed);
            });
        });
    }
    
    // 6. 背景颜色
    if (DOM.bgColor) {
        DOM.bgColor.addEventListener('change', (e) => {
            AppState.settings.backgroundColor = e.target.value;
        });
    }
    
    // 7. 主要按钮
    if (DOM.generateBtn) {
        DOM.generateBtn.addEventListener('click', generateGIF);
    }
    
    if (DOM.saveBtn) {
        DOM.saveBtn.addEventListener('click', saveGIF);
    }
    
    if (DOM.resetBtn) {
        DOM.resetBtn.addEventListener('click', resetApp);
    }
    
    // 8. 帧操作按钮
    if (DOM.sortBtn) {
        DOM.sortBtn.addEventListener('click', () => {
            AppState.frames.sort((a, b) => a.index - b.index);
            updateFramesDisplay();
            showMessage('已按原始顺序排序', 'info');
        });
    }
    
    if (DOM.reverseBtn) {
        DOM.reverseBtn.addEventListener('click', () => {
            AppState.frames.reverse();
            updateFramesDisplay();
            showMessage('已反转帧顺序', 'info');
        });
    }
    
    if (DOM.clearFramesBtn) {
        DOM.clearFramesBtn.addEventListener('click', () => {
            if (confirm('确定要清空所有帧吗？')) {
                AppState.frames = [];
                AppState.selectedFrameIndex = -1;
                updateFramesDisplay();
                showMessage('已清空所有帧', 'info');
            }
        });
    }
    
    console.log('事件监听器设置完成');
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
        if (DOM.originalCanvas) {
            const ctx = DOM.originalCanvas.getContext('2d');
            ctx.clearRect(0, 0, DOM.originalCanvas.width, DOM.originalCanvas.height);
            DOM.originalCanvas.width = 400;
            DOM.originalCanvas.height = 300;
        }
        
        if (DOM.gridOverlay) {
            DOM.gridOverlay.innerHTML = '';
        }
        
        if (DOM.gifOutput) {
            DOM.gifOutput.src = '';
            DOM.gifOutput.style.display = 'none';
        }
        
        if (DOM.emptyGif) {
            DOM.emptyGif.style.display = 'block';
        }
        
        if (DOM.fileInfo) {
            DOM.fileInfo.innerHTML = '';
        }
        
        if (DOM.fileStatus) {
            DOM.fileStatus.textContent = '等待上传';
        }
        
        if (DOM.originalStats) {
            DOM.originalStats.textContent = '未加载';
        }
        
        if (DOM.gifStats) {
            DOM.gifStats.textContent = '等待生成';
        }
        
        // 重置输入
        if (DOM.rowsInput) DOM.rowsInput.value = 1;
        if (DOM.colsInput) DOM.colsInput.value = 1;
        if (DOM.frameDelay) DOM.frameDelay.value = 100;
        if (DOM.delayValue) DOM.delayValue.textContent = '100ms';
        if (DOM.bgColor) DOM.bgColor.value = 'transparent';
        
        // 重置播放速度按钮
        if (DOM.playbackSpeed) {
            DOM.playbackSpeed.forEach((btn, index) => {
                btn.classList.toggle('active', index === 1); // 第二个按钮是1x
            });
        }
        
        // 取消批量模式
        if (DOM.batchMode) {
            DOM.batchMode.checked = false;
            if (DOM.uploadArea && DOM.uploadArea.querySelector('p')) {
                DOM.uploadArea.querySelector('p').innerHTML = 
                    '<strong>选择精灵表图像</strong><br><small>支持 PNG, JPG, GIF 格式</small>';
            }
        }
        
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
        
        .frame-item {
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .frame-item:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
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
        
        .frame-number {
            position: absolute;
            top: 5px;
            left: 5px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
    
    // 设置事件监听器
    setupEventListeners();
    
    // 更新UI状态
    updateUI();
    
    console.log('应用程序初始化完成！');
    showMessage('精灵表GIF生成器已就绪！点击上传区域选择文件', 'info');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initApp);
