/**
 * ==========================================================================
 * SpendWise – Smart Expense Tracker
 * Pure Vanilla JavaScript Application Logic
 * ==========================================================================
 */

// Global Storage Keys
const STORAGE_KEY = 'spendwise_app_state_v1';

// Category Definitions with Icons
const CATEGORIES = {
    'Food': { icon: '🍔', label: 'Food & Dining', color: 'var(--cat-food)' },
    'Education': { icon: '🎓', label: 'Education & College', color: 'var(--cat-education)' },
    'Travel': { icon: '✈️', label: 'Travel & Transit', color: 'var(--cat-travel)' },
    'Shopping': { icon: '🛍️', label: 'Shopping & Personal', color: 'var(--cat-shopping)' },
    'Entertainment': { icon: '🎬', label: 'Entertainment', color: 'var(--cat-entertainment)' },
    'Bills': { icon: '📄', label: 'Bills & Utilities', color: 'var(--cat-bills)' },
    'Health': { icon: '🏥', label: 'Health & Medical', color: 'var(--cat-health)' },
    'Other': { icon: '📦', label: 'Other', color: 'var(--cat-other)' }
};

// Application State Object
let state = {
    transactions: [],
    budget: 10000,
    theme: 'light',
    editingId: null,
    filters: {
        search: '',
        type: 'all',
        category: 'all',
        sortBy: 'newest'
    },
    viewLimit: 5 // Default limit 5 transactions on main view
};

/* --------------------------------------------------------------------------
   1. Initialization & LocalStorage Management
   -------------------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    // 1. Load persisted data or initial sample data
    loadFromLocalStorage();

    // 2. Set default date picker to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // 3. Attach Event Listeners
    setupEventListeners();

    // 4. Initial UI Render
    renderApp();
}

/**
 * Loads data from localStorage. If empty, seeds initial sample data.
 */
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const parsed = JSON.parse(savedData);
            state.transactions = parsed.transactions || [];
            state.budget = parsed.budget !== undefined ? Number(parsed.budget) : 10000;
            state.theme = parsed.theme || 'light';
        } else {
            // Pre-populate realistic initial sample data for students
            state.transactions = getSampleTransactions();
            state.budget = 10000;
            state.theme = 'light';
            saveToLocalStorage();
        }
    } catch (e) {
        console.error('Error reading from localStorage:', e);
        state.transactions = getSampleTransactions();
        state.budget = 10000;
    }

    // Apply stored theme
    document.documentElement.setAttribute('data-theme', state.theme);
}

/**
 * Saves state object to browser localStorage.
 */
function saveToLocalStorage() {
    try {
        const dataToSave = {
            transactions: state.transactions,
            budget: state.budget,
            theme: state.theme
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
        showNotification('Failed to save data locally', 'danger');
    }
}

/**
 * Returns dynamic sample transactions with current month dates.
 */
function getSampleTransactions() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');

    return [
        {
            id: 'tx-1',
            type: 'income',
            amount: 15000,
            description: 'Monthly Allowance / Scholarship',
            category: 'Education',
            date: `${year}-${month}-01`,
            note: 'Parental stipend'
        },
        {
            id: 'tx-2',
            type: 'expense',
            amount: 1850,
            description: 'Semester Books & Stationery',
            category: 'Education',
            date: `${year}-${month}-03`,
            note: 'Reference guides'
        },
        {
            id: 'tx-3',
            type: 'expense',
            amount: 2400,
            description: 'Monthly Mess & Supermarket Grocery',
            category: 'Food',
            date: `${year}-${month}-05`,
            note: 'Daily supplies'
        },
        {
            id: 'tx-4',
            type: 'expense',
            amount: 850,
            description: 'Hostel Wifi & Electricity Bill',
            category: 'Bills',
            date: `${year}-${month}-10`,
            note: 'High-speed fiber'
        },
        {
            id: 'tx-5',
            type: 'expense',
            amount: 650,
            description: 'Weekend Cinema & Snack Treat',
            category: 'Entertainment',
            date: `${year}-${month}-14`,
            note: 'Outing with roommates'
        }
    ];
}

/* --------------------------------------------------------------------------
   2. Event Listeners Setup
   -------------------------------------------------------------------------- */

