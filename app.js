// TEMPLATES DE PRODUCTOS
const TEMPLATES = {
    dulces: [
        { name: 'Galletas', price: 2.50 },
        { name: 'Chicles', price: 0.50 },
        { name: 'Caramelos', price: 1.00 },
        { name: 'Chupetín', price: 1.50 },
        { name: 'Chocolatina', price: 3.00 }
    ],
    ropa: [
        { name: 'Camiseta', price: 25.00 },
        { name: 'Pantalón', price: 50.00 },
        { name: 'Shorts', price: 35.00 },
        { name: 'Calcetines', price: 5.00 }
    ],
    comida: [
        { name: 'Arepa', price: 3.00 },
        { name: 'Empanada', price: 2.50 },
        { name: 'Sandwich', price: 8.00 },
        { name: 'Jugo', price: 2.00 },
        { name: 'Café', price: 1.50 }
    ],
    accesorios: [
        { name: 'Collar', price: 15.00 },
        { name: 'Pulsera', price: 10.00 },
        { name: 'Anillo', price: 12.00 },
        { name: 'Gorro', price: 20.00 }
    ]
};

// ESTADO DE LA APP
let state = {
    products: [],
    sales: {}
};

// INICIALIZAR APP
document.addEventListener('DOMContentLoaded', function() {
    loadState();
    setupEventListeners();
    renderProducts();
    renderSales();
    updateDate();
    
    // Cargar template por defecto
    if (state.products.length === 0) {
        loadTemplate('dulces');
    }
});

// GUARDAR/CARGAR ESTADO
function saveState() {
    localStorage.setItem('miTiendita_state', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('miTiendita_state');
    if (saved) {
        state = JSON.parse(saved);
    }
}

// EVENT LISTENERS
function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const screenId = this.getAttribute('data-screen');
            switchScreen(screenId);
        });
    });

    // Enter en input de producto
    document.getElementById('productName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('productPrice').focus();
        }
    });

    document.getElementById('productPrice').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addProduct();
        }
    });
}

// CAMBIAR PANTALLA
function switchScreen(screenId) {
    // Ocultar todas las pantallas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Mostrar pantalla activa
    document.getElementById(screenId).classList.add('active');

    // Actualizar botones de sidebar
    document.querySelectorAll('.sidebar-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-screen="${screenId}"]`).classList.add('active');

    // Actualizar resumen si vamos a esa pantalla
    if (screenId === 'resumen') {
        updateSummary();
    }
}

// CARGAR TEMPLATE
function loadTemplate(templateName) {
    if (!TEMPLATES[templateName]) {
        alert('Template no encontrado');
        return;
    }

    state.products = JSON.parse(JSON.stringify(TEMPLATES[templateName]));
    state.sales = {};
    
    state.products.forEach(product => {
        state.sales[product.name] = 0;
    });

    saveState();
    renderProducts();
    renderSales();
    renderProductsList();
    updateSummary();
    
    alert(`Template "${templateName}" cargado exitosamente`);
}

// AGREGAR PRODUCTO MANUAL
function addProduct() {
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);

    if (!name) {
        alert('Por favor ingresa el nombre del producto');
        return;
    }

    if (isNaN(price) || price <= 0) {
        alert('Por favor ingresa un precio válido');
        return;
    }

    if (state.products.find(p => p.name === name)) {
        alert('Este producto ya existe');
        return;
    }

    state.products.push({ name, price });
    state.sales[name] = 0;

    saveState();
    renderProducts();
    renderSales();
    renderProductsList();

    document.getElementById('productName').value = '';
    document.getElementById('productPrice').value = '';
    document.getElementById('productName').focus();
    
    alert('Producto agregado exitosamente');
}

// ELIMINAR PRODUCTO
function deleteProduct(productName) {
    if (!confirm(`¿Eliminar "${productName}"?`)) {
        return;
    }

    state.products = state.products.filter(p => p.name !== productName);
    delete state.sales[productName];

    saveState();
    renderProducts();
    renderSales();
    renderProductsList();
    updateSummary();
}

