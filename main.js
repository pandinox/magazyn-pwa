/* main.js */

// URL Twojego JSONP-enabled Web App\ n
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzfIeWTvsnr9VlTMyNgfSlF4ptdodfS2R1i-j1crVL65phQtOFwUxHAZi29ndcLe6oMwA/exec';

// JSONP helper\ function jsonpCall(params) {
  return new Promise(resolve => {
    const cbName = 'cb_' + Math.random().toString(36).substr(2);
    window[cbName] = data => {
      delete window[cbName];
      const s = document.getElementById(cbName);
      if (s) document.body.removeChild(s);
      resolve(data);
    };
    const url = new URL(SCRIPT_URL);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set('callback', cbName);
    const script = document.createElement('script');
    script.src = url;
    script.id = cbName;
    document.body.appendChild(script);
  });
}

// Switch views
function showView(id) {
  document.querySelectorAll('body > div').forEach(el => el.classList.add('hidden'));
  const view = document.getElementById(id);
  if (view) view.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  let currentCode = '';
  let currentSymbol = '';
  let lastHistory = [];

  // Elements
  const btnSettings = document.getElementById('btnSettings');
  const btnBackFromSettings = document.getElementById('btnBackFromSettings');
  const settingsPassword = document.getElementById('settingsPassword');
  const btnUnlock = document.getElementById('btnUnlock');
  const settingsForm = document.getElementById('settingsForm');
  const inputDeviceId = document.getElementById('inputDeviceId');
  const inputToken1 = document.getElementById('inputToken1');
  const inputToken2 = document.getElementById('inputToken2');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const ADMIN_PASS = 'TwojeSilneHaslo';

  const btnSelectUser = document.getElementById('btnSelectUser');
  const btnBackFromUser = document.getElementById('btnBackFromUser');
  const listUsers = document.getElementById('listUsers');
  const labelUser = document.getElementById('labelUser');

  const btnCheckLocation = document.getElementById('btnCheckLocation');
  const btnChangeLocation = document.getElementById('btnChangeLocation');
  const btnSwitchUser = document.getElementById('btnSwitchUser');

  const btnCheckCode = document.getElementById('btnCheckCode');
  const inputCheckCode = document.getElementById('inputCheckCode');
  const checkResult = document.getElementById('checkResult');
  const btnRelocate = document.getElementById('btnRelocate');
  const btnHistory = document.getElementById('btnHistory');

  const btnFetchForChange = document.getElementById('btnFetchForChange');
  const inputChangeCode = document.getElementById('inputChangeCode');
  const currentLoc = document.getElementById('currentLoc');
  const changeScanNew = document.getElementById('changeScanNew');
  const inputNewLocation = document.getElementById('inputNewLocation');
  const btnSubmitChange = document.getElementById('btnSubmitChange');

  // Settings
  if (btnSettings) {
    btnSettings.addEventListener('click', () => showView('view-settings'));
    btnBackFromSettings.addEventListener('click', () => showView('view-home'));
    btnUnlock.addEventListener('click', () => {
      if (settingsPassword.value === ADMIN_PASS) {
        settingsPassword.value = '';
        settingsForm.classList.remove('hidden');
        btnUnlock.disabled = true;
      } else alert('Błędne hasło');
    });
    btnSaveSettings.addEventListener('click', () => {
      localStorage.deviceId = inputDeviceId.value;
      localStorage.token1 = inputToken1.value;
      localStorage.token2 = inputToken2.value;
      showView('view-home');
    });
  }

  // Select user
  if (btnSelectUser) {
    btnSelectUser.addEventListener('click', async () => {
      showView('view-user');
      const res = await jsonpCall({ action: 'getUsers', deviceId: localStorage.deviceId, token1: localStorage.token1, token2: localStorage.token2 });
      if (!res.success) return alert(res.error);
      listUsers.innerHTML = '';
      res.users.forEach(u => {
        const li = document.createElement('li');
        li.textContent = u;
        li.addEventListener('click', async () => {
          const setRes = await jsonpCall({ action: 'setActiveUser', deviceId: localStorage.deviceId, token1: localStorage.token1, token2: localStorage.token2, user: u });
          if (!setRes.success) return alert(setRes.error);
          localStorage.currentUser = u;
          labelUser.textContent = u;
          showView('view-dashboard');
        });
        listUsers.appendChild(li);
      });
    });
    btnBackFromUser.addEventListener('click', () => showView('view-home'));
  }

  // Dashboard
  if (btnCheckLocation) {
    btnCheckLocation.addEventListener('click', () => {
      currentCode = '';
      currentSymbol = '';
      lastHistory = [];
      inputCheckCode.value = '';
      checkResult.textContent = '';
      if (btnRelocate) btnRelocate.classList.add('hidden');
      if (btnHistory) btnHistory.classList.add('hidden');
      showView('view-check');
      inputCheckCode.focus();
    });
  }
  if (btnChangeLocation) {
    btnChangeLocation.addEventListener('click', () => {
      currentCode = '';
      currentSymbol = '';
      lastHistory = [];
      const infoEl = document.getElementById('productInfo');
      if (infoEl) infoEl.remove();
      inputChangeCode.parentElement.classList.remove('hidden');
      btnFetchForChange.classList.remove('hidden');
      changeScanNew.classList.add('hidden');
      inputChangeCode.value = '';
      showView('view-change');
      inputChangeCode.focus();
    });
  }
  if (btnSwitchUser) btnSwitchUser.addEventListener('click', () => showView('view-user'));

  // Check location
  const btnBackCheck = document.querySelector('#view-check .btnBack');
  if (btnBackCheck) btnBackCheck.addEventListener('click', () => showView('view-dashboard'));

  if (btnCheckCode) {
    btnCheckCode.addEventListener('click', async () => {
      const res = await jsonpCall({ action: 'checkLocation', deviceId: localStorage.deviceId, token1: localStorage.token1, token2: localStorage.token2, code: inputCheckCode.value });
      if (!res.success) return alert(res.error);
      if (res.found) {
        currentCode = res.code;
        currentSymbol = res.symbol;
        lastHistory = res.history || [];
        checkResult.textContent = `Kod: ${res.code} | Symbol: ${res.symbol} | Lokalizacja: ${res.location}`;
        btnRelocate.classList.remove('hidden');
        if (btnHistory) btnHistory.classList.remove('hidden');
      } else {
        checkResult.textContent = 'Brak produktu w bazie';
      }
    });
    inputCheckCode.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); btnCheckCode.click(); }
    });
    if (btnHistory) {
      btnHistory.addEventListener('click', () => {
        if (!lastHistory.length) return alert('Brak historii');
        const lines = lastHistory.map(h => `${new Date(h.date).toLocaleString()}: ${h.oldLocation} → ${h.newLocation}`);
        alert('Historia:
' + lines.join('
'));
      });
    }
  }

  // Change location
  if (btnFetchForChange) {
    btnFetchForChange.addEventListener('click', async () => {
      const res = await jsonpCall({ action: 'checkLocation', deviceId: localStorage.deviceId, token1: localStorage.token1, token2: localStorage.token2, code: inputChangeCode.value });
      if (!res.success) return alert(res.error);
      if (!res.found) return alert('Brak towaru');
      currentCode = res.code;
      currentSymbol = res.symbol;
      lastHistory = res.history || [];
      currentLoc.textContent = `Aktualna lokalizacja: ${res.location}`;
      inputChangeCode.parentElement.classList.add('hidden');
      btnFetchForChange.classList.add('hidden');
      changeScanNew.classList.remove('hidden');
      inputNewLocation.value = '';
      inputNewLocation.focus();
    });
    inputChangeCode.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); btnFetchForChange.click(); }
    });
  }

  if (btnSubmitChange) {
    btnSubmitChange.addEventListener('click', async () => {
      const newLoc = inputNewLocation.value;
      if (!currentCode || !newLoc) return alert('Brak kodu lub lokalizacji');
      const res = await jsonpCall({ action: 'setLocation', deviceId: localStorage.deviceId, token1: localStorage.token1, token2: localStorage.token2, code: currentCode, newLocation: newLoc });
      if (!res.success) return alert(res.error);
      alert('Zaktualizowano');
      const infoEl = document.getElementById('productInfo'); if (infoEl) infoEl.remove();
      showView('view-dashboard');
    });
    inputNewLocation.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); btnSubmitChange.click(); }
    });
  }

  const btnBackChange = document.querySelector('#view-change .btnBack');
  if (btnBackChange) btnBackChange.addEventListener('click', () => showView('view-dashboard'));

  showView('view-home');
});