function setupEventListeners() {
    // Form submission
    const form = document.getElementById('transaction-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Clear form button
    const clearBtn = document.getElementById('clear-form-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    }

    // Cancel edit button
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', cancelEdit);
    }

    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleDarkMode);
    }

    // Reset sample data button
    const resetBtn = document.getElementById('reset-data-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', handleResetData);
    }

    // Budget modal open / close buttons
    const openBudgetBtn = document.getElementById('open-budget-modal-btn');
    const closeBudgetBtn = document.getElementById('close-budget-modal-btn');
    const cancelBudgetBtn = document.getElementById('cancel-budget-modal-btn');
    const budgetForm = document.getElementById('budget-form');
    const budgetModal = document.getElementById('budget-modal');

    if (openBudgetBtn) openBudgetBtn.addEventListener('click', openBudgetModal);
    if (closeBudgetBtn) closeBudgetBtn.addEventListener('click', closeBudgetModal);
    if (cancelBudgetBtn) cancelBudgetBtn.addEventListener('click', closeBudgetModal);
    if (budgetForm) budgetForm.addEventListener('submit', handleBudgetSubmit);

    // Close modal when clicking outside overlay
    if (budgetModal) {
        budgetModal.addEventListener('click', (e) => {
            if (e.target === budgetModal) closeBudgetModal();
        });
    }

    // Search and Filter Listeners
    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const filterType = document.getElementById('filter-type');
    const filterCategory = document.getElementById('filter-category');
    const sortBy = document.getElementById('sort-by');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.filters.search = e.target.value.trim().toLowerCase();
            if (searchClearBtn) {
                searchClearBtn.style.display = state.filters.search ? 'block' : 'none';
            }
            renderTransactions();
        });
    }

    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            state.filters.search = '';
            searchClearBtn.style.display = 'none';
            renderTransactions();
        });
    }

    if (filterType) {
        filterType.addEventListener('change', (e) => {
            state.filters.type = e.target.value;
            renderTransactions();
        });
    }

    if (filterCategory) {
        filterCategory.addEventListener('change', (e) => {
            state.filters.category = e.target.value;
            renderTransactions();
        });
    }

    if (sortBy) {
        sortBy.addEventListener('change', (e) => {
            state.filters.sortBy = e.target.value;
            renderTransactions();
        });
    }

    // View All / View Recent Toggle Button
    const viewToggleBtn = document.getElementById('view-toggle-btn');
    if (viewToggleBtn) {
        viewToggleBtn.addEventListener('click', () => {
            if (state.viewLimit === 5) {
                state.viewLimit = 'all';
                viewToggleBtn.textContent = 'Show Recent (5)';
            } else {
                state.viewLimit = 5;
                viewToggleBtn.textContent = 'View All';
            }
            renderTransactions();
        });
    }

    // Empty state quick add button
    const emptyAddBtn = document.getElementById('empty-add-btn');
    if (emptyAddBtn) {
        emptyAddBtn.addEventListener('click', () => {
            document.getElementById('amount')?.focus();
        });
    }

    // Section Navigation Tabs
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            navButtons.forEach(b => b.classList.remove('active'));
            const target = btn.getAttribute('data-target');
            btn.classList.add('active');

            if (target) {
                const element = document.getElementById(target);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });
}

/* --------------------------------------------------------------------------
   3. Core CRUD Functions (Add, Edit, Delete, Clear)
   -------------------------------------------------------------------------- */

function handleFormSubmit(e) {
    e.preventDefault();

    // Perform Form Validation
    if (!validateForm()) {
        showNotification('Please correct the highlighted form errors.', 'warning');
        return;
    }

    const type = document.querySelector('input[name="type"]:checked')?.value || 'expense';
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const description = document.getElementById('description').value.trim();
    const date = document.getElementById('date').value;
    const note = document.getElementById('note').value.trim();

    if (state.editingId) {
        // Edit Mode: Update existing transaction
        const index = state.transactions.findIndex(t => t.id === state.editingId);
        if (index !== -1) {
            state.transactions[index] = {
                id: state.editingId,
                type,
                amount,
                category,
                description,
                date,
                note
            };
            showNotification('Transaction updated successfully! ✏️', 'success');
        }
        cancelEdit();
    } else {
        // Add Mode: Insert new transaction
        const newTransaction = {
            id: 'tx-' + Date.now(),
            type,
            amount,
            category,
            description,
            date,
            note
        };
        state.transactions.unshift(newTransaction);
        showNotification('Transaction added successfully! 💰', 'success');
        clearForm();
    }

    saveToLocalStorage();
    renderApp();
}

