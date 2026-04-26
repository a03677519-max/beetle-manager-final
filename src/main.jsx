import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// PWA 自己修復 & アップデートロジック
if ('serviceWorker' in navigator) {
  // 新しいワーカーが制御を開始した時にリロードを実行
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).then(reg => {
      // 定期的に更新をチェック
      setInterval(() => { reg.update(); }, 60 * 60 * 1000);

      reg.onupdatefound = () => {
        const installingWorker = reg.installing;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // インストール完了、かつ既存のコントローラーがある場合は更新
              console.log('New content is available; please refresh.');
              window.location.reload();
            }
          }
        };
      };
    });
  });
}
