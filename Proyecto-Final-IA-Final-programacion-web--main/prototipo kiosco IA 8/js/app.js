// ======== Configuración ========
const API_BASE = 'api.php';

// ======== Datos iniciales (fallback) ========
const PRODUCTS = [
    {id:'p01', n:'Agua 500ml', c:'Bebidas', p:1200, ico:'💧'},
    {id:'p02', n:'Gaseosa cola 500ml', c:'Bebidas', p:1700, ico:'🥤'},
    {id:'p03', n:'Jugo naranja 500ml', c:'Bebidas', p:1600, ico:'🧃'},
    {id:'p04', n:'Energética 473ml', c:'Bebidas', p:2200, ico:'⚡'},
    {id:'p05', n:'Galletitas Oreo', c:'Snacks', p:1500, ico:'🍪'},
    {id:'p06', n:'Galletitas de agua', c:'Snacks', p:1100, ico:'🥠'},
    {id:'p07', n:'Alfajor triple', c:'Snacks', p:1400, ico:'🍫'},
    {id:'p08', n:'Barrita de cereal', c:'Snacks', p:1300, ico:'🥜'},
    {id:'p09', n:'Papas fritas', c:'Snacks', p:1800, ico:'🍟'},
    {id:'p10', n:'Mix frutos secos', c:'Snacks', p:2100, ico:'🥨'},
    {id:'p11', n:'Sándwich JyQ', c:'Snacks', p:2500, ico:'🥪'},
    {id:'p12', n:'Yerba mate 500g', c:'Infusiones', p:4200, ico:'🧉'},
    {id:'p13', n:'Saquitos mate cocido x25', c:'Infusiones', p:2400, ico:'🍵'},
    {id:'p14', n:'Café instantáneo 50g', c:'Infusiones', p:2600, ico:'☕'},
    {id:'p15', n:'Cuaderno A5 rayado', c:'Útiles', p:3100, ico:'📒'},
];

// ======== Estado ========
const state = {
    user: null,
    cart: {},
    history: [],
    favorites: [],
}

// ======== API Functions ========
async function apiCall(endpoint, options = {}) {
    const token = state.user ? state.user.matricula : null;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        },
        ...options
    };

    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }

    try {
        const response = await fetch(`${API_BASE}?action=${endpoint}`, config);
        const data = await response.json();
    
        if (!data.success) {
            throw new Error(data.error || 'Error en la API');
        }
    
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showToast(`Error: ${error.message}`, 'error');
        throw error;
    }
}

async function loadProducts() {
    console.log('📦 Usando productos locales');
    return PRODUCTS; // Siempre usar locales
}

async function doLogin() {
    const mat = document.getElementById('mat-input').value.trim();
    const name = document.getElementById('name-input').value.trim();
    const password = document.getElementById('password-input').value;

    const matRegex = /^\d{4}-\d{3}$/;
    if (!matRegex.test(mat)) {
        showToast('Formato de matrícula inválido. Usa: 2025-001', 'error');
        return;
    }

    if (!name) {
        showToast('Ingresá tu nombre', 'error');
        return;
    }

    if (!password) {
        showToast('Ingresá una contraseña', 'error');
        return;
    }

    try {
        const data = await apiCall('login', {
            method: 'POST',
            body: { matricula: mat, nombre: name, password: password }
        });
    
        state.user = data.user;
        await loadCart();
        await loadHist();
        await loadFavorites();
        setStatus();
        document.getElementById('login-modal').close();
    
        if (data.user.puntos === 100) {
            assistantSay(`¡Bienvenido/a, <b>${name}</b>! Te registramos correctamente. Recibiste 100 puntos de bienvenida 🥳`);
        } else {
            assistantSay(`¡Hola de nuevo, <b>${name}</b>! Te extrañé. ¿Repetimos lo de siempre? 😎`);
        }
    } catch (error) {
        // Error ya se muestra en apiCall
    }
}

