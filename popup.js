// popup.js - 弹出页面脚本

document.addEventListener('DOMContentLoaded', function() {
  // DOM 元素
  const mainPanel = document.getElementById('mainPanel');
  const settingsPanel = document.getElementById('settingsPanel');
  const content = document.getElementById('content');
  const videoCount = document.querySelector('.video-count');
  const updateTime = document.querySelector('.update-time');
  const loginTip = document.getElementById('loginTip');
  const toast = document.getElementById('toast');

  // 按钮
  const refreshBtn = document.getElementById('refreshBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const backBtn = document.getElementById('backBtn');
  const saveBtn = document.getElementById('saveBtn');

  // 设置表单
  const customApiUrl = document.getElementById('customApiUrl');
  const refreshInterval = document.getElementById('refreshInterval');
  const maxItems = document.getElementById('maxItems');

  // 当前设置
  let currentSettings = {
    customApiUrl: '',
    refreshInterval: 0,
    maxItems: 50
  };

  // 显示提示
  function showToast(message, duration = 2000) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  // 加载设置
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['settings']);
      if (result.settings) {
        currentSettings = { ...currentSettings, ...result.settings };
        customApiUrl.value = currentSettings.customApiUrl || '';
        refreshInterval.value = currentSettings.refreshInterval || 0;
        maxItems.value = currentSettings.maxItems || 50;
      }
    } catch (e) {
      console.error('加载设置失败:', e);
    }
  }

  // 保存设置
  async function saveSettings() {
    try {
      const settings = {
        customApiUrl: customApiUrl.value.trim(),
        refreshInterval: parseInt(refreshInterval.value) || 0,
        maxItems: parseInt(maxItems.value) || 50
      };

      await chrome.storage.sync.set({ settings });
      currentSettings = settings;
      showToast('设置已保存');

      // 通知 background 更新设置
      chrome.runtime.sendMessage({
        type: 'SETTINGS_UPDATED',
        settings: settings
      });

      // 返回主面板
      setTimeout(() => {
        settingsPanel.classList.remove('active');
        mainPanel.classList.remove('hidden');
      }, 500);
    } catch (e) {
      console.error('保存设置失败:', e);
      showToast('保存失败');
    }
  }

  // 检查登录状态
  async function checkLogin() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHECK_LOGIN'
      });
      return response?.isLoggedIn || false;
    } catch (e) {
      console.error('检查登录状态失败:', e);
      return false;
    }
  }

  // 规范化 URL，确保是完整的 https 链接
  function normalizeUrl(url) {
    if (!url) return '';
    
    // 如果已经是完整 URL，直接返回
    if (url.startsWith('https://') || url.startsWith('http://')) {
      return url;
    }
    
    // 如果是 // 开头的协议相对 URL
    if (url.startsWith('//')) {
      return 'https:' + url;
    }
    
    // 如果是 / 开头的路径相对 URL
    if (url.startsWith('/')) {
      return 'https://www.bilibili.com' + url;
    }
    
    // 其他情况，添加 https 前缀
    return 'https://' + url;
  }

  // 加载播放列表
  async function loadPlaylist() {
    content.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <div>正在加载动态数据...</div>
      </div>
    `;

    // 先检查登录状态
    const isLoggedIn = await checkLogin();
    if (!isLoggedIn) {
      loginTip.style.display = 'block';
      content.innerHTML = `
        <div class="empty-msg">
          <div class="icon">⚠️</div>
          <div>未检测到登录状态</div>
          <div style="font-size: 12px; margin-top: 8px; color: #ff4d4f;">
            请先在浏览器中登录B站，然后刷新页面重试
          </div>
        </div>
      `;
      return;
    }

    loginTip.style.display = 'none';

    try {
      // 发送消息给 background 获取数据
      const response = await chrome.runtime.sendMessage({
        type: 'FETCH_PLAYLIST',
        apiUrl: currentSettings.customApiUrl || null
      });

      if (!response) {
        throw new Error('未收到响应');
      }

      if (response.error) {
        if (response.code === -101) {
          loginTip.style.display = 'block';
          content.innerHTML = `
            <div class="empty-msg">
              <div class="icon">⚠️</div>
              <div>账号未登录</div>
              <div style="font-size: 12px; margin-top: 8px; color: #ff4d4f;">
                请先在浏览器中登录B站
              </div>
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
          <button onclick="location.reload()" style="margin-top: 12px; padding: 8px 16px; background: #00a1d6; color: white; border: none; border-radius: 4px; cursor: pointer;">
            重试
          </button>
        </div>
      `;
    }
  }

  // 渲染播放列表
  function renderPlaylist(data) {
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
    const maxCount = currentSettings.maxItems || 50;

    items.forEach((item, index) => {
      if (count >= maxCount) return;

      try {
        const author = item.modules?.module_author?.name || '未知作者';
        const title = item.modules?.module_dynamic?.major?.archive?.title;
        const rawUrl = item.modules?.module_dynamic?.major?.archive?.jump_url || '';
        // 规范化 URL
        const jumpUrl = normalizeUrl(rawUrl);

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

  // 事件绑定
  refreshBtn.addEventListener('click', loadPlaylist);
  
  settingsBtn.addEventListener('click', () => {
    settingsPanel.classList.add('active');
    mainPanel.classList.add('hidden');
  });

  backBtn.addEventListener('click', () => {
    settingsPanel.classList.remove('active');
    mainPanel.classList.remove('hidden');
  });

  saveBtn.addEventListener('click', saveSettings);

  // 初始化
  loadSettings().then(() => {
    loadPlaylist();
  });
});
