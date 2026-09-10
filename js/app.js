'use strict';

(function bootstrapNinjaOfficialEntry() {
  const config = window.NINJA_GUARDIAN_CONFIG;
  const api = window.NINJA_GUARDIAN_API;

  const statusElement =
    document.getElementById('app-status');

  const roleChoiceSection =
    document.getElementById('role-choice-section');

  const usePlayerRoleButton =
    document.getElementById('use-player-role');

  const useGuardianRoleButton =
    document.getElementById('use-guardian-role');

  const playerRoleSection =
    document.getElementById('player-role-section');

  const playerOpenGrowthButton =
    document.getElementById('player-open-growth');

  const playerOpenFeedbackButton =
    document.getElementById('player-open-feedback');

  const playerSection =
    document.getElementById('player-section');

  const playerSectionLead =
    document.getElementById('player-section-lead');

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

  const registrationChoiceSection =
    document.getElementById('registration-choice-section');

  const startPlayerRegistrationButton =
    document.getElementById('start-player-registration');

  const startGuardianRegistrationButton =
    document.getElementById('start-guardian-registration');

  const playerRegistrationInfo =
    document.getElementById('player-registration-info');

  const playerRegistrationBack =
    document.getElementById('player-registration-back');

  const inviteSection =
    document.getElementById('invite-section');

  const inviteBack =
    document.getElementById('invite-back');

  const inviteForm =
    document.getElementById('invite-form');

  const inviteCodeElement =
    document.getElementById('invite-code');

  const inviteSubmit =
    document.getElementById('invite-submit');

  const inviteStatus =
    document.getElementById('invite-status');

  const LINE_AUTH_RETRY_KEY =
    'ninjaOfficialEntryLineAuthRetryStep44';

  const DEFAULT_PLAYER_ID_KEY =
    'ninjaGuardianDefaultPlayerIdStep44';

  const PLAYER_APP_URLS =
    Object.freeze({
      growth:
        'https://liff.line.me/2010789200-zVWWxqSQ',

      feedback:
        'https://liff.line.me/2010789200-osUDbuzD'
    });

  const EXISTING_APP_LABELS =
    Object.freeze({
      growth: {
        title: '成長記録',
        description: '選択した子どもの成長記録を開く'
      },

      feedback: {
        title: 'フィードバック',
        description: '選択した子どものフィードバックを開く'
      }
    });

  let currentIdToken = '';
  let registeredPlayers = [];
  let selectedPlayerId = '';
  let launchIntent = '';
  let requestedRole = '';
  let playerStatus = null;
  let guardianStatus = null;

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

  function hideAllSections() {
    [
      roleChoiceSection,
      playerRoleSection,
      playerSection,
      playerDetailSection,
      registrationChoiceSection,
      playerRegistrationInfo,
      inviteSection
    ].forEach(hideElement);
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

  function getLocalStorageValue(key) {
    try {
      return window.localStorage
        ? window.localStorage.getItem(key)
        : '';
    } catch (error) {
      return '';
    }
  }

  function setLocalStorageValue(key, value) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(
          key,
          value
        );
      }
    } catch (error) {
      // localStorageが使えない環境では無視します。
    }
  }

  function removeLocalStorageValue(key) {
    try {
      if (window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      // localStorageが使えない環境では無視します。
    }
  }

  function getRequestParam(name) {
    try {
      const url =
        new URL(window.location.href);

      return textOf(
        url.searchParams.get(name)
      );
    } catch (error) {
      return '';
    }
  }

  function getRequestedOpenIntent() {
    const value =
      getRequestParam('open');

    return Object.prototype.hasOwnProperty.call(
      EXISTING_APP_LABELS,
      value
    )
      ? value
      : '';
  }

  function getRequestedRole() {
    const value =
      getRequestParam('role');

    return value === 'player' ||
      value === 'guardian'
        ? value
        : '';
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
        '[NINJA Entry]',
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
        '[NINJA Entry]',
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

  function isOkResponse(result) {
    return !!result && (
      result.status === 'ok' ||
      result.ok === true ||
      result.success === true
    );
  }

  function getResponseData(result) {
    return result &&
      typeof result === 'object' &&
      result.data &&
      typeof result.data === 'object'
        ? result.data
        : result;
  }

  async function safePost(action, payload) {
    try {
      return await api.post(
        action,
        payload
      );
    } catch (error) {
      if (
        isExpiredLineIdTokenError(error)
      ) {
        throw error;
      }

      return {
        success: false,
        ok: false,
        status: 'error',
        message: getErrorMessage(error)
      };
    }
  }

  function normalizePlayerSessionResult(result) {
    if (!isOkResponse(result)) {
      return {
        registered: false,
        sessionToken: '',
        player: null
      };
    }

    const data =
      getResponseData(result);

    const sessionToken =
      textOf(
        data.sessionToken ||
        result.sessionToken
      );

    const player =
      data.player ||
      data.playerData ||
      result.player ||
      null;

    return {
      registered:
        !!sessionToken ||
        !!player,

      sessionToken:
        sessionToken,

      player:
        player
    };
  }

  function normalizeGuardianStatusResult(result) {
    if (!isOkResponse(result)) {
      return {
        registered: false,
        players: []
      };
    }

    const data =
      getResponseData(result);

    const players =
      arrayOf(
        data.players ||
        result.players
      );

    return {
      registered:
        result.registered === true ||
        data.registered === true ||
        players.length > 0,

      players:
        players
    };
  }

  async function getPlayerStatus() {
    const result =
      await safePost(
        'practiceSession.create',
        {
          idToken:
            currentIdToken
        }
      );

    return normalizePlayerSessionResult(
      result
    );
  }

  async function getGuardianStatus() {
    const result =
      await safePost(
        'guardian.registrationStatus',
        {
          idToken:
            currentIdToken
        }
      );

    return normalizeGuardianStatusResult(
      result
    );
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

  function getPlayerId(player) {
    return textOf(
      player && player.playerId
    );
  }

  function getPlayerName(player) {
    return textOf(
      player &&
      (
        player.playerName ||
        player.name
      )
    );
  }

  function saveDefaultPlayerId(playerId) {
    const normalizedPlayerId =
      textOf(playerId);

    if (!normalizedPlayerId) {
      return;
    }

    setLocalStorageValue(
      DEFAULT_PLAYER_ID_KEY,
      normalizedPlayerId
    );
  }

  function getDefaultPlayerId() {
    return textOf(
      getLocalStorageValue(
        DEFAULT_PLAYER_ID_KEY
      )
    );
  }

  function findPlayerById(players, playerId) {
    const normalizedPlayerId =
      textOf(playerId);

    if (!normalizedPlayerId) {
      return null;
    }

    return arrayOf(players).find(
      function findPlayer(player) {
        return getPlayerId(player) ===
          normalizedPlayerId;
      }
    ) || null;
  }

  function resolveAutoLaunchPlayer(players) {
    const list =
      arrayOf(players);

    if (list.length === 1) {
      return list[0];
    }

    const storedPlayer =
      findPlayerById(
        list,
        getDefaultPlayerId()
      );

    if (storedPlayer) {
      return storedPlayer;
    }

    removeLocalStorageValue(
      DEFAULT_PLAYER_ID_KEY
    );

    return null;
  }

  function selectPlayer(player) {
    const playerId =
      getPlayerId(player);

    if (!playerId) {
      selectedPlayerId = '';
      return false;
    }

    selectedPlayerId =
      playerId;

    saveDefaultPlayerId(
      playerId
    );

    return true;
  }

  async function createExternalAppLaunch(appKey) {
    if (!currentIdToken) {
      throw new Error(
        'LINE認証情報がありません。'
      );
    }

    if (!selectedPlayerId) {
      throw new Error(
        '選手が選択されていません。'
      );
    }

    return api.post(
      'guardian.externalAppLaunch.create',
      {
        idToken:
          currentIdToken,

        playerId:
          selectedPlayerId,

        appKey:
          appKey
      }
    );
  }

  function getLaunchUrl(result) {
    return textOf(
      result &&
      result.data &&
      result.data.launchUrl
    );
  }

  async function openGuardianExistingApp(appKey, button) {
    const label =
      EXISTING_APP_LABELS[appKey] &&
      EXISTING_APP_LABELS[appKey].title
        ? EXISTING_APP_LABELS[appKey].title
        : '既存アプリ';

    if (button) {
      button.disabled = true;
    }

    setStatus(
      label + 'を開く準備をしています…'
    );

    try {
      const result =
        await createExternalAppLaunch(appKey);

      const launchUrl =
        getLaunchUrl(result);

      if (!launchUrl) {
        throw new Error(
          label + 'を開くURLを取得できませんでした。'
        );
      }

      window.location.href =
        launchUrl;
    } catch (error) {
      if (
        isExpiredLineIdTokenError(error)
      ) {
        restartLineLogin(error);
        return;
      }

      setStatus(
        error && error.message
          ? error.message
          : label + 'を開けませんでした。'
      );

      console.error(
        '[NINJA Guardian External Launch]',
        error
      );

      if (button) {
        button.disabled = false;
      }
    }
  }

  function openPlayerApp(appKey) {
    const url =
      PLAYER_APP_URLS[appKey];

    if (!url) {
      setStatus(
        '開くアプリを確認できませんでした。'
      );

      return;
    }

    window.location.href =
      url;
  }

  function createAppButton(appKey) {
    const app =
      EXISTING_APP_LABELS[appKey];

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
      app.title;

    const category =
      document.createElement('p');

    category.className =
      'player-category';

    category.textContent =
      app.description;

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
      function onClickAppButton() {
        openGuardianExistingApp(
          appKey,
          button
        );
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
      'この子どもを標準として保存しました。既存アプリを開けます。';

    playerDetailPlaceholder.appendChild(
      message
    );

    playerDetailPlaceholder.appendChild(
      createAppButton('growth')
    );

    playerDetailPlaceholder.appendChild(
      createAppButton('feedback')
    );
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
      getPlayerName(player);

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
        if (
          launchIntent &&
          Object.prototype.hasOwnProperty.call(
            EXISTING_APP_LABELS,
            launchIntent
          )
        ) {
          if (!selectPlayer(player)) {
            setStatus(
              '選手情報を確認できませんでした。'
            );

            return;
          }

          openGuardianExistingApp(
            launchIntent,
            card
          );

          return;
        }

        showGuardianPlayerDetail(player);
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
          getPlayerName(player);

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

  function showPlayerRole() {
    hideAllSections();

    if (
      launchIntent &&
      PLAYER_APP_URLS[launchIntent]
    ) {
      setStatus(
        EXISTING_APP_LABELS[launchIntent].title +
        'を開いています…'
      );

      openPlayerApp(launchIntent);
      return;
    }

    setStatus(
      '選手登録済み'
    );

    showElement(playerRoleSection);
  }

  function showRoleChoice() {
    hideAllSections();

    setStatus(
      '利用方法を選択してください。'
    );

    showElement(roleChoiceSection);
  }

  function showRegistrationChoice() {
    hideAllSections();

    registeredPlayers = [];
    selectedPlayerId = '';
    clearPlayerList();

    setStatus(
      '未登録です。登録方法を選択してください。'
    );

    showElement(registrationChoiceSection);
  }

  function showPlayerRegistrationInfo() {
    hideAllSections();

    setStatus(
      '選手登録の案内'
    );

    showElement(playerRegistrationInfo);
  }

  function showInviteRegistration() {
    hideAllSections();

    setStatus(
      '保護者登録'
    );

    showElement(inviteSection);

    if (inviteCodeElement) {
      inviteCodeElement.focus();
    }
  }

  function showGuardianPlayerDetail(player) {
    if (!selectPlayer(player)) {
      setStatus(
        '選手情報を確認できませんでした。'
      );

      return;
    }

    if (playerDetailName) {
      playerDetailName.textContent =
        getPlayerName(player);
    }

    if (playerDetailCategory) {
      playerDetailCategory.textContent =
        textOf(player.category);
    }

    hideAllSections();
    showElement(playerDetailSection);

    renderExistingAppLinks();

    setStatus(
      '標準の子どもを保存しました。'
    );

    console.info(
      '[NINJA Guardian Detail]',
      {
        success: true,
        mode: 'guardian-external-launch-default-player',
        playerId: selectedPlayerId,
        idTokenLogged: false
      }
    );
  }

  async function showGuardianRole() {
    hideAllSections();
    hidePlayerDetail();

    const players =
      arrayOf(
        guardianStatus &&
        guardianStatus.players
      );

    renderPlayers(players);

    if (
      launchIntent &&
      Object.prototype.hasOwnProperty.call(
        EXISTING_APP_LABELS,
        launchIntent
      )
    ) {
      const targetPlayer =
        resolveAutoLaunchPlayer(players);

      if (targetPlayer) {
        selectPlayer(targetPlayer);

        const label =
          EXISTING_APP_LABELS[launchIntent].title;

        setStatus(
          getPlayerName(targetPlayer) +
          'の' +
          label +
          'を開いています…'
        );

        await openGuardianExistingApp(
          launchIntent,
          null
        );

        return;
      }

      if (playerSectionLead) {
        playerSectionLead.textContent =
          '閲覧する子どもを選択してください。次回から自動で開きます。';
      }

      setStatus(
        '表示する子どもを選択してください。'
      );

      showElement(playerSection);
      return;
    }

    if (playerSectionLead) {
      playerSectionLead.textContent =
        '閲覧する子どもを選択してください。';
    }

    setStatus(
      '保護者登録済み'
    );

    if (players.length) {
      showElement(playerSection);
    } else {
      setStatus(
        '保護者登録済みですが、登録選手を確認できませんでした。'
      );
    }
  }

  function handlePlayerDetailBack() {
    if (
      guardianStatus &&
      guardianStatus.registered
    ) {
      showGuardianRole();
      return;
    }

    hideAllSections();
    setStatus(
      '登録状況を確認してください。'
    );
  }

  async function claimInvite(inviteCode) {
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

      guardianStatus =
        await getGuardianStatus();

      await showGuardianRole();
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

  async function applyDetectedState() {
    const isPlayerRegistered =
      !!(
        playerStatus &&
        playerStatus.registered
      );

    const isGuardianRegistered =
      !!(
        guardianStatus &&
        guardianStatus.registered
      );

    if (
      requestedRole === 'guardian' &&
      isGuardianRegistered
    ) {
      await showGuardianRole();
      return;
    }

    if (
      requestedRole === 'player' &&
      isPlayerRegistered
    ) {
      showPlayerRole();
      return;
    }

    if (
      isPlayerRegistered &&
      isGuardianRegistered
    ) {
      showRoleChoice();
      return;
    }

    if (isGuardianRegistered) {
      await showGuardianRole();
      return;
    }

    if (isPlayerRegistered) {
      showPlayerRole();
      return;
    }

    showRegistrationChoice();
  }

  async function start() {
    setStatus(
      '設定を確認しています…'
    );

    currentIdToken = '';
    registeredPlayers = [];
    selectedPlayerId = '';
    launchIntent = getRequestedOpenIntent();
    requestedRole = getRequestedRole();
    playerStatus = null;
    guardianStatus = null;

    clearPlayerList();
    hideAllSections();

    if (
      !config ||
      !config.LIFF_ID ||
      !config.API_URL
    ) {
      setStatus(
        '設定を読み込めませんでした。'
      );

      console.error(
        '[NINJA Entry] config missing.'
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
        '[NINJA Entry] api missing.'
      );

      return;
    }

    if (!window.liff) {
      setStatus(
        'LINE認証機能を読み込めませんでした。'
      );

      console.error(
        '[NINJA Entry] LIFF SDK missing.'
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

      setStatus(
        '登録状況を確認しています…'
      );

      const results =
        await Promise.all([
          getPlayerStatus(),
          getGuardianStatus()
        ]);

      playerStatus =
        results[0];

      guardianStatus =
        results[1];

      await applyDetectedState();

      removeSessionStorageValue(
        LINE_AUTH_RETRY_KEY
      );

      console.info(
        '[NINJA Entry]',
        {
          liffReady: true,
          loggedIn: true,
          idTokenAvailable: true,
          playerRegistered:
            !!(
              playerStatus &&
              playerStatus.registered
            ),
          guardianRegistered:
            !!(
              guardianStatus &&
              guardianStatus.registered
            ),
          requestedRole:
            requestedRole,
          open:
            launchIntent,
          idTokenLogged:
            false
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
      hideAllSections();

      setStatus(
        '登録状況の確認に失敗しました。'
      );

      console.error(
        '[NINJA Entry]',
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

  if (usePlayerRoleButton) {
    usePlayerRoleButton.addEventListener(
      'click',
      showPlayerRole
    );
  }

  if (useGuardianRoleButton) {
    useGuardianRoleButton.addEventListener(
      'click',
      function onClickGuardianRole() {
        showGuardianRole();
      }
    );
  }

  if (playerOpenGrowthButton) {
    playerOpenGrowthButton.addEventListener(
      'click',
      function onClickPlayerGrowth() {
        openPlayerApp('growth');
      }
    );
  }

  if (playerOpenFeedbackButton) {
    playerOpenFeedbackButton.addEventListener(
      'click',
      function onClickPlayerFeedback() {
        openPlayerApp('feedback');
      }
    );
  }

  if (startPlayerRegistrationButton) {
    startPlayerRegistrationButton.addEventListener(
      'click',
      showPlayerRegistrationInfo
    );
  }

  if (startGuardianRegistrationButton) {
    startGuardianRegistrationButton.addEventListener(
      'click',
      showInviteRegistration
    );
  }

  if (playerRegistrationBack) {
    playerRegistrationBack.addEventListener(
      'click',
      showRegistrationChoice
    );
  }

  if (inviteBack) {
    inviteBack.addEventListener(
      'click',
      showRegistrationChoice
    );
  }

  start();
})();