async function loadCart() {
    if (!state.user) {
        state.cart = {};
        return;
    }

    try {
        const data = await apiCall('cart');
        state.cart = {};
        data.cart.forEach(item => {
            state.cart[item.producto_id] = item.cantidad;
        });
        updateCartUI();
    } catch (error) {
        state.cart = {};
    }
}

async function updateCartItem(productId, quantity) {
    if (!state.user) return;

    try {
        await apiCall('cart', {
            method: 'POST',
            body: { producto_id: productId, cantidad: quantity }
        });
    } catch (error) {
        // Error ya manejado en apiCall
    }
}

async function clearCart() {
    if (!state.user) return;

    try {
        await apiCall('cart', {
            method: 'DELETE'
        });
        state.cart = {};
        updateCartUI();
        renderCart();
        showToast('Carrito vaciado', 'success');
    } catch (error) {
        // Error ya manejado en apiCall
    }
}

async function loadFavorites() {
    if (!state.user) {
        state.favorites = [];
        return;
    }

    try {
        const data = await apiCall('favorites');
        state.favorites = data.favorites.map(p => p.id);
    } catch (error) {
        state.favorites = [];
    }
}

async function toggleFavorite(productId) {
    if (!state.user) {
        showToast('Iniciá sesión para usar favoritos', 'error');
        return;
    }

    const isFavorite = state.favorites.includes(productId);

    try {
        if (isFavorite) {
            await apiCall('favorites', {
                method: 'DELETE',
                body: { producto_id: productId }
            });
            state.favorites = state.favorites.filter(id => id !== productId);
            showToast('Eliminado de favoritos', 'info');
        } else {
            await apiCall('favorites', {
                method: 'POST',
                body: { producto_id: productId }
            });
            state.favorites.push(productId);
            showToast('Agregado a favoritos', 'success');
        }
    } catch (error) {
        // Error ya manejado en apiCall
    }
}

async function loadHist() {
    if (!state.user) {
        state.history = [];
        return;
    }

    try {
        const data = await apiCall('history');
        state.history = data.history.map(h => ({
            time: h.fecha,
            items: h.items,
            total: parseFloat(h.total),
            pay: h.metodo_pago,
            points: h.puntos_ganados
        }));
    } catch (error) {
        state.history = [];
    }
}

async function checkout() {
    if (!state.user) {
        showToast('Iniciá sesión para comprar', 'error');
        return;
    }

    const items = Object.entries(state.cart)
        .map(([id, qty]) => ({ id, qty }))
        .filter(i => i.qty > 0);
        
    if (!items.length) {
        showToast('Tu carrito está vacío', 'error');
        return;
    }

    const pay = Array.from(document.querySelectorAll('input[name="pay"]')).find(r => r.checked)?.value || 'Efectivo';

    try {
        const data = await apiCall('checkout', {
            method: 'POST',
            body: { metodo_pago: pay }
        });
    
        // Mostrar ticket
        showTicket(data);
    
        // Limpiar carrito local
        state.cart = {};
        updateCartUI();
        setStatus();
    
        assistantSay(`Compra realizada, <b>${state.user.nombre}</b>. ¡Ganaste ${data.puntos_ganados} puntos! Total: ${money(data.total)}`, false);
    
    } catch (error) {
        // Error ya manejado en apiCall
    }
}

async function loadStats() {
    if (!state.user) return null;

    try {
        const data = await apiCall('stats');
        return data.stats;
    } catch (error) {
        return null;
    }
}