/**
 * Validates form inputs and shows/hides error messages.
 */
function validateForm() {
    let isValid = true;

    const amountInput = document.getElementById('amount');
    const categorySelect = document.getElementById('category');
    const descInput = document.getElementById('description');
    const dateInput = document.getElementById('date');

    // Amount validation
    const amountVal = parseFloat(amountInput.value);
    if (isNaN(amountVal) || amountVal <= 0) {
        showFieldError(amountInput, 'amount-error');
        isValid = false;
    } else {
        clearFieldError(amountInput, 'amount-error');
    }

    // Category validation
    if (!categorySelect.value) {
        showFieldError(categorySelect, 'category-error');
        isValid = false;
    } else {
        clearFieldError(categorySelect, 'category-error');
    }

    // Description validation
    if (!descInput.value.trim()) {
        showFieldError(descInput, 'description-error');
        isValid = false;
    } else {
        clearFieldError(descInput, 'description-error');
    }

    // Date validation
    if (!dateInput.value) {
        showFieldError(dateInput, 'date-error');
        isValid = false;
    } else {
        clearFieldError(dateInput, 'date-error');
    }

    return isValid;
}

function showFieldError(inputEl, errorMsgId) {
    const parent = inputEl.closest('.form-group');
    if (parent) parent.classList.add('has-error');
}

function clearFieldError(inputEl, errorMsgId) {
    const parent = inputEl.closest('.form-group');
    if (parent) parent.classList.remove('has-error');
}

/**
 * Populates form fields to enter edit mode for a given transaction ID.
 */
