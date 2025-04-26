/* main.js */

// URL do Twojego JSONP-enabled Web App
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzfIeWTvsnr9VlTMyNgfSlF4ptdodfS2R1i-j1crVL65phQtOFwUxHAZi29ndcLe6oMwA/exec';

// JSONP helper
function jsonpCall(params) {
  return new Promise(resolve => {
    const cbName = 'cb_' + Math.random().toString(36).substr(2);
    window[cbName] = data => {
      delete window[cbName];
      document.body.removeChild(document.getElementById(cbName));
      resolve(data);
    };
    const url = new URL(SCRIPT_URL);
    Object.entries(params).forEach(([k,v]) => url.searchParams.set(k,v));
    url.searchParams.set('callback', cbName);
    const script = document.createElement('script');
    script.src = url;
    script.id  = cbName;
    document.body.appendChild(script);
  });
}

// Przełączanie widoków
function showView(id) {
  document.querySelectorAll('body > div').forEach(d => d.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  // --- STAN I ELEMENTY ---
  let currentCode   = '';
  let currentSymbol = '';
  let lastHistory   = [];

  // Ustawienia
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

  // Wybór użytkownika
  const btnSelectUser = document.getElementById('btnSelectUser');
  const btnBackFromUser = document.getElementById('btnBackFromUser');
  const listUsers       = document.getElementById('listUsers');
  const labelUser       = document.getElementById('labelUser');

  // Dashboard
  const btnCheckLocation  = document.getElementById('btnCheckLocation');
  const btnChangeLocation = document.getElementById('btnChangeLocation');
  const btnSwitchUser     = document.getElementById('btnSwitchUser');

  // Sprawdź lokalizację
  const btnCheckCode  = document.getElementById('btnCheckCode');
  const inputCheckCode= document.getElementById('inputCheckCode');
  const checkResult   = document.getElementById('checkResult');
  const btnRelocate   = document.getElementById('btnRelocate');
  const btnHistory    = document.getElementById('btnHistory');

  // Zmień lokalizację
  const btnFetchForChange = document.getElementById('btnFetchForChange');
  const inputChangeCode   = document.getElementById('inputChangeCode');
  const changePrompt      = document.getElementById('changePrompt');
  const btnConfirmChange  = document.getElementById('btnConfirmChange');
  const changeScanNew     = document.getElementById('changeScanNew');
  const inputNewLocation  = document.getElementById('inputNewLocation');
  const btnSubmitChange   = document.getElementById('btnSubmitChange');
  const currentLoc        = document.getElementById('currentLoc');

  // --- OBSŁUGA USTAWIEŃ ---
  btnSettings.addEventListener('click', () => showView('view-settings'));
  btnBackFromSettings.addEventListener('click', () => showView('view-home'));
  btnUnlock.addEventListener('click', () => {
    if (settingsPassword.value === ADMIN_PASS) {
      settingsPassword.value = '';
      settingsForm.classList.remove('hidden');
      btnUnlock.disabled = true;
    } else {
      alert('Błędne hasło');
    }
  });
  btnSaveSettings.addEventListener('click', () => {
    localStorage.deviceId = inputDeviceId.value;
    localStorage.token1   = inputToken1.value;
    localStorage.token2   = inputToken2.value;
    showView('view-home');
  });

  // --- WYBÓR UŻYTKOWNIKA ---
  btnSelectUser.addEventListener('click', async () => {
    showView('view-user');
    const res = await jsonpCall({
      action:   'getUsers',
      deviceId: localStorage.deviceId,
      token1:   localStorage.token1,
      token2:   localStorage.token2
    });
    if (!res.success) {
      alert(res.error);
      return;
    }
    listUsers.innerHTML = '';
    res.users.forEach(u => {
      const li = document.createElement('li');
      li.textContent = u;
      li.addEventListener('click', async () => {
        const setRes = await jsonpCall({
          action:   'setActiveUser',
          deviceId: localStorage.deviceId,
          token1:   localStorage.token1,
          token2:   localStorage.token2,
          user:     u
        });
        if (!setRes.success) {
          alert(setRes.error);
          return;
        }
        localStorage.currentUser = u;
        labelUser.textContent    = u;
        showView('view-dashboard');
      });
      listUsers.appendChild(li);
    });
  });
  btnBackFromUser.addEventListener('click', () => showView('view-home'));

  // --- DASHBOARD ---
  btnCheckLocation.addEventListener('click', () => showView('view-check'));
  btnChangeLocation.addEventListener('click', () => {
    showView('view-change');
    // reset
    inputChangeCode.parentElement.classList.remove('hidden');
    btnFetchForChange.classList.remove('hidden');
    changePrompt.classList.add('hidden');
    changeScanNew.classList.add('hidden');
    inputChangeCode.value = '';
    inputChangeCode.focus();
  });
  btnSwitchUser.addEventListener('click', () => showView('view-user'));

  // --- SPRAWDŹ LOKACJĘ + HISTORIA ---
  document.querySelector('#view-check .btnBack')
    .addEventListener('click', () => showView('view-dashboard'));

  btnCheckCode.addEventListener('click', async () => {
    const res = await jsonpCall({
      action:   'checkLocation',
      deviceId: localStorage.deviceId,
      token1:   localStorage.token1,
      token2:   localStorage.token2,
      code:     inputCheckCode.value
    });
    if (!res.success) {
      alert(res.error);
      return;
    }
    if (res.found) {
      currentCode   = res.code;
      currentSymbol = res.symbol;
      lastHistory   = res.history || [];
      checkResult.textContent = 
        `Kod: ${res.code} | Symbol: ${res.symbol} | Lokalizacja: ${res.location}`;
      btnRelocate.classList.remove('hidden');
      btnHistory.classList.remove('hidden');
    } else {
      checkResult.textContent = 'Brak produktu w bazie';
      btnRelocate.classList.add('hidden');
      btnHistory.classList.add('hidden');
    }
  });

  // Historia lokacji
  btnHistory.addEventListener('click', () => {
    if (!lastHistory.length) {
      alert('Brak poprzednich zmian lokalizacji.');
      return;
    }
    // Budujemy tekst
    const lines = lastHistory.map(h => 
      `${h.date.toLocaleString()}: ${h.oldLocation} → ${h.newLocation} (użytkownik: ${h.user})`
    );
    alert('Ostatnie zmiany:\n\n' + lines.join('\n'));
  });

  // --- NATYCHMIASTOWA ZMIANA LOKALIZACJI ---
  btnRelocate.addEventListener('click', () => {
    showView('view-change');
    inputChangeCode.parentElement.classList.add('hidden');
    btnFetchForChange.classList.add('hidden');
    changePrompt.classList.add('hidden');
    changeScanNew.classList.remove('hidden');
    currentLoc.textContent = 
      `Aktualna lokalizacja: ${checkResult.textContent.split(' | Lokalizacja: ')[1]}`;
    let infoEl = document.getElementById('productInfo');
    if (!infoEl) {
      infoEl = document.createElement('p');
      infoEl.id = 'productInfo';
      document.getElementById('view-change')
              .insertBefore(infoEl, changeScanNew);
    }
    infoEl.textContent = `Kod produktu: ${currentCode} | Symbol: ${currentSymbol}`;
    inputNewLocation.value = '';
    inputNewLocation.focus();
  });

  // --- PEŁNY FLOW ZMIANY LOKALIZACJI ---
  document.querySelector('#view-change .btnBack')
    .addEventListener('click', () => showView('view-dashboard'));

  btnFetchForChange.addEventListener('click', async () => {
    const res = await jsonpCall({
      action:   'checkLocation',
      deviceId: localStorage.deviceId,
      token1:   localStorage.token1,
      token2:   localStorage.token2,
      code:     inputChangeCode.value
    });
    if (!res.success) {
      alert(res.error);
      return;
    }
    if (!res.found) {
      alert('Kod nie istnieje');
      return;
    }
    currentCode   = res.code;
    currentSymbol = res.symbol;
    lastHistory   = res.history || [];
    currentLoc.textContent = `Aktualna lokalizacja: ${res.location}`;
    changePrompt.classList.remove('hidden');
  });

  btnConfirmChange.addEventListener('click', () => {
    changePrompt.classList.add('hidden');
    changeScanNew.classList.remove('hidden');
    inputNewLocation.focus();
  });

  btnSubmitChange.addEventListener('click', async () => {
    const newLoc = inputNewLocation.value;
    if (!currentCode || !newLoc) {
      alert('Brak kodu lub lokalizacji!');
      return;
    }
    const res = await jsonpCall({
      action:      'setLocation',
      deviceId:    localStorage.deviceId,
      token1:      localStorage.token1,
      token2:      localStorage.token2,
      code:        currentCode,
      newLocation: newLoc
    });
    if (!res.success) {
      alert(res.error);
      return;
    }
    alert('Zaktualizowano lokalizację');
    const infoEl = document.getElementById('productInfo');
    if (infoEl) infoEl.remove();
    showView('view-dashboard');
  });

  // Startujemy od ekranu głównego
  showView('view-home');
});
