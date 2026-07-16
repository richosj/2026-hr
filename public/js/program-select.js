/**
 * 오후 프로그램 — 시간대별 1개만 선택
 *
 * 개발자 수정용 스크립트입니다.
 * - minify 금지 (Vite 번들 대상 아님, public/js 직접 로드)
 *
 * 규칙
 * 1. 같은 data-slot 안에서는 checkbox 1개만 체크
 * 2. 갤러리(.program-card) / 목록(.program-list-card)은
 *    같은 data-program-id 로 선택 상태를 동기화
 *
 * HTML 필요 속성
 * - article: data-program-id, data-slot
 * - input.program-check__input: data-program-id, data-slot
 */
(function () {
  'use strict';

  var SELECTOR = '.program-gallery .program-check__input, .program-list .program-check__input';

  /**
   * 같은 프로그램 ID 의 모든 체크박스 동기화
   * @param {string} programId
   * @param {boolean} checked
   * @param {HTMLInputElement} [except]
   */
  function syncByProgramId(programId, checked, except) {
    if (!programId) return;

    document.querySelectorAll(SELECTOR).forEach(function (input) {
      if (!(input instanceof HTMLInputElement)) return;
      if (input === except) return;
      if (input.getAttribute('data-program-id') !== programId) return;

      input.checked = checked;
      syncCardSelected(input);
    });
  }

  /**
   * 같은 시간대에서 다른 선택 해제 (+ 목록/갤러리 동기화)
   * @param {string} slot
   * @param {string} keepProgramId
   */
  function clearOthersInSlot(slot, keepProgramId) {
    if (!slot) return;

    document.querySelectorAll(SELECTOR).forEach(function (input) {
      if (!(input instanceof HTMLInputElement)) return;
      if (input.getAttribute('data-slot') !== slot) return;

      var programId = input.getAttribute('data-program-id') || '';
      if (programId === keepProgramId) return;

      if (input.checked) {
        input.checked = false;
        syncCardSelected(input);
        syncByProgramId(programId, false, input);
      }
    });
  }

  /**
   * 카드 selected 표시용 class (선택 시 UI 확장에 사용)
   * @param {HTMLInputElement} input
   */
  function syncCardSelected(input) {
    var card = input.closest('.program-card, .program-list-card');
    if (!card) return;
    card.classList.toggle('is-selected', input.checked);
  }

  /**
   * @param {Event} event
   */
  function onChange(event) {
    var target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!target.matches(SELECTOR)) return;

    var programId = target.getAttribute('data-program-id') || '';
    var slot = target.getAttribute('data-slot') || '';
    var card = target.closest('.program-card, .program-list-card');
    var isClosed =
      target.disabled ||
      (card && (card.hasAttribute('data-closed') || card.classList.contains('program-card--closed') || card.classList.contains('program-list-card--closed')));

    // 마감 세션은 선택 불가
    if (isClosed) {
      target.checked = false;
      syncByProgramId(programId, false, target);
      syncCardSelected(target);
      return;
    }

    if (target.checked) {
      clearOthersInSlot(slot, programId);
      syncByProgramId(programId, true, target);
    } else {
      syncByProgramId(programId, false, target);
    }

    syncCardSelected(target);

    window.dispatchEvent(
      new CustomEvent('program-select:change', {
        detail: {
          programId: programId,
          slot: slot,
          checked: target.checked,
          selected: getSelectedPrograms(),
        },
      })
    );
  }

  /**
   * 현재 선택된 프로그램 목록 (slot 당 최대 1개)
   * @returns {Array<{ programId: string, slot: string }>}
   */
  function getSelectedPrograms() {
    var seen = {};
    var result = [];

    document.querySelectorAll(SELECTOR).forEach(function (input) {
      if (!(input instanceof HTMLInputElement) || !input.checked) return;

      var programId = input.getAttribute('data-program-id') || '';
      var slot = input.getAttribute('data-slot') || '';
      if (!programId || seen[programId]) return;

      seen[programId] = true;
      result.push({ programId: programId, slot: slot });
    });

    return result;
  }

  function init() {
    document.querySelectorAll(SELECTOR).forEach(function (input) {
      if (input instanceof HTMLInputElement) {
        syncCardSelected(input);
      }
    });

    document.addEventListener('change', onChange);
  }

  window.ProgramSelect = {
    getSelected: getSelectedPrograms,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
