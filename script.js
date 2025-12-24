/* ====== 基础重置 ====== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Arial, sans-serif;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    color: #333;
    line-height: 1.6;
    min-height: 100vh;
    padding: 20px;
}

/* ====== 容器布局 ====== */
.container {
    max-width: 1400px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

/* ====== 头部样式 ====== */
header {
    background: white;
    border-radius: 15px;
    padding: 25px 30px;
    margin-bottom: 25px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.08);
    text-align: center;
}

header h1 {
    color: #2c3e50;
    font-size: 2.2rem;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
}

header h1 i {
    color: #3498db;
}

.subtitle {
    color: #7f8c8d;
    font-size: 1.1rem;
}

/* ====== 主要内容区域 ====== */
main {
    flex: 1;
    display: grid;
    grid-template-columns: 350px 1fr;
    gap: 25px;
    margin-bottom: 25px;
}

/* ====== 左侧控制面板 ====== */
.control-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* ====== 卡片通用样式 ====== */
.card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transition: transform 0.3s ease;
}

.card:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 18px rgba(0,0,0,0.12);
}

.card h3 {
    color: #2c3e50;
    margin-bottom: 18px;
    padding-bottom: 12px;
    border-bottom: 2px solid #f0f0f0;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    gap: 10px;
}

/* ====== 上传区域 ====== */
.upload-area {
    border: 3px dashed #3498db;
    border-radius: 10px;
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    background: rgba(52, 152, 219, 0.05);
    transition: all 0.3s ease;
    margin-bottom: 15px;
}

.upload-area:hover {
    background: rgba(52, 152, 219, 0.1);
    border-color: #2980b9;
}

.upload-area i {
    color: #3498db;
    font-size: 3rem;
    margin-bottom: 15px;
    display: block;
}

.upload-area p {
    color: #666;
    margin-bottom: 20px;
    font-size: 1rem;
}

#spriteInput {
    display: none;
}

.batch-upload {
    margin-top: 15px;
    padding-top: 15px;
    border-top: 1px solid #eee;
    font-size: 0.9rem;
}

/* ====== 表单控件 ====== */
.form-group {
    margin-bottom: 18px;
}

.form-group label {
    display: block;
    margin-bottom: 8px;
    color: #2c3e50;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
}

.form-group input,
.form-group select {
    width: 100%;
    padding: 10px 14px;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: white;
}

.form-group input:focus,
.form-group select:focus {
    border-color: #3498db;
    outline: none;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
}

/* ====== 按钮样式 ====== */
.btn {
    padding: 12px 20px;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin-bottom: 10px;
}

.btn.primary {
    background: linear-gradient(135deg, #3498db, #2980b9);
    color: white;
}

.btn.primary:hover {
    background: linear-gradient(135deg, #2980b9, #2573a7);
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(41, 128, 185, 0.3);
}

.btn.secondary {
    background: #95a5a6;
    color: white;
}

.btn.success {
    background: #2ecc71;
    color: white;
}

.btn.warning {
    background: #e74c3c;
    color: white;
}

.btn.small {
    padding: 8px 15px;
    font-size: 0.9rem;
    width: auto;
}

/* 按钮组 */
.button-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 15px;
}

/* ====== 进度条 ====== */
.progress-container {
    margin: 20px 0;
}

.progress-bar {
    height: 8px;
    background: #ecf0f1;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
}

.progress-bar::after {
    content: '';
    display: block;
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #3498db, #2ecc71);
    transition: width 0.5s ease;
}

.progress-text {
    font-size: 0.9rem;
    color: #7f8c8d;
    text-align: center;
}

/* ====== 预设按钮 ====== */
.preset-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 10px;
}

.preset-btn {
    padding: 10px;
    background: #f8f9fa;
    border: 2px solid #e9ecef;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    font-size: 0.9rem;
}

.preset-btn:hover {
    background: #3498db;
    color: white;
    border-color: #3498db;
}

/* ====== 历史记录 ====== */
.history-list {
    max-height: 200px;
    overflow-y: auto;
    margin-bottom: 15px;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 8px;
}

.empty-history {
    text-align: center;
    color: #95a5a6;
    padding: 20px;
    font-style: italic;
}

/* ====== 右侧预览区域 ====== */
.preview-panel {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.preview-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 20px;
}

