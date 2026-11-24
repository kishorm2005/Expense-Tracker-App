
// =====================================
// VAULT - PERSONAL FINANCE DASHBOARD
// =====================================

const form = document.getElementById("transaction-form");

const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expenseElement = document.getElementById("expense");
const savingsRateElement = document.getElementById("savingsRate");

const transactionsList = document.getElementById("transactions-list");
const todayElement = document.getElementById("today");

const goalPercent = document.getElementById("goal-percent");
const goalProgress = document.getElementById("goal-progress");
const goalAmount = document.getElementById("goal-amount");

const categoryLegend = document.getElementById("category-legend");

const GOAL_TARGET = 50000;

const chartColors = [
    "#00d6a0",
    "#4895ff",
    "#ff657c",
    "#ffcb65",
    "#9875ff",
    "#e879f9",
    "#a3e635",
    "#94a3b8"
];

// =====================================
// LOAD SAVED TRANSACTIONS
// =====================================

let transactions = [];

try {
    const saved = JSON.parse(localStorage.getItem("transactions"));

    transactions = Array.isArray(saved) ? saved : [];
} catch (error) {
    transactions = [];
}

// Support transactions saved by the previous version.
transactions = transactions.map(item => {
    let dateISO = item.dateISO;

    if (!dateISO && item.date) {
        const parts = item.date.split("/");

        if (parts.length === 3) {
            const parsedDate = new Date(
                Number(parts[2]),
                Number(parts[1]) - 1,
                Number(parts[0])
            );

            dateISO = parsedDate.toISOString();
        }
    }

    if (!dateISO || Number.isNaN(Date.parse(dateISO))) {
        dateISO = new Date().toISOString();
    }

    return {
        ...item,
        id: String(item.id || Date.now() + Math.random()),
        amount: Number(item.amount) || 0,
        type: item.type === "income" ? "income" : "expense",
        category: item.category || "Other",
        dateISO: dateISO,
        date: item.date || new Date(dateISO).toLocaleDateString("en-IN")
    };
});


// =====================================
// GENERAL FUNCTIONS
// =====================================

function formatMoney(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(amount);
}

function getTransactionDate(item) {
    return new Date(item.dateISO);
}

function saveTransactions() {
    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}

todayElement.textContent = new Date().toLocaleDateString(
    "en-IN",
    {
        day: "numeric",
        month: "short",
        year: "numeric"
    }
);


// =====================================
// CHART CONFIGURATION
// =====================================

Chart.defaults.color = "#8589a5";
Chart.defaults.font.family = "Inter, sans-serif";


// CASH FLOW LINE CHART

const cashFlowChart = new Chart(
    document.getElementById("cashFlowChart"),
    {
        type: "line",

        data: {
            labels: [
                "Jan", "Feb", "Mar", "Apr",
                "May", "Jun", "Jul", "Aug",
                "Sep", "Oct", "Nov", "Dec"
            ],

            datasets: [
                {
                    label: "Income",
                    data: Array(12).fill(0),

                    borderColor: "#00d6a0",
                    backgroundColor: "rgba(0,214,160,0.12)",

                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,

                    pointRadius: 2,
                    pointHoverRadius: 5
                },

                {
                    label: "Expenses",
                    data: Array(12).fill(0),

                    borderColor: "#ff657c",
                    backgroundColor: "rgba(255,101,124,0.08)",

                    borderWidth: 2,
                    tension: 0.4,
                    fill: false,

                    pointRadius: 2,
                    pointHoverRadius: 5
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            interaction: {
                intersect: false,
                mode: "index"
            },

            plugins: {
                legend: {
                    display: false
                }
            },

            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                },

                y: {
                    beginAtZero: true,

                    grid: {
                        color: "rgba(255,255,255,0.06)"
                    },

                    border: {
                        display: false
                    },

                    ticks: {
                        callback: value => {
                            return "₹" + value.toLocaleString("en-IN");
                        }
                    }
                }
            }
        }
    }
);


// SPENDING DOUGHNUT CHART

const spendingChart = new Chart(
    document.getElementById("spendingChart"),
    {
        type: "doughnut",

        data: {
            labels: [],
            datasets: [
                {
                    data: [],
                    backgroundColor: chartColors,
                    borderWidth: 0,
                    hoverOffset: 7
                }
            ]
        },

        options: {
            responsive: true,
            maintainAspectRatio: false,

            cutout: "72%",

            plugins: {
                legend: {
                    display: false
                }
            }
        }
    }
);


// =====================================
// UPDATE SUMMARY CARDS
// =====================================

function updateDashboard() {
    const totalIncome = transactions
        .filter(item => item.type === "income")
        .reduce((sum, item) => sum + item.amount, 0);

    const totalExpense = transactions
        .filter(item => item.type === "expense")
        .reduce((sum, item) => sum + item.amount, 0);

    const balance = totalIncome - totalExpense;

    const now = new Date();

    const monthlyIncome = transactions
        .filter(item => {
            const date = getTransactionDate(item);

            return item.type === "income" &&
                date.getMonth() === now.getMonth() &&
                date.getFullYear() === now.getFullYear();
        })
        .reduce((sum, item) => sum + item.amount, 0);

    const savingsRate = totalIncome > 0
        ? Math.max(0, (balance / totalIncome) * 100)
        : 0;

    balanceElement.textContent = formatMoney(balance);

    incomeElement.textContent = formatMoney(monthlyIncome);

    expenseElement.textContent = formatMoney(totalExpense);

    savingsRateElement.textContent =
        Math.round(savingsRate) + "%";

    updateSavingsGoal(balance);
}


