'use strict';

(function bootstrapGuardianApp() {
  const config =
    window.NINJA_GUARDIAN_CONFIG;

  const api =
    window.NINJA_GUARDIAN_API;

  const statusElement =
    document.getElementById(
      'app-status'
    );

  const inviteSection =
    document.getElementById(
      'invite-section'
    );

  const inviteForm =
    document.getElementById(
      'invite-form'
    );

  const inviteCodeElement =
    document.getElementById(
      'invite-code'
    );

  const inviteSubmit =
    document.getElementById(
      'invite-submit'
    );

  const inviteStatus =
    document.getElementById(
      'invite-status'
    );

  let currentIdToken = '';

  function setStatus(message) {
    if (statusElement) {
      statusElement.textContent =
        message || '';
    }
  }

  function setInviteStatus(message) {
    if (inviteStatus) {
      inviteStatus.textContent =
        message || '';
    }
  }

  function fail(message, error) {
    setStatus(message);

    if (error) {
      console.error(
        '[NINJA Guardian]',
        error
      );
    } else {
      console.error(
        '[NINJA Guardian]',
        message
      );
    }
  }

  function normalizeInviteCode(value) {
    return String(value || '')
      .normalize('NFKC')
      .replace(/\s+/g, '')
      .replace(/-/g, '')
      .toUpperCase();
  }

  function validateInviteCode(value) {
    return /^[A-Z0-9]{10}$/.test(value);
  }

  function showInviteRegistration() {
    if (inviteSection) {
      inviteSection.hidden = false;
    }

    if (inviteCodeElement) {
      inviteCodeElement.focus();
    }
  }

  function hideInviteRegistration() {
    if (inviteSection) {
      inviteSection.hidden = true;
    }
  }

  function lockInviteForm() {
    if (inviteCodeElement) {
      inviteCodeElement.disabled = true;
    }

    if (inviteSubmit) {
      inviteSubmit.disabled = true;
    }
  }

  function buildRegisteredPlayerText(players) {
    if (!Array.isArray(players)) {
      return '';
    }

    const validPlayers =
      players.filter(
        function(player) {
          return (
            player &&
            String(
              player.playerName || ''
            ).trim()
          );
        }
      );

    if (!validPlayers.length) {
      return '';
    }

    return validPlayers
      .map(
        function(player) {
          const playerName =
            String(
              player.playerName || ''
            ).trim();

          const category =
            String(
              player.category || ''
            ).trim();

          if (category) {
            return (
              playerName +
              '｜' +
              category
            );
          }

          return playerName;
        }
      )
      .join(' / ');
  }

  function showRegisteredState(result) {
    hideInviteRegistration();

    const playerText =
      buildRegisteredPlayerText(
        result &&
        Array.isArray(result.players)
          ? result.players
          : []
      );

    if (playerText) {
      setStatus(
        '保護者登録済み　' +
        playerText
      );

      return;
    }

    setStatus(
      '保護者登録済み'
    );
  }

  async function getRegistrationStatus() {
    if (!api || !api.post) {
      throw new Error(
        'API機能を読み込めませんでした。'
      );
    }

    if (!currentIdToken) {
      throw new Error(
        'LINE認証情報がありません。'
      );
    }

    return api.post(
      'guardian.registrationStatus',
      {
        idToken: currentIdToken
      }
    );
  }

  async function claimInvite(inviteCode) {
    if (!api || !api.post) {
      throw new Error(
        'API機能を読み込めませんでした。'
      );
    }

    if (!currentIdToken) {
      throw new Error(
        'LINE認証情報がありません。'
      );
    }

    return api.post(
      'guardianInvite.claim',
      {
        idToken: currentIdToken,
        inviteCode: inviteCode
      }
    );
  }

  async function handleInviteSubmit(event) {
    event.preventDefault();

    const inviteCode =
      normalizeInviteCode(
        inviteCodeElement
          ? inviteCodeElement.value
          : ''
      );

    if (!validateInviteCode(inviteCode)) {
      setInviteStatus(
        '10文字の招待コードを入力してください。'
      );
      return;
    }

    if (inviteCodeElement) {
      inviteCodeElement.value =
        inviteCode;
    }

    if (inviteSubmit) {
      inviteSubmit.disabled = true;
    }

    setInviteStatus(
      '保護者登録を確認しています…'
    );

    try {
      await claimInvite(
        inviteCode
      );

      lockInviteForm();

      setInviteStatus('');

      await applyRegistrationState();
    } catch (error) {
      if (inviteSubmit) {
        inviteSubmit.disabled = false;
      }

      setInviteStatus(
        error && error.message
          ? error.message
          : '保護者登録に失敗しました。'
      );

      console.error(
        '[NINJA Guardian Invite]',
        error
      );
    }
  }

  async function applyRegistrationState() {
    setStatus(
      '保護者登録状況を確認しています…'
    );

    const result =
      await getRegistrationStatus();

    if (
      result &&
      result.registered === true
    ) {
      showRegisteredState(
        result
      );

      return;
    }

    setStatus(
      'LINE認証完了'
    );

    showInviteRegistration();
  }

  async function start() {
    setStatus(
      '設定を確認しています…'
    );

    if (
      !config ||
      !config.LIFF_ID ||
      !config.API_URL
    ) {
      fail(
        '設定を読み込めませんでした。'
      );
      return;
    }

    if (!api || !api.post) {
      fail(
        'API機能を読み込めませんでした。'
      );
      return;
    }

    setStatus(
      'LIFF SDKを確認しています…'
    );

    if (!window.liff) {
      fail(
        'LINE認証機能を読み込めませんでした。'
      );
      return;
    }

    try {
      setStatus(
        'LIFFを初期化しています…'
      );

      await window.liff.init({
        liffId: config.LIFF_ID
      });

      setStatus(
        'LINEログイン状態を確認しています…'
      );

      if (!window.liff.isLoggedIn()) {
        setStatus(
          'LINEログインへ移動します…'
        );

        window.liff.login({
          redirectUri:
            window.location.href
        });

        return;
      }

      setStatus(
        'LINE認証情報を取得しています…'
      );

      const idToken =
        window.liff.getIDToken();

      if (!idToken) {
        fail(
          'LINE認証情報を取得できませんでした。'
        );
        return;
      }

      currentIdToken =
        idToken;

      window.NINJA_GUARDIAN_AUTH =
        Object.freeze({
          idToken: idToken
        });

      await applyRegistrationState();

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
      hideInviteRegistration();

      fail(
        '保護者登録状況の確認に失敗しました。',
        error
      );
    }
  }

  if (inviteForm) {
    inviteForm.addEventListener(
      'submit',
      handleInviteSubmit
    );
  }

  start();
})();
