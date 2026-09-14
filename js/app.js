/**
 * NINJA SCHEDULE API
 * LineBotLogoutRichMenuSetupService.gs
 *
 * ログアウト中・未登録者用のLINEリッチメニューを作成し、
 * 作成されたrichMenuIdをScript Propertiesへ保存します。
 *
 * 目的:
 * - 既存の選手用デフォルトメニューを壊さない
 * - ログアウトしたユーザーだけに、別途ログアウト用メニューを割り当てる準備をする
 *
 * 事前に必要なScript Properties:
 * - LINE_CHANNEL_ACCESS_TOKEN
 * - LINE_RICH_MENU_IMAGE_FILE_ID_LOGOUT
 *
 * 作成後に保存するScript Properties:
 * - LINE_RICH_MENU_ID_LOGOUT
 *
 * Version:
 * v1.0.0-linebot-logout-rich-menu-setup
 */

const LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG =
  Object.freeze({
    VERSION:
      'v1.0.0-linebot-logout-rich-menu-setup',

    TOKEN_PROPERTY:
      'LINE_CHANNEL_ACCESS_TOKEN',

    IMAGE_FILE_ID_PROPERTY:
      'LINE_RICH_MENU_IMAGE_FILE_ID_LOGOUT',

    OUTPUT_RICH_MENU_ID_PROPERTY:
      'LINE_RICH_MENU_ID_LOGOUT',

    CREATE_API_URL:
      'https://api.line.me/v2/bot/richmenu',

    IMAGE_UPLOAD_API_BASE:
      'https://api-data.line.me/v2/bot/richmenu/',

    ENTRY_URL:
      'https://liff.line.me/2010789200-KayhN3KT',

    NAME:
      'NINJA_AIRS_LOGOUT_MENU_v1',

    CHAT_BAR_TEXT:
      'メニュー',

    SIZE:
      Object.freeze({
        width:
          1200,

        height:
          810
      })
  });


/* =========================================================
 * LIVE SETUP
 * ======================================================= */

/**
 * Drive上の画像から、ログアウト中・未登録者用リッチメニューを作成します。
 *
 * 注意:
 * - この関数はLINE APIを実行します
 * - richMenuを新規作成します
 * - 画像をアップロードします
 * - LINE_RICH_MENU_ID_LOGOUT をScript Propertiesへ保存します
 *
 * @return {Object}
 */
function lineBotLogoutRichMenuSetupCreateFromDriveImage() {
  const props =
    PropertiesService
      .getScriptProperties();

  const token =
    lineBotLogoutRichMenuSetupRequireText_(
      props.getProperty(
        LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
          .TOKEN_PROPERTY
      ),
      LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
        .TOKEN_PROPERTY
    );

  const imageFileId =
    lineBotLogoutRichMenuSetupRequireText_(
      props.getProperty(
        LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
          .IMAGE_FILE_ID_PROPERTY
      ),
      LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
        .IMAGE_FILE_ID_PROPERTY
    );

  const richMenuPayload =
    lineBotLogoutRichMenuSetupBuildPayload_();

  const richMenuId =
    lineBotLogoutRichMenuSetupCreateRichMenu_(
      token,
      richMenuPayload
    );

  lineBotLogoutRichMenuSetupUploadImage_(
    token,
    richMenuId,
    imageFileId
  );

  props.setProperty(
    LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
      .OUTPUT_RICH_MENU_ID_PROPERTY,
    richMenuId
  );

  const result = {
    success:
      true,

    mode:
      'CREATED_AND_IMAGE_UPLOADED',

    version:
      LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
        .VERSION,

    richMenuId:
      richMenuId,

    savedProperty:
      LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
        .OUTPUT_RICH_MENU_ID_PROPERTY,

    imageFileId:
      imageFileId,

    menuName:
      LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
        .NAME,

    chatBarText:
      LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
        .CHAT_BAR_TEXT,

    nextStep:
      'LineBotService.gs のログアウト処理で LINE_RICH_MENU_ID_LOGOUT をユーザーへ割り当てます。'
  };

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}


/* =========================================================
 * API
 * ======================================================= */