// ======== UI Functions ========
const money = n => '$' + n.toLocaleString('es-AR');

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    document.getElementById('toast-container').appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function renderProducts(list) {
    const wrap = document.getElementById('prod-list');
    wrap.innerHTML = '';
    list.forEach(prod => {
        const q = state.cart[prod.id] || 0;
        const isFavorite = state.favorites.includes(prod.id);
        const el = document.createElement('div');
        el.className = 'prod';
        el.innerHTML = `
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-id="${prod.id}">${isFavorite ? '❤️' : '🤍'}</button>
            <div class="thumb">${prod.ico}</div>
            <h4>${prod.n}</h4>
            <div class="row"><span class="chip">${prod.c}</span><span class="price">${money(prod.p)}</span></div>
            <div class="row">
                <div class="qty">
                    <button class="btn ghost" data-act="dec">−</button>
                    <span>${q}</span>
                    <button class="btn" data-act="inc">+</button>
                </div>
                <button class="btn secondary" data-act="add">Agregar</button>
            </div>`;
    
        el.querySelector('[data-act="inc"]').addEventListener('click', async ()=>{ 
            state.cart[prod.id] = (state.cart[prod.id] || 0) + 1; 
            updateCartUI(); 
            if (state.user) await updateCartItem(prod.id, 1);
        });
    
        el.querySelector('[data-act="dec"]').addEventListener('click', async ()=>{ 
            if((state.cart[prod.id] || 0) > 0){
                state.cart[prod.id] -= 1; 
                updateCartUI();
                if (state.user) await updateCartItem(prod.id, -1);
            } 
        });
    
        el.querySelector('[data-act="add"]').addEventListener('click', async ()=>{ 
            state.cart[prod.id] = (state.cart[prod.id] || 0) + 1; 
            updateCartUI(); 
            if (state.user) await updateCartItem(prod.id, 1);
            showToast(`Añadido: ${prod.n}`, 'success');
        });
    
        el.querySelector('.favorite-btn').addEventListener('click', (e)=>{ 
            toggleFavorite(prod.id);
            e.target.classList.toggle('active');
            e.target.innerHTML = e.target.classList.contains('active') ? '❤️' : '🤍';
        });
    
        wrap.appendChild(el);
    });
}

function updateCartUI() {
    const count = Object.values(state.cart).reduce((a,b)=>a+b,0);
    document.getElementById('cart-count').textContent = count;

    const term = document.getElementById('search').value.toLowerCase();
    const cat = document.getElementById('filter').value;
    const filtered = PRODUCTS.filter(p => (p.n.toLowerCase().includes(term)) && (!cat || p.c===cat));
    renderProducts(filtered);
}

function renderCart() {
    const box = document.getElementById('cart-items');
    box.innerHTML = '';
    let total = 0;
    Object.entries(state.cart).forEach(([id,qty])=>{
        const p = PRODUCTS.find(x=>x.id===id);
        if(!p||qty<=0) return;
        const line = document.createElement('div');
        line.className='row';
        line.style.margin='8px 0';
        const sub = p.p*qty; total+=sub;
        line.innerHTML = `<div>${p.n} × ${qty}</div><div>${money(sub)}</div>`;
        box.appendChild(line);
    })
    document.getElementById('cart-total').textContent = money(total);
}

function renderHistory() {
    const box = document.getElementById('history-content');
    if(!state.history.length){ 
        box.innerHTML = '<small>Aún no hay compras.</small>'; 
        return; 
    }

    box.innerHTML = state.history.map(h=>{
        const when = new Date(h.time).toLocaleString('es-AR');
        return `<div class="ticket" style="margin:8px 0">
            <div class="row">
                <div>🧾 <b>${when}</b></div>
                <div class="points-badge">+${h.points || 0} pts</div>
            </div>
            <div>${h.items}</div>
            <div>Total: ${money(h.total)} — Pago: ${h.pay}</div>
        </div>`;
    }).join('');
}

