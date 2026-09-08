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
    setStatus('設定を確認しています…');

    if (!config || !config.LIFF_ID || !config.API_URL) {
      fail('設定を読み込めませんでした。');
      return;
    }

    setStatus('LIFF SDKを確認しています…');

    if (!window.liff) {
      fail('LINE認証機能を読み込めませんでした。');
      return;
    }

    try {
      setStatus('LIFFを初期化しています…');

      await window.liff.init({
        liffId: config.LIFF_ID
      });

      setStatus('LINEログイン状態を確認しています…');

      if (!window.liff.isLoggedIn()) {
        setStatus('LINEログインへ移動します…');

        window.liff.login({
          redirectUri: window.location.href
        });

        return;
      }

      setStatus('LINE認証情報を取得しています…');

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
        '[NINJA Guardian]',
        config.APP_VERSION,
        {
          liffReady: true,
          loggedIn: true,
          idTokenAvailable: true,
          idTokenLogged: false
        }
      );
    } catch (error) {
      fail(
        'LINE認証に失敗しました。',
        error
      );
    }
  }

  start();
})();
