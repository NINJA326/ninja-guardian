'use strict';

(function createGuardianApi() {
  const config = window.NINJA_GUARDIAN_CONFIG;

  function getApiUrl() {
    const apiUrl = String(
      config && config.API_URL
        ? config.API_URL
        : ''
    ).trim();

    if (!apiUrl) {
      throw new Error(
        'APIの接続先が設定されていません。'
      );
    }

    return apiUrl;
  }

  async function post(action, payload) {
    const actionName =
      String(action || '').trim();

    if (!actionName) {
      throw new Error(
        'API actionがありません。'
      );
    }

    const requestBody = Object.assign(
      {},
      payload || {},
      {
        action: actionName
      }
    );

    let response;

    try {
      response = await fetch(
        getApiUrl(),
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'text/plain;charset=utf-8'
          },
          body: JSON.stringify(
            requestBody
          ),
          redirect: 'follow'
        }
      );
    } catch (error) {
      console.error(
        '[NINJA Guardian API]',
        error
      );

      throw new Error(
        'サーバーへ接続できませんでした。'
      );
    }

    let result;

    try {
      result = await response.json();
    } catch (error) {
      console.error(
        '[NINJA Guardian API JSON]',
        error
      );

      throw new Error(
        'サーバーから正しい応答を受信できませんでした。'
      );
    }

    const success =
      result &&
      (
        result.status === 'ok' ||
        result.ok === true ||
        result.success === true
      );

    if (!success) {
      const message =
        result &&
        result.message
          ? String(result.message)
          : '処理に失敗しました。';

      throw new Error(message);
    }

    return result;
  }

  window.NINJA_GUARDIAN_API =
    Object.freeze({
      post: post
    });
})();
