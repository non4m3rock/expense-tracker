const generateId = () => +new Date();

// Currency formatter using Intl.NumberFormat (efficient and consistent)
function formatCurrency(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const authScreen = document.getElementById('authScreen');
const trackerApp = document.querySelector('.tracker-app');
const authForm = document.getElementById('authForm');
const authUsernameInput = document.getElementById('authUsernameInput');
const authPasswordInput = document.getElementById('authPasswordInput');
const authFullNameField = document.getElementById('authFullNameField');
const authFullNameInput = document.getElementById('authFullNameInput');
const authSubmitButton = document.getElementById('authSubmitButton');
const toggleAuthModeButton = document.getElementById('toggleAuthMode');
const authModeText = document.getElementById('authModeText');
const authMessage = document.getElementById('authMessage');
const logoutButton = document.getElementById('logoutButton');
const userGreeting = document.getElementById('profileName');
const userFullName = document.getElementById('profileFullName');
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');

const transactionForm = document.getElementById('transactionForm');
const titleInput = document.getElementById('transactionFormTitleInput');
const amountInput = document.getElementById('transactionFormAmountInput');
const dateInput = document.getElementById('transactionFormDateInput');
const typeSelect = document.getElementById('transactionFormTypeSelect');
const submitButton = document.getElementById('transactionFormSubmitButton');

const incomeList = document.getElementById('incomeList');
const expenseList = document.getElementById('expenseList');
const balanceAmount = document.querySelector(
  '.tracker-summary__balance-amount',
);
const incomeAmount = document.querySelector(
  '.tracker-summary__stat-amount--income',
);
const expenseAmount = document.querySelector(
  '.tracker-summary__stat-amount--expense',
);

const searchInput = document.getElementById('searchTransactionFormTitleInput');
const searchForm = document.getElementById('searchTransactionForm');
let searchKeyword = '';
let transactions = [];
let currentUser = '';
let authMode = 'login';
let currentEditingId = null;
let selectedMonth = new Date().getMonth() + 1;
let selectedYear = new Date().getFullYear();

const loadUsers = () => JSON.parse(localStorage.getItem('users')) || {};
const saveUsers = (users) =>
  localStorage.setItem('users', JSON.stringify(users));
const loadCurrentUser = () => localStorage.getItem('currentUser') || '';
const saveCurrentUser = () => localStorage.setItem('currentUser', currentUser);

const loadUserTransactions = () => {
  if (!currentUser) {
    transactions = [];
    return;
  }
  transactions = JSON.parse(localStorage.getItem(`user_${currentUser}`)) || [];
};

const saveUserData = () => {
  if (!currentUser) return;
  localStorage.setItem(`user_${currentUser}`, JSON.stringify(transactions));
};

const saveTransactions = () => {
  saveUserData();
};

const updateDashboard = (transactionList = transactions) => {
  const totals = transactionList.reduce(
    (result, transaction) => {
      if (transaction.type === 'income') {
        result.income += transaction.amount;
      } else {
        result.expense += transaction.amount;
      }
      return result;
    },
    { income: 0, expense: 0 },
  );

  balanceAmount.textContent = formatCurrency(totals.income);
  incomeAmount.textContent = formatCurrency(totals.income);
  expenseAmount.textContent = formatCurrency(totals.expense);
};

const renderTransactions = () => {
  incomeList.innerHTML = '';
  expenseList.innerHTML = '';

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesTitle = transaction.title
      .toLowerCase()
      .includes(searchKeyword.toLowerCase());
    const [year, month] = transaction.date.split('-').map(Number);
    const matchesDate = year === selectedYear && month === selectedMonth;
    return matchesTitle && matchesDate;
  });

  const totals = filteredTransactions.reduce(
    (result, transaction) => {
      if (transaction.type === 'income') {
        result.income += transaction.amount;
      } else {
        result.expense += transaction.amount;
      }
      return result;
    },
    { income: 0, expense: 0 },
  );

  filteredTransactions.forEach((transaction) => {
    const card = document.createElement('article');
    card.className = 'transaction-card';
    card.setAttribute('data-testid', 'transactionItem');

    const title = document.createElement('h3');
    title.textContent = transaction.title;
    title.setAttribute('data-testid', 'transactionItemTitle');

    const amount = document.createElement('p');
    amount.textContent = `Nominal: ${formatCurrency(transaction.amount)}`;
    amount.setAttribute('data-testid', 'transactionItemAmount');

    const date = document.createElement('p');
    date.textContent = `Tanggal: ${transaction.date}`;
    date.setAttribute('data-testid', 'transactionItemDate');

    const type = document.createElement('p');
    type.textContent = `Tipe: ${transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}`;
    type.setAttribute('data-testid', 'transactionItemType');

    const actions = document.createElement('div');
    actions.className = 'transaction-card__actions';

    const toggleButton = document.createElement('button');
    toggleButton.textContent =
      transaction.type === 'income'
        ? 'Ubah ke Pengeluaran'
        : 'Ubah ke Pemasukan';
    toggleButton.setAttribute('type', 'button');
    toggleButton.className =
      'transaction-card__button transaction-card__button--toggle';
    toggleButton.setAttribute('data-testid', 'transactionItemEditTypeButton');
    toggleButton.addEventListener('click', () =>
      toggleTransactionType(transaction.id),
    );

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.setAttribute('type', 'button');
    editButton.className =
      'transaction-card__button transaction-card__button--edit';
    editButton.setAttribute('data-testid', 'transactionItemEditButton');
    editButton.addEventListener('click', () => setEditMode(transaction));

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Hapus';
    deleteButton.setAttribute('type', 'button');
    deleteButton.className =
      'transaction-card__button transaction-card__button--delete';
    deleteButton.setAttribute('data-testid', 'transactionItemDeleteButton');
    deleteButton.addEventListener('click', () =>
      deleteTransaction(transaction.id),
    );

    actions.append(editButton, toggleButton, deleteButton);
    card.append(title, amount, date, type, actions);

    if (transaction.type === 'income') {
      incomeList.appendChild(card);
    } else {
      expenseList.appendChild(card);
    }
  });

  updateDashboard(filteredTransactions);
};

