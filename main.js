const transactions = JSON.parse(localStorage.getItem('transactions')) || [];

const generateId = () => +new Date();

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

const updateDashboard = () => {
  const totals = transactions.reduce(
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

  const balance = totals.income - totals.expense;

  incomeAmount.textContent = `Rp ${totals.income.toLocaleString('id-ID')}`;

  function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  expenseAmount.textContent = `Rp ${totals.expense.toLocaleString('id-ID')}`;
  balanceAmount.textContent = `Rp ${balance.toLocaleString('id-ID')}`;
};

const dispatchTransactionUpdated = () => {
  document.dispatchEvent(new Event('transaction:updated'));
};

document.addEventListener('transaction:updated', () => {
  saveTransactions();
  renderTransactions();
});

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
  const transaction = transactions.find((item) => item.id === id);
  if (transaction) {
    transaction.type = transaction.type === 'income' ? 'expense' : 'income';
    dispatchTransactionUpdated();
  }
};

let currentEditingId = null;

const setEditMode = (transaction) => {
  currentEditingId = transaction.id;
  titleInput.value = transaction.title;
  amountInput.value = transaction.amount;
  dateInput.value = transaction.date;
  typeSelect.value = transaction.type;
  submitButton.textContent = 'Update';
  titleInput.focus();
};

const clearEditMode = () => {
  currentEditingId = null;
  submitButton.textContent = 'Simpan';
};

const renderTransactions = () => {
  incomeList.innerHTML = '';
  expenseList.innerHTML = '';

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.title.toLowerCase().includes(searchKeyword.toLowerCase()),
  );

  filteredTransactions.forEach((transaction) => {
    const card = document.createElement('article');
    card.className = 'transaction-card';
    card.setAttribute('data-testid', 'transactionItem');

    const title = document.createElement('h3');
    title.textContent = transaction.title;
    title.setAttribute('data-testid', 'transactionItemTitle');

    const amount = document.createElement('p');
    amount.textContent = `Nominal: Rp ${transaction.amount.toLocaleString('id-ID')}`;
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

  updateDashboard();
};

const transactionForm = document.getElementById('transactionForm');
const titleInput = document.getElementById('transactionFormTitleInput');
const amountInput = document.getElementById('transactionFormAmountInput');
const dateInput = document.getElementById('transactionFormDateInput');
const typeSelect = document.getElementById('transactionFormTypeSelect');
const submitButton = document.getElementById('transactionFormSubmitButton');

const saveTransactions = () => {
  localStorage.setItem('transactions', JSON.stringify(transactions));
};

const clearForm = () => {
  titleInput.value = '';
  amountInput.value = '';
  dateInput.value = '';
  typeSelect.value = 'income';
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

renderTransactions();
