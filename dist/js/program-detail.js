/**
 * 오후 프로그램 상세 모달
 *
 * 개발자 수정용 스크립트입니다.
 * - minify 금지 (Vite 번들 대상 아님, public/js 직접 로드)
 * - 의존: program-popup.js, program-data.js
 *
 * 호출 방법
 * 1) 카드 클릭 → data-program-id 로 PROGRAM_DETAILS 조회
 * 2) ProgramDetail.openById('p-1300-ai')
 * 3) [data-open-program-detail] + data-time/title/desc/speakers 속성 (신청 모달 등)
 *
 * 채워지는 DOM
 * - #detailTime
 * - #programModalDetailTitle
 * - #detailDesc  (HTML 허용: <br> 등)
 * - #detailSpeakers
 */
(function () {
  'use strict';

  /**
   * @param {string} value
   * @returns {boolean}
   */
  function hasValue(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * data-speakers="이름|회사,이름2|회사2" 파싱
   * @param {string} raw
   * @returns {Array<{name: string, org: string}>}
   */
  function parseSpeakersAttr(raw) {
    if (!hasValue(raw)) return [];

    return raw.split(',').map(function (entry) {
      var parts = entry.split('|');
      return {
        name: (parts[0] || '').trim(),
        org: (parts[1] || '').trim(),
      };
    });
  }

  /**
   * 상세 모달 필드 채우기
   * @param {{
   *   time?: string,
   *   title?: string,
   *   desc?: string,
   *   speakers?: Array<{name: string, org: string}>
   * }} data
   */
  function fill(data) {
    var timeEl = document.getElementById('detailTime');
    var titleEl = document.getElementById('programModalDetailTitle');
    var descEl = document.getElementById('detailDesc');
    var speakersEl = document.getElementById('detailSpeakers');

    if (timeEl) timeEl.textContent = data.time || '';
    if (titleEl) titleEl.textContent = data.title || '';

    // desc 는 <br> 등 HTML 허용 (program-data.js 관리 콘텐츠)
    if (descEl) descEl.innerHTML = data.desc || '';

    if (speakersEl) {
      speakersEl.innerHTML = '';
      var speakers = Array.isArray(data.speakers) ? data.speakers : [];

      speakers.forEach(function (speaker) {
        var wrap = document.createElement('div');
        wrap.className = 'program-modal-detail__speaker';

        var name = document.createElement('span');
        name.className = 'program-modal-detail__speaker-name';
        name.textContent = speaker.name || '';

        var sep = document.createElement('span');
        sep.className = 'program-modal-detail__speaker-sep';
        sep.setAttribute('aria-hidden', 'true');

        var org = document.createElement('span');
        org.className = 'program-modal-detail__speaker-org';
        org.textContent = speaker.org || '';

        wrap.appendChild(name);
        wrap.appendChild(sep);
        wrap.appendChild(org);
        speakersEl.appendChild(wrap);
      });
    }
  }

  /**
   * 상세 모달 열기
   * @param {{
   *   time?: string,
   *   title?: string,
   *   desc?: string,
   *   speakers?: Array<{name: string, org: string}>
   * }} data
   * @param {{ stack?: boolean }} [options]
   */
  function open(data, options) {
    fill(data || {});

    if (!window.ProgramPopup) return;

    var opts = options || {};
    var shouldStack =
      typeof opts.stack === 'boolean'
        ? opts.stack
        : window.ProgramPopup.getCurrent() === 'apply';

    window.ProgramPopup.open('detail', { stack: shouldStack });
  }

  /**
   * program-data.js 의 id 로 열기
   * @param {string} programId
   * @param {{ stack?: boolean }} [options]
   * @returns {boolean}
   */
  function openById(programId, options) {
    var catalog = window.PROGRAM_DETAILS || {};
    var data = catalog[programId];

    if (!data) {
      console.warn('[ProgramDetail] 데이터 없음:', programId);
      return false;
    }

    open(data, options);
    return true;
  }

  /**
   * data-open-program-detail 트리거에서 열기
   * @param {HTMLElement} trigger
   * @param {{ stack?: boolean }} [options]
   */
  function openFromTrigger(trigger, options) {
    var programId = trigger.getAttribute('data-program-id') || '';

    if (programId && openById(programId, options)) return;

    open(
      {
        time: trigger.getAttribute('data-time') || '',
        title: trigger.getAttribute('data-title') || '',
        desc: trigger.getAttribute('data-desc') || '',
        speakers: parseSpeakersAttr(trigger.getAttribute('data-speakers') || ''),
      },
      options
    );
  }

  /**
   * 체크박스/라벨 클릭은 상세 오픈에서 제외
   * @param {Element} target
   * @returns {boolean}
   */
  function isCheckControl(target) {
    return Boolean(target.closest('.program-check, .program-check__input, label.program-check'));
  }

  function onClick(event) {
    var target = event.target;
    if (!(target instanceof Element)) return;

    // 신청 모달 등: data-open-program-detail
    var attrTrigger = target.closest('[data-open-program-detail]');
    if (attrTrigger) {
      event.preventDefault();
      openFromTrigger(attrTrigger);
      return;
    }

    // 오후 카드(갤러리/목록): 카드 영역 클릭 → 상세
    if (isCheckControl(target)) return;

    var card = target.closest(
      '.program-gallery .program-card[data-program-id], .program-list .program-list-card[data-program-id]'
    );
    if (!card) return;

    var programId = card.getAttribute('data-program-id') || '';
    if (!programId) return;

    event.preventDefault();
    openById(programId);
  }

  function init() {
    document.addEventListener('click', onClick);
  }

  window.ProgramDetail = {
    fill: fill,
    open: open,
    openById: openById,
    openFromTrigger: openFromTrigger,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