// REGISTRAR VENTA
function recordSale(productName) {
    state.sales[productName]++;
    saveState();
    renderSales();
    updateSummary();
}

// RESETEAR DÍA
function resetDay() {
    if (!confirm('¿Estás seguro de que quieres resetear todas las ventas del día?')) {
        return;
    }

    for (let product in state.sales) {
        state.sales[product] = 0;
    }

    saveState();
    renderSales();
    updateSummary();
}

// RENDERIZAR PRODUCTOS (PUNTO DE VENTA)
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    
    if (state.products.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 40px 20px;">No hay productos. Carga un template.</p>';
        return;
    }

    grid.innerHTML = state.products.map(product => `
        <button class="product-btn" onclick="recordSale('${product.name}')">
            <div class="product-name">${product.name}</div>
            <div class="product-count" id="count-${product.name}">${state.sales[product.name] || 0}</div>
            <div class="product-price">S/. ${product.price.toFixed(2)}</div>
        </button>
    `).join('');
}

// ACTUALIZAR CONTADORES
function renderSales() {
    state.products.forEach(product => {
        const element = document.getElementById(`count-${product.name}`);
        if (element) {
            element.textContent = (state.sales[product.name] || 0);
        }
    });
}

// RENDERIZAR LISTA DE PRODUCTOS (GESTIONAR PRODUCTOS)
function renderProductsList() {
    const list = document.getElementById('productsList');
    
    if (state.products.length === 0) {
        list.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #999; padding: 20px;">No hay productos aún.</p>';
        return;
    }

    list.innerHTML = state.products.map(product => `
        <div class="product-item">
            <div class="product-item-name">${product.name}</div>
            <div class="product-item-price">S/. ${product.price.toFixed(2)}</div>
            <button class="product-item-delete" onclick="deleteProduct('${product.name}')">✕</button>
        </div>
    `).join('');
}

// ACTUALIZAR RESUMEN
function updateSummary() {
    let totalSales = 0;
    let totalItems = 0;
    const summaryRows = [];

    state.products.forEach(product => {
        const quantity = state.sales[product.name] || 0;
        if (quantity > 0) {
            const subtotal = quantity * product.price;
            totalSales += subtotal;
            totalItems += quantity;
            summaryRows.push({
                name: product.name,
                quantity,
                price: product.price,
                subtotal
            });
        }
    });

    // Actualizar cards
    document.getElementById('totalSales').textContent = `S/. ${totalSales.toFixed(2)}`;
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('avgSale').textContent = `S/. ${totalItems > 0 ? (totalSales / totalItems).toFixed(2) : '0.00'}`;

    // Renderizar tabla o mensaje vacío
    const summaryContent = document.getElementById('summaryContent');
    
    if (summaryRows.length === 0) {
        summaryContent.innerHTML = `
            <div class="summary-empty">
                <div class="summary-empty-icon">📊</div>
                <div class="summary-empty-text">Sin ventas aún</div>
                <div class="summary-empty-subtext">Ve al Punto de Venta y empieza a registrar</div>
            </div>
        `;
        return;
    }

    const tableHTML = `
        <table class="summary-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Cantidad</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${summaryRows.map(row => `
                    <tr>
                        <td>${row.name}</td>
                        <td>${row.quantity}</td>
                        <td>S/. ${row.price.toFixed(2)}</td>
                        <td>S/. ${row.subtotal.toFixed(2)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    summaryContent.innerHTML = tableHTML;
}

// ACTUALIZAR FECHA
function updateDate() {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const today = new Date();
    const dateString = today.toLocaleDateString('es-ES', options);
    const capitalizedDate = dateString.charAt(0).toUpperCase() + dateString.slice(1);
    
    const dateLabel = document.getElementById('dateLabel');
    if (dateLabel) {
        dateLabel.textContent = capitalizedDate;
    }
}

// INICIAR CON TEMPLATE POR DEFECTO
window.addEventListener('load', function() {
    if (state.products.length === 0) {
        loadTemplate('dulces');
    }
});