function renderFavorites() {
    const wrap = document.getElementById('favorites-list');
    wrap.innerHTML = '';

    if (state.favorites.length === 0) {
        wrap.innerHTML = '<p>No tienes productos favoritos aún.</p>';
        return;
    }

    const favoriteProducts = PRODUCTS.filter(p => state.favorites.includes(p.id));

    favoriteProducts.forEach(prod => {
        const q = state.cart[prod.id] || 0;
        const el = document.createElement('div');
        el.className = 'prod';
        el.innerHTML = `
            <button class="favorite-btn active" data-id="${prod.id}">❤️</button>
            <div class="thumb">${prod.ico}</div>
            <h4>${prod.n}</h4>
            <div class="row"><span class="chip">${prod.c}</span><span class="price">${money(prod.p)}</span></div>
            <div class="row">
                <div class="qty">
                    <button class="btn ghost" data-act="dec">−</button>
                    <span>${q}</span>
                    <button class="btn" data-act="inc">+</button>
                </div>
                <button class="btn secondary" data-act="add">Agregar</button>
            </div>`;
    
        el.querySelector('[data-act="inc"]').addEventListener('click', async ()=>{ 
            state.cart[prod.id] = (state.cart[prod.id] || 0) + 1; 
            updateCartUI(); 
            if (state.user) await updateCartItem(prod.id, 1);
        });
    
        el.querySelector('[data-act="dec"]').addEventListener('click', async ()=>{ 
            if((state.cart[prod.id] || 0) > 0){
                state.cart[prod.id] -= 1; 
                updateCartUI();
                if (state.user) await updateCartItem(prod.id, -1);
            } 
        });
    
        el.querySelector('[data-act="add"]').addEventListener('click', async ()=>{ 
            state.cart[prod.id] = (state.cart[prod.id] || 0) + 1; 
            updateCartUI(); 
            if (state.user) await updateCartItem(prod.id, 1);
            showToast(`Añadido: ${prod.n}`, 'success');
        });
    
        el.querySelector('.favorite-btn').addEventListener('click', (e)=>{ 
            toggleFavorite(prod.id);
            e.target.classList.toggle('active');
            e.target.innerHTML = e.target.classList.contains('active') ? '❤️' : '🤍';
            renderFavorites();
        });
    
        wrap.appendChild(el);
    });
}

function renderRecs() {
    // Lógica de recomendaciones simplificada
    let recs = [];

    if (state.favorites && state.favorites.length > 0) {
        recs = state.favorites
            .map(id => PRODUCTS.find(p => p.id === id))
            .filter(p => p !== undefined)
            .slice(0, 4);
        document.getElementById('rec-reason').textContent = 'favoritos';
    } else {
        const hour = new Date().getHours();
        const topCat = hour < 12 ? 'Infusiones' : (hour < 18 ? 'Snacks' : 'Bebidas');
        recs = PRODUCTS.filter(p=>p.c===topCat).slice(0,4);
        document.getElementById('rec-reason').textContent = topCat.toLowerCase();
    }

    const wrap = document.getElementById('recs');
    wrap.innerHTML = '';
    recs.forEach(p=>{
        const el = document.createElement('div');
        el.className='prod';
        el.innerHTML = `
            <button class="favorite-btn ${state.favorites.includes(p.id) ? 'active' : ''}" data-id="${p.id}">
                ${state.favorites.includes(p.id) ? '❤️' : '🤍'}
            </button>
            <div class="thumb">${p.ico}</div>
            <h4>${p.n}</h4>
            <div class="row"><span class="chip">${p.c}</span><span class="price">${money(p.p)}</span></div>
            <button class="btn secondary">Agregar</button>`;
    
        el.querySelector('button.btn.secondary').addEventListener('click', async ()=>{ 
            state.cart[p.id] = (state.cart[p.id] || 0) + 1; 
            updateCartUI(); 
            if (state.user) await updateCartItem(p.id, 1);
            showToast(`Añadido: ${p.n}`, 'success');
        });
    
        el.querySelector('.favorite-btn').addEventListener('click', (e)=>{ 
            toggleFavorite(p.id);
            e.target.classList.toggle('active');
            e.target.innerHTML = e.target.classList.contains('active') ? '❤️' : '🤍';
        });
    
        wrap.appendChild(el);
    });
}

