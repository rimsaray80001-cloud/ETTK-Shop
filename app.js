// ===================== GLOBAL VARIABLES =====================
let currentUser = null;
let usersData = [
    {username: 'admin', password: 'admin123', fullname: 'System Administrator', role: 'admin', branch: 'Head Office', status: 'active', createdDate: '2026-01-01'},
    {username: 'agent1', password: 'agent123', fullname: 'Sok Dara', role: 'agent', branch: 'Phnom Penh Branch', status: 'active', createdDate: '2026-01-15'},
    {username: 'agent2', password: 'agent123', fullname: 'Chan Sophea', role: 'agent', branch: 'Siem Reap Branch', status: 'active', createdDate: '2026-01-20'}
];
let salesData = [];
let depositData = [];
let customersData = [];
let topupData = [];
let salesChart = null;
let reportsChart = null;
let editingSalesIndex = null;
let editingDepositIndex = null;
let dashboardChart1 = null;
let dashboardChart2 = null;

// ===================== SUCCESS POPUP FUNCTIONS =====================
function showSuccessPopup(message) {
    document.getElementById('successMessage').textContent = message;
    document.getElementById('successOverlay').classList.add('show');
    document.getElementById('successPopup').classList.add('show');
}

function closeSuccessPopup() {
    document.getElementById('successOverlay').classList.remove('show');
    document.getElementById('successPopup').classList.remove('show');
}

// ===================== PERMISSION CHECK =====================
function canEditData(data) {
    if (currentUser.role === 'admin') return true;
    const dataStaff = data.staff_name || data.staff;
    return dataStaff === currentUser.fullname;
}

// ===================== PAGE LOAD =====================
window.addEventListener('load', function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        document.getElementById('loginOverlay').classList.add('show');
    } else {
        const userData = JSON.parse(sessionStorage.getItem('userData'));
        currentUser = userData;
        document.getElementById('systemContent').classList.add('show');
        document.getElementById('loggedInUser').textContent = userData.fullname;
        document.getElementById('userRole').textContent = userData.role === 'admin' ? 'Admin' : 'Agent';
        
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
        document.getElementById('deposit_date').value = today;
        
        if (userData.username !== 'admin') {
            document.getElementById('staff_name').value = userData.fullname;
            document.getElementById('deposit_staff').value = userData.fullname;
        } else {
            document.getElementById('staff_name').value = '';
            document.getElementById('deposit_staff').value = '';
        }
        
        document.getElementById('branch_name').value = userData.branch;
        
        loadDataFromStorage();
        showPage('dashboard');
    }
});

// ===================== LOGIN FORM =====================
document.getElementById('loginFormPopup').addEventListener('submit', function(e) {
    e.preventDefault();
    document.getElementById('loginError').classList.remove('show');
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginSubmitBtn');
    
    loginBtn.classList.add('loading');
    loginBtn.disabled = true;
    
    setTimeout(function() {
        const user = usersData.find(u => u.username === username && u.password === password && u.status === 'active');
        
        if (user) {
            currentUser = user;
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userData', JSON.stringify(user));
            
            document.getElementById('loginOverlay').classList.remove('show');
            document.getElementById('systemContent').classList.add('show');
            document.getElementById('loggedInUser').textContent = user.fullname;
            document.getElementById('userRole').textContent = user.role === 'admin' ? 'Admin' : 'Agent';
            
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('date').value = today;
            document.getElementById('deposit_date').value = today;
            
            if (user.username !== 'admin') {
                document.getElementById('staff_name').value = user.fullname;
                document.getElementById('deposit_staff').value = user.fullname;
            } else {
                document.getElementById('staff_name').value = '';
                document.getElementById('deposit_staff').value = '';
            }
            
            document.getElementById('branch_name').value = user.branch;
            
            loadDataFromStorage();
            showPage('dashboard');
        } else {
            document.getElementById('loginError').classList.add('show');
        }
        
        loginBtn.classList.remove('loading');
        loginBtn.disabled = false;
    }, 1000);
});