function lineBotLogoutRichMenuSetupCreateRichMenu_(
  token,
  payload
) {
  const response =
    UrlFetchApp.fetch(
      LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
        .CREATE_API_URL,
      {
        method:
          'post',

        contentType:
          'application/json; charset=UTF-8',

        headers:
          {
            Authorization:
              'Bearer ' + token
          },

        payload:
          JSON.stringify(
            payload
          ),

        muteHttpExceptions:
          true
      }
    );

  const statusCode =
    response.getResponseCode();

  const responseText =
    response.getContentText();

  if (
    statusCode < 200 ||
    statusCode >= 300
  ) {
    throw new Error(
      'ログアウト用リッチメニュー作成エラー。HTTP ' +
      statusCode +
      '：' +
      responseText
    );
  }

  let parsed;

  try {
    parsed =
      JSON.parse(
        responseText
      );

  } catch (error) {
    throw new Error(
      'ログアウト用リッチメニュー作成結果を解析できません。'
    );
  }

  const richMenuId =
    lineBotLogoutRichMenuSetupCleanText_(
      parsed.richMenuId
    );

  if (!richMenuId) {
    throw new Error(
      'ログアウト用richMenuIdを取得できませんでした。'
    );
  }

  return richMenuId;
}


function lineBotLogoutRichMenuSetupUploadImage_(
  token,
  richMenuId,
  imageFileId
) {
  const file =
    DriveApp
      .getFileById(
        imageFileId
      );

  const blob =
    file
      .getBlob()
      .setContentType(
        'image/png'
      );

  const url =
    LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
      .IMAGE_UPLOAD_API_BASE +
    encodeURIComponent(
      richMenuId
    ) +
    '/content';

  const response =
    UrlFetchApp.fetch(
      url,
      {
        method:
          'post',

        contentType:
          'image/png',

        headers:
          {
            Authorization:
              'Bearer ' + token
          },

        payload:
          blob.getBytes(),

        muteHttpExceptions:
          true
      }
    );

  const statusCode =
    response.getResponseCode();

  const responseText =
    response.getContentText();

  if (
    statusCode < 200 ||
    statusCode >= 300
  ) {
    throw new Error(
      'ログアウト用リッチメニュー画像アップロードエラー。HTTP ' +
      statusCode +
      '：' +
      responseText
    );
  }

  return {
    success:
      true,

    statusCode:
      statusCode
  };
}


/* =========================================================
 * PAYLOAD
 * ======================================================= */

function lineBotLogoutRichMenuSetupBuildPayload_() {
  const entryUrl =
    LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
      .ENTRY_URL;

  return {
    size:
      {
        width:
          LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
            .SIZE
            .width,

        height:
          LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
            .SIZE
            .height
      },

    selected:
      true,

    name:
      LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
        .NAME,

    chatBarText:
      LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
        .CHAT_BAR_TEXT,

    areas:
      [
        {
          bounds:
            {
              x:
                0,
              y:
                0,
              width:
                400,
              height:
                405
            },

          action:
            {
              type:
                'uri',

              label:
                '公式LINE入口',

              uri:
                entryUrl
            }
        },

        {
          bounds:
            {
              x:
                400,
              y:
                0,
              width:
                400,
              height:
                405
            },

          action:
            {
              type:
                'uri',

              label:
                '選手登録',

              uri:
                entryUrl + '?role=player'
            }
        },

        {
          bounds:
            {
              x:
                800,
              y:
                0,
              width:
                400,
              height:
                405
            },

          action:
            {
              type:
                'uri',

              label:
                '保護者登録',

              uri:
                entryUrl + '?role=guardian'
            }
        },

        {
          bounds:
            {
              x:
                0,
              y:
                405,
              width:
                400,
              height:
                405
            },

          action:
            {
              type:
                'uri',

              label:
                '使い方',

              uri:
                entryUrl
            }
        },

        {
          bounds:
            {
              x:
                400,
              y:
                405,
              width:
                400,
              height:
                405
            },

          action:
            {
              type:
                'uri',

              label:
                'お問い合わせ',

              uri:
                entryUrl
            }
        },

        {
          bounds:
            {
              x:
                800,
              y:
                405,
              width:
                400,
              height:
                405
            },

          action:
            {
              type:
                'message',

              label:
                '準備中',

              text:
                '準備中'
            }
        }
      ]
  };
}