// =====================================
// UPDATE SAVINGS GOAL
// =====================================

function updateSavingsGoal(balance) {
    const savedAmount = Math.max(0, balance);

    const percentage = Math.min(
        100,
        (savedAmount / GOAL_TARGET) * 100
    );

    goalPercent.textContent = Math.round(percentage) + "%";

    goalProgress.style.width = percentage + "%";

    goalAmount.textContent =
        formatMoney(savedAmount) +
        " saved of " +
        formatMoney(GOAL_TARGET);
}


// =====================================
// UPDATE CASH FLOW GRAPH
// =====================================

function updateCashFlowChart() {
    const incomeData = Array(12).fill(0);
    const expenseData = Array(12).fill(0);

    const currentYear = new Date().getFullYear();

    transactions.forEach(item => {
        const date = getTransactionDate(item);

        if (date.getFullYear() !== currentYear) {
            return;
        }

        const month = date.getMonth();

        if (item.type === "income") {
            incomeData[month] += item.amount;
        } else {
            expenseData[month] += item.amount;
        }
    });

    cashFlowChart.data.datasets[0].data = incomeData;
    cashFlowChart.data.datasets[1].data = expenseData;

    cashFlowChart.update();
}


// =====================================
// UPDATE SPENDING CHART
// =====================================

function updateSpendingChart() {
    const categoryTotals = {};

    transactions
        .filter(item => item.type === "expense")
        .forEach(item => {
            categoryTotals[item.category] =
                (categoryTotals[item.category] || 0) +
                item.amount;
        });

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

    spendingChart.data.labels = labels;
    spendingChart.data.datasets[0].data = values;

    spendingChart.update();

    // Create category legend

    categoryLegend.replaceChildren();

    if (labels.length === 0) {
        const message = document.createElement("p");

        message.textContent = "No spending data yet.";
        message.style.color = "#8589a5";
        message.style.fontSize = "10px";

        categoryLegend.appendChild(message);
        return;
    }

    labels.forEach((label, index) => {
        const item = document.createElement("div");
        item.className = "category-item";

        const color = document.createElement("span");
        color.className = "category-color";
        color.style.backgroundColor =
            chartColors[index % chartColors.length];

        const name = document.createElement("span");
        name.textContent = label;

        const amount = document.createElement("strong");
        amount.textContent = formatMoney(values[index]);

        item.append(color, name, amount);

        categoryLegend.appendChild(item);
    });
}


// =====================================
// DISPLAY TRANSACTIONS
// =====================================

function displayTransactions() {
    transactionsList.replaceChildren();

    if (transactions.length === 0) {
        const message = document.createElement("p");

        message.className = "empty-message";
        message.textContent =
            "No transactions yet. Add your first transaction.";

        transactionsList.appendChild(message);
        return;
    }

    const recentTransactions = [...transactions]
        .sort((a, b) =>
            getTransactionDate(b) - getTransactionDate(a)
        )
        .slice(0, 10);

    recentTransactions.forEach(item => {
        const card = document.createElement("div");
        card.className = "transaction-item";

        const details = document.createElement("div");

        const name = document.createElement("h3");
        name.textContent = item.title;

        const category = document.createElement("p");
        category.textContent =
            item.category + " • " + item.date;

        details.append(name, category);

        const rightSide = document.createElement("div");

        const amount = document.createElement("span");

        amount.className = item.type;

        amount.textContent =
            (item.type === "income" ? "+" : "-") +
            formatMoney(item.amount);

        const deleteButton = document.createElement("button");

        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", () => {
            deleteTransaction(item.id);
        });

        rightSide.append(amount, deleteButton);

        card.append(details, rightSide);

        transactionsList.appendChild(card);
    });
}


// =====================================
// ADD NEW TRANSACTION
// =====================================

function addTransaction(event) {
    event.preventDefault();

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);

    if (
        !title ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        alert("Please enter a valid transaction.");
        return;
    }

    const now = new Date();

    const transaction = {
        id: Date.now().toString() +
            Math.random().toString(16).slice(2),

        title: title,
        amount: amount,
        type: typeInput.value,
        category: categoryInput.value,

        date: now.toLocaleDateString("en-IN"),
        dateISO: now.toISOString()
    };

    transactions.push(transaction);

    saveTransactions();

    refreshApp();

    form.reset();
}


// =====================================
// DELETE TRANSACTION
// =====================================

function deleteTransaction(id) {
    transactions = transactions.filter(
        item => item.id !== id
    );

    saveTransactions();

    refreshApp();
}


// =====================================
// REFRESH COMPLETE DASHBOARD
// =====================================

function refreshApp() {
    updateDashboard();

    updateCashFlowChart();

    updateSpendingChart();

    displayTransactions();
}


// =====================================
// FORM EVENT
// =====================================

form.addEventListener("submit", addTransaction);


// =====================================
// START APPLICATION
// =====================================

saveTransactions();

refreshApp();
