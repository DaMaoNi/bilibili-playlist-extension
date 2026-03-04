// options.js - 选项页面脚本

document.addEventListener('DOMContentLoaded', function() {
  // DOM 元素
  const customApiUrl = document.getElementById('customApiUrl');
  const maxItems = document.getElementById('maxItems');
  const refreshInterval = document.getElementById('refreshInterval');
  const saveBtn = document.getElementById('saveBtn');
  const toast = document.getElementById('toast');

  // 显示提示
  function showToast(message, type = 'success', duration = 2000) {
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    setTimeout(() => {
      toast.className = 'toast';
    }, duration);
  }

  // 加载设置
  async function loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['settings']);
      if (result.settings) {
        customApiUrl.value = result.settings.customApiUrl || '';
        maxItems.value = result.settings.maxItems || 50;
        refreshInterval.value = result.settings.refreshInterval || 0;
      }
    } catch (e) {
      console.error('加载设置失败:', e);
      showToast('加载设置失败', 'error');
    }
  }

  // 保存设置
  async function saveSettings() {
    try {
      saveBtn.disabled = true;
      saveBtn.textContent = '保存中...';

      const settings = {
        customApiUrl: customApiUrl.value.trim(),
        maxItems: Math.min(100, Math.max(10, parseInt(maxItems.value) || 50)),
        refreshInterval: Math.min(60, Math.max(0, parseInt(refreshInterval.value) || 0))
      };

      await chrome.storage.sync.set({ settings });

      // 通知 background 更新设置
      chrome.runtime.sendMessage({
        type: 'SETTINGS_UPDATED',
        settings: settings
      });

      showToast('设置已保存', 'success');

      // 更新显示值
      maxItems.value = settings.maxItems;
      refreshInterval.value = settings.refreshInterval;

    } catch (e) {
      console.error('保存设置失败:', e);
      showToast('保存失败: ' + e.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = '保存设置';
    }
  }

  // 事件绑定
  saveBtn.addEventListener('click', saveSettings);

  // 回车保存
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !saveBtn.disabled) {
      saveSettings();
    }
  });

  // 初始化
  loadSettings();
});
