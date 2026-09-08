'use strict';

(function bootstrapGuardianApp() {
  const config = window.NINJA_GUARDIAN_CONFIG;
  const status = document.getElementById('app-status');

  if (!config || !config.API_URL) {
    if (status) {
      status.textContent = '設定を読み込めませんでした。';
    }
    console.error('NINJA_GUARDIAN_CONFIG is missing.');
    return;
  }

  if (status) {
    status.textContent = '起動準備完了';
  }

  console.info(
    '[NINJA Guardian]',
    config.APP_VERSION
  );
})();