async function renderStats() {
    const statsGrid = document.getElementById('stats-grid');
    statsGrid.innerHTML = '';

    const stats = await loadStats();
    if (!stats) {
        statsGrid.innerHTML = '<p>No hay datos disponibles.</p>';
        return;
    }

    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.puntos}</div>
            <div class="stat-label">Puntos acumulados</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${money(stats.total_gastado)}</div>
            <div class="stat-label">Total gastado</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.compras_realizadas}</div>
            <div class="stat-label">Compras realizadas</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.favoritos_count}</div>
            <div class="stat-label">Productos favoritos</div>
        </div>
    `;
}

function showTicket(data) {
    const num = data.historial_id;
    document.getElementById('ticket').innerHTML = `
        <div style="text-align: center; margin-bottom: 10px;">
            <h3>Kiosco INCADÉ</h3>
            <div>Ticket #${num}</div>
            <div style="opacity:.8;font-size:0.9rem">${new Date().toLocaleString('es-AR')}</div>
        </div>
        <hr style="border-color:#27305a; margin: 10px 0"/>
        ${data.items.map(item=> 
            `<div class="row" style="margin: 5px 0">
                <span>${item.nombre} × ${item.cantidad}</span>
                <span>${money(item.precio * item.cantidad)}</span>
            </div>`
        ).join('')}
        <hr style="border-color:#27305a; margin: 10px 0"/>
        <div class="row" style="margin: 10px 0"><b>Total</b><b>${money(data.total)}</b></div>
        <div class="row"><span>Método de pago:</span><span>${data.metodo_pago}</span></div>
        <div class="row" style="margin-top: 10px;">
            <span>Puntos ganados:</span>
            <span class="points-badge">+${data.puntos_ganados} pts</span>
        </div>
        <div style="text-align: center; margin-top: 15px; opacity: 0.8;">¡Gracias por tu compra!</div>
    `;

    document.getElementById('ticket-modal').showModal();
}

// ======== Asistente ========
const TIPS = [
    'Tip: si estudiás mucho, hidratate con agua 💧',
    'Consejo: combiná galletitas + café para una tarde de código ☕🍪',
    'Dato: la yerba rinde más con agua a 75–80°C 🧉',
    'Atajo: usá el buscador para filtrar por nombre o categoría 🔎',
];

function addChatMessage(message, isUser = false) {
    const chatHistory = document.getElementById('chat-history');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${isUser ? 'user' : 'bot'}`;

    if (!isUser) {
        messageDiv.innerHTML = `<div class="avatar">AI</div><div class="message-content">${message}</div>`;
    } else {
        messageDiv.innerHTML = `<div class="message-content">${message}</div>`;
    }

    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function assistantSay(text, alsoSpeak=true){
    addChatMessage(text);
    if(alsoSpeak) speak(text.replace(/<[^>]+>/g,''));
}

function speak(text){
    try{ 
        const u = new SpeechSynthesisUtterance(text); 
        u.lang = 'es-AR'; 
        u.rate = 0.9;
        speechSynthesis.speak(u);
    } catch(e){}
}

function greet(){
    if(!state.user){ 
        assistantSay('¡Hola! Soy <b>Aki</b>. Inicia sesión con tu <b>matrícula</b> para ayudarte ✨'); 
        return; 
    }

    const h = new Date().getHours();
    const saludo = h<12? '¡Buen día' : (h<20? '¡Buenas' : '¡Buenas noches');

    assistantSay(`${saludo}, <b>${state.user.nombre}</b>! ¿Qué te preparo hoy?`, false);
}