document.getElementById('loginTogglePassword').addEventListener('click', function() {
    const passwordInput = document.getElementById('loginPassword');
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.classList.toggle('fa-eye');
    this.classList.toggle('fa-eye-slash');
});

function logout() {
    if (confirm('តើអ្នកប្រាកដថាចង់ចាកចេញមែនទេ?')) {
        sessionStorage.clear();
        currentUser = null;
        document.getElementById('systemContent').classList.remove('show');
        document.getElementById('loginOverlay').classList.add('show');
        document.getElementById('loginFormPopup').reset();
        document.getElementById('loginError').classList.remove('show');
    }
}

function showPage(page) {
    document.querySelectorAll('.main-content > .container > div').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
    
    if (page === 'dashboard') {
        document.getElementById('dashboard-page').classList.remove('hidden');
        document.getElementById('menu-dashboard').classList.add('active');
        setTimeout(initDashboard, 100);
    } else if (page === 'daily-sales') {
        document.getElementById('daily-sales-page').classList.remove('hidden');
        document.getElementById('menu-daily-sales').classList.add('active');
    } else if (page === 'deposit') {
        document.getElementById('deposit-page').classList.remove('hidden');
        document.getElementById('menu-deposit').classList.add('active');
    } else if (page === 'reports') {
        document.getElementById('reports-page').classList.remove('hidden');
        document.getElementById('menu-reports').classList.add('active');
        setTimeout(initReportsChart, 100);
        refreshReportTable();
    } else if (page === 'customers') {
        document.getElementById('customers-page').classList.remove('hidden');
        document.getElementById('menu-customers').classList.add('active');
    } else if (page === 'settings') {
        document.getElementById('settings-page').classList.remove('hidden');
        document.getElementById('menu-settings').classList.add('active');
    }
}

function saveDataToStorage() {
    localStorage.setItem('usersData', JSON.stringify(usersData));
    localStorage.setItem('salesData', JSON.stringify(salesData));
    localStorage.setItem('depositData', JSON.stringify(depositData));
    localStorage.setItem('customersData', JSON.stringify(customersData));
    localStorage.setItem('topupData', JSON.stringify(topupData));
}

function loadDataFromStorage() {
    const saved = {
        users: localStorage.getItem('usersData'),
        sales: localStorage.getItem('salesData'),
        deposit: localStorage.getItem('depositData'),
        customers: localStorage.getItem('customersData'),
        topup: localStorage.getItem('topupData')
    };
    
    if (saved.users) usersData = JSON.parse(saved.users);
    if (saved.sales) salesData = JSON.parse(saved.sales);
    if (saved.deposit) depositData = JSON.parse(saved.deposit);
    if (saved.customers) customersData = JSON.parse(saved.customers);
    if (saved.topup) topupData = JSON.parse(saved.topup);
    
    refreshSalesTable();
    refreshDepositTable();
}

// ===================== DASHBOARD =====================
function initDashboard() {
    calculateDashboardStats();
    initDashboardCharts();
    generateLeaderboard();
}

function calculateDashboardStats() {
    let filteredData = salesData;
    if (currentUser.role !== 'admin') {
        filteredData = salesData.filter(d => d.branch === currentUser.branch);
    }

    const totalRevenue = filteredData.reduce((sum, d) => sum + parseFloat(d.total_revenue || 0), 0);
    const totalRecharge = filteredData.reduce((sum, d) => sum + parseFloat(d.recharge || 0), 0);
    const totalGrossAds = filteredData.reduce((sum, d) => sum + parseInt(d.gross_ads || 0), 0);
    const totalTransactions = filteredData.length;

    document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toFixed(2);
    document.getElementById('totalRecharge').textContent = '$' + totalRecharge.toFixed(2);
    document.getElementById('totalGrossAds').textContent = totalGrossAds;
    document.getElementById('totalTransactions').textContent = totalTransactions;
}

