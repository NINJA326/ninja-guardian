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

  const playerSection =
    document.getElementById(
      'player-section'
    );

  const playerList =
    document.getElementById(
      'player-list'
    );

  const playerDetailSection =
    document.getElementById(
      'player-detail-section'
    );

  const playerDetailBack =
    document.getElementById(
      'player-detail-back'
    );

  const playerDetailName =
    document.getElementById(
      'player-detail-name'
    );

  const playerDetailCategory =
    document.getElementById(
      'player-detail-category'
    );

  const playerDetailPlaceholder =
    document.querySelector(
      '.player-detail-placeholder'
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

  const LINE_AUTH_RETRY_KEY =
    'ninjaGuardianLineAuthRetryStep17';

  let currentIdToken = '';
  let registeredPlayers = [];
  let selectedPlayerId = '';

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

  function getErrorMessage(error) {
    return String(
      error && error.message
        ? error.message
        : error || ''
    );
  }

  function isExpiredLineIdTokenError(error) {
    const message =
      getErrorMessage(error)
        .toLowerCase();

    return (
      message.indexOf('idtoken expired') >= 0 ||
      message.indexOf('id token expired') >= 0 ||
      (
        message.indexOf('line認証に失敗') >= 0 &&
        message.indexOf('expired') >= 0
      ) ||
      (
        message.indexOf('line認証の有効期限') >= 0 &&
        message.indexOf('expired') >= 0
      )
    );
  }

  function getCleanRedirectUri() {
    try {
      const url =
        new URL(
          window.location.href
        );

      [
        'code',
        'state',
        'liffClientId',
        'friendship_status_changed',
        'liffRedirectUri'
      ].forEach(
        function(key) {
          url.searchParams.delete(
            key
          );
        }
      );

      return url.toString();
    } catch (error) {
      return window.location.origin +
        window.location.pathname;
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

  function setSessionStorageValue(
    key,
    value
  ) {
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
        window.sessionStorage.removeItem(
          key
        );
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
      fail(
        'LINE認証の更新に失敗しました。LINEから保護者ページを開き直してください。',
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
      fail(
        'LINEログインを開始できませんでした。',
        error
      );

      return;
    }

    window.liff.login({
      redirectUri:
        getCleanRedirectUri()
    });
  }

  function showInviteRegistration() {
    hidePlayerSection();
    hidePlayerDetail();

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

  function showPlayerSection() {
    hidePlayerDetail();

    if (playerSection) {
      playerSection.hidden = false;
    }
  }

  function hidePlayerSection() {
    if (playerSection) {
      playerSection.hidden = true;
    }
  }

  function setPlayerDetailMessage(message) {
    if (!playerDetailPlaceholder) {
      return;
    }

    playerDetailPlaceholder.replaceChildren();

    const paragraph =
      document.createElement(
        'p'
      );

    paragraph.textContent =
      message || '';

    playerDetailPlaceholder.appendChild(
      paragraph
    );
  }

  function formatGrowthValue(
    value,
    unit
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '未記録';
    }

    return String(value) + unit;
  }

  function formatAgilityValue(record) {
    if (
      !record ||
      record.value === null ||
      record.value === undefined ||
      record.value === ''
    ) {
      return '未記録';
    }

    const unit =
      String(
        record.unit || ''
      ).trim();

    return String(record.value) + unit;
  }

  function createGrowthValueItem(
    labelText,
    valueText
  ) {
    const item =
      document.createElement(
        'div'
      );

    item.className =
      'growth-value-item';

    const label =
      document.createElement(
        'p'
      );

    label.className =
      'growth-value-label';

    label.textContent =
      labelText;

    const value =
      document.createElement(
        'p'
      );

    value.className =
      'growth-value-number';

    value.textContent =
      valueText;

    item.appendChild(
      label
    );

    item.appendChild(
      value
    );

    return item;
  }

  function createDetailErrorCard(
    titleText,
    messageText
  ) {
    const card =
      document.createElement(
        'section'
      );

    card.className =
      'detail-error-card';

    const title =
      document.createElement(
        'h3'
      );

    title.className =
      'detail-error-title';

    title.textContent =
      titleText;

    const message =
      document.createElement(
        'p'
      );

    message.className =
      'detail-error-message';

    message.textContent =
      messageText;

    card.appendChild(
      title
    );

    card.appendChild(
      message
    );

    return card;
  }

  function createGrowthCard(result) {
    const data =
      result &&
      result.data &&
      typeof result.data === 'object'
        ? result.data
        : {};

    const growth =
      data.growth &&
      typeof data.growth === 'object'
        ? data.growth
        : {};

    const records =
      Array.isArray(growth.records)
        ? growth.records
        : [];

    const card =
      document.createElement(
        'section'
      );

    card.className =
      'growth-card';

    const title =
      document.createElement(
        'h3'
      );

    title.className =
      'growth-card-title';

    title.textContent =
      '身体測定';

    card.appendChild(
      title
    );

    if (!records.length) {
      const empty =
        document.createElement(
          'p'
        );

      empty.className =
        'feedback-empty';

      empty.textContent =
        '身体測定データはまだありません。';

      card.appendChild(
        empty
      );

      return card;
    }

    const sortedRecords =
      records
        .slice()
        .sort(
          function(a, b) {
            return String(
              b && b.date
                ? b.date
                : ''
            ).localeCompare(
              String(
                a && a.date
                  ? a.date
                  : ''
              )
            );
          }
        );

    const latest =
      sortedRecords[0];

    const date =
      document.createElement(
        'p'
      );

    date.className =
      'growth-latest-date';

    date.textContent =
      '最新測定日：' +
      String(
        latest.date || ''
      );

    const values =
      document.createElement(
        'div'
      );

    values.className =
      'growth-values';

    values.appendChild(
      createGrowthValueItem(
        '身長',
        formatGrowthValue(
          latest.height,
          'cm'
        )
      )
    );

    values.appendChild(
      createGrowthValueItem(
        '体重',
        formatGrowthValue(
          latest.weight,
          'kg'
        )
      )
    );

    const count =
      document.createElement(
        'p'
      );

    count.className =
      'growth-record-count';

    count.textContent =
      '記録件数：' +
      String(records.length) +
      '件';

    card.appendChild(
      date
    );

    card.appendChild(
      values
    );

    card.appendChild(
      count
    );

    return card;
  }

  function createFeedbackCard(result) {
    const data =
      result &&
      result.data &&
      typeof result.data === 'object'
        ? result.data
        : {};

    const feedback =
      data.feedback &&
      typeof data.feedback === 'object'
        ? data.feedback
        : {};

    const card =
      document.createElement(
        'section'
      );

    card.className =
      'feedback-card';

    const title =
      document.createElement(
        'h3'
      );

    title.className =
      'feedback-card-title';

    title.textContent =
      'コーチ所見';

    card.appendChild(
      title
    );

    const exists =
      feedback.exists === true &&
      String(
        feedback.feedbackText || ''
      ).trim();

    if (!exists) {
      const empty =
        document.createElement(
          'p'
        );

      empty.className =
        'feedback-empty';

      empty.textContent =
        'コーチ所見はまだありません。';

      card.appendChild(
        empty
      );

      return card;
    }

    if (feedback.savedAt) {
      const savedAt =
        document.createElement(
          'p'
        );

      savedAt.className =
        'feedback-saved-at';

      savedAt.textContent =
        '更新日時：' +
        String(
          feedback.savedAt
        ).trim();

      card.appendChild(
        savedAt
      );
    }

    const text =
      document.createElement(
        'p'
      );

    text.className =
      'feedback-text';

    text.textContent =
      String(
        feedback.feedbackText || ''
      ).trim();

    card.appendChild(
      text
    );

    return card;
  }

  function getLatestAgilityRecordsByType(records) {
    const latestByType = {};

    records.forEach(
      function(record) {
        const type =
          String(
            record && record.type
              ? record.type
              : ''
          ).trim();

        if (!type) {
          return;
        }

        const current =
          latestByType[type];

        if (
          !current ||
          String(record.date || '').localeCompare(
            String(current.date || '')
          ) >= 0
        ) {
          latestByType[type] =
            record;
        }
      }
    );

    return Object.keys(latestByType)
      .sort()
      .map(
        function(type) {
          return latestByType[type];
        }
      );
  }

  function createAgilityItem(record) {
    const item =
      document.createElement(
        'div'
      );

    item.className =
      'agility-item';

    const header =
      document.createElement(
        'div'
      );

    header.className =
      'agility-item-header';

    const type =
      document.createElement(
        'p'
      );

    type.className =
      'agility-type';

    type.textContent =
      String(
        record && record.type
          ? record.type
          : ''
      ).trim();

    const date =
      document.createElement(
        'p'
      );

    date.className =
      'agility-date';

    date.textContent =
      String(
        record && record.date
          ? record.date
          : ''
      ).trim();

    const value =
      document.createElement(
        'p'
      );

    value.className =
      'agility-value';

    value.textContent =
      formatAgilityValue(
        record
      );

    header.appendChild(
      type
    );

    if (date.textContent) {
      header.appendChild(
        date
      );
    }

    item.appendChild(
      header
    );

    item.appendChild(
      value
    );

    return item;
  }

  function createAgilityCard(result) {
    const data =
      result &&
      result.data &&
      typeof result.data === 'object'
        ? result.data
        : {};

    const agility =
      data.agility &&
      typeof data.agility === 'object'
        ? data.agility
        : {};

    const records =
      Array.isArray(agility.records)
        ? agility.records
        : [];

    const card =
      document.createElement(
        'section'
      );

    card.className =
      'agility-card';

    const title =
      document.createElement(
        'h3'
      );

    title.className =
      'agility-card-title';

    title.textContent =
      'アジリティ';

    card.appendChild(
      title
    );

    if (!records.length) {
      const empty =
        document.createElement(
          'p'
        );

      empty.className =
        'feedback-empty';

      empty.textContent =
        'アジリティ記録はまだありません。';

      card.appendChild(
        empty
      );

      return card;
    }

    const latestRecords =
      getLatestAgilityRecordsByType(
        records
      );

    const list =
      document.createElement(
        'div'
      );

    list.className =
      'agility-list';

    latestRecords.forEach(
      function(record) {
        list.appendChild(
          createAgilityItem(
            record
          )
        );
      }
    );

    const count =
      document.createElement(
        'p'
      );

    count.className =
      'agility-record-count';

    count.textContent =
      '記録件数：' +
      String(records.length) +
      '件';

    card.appendChild(
      list
    );

    card.appendChild(
      count
    );

    return card;
  }

  function renderPlayerDetailData(
    growthResult,
    growthError,
    feedbackResult,
    feedbackError,
    agilityResult,
    agilityError
  ) {
    if (!playerDetailPlaceholder) {
      return;
    }

    playerDetailPlaceholder.replaceChildren();

    if (growthError) {
      playerDetailPlaceholder.appendChild(
        createDetailErrorCard(
          '身体測定',
          growthError.message ||
          '身体測定データを取得できませんでした。'
        )
      );
    } else {
      playerDetailPlaceholder.appendChild(
        createGrowthCard(
          growthResult
        )
      );
    }

    if (feedbackError) {
      playerDetailPlaceholder.appendChild(
        createDetailErrorCard(
          'コーチ所見',
          feedbackError.message ||
          'コーチ所見を取得できませんでした。'
        )
      );
    } else {
      playerDetailPlaceholder.appendChild(
        createFeedbackCard(
          feedbackResult
        )
      );
    }

    if (agilityError) {
      playerDetailPlaceholder.appendChild(
        createDetailErrorCard(
          'アジリティ',
          agilityError.message ||
          'アジリティ記録を取得できませんでした。'
        )
      );
    } else {
      playerDetailPlaceholder.appendChild(
        createAgilityCard(
          agilityResult
        )
      );
    }
  }

  async function getPlayerGrowth(
    playerId
  ) {
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

    const normalizedPlayerId =
      String(
        playerId || ''
      ).trim();

    if (!normalizedPlayerId) {
      throw new Error(
        '選手IDがありません。'
      );
    }

    return api.post(
      'guardian.playerGrowth',
      {
        idToken:
          currentIdToken,

        playerId:
          normalizedPlayerId
      }
    );
  }

  async function getPlayerFeedback(
    playerId
  ) {
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

    const normalizedPlayerId =
      String(
        playerId || ''
      ).trim();

    if (!normalizedPlayerId) {
      throw new Error(
        '選手IDがありません。'
      );
    }

    return api.post(
      'guardian.playerFeedback',
      {
        idToken:
          currentIdToken,

        playerId:
          normalizedPlayerId
      }
    );
  }

  async function getPlayerAgility(
    playerId
  ) {
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

    const normalizedPlayerId =
      String(
        playerId || ''
      ).trim();

    if (!normalizedPlayerId) {
      throw new Error(
        '選手IDがありません。'
      );
    }

    return api.post(
      'guardian.playerAgility',
      {
        idToken:
          currentIdToken,

        playerId:
          normalizedPlayerId
      }
    );
  }

  async function loadPlayerDetailData(
    playerId
  ) {
    const normalizedPlayerId =
      String(
        playerId || ''
      ).trim();

    setPlayerDetailMessage(
      '選手データを確認しています…'
    );

    const results =
      await Promise.allSettled([
        getPlayerGrowth(
          normalizedPlayerId
        ),
        getPlayerFeedback(
          normalizedPlayerId
        ),
        getPlayerAgility(
          normalizedPlayerId
        )
      ]);

    if (
      selectedPlayerId !==
      normalizedPlayerId
    ) {
      return;
    }

    const growthResult =
      results[0].status === 'fulfilled'
        ? results[0].value
        : null;

    const growthError =
      results[0].status === 'rejected'
        ? results[0].reason
        : null;

    const feedbackResult =
      results[1].status === 'fulfilled'
        ? results[1].value
        : null;

    const feedbackError =
      results[1].status === 'rejected'
        ? results[1].reason
        : null;

    const agilityResult =
      results[2].status === 'fulfilled'
        ? results[2].value
        : null;

    const agilityError =
      results[2].status === 'rejected'
        ? results[2].reason
        : null;

    if (
      isExpiredLineIdTokenError(
        growthError
      ) ||
      isExpiredLineIdTokenError(
        feedbackError
      ) ||
      isExpiredLineIdTokenError(
        agilityError
      )
    ) {
      restartLineLogin(
        growthError ||
        feedbackError ||
        agilityError
      );

      return;
    }

    renderPlayerDetailData(
      growthResult,
      growthError,
      feedbackResult,
      feedbackError,
      agilityResult,
      agilityError
    );

    console.info(
      '[NINJA Guardian Detail]',
      {
        success: true,
        playerId:
          normalizedPlayerId,
        growthLoaded:
          !growthError,
        feedbackLoaded:
          !feedbackError,
        agilityLoaded:
          !agilityError,
        idTokenLogged:
          false
      }
    );
  }

  function showPlayerDetail(player) {
    if (!player) {
      return;
    }

    selectedPlayerId =
      String(
        player.playerId || ''
      ).trim();

    if (!selectedPlayerId) {
      setStatus(
        '選手情報を確認できませんでした。'
      );

      return;
    }

    if (playerDetailName) {
      playerDetailName.textContent =
        String(
          player.playerName || ''
        ).trim();
    }

    if (playerDetailCategory) {
      playerDetailCategory.textContent =
        String(
          player.category || ''
        ).trim();
    }

    hidePlayerSection();
    hideInviteRegistration();

    if (playerDetailSection) {
      playerDetailSection.hidden = false;
    }

    loadPlayerDetailData(
      selectedPlayerId
    );
  }

  function hidePlayerDetail() {
    selectedPlayerId = '';

    if (playerDetailSection) {
      playerDetailSection.hidden = true;
    }

    if (playerDetailName) {
      playerDetailName.textContent = '';
    }

    if (playerDetailCategory) {
      playerDetailCategory.textContent = '';
    }

    setPlayerDetailMessage(
      '選手データを表示する準備ができました。'
    );
  }

  function clearPlayerList() {
    if (playerList) {
      playerList.replaceChildren();
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

  function createPlayerCard(player) {
    const card =
      document.createElement(
        'button'
      );

    card.type = 'button';

    card.className =
      'player-card';

    const content =
      document.createElement(
        'div'
      );

    content.className =
      'player-card-content';

    const main =
      document.createElement(
        'div'
      );

    main.className =
      'player-card-main';

    const name =
      document.createElement(
        'p'
      );

    name.className =
      'player-name';

    name.textContent =
      String(
        player &&
        player.playerName
          ? player.playerName
          : ''
      ).trim();

    const category =
      document.createElement(
        'p'
      );

    category.className =
      'player-category';

    category.textContent =
      String(
        player &&
        player.category
          ? player.category
          : ''
      ).trim();

    const arrow =
      document.createElement(
        'span'
      );

    arrow.className =
      'player-card-arrow';

    arrow.setAttribute(
      'aria-hidden',
      'true'
    );

    arrow.textContent = '›';

    main.appendChild(name);

    if (category.textContent) {
      main.appendChild(
        category
      );
    }

    content.appendChild(main);
    content.appendChild(arrow);

    card.appendChild(content);

    card.setAttribute(
      'aria-label',
      name.textContent +
      'の選手情報を開く'
    );

    card.addEventListener(
      'click',
      function() {
        showPlayerDetail(
          player
        );
      }
    );

    return card;
  }

  function renderPlayers(players) {
    clearPlayerList();

    registeredPlayers =
      Array.isArray(players)
        ? players.slice()
        : [];

    if (
      !playerList ||
      !registeredPlayers.length
    ) {
      return;
    }

    registeredPlayers.forEach(
      function(player) {
        const playerName =
          String(
            player &&
            player.playerName
              ? player.playerName
              : ''
          ).trim();

        if (!playerName) {
          return;
        }

        playerList.appendChild(
          createPlayerCard(
            player
          )
        );
      }
    );
  }

  function showRegisteredState(result) {
    hideInviteRegistration();
    hidePlayerDetail();

    const players =
      result &&
      Array.isArray(result.players)
        ? result.players
        : [];

    renderPlayers(players);

    setStatus(
      '保護者登録済み'
    );

    if (players.length) {
      showPlayerSection();
    } else {
      hidePlayerSection();
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
        idToken:
          currentIdToken
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
        idToken:
          currentIdToken,

        inviteCode:
          inviteCode
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
      if (
        isExpiredLineIdTokenError(
          error
        )
      ) {
        restartLineLogin(
          error
        );

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

    registeredPlayers = [];

    clearPlayerList();
    hidePlayerSection();
    hidePlayerDetail();

    setStatus(
      'LINE認証完了'
    );

    showInviteRegistration();
  }

  async function start() {
    setStatus(
      '設定を確認しています…'
    );

    registeredPlayers = [];
    selectedPlayerId = '';

    clearPlayerList();
    hidePlayerSection();
    hidePlayerDetail();
    hideInviteRegistration();

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
        config.APP_VERSION,
        {
          liffReady:
            true,

          loggedIn:
            true,

          idTokenAvailable:
            true,

          idTokenLogged:
            false
        }
      );
    } catch (error) {
      if (
        isExpiredLineIdTokenError(
          error
        )
      ) {
        restartLineLogin(
          error
        );

        return;
      }

      registeredPlayers = [];
      selectedPlayerId = '';

      clearPlayerList();
      hidePlayerSection();
      hidePlayerDetail();
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

  if (playerDetailBack) {
    playerDetailBack.addEventListener(
      'click',
      handlePlayerDetailBack
    );
  }

  start();
})();
