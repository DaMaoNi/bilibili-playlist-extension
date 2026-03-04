# Bilibili Dynamic Playlist

A browser extension that displays video playlists from Bilibili dynamics.

## Features

- Display videos from your Bilibili dynamics feed
- Fixed video playback links pointing to actual video pages
- Customizable settings (max items, refresh interval)
- Chinese interface

## Installation

1. Download or clone this repository
2. Open Edge/Chrome browser and navigate to `edge://extensions/` or `chrome://extensions/`
3. Enable **Developer mode** (toggle in the bottom-left corner)
4. Click **Load unpacked** button
5. Select the extension folder (the one containing `manifest.json`)

## Usage

1. Make sure you're logged in at [bilibili.com](https://www.bilibili.com)
2. Click the extension icon in the toolbar
3. The video list from your dynamics feed will load automatically
4. Click the "播放" (Play) button to open any video

## Configuration

Click the ⚙️ icon in the popup window to access settings:

| Setting | Description | Default |
|---------|-------------|---------|
| Custom API URL | Use a custom API endpoint | Default Bilibili API |
| Max Items | Maximum videos to display (10-100) | 50 |
| Auto Refresh Interval | Refresh interval in minutes (0 = disabled) | 0 |

## Troubleshooting

### "未检测到登录状态" Error

1. Make sure you're logged in at bilibili.com
2. Check that cookies are not blocked
3. Refresh the extension page and try again

### "暂无动态数据" Message

- Follow more content creators who post videos
- Check if your dynamics feed shows content on the Bilibili homepage

## Files

```
bilibili-dynamic-playlist/
├── manifest.json        # Extension manifest
├── background.js        # Service worker
├── popup.html/js        # Popup interface
├── options.html/js      # Settings page
└── icons/               # Extension icons
```

## License

MIT License
