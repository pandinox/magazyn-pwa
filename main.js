/* main.js */

// JSONP-enabled Apps Script Web App URL
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
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    url.searchParams.set('callback', cbName);
    const script = document.createElement('script');
    script.src = url;
    script.id = cbName;
    document.body.appendChild(script);
  });
}

// Switch views by id
function showView(id) {
  document.querySelectorAll('body > div').forEach(el => el.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  // STATE
  let currentCode = '';
  let currentSymbol = '';

  // ELEMENTS
  const btnSettings         = document.getElementById('btnSettings');
  const btnSelectUser       = document.getElementById('btnSelectUser');
  const btnBackFromSettings = document.getElementById('btnBackFromSettings');
  const btnBackFromUser     = document.getElementById('btnBackFromUser');
  const btnSaveSettings     = document.getElementById('btnSaveSettings');
  const btnUnlock           = document.getElementById('btnUnlock');
  const settingsPassword    = document.getElementById('settingsPassword');
  const settingsForm        = document.getElementById('settingsForm');
  const inputDeviceId       = document.getElementById('inputDeviceId');
  const inputToken1         = document.getElementById('inputToken1');
  const inputToken2         = document.getElementById('inputToken2');
  const listUsers           = document.getElementById('listUsers');
  const btnCheckLocation    = document.getElementById('btnCheckLocation');
  const btnChangeLocation   = document.getElementById('btnChangeLocation');
  const btnSwitchUser       = document.getElementById('btnSwitchUser');
  const labelUser           = document.getElementById('labelUser');
  const btnCheckCode        = document.getElementById('btnCheckCode');
  const inputCheckCode      = document.getElementById('inputCheckCode');
  const checkResult         = document.getElementById('checkResult');
  const btnRelocate         = document.getElementById('btnRelocate');
  const btnFetchForChange   = document.getElementById('btnFetchForChange');
  const btnConfirmChange    = document.getElementById('btnConfirmChange');
  const btnSubmitChange     = document.getElementById('btnSubmitChange');
  const inputChangeCode     = document.getElementById('inputChangeCode');
  const changePrompt        = document.getElementById('changePrompt');
  const changeScanNew       = document.getElementById('changeScanNew');
  const inputNewLocation    = document.getElementById('inputNewLocation');
  const currentLoc          = document.getElementById('currentLoc');

  const ADMIN_PASS = 'TwojeSilneHaslo';

  // SETTINGS
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

  // USER SELECTION
  btnSelectUser.addEventListener('click', async () => {
    showView('view-user');
    const res = await jsonpCall({ action: 'getUsers', deviceId: localStorage.deviceId, token1: localStorage.token1, token2: localStorage.token2 });
    if (!res.success) {
      alert(res.error);
      return;
    }
    listUsers.innerHTML = '';
    res.users.forEach(u => {
      const li = document.createElement('li');
      li.textContent = u;
      li.addEventListener('click', async () => {
        const setRes = await jsonpCall({ action: 'setActiveUser', deviceId: localStorage.deviceId, token1: localStorage.token1, token2: localStorage.token2, user: u });
        if (!setRes.success) {
          alert(setRes.error);
          return;
        }
        localStorage.currentUser = u;
        labelUser.textContent = u;
        showView('view-dashboard');
      });
      listUsers.appendChild(li);
    });
  });
  btnBackFromUser.addEventListener('click', () => showView('view-home'));

  // DASHBOARD
  btnCheckLocation.addEventListener('click', () => showView('view-check'));
  btnChangeLocation.addEventListener('click', () => {
    showView('view-change');
    inputChangeCode.parentElement.classList.remove('hidden');
    btnFetchForChange.classList.remove('hidden');
    changePrompt.classList.add('hidden');
    changeScanNew.classList.add('hidden');
    inputChangeCode.value = '';
    inputChangeCode.focus();
  });
  btnSwitchUser.addEventListener('click', () => showView('view-user'));

  // CHECK LOCATION FLOW
  document.querySelector('#view-check .btnBack').addEventListener('click', () => showView('view-dashboard'));
  btnCheckCode.addEventListener('click', async () => {
    const res = await jsonpCall({ action: 'checkLocation', deviceId: localStorage.deviceId, token1: localStorage.token1, token2: localStorage.token2, code: inputCheckCode.value });
    if (!res.success) {
      alert(res.error);
      return;
    }
    if (res.found) {
      currentCode = inputCheckCode.value;
      currentSymbol = res.symbol || '';
      checkResult.textContent = `Kod: ${currentCode} | Symbol: ${currentSymbol} | Lokalizacja: ${res.location}`;
      btnRelocate.classList.remove('hidden');
    } else {
      checkResult.textContent = 'Brak produktu w bazie';
      btnRelocate.classList.add('hidden');
    }
  });

  // IMMEDIATE RELOCATE
  btnRelocate.addEventListener('click', () => {
    showView('view-change');
    inputChangeCode.parentElement.classList.add('hidden');
    btnFetchForChange.classList.add('hidden');
    changePrompt.classList.add('hidden');
    changeScanNew.classList.remove('hidden');
    currentLoc.textContent = `Aktualna lokalizacja: ${checkResult.textContent.split(' | Lokalizacja: ')[1]}`;
    let infoEl = document.getElementById('productInfo');
    if (!infoEl) {
      infoEl = document.createElement('p');
      infoEl.id = 'productInfo';
      document.getElementById('view-change').insertBefore(infoEl, changeScanNew);
    }
    infoEl.textContent = `Kod produktu: ${currentCode} | Symbol: ${currentSymbol}`;
    inputNewLocation.value = '';
    inputNewLocation.focus();
  });

  // FULL CHANGE FLOW
  document.querySelector('#view-change .btnBack').addEventListener('click', () => showView('view-dashboard'));
  btnFetchForChange.addEventListener('click', async () => {
    const res = await jsonpCall({ action: 'checkLocation', deviceId: localStorage.deviceId, token1: localStorage.token1, token2: localStorage.token2, code: inputChangeCode.value });
    if (!res.success) {
      alert(res.error);
      return;
    }
    if (!res.found) {
      alert('Kod nie istnieje');
      return;
    }
    currentCode = inputChangeCode.value;
    currentSymbol = res.symbol || '';
    currentLoc.textContent = `Aktualna lokalizacja: ${res.location}`;
    changePrompt.classList.remove('hidden');
  });
  btnConfirmChange.addEventListener('click', () => {
    changePrompt.classList.add('hidden');
    changeScanNew.classList.remove('hidden');
    inputNewLocation.focus();
  });
  btnSubmitChange.addEventListener('click', async () => {
    const newLocation = inputNewLocation.value;
    if (!currentCode || !newLocation) {
      alert('Brak kodu lub lokalizacji!');
      return;
    }
    const res = await jsonpCall({ action: 'setLocation', deviceId: localStorage.deviceId, token1: localStorage.token1, token2: localStorage.token2, code: currentCode, newLocation });
    if (!res.success) {
      alert(res.error);
      return;
    }
    alert('Zaktualizowano lokalizację');
    const infoEl = document.getElementById('productInfo');
    if (infoEl) infoEl.remove();
    showView('view-dashboard');
  });

  // Start view
  showView('view-home');
});