function initDashboardCharts() {
    if (dashboardChart1) dashboardChart1.destroy();
    if (dashboardChart2) dashboardChart2.destroy();

    const ctx1 = document.getElementById('dashboardChart1');
    const ctx2 = document.getElementById('dashboardChart2');
    if (!ctx1 || !ctx2) return;

    let filteredData = salesData;
    if (currentUser.role !== 'admin') {
        filteredData = salesData.filter(d => d.branch === currentUser.branch);
    }

    if (filteredData.length === 0) {
        ctx1.getContext('2d').font = '16px Kantumruy Pro';
        ctx1.getContext('2d').fillStyle = '#6c757d';
        ctx1.getContext('2d').textAlign = 'center';
        ctx1.getContext('2d').fillText('គ្មានទិន្នន័យ', ctx1.width / 2, ctx1.height / 2);
        
        ctx2.getContext('2d').font = '16px Kantumruy Pro';
        ctx2.getContext('2d').fillStyle = '#6c757d';
        ctx2.getContext('2d').textAlign = 'center';
        ctx2.getContext('2d').fillText('គ្មានទិន្នន័យ', ctx2.width / 2, ctx2.height / 2);
        return;
    }

    if (currentUser.role === 'admin') {
        document.getElementById('chartTitle').textContent = 'Revenue by Branch';
        const branchData = {};
        filteredData.forEach(d => {
            if (!branchData[d.branch]) {
                branchData[d.branch] = { revenue: 0, recharge: 0, ads: 0 };
            }
            branchData[d.branch].revenue += parseFloat(d.total_revenue || 0);
            branchData[d.branch].recharge += parseFloat(d.recharge || 0);
            branchData[d.branch].ads += parseInt(d.gross_ads || 0);
        });

        const labels = Object.keys(branchData);
        const revenueData = labels.map(l => branchData[l].revenue);

        dashboardChart1 = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue (USD)',
                    data: revenueData,
                    backgroundColor: '#28a745',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Revenue: $' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                },
                scales: { 
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    } 
                }
            }
        });
    } else {
        document.getElementById('chartTitle').textContent = 'Revenue by Staff (Your Branch)';
        const staffData = {};
        filteredData.forEach(d => {
            if (!staffData[d.staff_name]) {
                staffData[d.staff_name] = { revenue: 0, recharge: 0, ads: 0 };
            }
            staffData[d.staff_name].revenue += parseFloat(d.total_revenue || 0);
            staffData[d.staff_name].recharge += parseFloat(d.recharge || 0);
            staffData[d.staff_name].ads += parseInt(d.gross_ads || 0);
        });

        const labels = Object.keys(staffData);
        const revenueData = labels.map(l => staffData[l].revenue);

        dashboardChart1 = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue (USD)',
                    data: revenueData,
                    backgroundColor: '#007bff',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Revenue: $' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                },
                scales: { 
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    } 
                }
            }
        });
    }

    const totalRecharge = filteredData.reduce((sum, d) => sum + parseFloat(d.recharge || 0), 0);
    const totalSCShop = filteredData.reduce((sum, d) => sum + parseFloat(d.sc_shop || 0), 0);
    const totalSCDealer = filteredData.reduce((sum, d) => sum + parseFloat(d.sc_dealer || 0), 0);

    dashboardChart2 = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Recharge', 'SC-Shop', 'SC-Dealer'],
            datasets: [{
                data: [totalRecharge, totalSCShop, totalSCDealer],
                backgroundColor: ['#28a745', '#ffc107', '#007bff'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return label + ': $' + value.toFixed(2) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function generateLeaderboard() {
    const tbody = document.getElementById('leaderboardBody');
    tbody.innerHTML = '';

    let filteredData = salesData;
    if (currentUser.role !== 'admin') {
        filteredData = salesData.filter(d => d.branch === currentUser.branch);
    }

    let leaderboardData = [];

    if (currentUser.role === 'admin') {
        document.getElementById('leaderboardTitle').textContent = 'Top Branches';
        document.getElementById('leaderboardEntityHeader').textContent = 'Branch';

        const branchData = {};
        filteredData.forEach(d => {
            if (!branchData[d.branch]) {
                branchData[d.branch] = { revenue: 0, recharge: 0, ads: 0 };
            }
            branchData[d.branch].revenue += parseFloat(d.total_revenue || 0);
            branchData[d.branch].recharge += parseFloat(d.recharge || 0);
            branchData[d.branch].ads += parseInt(d.gross_ads || 0);
        });

        leaderboardData = Object.keys(branchData).map(branch => ({
            name: branch,
            revenue: branchData[branch].revenue,
            recharge: branchData[branch].recharge,
            ads: branchData[branch].ads,
            score: branchData[branch].revenue + branchData[branch].recharge + branchData[branch].ads
        }));
    } else {
        document.getElementById('leaderboardTitle').textContent = 'Top Staff (Your Branch)';
        document.getElementById('leaderboardEntityHeader').textContent = 'Staff';

        const staffData = {};
        filteredData.forEach(d => {
            if (!staffData[d.staff_name]) {
                staffData[d.staff_name] = { revenue: 0, recharge: 0, ads: 0 };
            }
            staffData[d.staff_name].revenue += parseFloat(d.total_revenue || 0);
            staffData[d.staff_name].recharge += parseFloat(d.recharge || 0);
            staffData[d.staff_name].ads += parseInt(d.gross_ads || 0);
        });

        leaderboardData = Object.keys(staffData).map(staff => ({
            name: staff,
            revenue: staffData[staff].revenue,
            recharge: staffData[staff].recharge,
            ads: staffData[staff].ads,
            score: staffData[staff].revenue + staffData[staff].recharge + staffData[staff].ads
        }));
    }

    leaderboardData.sort((a, b) => b.score - a.score);

    leaderboardData.slice(0, 10).forEach((item, index) => {
        const row = tbody.insertRow();
        let rankClass = '';
        let rankBadge = '';

        if (index === 0) {
            rankClass = 'rank-1';
            rankBadge = '<span class="rank-badge gold">🥇</span>';
        } else if (index === 1) {
            rankClass = 'rank-2';
            rankBadge = '<span class="rank-badge silver">🥈</span>';
        } else if (index === 2) {
            rankClass = 'rank-3';
            rankBadge = '<span class="rank-badge bronze">🥉</span>';
        } else {
            rankBadge = `<span style="font-weight: 700; font-size: 16px;">${index + 1}</span>`;
        }

        row.className = rankClass;
        row.innerHTML = `
            <td>${rankBadge}</td>
            <td><strong>${item.name}</strong></td>
            <td class="total-amount">$${item.revenue.toFixed(2)}</td>
            <td class="amount">$${item.recharge.toFixed(2)}</td>
            <td>${item.ads}</td>
            <td><strong style="font-size: 16px; color: #28a745;">${item.score.toFixed(2)}</strong></td>
        `;
    });

    if (leaderboardData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #6c757d;"><i class="fas fa-chart-bar" style="font-size: 48px; display: block; margin-bottom: 10px; opacity: 0.3;"></i>គ្មានទិន្នន័យនៅឡើយទេ<br><small>សូមបញ្ចូលទិន្នន័យការលក់ជាមុនសិន</small></td></tr>';
    }
}

// ===================== SALES FORM (WITH EDIT) =====================
document.getElementById('salesForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    let staffName = document.getElementById('staff_name').value.trim();
    if (!staffName) staffName = currentUser.fullname;
    
    const formData = {
        date: document.getElementById('date').value,
        staff_name: staffName,
        branch: currentUser.branch,
        gross_ads: document.getElementById('gross_ads').value,
        change_sim: document.getElementById('change_sim').value,
        s_at_home: document.getElementById('s_at_home').value,
        fiber_plus: document.getElementById('fiber_plus').value,
        recharge: document.getElementById('recharge').value,
        sc_shop: document.getElementById('sc_shop').value,
        sc_dealer: document.getElementById('sc_dealer').value,
        total_revenue: document.getElementById('total_revenue').value
    };
    
    if (editingSalesIndex !== null) {
        salesData[editingSalesIndex] = formData;
        editingSalesIndex = null;
        showSuccessPopup('ទិន្នន័យការលក់ត្រូវបានកែប្រែដោយជោគជ័យ!');
    } else {
        salesData.push(formData);
        showSuccessPopup('ទិន្នន័យការលក់ត្រូវបានរក្សាទុកដោយជោគជ័យ!');
    }
    
    saveDataToStorage();
    refreshSalesTable();
    resetSalesForm();
});

function resetSalesForm() {
    document.getElementById('salesForm').reset();
    editingSalesIndex = null;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    if (currentUser.username !== 'admin') {
        document.getElementById('staff_name').value = currentUser.fullname;
    }
    document.getElementById('branch_name').value = currentUser.branch;
    document.getElementById('gross_ads').value = '0';
    document.getElementById('change_sim').value = '0';
    document.getElementById('s_at_home').value = '0';
    document.getElementById('fiber_plus').value = '0';
    document.getElementById('recharge').value = '0.00';
    document.getElementById('sc_shop').value = '0.00';
    document.getElementById('sc_dealer').value = '0.00';
    document.getElementById('total_revenue').value = '0.00';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function refreshSalesTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    let filteredData = salesData;
    if (currentUser.role !== 'admin') {
        filteredData = salesData.filter(d => d.branch === currentUser.branch);
    }
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px; color: #6c757d;"><i class="fas fa-inbox" style="font-size: 48px; display: block; margin-bottom: 10px; opacity: 0.3;"></i>មិនទាន់មានទិន្នន័យនៅឡើយទេ</td></tr>';
        return;
    }
    
    filteredData.forEach((data, index) => {
        const originalIndex = salesData.indexOf(data);
        const canEdit = canEditData(data);
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${data.date}</td>
            <td>${data.staff_name}</td>
            <td>${data.branch}</td>
            <td>${data.gross_ads}/${data.change_sim}/${data.s_at_home}/${data.fiber_plus}</td>
            <td class="amount">$${parseFloat(data.recharge).toFixed(2)}/$${parseFloat(data.sc_shop).toFixed(2)}/$${parseFloat(data.sc_dealer).toFixed(2)}</td>
            <td class="total-amount">$${parseFloat(data.total_revenue).toFixed(2)}</td>
            <td class="actions">
                <button class="edit-btn" onclick="editSalesRow(${originalIndex})" ${!canEdit ? 'disabled' : ''} title="${canEdit ? 'Edit' : 'អ្នកមិនអាចកែប្រែទិន្នន័យនេះបានទេ'}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteSalesRow(${originalIndex})" ${!canEdit ? 'disabled' : ''} title="${canEdit ? 'Delete' : 'អ្នកមិនអាចលុបទិន្នន័យនេះបានទេ'}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

function editSalesRow(index) {
    const data = salesData[index];
    if (!canEditData(data)) {
        showSuccessPopup('អ្នកមិនអាចកែប្រែទិន្នន័យរបស់បុគ្គលិកផ្សេងបានទេ!');
        return;
    }
    
    editingSalesIndex = index;
    
    document.getElementById('date').value = data.date;
    document.getElementById('staff_name').value = data.staff_name;
    document.getElementById('branch_name').value = data.branch;
    document.getElementById('gross_ads').value = data.gross_ads;
    document.getElementById('change_sim').value = data.change_sim;
    document.getElementById('s_at_home').value = data.s_at_home;
    document.getElementById('fiber_plus').value = data.fiber_plus;
    document.getElementById('recharge').value = parseFloat(data.recharge).toFixed(2);
    document.getElementById('sc_shop').value = parseFloat(data.sc_shop).toFixed(2);
    document.getElementById('sc_dealer').value = parseFloat(data.sc_dealer).toFixed(2);
    document.getElementById('total_revenue').value = parseFloat(data.total_revenue).toFixed(2);
    
    showPage('daily-sales');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const formCard = document.querySelector('#daily-sales-page .form-card');
    formCard.style.borderLeft = '4px solid #ffc107';
    setTimeout(() => {
        formCard.style.borderLeft = '4px solid #28a745';
    }, 2000);
}

function deleteSalesRow(index) {
    const data = salesData[index];
    if (!canEditData(data)) {
        showSuccessPopup('អ្នកមិនអាចលុបទិន្នន័យរបស់បុគ្គលិកផ្សេងបានទេ!');
        return;
    }
    
    if (confirm('តើអ្នកប្រាកដថាចង់លុបទិន្នន័យនេះមែនទេ?')) {
        salesData.splice(index, 1);
        saveDataToStorage();
        refreshSalesTable();
        showSuccessPopup('បានលុបទិន្នន័យដោយជោគជ័យ!');
    }
}

// ===================== DEPOSIT FORM (WITH EDIT) =====================
document.getElementById('depositForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    let staffName = document.getElementById('deposit_staff').value.trim();
    if (!staffName) staffName = currentUser.fullname;
    
    const formData = {
        date: document.getElementById('deposit_date').value,
        staff: staffName,
        branch: currentUser.branch,
        cash: document.getElementById('cash').value,
        credit: document.getElementById('credit').value,
        note: document.getElementById('note').value || '-'
    };
    
    if (editingDepositIndex !== null) {
        depositData[editingDepositIndex] = formData;
        editingDepositIndex = null;
        showSuccessPopup('ទិន្នន័យការដាក់ប្រាក់ត្រូវបានកែប្រែដោយជោគជ័យ!');
    } else {
        depositData.push(formData);
        showSuccessPopup('ទិន្នន័យការដាក់ប្រាក់ត្រូវបានរក្សាទុកដោយជោគជ័យ!');
    }
    
    saveDataToStorage();
    refreshDepositTable();
    resetDepositForm();
});

function resetDepositForm() {
    document.getElementById('depositForm').reset();
    editingDepositIndex = null;
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('deposit_date').value = today;
    
    if (currentUser.username !== 'admin') {
        document.getElementById('deposit_staff').value = currentUser.fullname;
    }
    document.getElementById('cash').value = '0.00';
    document.getElementById('credit').value = '0.00';
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function refreshDepositTable() {
    const tbody = document.getElementById('depositTableBody');
    tbody.innerHTML = '';
    
    let filteredData = depositData;
    if (currentUser.role !== 'admin') {
        filteredData = depositData.filter(d => d.branch === currentUser.branch);
    }
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 30px; color: #6c757d;"><i class="fas fa-inbox" style="font-size: 48px; display: block; margin-bottom: 10px; opacity: 0.3;"></i>មិនទាន់មានទិន្នន័យនៅឡើយទេ</td></tr>';
        return;
    }
    
    filteredData.forEach((data, index) => {
        const originalIndex = depositData.indexOf(data);
        const canEdit = canEditData(data);
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${data.date}</td>
            <td>${data.staff}</td>
            <td>${data.branch}</td>
            <td class="cash-amount">$${parseFloat(data.cash).toFixed(2)}</td>
            <td class="credit-amount">$${parseFloat(data.credit).toFixed(2)}</td>
            <td>${data.note}</td>
            <td class="actions">
                <button class="edit-btn" onclick="editDepositRow(${originalIndex})" ${!canEdit ? 'disabled' : ''} title="${canEdit ? 'Edit' : 'អ្នកមិនអាចកែប្រែទិន្នន័យនេះបានទេ'}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteDepositRow(${originalIndex})" ${!canEdit ? 'disabled' : ''} title="${canEdit ? 'Delete' : 'អ្នកមិនអាចលុបទិន្នន័យនេះបានទេ'}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

function editDepositRow(index) {
    const data = depositData[index];
    if (!canEditData(data)) {
        showSuccessPopup('អ្នកមិនអាចកែប្រែទិន្នន័យរបស់បុគ្គលិកផ្សេងបានទេ!');
        return;
    }
    
    editingDepositIndex = index;
    
    document.getElementById('deposit_date').value = data.date;
    document.getElementById('deposit_staff').value = data.staff;
    document.getElementById('cash').value = parseFloat(data.cash).toFixed(2);
    document.getElementById('credit').value = parseFloat(data.credit).toFixed(2);
    document.getElementById('note').value = data.note === '-' ? '' : data.note;
    
    showPage('deposit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    const formCard = document.querySelector('#deposit-page .form-card');
    formCard.style.borderLeft = '4px solid #ffc107';
    setTimeout(() => {
        formCard.style.borderLeft = '4px solid #28a745';
    }, 2000);
}

function deleteDepositRow(index) {
    const data = depositData[index];
    if (!canEditData(data)) {
        showSuccessPopup('អ្នកមិនអាចលុបទិន្នន័យរបស់បុគ្គលិកផ្សេងបានទេ!');
        return;
    }
    
    if (confirm('តើអ្នកប្រាកដថាចង់លុបទិន្នន័យនេះមែនទេ?')) {
        depositData.splice(index, 1);
        saveDataToStorage();
        refreshDepositTable();
        showSuccessPopup('បានលុបទិន្នន័យដោយជោគជ័យ!');
    }
}

// ===================== REPORTS =====================
function initReportsChart() {
    if (reportsChart) reportsChart.destroy();
    
    const ctx = document.getElementById('reportsChart');
    if (!ctx) return;

    let filteredData = salesData;
    if (currentUser.role !== 'admin') {
        filteredData = salesData.filter(d => d.branch === currentUser.branch);
    }

    if (filteredData.length === 0) {
        ctx.getContext('2d').font = '16px Kantumruy Pro';
        ctx.getContext('2d').fillStyle = '#6c757d';
        ctx.getContext('2d').textAlign = 'center';
        ctx.getContext('2d').fillText('គ្មានទិន្នន័យ', ctx.width / 2, ctx.height / 2);
        return;
    }

    reportsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Recharge', 'SC-Shop', 'SC-Dealer'],
            datasets: [{
                label: 'Revenue (USD)',
                data: [
                    filteredData.reduce((sum, d) => sum + parseFloat(d.recharge), 0),
                    filteredData.reduce((sum, d) => sum + parseFloat(d.sc_shop), 0),
                    filteredData.reduce((sum, d) => sum + parseFloat(d.sc_dealer), 0)
                ],
                backgroundColor: ['#28a745', '#ffc107', '#007bff'],
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'bottom' }
            },
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

function refreshReportTable() {
    const tbody = document.getElementById('reportTableBody');
    tbody.innerHTML = '';
    
    let filteredData = salesData;
    if (currentUser.role !== 'admin') {
        filteredData = salesData.filter(d => d.branch === currentUser.branch);
    }

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #6c757d;"><i class="fas fa-chart-bar" style="font-size: 48px; display: block; margin-bottom: 10px; opacity: 0.3;"></i>គ្មានទិន្នន័យនៅឡើយទេ</td></tr>';
        return;
    }
    
    filteredData.forEach(data => {
        const row = tbody.insertRow();
        const totalServices = parseInt(data.gross_ads) + parseInt(data.change_sim) + parseInt(data.s_at_home) + parseInt(data.fiber_plus);
        const totalRevenue = parseFloat(data.recharge) + parseFloat(data.sc_shop) + parseFloat(data.sc_dealer);
        
        row.innerHTML = `
            <td>${data.date}</td>
            <td>${data.staff_name}</td>
            <td>${data.branch}</td>
            <td>${totalServices}</td>
            <td class="amount">$${totalRevenue.toFixed(2)}</td>
            <td class="total-amount">$${parseFloat(data.total_revenue).toFixed(2)}</td>
        `;
    });
}

// ===================== MODAL CLICK OUTSIDE =====================
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}
