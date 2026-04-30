"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (
                installingWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // 新しいSWがインストールされた
                if (confirm("新しいバージョンが利用可能です。更新しますか？")) {
                  window.location.reload();
                }
              }
            };
          }
        };
      })
      .catch((error) => {
        console.error("service worker registration failed", error);
      });
  }, []);

  return null;
}
