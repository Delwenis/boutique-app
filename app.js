// Variables globales
let products = [];
let clients = [];
let sales = [];
let expenses = [];
let cart = [];
let toOrder = [];

// Initialisation
window.addEventListener('DOMContentLoaded', function() {
    loadData();
    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    }, 500);
});

// Gestion du stockage
function saveData() {
    localStorage.setItem('boutique_products', JSON.stringify(products));
    localStorage.setItem('boutique_clients', JSON.stringify(clients));
    localStorage.setItem('boutique_sales', JSON.stringify(sales));
    localStorage.setItem('boutique_expenses', JSON.stringify(expenses));
    localStorage.setItem('boutique_toorder', JSON.stringify(toOrder));
}

function loadData() {
    const savedProducts = localStorage.getItem('boutique_products');
    const savedClients = localStorage.getItem('boutique_clients');
    const savedSales = localStorage.getItem('boutique_sales');
    const savedExpenses = localStorage.getItem('boutique_expenses');
    const savedToOrder = localStorage.getItem('boutique_toorder');

    if (savedProducts) products = JSON.parse(savedProducts);
    if (savedClients) clients = JSON.parse(savedClients);
    if (savedSales) sales = JSON.parse(savedSales);
    if (savedExpenses) expenses = JSON.parse(savedExpenses);
    if (savedToOrder) toOrder = JSON.parse(savedToOrder);
}

// Navigation
function showPage(pageId) {
    const pages = ['main-menu', 'stock-menu', 'add-product', 'update-stock', 'view-stock', 
                   'sales', 'receipt-page', 'clients', 'accounting', 'add-expense', 
                   'expenses-list', 'revenues', 'balance', 'to-order', 'stats'];
    pages.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.remove('hidden');

    if (pageId === 'view-stock') refreshStockTable();
    if (pageId === 'update-stock') refreshUpdateProductSelect();
    if (pageId === 'sales') {
        refreshSaleSelects();
        resetCart();
    }
    if (pageId === 'clients') refreshClientsTable();
    if (pageId === 'stats') refreshStats();
    if (pageId === 'expenses-list') refreshExpensesList();
    if (pageId === 'revenues') refreshRevenues();
    if (pageId === 'balance') refreshBalance();
    if (pageId === 'to-order') refreshToOrder();

    window.scrollTo(0, 0);
}

// Alertes
function showAlert(message) {
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    
    const alertBox = document.createElement('div');
    alertBox.className = 'alert-box';
    alertBox.innerHTML = `
        <p style="margin-bottom: 20px; font-size: 16px;">${message}</p>
        <button class="btn btn-secondary" style="padding: 10px 25px;" onclick="closeAlert()">OK</button>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(alertBox);
    
    window.closeAlert = function() {
        document.body.removeChild(overlay);
        document.body.removeChild(alertBox);
    };
}

// Gestion des produits
function addProduct(event) {
    event.preventDefault();
    const name = document.getElementById('product-name').value;
    const buyPrice = parseFloat(document.getElementById('product-buy-price').value);
    const sellPrice = parseFloat(document.getElementById('product-sell-price').value);
    const quantity = parseInt(document.getElementById('product-quantity').value);

    const product = {
        id: Date.now(),
        nom: name,
        prixAchat: buyPrice,
        prixVente: sellPrice,
        quantite: quantity,
        dateAjout: new Date().toISOString()
    };

    products.push(product);
    saveData();
    showAlert('Article ajouté avec succès!');
    document.getElementById('product-name').value = '';
    document.getElementById('product-buy-price').value = '';
    document.getElementById('product-sell-price').value = '';
    document.getElementById('product-quantity').value = '';
}

function refreshUpdateProductSelect() {
    const select = document.getElementById('update-product-select');
    select.innerHTML = '<option value="">-- Choisir un produit --</option>';
    products.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.nom} (Stock actuel: ${p.quantite})`;
        select.appendChild(option);
    });
}

function loadProductForUpdate() {
    const select = document.getElementById('update-product-select');
    const productId = parseInt(select.value);
    const fields = document.getElementById('update-form-fields');

    if (!productId) {
        fields.classList.add('hidden');
        return;
    }

    const product = products.find(p => p.id === productId);
    if (product) {
        document.getElementById('update-buy-price').value = product.prixAchat;
        document.getElementById('update-sell-price').value = product.prixVente;
        document.getElementById('update-quantity').value = '';
        fields.classList.remove('hidden');
    }
}