const setAuthMode = (mode) => {
  authMode = mode;
  authSubmitButton.textContent = mode === 'login' ? 'Login' : 'Daftar';
  authModeText.textContent =
    mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?';
  toggleAuthModeButton.textContent = mode === 'login' ? 'Daftar' : 'Login';
  authFullNameField.classList.toggle('hidden', mode === 'login');
  if (mode === 'login') {
    authFullNameInput.value = '';
  }
  setAuthMessage('');
};

const setAuthMessage = (message, isError = false) => {
  authMessage.textContent = message;
  authMessage.classList.toggle('auth-form__message--error', isError);
};

const resetAuthForm = () => {
  authUsernameInput.value = '';
  authPasswordInput.value = '';
  setAuthMessage('');
};

const showAuthScreen = () => {
  authScreen.classList.remove('hidden');
  trackerApp.classList.add('tracker-app--hidden');
  logoutButton.classList.add('hidden');
};

const showTrackerApp = () => {
  authScreen.classList.add('hidden');
  trackerApp.classList.remove('tracker-app--hidden');
  logoutButton.classList.remove('hidden');
};

const populateMonthYearSelectors = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];

  monthSelect.innerHTML = '';
  yearSelect.innerHTML = '';

  monthNames.forEach((name, index) => {
    const option = document.createElement('option');
    option.value = index + 1;
    option.textContent = name;
    if (index + 1 === selectedMonth) option.selected = true;
    monthSelect.appendChild(option);
  });

  for (let year = currentYear - 5; year <= currentYear + 30; year += 1) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    if (year === selectedYear) option.selected = true;
    yearSelect.appendChild(option);
  }
};

const updateUserGreeting = () => {
  const users = loadUsers();
  const user = users[currentUser];
  userGreeting.textContent = currentUser || 'Pengguna';
  userFullName.textContent = user?.fullName || '';
};

// Theme handling: create selector and persist selection
const THEME_KEY = 'themeMode';
const applyTheme = (mode) => {
  document.body.classList.remove('light-mode', 'warm-mode', 'dark-mode');
  if (mode === 'light') document.body.classList.add('light-mode');
  else if (mode === 'warm') document.body.classList.add('warm-mode');
  else document.body.classList.add('dark-mode');
};

const initTheme = () => {
  // avoid duplicate insertion
  if (document.getElementById('themeSelect')) return;
  const container = document.querySelector('.tracker-header__user-info');
  if (!container) return;
  const wrapper = document.createElement('div');
  wrapper.style.marginTop = '6px';
  wrapper.style.display = 'flex';
  wrapper.style.gap = '6px';

  const label = document.createElement('label');
  label.textContent = 'Tema';
  label.style.fontSize = '0.75rem';
  label.style.color = 'var(--text-muted)';

  const select = document.createElement('select');
  select.id = 'themeSelect';
  select.className = 'tracker-header__select';
  ['dark', 'light', 'warm'].forEach((m) => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m.charAt(0).toUpperCase() + m.slice(1);
    select.appendChild(opt);
  });

  // load saved
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  select.value = saved;
  applyTheme(saved);

  select.addEventListener('change', () => {
    const val = select.value;
    localStorage.setItem(THEME_KEY, val);
    applyTheme(val);
  });

  wrapper.append(label, select);
  container.appendChild(wrapper);
};