function setStatus(){
    if(state.user){
        document.getElementById('student-status').innerHTML = `
            Sesión: ${state.user.nombre} · ${state.user.puntos} pts
        `;
        document.getElementById('btn-favorites').style.display = 'block';
        document.getElementById('btn-stats').style.display = 'block';
    } else {
        document.getElementById('student-status').textContent = 'No has iniciado sesión';
        document.getElementById('btn-favorites').style.display = 'none';
        document.getElementById('btn-stats').style.display = 'none';
    }
    greet();
    renderRecs();
}

// ======== Event Listeners ========
function setupEventListeners() {
    document.getElementById('search').addEventListener('input', updateCartUI);
    document.getElementById('filter').addEventListener('change', updateCartUI);

    document.getElementById('toggle-password').addEventListener('click', function() {
        const passwordInput = document.getElementById('password-input');
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            this.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            this.textContent = '👁️';
        }
    });

    document.getElementById('btn-login').addEventListener('click', ()=> document.getElementById('login-modal').showModal());
    document.getElementById('do-login').addEventListener('click', doLogin);
    document.getElementById('close-login').addEventListener('click', ()=> document.getElementById('login-modal').close());

    document.getElementById('open-cart').addEventListener('click', ()=>{ 
        renderCart(); 
        document.getElementById('cart-modal').showModal(); 
    });

    document.getElementById('close-cart').addEventListener('click', ()=> document.getElementById('cart-modal').close());
    document.getElementById('clear-cart').addEventListener('click', clearCart);

    document.getElementById('btn-favorites').addEventListener('click', ()=>{ 
        if(!state.user){ 
            showToast('Iniciá sesión para ver favoritos', 'error'); 
            return; 
        } 
        renderFavorites(); 
        document.getElementById('favorites-modal').showModal(); 
    });

    document.getElementById('close-favorites').addEventListener('click', ()=> document.getElementById('favorites-modal').close());

    document.getElementById('btn-history').addEventListener('click', ()=>{ 
        if(!state.user){ 
            showToast('Iniciá sesión para ver tu historial', 'error'); 
            return; 
        } 
        renderHistory(); 
        document.getElementById('history-modal').showModal(); 
    });

    document.getElementById('close-history').addEventListener('click', ()=> document.getElementById('history-modal').close());

    document.getElementById('btn-stats').addEventListener('click', ()=>{ 
        if(!state.user){ 
            showToast('Iniciá sesión para ver estadísticas', 'error'); 
            return; 
        } 
        renderStats(); 
        document.getElementById('stats-modal').showModal(); 
    });

    document.getElementById('close-stats').addEventListener('click', ()=> document.getElementById('stats-modal').close());

    document.getElementById('close-ticket').addEventListener('click', ()=> document.getElementById('ticket-modal').close());

    document.querySelectorAll('input[name="pay"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const qrBox = document.getElementById('qr-box');
            if (this.value === 'Mercado Pago') {
                qrBox.style.display = 'block';
            } else {
                qrBox.style.display = 'none';
            }
        });
    });

    document.getElementById('print-ticket').addEventListener('click', printTicket);
    document.getElementById('print-ticket-btn').addEventListener('click', printTicket);

    document.getElementById('checkout').addEventListener('click', checkout);

    document.getElementById('chat-send').addEventListener('click', handleChat);
    document.getElementById('chat-input').addEventListener('keydown', (e)=>{ 
        if(e.key==='Enter') handleChat(); 
    });
}

