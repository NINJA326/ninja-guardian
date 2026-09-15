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

  const playerLoginButton =
    document.getElementById('player-login-button');

  const playerLoginStatus =
    document.getElementById('player-login-status');

  const playerRolePlayerId =
    document.getElementById('player-role-player-id');

  const playerRolePlayerName =
    document.getElementById('player-role-player-name');

  const playerRolePlayerCategory =
    document.getElementById('player-role-player-category');

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

  const playerRegistrationForm =
    document.getElementById('player-registration-form');

  const playerTeamCodeInput =
    document.getElementById('player-team-code');

  const playerLastNameInput =
    document.getElementById('player-last-name-input');

  const playerFirstNameInput =
    document.getElementById('player-first-name-input');

  const playerFuriganaInput =
    document.getElementById('player-furigana-input');

  const playerGradeInput =
    document.getElementById('player-grade-input');

  const playerCategoryInput =
    document.getElementById('player-category-input');

  const playerPasswordInput =
    document.getElementById('player-password-input');

  const playerPasswordConfirmInput =
    document.getElementById('player-password-confirm-input');

  const playerRegistrationSubmit =
    document.getElementById('player-registration-submit');

  const playerRegistrationStatus =
    document.getElementById('player-registration-status');

  const playerRegistrationConfirmPanel =
    document.getElementById('player-registration-confirm-panel');

  const confirmPlayerName =
    document.getElementById('confirm-player-name');

  const confirmPlayerFurigana =
    document.getElementById('confirm-player-furigana');

  const confirmPlayerGrade =
    document.getElementById('confirm-player-grade');

  const confirmPlayerCategory =
    document.getElementById('confirm-player-category');

  const playerRegistrationCancelConfirm =
    document.getElementById('player-registration-cancel-confirm');

  const playerRegistrationConfirmSubmit =
    document.getElementById('player-registration-confirm-submit');

  let pendingPlayerRegistrationData =
    null;

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
    'ninjaOfficialEntryLineAuthRetryStep50';

  const DEFAULT_PLAYER_ID_KEY =
    'ninjaGuardianDefaultPlayerIdStep50';

  const STATE_CACHE_PREFIX =
    'ninjaOfficialEntryStateCacheStep50:';

  const STATE_CACHE_VERSION =
    'step124-player-login-button-v1';

  const STATE_CACHE_TTL_MS =
    7 * 24 * 60 * 60 * 1000;

  const GUARDIAN_RICH_MENU_APPLY_KEY_PREFIX =
    'ninjaGuardianRichMenuAppliedStep64:';

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
  let logoutMode = false;
  let playerStatus = null;
  let guardianStatus = null;
  let currentUserCacheKey = '';
  let cachedStateShown = false;

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

  function setPlayerRegistrationStatus(message) {
    if (playerRegistrationStatus) {
      playerRegistrationStatus.textContent =
        message || '';
    }
  }

  function setPlayerLoginStatus(message) {
    if (playerLoginStatus) {
      playerLoginStatus.textContent =
        message || '';
    }
  }

  function setConfirmText(element, value) {
    if (element) {
      element.textContent =
        value || '未入力';
    }
  }

  function resetPlayerRegistrationConfirmation() {
    pendingPlayerRegistrationData =
      null;

    hideElement(
      playerRegistrationConfirmPanel
    );

    if (playerRegistrationSubmit) {
      playerRegistrationSubmit.disabled = false;
    }

    if (playerRegistrationConfirmSubmit) {
      playerRegistrationConfirmSubmit.disabled = false;
    }
  }

  function showPlayerRegistrationConfirmation(data) {
    pendingPlayerRegistrationData =
      data;

    setConfirmText(
      confirmPlayerName,
      data.playerName
    );

    setConfirmText(
      confirmPlayerFurigana,
      data.furigana
    );

    setConfirmText(
      confirmPlayerGrade,
      data.grade
    );

    setConfirmText(
      confirmPlayerCategory,
      data.category
    );

    if (playerRegistrationSubmit) {
      playerRegistrationSubmit.disabled = true;
    }

    setPlayerRegistrationStatus(
      '登録内容を確認してください。'
    );

    showElement(
      playerRegistrationConfirmPanel
    );

    if (playerRegistrationConfirmPanel) {
      playerRegistrationConfirmPanel.scrollIntoView({
        block:
          'nearest'
      });
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

  function setTextContent(element, value, fallback) {
    if (element) {
      element.textContent =
        textOf(value) ||
        fallback ||
        '未確認';
    }
  }

  function getCurrentPlayerForRole() {
    return sanitizePlayer(
      playerStatus &&
      playerStatus.player
    );
  }

  function renderPlayerRoleDetail() {
    const player =
      getCurrentPlayerForRole();

    setTextContent(
      playerRolePlayerId,
      player && player.playerId,
      '未確認'
    );

    setTextContent(
      playerRolePlayerName,
      player && player.playerName,
      '未確認'
    );

    setTextContent(
      playerRolePlayerCategory,
      player && player.category,
      '未確認'
    );

    console.info(
      '[NINJA Player Role]',
      {
        playerId:
          player && player.playerId
            ? player.playerId
            : '',

        playerName:
          player && player.playerName
            ? player.playerName
            : '',

        category:
          player && player.category
            ? player.category
            : '',

        passwordLogged:
          false,

        idTokenLogged:
          false
      }
    );
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

  function normalizeTeamCode(value) {
    return String(value || '')
      .normalize('NFKC')
      .replace(/\s+/g, '')
      .toUpperCase();
  }

  function normalizePlayerName(value) {
    return String(value || '')
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizePassword(value) {
    return String(value || '')
      .normalize('NFKC')
      .trim();
  }

  function validatePassword(password, passwordConfirm) {
    if (!password) {
      return 'パスワードを入力してください。';
    }

    if (
      password.length < 4 ||
      password.length > 20
    ) {
      return 'パスワードは4〜20文字で入力してください。';
    }

    if (!/^[A-Za-z0-9]+$/.test(password)) {
      return 'パスワードは半角英数字で入力してください。';
    }

    if (password !== passwordConfirm) {
      return '確認用パスワードが一致しません。';
    }

    return '';
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

  function base64UrlDecode(value) {
    const base64 = String(value || '')
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const padded =
      base64 +
      '='.repeat(
        (4 - base64.length % 4) % 4
      );

    return window.atob(padded);
  }

  function decodeJwtPayload(idToken) {
    try {
      const parts =
        String(idToken || '').split('.');

      if (parts.length < 2) {
        return {};
      }

      const binary =
        base64UrlDecode(parts[1]);

      const json = decodeURIComponent(
        Array.prototype.map.call(
          binary,
          function mapChar(character) {
            return '%' +
              ('00' + character.charCodeAt(0).toString(16))
                .slice(-2);
          }
        ).join('')
      );

      return JSON.parse(json);
    } catch (error) {
      return {};
    }
  }

  function fallbackHash(value) {
    let hash = 5381;
    const source =
      String(value || '');

    for (let index = 0; index < source.length; index += 1) {
      hash = ((hash << 5) + hash) + source.charCodeAt(index);
      hash = hash & hash;
    }

    return Math.abs(hash).toString(16);
  }

  async function sha256Hex(value) {
    const source =
      String(value || '');

    if (
      window.crypto &&
      window.crypto.subtle &&
      window.TextEncoder
    ) {
      const encoded =
        new TextEncoder().encode(source);

      const digest =
        await window.crypto.subtle.digest(
          'SHA-256',
          encoded
        );

      return Array.from(
        new Uint8Array(digest)
      ).map(function toHex(byte) {
        return byte.toString(16).padStart(2, '0');
      }).join('');
    }

    return fallbackHash(source);
  }

  async function createUserCacheKeyFromIdToken(idToken) {
    const payload =
      decodeJwtPayload(idToken);

    const subject =
      textOf(
        payload.sub ||
        payload.userId ||
        ''
      );

    if (!subject) {
      return '';
    }

    return await sha256Hex(subject);
  }

  function getStateCacheStorageKey() {
    if (!currentUserCacheKey) {
      return '';
    }

    return STATE_CACHE_PREFIX +
      currentUserCacheKey;
  }

  function getScopedDefaultPlayerIdKey() {
    return currentUserCacheKey
      ? DEFAULT_PLAYER_ID_KEY + ':' + currentUserCacheKey
      : DEFAULT_PLAYER_ID_KEY;
  }

  function sanitizePlayer(player) {
    const playerId =
      textOf(
        player && player.playerId
      );

    const playerName =
      textOf(
        player &&
        (
          player.playerName ||
          player.name
        )
      );

    const category =
      textOf(
        player && player.category
      );

    if (!playerId && !playerName) {
      return null;
    }

    return {
      playerId:
        playerId,

      playerName:
        playerName,

      name:
        playerName,

      category:
        category
    };
  }

  function sanitizePlayers(players) {
    return arrayOf(players)
      .map(sanitizePlayer)
      .filter(Boolean);
  }

  function sanitizePlayerStatus(status) {
    const player =
      sanitizePlayer(
        status && status.player
      );

    return {
      registered:
        !!(
          status && status.registered
        ),

      sessionToken:
        '',

      player:
        player,

      checked:
        status && status.checked !== false
    };
  }

  function sanitizeGuardianStatus(status) {
    const players =
      sanitizePlayers(
        status && status.players
      );

    return {
      registered:
        !!(
          status && status.registered
        ) || players.length > 0,

      players:
        players,

      checked:
        status && status.checked !== false
    };
  }

  function saveCachedDetectedState() {
    const storageKey =
      getStateCacheStorageKey();

    if (!storageKey) {
      return;
    }

    const cache = {
      version:
        STATE_CACHE_VERSION,

      savedAt:
        Date.now(),

      defaultPlayerId:
        getDefaultPlayerId(),

      playerStatus:
        sanitizePlayerStatus(playerStatus),

      guardianStatus:
        sanitizeGuardianStatus(guardianStatus)
    };

    setLocalStorageValue(
      storageKey,
      JSON.stringify(cache)
    );
  }

  function readCachedDetectedState() {
    const storageKey =
      getStateCacheStorageKey();

    if (!storageKey) {
      return null;
    }

    const raw =
      getLocalStorageValue(storageKey);

    if (!raw) {
      return null;
    }

    try {
      const cache = JSON.parse(raw);

      if (
        !cache ||
        cache.version !== STATE_CACHE_VERSION ||
        !cache.savedAt ||
        Date.now() - Number(cache.savedAt) > STATE_CACHE_TTL_MS
      ) {
        removeLocalStorageValue(storageKey);
        return null;
      }

      return cache;
    } catch (error) {
      removeLocalStorageValue(storageKey);
      return null;
    }
  }

  function isCommunicationFailureMessage(message) {
    const text =
      textOf(message);

    return (
      text.indexOf('タイムアウト') >= 0 ||
      text.indexOf('接続できません') >= 0 ||
      text.indexOf('通信') >= 0
    );
  }

  async function applyCachedDetectedStateIfAvailable() {
    const cache =
      readCachedDetectedState();

    if (!cache) {
      return false;
    }

    playerStatus =
      sanitizePlayerStatus(
        cache.playerStatus
      );

    guardianStatus =
      sanitizeGuardianStatus(
        cache.guardianStatus
      );

    const cachedDefaultPlayerId =
      textOf(
        cache.defaultPlayerId
      );

    if (
      cachedDefaultPlayerId &&
      !getDefaultPlayerId()
    ) {
      setLocalStorageValue(
        getScopedDefaultPlayerIdKey(),
        cachedDefaultPlayerId
      );
    }

    cachedStateShown = true;

    await applyDetectedState();

    if (!launchIntent) {
      setStatus(
        '前回情報を表示中。最新状態を確認しています…'
      );
    }

    return true;
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

  function getRequestedLogoutMode() {
    const value =
      getRequestParam('logout')
        .toLowerCase();

    return value === '1' ||
      value === 'true' ||
      value === 'yes' ||
      value === 'logout';
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
        '[NINJA Official Entry]',
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
        '[NINJA Official Entry]',
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

  async function postLinePlayerApi(action, payload) {
    const apiUrl =
      textOf(
        config.LINE_PLAYER_API_URL ||
        config.API_URL
      );

    if (!apiUrl) {
      throw new Error(
        '選手登録APIのURLが設定されていません。'
      );
    }

    const response =
      await fetch(
        apiUrl,
        {
          method:
            'POST',

          headers:
            {
              'Content-Type':
                'text/plain;charset=utf-8'
            },

          body:
            JSON.stringify(
              Object.assign(
                {
                  action:
                    action
                },
                payload || {}
              )
            )
        }
      );

    const responseText =
      await response.text();

    let result;

    try {
      result =
        responseText
          ? JSON.parse(responseText)
          : {};
    } catch (error) {
      throw new Error(
        '選手登録APIの応答を解析できませんでした。'
      );
    }

    if (
      !response.ok ||
      !isOkResponse(result)
    ) {
      throw new Error(
        getErrorMessage(result) ||
        '選手登録に失敗しました。'
      );
    }

    return result;
  }

  async function applyPlayerRichMenuForCurrentLineNoThrow() {
    if (!currentIdToken) {
      return {
        success:
          false,

        message:
          'LINE認証情報がありません。'
      };
    }

    try {
      const result =
        await postLinePlayerApi(
          'linePlayer.richMenu.apply',
          {
            idToken:
              currentIdToken
          }
        );

      console.info(
        '[NINJA Player RichMenu]',
        {
          success:
            true,

          mode:
            getResponseData(result).mode ||
            result.mode ||
            '',

          idTokenLogged:
            false,

          passwordLogged:
            false
        }
      );

      return result;

    } catch (error) {
      console.warn(
        '[NINJA Player RichMenu]',
        {
          success:
            false,

          message:
            getErrorMessage(error),

          idTokenLogged:
            false,

          passwordLogged:
            false
        }
      );

      return {
        success:
          false,

        message:
          getErrorMessage(error)
      };
    }
  }


  function normalizePlayerSessionResult(result) {
    if (!isOkResponse(result)) {
      return {
        registered: false,
        sessionToken: '',
        player: null,
        checked: !isCommunicationFailureMessage(
          result && result.message
        )
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
        sanitizePlayer(player),

      checked: true
    };
  }

  function normalizeGuardianStatusResult(result) {
    if (!isOkResponse(result)) {
      return {
        registered: false,
        players: [],
        guardian: null,
        checked: !isCommunicationFailureMessage(
          result && result.message
        )
      };
    }

    const data =
      getResponseData(result);

    const players =
      sanitizePlayers(
        data.players ||
        result.players
      );

    return {
      registered:
        result.registered === true ||
        data.registered === true ||
        players.length > 0,

      players:
        players,

      guardian:
        data.guardian ||
        result.guardian ||
        null,

      checked: true
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
      getScopedDefaultPlayerIdKey(),
      normalizedPlayerId
    );
  }

  function getDefaultPlayerId() {
    return textOf(
      getLocalStorageValue(
        getScopedDefaultPlayerIdKey()
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
      getScopedDefaultPlayerIdKey()
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
      'この子どもを標準として保存しました。成長記録・フィードバックはLINEの保護者メニューから開いてください。';

    playerDetailPlaceholder.appendChild(
      message
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
      '標準の子どもを保存しました。成長記録・フィードバックはLINEの保護者メニューから開いてください。'
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

    setPlayerLoginStatus('');

    if (playerLoginButton) {
      playerLoginButton.disabled = false;
    }

    renderPlayerRoleDetail();

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
      logoutMode
        ? 'ログアウト中です。登録方法を選択してください。'
        : '未登録です。登録方法を選択してください。'
    );

    showElement(registrationChoiceSection);
  }


  function showLogoutEntry() {
    registeredPlayers = [];
    selectedPlayerId = '';
    playerStatus = {
      registered:
        false,

      checked:
        false
    };
    guardianStatus = {
      registered:
        false,

      checked:
        false,

      players:
        []
    };

    clearPlayerList();

    if (requestedRole === 'player') {
      showPlayerRegistrationInfo();
      return;
    }

    if (requestedRole === 'guardian') {
      showInviteRegistration();
      return;
    }

    showRegistrationChoice();
  }

  function showPlayerRegistrationInfo() {
    hideAllSections();

    setStatus(
      '選手登録'
    );

    setPlayerRegistrationStatus('');

    resetPlayerRegistrationConfirmation();

    showElement(playerRegistrationInfo);

    if (playerTeamCodeInput) {
      playerTeamCodeInput.focus();
    }
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

  function getGuardianIdForRichMenuApply() {
    return textOf(
      guardianStatus &&
      guardianStatus.guardian &&
      guardianStatus.guardian.guardianId
    );
  }

  function getGuardianRichMenuApplyStorageKey() {
    const guardianId =
      getGuardianIdForRichMenuApply();

    if (guardianId) {
      return (
        GUARDIAN_RICH_MENU_APPLY_KEY_PREFIX +
        guardianId
      );
    }

    if (currentUserCacheKey) {
      return (
        GUARDIAN_RICH_MENU_APPLY_KEY_PREFIX +
        currentUserCacheKey
      );
    }

    return '';
  }

  function hasAppliedGuardianRichMenu() {
    const key =
      getGuardianRichMenuApplyStorageKey();

    if (!key) {
      return false;
    }

    return getLocalStorageValue(key) === '1';
  }

  function markGuardianRichMenuApplied() {
    const key =
      getGuardianRichMenuApplyStorageKey();

    if (!key) {
      return;
    }

    setLocalStorageValue(key, '1');
  }

  async function applyGuardianRichMenuInBackground() {
    if (
      !currentIdToken ||
      !guardianStatus ||
      guardianStatus.registered !== true
    ) {
      return;
    }

    if (hasAppliedGuardianRichMenu()) {
      return;
    }

    try {
      const result =
        await api.post(
          'guardian.richMenu.applyGuardian',
          {
            idToken:
              currentIdToken
          }
        );

      if (isOkResponse(result)) {
        markGuardianRichMenuApplied();

        console.info(
          '[NINJA Guardian RichMenu]',
          {
            applied: true,
            mode: 'background',
            idTokenLogged: false
          }
        );
      }
    } catch (error) {
      console.warn(
        '[NINJA Guardian RichMenu]',
        '保護者用リッチメニュー適用は後で再試行します。',
        error
      );
    }
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

    applyGuardianRichMenuInBackground();

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

  function readPlayerRegistrationForm() {
    const lastName =
      normalizePlayerName(
        playerLastNameInput
          ? playerLastNameInput.value
          : ''
      );

    const firstName =
      normalizePlayerName(
        playerFirstNameInput
          ? playerFirstNameInput.value
          : ''
      );

    return {
      teamCode:
        normalizeTeamCode(
          playerTeamCodeInput
            ? playerTeamCodeInput.value
            : ''
        ),

      lastName:
        lastName,

      firstName:
        firstName,

      playerName:
        normalizePlayerName(
          [
            lastName,
            firstName
          ].filter(Boolean).join(' ')
        ),

      furigana:
        normalizePlayerName(
          playerFuriganaInput
            ? playerFuriganaInput.value
            : ''
        ),

      grade:
        textOf(
          playerGradeInput
            ? playerGradeInput.value
            : ''
        ),

      category:
        textOf(
          playerCategoryInput
            ? playerCategoryInput.value
            : ''
        ),

      password:
        normalizePassword(
          playerPasswordInput
            ? playerPasswordInput.value
            : ''
        ),

      passwordConfirm:
        normalizePassword(
          playerPasswordConfirmInput
            ? playerPasswordConfirmInput.value
            : ''
        )
    };
  }

  function validatePlayerRegistrationForm(data) {
    if (!data.teamCode) {
      return 'チーム登録コードを入力してください。';
    }

    if (!data.lastName) {
      return '苗字を入力してください。';
    }

    if (!data.firstName) {
      return '名前を入力してください。';
    }

    if (
      data.lastName.length > 15 ||
      data.firstName.length > 15
    ) {
      return '苗字・名前はそれぞれ15文字以内で入力してください。';
    }

    if (
      data.playerName.length < 2 ||
      data.playerName.length > 30
    ) {
      return '選手名は合計2〜30文字で入力してください。';
    }

    if (!data.category) {
      return 'カテゴリーを選択してください。';
    }

    return validatePassword(
      data.password,
      data.passwordConfirm
    );
  }

  function clearPasswordInputs() {
    if (playerPasswordInput) {
      playerPasswordInput.value = '';
    }

    if (playerPasswordConfirmInput) {
      playerPasswordConfirmInput.value = '';
    }
  }

  async function handlePlayerRegistrationSubmit(event) {
    event.preventDefault();

    const formData =
      readPlayerRegistrationForm();

    const validationMessage =
      validatePlayerRegistrationForm(
        formData
      );

    if (validationMessage) {
      resetPlayerRegistrationConfirmation();

      setPlayerRegistrationStatus(
        validationMessage
      );

      return;
    }

    showPlayerRegistrationConfirmation(
      formData
    );
  }

  async function confirmPlayerRegistration() {
    const formData =
      pendingPlayerRegistrationData ||
      readPlayerRegistrationForm();

    const validationMessage =
      validatePlayerRegistrationForm(
        formData
      );

    if (validationMessage) {
      resetPlayerRegistrationConfirmation();

      setPlayerRegistrationStatus(
        validationMessage
      );

      return;
    }

    if (!currentIdToken) {
      setPlayerRegistrationStatus(
        'LINE認証が必要です。LINEの選手登録ボタンから開き直してください。'
      );

      return;
    }

    if (playerRegistrationSubmit) {
      playerRegistrationSubmit.disabled = true;
    }

    if (playerRegistrationConfirmSubmit) {
      playerRegistrationConfirmSubmit.disabled = true;
    }

    setPlayerRegistrationStatus(
      '選手登録を行っています…'
    );

    try {
      const result =
        await postLinePlayerApi(
          'linePlayer.selfRegister',
          {
            idToken:
              currentIdToken,

            teamCode:
              formData.teamCode,

            playerName:
              formData.playerName,

            furigana:
              formData.furigana,

            grade:
              formData.grade,

            category:
              formData.category,

            password:
              formData.password,

            passwordConfirm:
              formData.passwordConfirm
          }
        );

      const data =
        getResponseData(result);

      const player =
        sanitizePlayer(
          data.player ||
          result.player ||
          null
        );

      clearPasswordInputs();

      pendingPlayerRegistrationData =
        null;

      hideElement(
        playerRegistrationConfirmPanel
      );

      playerStatus =
        {
          registered:
            true,

          sessionToken:
            '',

          player:
            player,

          checked:
            true
        };

      logoutMode =
        false;

      saveCachedDetectedState();

      setPlayerRegistrationStatus(
        '選手登録が完了しました。'
      );

      setStatus(
        '選手登録が完了しました。'
      );

      showPlayerRole();

      console.info(
        '[NINJA Player Registration]',
        {
          success:
            true,

          mode:
            data.mode ||
            result.mode ||
            'CREATED',

          playerId:
            player.playerId,

          passwordLogged:
            false,

          idTokenLogged:
            false
        }
      );

    } catch (error) {
      if (
        isExpiredLineIdTokenError(error)
      ) {
        clearPasswordInputs();
        pendingPlayerRegistrationData = null;
        restartLineLogin(error);
        return;
      }

      if (playerRegistrationSubmit) {
        playerRegistrationSubmit.disabled = false;
      }

      if (playerRegistrationConfirmSubmit) {
        playerRegistrationConfirmSubmit.disabled = false;
      }

      setPlayerRegistrationStatus(
        getErrorMessage(error) ||
        '選手登録に失敗しました。'
      );

      console.error(
        '[NINJA Player Registration]',
        error
      );
    }
  }


  async function handlePlayerLoginButtonClick() {
    if (!currentIdToken) {
      setPlayerLoginStatus(
        'LINE認証が必要です。LINEの選手登録ボタンから開き直してください。'
      );

      return;
    }

    if (playerLoginButton) {
      playerLoginButton.disabled = true;
    }

    setStatus(
      '選手としてログインしています…'
    );

    setPlayerLoginStatus(
      '選手用メニューへ切り替えています…'
    );

    const result =
      await applyPlayerRichMenuForCurrentLineNoThrow();

    if (
      result &&
      isOkResponse(result)
    ) {
      setStatus(
        '選手としてログインしました。'
      );

      setPlayerLoginStatus(
        '選手用メニューへ切り替えました。右上の×で閉じてLINEトーク画面へ戻ってください。'
      );

      return;
    }

    if (playerLoginButton) {
      playerLoginButton.disabled = false;
    }

    setStatus(
      '選手用メニューへの切り替えに失敗しました。'
    );

    setPlayerLoginStatus(
      getErrorMessage(result) ||
      '選手用メニューへの切り替えに失敗しました。時間をおいて再度お試しください。'
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

      saveCachedDetectedState();

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

  async function getPlayerRegistrationStatusByPlayersSheet() {
    if (!currentIdToken) {
      return {
        registered:
          false,

        checked:
          false,

        player:
          null,

        message:
          'LINE認証情報がありません。'
      };
    }

    try {
      const result =
        await postLinePlayerApi(
          'linePlayer.registrationStatus',
          {
            idToken:
              currentIdToken
          }
        );

      const data =
        getResponseData(result);

      return {
        registered:
          !!(
            data.registered ||
            result.registered
          ),

        checked:
          true,

        player:
          sanitizePlayer(
            data.player ||
            result.player ||
            null
          ),

        mode:
          textOf(
            data.mode ||
            result.mode
          ),

        message:
          textOf(
            data.message ||
            result.message
          )
      };

    } catch (error) {
      if (
        isExpiredLineIdTokenError(error)
      ) {
        throw error;
      }

      return {
        registered:
          false,

        checked:
          false,

        player:
          null,

        message:
          getErrorMessage(error)
      };
    }
  }


  async function handleLogoutPlayerRegistrationEntry() {
    setStatus(
      '選手登録状況を確認しています…'
    );

    let registrationStatus;

    try {
      registrationStatus =
        await getPlayerRegistrationStatusByPlayersSheet();

    } catch (error) {
      if (
        isExpiredLineIdTokenError(error)
      ) {
        restartLineLogin(error);
        return;
      }

      registrationStatus =
        {
          registered:
            false,

          checked:
            false,

          player:
            null,

          message:
            getErrorMessage(error)
        };
    }

    guardianStatus =
      {
        registered:
          false,

        checked:
          false,

        players:
          []
      };

    if (
      registrationStatus &&
      registrationStatus.registered
    ) {
      playerStatus =
        {
          registered:
            true,

          sessionToken:
            '',

          player:
            sanitizePlayer(
              registrationStatus.player
            ),

          checked:
            true
        };

      setStatus(
        '選手登録済み'
      );

      saveCachedDetectedState();

      logoutMode =
        false;

      showPlayerRole();

      return;
    }

    playerStatus =
      {
        registered:
          false,

        sessionToken:
          '',

        player:
          null,

        checked:
          true
      };

    setStatus(
      'このLINEで選手登録を開始してください。'
    );

    showPlayerRegistrationInfo();
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

    if (requestedRole === 'guardian') {
      if (isGuardianRegistered) {
        await showGuardianRole();
        return;
      }

      setStatus(
        'このLINEで保護者登録を開始してください。'
      );

      showInviteRegistration();
      return;
    }

    if (requestedRole === 'player') {
      if (isPlayerRegistered) {
        showPlayerRole();
        return;
      }

      setStatus(
        'このLINEで選手登録を開始してください。'
      );

      showPlayerRegistrationInfo();
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
    logoutMode = getRequestedLogoutMode();
    playerStatus = null;
    guardianStatus = null;
    currentUserCacheKey = '';
    cachedStateShown = false;

    clearPlayerList();
    hideAllSections();

    if (
      logoutMode &&
      !requestedRole
    ) {
      showLogoutEntry();

      console.info(
        '[NINJA Official Entry]',
        {
          logoutMode:
            true,

          requestedRole:
            requestedRole,

          liffRequired:
            false,

          registeredPlayersShown:
            false,

          registrationChoiceShown:
            true,

          idTokenLogged:
            false
        }
      );

      return;
    }

    if (
      !config ||
      !config.LIFF_ID ||
      !config.API_URL
    ) {
      setStatus(
        '設定を読み込めませんでした。'
      );

      console.error(
        '[NINJA Official Entry] config missing.'
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
        '[NINJA Official Entry] api missing.'
      );

      return;
    }

    if (!window.liff) {
      setStatus(
        'LINE認証機能を読み込めませんでした。'
      );

      console.error(
        '[NINJA Official Entry] LIFF SDK missing.'
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

      currentUserCacheKey =
        await createUserCacheKeyFromIdToken(
          idToken
        );

      if (logoutMode) {
        if (requestedRole === 'player') {
          await handleLogoutPlayerRegistrationEntry();

          removeSessionStorageValue(
            LINE_AUTH_RETRY_KEY
          );

          console.info(
            '[NINJA Official Entry]',
            {
              liffReady:
                true,

              loggedIn:
                true,

              logoutMode:
                true,

              requestedRole:
                requestedRole,

              playerPreCheck:
                true,

              playerRegistered:
                !!(
                  playerStatus &&
                  playerStatus.registered
                ),

              idTokenLogged:
                false
            }
          );

          return;
        }

        showLogoutEntry();

        removeSessionStorageValue(
          LINE_AUTH_RETRY_KEY
        );

        console.info(
          '[NINJA Official Entry]',
          {
            liffReady:
              true,

            loggedIn:
              true,

            logoutMode:
              true,

            requestedRole:
              requestedRole,

            registeredPlayersShown:
              false,

            registrationChoiceShown:
              !requestedRole,

            idTokenLogged:
              false
          }
        );

        return;
      }

      await applyCachedDetectedStateIfAvailable();

      setStatus(
        cachedStateShown
          ? '最新の登録状況を確認しています…'
          : '登録状況を確認しています…'
      );

      const results =
        await Promise.all([
          getPlayerStatus(),
          getGuardianStatus()
        ]);

      const freshPlayerStatus =
        results[0];

      const freshGuardianStatus =
        results[1];

      if (
        cachedStateShown &&
        freshPlayerStatus &&
        freshPlayerStatus.checked === false &&
        freshGuardianStatus &&
        freshGuardianStatus.checked === false
      ) {
        setStatus(
          '最新確認に時間がかかっています。前回情報を表示しています。'
        );

        return;
      }

      playerStatus =
        freshPlayerStatus;

      guardianStatus =
        freshGuardianStatus;

      saveCachedDetectedState();

      await applyDetectedState();

      removeSessionStorageValue(
        LINE_AUTH_RETRY_KEY
      );

      console.info(
        '[NINJA Official Entry]',
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
          logoutMode:
            logoutMode,
          open:
            launchIntent,
          cachedStateUsed:
            cachedStateShown,
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

      if (cachedStateShown) {
        setStatus(
          '最新確認に失敗しました。前回情報を表示しています。'
        );

        console.error(
          '[NINJA Official Entry]',
          error
        );

        return;
      }

      clearPlayerList();
      hideAllSections();

      setStatus(
        '登録状況の確認に失敗しました。'
      );

      console.error(
        '[NINJA Official Entry]',
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

  if (playerLoginButton) {
    playerLoginButton.addEventListener(
      'click',
      handlePlayerLoginButtonClick
    );
  }

  if (playerRegistrationForm) {
    playerRegistrationForm.addEventListener(
      'submit',
      handlePlayerRegistrationSubmit
    );
  }

  if (playerRegistrationCancelConfirm) {
    playerRegistrationCancelConfirm.addEventListener(
      'click',
      function onClickCancelPlayerRegistrationConfirm() {
        resetPlayerRegistrationConfirmation();

        setPlayerRegistrationStatus(
          '内容を修正してください。'
        );

        if (playerLastNameInput) {
          playerLastNameInput.focus();
        }
      }
    );
  }

  if (playerRegistrationConfirmSubmit) {
    playerRegistrationConfirmSubmit.addEventListener(
      'click',
      confirmPlayerRegistration
    );
  }

  if (startPlayerRegistrationButton) {
    startPlayerRegistrationButton.addEventListener(
      'click',
      function onClickStartPlayerRegistration() {
        if (
          logoutMode &&
          !currentIdToken
        ) {
          window.location.href =
            './?logout=1&role=player';

          return;
        }

        showPlayerRegistrationInfo();
      }
    );
  }

  if (startGuardianRegistrationButton) {
    startGuardianRegistrationButton.addEventListener(
      'click',
      function onClickStartGuardianRegistration() {
        if (
          logoutMode &&
          !currentIdToken
        ) {
          window.location.href =
            './?logout=1&role=guardian';

          return;
        }

        showInviteRegistration();
      }
    );
  }

  if (playerRegistrationBack) {
    playerRegistrationBack.addEventListener(
      'click',
      function onClickPlayerRegistrationBack() {
        resetPlayerRegistrationConfirmation();
        showRegistrationChoice();
      }
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
