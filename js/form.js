/* ========================================
   STUDIO 82 — Multi-step Form
   ======================================== */

(function () {
    'use strict';

    var API_URL = 'https://s82.app/consultancy';

    var overlay      = document.getElementById('formOverlay');
    var track        = document.getElementById('formTrack');
    var bar          = document.getElementById('progressBar');
    var indicator    = document.getElementById('formIndicator');
    var footer       = document.getElementById('formFooter');
    var btnBack      = document.getElementById('btnBack');
    var btnNext      = document.getElementById('btnNext');
    var openBtn      = document.getElementById('openForm');
    var closeBtn     = document.getElementById('formClose');
    var confirmClose = document.getElementById('confirmClose');
    var reviewList   = document.getElementById('reviewList');

    var INPUT_STEPS = 4;
    var REVIEW      = 4;
    var CONFIRM     = 5;
    var current     = 0;

    var fields = {
        0: document.getElementById('fEmail'),
        1: document.getElementById('fAboutYou'),
        2: document.getElementById('fBusiness'),
        3: document.getElementById('fProblem')
    };

    var labels = {
        0: 'Email',
        1: 'About You',
        2: 'Your Business',
        3: 'The Problem'
    };

    /* ── Textarea auto-resize ──────────── */
    var MAX_TA_HEIGHT = 220;

    function autoResize(el) {
        el.style.height = 'auto';
        var h = el.scrollHeight;
        if (h > MAX_TA_HEIGHT) {
            el.style.height = MAX_TA_HEIGHT + 'px';
            el.style.overflowY = 'auto';
        } else {
            el.style.height = h + 'px';
            el.style.overflowY = 'hidden';
        }
    }

    document.querySelectorAll('.slide-textarea').forEach(function (ta) {
        ta.addEventListener('input', function () { autoResize(this); });
    });

    /* ── Navigation ────────────────────── */
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function goTo(step) {
        current = step;
        track.style.transform = 'translateX(-' + (step * 100) + '%)';

        if (step <= INPUT_STEPS) {
            bar.style.width = (Math.min(step + 1, INPUT_STEPS) / INPUT_STEPS * 100) + '%';
        } else {
            bar.style.width = '100%';
        }

        if (step < INPUT_STEPS) {
            indicator.textContent = pad(step + 1) + ' / ' + pad(INPUT_STEPS);
        } else if (step === REVIEW) {
            indicator.textContent = 'REVIEW';
        } else {
            indicator.textContent = '';
        }

        if (step === CONFIRM) {
            footer.style.display = 'none';
        } else {
            footer.style.display = '';
            btnBack.style.visibility = step === 0 ? 'hidden' : 'visible';

            if (step === REVIEW) {
                btnNext.innerHTML = 'SUBMIT';
            } else if (step === INPUT_STEPS - 1) {
                btnNext.innerHTML = 'REVIEW';
            } else {
                btnNext.innerHTML = 'NEXT';
            }
        }

        if (step === REVIEW) {
            populateReview();
        }

        var f = fields[step];
        if (f) {
            setTimeout(function () {
                f.focus();
                if (f.tagName === 'TEXTAREA') autoResize(f);
            }, 400);
        }
    }

    /* ── Populate review ───────────────── */
    function populateReview() {
        reviewList.innerHTML = '';
        for (var i = 0; i < INPUT_STEPS; i++) {
            var val = fields[i].value.trim();
            var item = document.createElement('div');
            item.className = 'review-item';

            var head = document.createElement('div');
            head.className = 'review-item-head';

            var label = document.createElement('span');
            label.className = 'review-label';
            label.textContent = labels[i];

            var edit = document.createElement('button');
            edit.className = 'review-edit';
            edit.textContent = 'EDIT';
            edit.type = 'button';
            edit.setAttribute('data-step', i);
            edit.addEventListener('click', function () {
                goTo(parseInt(this.getAttribute('data-step')));
            });

            head.appendChild(label);
            head.appendChild(edit);

            var value = document.createElement('p');
            value.className = 'review-value';
            value.textContent = val || '\u2014';

            item.appendChild(head);
            item.appendChild(value);
            reviewList.appendChild(item);
        }
    }

    /* ── Open / Close ──────────────────── */
    function open() {
        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';
        goTo(0);
        if (fields[0]) setTimeout(function () { fields[0].focus(); }, 500);
    }

    function close() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    /* ── Validation ────────────────────── */
    function validate(step) {
        var f = fields[step];
        if (!f) return true;
        var v = f.value.trim();
        if (!v) {
            f.classList.add('field-error');
            setTimeout(function () { f.classList.remove('field-error'); }, 600);
            return false;
        }
        if (step === 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
            f.classList.add('field-error');
            setTimeout(function () { f.classList.remove('field-error'); }, 600);
            return false;
        }
        return true;
    }

    /* ── Submit ─────────────────────────── */
    function submit() {
        var data = {
            email:         fields[0].value.trim(),
            aboutYou:      fields[1].value.trim(),
            aboutBusiness: fields[2].value.trim(),
            aboutProblem:  fields[3].value.trim()
        };

        fetch(API_URL + '/api/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).catch(function (err) {
            console.error('Submission failed:', err);
        });

        goTo(CONFIRM);
    }

    /* ── Events ─────────────────────────── */
    if (openBtn)  openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);

    if (confirmClose) confirmClose.addEventListener('click', function () {
        close();
        Object.keys(fields).forEach(function (k) {
            if (fields[k]) fields[k].value = '';
        });
    });

    if (btnNext) btnNext.addEventListener('click', function () {
        if (current < INPUT_STEPS && !validate(current)) return;
        if (current === REVIEW) {
            submit();
        } else if (current < REVIEW) {
            goTo(current + 1);
        }
    });

    if (btnBack) btnBack.addEventListener('click', function () {
        if (current > 0) goTo(current - 1);
    });

    document.addEventListener('keydown', function (e) {
        if (!overlay.classList.contains('open')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'Enter' && current === 0) {
            e.preventDefault();
            if (validate(0)) goTo(1);
        }
    });
})();