const clearEditMode = () => {
  currentEditingId = null;
  submitButton.textContent = 'Simpan';
};

const clearForm = () => {
  titleInput.value = '';
  amountInput.value = '';
  dateInput.value = '';
  typeSelect.value = 'income';
};

const dispatchTransactionUpdated = () => {
  saveTransactions();
  renderTransactions();
};

const deleteTransaction = (id) => {
  const confirmed = confirm('Apakah Anda yakin ingin menghapus transaksi ini?');
  if (confirmed) {
    const index = transactions.findIndex(
      (transaction) => transaction.id === id,
    );
    if (index !== -1) {
      transactions.splice(index, 1);
      dispatchTransactionUpdated();
    }
  }
};

const toggleTransactionType = (id) => {
  const transaction = transactions.find((t) => t.id === id);
  if (transaction) {
    transaction.type = transaction.type === 'income' ? 'expense' : 'income';
    dispatchTransactionUpdated();
  }
};

const setEditMode = (transaction) => {
  currentEditingId = transaction.id;
  titleInput.value = transaction.title;
  amountInput.value = transaction.amount;
  dateInput.value = transaction.date;
  typeSelect.value = transaction.type;
  submitButton.textContent = 'Update';
  titleInput.focus();
};

const authenticate = (username, password) => {
  const users = loadUsers();

  if (authMode === 'register') {
    const fullName = authFullNameInput.value.trim();
    if (!fullName) {
      setAuthMessage('Nama lengkap wajib diisi saat daftar.', true);
      return false;
    }
    if (users[username]) {
      setAuthMessage('Username sudah terdaftar.', true);
      return false;
    }

    users[username] = { password, fullName };
    saveUsers(users);
    setAuthMessage('Akun berhasil dibuat. Silakan login.');
    setAuthMode('login');
    return false;
  }

  if (!users[username] || users[username].password !== password) {
    setAuthMessage('Username atau kata sandi salah.', true);
    return false;
  }

  currentUser = username;
  saveCurrentUser();
  updateUserGreeting();
  setAuthMessage('');
  return true;
};

const handleLogout = () => {
  currentUser = '';
  saveCurrentUser();
  resetAuthForm();
  setAuthMode('login');
  showAuthScreen();
};

const initAuth = () => {
  const savedUser = loadCurrentUser();
  const users = loadUsers();

  if (savedUser && users[savedUser]) {
    currentUser = savedUser;
    updateUserGreeting();
    populateMonthYearSelectors();
    initTheme();
    loadUserTransactions();
    showTrackerApp();
    renderTransactions();
  } else {
    populateMonthYearSelectors();
    initTheme();
    showAuthScreen();
  }
};

transactionForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const date = dateInput.value;
  const type = typeSelect.value;

  if (!title) {
    alert('Judul transaksi tidak boleh kosong.');
    return;
  }

  if (amount < 1) {
    alert('Nominal transaksi harus lebih besar dari 0.');
    return;
  }

  if (currentEditingId) {
    const transaction = transactions.find(
      (item) => item.id === currentEditingId,
    );
    if (transaction) {
      transaction.title = title;
      transaction.amount = amount;
      transaction.date = date;
      transaction.type = type;
      clearEditMode();
      clearForm();
      dispatchTransactionUpdated();
    } else {
      alert('Transaksi tidak ditemukan. Silakan coba lagi.');
      clearEditMode();
      clearForm();
    }
    return;
  }

  const newTransaction = {
    id: generateId(),
    title,
    amount,
    date,
    type,
  };

  transactions.push(newTransaction);
  clearEditMode();
  clearForm();
  dispatchTransactionUpdated();
});

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  searchKeyword = searchInput.value.trim();
  renderTransactions();
});

searchInput.addEventListener('input', () => {
  searchKeyword = searchInput.value.trim();
  renderTransactions();
});

authForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const username = authUsernameInput.value.trim();
  const password = authPasswordInput.value.trim();

  if (!username || !password) {
    setAuthMessage('Username dan kata sandi wajib diisi.', true);
    return;
  }

  const isAuthenticated = authenticate(username, password);
  if (isAuthenticated) {
    loadUserTransactions();
    resetAuthForm();
    showTrackerApp();
    renderTransactions();
  }
});

toggleAuthModeButton.addEventListener('click', () => {
  setAuthMode(authMode === 'login' ? 'register' : 'login');
});

monthSelect.addEventListener('change', () => {
  selectedMonth = Number(monthSelect.value);
  renderTransactions();
});

yearSelect.addEventListener('change', () => {
  selectedYear = Number(yearSelect.value);
  renderTransactions();
});

logoutButton.addEventListener('click', () => {
  handleLogout();
});

initAuth();
