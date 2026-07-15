/**
 * 프로그램 팝업 관리
 *
 * 개발자 수정용 스크립트입니다.
 * - 주석 유지
 * - minify 금지 (Vite 번들 대상 아님, public/js 직접 로드)
 *
 * 사용법:
 *   ProgramPopup.open('verify');   // 인증 모달
 *   ProgramPopup.open('apply');    // 신청 폼
 *   ProgramPopup.open('success');  // 완료 확인
 *   ProgramPopup.open('detail');   // 프로그램 상세
 *   ProgramPopup.closeAll();
 */
(function () {
  'use strict';

  var ROOT_ID = 'programModalRoot';
  var ACTIVE_MODAL_CLASS = 'is-active';
  var ROOT_ACTIVE_CLASS = 'is-active';
  var BODY_LOCK_CLASS = 'is-modal-open';

  /** @type {string|null} */
  var currentModalName = null;

  /** @type {string[]} */
  var modalStack = [];

  /**
   * 모달 루트 요소 반환
   * @returns {HTMLElement|null}
   */
  function getRoot() {
    return document.getElementById(ROOT_ID);
  }

  /**
   * data-modal 값으로 패널 요소 찾기
   * @param {string} name
   * @returns {HTMLElement|null}
   */
  function getModalPanel(name) {
    var root = getRoot();
    if (!root) return null;
    return root.querySelector('[data-modal="' + name + '"]');
  }

  /**
   * 열린 모달 패널 비활성화
   */
  function hideAllPanels() {
    var root = getRoot();
    if (!root) return;

    var panels = root.querySelectorAll('[data-modal]');
    panels.forEach(function (panel) {
      panel.classList.remove(ACTIVE_MODAL_CLASS);
      panel.setAttribute('hidden', '');
    });
  }

  /**
   * 스크롤 잠금
   * @param {boolean} lock
   */
  function lockBody(lock) {
    document.body.classList.toggle(BODY_LOCK_CLASS, lock);
  }

  /**
   * 모달 열기
   * @param {string} name - verify | apply | success | detail
   * @param {{ stack?: boolean }} [options]
   */
  function openModal(name, options) {
    options = options || {};
    var root = getRoot();
    var panel = getModalPanel(name);

    if (!root || !panel) {
      console.warn('[ProgramPopup] 모달을 찾을 수 없습니다:', name);
      return;
    }

    // 상세 팝업 등 중첩 열기 시 이전 모달 유지
    if (options.stack && currentModalName) {
      modalStack.push(currentModalName);
    } else if (!options.stack) {
      modalStack = [];
    }

    hideAllPanels();

    root.removeAttribute('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.classList.add(ROOT_ACTIVE_CLASS);

    panel.removeAttribute('hidden');
    panel.classList.add(ACTIVE_MODAL_CLASS);

    currentModalName = name;
    lockBody(true);

    window.dispatchEvent(
      new CustomEvent('program-popup:open', { detail: { name: name } })
    );

    var focusable = panel.querySelector(
      'input:not([disabled]), button:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    );
    if (focusable) {
      focusable.focus();
    }
  }

  /**
   * 현재 모달 닫기 (스택이 있으면 이전 모달 복원)
   */
  function closeCurrent() {
    if (modalStack.length > 0) {
      var previous = modalStack.pop();
      openModal(previous, { stack: false });
      return;
    }

    closeAll();
  }

  /**
   * 특정 모달 닫기
   * @param {string} name
   */
  function closeModal(name) {
    var panel = getModalPanel(name);
    if (panel) {
      panel.classList.remove(ACTIVE_MODAL_CLASS);
      panel.setAttribute('hidden', '');
    }

    if (currentModalName === name) {
      currentModalName = null;
    }
  }

  /**
   * 모든 모달 닫기
   */
  function closeAll() {
    var root = getRoot();
    hideAllPanels();

    if (root) {
      root.setAttribute('hidden', '');
      root.setAttribute('aria-hidden', 'true');
      root.classList.remove(ROOT_ACTIVE_CLASS);
    }

    currentModalName = null;
    modalStack = [];
    lockBody(false);
  }

  /**
   * 닫기 트리거 바인딩
   * @param {HTMLElement} root
   */
  function bindCloseTriggers(root) {
    root.addEventListener('click', function (event) {
      var target = event.target;

      if (!(target instanceof Element)) return;

      // 백드롭 또는 data-modal-close 클릭
      if (
        target.matches('[data-modal-close]') ||
        target.closest('[data-modal-close]')
      ) {
        event.preventDefault();
        closeCurrent();
        return;
      }

      // 백드롭 직접 클릭
      if (target.classList.contains('program-modal-root__backdrop')) {
        closeCurrent();
      }
    });
  }

  /**
   * 열기 트리거 바인딩 (data-open-modal)
   */
  function bindOpenTriggers() {
    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;

      var trigger = target.closest('[data-open-modal]');
      if (!trigger) return;

      event.preventDefault();

      var modalName = trigger.getAttribute('data-open-modal');
      if (modalName) {
        openModal(modalName);
      }
    });
  }

  /**
   * ESC 키로 닫기
   */
  function bindEscapeKey() {
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && currentModalName) {
        closeCurrent();
      }
    });
  }

  /**
   * 초기화
   */
  function init() {
    var root = getRoot();
    if (!root) return;

    bindCloseTriggers(root);
    bindOpenTriggers();
    bindEscapeKey();
  }

  // 전역 API 노출 (program-form.js에서 사용)
  window.ProgramPopup = {
    open: openModal,
    close: closeModal,
    closeCurrent: closeCurrent,
    closeAll: closeAll,
    getCurrent: function () {
      return currentModalName;
    },
    init: init,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
