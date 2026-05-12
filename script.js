class Watch {
    constructor(id, name, price, quantity) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.quantity = quantity;
        this.soldQty = 0;
    }
}

let watches = [];
let currentUser = null;

// Load data from localStorage
function loadData() {
    const data = localStorage.getItem('titanWatches');
    if (data) {
        watches = JSON.parse(data).map(w => Object.assign(new Watch(), w));
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('titanWatches', JSON.stringify(watches));
}

// Check low stock
function checkLowStock(watch) {
    if (watch.quantity < 5) {
        alert(`⚠️ Low Stock Alert! ${watch.name} has only ${watch.quantity} units left.`);
    }
}

// Login
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if (username === 'admin' && password === '1234') {
        currentUser = 'admin';
        document.querySelector('.login-form').classList.add('hidden');
        document.querySelector('.dashboard').classList.remove('hidden');
        loadData();
        updateTable();
        updateCharts();
    } else {
        alert('❌ Invalid credentials! Use: admin / 1234');
    }
}

// Logout
function logout() {
    currentUser = null;
    document.querySelector('.dashboard').classList.add('hidden');
    document.querySelector('.login-form').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Add Watch
function openAddModal() {
    document.getElementById('addId').value = Math.max(...watches.map(w => w.id), 0) + 1;
    document.getElementById('addModal').style.display = 'block';
}

function addWatch() {
    const id = parseInt(document.getElementById('addId').value);
    const name = document.getElementById('addName').value;
    const price = parseFloat(document.getElementById('addPrice').value);
    const quantity = parseInt(document.getElementById('addQty').value);
    
    if (!name || price <= 0 || quantity <= 0) {
        alert('Please fill valid data');
        return;
    }
    
    const watch = new Watch(id, name, price, quantity);
    watches.push(watch);
    saveData();
    checkLowStock(watch);
    updateTable();
    updateCharts();
    closeModal('addModal');
    alert('✅ Watch added successfully!');
}

// Edit Watch (simple: repopulate form)
function editWatch(id) {
    const watch = watches.find(w => w.id === id);
    document.getElementById('addId').value = watch.id;
    document.getElementById('addName').value = watch.name;
    document.getElementById('addPrice').value = watch.price;
    document.getElementById('addQty').value = watch.quantity;
    document.getElementById('addModal').style.display = 'block';
    // Note: Edit saves as update (overwrite by ID)
}

// Delete Watch
function deleteWatch(id) {
    if (confirm('Delete this watch?')) {
        watches = watches.filter(w => w.id !== id);
        saveData();
        updateTable();
        updateCharts();
        alert('🗑️ Watch deleted');
    }
}

// View Table Update
function updateTable() {
    const tbody = document.querySelector('#watchesTable tbody');
    tbody.innerHTML = '';
    watches.forEach(watch => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${watch.id}</td>
            <td>${watch.name}</td>
            <td>$${watch.price.toFixed(2)}</td>
            <td>${watch.quantity}</td>
            <td>${watch.soldQty}</td>
            <td>
                <button class="btn btn-secondary" onclick="editWatch(${watch.id})" style="padding:5px 10px;font-size:12px;width:auto;">Edit</button>
                <button class="btn btn-danger" onclick="deleteWatch(${watch.id})" style="padding:5px 10px;font-size:12px;width:auto;">Delete</button>
            </td>
        `;
        if (watch.quantity < 5) {
            row.style.background = 'rgba(255, 0, 0, 0.2)';
        }
    });
}

// Search Filter
function searchWatches() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const rows = document.querySelectorAll('#watchesTable tbody tr');
    rows.forEach(row => {
        const name = row.cells[1].textContent.toLowerCase();
        row.style.display = name.includes(term) ? '' : 'none';
    });
}

// Billing
function openBillModal() {
    document.getElementById('billModal').style.display = 'block';
}

function calculateBill() {
    const id = parseInt(document.getElementById('billId').value);
    const qty = parseInt(document.getElementById('billQty').value);
    const watch = watches.find(w => w.id === id);
    
    if (!watch || qty > watch.quantity || qty <= 0) {
        alert('Invalid watch ID or insufficient quantity');
        return;
    }
    
    const total = watch.price * qty;
    const gst = total * 0.18;
    const discount = total * 0.10;
    const finalAmount = total + gst - discount;
    
    watch.quantity -= qty;
    watch.soldQty += qty;
    saveData();
    checkLowStock(watch);
    
    document.getElementById('billDetails').innerHTML = `
        <div class="bill-details">
            <h3>🧾 BILL</h3>
            <p><strong>Watch:</strong> ${watch.name}</p>
            <p><strong>Qty:</strong> ${qty}</p>
            <p><strong>Price per unit:</strong> $${watch.price.toFixed(2)}</p>
            <p><strong>Subtotal:</strong> $${total.toFixed(2)}</p>
            <p><strong>GST (18%):</strong> $${gst.toFixed(2)}</p>
            <p><strong>Discount (10%):</strong> -$${discount.toFixed(2)}</p>
            <hr>
            <p><strong>Final Amount: $${finalAmount.toFixed(2)}</p>
        </div>
    `;
    updateTable();
    updateCharts();
}

// Theme toggle
function applyTheme(theme) {
    const body = document.body;
    if (!body) return;
    body.classList.toggle('theme-bw', theme === 'bw');

    // Update charts so colors match theme
    updateCharts();
}

function toggleTheme() {
    const current = localStorage.getItem('titanTheme') || 'color';
    const next = current === 'bw' ? 'color' : 'bw';
    localStorage.setItem('titanTheme', next);
    applyTheme(next);

    const btn = document.querySelector('button[onclick="toggleTheme()"]');
    if (btn) btn.textContent = next === 'bw' ? 'Theme: Black & White' : 'Theme: Color';
}

function initTheme() {
    const theme = localStorage.getItem('titanTheme') || 'color';
    applyTheme(theme);

    const btn = document.querySelector('button[onclick="toggleTheme()"]');
    if (btn) btn.textContent = theme === 'bw' ? 'Theme: Black & White' : 'Theme: Color';
}

// Update Charts
let salesChart, stockChart;

function getChartColors() {
    const isBW = document.body && document.body.classList.contains('theme-bw');
    if (isBW) {
        return {
            title: '#ffffff',
            pie: ['#ffffff', '#e6e6e6', '#333333', '#ffffff', '#e6e6e6'],
            bar: '#ffffff'
        };
    }
    return {
        title: '#ffd700',
        pie: ['#ffd700', '#ffed4e', '#2c3e50', '#e74c3c', '#00ff00'],
        bar: '#ffd700'
    };
}

function updateCharts() {
    if (!document.getElementById('salesChart') || !document.getElementById('stockChart')) return;

    const colors = getChartColors();

    // Sales Pie Chart
    const salesCtx = document.getElementById('salesChart').getContext('2d');
    const salesData = watches.map(w => w.soldQty * w.price);
    if (salesChart) salesChart.destroy();
    salesChart = new Chart(salesCtx, {
        type: 'pie',
        data: {
            labels: watches.map(w => w.name),
            datasets: [{ data: salesData, backgroundColor: colors.pie }]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'Sales by Watch', color: colors.title } } }
    });

    // Stock Bar Chart
    const stockCtx = document.getElementById('stockChart').getContext('2d');
    const stockData = watches.map(w => w.quantity);
    if (stockChart) stockChart.destroy();
    stockChart = new Chart(stockCtx, {
        type: 'bar',
        data: {
            labels: watches.map(w => w.name),
            datasets: [{ label: 'Stock', data: stockData, backgroundColor: colors.bar }]
        },
        options: { responsive: true, plugins: { title: { display: true, text: 'Stock Levels', color: colors.title } } }
    });
}


// Modal controls
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
}

// Init
document.addEventListener('DOMContentLoaded', function() {
    // Login on Enter
    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') login();
    });
});
