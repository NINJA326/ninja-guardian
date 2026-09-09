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
      document.createElement('p');

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

  function renderGrowthResult(result) {
    if (!playerDetailPlaceholder) {
      return;
    }

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

    if (!records.length) {
      setPlayerDetailMessage(
        '身体測定データはまだありません。'
      );

      return;
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

    playerDetailPlaceholder.replaceChildren();

    const title =
      document.createElement('p');

    title.textContent =
      '身体測定';

    title.style.fontWeight =
      '700';

    title.style.margin =
      '0 0 8px';

    const date =
      document.createElement('p');

    date.textContent =
      '最新測定日：' +
      String(
        latest.date || ''
      );

    date.style.margin =
      '0 0 6px';

    const height =
      document.createElement('p');

    height.textContent =
      '身長：' +
      formatGrowthValue(
        latest.height,
        'cm'
      );

    height.style.margin =
      '0 0 6px';

    const weight =
      document.createElement('p');

    weight.textContent =
      '体重：' +
      formatGrowthValue(
        latest.weight,
        'kg'
      );

    weight.style.margin =
      '0 0 6px';

    const count =
      document.createElement('p');

    count.textContent =
      '記録件数：' +
      String(records.length) +
      '件';

    count.style.margin =
      '0';

    playerDetailPlaceholder.appendChild(
      title
    );

    playerDetailPlaceholder.appendChild(
      date
    );

    playerDetailPlaceholder.appendChild(
      height
    );

    playerDetailPlaceholder.appendChild(
      weight
    );

    playerDetailPlaceholder.appendChild(
      count
    );
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

  async function loadPlayerGrowth(
    playerId
  ) {
    setPlayerDetailMessage(
      '身体測定データを確認しています…'
    );

    try {
      const result =
        await getPlayerGrowth(
          playerId
        );

      if (
        selectedPlayerId !==
        String(
          playerId || ''
        ).trim()
      ) {
        return;
      }

      renderGrowthResult(
        result
      );

      console.info(
        '[NINJA Guardian Growth]',
        {
          success: true,
          playerId:
            String(
              playerId || ''
            ).trim(),
          idTokenLogged:
            false
        }
      );
    } catch (error) {
      if (
        selectedPlayerId !==
        String(
          playerId || ''
        ).trim()
      ) {
        return;
      }

      setPlayerDetailMessage(
        error && error.message
          ? error.message
          : '身体測定データを取得できませんでした。'
      );

      console.error(
        '[NINJA Guardian Growth]',
        error
      );
    }
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

    loadPlayerGrowth(
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
          idToken:
            idToken
        });

      await applyRegistrationState();

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