.original-preview,
.gif-preview {
    background: white;
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 3px 10px rgba(0,0,0,0.08);
}

.original-preview h4,
.gif-preview h4 {
    color: #2c3e50;
    margin-bottom: 15px;
    font-size: 1.1rem;
}

/* ====== 画布样式 ====== */
canvas {
    width: 100% !important;
    height: 200px !important;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    background: white;
    display: block;
}

/* ====== GIF预览容器 ====== */
.gif-container {
    height: 200px;
    border: 2px dashed #ddd;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
    overflow: hidden;
}

.empty-preview {
    color: #95a5a6;
    font-style: italic;
    text-align: center;
    padding: 20px;
}

/* GIF控制按钮 */
.gif-controls {
    display: flex;
    gap: 10px;
    margin-top: 15px;
    justify-content: center;
}

/* ====== 帧管理 ====== */
.frames-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 10px;
    max-height: 250px;
    overflow-y: auto;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    margin-bottom: 15px;
    border: 2px solid #eee;
}

.frame-item {
    position: relative;
    cursor: move;
    transition: transform 0.2s ease;
    border-radius: 6px;
    overflow: hidden;
    border: 2px solid transparent;
}

.frame-item:hover {
    transform: scale(1.05);
    border-color: #3498db;
    box-shadow: 0 3px 10px rgba(52, 152, 219, 0.2);
}

.frame-item img {
    width: 100%;
    height: 80px;
    object-fit: cover;
    display: block;
}

.frame-item.active {
    border-color: #e74c3c;
    box-shadow: 0 0 0 2px rgba(231, 76, 60, 0.3);
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

.frame-actions {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 10px;
}

/* ====== 编辑工具 ====== */
.edit-tools {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 15px;
}

.edit-btn {
    padding: 12px;
    background: #f8f9fa;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    font-weight: 500;
}

.edit-btn:hover {
    background: #3498db;
    color: white;
    border-color: #3498db;
}

.edit-controls {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    margin-top: 10px;
    border: 1px solid #e0e0e0;
}

/* ====== 页脚 ====== */
footer {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-top: 20px;
    text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

footer p {
    color: #7f8c8d;
    margin-bottom: 10px;
}

.footer-links {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 10px;
}

.footer-links a {
    color: #3498db;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: color 0.3s ease;
    font-weight: 500;
}

.footer-links a:hover {
    color: #2980b9;
    text-decoration: underline;
}

/* ====== 模态框 ====== */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background: white;
    padding: 25px;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    position: relative;
}

.close-modal {
    position: absolute;
    top: 15px;
    right: 15px;
    font-size: 1.5rem;
    cursor: pointer;
    color: #95a5a6;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.close-modal:hover {
    background: #f0f0f0;
    color: #e74c3c;
}

/* ====== 实用类 ====== */
.drag-over {
    background: rgba(52, 152, 219, 0.15) !important;
    border-color: #3498db !important;
}

.frame-count {
    background: #3498db;
    color: white;
    padding: 3px 10px;
    border-radius: 20px;
    font-size: 0.9rem;
    margin-left: 10px;
}

/* ====== 响应式设计 ====== */
@media (max-width: 1100px) {
    main {
        grid-template-columns: 1fr;
    }
    
    .preview-container {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    body {
        padding: 10px;
    }
    
    header h1 {
        font-size: 1.8rem;
        flex-direction: column;
        gap: 10px;
    }
    
    .btn {
        padding: 10px 15px;
        font-size: 0.95rem;
    }
    
    .button-group {
        flex-direction: column;
    }
    
    .edit-tools {
        grid-template-columns: 1fr;
    }
    
    .preset-buttons {
        grid-template-columns: 1fr;
    }
    
    .footer-links {
        flex-direction: column;
        gap: 10px;
    }
}

@media (max-width: 480px) {
    .card {
        padding: 15px;
    }
    
    .upload-area {
        padding: 30px 15px;
    }
    
    .upload-area i {
        font-size: 2.5rem;
    }
    
    .frames-container {
        grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    }
}

/* ====== 加载动画 ====== */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.fa-spinner {
    animation: spin 1s linear infinite;
}

/* ====== 滚动条美化 ====== */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}
