// ===================== GLOBAL VARIABLES =====================
let currentUser = null;
let usersData = [{username: 'admin', password: 'admin123', fullname: 'System Administrator', role: 'admin', branch: 'Head Office', status: 'active', createdDate: '2026-01-01'}];
let salesData = [];
let depositData = [];
let customersData = [];
let topupData = [];
let salesChart = null;
let editingSalesIndex = null;
let editingDepositIndex = null;

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
        
        if (userData.username !== 'admin') {
            document.getElementById('staff_name').value = userData.fullname;
            document.getElementById('deposit_staff').value = userData.fullname;
        } else {
            document.getElementById('staff_name').value = '';
            document.getElementById('deposit_staff').value = '';
        }
        
        document.getElementById('branch_name').value = userData.branch;
        document.getElementById('deposit_date').value = today;
        
        checkUserPermissions();
        loadDataFromStorage();
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
            
            if (user.username !== 'admin') {
                document.getElementById('staff_name').value = user.fullname;
                document.getElementById('deposit_staff').value = user.fullname;
            } else {
                document.getElementById('staff_name').value = '';
                document.getElementById('deposit_staff').value = '';
            }
            
            document.getElementById('branch_name').value = user.branch;
            document.getElementById('deposit_date').value = today;
            
            checkUserPermissions();
            loadDataFromStorage();
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
    
    if (page === 'daily-sales') {
        document.getElementById('daily-sales-page').classList.remove('hidden');
        document.getElementById('menu-daily-sales').classList.add('active');
    } else if (page === 'deposit') {
        document.getElementById('deposit-page').classList.remove('hidden');
        document.getElementById('menu-deposit').classList.add('active');
    } else if (page === 'reports') {
        document.getElementById('reports-page').classList.remove('hidden');
        document.getElementById('menu-reports').classList.add('active');
        setTimeout(initChart, 100);
    } else if (page === 'customers') {
        document.getElementById('customers-page').classList.remove('hidden');
        document.getElementById('menu-customers').classList.add('active');
        checkExpiringCustomers();
    } else if (page === 'settings') {
        document.getElementById('settings-page').classList.remove('hidden');
        document.getElementById('menu-settings').classList.add('active');
    }
}

function checkUserPermissions() {
    if (currentUser.role === 'admin') {
        document.getElementById('settingsAdminOnly').style.display = 'block';
        document.getElementById('settingsAgentMessage').classList.add('hidden');
        document.getElementById('adminFilters').style.display = 'grid';
        populateFilters();
    } else {
        document.getElementById('settingsAdminOnly').style.display = 'none';
        document.getElementById('settingsAgentMessage').classList.remove('hidden');
        document.getElementById('adminFilters').style.display = 'none';
    }
    refreshAllTables();
}

function populateFilters() {
    const branches = [...new Set(usersData.map(u => u.branch))];
    const branchSelect = document.getElementById('filter_branch');
    branchSelect.innerHTML = '<option value="">All Branches</option>';
    branches.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b;
        opt.textContent = b;
        branchSelect.appendChild(opt);
    });

    const staffSelect = document.getElementById('filter_staff');
    staffSelect.innerHTML = '<option value="">All Staff</option>';
    usersData.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.fullname;
        opt.textContent = `${u.fullname} (${u.branch})`;
        staffSelect.appendChild(opt);
    });
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
    
    refreshAllTables();
}

