document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var NIMBUS_CONTATO_URL =
    'https://nimbus-41468129589.us-central1.run.app/api/contact';

  (function () {
    var toc = document.querySelector('.doc-toc');
    var body = document.querySelector('.doc-body');
    if (!toc || !body) return;

    var links = {};
    toc.querySelectorAll('ul a[href^="#"]').forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      if (id) links[id] = a;
    });
    var targets = Object.keys(links)
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);
    if (!targets.length) return;

    var visible = [];
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var i = visible.indexOf(entry.target);
          if (entry.isIntersecting) {
            if (i < 0) visible.push(entry.target);
          } else if (i > -1) {
            visible.splice(i, 1);
          }
        });
        var current = visible.reduce(function (a, b) {
          return !a || b.offsetTop < a.offsetTop ? b : a;
        }, null);
        Object.keys(links).forEach(function (id) {
          var on = !!current && current.id === id;
          links[id].classList.toggle('active', on);
          if (on) links[id].setAttribute('aria-current', 'true');
          else links[id].removeAttribute('aria-current');
        });
      },
      { rootMargin: '-24% 0px -62% 0px' }
    );
    targets.forEach(function (t) {
      spy.observe(t);
    });

  })();

  (function () {
    var shell = document.getElementById('formShell');
    var form = document.getElementById('contactForm');
    if (!shell || !form) return;

    var submit = document.getElementById('formSubmit');
    var alertBox = document.getElementById('formAlert');
    var alertText = document.getElementById('formAlertText');
    var doneTitle = document.getElementById('doneTitle');
    var again = document.getElementById('formAgain');
    var phone = document.getElementById('telefone');
    var sending = false;

    var rules = {
      nome: {
        test: function (v) {
          return v.trim().length >= 2;
        },
        message: 'Informe o seu nome.',
      },
      telefone: {
        test: function (v) {
          var d = v.replace(/\D/g, '');
          return d.length === 10 || d.length === 11;
        },
        message: 'Informe um telefone com DDD.',
      },
      email: {
        test: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
        },
        message: 'Informe um e-mail válido.',
      },
      mensagem: {
        test: function (v) {
          return v.trim().length >= 10;
        },
        message: 'Escreva ao menos uma frase sobre o que você precisa.',
      },
    };

    function maskPhone(value) {
      var d = value.replace(/\D/g, '').slice(0, 11);
      if (!d) return '';
      var out = '(' + d.slice(0, 2);
      if (d.length < 3) return out;
      var mid = d.length > 10 ? 5 : 4;
      out += ') ' + d.slice(2, 2 + mid);
      if (d.length > 2 + mid) out += '-' + d.slice(2 + mid);
      return out;
    }

    if (phone) {
      phone.addEventListener('input', function () {
        var atEnd = phone.selectionStart === phone.value.length;
        phone.value = maskPhone(phone.value);
        if (atEnd) phone.setSelectionRange(phone.value.length, phone.value.length);
      });
    }

    function mark(name, message) {
      var field = document.getElementById(
        'field' + name.charAt(0).toUpperCase() + name.slice(1)
      );
      var input = document.getElementById(name);
      var slot = document.getElementById(
        'err' + name.charAt(0).toUpperCase() + name.slice(1)
      );
      if (!field || !input || !slot) return;
      field.classList.toggle('has-error', !!message);
      slot.textContent = message || '';
      if (message) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', slot.id);
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
    }

    Object.keys(rules).forEach(function (name) {
      var input = document.getElementById(name);
      if (!input) return;
      input.addEventListener('blur', function () {
        if (input.value) mark(name, rules[name].test(input.value) ? '' : rules[name].message);
      });
      input.addEventListener('input', function () {
        if (rules[name].test(input.value)) mark(name, '');
      });
    });

    function showAlert(message) {
      if (!alertBox || !alertText) return;
      alertText.textContent = message;
      alertBox.classList.toggle('is-on', !!message);
    }

    function setBusy(state) {
      sending = state;
      if (submit) submit.setAttribute('aria-busy', String(state));
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      showAlert('');

      var first = null;
      Object.keys(rules).forEach(function (name) {
        var input = document.getElementById(name);
        if (!input) return;
        var ok = rules[name].test(input.value);
        mark(name, ok ? '' : rules[name].message);
        if (!ok && !first) first = input;
      });
      if (first) {
        first.focus();
        return;
      }

      var honeypot = document.getElementById('site');
      var payload = {
        nome: document.getElementById('nome').value.trim(),
        telefone: document.getElementById('telefone').value.trim(),
        email: document.getElementById('email').value.trim(),
        mensagem: document.getElementById('mensagem').value.trim(),
        origem: 'landing:contato',
      };

      if (honeypot && honeypot.value) {
        succeed();
        return;
      }

      setBusy(true);

      fetch(NIMBUS_CONTATO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          if (!res.ok) throw new Error(String(res.status));
          setBusy(false);
          succeed();
        })
        .catch(function (err) {
          setBusy(false);
          showAlert(
            err && err.message === '429'
              ? 'Você já enviou uma mensagem na última hora. Recebemos seu contato e vamos responder em breve.'
              : 'Não conseguimos enviar sua mensagem agora. Tente de novo em instantes.'
          );
        });
    });

    function succeed() {
      shell.classList.add('is-sent');
      if (doneTitle)
        requestAnimationFrame(function () {
          doneTitle.focus();
        });
    }

    if (again) {
      again.addEventListener('click', function () {
        shell.classList.remove('is-sent');
        form.reset();
        Object.keys(rules).forEach(function (name) {
          mark(name, '');
        });
        showAlert('');
        var nome = document.getElementById('nome');
        if (nome) nome.focus();
      });
    }
  })();
});
