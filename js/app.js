'use strict';

(function bootstrapGuardianApp() {
  const config = window.NINJA_GUARDIAN_CONFIG;
  const api = window.NINJA_GUARDIAN_API;

  const statusElement =
    document.getElementById('app-status');

  const playerSection =
    document.getElementById('player-section');

  const playerList =
    document.getElementById('player-list');

  const playerDetailSection =
    document.getElementById('player-detail-section');

  const playerDetailBack =
    document.getElementById('player-detail-back');

  const playerDetailName =
    document.getElementById('player-detail-name');

  const playerDetailCategory =
    document.getElementById('player-detail-category');

  const playerDetailPlaceholder =
    document.querySelector('.player-detail-placeholder');

  const inviteSection =
    document.getElementById('invite-section');

  const inviteForm =
    document.getElementById('invite-form');

  const inviteCodeElement =
    document.getElementById('invite-code');

  const inviteSubmit =
    document.getElementById('invite-submit');

  const inviteStatus =
    document.getElementById('invite-status');

  const LINE_AUTH_RETRY_KEY =
    'ninjaGuardianLineAuthRetryStep29';

  const EXISTING_APP_LINKS =
    Object.freeze({
      growth:
        'https://liff.line.me/2010789200-zVWWxqSQ',

      feedback:
        'https://liff.line.me/2010789200-osUDbuzD'
    });

  let currentIdToken = '';
  let registeredPlayers = [];
  let selectedPlayerId = '';

  function textOf(value) {
    return String(
      value === null ||
      value === undefined
        ? ''
        : value
    ).trim();
  }

  function arrayOf(value) {
    return Array.isArray(value)
      ? value
      : [];
  }

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

  function showElement(element) {
    if (element) {
      element.hidden = false;
    }
  }

  function hideElement(element) {
    if (element) {
      element.hidden = true;
    }
  }

  function clearPlayerList() {
    if (playerList) {
      playerList.replaceChildren();
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

  function getErrorMessage(error) {
    return textOf(
      error && error.message
        ? error.message
        : error
    );
  }

  function isExpiredLineIdTokenError(error) {
    const message =
      getErrorMessage(error).toLowerCase();

    return (
      message.indexOf('idtoken expired') >= 0 ||
      message.indexOf('id token expired') >= 0 ||
      (
        message.indexOf('line認証') >= 0 &&
        message.indexOf('expired') >= 0
      ) ||
      message.indexOf('有効期限') >= 0
    );
  }

  function getCleanRedirectUri() {
    try {
      const url =
        new URL(window.location.href);

      [
        'code',
        'state',
        'liffClientId',
        'friendship_status_changed',
        'liffRedirectUri'
      ].forEach(function deleteLiffParam(key) {
        url.searchParams.delete(key);
      });

      return url.toString();
    } catch (error) {
      return (
        window.location.origin +
        window.location.pathname
      );
    }
  }

  function getSessionStorageValue(key) {
    try {
      return window.sessionStorage
        ? window.sessionStorage.getItem(key)
        : '';
    } catch (error) {
      return '';
    }
  }

  function setSessionStorageValue(key, value) {
    try {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(
          key,
          value
        );
      }
    } catch (error) {
      // sessionStorageが使えない環境では無視します。
    }
  }

  function removeSessionStorageValue(key) {
    try {
      if (window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch (error) {
      // sessionStorageが使えない環境では無視します。
    }
  }

  function restartLineLogin(error) {
    if (
      getSessionStorageValue(
        LINE_AUTH_RETRY_KEY
      ) === '1'
    ) {
      setStatus(
        'LINE認証の更新に失敗しました。LINEから開き直してください。'
      );

      console.error(
        '[NINJA Guardian]',
        error
      );

      return;
    }

    setSessionStorageValue(
      LINE_AUTH_RETRY_KEY,
      '1'
    );

    setStatus(
      'LINE認証を更新しています…'
    );

    try {
      if (
        window.liff &&
        window.liff.isLoggedIn()
      ) {
        window.liff.logout();
      }
    } catch (logoutError) {
      console.warn(
        '[NINJA Guardian]',
        'LIFF logout skipped.',
        logoutError
      );
    }

    if (
      !window.liff ||
      typeof window.liff.login !== 'function'
    ) {
      setStatus(
        'LINEログインを開始できませんでした。'
      );

      return;
    }

    window.liff.login({
      redirectUri:
        getCleanRedirectUri()
    });
  }

  function setDetailMessage(message) {
    if (!playerDetailPlaceholder) {
      return;
    }

    playerDetailPlaceholder.replaceChildren();

    const paragraph =
      document.createElement('p');

    paragraph.textContent =
      message || '';

    playerDetailPlaceholder.appendChild(
      paragraph
    );
  }

  function createAppButton(
    title,
    description,
    url
  ) {
    const button =
      document.createElement('button');

    button.type = 'button';
    button.className = 'player-card';

    const content =
      document.createElement('div');

    content.className =
      'player-card-content';

    const main =
      document.createElement('div');

    main.className =
      'player-card-main';

    const name =
      document.createElement('p');

    name.className =
      'player-name';

    name.textContent =
      title;

    const category =
      document.createElement('p');

    category.className =
      'player-category';

    category.textContent =
      description;

    const arrow =
      document.createElement('span');

    arrow.className =
      'player-card-arrow';

    arrow.setAttribute(
      'aria-hidden',
      'true'
    );

    arrow.textContent = '›';

    main.appendChild(name);
    main.appendChild(category);

    content.appendChild(main);
    content.appendChild(arrow);

    button.appendChild(content);

    button.addEventListener(
      'click',
      function openExistingApp() {
        window.location.href = url;
      }
    );

    return button;
  }

  function renderExistingAppLinks() {
    if (!playerDetailPlaceholder) {
      return;
    }

    playerDetailPlaceholder.replaceChildren();

    const message =
      document.createElement('p');

    message.className =
      'status-text';

    message.textContent =
      '既存アプリをそのまま開きます。';

    playerDetailPlaceholder.appendChild(
      message
    );

    playerDetailPlaceholder.appendChild(
      createAppButton(
        '成長記録',
        '身体測定・アジリティなど',
        EXISTING_APP_LINKS.growth
      )
    );

    playerDetailPlaceholder.appendChild(
      createAppButton(
        'フィードバック',
        'コーチ所見・フィードバック',
        EXISTING_APP_LINKS.feedback
      )
    );
  }

  function showInviteRegistration() {
    hideElement(playerSection);
    hidePlayerDetail();

    showElement(inviteSection);

    if (inviteCodeElement) {
      inviteCodeElement.focus();
    }
  }

  function hideInviteRegistration() {
    hideElement(inviteSection);
  }

  function hidePlayerDetail() {
    selectedPlayerId = '';

    hideElement(playerDetailSection);

    if (playerDetailName) {
      playerDetailName.textContent = '';
    }

    if (playerDetailCategory) {
      playerDetailCategory.textContent = '';
    }

    setDetailMessage(
      '既存アプリを開く準備ができました。'
    );
  }

  function showPlayerSection() {
    hidePlayerDetail();
    showElement(playerSection);
  }

  function showPlayerDetail(player) {
    selectedPlayerId =
      textOf(
        player && player.playerId
      );

    if (!selectedPlayerId) {
      setStatus(
        '選手情報を確認できませんでした。'
      );

      return;
    }

    if (playerDetailName) {
      playerDetailName.textContent =
        textOf(
          player.playerName ||
          player.name
        );
    }

    if (playerDetailCategory) {
      playerDetailCategory.textContent =
        textOf(player.category);
    }

    hideElement(playerSection);
    hideInviteRegistration();
    showElement(playerDetailSection);

    renderExistingAppLinks();

    console.info(
      '[NINJA Guardian Detail]',
      {
        success: true,
        mode: 'existing-app-links',
        playerId: selectedPlayerId,
        idTokenLogged: false
      }
    );
  }

  function createPlayerCard(player) {
    const card =
      document.createElement('button');

    card.type = 'button';
    card.className = 'player-card';

    const content =
      document.createElement('div');

    content.className =
      'player-card-content';

    const main =
      document.createElement('div');

    main.className =
      'player-card-main';

    const name =
      document.createElement('p');

    name.className =
      'player-name';

    name.textContent =
      textOf(
        player.playerName ||
        player.name
      );

    const category =
      document.createElement('p');

    category.className =
      'player-category';

    category.textContent =
      textOf(player.category);

    const arrow =
      document.createElement('span');

    arrow.className =
      'player-card-arrow';

    arrow.setAttribute(
      'aria-hidden',
      'true'
    );

    arrow.textContent = '›';

    main.appendChild(name);

    if (category.textContent) {
      main.appendChild(category);
    }

    content.appendChild(main);
    content.appendChild(arrow);

    card.appendChild(content);

    card.setAttribute(
      'aria-label',
      name.textContent +
      'のメニューを開く'
    );

    card.addEventListener(
      'click',
      function onClickPlayerCard() {
        showPlayerDetail(player);
      }
    );

    return card;
  }

  function renderPlayers(players) {
    clearPlayerList();

    registeredPlayers =
      arrayOf(players);

    registeredPlayers.forEach(
      function eachPlayer(player) {
        const playerName =
          textOf(
            player.playerName ||
            player.name
          );

        if (
          !playerName ||
          !playerList
        ) {
          return;
        }

        playerList.appendChild(
          createPlayerCard(player)
        );
      }
    );
  }

  function showRegisteredState(result) {
    hideInviteRegistration();
    hidePlayerDetail();

    const players =
      arrayOf(
        result && result.players
      );

    renderPlayers(players);

    setStatus(
      '保護者登録済み'
    );

    if (players.length) {
      showElement(playerSection);
    } else {
      hideElement(playerSection);
    }
  }

  function handlePlayerDetailBack() {
    if (!registeredPlayers.length) {
      hidePlayerDetail();
      return;
    }

    setStatus(
      '保護者登録済み'
    );

    showPlayerSection();
  }

  async function getRegistrationStatus() {
    if (
      !api ||
      typeof api.post !== 'function'
    ) {
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
        idToken:
          currentIdToken
      }
    );
  }

  async function claimInvite(inviteCode) {
    if (
      !api ||
      typeof api.post !== 'function'
    ) {
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
        idToken:
          currentIdToken,

        inviteCode:
          inviteCode
      }
    );
  }

  function lockInviteForm() {
    if (inviteCodeElement) {
      inviteCodeElement.disabled = true;
    }

    if (inviteSubmit) {
      inviteSubmit.disabled = true;
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
      showRegisteredState(result);
      return;
    }

    registeredPlayers = [];

    clearPlayerList();
    hideElement(playerSection);
    hidePlayerDetail();

    setStatus(
      'LINE認証完了'
    );

    showInviteRegistration();
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
      await claimInvite(inviteCode);

      lockInviteForm();

      setInviteStatus('');

      await applyRegistrationState();
    } catch (error) {
      if (
        isExpiredLineIdTokenError(error)
      ) {
        restartLineLogin(error);
        return;
      }

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

  async function start() {
    setStatus(
      '設定を確認しています…'
    );

    registeredPlayers = [];
    selectedPlayerId = '';

    clearPlayerList();
    hideElement(playerSection);
    hidePlayerDetail();
    hideInviteRegistration();

    if (
      !config ||
      !config.LIFF_ID ||
      !config.API_URL
    ) {
      setStatus(
        '設定を読み込めませんでした。'
      );

      console.error(
        '[NINJA Guardian] config missing.'
      );

      return;
    }

    if (
      !api ||
      typeof api.post !== 'function'
    ) {
      setStatus(
        'API機能を読み込めませんでした。'
      );

      console.error(
        '[NINJA Guardian] api missing.'
      );

      return;
    }

    if (!window.liff) {
      setStatus(
        'LINE認証機能を読み込めませんでした。'
      );

      console.error(
        '[NINJA Guardian] LIFF SDK missing.'
      );

      return;
    }

    try {
      setStatus(
        'LIFFを初期化しています…'
      );

      await window.liff.init({
        liffId:
          config.LIFF_ID
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
            getCleanRedirectUri()
        });

        return;
      }

      setStatus(
        'LINE認証情報を取得しています…'
      );

      const idToken =
        window.liff.getIDToken();

      if (!idToken) {
        restartLineLogin(
          new Error(
            'LINE認証情報を取得できませんでした。'
          )
        );

        return;
      }

      currentIdToken =
        idToken;

      window.NINJA_GUARDIAN_AUTH =
        Object.freeze({
          idToken:
            idToken
        });

      await applyRegistrationState();

      removeSessionStorageValue(
        LINE_AUTH_RETRY_KEY
      );

      console.info(
        '[NINJA Guardian]',
        {
          liffReady: true,
          loggedIn: true,
          idTokenAvailable: true,
          mode: 'existing-app-links',
          idTokenLogged: false
        }
      );
    } catch (error) {
      if (
        isExpiredLineIdTokenError(error)
      ) {
        restartLineLogin(error);
        return;
      }

      clearPlayerList();
      hideElement(playerSection);
      hidePlayerDetail();
      hideInviteRegistration();

      setStatus(
        '保護者登録状況の確認に失敗しました。'
      );

      console.error(
        '[NINJA Guardian]',
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

  if (playerDetailBack) {
    playerDetailBack.addEventListener(
      'click',
      handlePlayerDetailBack
    );
  }

  start();
})();