function updateStock(event) {
    event.preventDefault();
    const productId = parseInt(document.getElementById('update-product-select').value);
    const buyPrice = parseFloat(document.getElementById('update-buy-price').value);
    const sellPrice = parseFloat(document.getElementById('update-sell-price').value);
    const addQuantity = parseInt(document.getElementById('update-quantity').value) || 0;

    products = products.map(p => {
        if (p.id === productId) {
            return {
                ...p,
                prixAchat: buyPrice,
                prixVente: sellPrice,
                quantite: p.quantite + addQuantity
            };
        }
        return p;
    });

    // Mettre à jour les commandes si nécessaire
    if (addQuantity > 0) {
        updateToOrderAfterStockUpdate(productId, addQuantity);
    }

    saveData();
    showAlert('Stock mis à jour avec succès!');
    document.getElementById('update-product-select').value = '';
    document.getElementById('update-form-fields').classList.add('hidden');
    refreshUpdateProductSelect();
}

function refreshStockTable() {
    const tbody = document.getElementById('stock-table-body');
    tbody.innerHTML = '';

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Aucun produit en stock</td></tr>';
        document.getElementById('total-stock-value').textContent = '0 FCFA';
        return;
    }

    let totalValue = 0;
    products.forEach((p, index) => {
        const value = p.prixAchat * p.quantite;
        totalValue += value;
        const tr = document.createElement('tr');
        tr.style.background = index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
        tr.innerHTML = `
            <td style="font-weight: 600;">${p.nom}</td>
            <td style="text-align: center;">${p.prixAchat.toLocaleString()} FCFA</td>
            <td style="text-align: center; color: #4ecdc4;">${p.prixVente.toLocaleString()} FCFA</td>
            <td style="text-align: center; color: ${p.quantite < 10 ? '#ff6b6b' : '#ffe66d'};">${p.quantite}</td>
            <td style="text-align: right; font-weight: 600;">${value.toLocaleString()} FCFA</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('total-stock-value').textContent = totalValue.toLocaleString() + ' FCFA';
}

// Gestion des ventes
function refreshSaleSelects() {
    const clientSelect = document.getElementById('sale-client-select');
    const productSelect = document.getElementById('sale-product-select');

    clientSelect.innerHTML = '<option value="">-- Sélectionner un client --</option>';
    clients.forEach(c => {
        const option = document.createElement('option');
        option.value = c.id;
        option.textContent = `${c.nom} (${c.contact})`;
        clientSelect.appendChild(option);
    });

    productSelect.innerHTML = '<option value="">-- Sélectionner un produit --</option>';
    products.filter(p => p.quantite > 0).forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = `${p.nom} - ${p.prixVente.toLocaleString()} FCFA (Stock: ${p.quantite})`;
        productSelect.appendChild(option);
    });
}

function addToCart() {
    const productId = parseInt(document.getElementById('sale-product-select').value);
    const quantity = parseInt(document.getElementById('sale-quantity').value);

    if (!productId) {
        showAlert('Veuillez sélectionner un produit');
        return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.quantite < quantity) {
        showAlert('Stock insuffisant');
        return;
    }

    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            productId: productId,
            nom: product.nom,
            prixVente: product.prixVente,
            prixAchat: product.prixAchat,
            quantity: quantity
        });
    }

    document.getElementById('sale-product-select').value = '';
    document.getElementById('sale-quantity').value = '1';
    refreshCart();
}

function refreshCart() {
    const cartItems = document.getElementById('cart-items');
    const cartSummary = document.getElementById('cart-summary');

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-state">Le panier est vide</div>';
        cartSummary.classList.add('hidden');
        return;
    }

    cartItems.innerHTML = '';
    cart.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-header">
                <span style="font-weight: 600;">${item.nom}</span>
                <button class="btn-delete" onclick="removeFromCart(${index})">
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
            <div class="cart-item-details">
                <div>
                    <input type="number" class="form-control input-small" value="${item.quantity}" min="1" onchange="updateCartQuantity(${index}, this.value)">
                    <span style="margin-left: 10px;">× ${item.prixVente.toLocaleString()} FCFA</span>
                </div>
                <span style="font-weight: 700; color: #4ecdc4;">${(item.prixVente * item.quantity).toLocaleString()} FCFA</span>
            </div>
        `;
        cartItems.appendChild(div);
    });

    const total = cart.reduce((sum, item) => sum + (item.prixVente * item.quantity), 0);
    document.getElementById('cart-total').textContent = total.toLocaleString() + ' FCFA';
    cartSummary.classList.remove('hidden');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    refreshCart();
}