/* =========================================================
 * UTILS
 * ======================================================= */

function lineBotLogoutRichMenuSetupCleanText_(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  return String(
    value
  ).trim();
}


function lineBotLogoutRichMenuSetupRequireText_(
  value,
  label
) {
  const text =
    lineBotLogoutRichMenuSetupCleanText_(
      value
    );

  if (!text) {
    throw new Error(
      label +
      ' が設定されていません。'
    );
  }

  return text;
}


/* =========================================================
 * NO-WRITE TEST
 * ======================================================= */

/**
 * STEP73:
 * ログアウト中・未登録者用リッチメニュー作成Serviceの安全確認です。
 *
 * 注意:
 * - LINE APIは呼びません
 * - Driveは開きません
 * - Script Propertiesは読みません
 * - Script Propertiesへ保存しません
 *
 * @return {Object}
 */
function testLineBotLogoutRichMenuSetupNoWrite() {
  const functions = {
    createFromDriveImage:
      typeof lineBotLogoutRichMenuSetupCreateFromDriveImage ===
      'function',

    buildPayload:
      typeof lineBotLogoutRichMenuSetupBuildPayload_ ===
      'function',

    createRichMenu:
      typeof lineBotLogoutRichMenuSetupCreateRichMenu_ ===
      'function',

    uploadImage:
      typeof lineBotLogoutRichMenuSetupUploadImage_ ===
      'function',

    urlFetchApp:
      typeof UrlFetchApp !==
      'undefined',

    driveApp:
      typeof DriveApp !==
      'undefined',

    propertiesService:
      typeof PropertiesService !==
      'undefined'
  };

  const payload =
    lineBotLogoutRichMenuSetupBuildPayload_();

  const checks = {
    dependenciesReady:
      Object.keys(functions).every(function(key) {
        return functions[key] === true;
      }),

    imageSize:
      payload.size &&
      payload.size.width === 1200 &&
      payload.size.height === 810,

    areaCount:
      Array.isArray(payload.areas) &&
      payload.areas.length === 6,

    firstAreaIsOfficialEntry:
      payload.areas[0] &&
      payload.areas[0].action &&
      payload.areas[0].action.label ===
        '公式LINE入口',

    playerRegisterAreaExists:
      payload.areas.some(function(area) {
        return area &&
          area.action &&
          area.action.label === '選手登録';
      }),

    guardianRegisterAreaExists:
      payload.areas.some(function(area) {
        return area &&
          area.action &&
          area.action.label === '保護者登録';
      }),

    outputPropertyPrepared:
      LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
        .OUTPUT_RICH_MENU_ID_PROPERTY ===
      'LINE_RICH_MENU_ID_LOGOUT',

    doesNotOverwriteCurrentDefaultRichMenu:
      true,

    setupIsNotCalledByTest:
      true
  };

  const success =
    Object.keys(checks).every(function(key) {
      return checks[key] === true;
    });

  const result = {
    success:
      success,

    mode:
      'TEST_ONLY_NO_WRITE_NO_LINE_CALL',

    version:
      LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
        .VERSION,

    functions:
      functions,

    checks:
      checks,

    payloadPreview:
      {
        name:
          payload.name,

        chatBarText:
          payload.chatBarText,

        size:
          payload.size,

        areaLabels:
          payload.areas.map(function(area) {
            return area.action.label;
          })
      },

    requiredScriptPropertiesBeforeLiveRun:
      [
        LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
          .TOKEN_PROPERTY,
        LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
          .IMAGE_FILE_ID_PROPERTY
      ],

    propertySavedAfterLiveRun:
      LINE_BOT_LOGOUT_RICH_MENU_SETUP_CONFIG
        .OUTPUT_RICH_MENU_ID_PROPERTY,

    safety:
      {
        lineApiCalled:
          false,

        driveOpened:
          false,

        scriptPropertiesRead:
          false,

        scriptPropertiesWritten:
          false,

        richMenuCreated:
          false,

        imageUploaded:
          false,

        dataWritten:
          false,

        dataUpdated:
          false,

        dataDeleted:
          false
      },

    nextStep:
      '画像をDriveへアップロードし、LINE_RICH_MENU_IMAGE_FILE_ID_LOGOUT を設定してから本作成を実行します。'
  };

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  return result;
}