function printTicket() {
    const ticketContent = document.getElementById('ticket').innerHTML;
    const printDiv = document.getElementById('ticket-print');

    printDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; color: black; padding: 20px;">
            <h2 style="text-align: center; margin-bottom: 10px;">Kiosco INCADÉ</h2>
            <div style="text-align: center; margin-bottom: 15px; font-size: 14px;">
                ${document.getElementById('ticket').querySelector('div:nth-child(1) div:nth-child(2)').textContent}
            </div>
            <hr style="border: 0; border-top: 1px dashed #ccc; margin: 10px 0;">
            ${Array.from(document.getElementById('ticket').querySelectorAll('.row')).slice(0, -3).map(row => 
                `<div class="ticket-item" style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px;">
                    <span>${row.children[0].textContent}</span>
                    <span>${row.children[1].textContent}</span>
                </div>`
            ).join('')}
            <hr style="border: 0; border-top: 1px dashed #ccc; margin: 10px 0;">
            <div class="ticket-item" style="display: flex; justify-content: space-between; margin: 10px 0; font-weight: bold;">
                <span>Total</span>
                <span>${document.getElementById('ticket').querySelector('.row b:nth-child(2)').textContent}</span>
            </div>
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
                ¡Gracias por su compra!
            </div>
        </div>
    `;

    printDiv.style.display = 'block';
    window.print();
    printDiv.style.display = 'none';
}

function handleChat(){
    const q = document.getElementById('chat-input').value.trim().toLowerCase();
    if(!q) return;

    addChatMessage(q, true);
    document.getElementById('chat-input').value = '';

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'chat-message bot';
    typingIndicator.innerHTML = `<div class="avatar">AI</div><div class="message-content"><span class="loader"></span> Aki está pensando...</div>`;
    document.getElementById('chat-history').appendChild(typingIndicator);
    document.getElementById('chat-history').scrollTop = document.getElementById('chat-history').scrollHeight;

    setTimeout(() => {
        typingIndicator.remove();
        let a = '';
    
        if(q.includes('recomenda')||q.includes('recomendás')||q.includes('que compro')||q.includes('que me recomendas')){
            const hour = new Date().getHours();
            if(hour<12) a = 'Para arrancar el día: Café instantáneo + galletitas de agua, y agua para hidratarte.';
            else if(hour<18) a = 'Media tarde power: Alfajor + jugo de naranja, o una barrita de cereal si querés algo más liviano.';
            else a = 'Si seguís cursando: Sándwich de jamon y queso + gaseosa o agua. 💪';
        } else if(q.includes('yerba')||q.includes('mate')){
            a = 'Tenemos Yerba 500g y saquitos de mate cocido. ¿Querés que te agregue una de azúcar o unas galletitas para acompañar?';
        } else if(q.includes('pago')||q.includes('tarjeta')||q.includes('mercado pago')||q.includes('efectivo')){
            a = 'Aceptamos Efectivo, Tarjeta y Mercado Pago (QR). Si elegís MP te muestro un QR al finalizar.';
        } else if(q.includes('punto')||q.includes('puntos')){
            a = `Tienes <b>${state.user ? state.user.puntos : 0} puntos</b>. Ganas 1 punto por cada $100 gastados. ¡Podés canjearlos por descuentos!`;
        } else if(q.includes('hola')||q.includes('buen')||q.includes('hey')){
            a = `¡Hola ${state.user?state.user.nombre:'!'}! ¿Listo para pedir algo rico?`;
        } else if(q.includes('favorito')||q.includes('guardar')||q.includes('me gusta')){
            a = 'Podés guardar productos como favoritos haciendo clic en el corazón ❤️. Así te los recomendaré más seguido.';
        } else {
            a = 'Puedo ayudarte a elegir combos y contarte precios. Probá buscar por categoría con el filtro de arriba.';
        }
    
        assistantSay(a);
    }, 1000 + Math.random() * 1000);
}

// ======== Init ========
async function init(){
    console.log('✅ JavaScript funcionando!');
    
    // TEMPORAL: Usar solo productos locales - SIN API
    // const products = await loadProducts();
    // if (products.length > 0) {
    //     PRODUCTS.length = 0;
    //     PRODUCTS.push(...products);
    // }
    
    renderProducts(PRODUCTS);
    updateCartUI();
    renderRecs();
    setStatus();
    setupEventListeners();
    
    setTimeout(() => {
        greet();
    }, 500);
}

document.addEventListener('DOMContentLoaded', init);