function updateCartQuantity(index, newQuantity) {
    const quantity = parseInt(newQuantity);
    if (quantity < 1) return;
    cart[index].quantity = quantity;
    refreshCart();
}

function resetCart() {
    cart = [];
    document.getElementById('sale-quantity').value = '1';
    document.getElementById('sale-paid').value = '0';
    refreshCart();
}

function validateSale() {
    const clientId = parseInt(document.getElementById('sale-client-select').value);
    const paid = parseFloat(document.getElementById('sale-paid').value) || 0;

    if (!clientId) {
        showAlert('Veuillez sélectionner un client');
        return;
    }

    if (cart.length === 0) {
        showAlert('Le panier est vide');
        return;
    }

    const client = clients.find(c => c.id === clientId);
    const total = cart.reduce((sum, item) => sum + (item.prixVente * item.quantity), 0);
    const newDebt = (client.dette || 0) + total - paid;

    const sale = {
        id: Date.now(),
        clientId: clientId,
        clientNom: client.nom,
        clientContact: client.contact,
        items: [...cart],
        total: total,
        solde: paid,
        dette: newDebt,
        date: new Date().toISOString()
    };

    sales.push(sale);

    // Mettre à jour le stock et ajouter aux articles à commander
    cart.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
            product.quantite -= item.quantity;
        }
        
        // Ajouter à la liste "à commander"
        addToOrderList(item.productId, item.nom, item.quantity, item.prixAchat);
    });

    client.dette = newDebt;

    saveData();
    showReceipt(sale);
}