function editTransaction(id) {
    const item = state.transactions.find(t => t.id === id);
    if (!item) return;

    state.editingId = id;

    // Set Radio Type
    if (item.type === 'income') {
        document.getElementById('type-income').checked = true;
    } else {
        document.getElementById('type-expense').checked = true;
    }

    document.getElementById('transaction-id').value = item.id;
    document.getElementById('amount').value = item.amount;
    document.getElementById('category').value = item.category;
    document.getElementById('description').value = item.description;
    document.getElementById('date').value = item.date;
    document.getElementById('note').value = item.note || '';

    // Update UI headers & buttons
    document.getElementById('form-title').textContent = '✏️ Edit Transaction';
    document.getElementById('submit-btn').textContent = 'Update Transaction';
    document.getElementById('cancel-edit-btn').style.display = 'inline-block';

    // Scroll form into view smoothly
    document.getElementById('form-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Resets form and exits edit mode.
 */
function cancelEdit() {
    state.editingId = null;
    clearForm();
    document.getElementById('form-title').textContent = '➕ Add New Transaction';
    document.getElementById('submit-btn').textContent = 'Save Transaction';
    document.getElementById('cancel-edit-btn').style.display = 'none';
}

/**
 * Resets all input fields and clears error states.
 */
function clearForm() {
    document.getElementById('transaction-form').reset();
    document.getElementById('transaction-id').value = '';
    document.getElementById('type-expense').checked = true;

    // Reset date to today
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Clear error classes
    document.querySelectorAll('.form-group').forEach(group => group.classList.remove('has-error'));
}

/**
 * Deletes a transaction by ID.
 */
function deleteTransaction(id) {
    const item = state.transactions.find(t => t.id === id);
    if (!item) return;

    if (confirm(`Are you sure you want to delete "${item.description}"?`)) {
        state.transactions = state.transactions.filter(t => t.id !== id);

        // If editing the item being deleted, cancel edit
        if (state.editingId === id) {
            cancelEdit();
        }

        saveToLocalStorage();
        renderApp();
        showNotification('Transaction deleted. 🗑️', 'info');
    }
}

/* --------------------------------------------------------------------------
   4. Application Render Engine (Dashboard, List, Analytics, Insights)
   -------------------------------------------------------------------------- */

function renderApp() {
    updateDashboard();
    renderTransactions();
    renderAnalytics();
    generateInsights();
    checkBudgetLimit();
}

/**
 * Calculates summary metrics and updates top dashboard cards.
 */
function updateDashboard() {
    const totalIncome = calculateIncome();
    const totalExpenses = calculateExpenses();
    const balance = totalIncome - totalExpenses;
    const savings = Math.max(0, balance);
    const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0;

    // Format currencies
    document.getElementById('total-balance').textContent = formatCurrency(balance);
    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('monthly-savings').textContent = formatCurrency(savings);

    // Subtext counts
    const incomeItems = state.transactions.filter(t => t.type === 'income').length;
    const expenseItems = state.transactions.filter(t => t.type === 'expense').length;

    document.getElementById('income-count').textContent = `${incomeItems} item${incomeItems === 1 ? '' : 's'}`;
    document.getElementById('expense-count').textContent = `${expenseItems} item${expenseItems === 1 ? '' : 's'}`;
    document.getElementById('savings-rate').textContent = `${savingsRate}% of income saved`;
}

function calculateIncome() {
    return state.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
}

function calculateExpenses() {
    return state.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
}

/**
 * Renders transactions table / cards based on filters and search queries.
 */
function renderTransactions() {
    const tbody = document.getElementById('transactions-tbody');
    const emptyState = document.getElementById('empty-state');
    const showingCount = document.getElementById('tx-showing-count');

    const filtered = filterAndSortTransactions();

    if (showingCount) {
        showingCount.textContent = `Showing ${filtered.length} of ${state.transactions.length} transactions`;
    }

    if (filtered.length === 0) {
        if (tbody) tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Apply view limit (5 for recent, or 'all')
    const listToRender = state.viewLimit === 'all' ? filtered : filtered.slice(0, state.viewLimit);

    let html = '';
    listToRender.forEach(tx => {
        const catInfo = CATEGORIES[tx.category] || { icon: '📦', label: tx.category };
        const isExpense = tx.type === 'expense';
        const typeBadge = isExpense ?
            '<span class="badge-type badge-type-expense">💸 Expense</span>' :
            '<span class="badge-type badge-type-income">💵 Income</span>';

        const amountFormatted = (isExpense ? '- ' : '+ ') + formatCurrency(tx.amount);
        const amountClass = isExpense ? 'amount-expense' : 'amount-income';

        html += `
            <tr id="row-${tx.id}">
                <td>
                    <div class="tx-desc-cell">
                        <span class="tx-desc-title">${escapeHTML(tx.description)}</span>
                        ${tx.note ? `<span class="tx-desc-note">📝 ${escapeHTML(tx.note)}</span>` : ''}
                    </div>
                </td>
                <td>
                    <span class="category-chip">
                        <span>${catInfo.icon}</span> ${catInfo.label}
                    </span>
                </td>
                <td style="white-space: nowrap;">${formatDate(tx.date)}</td>
                <td>${typeBadge}</td>
                <td class="text-right">
                    <span class="tx-amount ${amountClass}">${amountFormatted}</span>
                </td>
                <td class="text-center">
                    <div class="action-btns">
                        <button class="btn-icon-action" onclick="editTransaction('${tx.id}')" title="Edit Transaction">✏️</button>
                        <button class="btn-icon-action btn-delete" onclick="deleteTransaction('${tx.id}')" title="Delete Transaction">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });

    if (tbody) tbody.innerHTML = html;
}

/**
 * Filters and sorts transactions array based on active filter state.
 */
function filterAndSortTransactions() {
    let result = [...state.transactions];

    // Filter by type
    if (state.filters.type !== 'all') {
        result = result.filter(t => t.type === state.filters.type);
    }

    // Filter by category
    if (state.filters.category !== 'all') {
        result = result.filter(t => t.category === state.filters.category);
    }

    // Filter by search keyword
    if (state.filters.search) {
        const q = state.filters.search;
        result = result.filter(t =>
            t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            (t.note && t.note.toLowerCase().includes(q))
        );
    }

    // Sort result
    result.sort((a, b) => {
        if (state.filters.sortBy === 'newest') {
            return new Date(b.date) - new Date(a.date);
        } else if (state.filters.sortBy === 'oldest') {
            return new Date(a.date) - new Date(b.date);
        } else if (state.filters.sortBy === 'amount-high') {
            return Number(b.amount) - Number(a.amount);
        } else if (state.filters.sortBy === 'amount-low') {
            return Number(a.amount) - Number(b.amount);
        }
        return 0;
    });

    return result;
}

/* --------------------------------------------------------------------------
   5. Budget Monitor & Threshold Alerts
   -------------------------------------------------------------------------- */

function openBudgetModal() {
    const modal = document.getElementById('budget-modal');
    const input = document.getElementById('budget-input');
    if (input) input.value = state.budget;
    if (modal) modal.classList.add('active');
}

function closeBudgetModal() {
    const modal = document.getElementById('budget-modal');
    if (modal) modal.classList.remove('active');
}

function handleBudgetSubmit(e) {
    e.preventDefault();
    const val = parseFloat(document.getElementById('budget-input').value);
    if (isNaN(val) || val < 100) {
        showNotification('Please enter a valid budget limit (minimum ₹100).', 'warning');
        return;
    }

    state.budget = val;
    saveToLocalStorage();
    closeBudgetModal();
    renderApp();
    showNotification(`Monthly budget updated to ${formatCurrency(val)}! 🎯`, 'success');
}

/**
 * Checks budget consumption, updates progress bar, and emits alerts.
 */
function checkBudgetLimit() {
    const totalExpenses = calculateExpenses();
    const budget = state.budget;
    const remaining = budget - totalExpenses;
    const percentage = budget > 0 ? Math.min(100, Math.round((totalExpenses / budget) * 100)) : 0;

    document.getElementById('budget-limit-val').textContent = formatCurrency(budget);
    document.getElementById('budget-spent-val').textContent = formatCurrency(totalExpenses);
    
    const remEl = document.getElementById('budget-remaining-val');
    remEl.textContent = formatCurrency(remaining);
    if (remaining < 0) {
        remEl.style.color = 'var(--accent-expense)';
    } else {
        remEl.style.color = 'var(--accent-income)';
    }

    const percentageText = document.getElementById('budget-percentage-text');
    const fillEl = document.getElementById('budget-progress-fill');
    const badgeEl = document.getElementById('budget-status-badge');

    if (percentageText) percentageText.textContent = `${percentage}% of budget used`;
    if (fillEl) {
        fillEl.style.width = `${percentage}%`;
        fillEl.classList.remove('fill-warning', 'fill-danger');
    }

    if (badgeEl) {
        badgeEl.classList.remove('badge-success', 'badge-warning', 'badge-danger');
        if (percentage >= 100) {
            badgeEl.textContent = 'Budget Exceeded!';
            badgeEl.classList.add('badge-danger');
            if (fillEl) fillEl.classList.add('fill-danger');
        } else if (percentage >= 90) {
            badgeEl.textContent = '🚨 High Risk (90%+)';
            badgeEl.classList.add('badge-danger');
            if (fillEl) fillEl.classList.add('fill-danger');
        } else if (percentage >= 75) {
            badgeEl.textContent = '⚠️ Warning (75%+)';
            badgeEl.classList.add('badge-warning');
            if (fillEl) fillEl.classList.add('fill-warning');
        } else {
            badgeEl.textContent = 'On Track';
            badgeEl.classList.add('badge-success');
        }
    }
}

/* --------------------------------------------------------------------------
   6. Expense Analytics & Visual Charts (Pure Vanilla HTML/CSS/SVG)
   -------------------------------------------------------------------------- */

function renderAnalytics() {
    renderCategoryBreakdown();
    renderSpendingTrendChart();
    renderMonthlyStats();
}

/**
 * Builds Category Expense Breakdown progress bars.
 */
function renderCategoryBreakdown() {
    const container = document.getElementById('category-bars-container');
    if (!container) return;

    const expenses = state.transactions.filter(t => t.type === 'expense');
    const totalExpenseSum = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    if (totalExpenseSum === 0) {
        container.innerHTML = '<p class="text-muted" style="text-align: center; padding: 20px;">No expense data available yet.</p>';
        return;
    }

    // Group expenses by category
    const catTotals = {};
    expenses.forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount);
    });

    // Sort categories descending by amount
    const sortedCats = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);

    let html = '';
    sortedCats.forEach(cat => {
        const amt = catTotals[cat];
        const percent = Math.round((amt / totalExpenseSum) * 100);
        const info = CATEGORIES[cat] || { icon: '📦', label: cat, color: 'var(--accent-primary)' };

        html += `
            <div class="cat-bar-item">
                <div class="cat-bar-header">
                    <span class="cat-bar-name">${info.icon} ${info.label}</span>
                    <span class="cat-bar-val">${formatCurrency(amt)} (${percent}%)</span>
                </div>
                <div class="cat-progress-track">
                    <div class="cat-progress-fill" style="width: ${percent}%; background-color: ${info.color};"></div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

/**
 * Builds dynamic Weekly Spending Trend SVG Bar/Line Chart.
 */
function renderSpendingTrendChart() {
    const chartContainer = document.getElementById('chart-container');
    if (!chartContainer) return;

    const expenses = state.transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) {
        chartContainer.innerHTML = '<p class="text-muted">No expense data available for chart.</p>';
        return;
    }

    // Group by day for the last 7 entries or dates
    const dailyTotals = {};
    const dates = [];

    // Get last 7 unique dates or past 7 days
    expenses.forEach(t => {
        const d = t.date;
        dailyTotals[d] = (dailyTotals[d] || 0) + Number(t.amount);
    });

    const sortedDates = Object.keys(dailyTotals).sort((a, b) => new Date(a) - new Date(b)).slice(-7);

    if (sortedDates.length === 0) {
        chartContainer.innerHTML = '<p class="text-muted">Insufficient data for chart.</p>';
        return;
    }

    const maxVal = Math.max(...sortedDates.map(d => dailyTotals[d]), 1);

    // Build SVG Chart
    const svgWidth = 320;
    const svgHeight = 180;
    const padding = 30;
    const chartW = svgWidth - padding * 2;
    const chartH = svgHeight - padding * 2;

    const barWidth = Math.min(30, chartW / sortedDates.length - 10);
    const stepX = chartW / sortedDates.length;

    let barsHTML = '';
    let labelsHTML = '';

    sortedDates.forEach((dateStr, i) => {
        const val = dailyTotals[dateStr];
        const barH = (val / maxVal) * chartH;
        const x = padding + i * stepX + (stepX - barWidth) / 2;
        const y = svgHeight - padding - barH;

        // Date label formatting (e.g. "14 Aug")
        const dateObj = new Date(dateStr);
        const dayLabel = `${dateObj.getDate()} ${dateObj.toLocaleString('default', { month: 'short' })}`;

        barsHTML += `
            <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="var(--accent-primary)" opacity="0.85">
                <title>${dayLabel}: ${formatCurrency(val)}</title>
            </rect>
            <text x="${x + barWidth / 2}" y="${y - 6}" font-size="10" font-weight="bold" fill="var(--text-primary)" text-anchor="middle">₹${val}</text>
        `;

        labelsHTML += `
            <text x="${x + barWidth / 2}" y="${svgHeight - 10}" font-size="10" fill="var(--text-muted)" text-anchor="middle">${dayLabel}</text>
        `;
    });

    const svgHTML = `
        <svg class="svg-chart" viewBox="0 0 ${svgWidth} ${svgHeight}">
            <!-- Grid Line -->
            <line x1="${padding}" y1="${svgHeight - padding}" x2="${svgWidth - padding}" y2="${svgHeight - padding}" stroke="var(--border-color)" stroke-width="1" />
            ${barsHTML}
            ${labelsHTML}
        </svg>
    `;

    chartContainer.innerHTML = svgHTML;
}

/**
 * Calculates and displays summary stats in the analytics section.
 */
function renderMonthlyStats() {
    const expenses = state.transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);

    // 1. Month spend
    document.getElementById('stat-month-spend').textContent = formatCurrency(totalExpenses);

    // 2. Highest category
    const catTotals = {};
    expenses.forEach(t => {
        catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount);
    });

    let topCat = 'None';
    let maxCatAmt = 0;
    Object.keys(catTotals).forEach(cat => {
        if (catTotals[cat] > maxCatAmt) {
            maxCatAmt = catTotals[cat];
            topCat = cat;
        }
    });

    const topCatInfo = CATEGORIES[topCat];
    document.getElementById('stat-top-category').textContent = topCatInfo ? `${topCatInfo.icon} ${topCat}` : topCat;

    // 3. Average daily spending
    const today = new Date();
    const daysPassed = Math.max(1, today.getDate());
    const dailyAvg = totalExpenses / daysPassed;
    document.getElementById('stat-daily-avg').textContent = `${formatCurrency(dailyAvg)} / day`;

    // 4. Total transactions count
    document.getElementById('stat-total-count').textContent = `${state.transactions.length} items`;

    // 5. Savings
    const totalIncome = calculateIncome();
    const netSavings = Math.max(0, totalIncome - totalExpenses);
    document.getElementById('stat-savings-val').textContent = formatCurrency(netSavings);
}

/* --------------------------------------------------------------------------
   7. Smart Insights Generator
   -------------------------------------------------------------------------- */

function generateInsights() {
    const container = document.getElementById('insights-container');
    if (!container) return;

    const expenses = state.transactions.filter(t => t.type === 'expense');
    const totalExpenses = expenses.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalIncome = calculateIncome();
    const savings = totalIncome - totalExpenses;

    const insights = [];

    // Insight 1: Highest spending category
    if (expenses.length > 0) {
        const catTotals = {};
        expenses.forEach(t => {
            catTotals[t.category] = (catTotals[t.category] || 0) + Number(t.amount);
        });

        let topCat = '';
        let maxAmt = 0;
        Object.keys(catTotals).forEach(c => {
            if (catTotals[c] > maxAmt) {
                maxAmt = catTotals[c];
                topCat = c;
            }
        });

        if (topCat) {
            const catInfo = CATEGORIES[topCat] || { icon: '📦' };
            insights.push({
                icon: catInfo.icon,
                text: `You spent the most on <strong>${topCat}</strong> (${formatCurrency(maxAmt)}) this month.`
            });
        }
    } else {
        insights.push({
            icon: '✨',
            text: 'Add your first expense transaction to view category insights.'
        });
    }

    // Insight 2: Budget status message
    const budgetPct = state.budget > 0 ? Math.round((totalExpenses / state.budget) * 100) : 0;
    if (budgetPct >= 100) {
        insights.push({
            icon: '🚨',
            text: `<strong>Budget Exceeded!</strong> You have spent ${formatCurrency(totalExpenses - state.budget)} over your monthly limit.`
        });
    } else if (budgetPct >= 90) {
        insights.push({
            icon: '⚠️',
            text: `<strong>High Warning!</strong> You have used <strong>${budgetPct}%</strong> of your monthly budget.`
        });
    } else {
        insights.push({
            icon: '✅',
            text: `Great job! You are within your monthly budget (${budgetPct}% used).`
        });
    }

    // Insight 3: Savings tip / metric
    if (savings > 0) {
        insights.push({
            icon: '🎉',
            text: `Great! You saved <strong>${formatCurrency(savings)}</strong> so far this month.`
        });
    } else if (totalExpenses > totalIncome && totalIncome > 0) {
        insights.push({
            icon: '⚠️',
            text: `Your expenses exceed your income by <strong>${formatCurrency(totalExpenses - totalIncome)}</strong>.`
        });
    } else {
        insights.push({
            icon: '💡',
            text: 'Track recurring student bills like books & mess to optimize savings.'
        });
    }

    let html = '';
    insights.forEach(item => {
        html += `
            <div class="insight-card">
                <span class="insight-icon">${item.icon}</span>
                <span class="insight-text">${item.text}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

/* --------------------------------------------------------------------------
   8. Helper Functions (Theme, Notification, Formatting, Escaping)
   -------------------------------------------------------------------------- */

function toggleDarkMode() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    saveToLocalStorage();
    showNotification(`Switched to ${state.theme === 'dark' ? 'Dark' : 'Light'} Mode 🌓`, 'info');
}

function handleResetData() {
    if (confirm('Reset application data to original sample transactions? All current custom items will be overwritten.')) {
        state.transactions = getSampleTransactions();
        state.budget = 10000;
        saveToLocalStorage();
        cancelEdit();
        renderApp();
        showNotification('Application state reset to default sample data! 🔄', 'info');
    }
}

/**
 * Creates animated toast notifications.
 * @param {string} message - Message text
 * @param {'success'|'warning'|'danger'|'info'} type - Severity class
 */
function showNotification(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '✅',
        warning: '⚠️',
        danger: '🚨',
        info: 'ℹ️'
    };

    toast.innerHTML = `
        <span>${icons[type] || 'ℹ️'}</span>
        <span class="toast-message">${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    // Auto remove after 3.5 seconds
    setTimeout(() => {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3500);
}

function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return '₹' + num.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
