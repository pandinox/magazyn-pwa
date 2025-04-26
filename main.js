/* main.js */

// URL Twojego JSONP-enabled Web App
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx1QSi1E7UIpy7jy-niSHwaukjJ4OdXdU-5k6ybGnKgHJJgLuldNPOKKNcmvIfh9RMKuA/exec';

// JSONP helper
function jsonpCall(params) {
  return new Promise(resolve => {
    const cbName = 'cb_' + Math.random().toString(36).substr(2);
    window[cbName] = data => {
      delete window[cbName];
      script.remove();
      resolve(data);
    };
    const u = new URL(SCRIPT_URL);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    u.searchParams.set('callback', cbName);
    const script = document.createElement('script');
    script.src = u;
    document.body.appendChild(script);
  });
}

// Przełączanie widoków
function showView(id) {
  document.querySelectorAll('body > div').forEach(d => d.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// Główna logika po wczytaniu DOM
document.addEventListener('DOMContentLoaded', () => {
  // === USTAWIENIA ===
  const btnSettings         = document.getElementById('btnSettings');
  const btnBackFromSettings = document.getElementById('btnBackFromSettings');
  const settingsPassword    = document.getElementById('settingsPassword');
  const btnUnlock           = document.getElementById('btnUnlock');
  const settingsForm        = document.getElementById('settingsForm');
  const inputDeviceId       = document.getElementById('inputDeviceId');
  const inputToken1         = document.getElementById('inputToken1');
  const inputToken2         = document.getElementById('inputToken2');
  const btnSaveSettings     = document.getElementById('btnSaveSettings');
  const ADMIN_PASS          = 'TwojeSilneHaslo';

  btnSettings.onclick = () => showView('view-settings');
  btnBackFromSettings.onclick = () => showView('view-home');

  btnUnlock.onclick = () => {
    if (settingsPassword.value === ADMIN_PASS) {
      settingsPassword.value = '';
      settingsForm.classList.remove('hidden');
      btnUnlock.disabled = true;
    } else {
      alert('Błędne hasło');
    }
  };

  btnSaveSettings.onclick = () => {
    localStorage.deviceId = inputDeviceId.value;
    localStorage.token1   = inputToken1.value;
    localStorage.token2   = inputToken2.value;
    showView('view-home');
  };

  // === WYBÓR UŻYTKOWNIKA ===
  const btnSelectUser   = document.getElementById('btnSelectUser');
  const btnBackFromUser = document.getElementById('btnBackFromUser');
  const listUsers       = document.getElementById('listUsers');

  btnSelectUser.onclick = async () => {
    showView('view-user');
    const res = await jsonpCall({
      action:   'getUsers',
      deviceId: localStorage.deviceId,
      token1:   localStorage.token1,
      token2:   localStorage.token2
    });
    if (!res.success) return alert(res.error);
    listUsers.innerHTML = '';
    res.users.forEach(u => {
      const li = document.createElement('li');
      li.textContent = u;
      li.onclick = async () => {
        const setRes = await jsonpCall({
          action:   'setActiveUser',
          deviceId: localStorage.deviceId,
          token1:   localStorage.token1,
          token2:   localStorage.token2,
          user:     u
        });
        if (!setRes.success) return alert(setRes.error);
        localStorage.currentUser = u;
        document.getElementById('labelUser').textContent = u;
        showView('view-dashboard');
      };
      listUsers.appendChild(li);
    });
  };
  btnBackFromUser.onclick = () => showView('view-home');

  // === DASHBOARD ===
  const btnCheckLocation  = document.getElementById('btnCheckLocation');
  const btnChangeLocation = document.getElementById('btnChangeLocation');
  const btnSwitchUser     = document.getElementById('btnSwitchUser');

  btnCheckLocation.onclick  = () => showView('view-check');
  btnChangeLocation.onclick = () => showView('view-change');
  btnSwitchUser.onclick     = () => showView('view-user');

  // === SPRAWDŹ LOKACJĘ ===
  const btnCheckCode   = document.getElementById('btnCheckCode');
  const inputCheckCode = document.getElementById('inputCheckCode');
  const checkResult    = document.getElementById('checkResult');
  const btnRelocate    = document.getElementById('btnRelocate');

  document.querySelector('#view-check .btnBack').onclick = () => showView('view-dashboard');

  btnCheckCode.onclick = async () => {
    const res = await jsonpCall({
      action:   'checkLocation',
      deviceId: localStorage.deviceId,
      token1:   localStorage.token1,
      token2:   localStorage.token2,
      code:     inputCheckCode.value
    });
    if (!res.success) return alert(res.error);
    if (res.found) {
      checkResult.textContent = `Lokalizacja: ${res.location}`;
      btnRelocate.classList.remove('hidden');
    } else {
      checkResult.textContent = 'Brak produktu w bazie';
      btnRelocate.classList.add('hidden');
    }
  };

  // === PRZEŁÓŻ (zmiana lokalizacji natychmiast) ===
  btnRelocate.onclick = () => {
    showView('view-change');
    // od razu pokaż pole zmiany
    document.querySelector('#view-change > div:nth-child(2)').classList.add('hidden');
    document.getElementById('changePrompt').classList.add('hidden');
    document.getElementById('changeScanNew').classList.remove('hidden');
    // ustaw aktualną lokalizację i focus
    const loc = checkResult.textContent.replace('Lokalizacja: ', '');
    document.getElementById('currentLoc').textContent = `Aktualna lokalizacja: ${loc}`;
    const newInput = document.getElementById('inputNewLocation');
    newInput.value = '';
    newInput.focus();
  };

  // === ZMIEŃ LOKACJĘ (pełny flow) ===
  document.querySelector('#view-change .btnBack').onclick = () => showView('view-dashboard');
  const btnConfirmChange  = document.getElementById('btnConfirmChange');
  const btnSubmitChange   = document.getElementById('btnSubmitChange');

  btnConfirmChange.onclick = () => {
    document.getElementById('changePrompt').classList.add('hidden');
    document.getElementById('changeScanNew').classList.remove('hidden');
    document.getElementById('inputNewLocation').focus();
  };

  btnSubmitChange.onclick = async () => {
    const res = await jsonpCall({
      action:      'setLocation',
      deviceId:    localStorage.deviceId,
      token1:      localStorage.token1,
      token2:      localStorage.token2,
      code:        inputCheckCode.value,
      newLocation: document.getElementById('inputNewLocation').value
    });
    if (!res.success) return alert(res.error);
    alert('Zaktualizowano lokalizację');
    showView('view-dashboard');
  };

  // Start od ekranu głównego
  showView('view-home');
});
