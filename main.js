// main.js

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwITvM8iUX0d88OjUZueounMnUdyWBzOfu8kKIroOQqbmnb9w3MUyXQ25gpADFLCN8o-w/exec'; // Twój Web App URL

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
    Object.entries(params).forEach(([k,v]) => u.searchParams.set(k,v));
    u.searchParams.set('callback', cbName);
    const script = document.createElement('script');
    script.src = u;
    document.body.appendChild(script);
  });
}

// helper do widoków
function showView(id) {
  document.querySelectorAll('body > div').forEach(d => d.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
}

// inicjalizacja
document.addEventListener('DOMContentLoaded', () => {
  // odczyt elementów…
  const btnSettings = document.getElementById('btnSettings');
  const btnBackFromSettings = document.getElementById('btnBackFromSettings');
  const settingsPassword = document.getElementById('settingsPassword');
  const btnUnlock = document.getElementById('btnUnlock');
  const settingsForm = document.getElementById('settingsForm');
  const inputDeviceId = document.getElementById('inputDeviceId');
  const inputToken1 = document.getElementById('inputToken1');
  const inputToken2 = document.getElementById('inputToken2');
  const btnSaveSettings = document.getElementById('btnSaveSettings');

  const btnSelectUser = document.getElementById('btnSelectUser');
  const btnBackFromUser = document.getElementById('btnBackFromUser');
  const listUsers = document.getElementById('listUsers');

  const btnCheckLocation = document.getElementById('btnCheckLocation');
  const btnChangeLocation = document.getElementById('btnChangeLocation');
  const btnSwitchUser = document.getElementById('btnSwitchUser');
  const labelUser = document.getElementById('labelUser');

  const viewCheck = document.getElementById('view-check');
  const btnCheckCode = document.getElementById('btnCheckCode');
  const inputCheckCode = document.getElementById('inputCheckCode');
  const checkResult = document.getElementById('checkResult');
  const btnRelocate = document.getElementById('btnRelocate');

  const viewChange = document.getElementById('view-change');
  const inputChangeCode = document.getElementById('inputChangeCode');
  const btnFetchForChange = document.getElementById('btnFetchForChange');
  const changePrompt = document.getElementById('changePrompt');
  const currentLoc = document.getElementById('currentLoc');
  const btnConfirmChange = document.getElementById('btnConfirmChange');
  const changeScanNew = document.getElementById('changeScanNew');
  const inputNewLocation = document.getElementById('inputNewLocation');
  const btnSubmitChange = document.getElementById('btnSubmitChange');

  const ADMIN_PASS = 'TwojeSilneHaslo';

  // SETTINGS
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

  // SELECT USER
  btnSelectUser.onclick = async () => {
    showView('view-user');
    const res = await jsonpCall({
      action: 'getUsers',
      deviceId: localStorage.deviceId,
      token1:   localStorage.token1,
      token2:   localStorage.token2
    });
    if (!res.success) return alert(res.error);
    listUsers.innerHTML = '';
    res.users.forEach(u => {
      const li = document.createElement('li');
      li.textContent = u;
      li.onclick = () => {
        localStorage.currentUser = u;
        labelUser.textContent = u;
        showView('view-dashboard');
      };
      listUsers.appendChild(li);
    });
  };
  btnBackFromUser.onclick = () => showView('view-home');
  btnSwitchUser.onclick   = () => showView('view-user');

  // DASHBOARD
  btnCheckLocation.onclick  = () => showView('view-check');
  btnChangeLocation.onclick = () => { showView('view-change'); prepareChangeStage1(); };

  // CHECK LOCATION
  viewCheck.querySelector('.btnBack').onclick = () => showView('view-dashboard');
  btnCheckCode.onclick = async () => {
    const res = await jsonpCall({
      action: 'checkLocation',
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
  btnRelocate.onclick = () => {
    inputChangeCode.value = inputCheckCode.value;
    showView('view-change');
    prepareChangeStage1();
  };

  // CHANGE LOCATION
  viewChange.querySelector('.btnBack').onclick = () => showView('view-dashboard');
  function prepareChangeStage1() {
    inputChangeCode.value = '';
    changePrompt.classList.add('hidden');
    changeScanNew.classList.add('hidden');
  }
  btnFetchForChange.onclick = async () => {
    const res = await jsonpCall({
      action: 'checkLocation',
      deviceId: localStorage.deviceId,
      token1:   localStorage.token1,
      token2:   localStorage.token2,
      code:     inputChangeCode.value
    });
    if (!res.success) return alert(res.error);
    if (!res.found) return alert('Kod nie istnieje');
    currentLoc.textContent = `Aktualna lokalizacja: ${res.location}`;
    changePrompt.classList.remove('hidden');
  };
  btnConfirmChange.onclick = () => {
    changePrompt.classList.add('hidden');
    changeScanNew.classList.remove('hidden');
  };
  btnSubmitChange.onclick = async () => {
    const res = await jsonpCall({
      action:      'setLocation',
      deviceId:    localStorage.deviceId,
      token1:      localStorage.token1,
      token2:      localStorage.token2,
      code:        inputChangeCode.value,
      newLocation: inputNewLocation.value
    });
    if (!res.success) return alert(res.error);
    alert('Zaktualizowano');
    showView('view-dashboard');
  };

  showView('view-home');
});