function showReceipt(sale) {
    document.getElementById('receipt-date').textContent = new Date(sale.date).toLocaleString('fr-FR');
    document.getElementById('receipt-client-name').textContent = sale.clientNom;
    document.getElementById('receipt-client-contact').textContent = sale.clientContact;

    const tbody = document.getElementById('receipt-items-body');
    tbody.innerHTML = '';
    sale.items.forEach(item => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #ddd';
        tr.innerHTML = `
            <td style="padding: 10px; color: #1a1a2e;">${item.nom}</td>
            <td style="padding: 10px; text-align: center; color: #1a1a2e;">${item.quantity}</td>
            <td style="padding: 10px; text-align: right; color: #1a1a2e;">${item.prixVente.toLocaleString()} FCFA</td>
            <td style="padding: 10px; text-align: right; color: #1a1a2e;">${(item.prixVente * item.quantity).toLocaleString()} FCFA</td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('receipt-total').textContent = sale.total.toLocaleString() + ' FCFA';
    document.getElementById('receipt-paid').textContent = sale.solde.toLocaleString() + ' FCFA';
    document.getElementById('receipt-debt').textContent = sale.dette.toLocaleString() + ' FCFA';

    showPage('receipt-page');
}

// Gestion des clients
function toggleClientForm() {
    const form = document.getElementById('client-form');
    const toggleText = document.getElementById('client-form-toggle-text');
    if (form.classList.contains('hidden')) {
        form.classList.remove('hidden');
        toggleText.textContent = 'ANNULER';
    } else {
        form.classList.add('hidden');
        toggleText.textContent = '+ AJOUTER UN CLIENT';
    }
}

function addClient(event) {
    event.preventDefault();
    const name = document.getElementById('client-name').value;
    const contact = document.getElementById('client-contact').value;

    const client = {
        id: Date.now(),
        nom: name,
        contact: contact,
        dette: 0,
        dateAjout: new Date().toISOString()
    };

    clients.push(client);
    saveData();
    showAlert('Client ajouté avec succès!');
    document.getElementById('client-name').value = '';
    document.getElementById('client-contact').value = '';
    toggleClientForm();
    refreshClientsTable();
}

function refreshClientsTable() {
    const tbody = document.getElementById('clients-table-body');
    tbody.innerHTML = '';

    if (clients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Aucun client enregistré</td></tr>';
        return;
    }

    clients.forEach((c, index) => {
        const tr = document.createElement('tr');
        tr.style.background = index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
        tr.innerHTML = `
            <td style="font-weight: 600;">${c.nom}</td>
            <td style="text-align: center;">${c.contact}</td>
            <td style="text-align: right; color: ${(c.dette || 0) > 0 ? '#ff6b6b' : '#4ecdc4'}; font-weight: 600;">${(c.dette || 0).toLocaleString()} FCFA</td>
        `;
        tbody.appendChild(tr);
    });
}

// Gestion des dépenses
function addExpense(event) {
    event.preventDefault();
    const title = document.getElementById('expense-title').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);

    const expense = {
        id: Date.now(),
        titre: title,
        montant: amount,
        date: new Date().toISOString()
    };

    expenses.push(expense);
    saveData();
    showAlert('Dépense enregistrée avec succès!');
    document.getElementById('expense-title').value = '';
    document.getElementById('expense-amount').value = '';
}

function refreshExpensesList() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const total = monthExpenses.reduce((sum, e) => sum + e.montant, 0);
    document.getElementById('total-expenses-month').textContent = total.toLocaleString() + ' FCFA';

    const tbody = document.getElementById('expenses-table-body');
    tbody.innerHTML = '';

    if (monthExpenses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty-state">Aucune dépense ce mois</td></tr>';
        return;
    }

    monthExpenses.reverse().forEach((e, index) => {
        const tr = document.createElement('tr');
        tr.style.background = index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
        tr.innerHTML = `
            <td style="font-size: 14px;">${new Date(e.date).toLocaleDateString('fr-FR')}</td>
            <td style="font-weight: 600;">${e.titre}</td>
            <td style="text-align: right; color: #ff6b6b; font-weight: 600;">${e.montant.toLocaleString()} FCFA</td>
        `;
        tbody.appendChild(tr);
    });
}

function refreshRevenues() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthSales = sales.filter(s => {
        const date = new Date(s.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const total = monthSales.reduce((sum, s) => sum + s.total, 0);
    document.getElementById('total-revenues-month').textContent = total.toLocaleString() + ' FCFA';

    const tbody = document.getElementById('revenues-table-body');
    tbody.innerHTML = '';

    if (monthSales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Aucune vente ce mois</td></tr>';
        return;
    }

    monthSales.reverse().forEach((s, index) => {
        const tr = document.createElement('tr');
        tr.style.background = index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
        tr.innerHTML = `
            <td style="font-size: 14px;">${new Date(s.date).toLocaleDateString('fr-FR')}</td>
            <td style="font-weight: 600;">${s.clientNom}</td>
            <td style="text-align: center;">${s.items.length}</td>
            <td style="text-align: right; color: #4ecdc4; font-weight: 600;">${s.total.toLocaleString()} FCFA</td>
        `;
        tbody.appendChild(tr);
    });
}

function refreshBalance() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthSales = sales.filter(s => {
        const date = new Date(s.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const monthExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const revenues = monthSales.reduce((sum, s) => sum + s.total, 0);
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.montant, 0);
    const profit = revenues - totalExpenses;

    document.getElementById('balance-revenues').textContent = revenues.toLocaleString() + ' FCFA';
    document.getElementById('balance-expenses').textContent = totalExpenses.toLocaleString() + ' FCFA';
    document.getElementById('balance-profit').textContent = profit.toLocaleString() + ' FCFA';
}

// Gestion des commandes
function addToOrderList(productId, productName, quantitySold, buyPrice) {
    const existingOrder = toOrder.find(o => o.productId === productId);
    
    if (existingOrder) {
        existingOrder.quantityToOrder += quantitySold;
    } else {
        toOrder.push({
            productId: productId,
            productName: productName,
            quantitySold: quantitySold,
            quantityToOrder: quantitySold,
            buyPrice: buyPrice
        });
    }
    
    saveData();
}

function updateToOrderAfterStockUpdate(productId, quantityAdded) {
    const orderIndex = toOrder.findIndex(o => o.productId === productId);
    
    if (orderIndex !== -1) {
        const order = toOrder[orderIndex];
        order.quantityToOrder -= quantityAdded;
        
        if (order.quantityToOrder <= 0) {
            toOrder.splice(orderIndex, 1);
        }
        
        saveData();
    }
}

function refreshToOrder() {
    const tbody = document.getElementById('to-order-table-body');
    tbody.innerHTML = '';

    if (toOrder.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Aucun article à commander</td></tr>';
        return;
    }

    toOrder.forEach((order, index) => {
        const totalCost = order.quantityToOrder * order.buyPrice;
        const tr = document.createElement('tr');
        tr.style.background = index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
        tr.innerHTML = `
            <td style="font-weight: 600;">${order.productName}</td>
            <td style="text-align: center; color: #ffe66d;">${order.quantitySold}</td>
            <td style="text-align: center; color: #ff6b6b; font-weight: 600;">${order.quantityToOrder}</td>
            <td style="text-align: right; font-weight: 600;">${totalCost.toLocaleString()} FCFA</td>
            <td style="text-align: center;">
                <button class="btn btn-secondary" style="padding: 8px 15px; font-size: 14px;" onclick="markAsOrdered(${order.productId})">
                    ✓ Commandé
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function markAsOrdered(productId) {
    const orderIndex = toOrder.findIndex(o => o.productId === productId);
    if (orderIndex !== -1) {
        toOrder.splice(orderIndex, 1);
        saveData();
        refreshToOrder();
        showAlert('Article marqué comme commandé!');
    }
}

// Statistiques
function refreshStats() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const yearSales = sales.filter(s => new Date(s.date).getFullYear() === currentYear);
    const monthSales = sales.filter(s => {
        const date = new Date(s.date);
        return date.getFullYear() === currentYear && date.getMonth() === currentMonth;
    });

    function calculateStats(salesArray) {
        const totalRevenue = salesArray.reduce((sum, s) => sum + s.total, 0);
        const totalPaid = salesArray.reduce((sum, s) => sum + s.solde, 0);
        const totalDebt = salesArray.reduce((sum, s) => sum + (s.total - s.solde), 0);
        return { totalRevenue, totalPaid, totalDebt };
    }

    const yearStats = calculateStats(yearSales);
    const monthStats = calculateStats(monthSales);

    const monthName = new Date(currentYear, currentMonth).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).toUpperCase();

    document.getElementById('month-stats').innerHTML = `
        <p style="margin-bottom: 20px; font-size: 14px; opacity: 0.8;">${monthName}</p>
        <div class="stat-card">
            <div class="stat-label">Ventes totales</div>
            <div class="stat-value">${monthStats.totalRevenue.toLocaleString()} FCFA</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Montant encaissé</div>
            <div class="stat-value">${monthStats.totalPaid.toLocaleString()} FCFA</div>
        </div>
        <div class="stat-card" style="border-color: rgba(255,107,107,0.3);">
            <div class="stat-label">Créances</div>
            <div class="stat-value" style="color: #ff6b6b;">${monthStats.totalDebt.toLocaleString()} FCFA</div>
        </div>
        <div class="stat-card" style="border-color: rgba(255,230,109,0.3);">
            <div class="stat-label">Nombre de ventes</div>
            <div class="stat-value" style="color: #ffe66d;">${monthSales.length}</div>
        </div>
    `;

    document.getElementById('year-stats').innerHTML = `
        <p style="margin-bottom: 20px; font-size: 14px; opacity: 0.8;">${currentYear}</p>
        <div class="stat-card">
            <div class="stat-label">Ventes totales</div>
            <div class="stat-value">${yearStats.totalRevenue.toLocaleString()} FCFA</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Montant encaissé</div>
            <div class="stat-value">${yearStats.totalPaid.toLocaleString()} FCFA</div>
        </div>
        <div class="stat-card" style="border-color: rgba(255,107,107,0.3);">
            <div class="stat-label">Créances</div>
            <div class="stat-value" style="color: #ff6b6b;">${yearStats.totalDebt.toLocaleString()} FCFA</div>
        </div>
        <div class="stat-card" style="border-color: rgba(255,230,109,0.3);">
            <div class="stat-label">Nombre de ventes</div>
            <div class="stat-value" style="color: #ffe66d;">${yearSales.length}</div>
        </div>
    `;

    const tbody = document.getElementById('sales-table-body');
    tbody.innerHTML = '';

    if (sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Aucune vente enregistrée</td></tr>';
        return;
    }

    const recentSales = [...sales].reverse().slice(0, 10);
    recentSales.forEach((s, index) => {
        const tr = document.createElement('tr');
        tr.style.background = index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent';
        tr.innerHTML = `
            <td style="font-size: 14px;">${new Date(s.date).toLocaleDateString('fr-FR')}</td>
            <td style="font-weight: 600;">${s.clientNom}</td>
            <td style="text-align: center;">${s.items.length}</td>
            <td style="text-align: right; font-weight: 600;">${s.total.toLocaleString()} FCFA</td>
            <td style="text-align: right; color: #4ecdc4;">${s.solde.toLocaleString()} FCFA</td>
            <td style="text-align: right; color: #ff6b6b;">${(s.total - s.solde).toLocaleString()} FCFA</td>
        `;
        tbody.appendChild(tr);
    });
}

function exportSalesCSV() {
    if (sales.length === 0) {
        showAlert('Aucune vente à exporter');
        return;
    }

    const headers = ['Date', 'Client', 'Contact', 'Total', 'Soldé', 'Dette'];
    const rows = sales.map(s => [
        new Date(s.date).toLocaleString('fr-FR'),
        s.clientNom,
        s.clientContact,
        s.total,
        s.solde,
        s.total - s.solde
    ]);

    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ventes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
