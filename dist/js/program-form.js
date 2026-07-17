/**
 * 프로그램 참가신청 폼 로직
 *
 * 개발자 수정용 스크립트입니다.
 * - 주석 유지
 * - minify 금지 (Vite 번들 대상 아님, public/js 직접 로드)
 *
 * 의존: program-popup.js (ProgramPopup 전역 객체)
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 유틸
  // ---------------------------------------------------------------------------

  /**
   * 문자열 공백 제거 후 값 존재 여부
   * @param {string} value
   * @returns {boolean}
   */
  function hasValue(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * 연락처 형식 간단 검증 (숫자 10~11자리)
   * @param {string} phone
   * @returns {boolean}
   */
  function isValidPhone(phone) {
    var digits = phone.replace(/[^\d]/g, '');
    return digits.length >= 10 && digits.length <= 11;
  }

  /**
   * 이메일 형식 간단 검증
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ---------------------------------------------------------------------------
  // 인증 모달 (404-2293)
  // ---------------------------------------------------------------------------

  /** @type {boolean} */
  var verifyAuthCompleted = false;

  /**
   * 인증 모달 확인하기 버튼 활성화 상태 갱신
   */
  function updateVerifyConfirmButton() {
    var nameInput = document.getElementById('verifyName');
    var phoneInput = document.getElementById('verifyPhone');
    var confirmBtn = document.getElementById('verifyConfirmBtn');

    if (!nameInput || !phoneInput || !confirmBtn) return;

    var isReady =
      hasValue(nameInput.value) &&
      isValidPhone(phoneInput.value) &&
      verifyAuthCompleted;

    confirmBtn.disabled = !isReady;
  }

  /**
   * 인증번호 받기 버튼 활성화 상태 갱신
   */
  function updateVerifyAuthButton() {
    var phoneInput = document.getElementById('verifyPhone');
    var authBtn = document.getElementById('verifyAuthBtn');

    if (!phoneInput || !authBtn) return;

    var canRequest = hasValue(phoneInput.value) && isValidPhone(phoneInput.value);
    authBtn.disabled = !canRequest;

    if (canRequest) {
      authBtn.classList.add('is-ready');
    } else {
      authBtn.classList.remove('is-ready');
    }
  }

  /**
   * 인증 모달 상태 초기화
   */
  function resetVerifyForm() {
    verifyAuthCompleted = false;

    var nameInput = document.getElementById('verifyName');
    var phoneInput = document.getElementById('verifyPhone');
    var authBtn = document.getElementById('verifyAuthBtn');

    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (authBtn) {
      authBtn.disabled = true;
      authBtn.classList.remove('is-ready');
    }

    updateVerifyAuthButton();
    updateVerifyConfirmButton();
  }

  /**
   * 인증 모달 초기화
   */
  function initVerifyForm() {
    var form = document.getElementById('programVerifyForm');
    var nameInput = document.getElementById('verifyName');
    var phoneInput = document.getElementById('verifyPhone');
    var authBtn = document.getElementById('verifyAuthBtn');
    var confirmBtn = document.getElementById('verifyConfirmBtn');

    if (!form || !nameInput || !phoneInput || !authBtn || !confirmBtn) return;

    // 입력 변경 시 버튼 상태 갱신
    nameInput.addEventListener('input', updateVerifyConfirmButton);
    phoneInput.addEventListener('input', function () {
      verifyAuthCompleted = false;
      updateVerifyAuthButton();
      updateVerifyConfirmButton();
    });

    // 인증번호 받기 (개발 연동 전 목업)
    authBtn.addEventListener('click', function () {
      if (authBtn.disabled) return;

      // TODO: 실제 SMS 인증 API 연동
      verifyAuthCompleted = true;

      authBtn.disabled = true;
      authBtn.classList.remove('is-ready');

      updateVerifyConfirmButton();
    });

    // 확인하기 → 신청 폼 모달로 전환
    confirmBtn.addEventListener('click', function () {
      if (confirmBtn.disabled) return;

      // 신청 폼에 인증 정보 전달
      var applyName = document.getElementById('applyName');
      var applyPhone = document.getElementById('applyPhone');
      var applyPhoneVerified = document.getElementById('applyPhoneVerified');

      if (applyName) applyName.value = nameInput.value.trim();
      if (applyPhone) applyPhone.value = phoneInput.value.trim();
      if (applyPhoneVerified) applyPhoneVerified.hidden = false;

      if (window.ProgramPopup) {
        window.ProgramPopup.close('verify');
        window.ProgramPopup.open('apply');
      }

      updateApplySubmitButton();
    });

    updateVerifyAuthButton();
    updateVerifyConfirmButton();
  }

  // ---------------------------------------------------------------------------
  // 신청 폼 모달 (470-456)
  // ---------------------------------------------------------------------------

  /**
   * 점심식사 신청 라디오 값
   * @returns {'yes'|'no'|''}
   */
  function getLunchSelection() {
    var yes = document.getElementById('applyLunchYes');
    var no = document.getElementById('applyLunchNo');

    if (yes && yes.checked) return 'yes';
    if (no && no.checked) return 'no';
    return '';
  }

  /**
   * 신청하기 버튼 활성화 상태 갱신
   */
  function updateApplySubmitButton() {
    var submitBtn = document.getElementById('applySubmitBtn');
    if (!submitBtn) return;

    var fields = {
      name: document.getElementById('applyName'),
      phone: document.getElementById('applyPhone'),
      company: document.getElementById('applyCompany'),
      jobType: document.getElementById('applyJobType'),
      address: document.getElementById('applyAddress'),
      addressDetail: document.getElementById('applyAddressDetail'),
      department: document.getElementById('applyDepartment'),
      position: document.getElementById('applyPosition'),
      email: document.getElementById('applyEmail'),
      privacy: document.getElementById('applyPrivacy'),
    };

    var allFilled =
      fields.name &&
      hasValue(fields.name.value) &&
      fields.phone &&
      hasValue(fields.phone.value) &&
      isValidPhone(fields.phone.value) &&
      fields.company &&
      hasValue(fields.company.value) &&
      fields.jobType &&
      hasValue(fields.jobType.value) &&
      fields.address &&
      hasValue(fields.address.value) &&
      fields.addressDetail &&
      hasValue(fields.addressDetail.value) &&
      fields.department &&
      hasValue(fields.department.value) &&
      fields.position &&
      hasValue(fields.position.value) &&
      fields.email &&
      hasValue(fields.email.value) &&
      isValidEmail(fields.email.value) &&
      fields.privacy &&
      fields.privacy.checked &&
      getLunchSelection() !== '';

    submitBtn.disabled = !allFilled;
  }

  /**
   * 개인정보 내용보기 토글
   */
  function initPrivacyToggle() {
    var toggleBtn = document.getElementById('applyPrivacyToggle');
    var detail = document.getElementById('applyPrivacyDetail');

    if (!toggleBtn || !detail) return;

    toggleBtn.addEventListener('click', function () {
      var isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      var nextState = !isExpanded;

      toggleBtn.setAttribute('aria-expanded', String(nextState));
      detail.hidden = !nextState;
    });
  }

  /**
   * 주소찾기 버튼 (개발 연동 전 목업)
   */
  function initAddressSearch() {
    var addressBtn = document.getElementById('applyAddressBtn');
    var addressInput = document.getElementById('applyAddress');

    if (!addressBtn || !addressInput) return;

    addressBtn.addEventListener('click', function () {
      // TODO: 다음/카카오 주소 API 연동
      addressInput.value = '서울특별시 송파구';
      addressInput.removeAttribute('readonly');
      updateApplySubmitButton();
    });
  }

  /**
   * 신청 프로그램 삭제
   */
  function initProgramRemove() {
    var list = document.getElementById('applyProgramList');
    var countEl = document.getElementById('applyProgramCount');

    if (!list) return;

    list.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;

      var removeBtn = target.closest('.program-modal-apply__remove');
      if (!removeBtn) return;

      var item = removeBtn.closest('.program-modal-apply__program-item');
      if (item) {
        item.remove();
      }

      var remaining = list.querySelectorAll('.program-modal-apply__program-item').length;
      if (countEl) {
        countEl.textContent = String(remaining);
      }
    });
  }

  /**
   * 완료 모달 세션 목록 렌더링
   */
  function renderSuccessSessions() {
    var list = document.getElementById('applyProgramList');
    var successList = document.getElementById('successSessionList');
    var lunchMsg = document.getElementById('successLunchMsg');

    if (!list || !successList) return;

    successList.innerHTML = '';

    var items = list.querySelectorAll('.program-modal-apply__program-item');
    items.forEach(function (item) {
      var tags = item.querySelectorAll('.program-modal-apply__tag');
      var titleBtn = item.querySelector('.program-modal-apply__program-title');

      var li = document.createElement('li');
      li.className = 'program-modal-success__session';

      var tagsWrap = document.createElement('div');
      tagsWrap.className = 'program-modal-success__session-tags';

      tags.forEach(function (tag) {
        var span = document.createElement('span');
        span.className = 'program-modal-success__session-tag';
        span.textContent = tag.textContent;
        tagsWrap.appendChild(span);
      });

      var title = document.createElement('p');
      title.className = 'program-modal-success__session-title';
      title.textContent = titleBtn ? titleBtn.textContent.trim() : '';

      li.appendChild(tagsWrap);
      li.appendChild(title);
      successList.appendChild(li);
    });

    if (lunchMsg) {
      lunchMsg.hidden = getLunchSelection() !== 'yes';
    }
  }

  /**
   * 신청 폼 초기화
   */
  function initApplyForm() {
    var form = document.getElementById('programApplyForm');
    if (!form) return;

    var inputs = form.querySelectorAll('input, select');
    inputs.forEach(function (input) {
      input.addEventListener('input', updateApplySubmitButton);
      input.addEventListener('change', updateApplySubmitButton);
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var submitBtn = document.getElementById('applySubmitBtn');
      if (!submitBtn || submitBtn.disabled) return;

      renderSuccessSessions();

      if (window.ProgramPopup) {
        window.ProgramPopup.close('apply');
        window.ProgramPopup.open('success');
      }
    });

    initPrivacyToggle();
    initAddressSearch();
    initProgramRemove();
    updateApplySubmitButton();
  }

  // ---------------------------------------------------------------------------
  // 초기화
  // (프로그램 상세: program-detail.js / 시간대 선택: program-select.js)
  // ---------------------------------------------------------------------------

  function init() {
    initVerifyForm();
    initApplyForm();

    window.addEventListener('program-popup:open', function (event) {
      if (event.detail && event.detail.name === 'verify') {
        resetVerifyForm();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
