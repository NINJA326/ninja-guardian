'use strict';

(function bootstrapGuardianApp() {
  const config = window.NINJA_GUARDIAN_CONFIG;
  const api = window.NINJA_GUARDIAN_API;

  const statusElement = document.getElementById('app-status');
  const playerSection = document.getElementById('player-section');
  const playerList = document.getElementById('player-list');
  const playerDetailSection = document.getElementById('player-detail-section');
  const playerDetailBack = document.getElementById('player-detail-back');
  const playerDetailName = document.getElementById('player-detail-name');
  const playerDetailCategory = document.getElementById('player-detail-category');
  const playerDetailPlaceholder = document.querySelector('.player-detail-placeholder');
  const inviteSection = document.getElementById('invite-section');
  const inviteForm = document.getElementById('invite-form');
  const inviteCodeElement = document.getElementById('invite-code');
  const inviteSubmit = document.getElementById('invite-submit');
  const inviteStatus = document.getElementById('invite-status');

  const LINE_AUTH_RETRY_KEY = 'ninjaGuardianLineAuthRetryStep28Fix';
  const PLAYER_VIEW_LIMIT = 20;

  let currentIdToken = '';
  let registeredPlayers = [];
  let selectedPlayerId = '';

  function setStatus(message) {
    if (statusElement) {
      statusElement.textContent = message || '';
    }
  }

  function setInviteStatus(message) {
    if (inviteStatus) {
      inviteStatus.textContent = message || '';
    }
  }

  function textOf(value) {
    return String(value === null || value === undefined ? '' : value).trim();
  }

  function objectOf(value) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value
      : {};
  }

  function arrayOf(value) {
    return Array.isArray(value) ? value : [];
  }

  function payloadOf(value) {
    const object = objectOf(value);

    if (object.data && typeof object.data === 'object') {
      return object.data;
    }

    return object;
  }

  function firstArray(values) {
    for (let i = 0; i < values.length; i += 1) {
      if (Array.isArray(values[i])) {
        return values[i];
      }
    }

    return [];
  }

  function firstObject(values) {
    for (let i = 0; i < values.length; i += 1) {
      if (values[i] && typeof values[i] === 'object' && !Array.isArray(values[i])) {
        return values[i];
      }
    }

    return {};
  }

  function getErrorMessage(error) {
    return textOf(error && error.message ? error.message : error);
  }

  function isExpiredLineIdTokenError(error) {
    const message = getErrorMessage(error).toLowerCase();

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

  function getCurrentMonthKey() {
    const now = new Date();

    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0')
    ].join('-');
  }

  function getCleanRedirectUri() {
    try {
      const url = new URL(window.location.href);

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
      return window.location.origin + window.location.pathname;
    }
  }

  function getSessionStorageValue(key) {
    try {
      return window.sessionStorage ? window.sessionStorage.getItem(key) : '';
    } catch (error) {
      return '';
    }
  }

  function setSessionStorageValue(key, value) {
    try {
      if (window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
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
    if (getSessionStorageValue(LINE_AUTH_RETRY_KEY) === '1') {
      setStatus('LINE認証の更新に失敗しました。LINEから開き直してください。');
      console.error('[NINJA Guardian]', error);
      return;
    }

    setSessionStorageValue(LINE_AUTH_RETRY_KEY, '1');
    setStatus('LINE認証を更新しています…');

    try {
      if (window.liff && window.liff.isLoggedIn()) {
        window.liff.logout();
      }
    } catch (logoutError) {
      console.warn('[NINJA Guardian] LIFF logout skipped.', logoutError);
    }

    if (!window.liff || typeof window.liff.login !== 'function') {
      setStatus('LINEログインを開始できませんでした。');
      console.error('[NINJA Guardian]', error);
      return;
    }

    window.liff.login({
      redirectUri: getCleanRedirectUri()
    });
  }

  function hideElement(element) {
    if (element) {
      element.hidden = true;
    }
  }

  function showElement(element) {
    if (element) {
      element.hidden = false;
    }
  }

  function clearPlayerList() {
    if (playerList) {
      playerList.replaceChildren();
    }
  }

  function setDetailMessage(message) {
    if (!playerDetailPlaceholder) {
      return;
    }

    playerDetailPlaceholder.replaceChildren();

    const paragraph = document.createElement('p');
    paragraph.textContent = message || '';

    playerDetailPlaceholder.appendChild(paragraph);
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

    setDetailMessage('選手データを表示する準備ができました。');
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

  function showPlayerSection() {
    hidePlayerDetail();
    showElement(playerSection);
  }

  function normalizeInviteCode(value) {
    return textOf(value)
      .normalize('NFKC')
      .replace(/\s+/g, '')
      .replace(/-/g, '')
      .toUpperCase();
  }

  function validateInviteCode(value) {
    return /^[A-Z0-9]{10}$/.test(value);
  }

  function lockInviteForm() {
    if (inviteCodeElement) {
      inviteCodeElement.disabled = true;
    }

    if (inviteSubmit) {
      inviteSubmit.disabled = true;
    }
  }

  function createCard(className, titleText) {
    const card = document.createElement('section');
    card.className = className;

    const title = document.createElement('h3');
    title.className = className + '-title';
    title.textContent = titleText;

    card.appendChild(title);

    return card;
  }

  function appendEmpty(card, message) {
    const empty = document.createElement('p');
    empty.className = 'card-empty feedback-empty';
    empty.textContent = message;

    card.appendChild(empty);
  }

  function appendText(card, className, text) {
    const paragraph = document.createElement('p');
    paragraph.className = className;
    paragraph.textContent = text;

    card.appendChild(paragraph);

    return paragraph;
  }

  function formatValue(value, unit) {
    if (value === null || value === undefined || value === '') {
      return '未記録';
    }

    return String(value) + textOf(unit);
  }

  function createValueItem(prefix, labelText, valueText) {
    const item = document.createElement('div');
    item.className = prefix + '-value-item';

    const label = document.createElement('p');
    label.className = prefix + '-value-label';
    label.textContent = labelText;

    const value = document.createElement('p');
    value.className = prefix + '-value-number';
    value.textContent = valueText;

    item.appendChild(label);
    item.appendChild(value);

    return item;
  }

  function getCardPayload(viewData) {
    return payloadOf(objectOf(viewData).card);
  }

  function extractGrowthRecords(viewData) {
    const data = objectOf(viewData);
    const card = getCardPayload(data);

    return firstArray([
      data.growth && data.growth.records,
      card.growth && card.growth.records,
      card.body && card.body.records,
      card.bodyMeasurements && card.bodyMeasurements.records
    ]);
  }

  function extractAgilityRecords(viewData) {
    const data = objectOf(viewData);
    const card = getCardPayload(data);

    return firstArray([
      data.agility && data.agility.records,
      card.agility && card.agility.records,
      card.agilityRecords && card.agilityRecords.records
    ]);
  }

  function extractShooting(viewData) {
    const data = objectOf(viewData);
    const card = getCardPayload(data);

    return firstObject([
      data.shooting,
      card.shooting
    ]);
  }

  function extractFeedback(viewData) {
    const data = objectOf(viewData);
    const card = getCardPayload(data);

    return firstObject([
      data.feedback,
      card.feedback
    ]);
  }

  function extractAdviceRecords(viewData) {
    const advice = payloadOf(objectOf(viewData).coachAdvice);

    return firstArray([
      advice.records,
      advice.advice
    ]);
  }

  function extractScheduleEvents(viewData) {
    const schedule = objectOf(objectOf(viewData).schedule);
    const eventsPayload = payloadOf(schedule.events);
    const monthPayload = payloadOf(schedule.monthData);

    return firstArray([
      eventsPayload.events,
      monthPayload.events,
      schedule.events
    ]);
  }

  function createGrowthCard(records) {
    const safeRecords = arrayOf(records);
    const card = createCard('growth-card', '身体測定');

    if (!safeRecords.length) {
      appendEmpty(card, '身体測定データはまだありません。');
      return card;
    }

    const latest = safeRecords.slice().sort(function compare(a, b) {
      return textOf(b.date || b.measuredAtIso).localeCompare(
        textOf(a.date || a.measuredAtIso)
      );
    })[0] || {};

    appendText(card, 'growth-latest-date', '最新測定日：' + textOf(latest.date || latest.measuredAtIso));

    const values = document.createElement('div');
    values.className = 'growth-values';

    values.appendChild(createValueItem('growth', '身長', formatValue(latest.height, 'cm')));
    values.appendChild(createValueItem('growth', '体重', formatValue(latest.weight, 'kg')));

    card.appendChild(values);

    appendText(card, 'growth-record-count', '記録件数：' + String(safeRecords.length) + '件');

    return card;
  }

  function createAgilityCard(records) {
    const safeRecords = arrayOf(records);
    const card = createCard('agility-card', 'アジリティ');

    if (!safeRecords.length) {
      appendEmpty(card, 'アジリティ記録はまだありません。');
      return card;
    }

    const latestByType = new Map();

    safeRecords.forEach(function eachRecord(record) {
      const type = textOf(record.type || record.metric || record.name);

      if (!type) {
        return;
      }

      const current = latestByType.get(type);

      if (!current || textOf(record.date).localeCompare(textOf(current.date)) > 0) {
        latestByType.set(type, Object.assign({}, record, { type: type }));
      }
    });

    const list = document.createElement('div');
    list.className = 'agility-list';

    Array.from(latestByType.values()).forEach(function eachLatest(record) {
      const item = document.createElement('div');
      item.className = 'agility-item';

      const header = document.createElement('div');
      header.className = 'agility-item-header';

      const type = document.createElement('p');
      type.className = 'agility-type';
      type.textContent = textOf(record.type);

      const date = document.createElement('p');
      date.className = 'agility-date';
      date.textContent = textOf(record.date);

      header.appendChild(type);

      if (date.textContent) {
        header.appendChild(date);
      }

      const value = document.createElement('p');
      value.className = 'agility-value';
      value.textContent = formatValue(
        record.value !== undefined ? record.value : record.record,
        record.unit
      );

      item.appendChild(header);
      item.appendChild(value);
      list.appendChild(item);
    });

    card.appendChild(list);
    appendText(card, 'agility-record-count', '記録件数：' + String(safeRecords.length) + '件');

    return card;
  }

  function createFeedbackCard(feedback) {
    const safeFeedback = objectOf(feedback);
    const card = createCard('feedback-card', 'コーチ所見');

    const text = textOf(
      safeFeedback.feedbackText ||
      safeFeedback.text ||
      safeFeedback.comment
    );

    if (!text) {
      appendEmpty(card, 'コーチ所見はまだありません。');
      return card;
    }

    const savedAt = textOf(safeFeedback.savedAt || safeFeedback.updatedAt);

    if (savedAt) {
      appendText(card, 'feedback-saved-at', '更新日時：' + savedAt);
    }

    appendText(card, 'feedback-text', text);

    return card;
  }

  function createShootingCard(shooting) {
    const safeShooting = payloadOf(shooting);
    const total = objectOf(safeShooting.total);
    const card = createCard('shooting-card', 'シュート');

    const attempts = Number(total.attempts || 0);
    const records = Number(total.records || 0);

    if (!attempts && !records) {
      appendEmpty(card, 'シュート記録はまだありません。');
      return card;
    }

    const values = document.createElement('div');
    values.className = 'shooting-values';

    values.appendChild(createValueItem('shooting', '成功率', String(total.rate || 0) + '%'));
    values.appendChild(createValueItem(
      'shooting',
      '成功 / 試投',
      String(total.made || 0) + ' / ' + String(total.attempts || 0)
    ));

    card.appendChild(values);
    appendText(card, 'shooting-record-count', '記録件数：' + String(records) + '件');

    return card;
  }

  function getAdviceText(record) {
    return textOf(
      record.adviceText ||
      record.text ||
      record.message ||
      record.content ||
      record.comment
    );
  }

  function createAdviceCard(records) {
    const safeRecords = arrayOf(records)
      .filter(function hasText(record) {
        return !!getAdviceText(record);
      })
      .slice(0, 5);

    const card = createCard('advice-card', 'コーチアドバイス');

    if (!safeRecords.length) {
      appendEmpty(card, 'コーチアドバイスはまだありません。');
      return card;
    }

    const list = document.createElement('div');
    list.className = 'advice-list';

    safeRecords.forEach(function eachAdvice(record) {
      const item = document.createElement('article');
      item.className = 'advice-item';

      const date = textOf(record.createdAt || record.updatedAt || record.savedAt || record.date);

      if (date) {
        appendText(item, 'advice-date', date);
      }

      appendText(item, 'advice-text', getAdviceText(record));

      list.appendChild(item);
    });

    card.appendChild(list);

    return card;
  }

  function eventMatchesPlayerCategory(event, playerCategory) {
    const categoryText = [
      textOf(event.category),
      arrayOf(event.categories).map(textOf).join(' ')
    ].join(' ');

    if (!playerCategory) {
      return true;
    }

    return (
      categoryText.indexOf(playerCategory) >= 0 ||
      /全体|全カテゴリー|共通|男女|全員/.test(categoryText)
    );
  }

  function formatScheduleTime(event) {
    if (event.allDay === true) {
      return '終日';
    }

    const startTime = textOf(event.startTime);
    const endTime = textOf(event.endTime);

    if (startTime && endTime) {
      return startTime + '-' + endTime;
    }

    return startTime || endTime;
  }

  function createScheduleCard(events, player, schedule) {
    const safeSchedule = objectOf(schedule);
    const playerCategory = textOf(player.category);
    const card = createCard('schedule-card', '予定');

    appendText(card, 'schedule-meta', textOf(safeSchedule.month || getCurrentMonthKey()) + ' の予定');

    const safeEvents = arrayOf(events)
      .filter(function isVisible(event) {
        return eventMatchesPlayerCategory(event, playerCategory);
      })
      .sort(function compareEvents(a, b) {
        return textOf(a.date).localeCompare(textOf(b.date));
      })
      .slice(0, 8);

    if (!safeEvents.length) {
      appendEmpty(card, '表示できる予定はまだありません。');
      return card;
    }

    const list = document.createElement('div');
    list.className = 'schedule-list';

    safeEvents.forEach(function eachEvent(event) {
      const item = document.createElement('article');
      item.className = 'schedule-item';

      const header = document.createElement('div');
      header.className = 'schedule-item-header';

      const title = document.createElement('p');
      title.className = 'schedule-title';
      title.textContent = textOf(event.title || event.type || event.category || '予定');

      const date = document.createElement('p');
      date.className = 'schedule-date';
      date.textContent = textOf(event.date);

      header.appendChild(title);

      if (date.textContent) {
        header.appendChild(date);
      }

      item.appendChild(header);

      const time = formatScheduleTime(event);

      if (time) {
        appendText(item, 'schedule-time', time);
      }

      const note = [
        textOf(event.location),
        textOf(event.note)
      ].filter(Boolean).join(' / ');

      if (note) {
        appendText(item, 'schedule-note', note);
      }

      list.appendChild(item);
    });

    card.appendChild(list);

    return card;
  }

  function createErrorCard(title, message) {
    const card = createCard('detail-error-card', title);
    appendText(card, 'detail-error-message', message);
    return card;
  }

  function renderPlayerView(result) {
    const viewData = payloadOf(result);
    const player = objectOf(viewData.player);

    if (playerDetailName && textOf(player.playerName || player.name)) {
      playerDetailName.textContent = textOf(player.playerName || player.name);
    }

    if (playerDetailCategory && textOf(player.category)) {
      playerDetailCategory.textContent = textOf(player.category);
    }

    if (!playerDetailPlaceholder) {
      return;
    }

    playerDetailPlaceholder.replaceChildren();

    playerDetailPlaceholder.appendChild(createShootingCard(extractShooting(viewData)));
    playerDetailPlaceholder.appendChild(createGrowthCard(extractGrowthRecords(viewData)));
    playerDetailPlaceholder.appendChild(createAgilityCard(extractAgilityRecords(viewData)));
    playerDetailPlaceholder.appendChild(createFeedbackCard(extractFeedback(viewData)));
    playerDetailPlaceholder.appendChild(createAdviceCard(extractAdviceRecords(viewData)));
    playerDetailPlaceholder.appendChild(createScheduleCard(
      extractScheduleEvents(viewData),
      player,
      objectOf(viewData.schedule)
    ));
  }

  async function getRegistrationStatus() {
    if (!api || !api.post) {
      throw new Error('API機能を読み込めませんでした。');
    }

    if (!currentIdToken) {
      throw new Error('LINE認証情報がありません。');
    }

    return api.post('guardian.registrationStatus', {
      idToken: currentIdToken
    });
  }

  async function claimInvite(inviteCode) {
    if (!api || !api.post) {
      throw new Error('API機能を読み込めませんでした。');
    }

    if (!currentIdToken) {
      throw new Error('LINE認証情報がありません。');
    }

    return api.post('guardianInvite.claim', {
      idToken: currentIdToken,
      inviteCode: inviteCode
    });
  }

  async function getPlayerView(playerId) {
    if (!api || !api.post) {
      throw new Error('API機能を読み込めませんでした。');
    }

    if (!currentIdToken) {
      throw new Error('LINE認証情報がありません。');
    }

    return api.post('guardian.playerView', {
      idToken: currentIdToken,
      playerId: textOf(playerId),
      month: getCurrentMonthKey(),
      limit: PLAYER_VIEW_LIMIT
    });
  }

  async function loadPlayerDetailData(playerId) {
    const normalizedPlayerId = textOf(playerId);

    setDetailMessage('選手データを確認しています…');

    try {
      const result = await getPlayerView(normalizedPlayerId);

      if (selectedPlayerId !== normalizedPlayerId) {
        return;
      }

      renderPlayerView(result);

      console.info('[NINJA Guardian Detail]', {
        success: true,
        action: 'guardian.playerView',
        playerId: normalizedPlayerId,
        idTokenLogged: false
      });
    } catch (error) {
      if (isExpiredLineIdTokenError(error)) {
        restartLineLogin(error);
        return;
      }

      if (playerDetailPlaceholder) {
        playerDetailPlaceholder.replaceChildren();
        playerDetailPlaceholder.appendChild(
          createErrorCard(
            '選手データ',
            error && error.message ? error.message : '選手データを取得できませんでした。'
          )
        );
      }

      console.error('[NINJA Guardian Detail]', error);
    }
  }

  function showPlayerDetail(player) {
    selectedPlayerId = textOf(player && player.playerId);

    if (!selectedPlayerId) {
      setStatus('選手情報を確認できませんでした。');
      return;
    }

    if (playerDetailName) {
      playerDetailName.textContent = textOf(player.playerName || player.name);
    }

    if (playerDetailCategory) {
      playerDetailCategory.textContent = textOf(player.category);
    }

    hideElement(playerSection);
    hideInviteRegistration();
    showElement(playerDetailSection);

    loadPlayerDetailData(selectedPlayerId);
  }

  function createPlayerCard(player) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'player-card';

    const content = document.createElement('div');
    content.className = 'player-card-content';

    const main = document.createElement('div');
    main.className = 'player-card-main';

    const name = document.createElement('p');
    name.className = 'player-name';
    name.textContent = textOf(player.playerName || player.name);

    const category = document.createElement('p');
    category.className = 'player-category';
    category.textContent = textOf(player.category);

    const arrow = document.createElement('span');
    arrow.className = 'player-card-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '›';

    main.appendChild(name);

    if (category.textContent) {
      main.appendChild(category);
    }

    content.appendChild(main);
    content.appendChild(arrow);
    card.appendChild(content);

    card.setAttribute('aria-label', name.textContent + 'の選手情報を開く');

    card.addEventListener('click', function onClickPlayerCard() {
      showPlayerDetail(player);
    });

    return card;
  }

  function renderPlayers(players) {
    clearPlayerList();

    registeredPlayers = arrayOf(players);

    registeredPlayers.forEach(function eachPlayer(player) {
      const playerName = textOf(player.playerName || player.name);

      if (!playerName || !playerList) {
        return;
      }

      playerList.appendChild(createPlayerCard(player));
    });
  }

  function showRegisteredState(result) {
    hideInviteRegistration();
    hidePlayerDetail();

    const players = arrayOf(result && result.players);

    renderPlayers(players);
    setStatus('保護者登録済み');

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

    setStatus('保護者登録済み');
    showPlayerSection();
  }

  async function applyRegistrationState() {
    setStatus('保護者登録状況を確認しています…');

    const result = await getRegistrationStatus();

    if (result && result.registered === true) {
      showRegisteredState(result);
      return;
    }

    registeredPlayers = [];

    clearPlayerList();
    hideElement(playerSection);
    hidePlayerDetail();

    setStatus('LINE認証完了');
    showInviteRegistration();
  }

  async function handleInviteSubmit(event) {
    event.preventDefault();

    const inviteCode = normalizeInviteCode(
      inviteCodeElement ? inviteCodeElement.value : ''
    );

    if (!validateInviteCode(inviteCode)) {
      setInviteStatus('10文字の招待コードを入力してください。');
      return;
    }

    if (inviteCodeElement) {
      inviteCodeElement.value = inviteCode;
    }

    if (inviteSubmit) {
      inviteSubmit.disabled = true;
    }

    setInviteStatus('保護者登録を確認しています…');

    try {
      await claimInvite(inviteCode);
      lockInviteForm();
      setInviteStatus('');
      await applyRegistrationState();
    } catch (error) {
      if (isExpiredLineIdTokenError(error)) {
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

      console.error('[NINJA Guardian Invite]', error);
    }
  }

  async function start() {
    setStatus('設定を確認しています…');

    registeredPlayers = [];
    selectedPlayerId = '';

    clearPlayerList();
    hideElement(playerSection);
    hidePlayerDetail();
    hideInviteRegistration();

    if (!config || !config.LIFF_ID || !config.API_URL) {
      setStatus('設定を読み込めませんでした。');
      console.error('[NINJA Guardian] config missing.');
      return;
    }

    if (!api || typeof api.post !== 'function') {
      setStatus('API機能を読み込めませんでした。');
      console.error('[NINJA Guardian] api missing.');
      return;
    }

    if (!window.liff) {
      setStatus('LINE認証機能を読み込めませんでした。');
      console.error('[NINJA Guardian] LIFF SDK missing.');
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
          redirectUri: getCleanRedirectUri()
        });

        return;
      }

      setStatus('LINE認証情報を取得しています…');

      const idToken = window.liff.getIDToken();

      if (!idToken) {
        restartLineLogin(new Error('LINE認証情報を取得できませんでした。'));
        return;
      }

      currentIdToken = idToken;

      window.NINJA_GUARDIAN_AUTH = Object.freeze({
        idToken: idToken
      });

      await applyRegistrationState();

      removeSessionStorageValue(LINE_AUTH_RETRY_KEY);

      console.info('[NINJA Guardian]', {
        liffReady: true,
        loggedIn: true,
        idTokenAvailable: true,
        idTokenLogged: false
      });
    } catch (error) {
      if (isExpiredLineIdTokenError(error)) {
        restartLineLogin(error);
        return;
      }

      clearPlayerList();
      hideElement(playerSection);
      hidePlayerDetail();
      hideInviteRegistration();

      setStatus('保護者登録状況の確認に失敗しました。');
      console.error('[NINJA Guardian]', error);
    }
  }

  if (inviteForm) {
    inviteForm.addEventListener('submit', handleInviteSubmit);
  }

  if (playerDetailBack) {
    playerDetailBack.addEventListener('click', handlePlayerDetailBack);
  }

  start();
})();
