// content.js - 内容脚本
// 在B站页面上显示播放列表浮动面板

(function() {
  'use strict';

  // 检查是否已经初始化
  if (window.__bilibiliPlaylistInitialized) {
    return;
  }
  window.__bilibiliPlaylistInitialized = true;

  // 创建样式
  const styleId = 'bilibili-playlist-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #bilibili-playlist-panel {
        position: fixed;
        top: 80px;
        right: 20px;
        width: 400px;
        max-height: calc(100vh - 100px);
        background: #ffffff;
        border: 1px solid #e3e5e7;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        display: flex;
        flex-direction: column;
      }

      #bilibili-playlist-panel .panel-header {
        padding: 14px 18px;
        background: linear-gradient(135deg, #00a1d6, #00b5e5);
        color: white;
        font-weight: bold;
        font-size: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }

      #bilibili-playlist-panel .panel-header .header-title {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      #bilibili-playlist-panel .panel-header .close-btn {
        cursor: pointer;
        font-size: 24px;
        line-height: 1;
        opacity: 0.9;
        transition: opacity 0.2s;
        background: none;
        border: none;
        color: white;
      }

      #bilibili-playlist-panel .panel-header .close-btn:hover {
        opacity: 1;
      }

      #bilibili-playlist-panel .panel-header .refresh-btn {
        cursor: pointer;
        font-size: 18px;
        margin-right: 12px;
        opacity: 0.9;
        transition: transform 0.3s;
        background: none;
        border: none;
        color: white;
      }

      #bilibili-playlist-panel .panel-header .refresh-btn:hover {
        transform: rotate(180deg);
        opacity: 1;
      }

      #bilibili-playlist-panel .panel-content {
        flex-grow: 1;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: #c9ccd0 transparent;
        padding-bottom: 20px;
      }

      #bilibili-playlist-panel .panel-content::-webkit-scrollbar {
        width: 6px;
      }

      #bilibili-playlist-panel .panel-content::-webkit-scrollbar-thumb {
        background: #c9ccd0;
        border-radius: 3px;
      }

      #bilibili-playlist-panel .playlist-item {
        padding: 14px 18px;
        border-bottom: 1px solid #f1f2f3;
        transition: background 0.2s;
      }

      #bilibili-playlist-panel .playlist-item:hover {
        background: #f6f7f8;
      }

      #bilibili-playlist-panel .item-author {
        color: #00a1d6;
        font-size: 13px;
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      #bilibili-playlist-panel .item-title {
        color: #18191c;
        font-size: 15px;
        margin-bottom: 10px;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      #bilibili-playlist-panel .item-actions {
        display: flex;
        gap: 8px;
      }

      #bilibili-playlist-panel .item-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 6px 14px;
        background: #00a1d6;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        font-size: 13px;
        transition: background 0.2s;
      }

      #bilibili-playlist-panel .item-link:hover {
        background: #00b5e5;
      }

      #bilibili-playlist-panel .empty-msg {
        padding: 60px 30px;
        text-align: center;
        color: #9499a0;
      }

      #bilibili-playlist-panel .empty-msg .icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      #bilibili-playlist-panel .loading {
        padding: 60px 30px;
        text-align: center;
        color: #9499a0;
      }

      #bilibili-playlist-panel .loading .spinner {
        display: inline-block;
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #00a1d6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      #bilibili-playlist-toggle {
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 10px 20px;
        background: #00a1d6;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        z-index: 9999;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0, 161, 214, 0.3);
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      #bilibili-playlist-toggle:hover {
        background: #00b5e5;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 161, 214, 0.4);
      }

      #bilibili-playlist-panel .panel-stats {
        padding: 10px 18px;
        background: #f6f7f8;
        border-bottom: 1px solid #e3e5e7;
        font-size: 12px;
        color: #9499a0;
        display: flex;
        justify-content: space-between;
        flex-shrink: 0;
      }

      #bilibili-playlist-panel .login-tip {
        padding: 12px 18px;
        background: #fff7e6;
        border-bottom: 1px solid #ffd591;
        font-size: 13px;
        color: #d48806;
        text-align: center;
      }

      #bilibili-playlist-panel .login-tip a {
        color: #00a1d6;
        text-decoration: none;
      }

      #bilibili-playlist-panel .login-tip a:hover {
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);
  }

  // 创建切换按钮
  let toggleBtn = document.getElementById('bilibili-playlist-toggle');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'bilibili-playlist-toggle';
    toggleBtn.innerHTML = '<span>📺</span><span>播放列表</span>';
    document.body.appendChild(toggleBtn);
  }

  // 创建面板
  function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'bilibili-playlist-panel';
    panel.style.display = 'none';
    panel.innerHTML = `
      <div class="panel-header">
        <span class="header-title"><span>🎬</span>B站动态播放列表</span>
        <div>
          <button class="refresh-btn" title="刷新">🔄</button>
          <button class="close-btn" title="关闭">×</button>
        </div>
      </div>
      <div class="panel-stats">
        <span class="video-count">视频数量: 0</span>
        <span class="update-time">更新时间: --</span>
      </div>
      <div class="panel-content">
        <div class="empty-msg">
          <div class="icon">📺</div>
          <div>点击刷新按钮加载数据</div>
        </div>
      </div>
    `;

    panel.querySelector('.close-btn').addEventListener('click', () => {
      panel.style.display = 'none';
      toggleBtn.style.display = 'flex';
    });

    panel.querySelector('.refresh-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      loadPlaylist();
    });

    return panel;
  }

  let panel = document.getElementById('bilibili-playlist-panel');
  if (!panel) {
    panel = createPanel();
    document.body.appendChild(panel);
  }

  toggleBtn.addEventListener('click', () => {
    panel.style.display = 'flex';
    toggleBtn.style.display = 'none';
    loadPlaylist();
  });

  // 加载播放列表
  async function loadPlaylist() {
    const content = panel.querySelector('.panel-content');
    const videoCount = panel.querySelector('.video-count');
    const updateTime = panel.querySelector('.update-time');

    content.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <div>正在加载动态数据...</div>
      </div>
    `;

    try {
      // 发送消息给 background 获取数据
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_PLAYLIST'
      });

      if (!response) {
        throw new Error('未收到响应');
      }

      if (response.error) {
        if (response.code === -101) {
          content.innerHTML = `
            <div class="login-tip">
              ⚠️ 账号未登录，请先<a href="https://passport.bilibili.com/login" target="_blank">登录B站</a>
            </div>
            <div class="empty-msg">
              <div class="icon">⚠️</div>
              <div>账号未登录</div>
            </div>
          `;
        } else {
          throw new Error(response.error);
        }
        return;
      }

      renderPlaylist(response.data);
      videoCount.textContent = `视频数量: ${response.videoCount || 0}`;
      updateTime.textContent = `更新时间: ${new Date().toLocaleTimeString()}`;

    } catch (e) {
      console.error('加载失败:', e);
      content.innerHTML = `
        <div class="empty-msg">
          <div class="icon">❌</div>
          <div>加载失败</div>
          <div style="font-size: 12px; margin-top: 8px;">${escapeHtml(e.message)}</div>
        </div>
      `;
    }
  }

  // 渲染播放列表
  function renderPlaylist(data) {
    const content = panel.querySelector('.panel-content');

    if (!data || !data.items || data.items.length === 0) {
      content.innerHTML = `
        <div class="empty-msg">
          <div class="icon">📭</div>
          <div>暂无动态数据</div>
          <div style="font-size: 12px; margin-top: 8px; color: #9499a0;">
            可能是因为您关注的UP主没有发布视频动态
          </div>
        </div>
      `;
      return;
    }

    const items = data.items;
    let html = '';
    let count = 0;

    items.forEach((item, index) => {
      try {
        const author = item.modules?.module_author?.name || '未知作者';
        const title = item.modules?.module_dynamic?.major?.archive?.title;
        const jumpUrl = item.modules?.module_dynamic?.major?.archive?.jump_url || '';

        if (title) {
          count++;
          html += `
            <div class="playlist-item" data-index="${count}">
              <div class="item-author">
                <span>👤</span>
                <span>${escapeHtml(author)}</span>
              </div>
              <div class="item-title" title="${escapeHtml(title)}">
                ${escapeHtml(title)}
              </div>
              <div class="item-actions">
                ${jumpUrl ? `
                  <a href="${escapeHtml(jumpUrl)}" target="_blank" class="item-link">
                    <span>▶</span>
                    <span>播放</span>
                  </a>
                ` : `
                  <span style="color: #9499a0; font-size: 13px;">无播放链接</span>
                `}
              </div>
            </div>
          `;
        }
      } catch (e) {
        // 忽略单项处理错误
      }
    });

    if (count > 0) {
      content.innerHTML = html;
    } else {
      content.innerHTML = `
        <div class="empty-msg">
          <div class="icon">🔍</div>
          <div>未找到视频内容</div>
          <div style="font-size: 12px; margin-top: 8px; color: #9499a0;">
            动态中没有视频类型的内容
          </div>
        </div>
      `;
    }
  }

  // HTML 转义
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
