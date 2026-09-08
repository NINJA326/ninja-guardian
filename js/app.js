'use strict';

(function bootstrapGuardianApp() {
  const config = window.NINJA_GUARDIAN_CONFIG;
  const statusElement = document.getElementById('app-status');

  function setStatus(message) {
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  function fail(message, error) {
    setStatus(message);

    if (error) {
      console.error('[NINJA Guardian]', error);
    } else {
      console.error('[NINJA Guardian]', message);
    }
  }

  async function start() {
    if (!config || !config.LIFF_ID || !config.API_URL) {
      fail('設定を読み込めませんでした。');
      return;
    }

    if (!window.liff) {
      fail('LINE認証機能を読み込めませんでした。');
      return;
    }

    try {
      await window.liff.init({
        liffId: config.LIFF_ID
      });

      if (!window.liff.isLoggedIn()) {
        setStatus('LINEログインへ移動します…');

        window.liff.login({
          redirectUri: window.location.href
        });

        return;
      }

      const idToken = window.liff.getIDToken();

      if (!idToken) {
        fail('LINE認証情報を取得できませんでした。');
        return;
      }

      window.NINJA_GUARDIAN_AUTH = Object.freeze({
        idToken: idToken
      });

      setStatus('LINE認証完了');

      console.info(
        '[NINJA