function refreshAllTables() {
    refreshUsersTable();
    refreshSalesTable();
    refreshDepositTable();
    refreshCustomersTable();
    refreshTopUpTable();
    refreshReportTable();
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
    refreshReportTable();
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
        refreshReportTable();
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

// ===================== CHART =====================
function initChart() {
    if (salesChart) salesChart.destroy();
    
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    let filteredData = salesData;
    if (currentUser.role !== 'admin') {
        filteredData = salesData.filter(d => d.branch === currentUser.branch);
    }

    salesChart = new Chart(ctx, {
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
                y: { beginAtZero: true }
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
    
    filteredData.forEach(data => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${data.date}</td>
            <td>${data.staff_name}</td>
            <td>${data.branch}</td>
            <td>${parseInt(data.gross_ads) + parseInt(data.change_sim) + parseInt(data.s_at_home) + parseInt(data.fiber_plus)}</td>
            <td class="amount">$${(parseFloat(data.recharge) + parseFloat(data.sc_shop) + parseFloat(data.sc_dealer)).toFixed(2)}</td>
            <td class="total-amount">$${parseFloat(data.total_revenue).toFixed(2)}</td>
        `;
    });
}

// ===================== CUSTOMER MODAL =====================
function openCustomerModal() {
    document.getElementById('customerModal').style.display = 'block';
    document.getElementById('edit_customer_index').value = '';
    document.getElementById('customerModalTitle').textContent = 'បន្ថែមអតិថិជនថ្មី';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('cust_date').value = today;
    
    if (currentUser.username !== 'admin') {
        document.getElementById('cust_staff').value = currentUser.fullname;
    } else {
        document.getElementById('cust_staff').value = '';
    }
}

function closeCustomerModal() {
    document.getElementById('customerModal').style.display = 'none';
    document.getElementById('customerForm').reset();
}

document.getElementById('customerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    let staffName = document.getElementById('cust_staff').value.trim();
    if (!staffName) staffName = currentUser.fullname;

    const editIndex = document.getElementById('edit_customer_index').value;
    
    const formData = {
        date: document.getElementById('cust_date').value,
        staff: staffName,
        branch: currentUser.branch,
        name: document.getElementById('cust_name').value,
        phone: document.getElementById('cust_phone').value,
        product: document.getElementById('cust_product').value,
        status: document.getElementById('cust_status').value,
        remark: document.getElementById('cust_remark').value || '-'
    };

    if (editIndex !== '') {
        customersData[editIndex] = formData;
        showSuccessPopup('បានកែប្រែអតិថិជនដោយជោគជ័យ!');
    } else {
        customersData.push(formData);
        showSuccessPopup('អតិថិជនត្រូវបានបន្ថែមដោយជោគជ័យ!');
    }
    
    saveDataToStorage();
    refreshCustomersTable();
    closeCustomerModal();
});

function refreshCustomersTable() {
    const tbody = document.getElementById('customersTableBody');
    tbody.innerHTML = '';
    
    let filteredData = customersData;
    if (currentUser.role !== 'admin') {
        filteredData = customersData.filter(d => d.branch === currentUser.branch);
    }
    
    filteredData.forEach((data, index) => {
        const originalIndex = customersData.indexOf(data);
        const canEdit = canEditData(data);
        
        let statusClass = '';
        switch(data.status) {
            case 'New Lead': statusClass = 'status-new-lead'; break;
            case 'Prospect': statusClass = 'status-prospect'; break;
            case 'Hot Prospect': statusClass = 'status-hot-prospect'; break;
            case 'Closed': statusClass = 'status-closed'; break;
        }
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${data.date}</td>
            <td>${data.staff}</td>
            <td>${data.branch}</td>
            <td>${data.name}</td>
            <td>${data.phone}</td>
            <td>${data.product}</td>
            <td><span class="status-badge ${statusClass}">${data.status}</span></td>
            <td>${data.remark}</td>
            <td class="actions">
                <button class="edit-btn" onclick="editCustomerRow(${originalIndex})" ${!canEdit ? 'disabled' : ''} title="${canEdit ? 'Edit' : 'អ្នកមិនអាចកែប្រែទិន្នន័យនេះបានទេ'}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteCustomerRow(${originalIndex})" ${!canEdit ? 'disabled' : ''} title="${canEdit ? 'Delete' : 'អ្នកមិនអាចលុបទិន្នន័យនេះបានទេ'}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

function editCustomerRow(index) {
    const data = customersData[index];
    if (!canEditData(data)) {
        showSuccessPopup('អ្នកមិនអាចកែប្រែទិន្នន័យរបស់បុគ្គលិកផ្សេងបានទេ!');
        return;
    }
    
    document.getElementById('cust_date').value = data.date;
    document.getElementById('cust_staff').value = data.staff;
    document.getElementById('cust_name').value = data.name;
    document.getElementById('cust_phone').value = data.phone;
    document.getElementById('cust_product').value = data.product;
    document.getElementById('cust_status').value = data.status;
    document.getElementById('cust_remark').value = data.remark === '-' ? '' : data.remark;
    document.getElementById('edit_customer_index').value = index;
    document.getElementById('customerModalTitle').textContent = 'កែប្រែអតិថិជន';
    document.getElementById('customerModal').style.display = 'block';
}

function deleteCustomerRow(index) {
    const data = customersData[index];
    if (!canEditData(data)) {
        showSuccessPopup('អ្នកមិនអាចលុបទិន្នន័យរបស់បុគ្គលិកផ្សេងបានទេ!');
        return;
    }
    
    if (confirm('តើអ្នកប្រាកដថាចង់លុបអតិថិជននេះមែនទេ?')) {
        customersData.splice(index, 1);
        saveDataToStorage();
        refreshCustomersTable();
        showSuccessPopup('បានលុបអតិថិជនដោយជោគជ័យ!');
    }
}

// ===================== TOP UP MODAL =====================
function openTopUpModal() {
    document.getElementById('topupModal').style.display = 'block';
    document.getElementById('edit_topup_index').value = '';
    document.getElementById('topupModalTitle').textContent = 'បន្ថែម Top Up';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('topup_date').value = today;
    
    if (currentUser.username !== 'admin') {
        document.getElementById('topup_staff').value = currentUser.fullname;
    } else {
        document.getElementById('topup_staff').value = '';
    }
}

function closeTopUpModal() {
    document.getElementById('topupModal').style.display = 'none';
    document.getElementById('topupForm').reset();
}

document.getElementById('topupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    let staffName = document.getElementById('topup_staff').value.trim();
    if (!staffName) staffName = currentUser.fullname;

    const editIndex = document.getElementById('edit_topup_index').value;
    
    const formData = {
        date: document.getElementById('topup_date').value,
        staff: staffName,
        branch: currentUser.branch,
        customer: document.getElementById('topup_customer').value,
        phone: document.getElementById('topup_phone').value,
        contact: document.getElementById('topup_contact').value || '-',
        product: document.getElementById('topup_product').value,
        expiry: document.getElementById('topup_expiry').value,
        remark: document.getElementById('topup_remark').value || '-'
    };

    if (editIndex !== '') {
        topupData[editIndex] = formData;
        showSuccessPopup('បានកែប្រែ Top Up ដោយជោគជ័យ!');
    } else {
        topupData.push(formData);
        showSuccessPopup('Top Up ត្រូវបានបន្ថែមដោយជោគជ័យ!');
    }
    
    saveDataToStorage();
    refreshTopUpTable();
    checkExpiringCustomers();
    closeTopUpModal();
});

function refreshTopUpTable() {
    const tbody = document.getElementById('topupTableBody');
    tbody.innerHTML = '';
    
    let filteredData = topupData;
    if (currentUser.role !== 'admin') {
        filteredData = topupData.filter(d => d.branch === currentUser.branch);
    }
    
    filteredData.forEach((data, index) => {
        const originalIndex = topupData.indexOf(data);
        const canEdit = canEditData(data);
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${data.date}</td>
            <td>${data.staff}</td>
            <td>${data.branch}</td>
            <td>${data.customer}</td>
            <td>${data.phone}</td>
            <td>${data.contact}</td>
            <td>${data.product}</td>
            <td>${data.expiry}</td>
            <td>${data.remark}</td>
            <td class="actions">
                <button class="edit-btn" onclick="editTopUpRow(${originalIndex})" ${!canEdit ? 'disabled' : ''} title="${canEdit ? 'Edit' : 'អ្នកមិនអាចកែប្រែទិន្នន័យនេះបានទេ'}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteTopUpRow(${originalIndex})" ${!canEdit ? 'disabled' : ''} title="${canEdit ? 'Delete' : 'អ្នកមិនអាចលុបទិន្នន័យនេះបានទេ'}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

function editTopUpRow(index) {
    const data = topupData[index];
    if (!canEditData(data)) {
        showSuccessPopup('អ្នកមិនអាចកែប្រែទិន្នន័យរបស់បុគ្គលិកផ្សេងបានទេ!');
        return;
    }
    
    document.getElementById('topup_date').value = data.date;
    document.getElementById('topup_staff').value = data.staff;
    document.getElementById('topup_customer').value = data.customer;
    document.getElementById('topup_phone').value = data.phone;
    document.getElementById('topup_contact').value = data.contact === '-' ? '' : data.contact;
    document.getElementById('topup_product').value = data.product;
    document.getElementById('topup_expiry').value = data.expiry;
    document.getElementById('topup_remark').value = data.remark === '-' ? '' : data.remark;
    document.getElementById('edit_topup_index').value = index;
    document.getElementById('topupModalTitle').textContent = 'កែប្រែ Top Up';
    document.getElementById('topupModal').style.display = 'block';
}

function deleteTopUpRow(index) {
    const data = topupData[index];
    if (!canEditData(data)) {
        showSuccessPopup('អ្នកមិនអាចលុបទិន្នន័យរបស់បុគ្គលិកផ្សេងបានទេ!');
        return;
    }
    
    if (confirm('តើអ្នកប្រាកដថាចង់លុប Top Up នេះមែនទេ?')) {
        topupData.splice(index, 1);
        saveDataToStorage();
        refreshTopUpTable();
        checkExpiringCustomers();
        showSuccessPopup('បានលុប Top Up ដោយជោគជ័យ!');
    }
}

// ===================== EXPIRY CHECK =====================
function checkExpiringCustomers() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    let expiredCount = 0;
    let expirySoonCount = 0;
    let expiryRows = [];
    
    let filteredData = topupData;
    if (currentUser.role !== 'admin') {
        filteredData = topupData.filter(d => d.branch === currentUser.branch);
    }
    
    filteredData.forEach((data, index) => {
        const expiryDate = new Date(data.expiry);
        expiryDate.setHours(0, 0, 0, 0);
        
        let status = '';
        let rowClass = '';
        
        if (expiryDate < today) {
            expiredCount++;
            status = '<span class="expiry-status expiry-expired"><i class="fas fa-times-circle"></i> ផុតកំណត់</span>';
            rowClass = 'expiry-row-danger';
        } else if (expiryDate <= sevenDaysFromNow) {
            expirySoonCount++;
            const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            status = `<span class="expiry-status expiry-soon"><i class="fas fa-exclamation-triangle"></i> ជិតផុត (${daysLeft} ថ្ងៃ)</span>`;
            rowClass = 'expiry-row-warning';
        }
        
        if (status) {
            expiryRows.push({...data, status, rowClass, originalIndex: topupData.indexOf(data)});
        }
    });
    
    const tbody = document.getElementById('expiryTableBody');
    tbody.innerHTML = '';
    
    if (expiryRows.length > 0) {
        expiryRows.forEach(data => {
            const canEdit = canEditData(data);
            const row = tbody.insertRow();
            row.className = data.rowClass;
            row.innerHTML = `
                <td>${data.date}</td>
                <td>${data.staff}</td>
                <td>${data.branch}</td>
                <td>${data.customer}</td>
                <td>${data.phone}</td>
                <td>${data.contact}</td>
                <td>${data.product}</td>
                <td>${data.expiry}</td>
                <td>${data.status}</td>
                <td>${data.remark}</td>
                <td class="actions">
                    <button class="edit-btn" onclick="editTopUpRow(${data.originalIndex})" ${!canEdit ? 'disabled' : ''} title="${canEdit ? 'Edit' : 'អ្នកមិនអាចកែប្រែទិន្នន័យនេះបានទេ'}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deleteTopUpRow(${data.originalIndex})" ${!canEdit ? 'disabled' : ''} title="${canEdit ? 'Delete' : 'អ្នកមិនអាចលុបទិន្នន័យនេះបានទេ'}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
        });
    } else {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 30px; color: #6c757d;">
                    <i class="fas fa-check-circle" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                    គ្មានអតិថិជនជិតផុតកំណត់ ឬ ផុតកំណត់ទេ
                </td>
            </tr>
        `;
    }
    
    if (expiredCount > 0) {
        document.getElementById('expiredCount').textContent = expiredCount;
        document.getElementById('expiryDangerWarning').classList.remove('hidden');
    } else {
        document.getElementById('expiryDangerWarning').classList.add('hidden');
    }
    
    if (expirySoonCount > 0) {
        document.getElementById('expirySoonCount').textContent = expirySoonCount;
        document.getElementById('expiryWarning').classList.remove('hidden');
    } else {
        document.getElementById('expiryWarning').classList.add('hidden');
    }
}

// ===================== USER MODAL =====================
function openUserModal() {
    document.getElementById('userModal').style.display = 'block';
    document.getElementById('edit_user_index').value = '';
    document.getElementById('user_password').required = true;
    document.getElementById('user_password').placeholder = '';
    document.getElementById('userModalTitle').textContent = 'បន្ថែមអ្នកប្រើប្រាស់ថ្មី';
}

function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
    document.getElementById('userForm').reset();
}

document.getElementById('userForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const editIndex = document.getElementById('edit_user_index').value;
    
    const formData = {
        username: document.getElementById('user_username').value,
        password: document.getElementById('user_password').value,
        fullname: document.getElementById('user_fullname').value,
        role: document.getElementById('user_role').value,
        branch: document.getElementById('user_branch').value,
        status: document.getElementById('user_status').value,
        createdDate: editIndex !== '' ? usersData[editIndex].createdDate : new Date().toISOString().split('T')[0]
    };

    if (editIndex !== '') {
        if (!formData.password) {
            formData.password = usersData[editIndex].password;
        }
        usersData[editIndex] = formData;
        showSuccessPopup('បានកែប្រែអ្នកប្រើប្រាស់ដោយជោគជ័យ!');
    } else {
        if (usersData.some(u => u.username === formData.username)) {
            showSuccessPopup('Username នេះមានរួចហើយ! សូមប្រើ Username ផ្សេង។');
            return;
        }
        usersData.push(formData);
        showSuccessPopup('អ្នកប្រើប្រាស់ត្រូវបានបន្ថែមដោយជោគជ័យ!');
    }
    
    saveDataToStorage();
    refreshUsersTable();
    populateFilters();
    closeUserModal();
});

function refreshUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    usersData.forEach((data, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${data.username}</td>
            <td>${data.fullname}</td>
            <td><span class="status-badge status-${data.role}">${data.role.toUpperCase()}</span></td>
            <td>${data.branch}</td>
            <td><span class="status-badge status-${data.status}">${data.status.toUpperCase()}</span></td>
            <td>${data.createdDate}</td>
            <td class="actions">
                <button class="edit-btn" onclick="editUserRow(${index})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteUserRow(${index})" ${data.username === 'admin' && data.role === 'admin' ? 'disabled' : ''} title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    });
}

function editUserRow(index) {
    const data = usersData[index];
    document.getElementById('user_username').value = data.username;
    document.getElementById('user_fullname').value = data.fullname;
    document.getElementById('user_role').value = data.role;
    document.getElementById('user_branch').value = data.branch;
    document.getElementById('user_status').value = data.status;
    document.getElementById('user_password').value = '';
    document.getElementById('user_password').required = false;
    document.getElementById('user_password').placeholder = 'Leave empty to keep current password';
    document.getElementById('edit_user_index').value = index;
    document.getElementById('userModalTitle').textContent = 'កែប្រែអ្នកប្រើប្រាស់';
    document.getElementById('userModal').style.display = 'block';
}

function deleteUserRow(index) {
    const user = usersData[index];
    if (user.username === 'admin' && user.role === 'admin') {
        showSuccessPopup('មិនអាចលុប Admin account មេបានទេ!');
        return;
    }
    if (confirm(`តើអ្នកប្រាកដថាចង់លុបអ្នកប្រើប្រាស់ "${user.fullname}" មែនទេ?`)) {
        usersData.splice(index, 1);
        saveDataToStorage();
        refreshUsersTable();
        populateFilters();
        showSuccessPopup('បានលុបអ្នកប្រើប្រាស់ដោយជោគជ័យ!');
    }
}

// ===================== MODAL CLICK OUTSIDE =====================
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}
