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

  const PLAYER_VIEW_LIMIT = 20;

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

  function textOf(value) {
    return String(
      value === null ||
      value === undefined
        ? ''
        : value
    ).trim();
  }

  function objectOf(value) {
    return value &&
      typeof value === 'object' &&
      !Array.isArray(value)
      ? value
      : {};
  }

  function arrayOf(value) {
    return Array.isArray(value)
      ? value
      : [];
  }

  function payloadOf(value) {
    const object =
      objectOf(value);

    if (
      object.data &&
      typeof object.data === 'object' &&
      (
        object.ok === true ||
        object.success === true ||
        object.status === 'ok'
      )
    ) {
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
      if (
        values[i] &&
        typeof values[i] === 'object' &&
        !Array.isArray(values[i])
      ) {
        return values[i];
      }
    }

    return {};
  }

  function getCurrentMonthKey() {
    const now =
      new Date();

    return (
      String(now.getFullYear()) +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0')
    );
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

  function createValueItem(
    classPrefix,
    labelText,
    valueText
  ) {
    const item =
      document.createElement(
        'div'
      );

    item.className =
      classPrefix + '-value-item';

    const label =
      document.createElement(
        'p'
      );

    label.className =
      classPrefix + '-value-label';

    label.textContent =
      labelText;

    const value =
      document.createElement(
        'p'
      );

    value.className =
      classPrefix + '-value-number';

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

  function getCardPayload(viewData) {
    const data =
      objectOf(viewData);

    return payloadOf(
      data.card
    );
  }

  function extractGrowthRecords(viewData) {
    const data =
      objectOf(viewData);

    const card =
      getCardPayload(data);

    return firstArray([
      data.growth &&
        data.growth.records,

      card.growth &&
        card.growth.records,

      card.body &&
        card.body.records,

      card.bodyMeasurements &&
        card.bodyMeasurements.records,

      data.card &&
        data.card.growth &&
        data.card.growth.records
    ]);
  }

  function extractAgilityRecords(viewData) {
    const data =
      objectOf(viewData);

    const card =
      getCardPayload(data);

    return firstArray([
      data.agility &&
        data.agility.records,

      card.agility &&
        card.agility.records,

      card.agilityRecords &&
        card.agilityRecords.records,

      data.card &&
        data.card.agility &&
        data.card.agility.records
    ]);
  }

  function extractFeedback(viewData) {
    const data =
      objectOf(viewData);

    const card =
      getCardPayload(data);

    return firstObject([
      data.feedback,
      card.feedback,
      data.card && data.card.feedback
    ]);
  }

  function extractShooting(viewData) {
    const data =
      objectOf(viewData);

    const card =
      getCardPayload(data);

    return firstObject([
      data.shooting,
      card.shooting,
      data.card && data.card.shooting
    ]);
  }

  function extractCoachAdviceRecords(viewData) {
    const data =
      objectOf(viewData);

    const advice =
      payloadOf(
        data.coachAdvice
      );

    return firstArray([
      advice.records,
      advice.advice,
      data.coachAdvice &&
        data.coachAdvice.records,
      data.coachAdvice &&
        data.coachAdvice.advice
    ]);
  }

  function extractScheduleEvents(viewData) {
    const data =
      objectOf(viewData);

    const schedule =
      objectOf(
        data.schedule
      );

    const eventsPayload =
      payloadOf(
        schedule.events
      );

    const monthPayload =
      payloadOf(
        schedule.monthData
      );

    return firstArray([
      eventsPayload.events,
      schedule.events &&
        schedule.events.events,
      monthPayload.events,
      schedule.monthData &&
        schedule.monthData.events,
      schedule.events
    ]);
  }

  function createGrowthCardFromRecords(records) {
    const safeRecords =
      arrayOf(records);

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

    if (!safeRecords.length) {
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
      safeRecords
        .slice()
        .sort(function(a, b) {
          return textOf(b.date)
            .localeCompare(
              textOf(a.date)
            );
        });

    const latest =
      sortedRecords[0] || {};

    const date =
      document.createElement(
        'p'
      );

    date.className =
      'growth-latest-date';

    date.textContent =
      '最新測定日：' +
      textOf(
        latest.date || latest.measuredAtIso
      );

    const values =
      document.createElement(
        'div'
      );

    values.className =
      'growth-values';

    values.appendChild(
      createValueItem(
        'growth',
        '身長',
        formatGrowthValue(
          latest.height,
          'cm'
        )
      )
    );

    values.appendChild(
      createValueItem(
        'growth',
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
      String(safeRecords.length) +
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

  function formatAgilityValue(record) {
    const value =
      record && record.value !== undefined
        ? record.value
        : record && record.record !== undefined
          ? record.record
          : '';

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '未記録';
    }

    return String(value) +
      textOf(record && record.unit);
  }

  function getLatestAgilityRecordsByType(records) {
    const byType =
      new Map();

    arrayOf(records).forEach(
      function(record) {
        const type =
          textOf(
            record &&
            (
              record.type ||
              record.metric ||
              record.name
            )
          );

        if (!type) {
          return;
        }

        const current =
          byType.get(type);

        if (
          !current ||
          textOf(record.date).localeCompare(
            textOf(current.date)
          ) > 0
        ) {
          byType.set(
            type,
            Object.assign(
              {},
              record,
              {
                type: type
              }
            )
          );
        }
      }
    );

    return Array.from(
      byType.values()
    ).sort(function(a, b) {
      return textOf(a.type)
        .localeCompare(
          textOf(b.type),
          'ja'
        );
    });
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
      textOf(record && record.type);

    const date =
      document.createElement(
        'p'
      );

    date.className =
      'agility-date';

    date.textContent =
      textOf(record && record.date);

    const value =
      document.createElement(
        'p'
      );

    value.className =
      'agility-value';

    value.textContent =
      formatAgilityValue(record);

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

  function createAgilityCardFromRecords(records) {
    const safeRecords =
      arrayOf(records);

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

    if (!safeRecords.length) {
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
        safeRecords
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
      String(safeRecords.length) +
      '件';

    card.appendChild(
      list
    );

    card.appendChild(
      count
    );

    return card;
  }

  function createFeedbackCardFromFeedback(feedback) {
    const safeFeedback =
      objectOf(feedback);

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

    const feedbackText =
      textOf(
        safeFeedback.feedbackText ||
        safeFeedback.text ||
        safeFeedback.comment
      );

    if (!feedbackText) {
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

    const savedAt =
      textOf(
        safeFeedback.savedAt ||
        safeFeedback.updatedAt
      );

    if (savedAt) {
      const savedAtElement =
        document.createElement(
          'p'
        );

      savedAtElement.className =
        'feedback-saved-at';

      savedAtElement.textContent =
        '更新日時：' +
        savedAt;

      card.appendChild(
        savedAtElement
      );
    }

    const text =
      document.createElement(
        'p'
      );

    text.className =
      'feedback-text';

    text.textContent =
      feedbackText;

    card.appendChild(
      text
    );

    return card;
  }

  function createShootingCard(shooting) {
    const safeShooting =
      payloadOf(shooting);

    const total =
      objectOf(
        safeShooting.total
      );

    const hasShooting =
      Number(total.attempts || 0) > 0 ||
      Number(total.records || 0) > 0;

    const card =
      document.createElement(
        'section'
      );

    card.className =
      'shooting-card';

    const title =
      document.createElement(
        'h3'
      );

    title.className =
      'shooting-card-title';

    title.textContent =
      'シュート';

    card.appendChild(
      title
    );

    if (!hasShooting) {
      const empty =
        document.createElement(
          'p'
        );

      empty.className =
        'card-empty';

      empty.textContent =
        'シュート記録はまだありません。';

      card.appendChild(
        empty
      );

      return card;
    }

    const values =
      document.createElement(
        'div'
      );

    values.className =
      'shooting-values';

    values.appendChild(
      createValueItem(
        'shooting',
        '成功率',
        String(total.rate || 0) + '%'
      )
    );

    values.appendChild(
      createValueItem(
        'shooting',
        '成功 / 試投',
        String(total.made || 0) +
        ' / ' +
        String(total.attempts || 0)
      )
    );

    const count =
      document.createElement(
        'p'
      );

    count.className =
      'shooting-record-count';

    count.textContent =
      '記録件数：' +
      String(total.records || 0) +
      '件';

    card.appendChild(
      values
    );

    card.appendChild(
      count
    );

    return card;
  }

  function getAdviceText(record) {
    return textOf(
      record &&
      (
        record.adviceText ||
        record.text ||
        record.message ||
        record.content ||
        record.comment
      )
    );
  }

  function createCoachAdviceCard(records) {
    const safeRecords =
      arrayOf(records)
        .filter(function(record) {
          return !!getAdviceText(record);
        })
        .slice(0, 5);

    const card =
      document.createElement(
        'section'
      );

    card.className =
      'advice-card';

    const title =
      document.createElement(
        'h3'
      );

    title.className =
      'advice-card-title';

    title.textContent =
      'コーチアドバイス';

    card.appendChild(
      title
    );

    if (!safeRecords.length) {
      const empty =
        document.createElement(
          'p'
        );

      empty.className =
        'card-empty';

      empty.textContent =
        'コーチアドバイスはまだありません。';

      card.appendChild(
        empty
      );

      return card;
    }

    const list =
      document.createElement(
        'div'
      );

    list.className =
      'advice-list';

    safeRecords.forEach(
      function(record) {
        const item =
          document.createElement(
            'article'
          );

        item.className =
          'advice-item';

        const date =
          textOf(
            record.createdAt ||
            record.updatedAt ||
            record.savedAt ||
            record.date
          );

        if (date) {
          const dateElement =
            document.createElement(
              'p'
            );

          dateElement.className =
            'advice-date';

          dateElement.textContent =
            date;

          item.appendChild(
            dateElement
          );
        }

        const text =
          document.createElement(
            'p'
          );

        text.className =
          'advice-text';

        text.textContent =
          getAdviceText(record);

        item.appendChild(
          text
        );

        list.appendChild(
          item
        );
      }
    );

    card.appendChild(
      list
    );

    return card;
  }

  function eventMatchesPlayerCategory(
    event,
    playerCategory
  ) {
    const category =
      textOf(
        event && event.category
      );

    const categories =
      Array.isArray(
        event && event.categories
      )
        ? event.categories.map(textOf)
        : [];

    const joined =
      [
        category
      ].concat(categories)
        .join(' ');

    if (!playerCategory) {
      return true;
    }

    if (
      joined.indexOf(playerCategory) >= 0
    ) {
      return true;
    }

    return /全体|全カテゴリー|共通|男女|全員/.test(
      joined
    );
  }

  function normalizeScheduleEvents(
    events,
    player
  ) {
    const playerCategory =
      textOf(
        player && player.category
      );

    const today =
      new Date();

    const todayKey =
      today.getFullYear() +
      '-' +
      String(today.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(today.getDate()).padStart(2, '0');

    const filtered =
      arrayOf(events)
        .filter(function(event) {
          return eventMatchesPlayerCategory(
            event,
            playerCategory
          );
        })
        .sort(function(a, b) {
          return textOf(a.date)
            .localeCompare(
              textOf(b.date)
            );
        });

    const future =
      filtered.filter(function(event) {
        return textOf(event.date) >= todayKey;
      });

    return (
      future.length
        ? future
        : filtered
    ).slice(0, 8);
  }

  function formatScheduleTime(event) {
    if (
      event &&
      event.allDay === true
    ) {
      return '終日';
    }

    const startTime =
      textOf(
        event && event.startTime
      );

    const endTime =
      textOf(
        event && event.endTime
      );

    if (
      startTime &&
      endTime
    ) {
      return startTime + '-' + endTime;
    }

    return startTime || endTime || '';
  }

  function createScheduleCard(
    events,
    player,
    schedule
  ) {
    const safeSchedule =
      objectOf(schedule);

    const normalizedEvents =
      normalizeScheduleEvents(
        events,
        player
      );

    const card =
      document.createElement(
        'section'
      );

    card.className =
      'schedule-card';

    const title =
      document.createElement(
        'h3'
      );

    title.className =
      'schedule-card-title';

    title.textContent =
      '予定';

    card.appendChild(
      title
    );

    const month =
      textOf(
        safeSchedule.month ||
        getCurrentMonthKey()
      );

    if (month) {
      const meta =
        document.createElement(
          'p'
        );

      meta.className =
        'schedule-meta';

      meta.textContent =
        month + ' の予定';

      card.appendChild(
        meta
      );
    }

    if (!normalizedEvents.length) {
      const empty =
        document.createElement(
          'p'
        );

      empty.className =
        'card-empty';

      empty.textContent =
        '表示できる予定はまだありません。';

      card.appendChild(
        empty
      );

      return card;
    }

    const list =
      document.createElement(
        'div'
      );

    list.className =
      'schedule-list';

    normalizedEvents.forEach(
      function(event) {
        const item =
          document.createElement(
            'article'
          );

        item.className =
          'schedule-item';

        const header =
          document.createElement(
            'div'
          );

        header.className =
          'schedule-item-header';

        const titleElement =
          document.createElement(
            'p'
          );

        titleElement.className =
          'schedule-title';

        titleElement.textContent =
          textOf(
            event.title ||
            event.type ||
            event.category ||
            '予定'
          );

        const dateElement =
          document.createElement(
            'p'
          );

        dateElement.className =
          'schedule-date';

        dateElement.textContent =
          textOf(event.date);

        header.appendChild(
          titleElement
        );

        if (dateElement.textContent) {
          header.appendChild(
            dateElement
          );
        }

        item.appendChild(
          header
        );

        const time =
          formatScheduleTime(event);

        if (time) {
          const timeElement =
            document.createElement(
              'p'
            );

          timeElement.className =
            'schedule-time';

          timeElement.textContent =
            time;

          item.appendChild(
            timeElement
          );
        }

        const noteText =
          [
            textOf(event.location),
            textOf(event.note)
          ].filter(Boolean).join(' / ');

        if (noteText) {
          const note =
            document.createElement(
              'p'
            );

          note.className =
            'schedule-note';

          note.textContent =
            noteText;

          item.appendChild(
            note
          );
        }

        list.appendChild(
          item
        );
      }
    );

    card.appendChild(
      list
    );

    return card;
  }

  function renderPlayerView(result) {
    if (!playerDetailPlaceholder) {
      return;
    }

    const data =
      payloadOf(result);

    const viewData =
      payloadOf(data);

    const player =
      objectOf(
        viewData.player
      );

    if (
      playerDetailName &&
      textOf(
        player.playerName ||
        player.name
      )
    ) {
      playerDetailName.textContent =
        textOf(
          player.playerName ||
          player.name
        );
    }

    if (
      playerDetailCategory &&
      textOf(player.category)
    ) {
      playerDetailCategory.textContent =
        textOf(player.category);
    }

    playerDetailPlaceholder.replaceChildren();

    playerDetailPlaceholder.appendChild(
      createShootingCard(
        extractShooting(
          viewData
        )
      )
    );

    playerDetailPlaceholder.appendChild(
      createGrowthCardFromRecords(
        extractGrowthRecords(
          viewData
        )
      )
    );

    playerDetailPlaceholder.appendChild(
      createAgilityCardFromRecords(
        extractAgilityRecords(
          viewData
        )
      )
    );

    playerDetailPlaceholder.appendChild(
      createFeedbackCardFromFeedback(
        extractFeedback(
          viewData
        )
      )
    );

    playerDetailPlaceholder.appendChild(
      createCoachAdviceCard(
        extractCoachAdviceRecords(
          viewData
        )
      )
    );

    playerDetailPlaceholder.appendChild(
      createScheduleCard(
        extractScheduleEvents(
          viewData
        ),
        player,
        objectOf(viewData.schedule)
      )
    );
  }

  async function getPlayerView(playerId) {
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
      textOf(playerId);

    if (!normalizedPlayerId) {
      throw new Error(
        '選手IDがありません。'
      );
    }

    return api.post(
      'guardian.playerView',
      {
        idToken:
          currentIdToken,

        playerId:
          normalizedPlayerId,

        month:
          getCurrentMonthKey(),

        limit:
          PLAYER_VIEW_LIMIT
      }
    );
  }

  async function loadPlayerDetailData(
    playerId
  ) {
    const normalizedPlayerId =
      textOf(playerId);

    setPlayerDetailMessage(
      '選手データを確認しています…'
    );

    try {
      const result =
        await getPlayerView(
          normalizedPlayerId
        );

      if (
        selectedPlayerId !==
        normalizedPlayerId
      ) {
        return;
      }

      renderPlayerView(
        result
      );

      console.info(
        '[NINJA Guardian Detail]',
        {
          success:
            true,

          action:
            'guardian.playerView',

          playerId:
            normalizedPlayerId,

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

      if (!playerDetailPlaceholder) {
        return;
      }

      playerDetailPlaceholder.replaceChildren();

      playerDetailPlaceholder.appendChild(
        createDetailErrorCard(
          '選手データ',
          error && error.message
            ? error.message
            : '選手データを取得できませんでした。'
        )
      );

      console.error(
        '[NINJA Guardian Detail]',
        error
      );
    }
  }

  function showPlayerDetail(player) {
    if (!player) {
      return;
    }

    selectedPlayerId =
      textOf(
        player.playerId
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
        textOf(
          player.category
        );
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
      textOf(
        player &&
        (
          player.playerName ||
          player.name
        )
      );

    const category =
      document.createElement(
        'p'
      );

    category.className =
      'player-category';

    category.textContent =
      textOf(
        player &&
        player.category
      );

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
          textOf(
            player &&
            (
              player.playerName ||
              player.name
            )
          );

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
