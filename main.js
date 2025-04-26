/* main.js */

// URL Twojego JSONP-enabled Web App
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzfIeWTvsnr9VlTMyNgfSlF4ptdodfS2R1i-j1crVL65phQtOFwUxHAZi29ndcLe6oMwA/exec';

// JSONP helper
function jsonpCall(params) {
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

// Przełączanie widoków\ nfunction showView(id) {
  document.querySelectorAll('body > div').forEach(d => d.classList.add('hidden'));
  const v = document.getElementById(id);
  if (v) v.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  let currentCode   = '';
  let currentSymbol = '';
  let lastHistory   = [];

  const btnSettings          = document.getElementById('btnSettings');
  const btnBackFromSettings  = document.getElementById('btnBackFromSettings');
  const settingsPassword     = document.getElementById('settingsPassword');
  const btnUnlock            = document.getElementById('btnUnlock');
  const settingsForm         = document.getElementById('settingsForm');
  const inputDeviceId        = document.getElementById('inputDeviceId');
  const inputToken1          = document.getElementById('inputToken1');
  const inputToken2          = document.getElementById('inputToken2');
  const btnSaveSettings      = document.getElementById('btnSaveSettings');
  const ADMIN_PASS           = 'TwojeSilneHaslo';

  const btnSelectUser        = document.getElementById('btnSelectUser');
  const btnBackFromUser      = document.getElementById('btnBackFromUser');
  const listUsers            = document.getElementById('listUsers');
  const labelUser            = document.getElementById('labelUser');

  const btnCheckLocation     = document.getElementById('btnCheckLocation');
  const btnChangeLocation    = document.getElementById('btnChangeLocation');
  const btnSwitchUser        = document.getElementById('btnSwitchUser');

  const btnCheckCode         = document.getElementById('btnCheckCode');
  const inputCheckCode       = document.getElementById('inputCheckCode');
  const checkResult          = document.getElementById('checkResult');
  const btnRelocate          = document.getElementById('btnRelocate');
  const btnHistory           = document.getElementById('btnHistory');

  const btnFetchForChange    = document.getElementById('btnFetchForChange');
  const inputChangeCode      = document.getElementById('inputChangeCode');
  const changePrompt         = document.getElementById('changePrompt');
  const btnConfirmChange     = document.getElementById('btnConfirmChange');
  const changeScanNew        = document.getElementById('changeScanNew');
  const inputNewLocation     = document.getElementById('inputNewLocation');
  const btnSubmitChange      = document.getElementById('btnSubmitChange');
  const currentLoc           = document.getElementById('currentLoc');

  // Ustawienia
  if (btnSettings) {
    btnSettings.onclick = () => showView('view-settings');
    btnBackFromSettings.onclick = () => showView('view-home');
    btnUnlock.onclick = () => {
      if (settingsPassword.value === ADMIN_PASS) {
        settingsPassword.value = '';
        settingsForm.classList.remove('hidden');
        btnUnlock.disabled = true;
      } else alert('Błędne hasło');
    };
    btnSaveSettings.onclick = () => {
      localStorage.deviceId = inputDeviceId.value;
      localStorage.token1   = inputToken1.value;
      localStorage.token2   = inputToken2.value;
      showView('view-home');
    };
  }

  // Wybór użytkownika
  if (btnSelectUser) {
    btnSelectUser.onclick = async () => {
      showView('view-user');
      const res = await jsonpCall({ action: 'getUsers', deviceId: localStorage.deviceId, token1: localStorage.token1, token2: localStorage.token2 });
      if (!res.success) return alert(res.error);
      listUsers.innerHTML = '';
      res.users.forEach(u => {
        const li = document.createElement('li');
        li.textContent = u;
        li.onclick = async () => {
          const setRes = await jsonpCall({ action: 'setActiveUser', deviceId: localStorage.deviceId, token1: localStorage.token1, token2: localStorage.token2, user: u });
          if (!setRes.success) return alert(setRes.error);
          localStorage.currentUser = u;
          labelUser.textContent    = u;
          showView('view-dashboard');
        };
        listUsers.appendChild(li);
      });
    };
    btnBackFromUser.onclick = () => showView('view-home');
  }

  // Dashboard
  if (btnCheckLocation) {
    btnCheckLocation.onclick = () => {
      currentCode = '';
      currentSymbol = '';
      lastHistory = [];
      inputCheckCode.value = '';
      checkResult.textContent = '';
      if (btnRelocate) btnRelocate.classList.add('hidden');
      if (btnHistory) btnHistory.classList.add('hidden');
      showView('view-check');
      inputCheckCode.focus();
    };
  }
  if (btnChangeLocation) {
    btnChangeLocation.onclick = () => {
      currentCode = '';
      currentSymbol = '';
      lastHistory = [];
      const infoEl = document.getElementById('productInfo');
      if (infoEl) infoEl.remove();
      inputChangeCode.parentElement.classList.remove('hidden');
      btnFetchForChange.classList.remove('hidden');
      changePrompt.classList.add('hidden');
      changeScanNew.classList.add('hidden');
      inputChangeCode.value = '';
      showView('view-change');
      inputChangeCode.focus();
    };
  }
  if (btnSwitchUser) btnSwitchUser.onclick = () => showView('view-user');

  // Sprawdź lokalizację
  const btnBackCheck = document.querySelector('#view-check .btnBack');
  if (btnBackCheck) btnBackCheck.onclick = () => showView('view-dashboard');

  if (btnCheckCode) {
    btnCheckCode.onclick = async () => {
      const res = await jsonpCall({ action: 'checkLocation', deviceId: localStorage.deviceId, token1: localStorage.token1, token2: localStorage.token2, code: inputCheckCode.value });
      if (!res.success) return alert(res.error);
      if (res.found) {
        currentCode   = res.code;
        currentSymbol = res.symbol;
        lastHistory   = res.history || [];
        checkResult.textContent = `Kod: ${res.code} | Symbol: ${res.symbol} | Lokalizacja: ${res.location}`;
        btnRelocate.classList.remove('hidden');
        if (btnHistory) btnHistory.classList.remove('hidden');
      } else {
        checkResult.textContent = 'Brak produktu w bazie';
        btnRelocate.classList.add('hidden');
        if (btnHistory) btnHistory.classList.add('hidden');
      }
    };
    if (inputCheckCode) inputCheckCode.onkeydown = e => { if (e.key==='Enter') { e.preventDefault(); btnCheckCode.click(); } };
    if (btnHistory) btnHistory.onclick = () => {
      if (!lastHistory.length) return alert('Brak poprzednich zmian lokalizacji.');
      const lines = lastHistory.map(h => `${new Date(h.date).toLocaleString()}: ${h.oldLocation} → ${h.newLocation} (użytkownik: ${h.user})`);
      alert('Ostatnie zmiany:\n\n'+lines.join('\n'));
    };
  }

  // Zmień lokalizację (upraszczamy flow)
  if (btnFetchForChange) {
    btnFetchForChange.onclick = async () => {
      const res = await jsonpCall({ action: 'checkLocation', deviceId: localStorage.deviceId, token1: localStorage.token1, token2: localStorage.token2, code: inputChangeCode.value });
      if (!res.success) return alert(res.error);
      if (!res.found) return alert('Kod nie istnieje');
      currentCode   = res.code;
      currentSymbol = res.symbol;
      lastHistory   = res.history || [];
      // od razu pokazujemy pole nowej lokalizacji
      changePrompt.classList.add('hidden');
      inputChangeCode.parentElement.classList.add('hidden');
      btnFetchForChange.classList.add('hidden');
      changeScanNew.classList.remove('hidden');
      currentLoc.textContent = `Aktualna lokalizacja: ${res.location}`;
      let infoEl = document.getElementById('productInfo');
      if (!infoEl) {
        infoEl = document.createElement('p'); infoEl.id='productInfo';
        document.getElementById('view-change').insertBefore(infoEl, changeScanNew);
      }
      infoEl.textContent = `Kod: ${currentCode} | Symbol: ${currentSymbol}`;
      inputNewLocation.value = '';
      inputNewLocation.focus();
    };
    if (inputChangeCode) inputChangeCode.onkeydown = e => { if (e.key==='Enter') { e.preventDefault(); btnFetchForChange.click(); } };
  }
  if (btnConfirmChange) btnConfirmChange.onclick = () => {
    changePrompt.classList.add('hidden');
    changeScanNew.classList.remove('hidden');
    inputNewLocation.value = '';
    inputNewLocation.focus();
  };

  if (btnSubmitChange) {
    btnSubmitChange.onclick = async () => {
      const newLoc = inputNewLocation.value;
      if (!currentCode||!newLoc) return alert('Brak kodu lub lokalizacji!');
      const res = await jsonpCall({ action:'setLocation', deviceId:localStorage.deviceId, token1:localStorage.token1, token2:localStorage.token2, code:currentCode, newLocation:newLoc });
      if (!res.success) return alert(res.error);
      alert('Zaktualizowano lokalizację');
      const infoEl = document.getElementById('productInfo'); if (infoEl) infoEl.remove();
      showView('view-dashboard');
    };
    inputNewLocation.onkeydown = e => { if (e.key==='Enter') { e.preventDefault(); btnSubmitChange.click(); } };
  }

  // powrót z zmiany
  const btnBackChange = document.querySelector('#view-change .btnBack');
  if (btnBackChange) btnBackChange.onclick = () => showView('view-dashboard');

  // start
  showView('view-home');
});
