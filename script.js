/* ============================================================
CONFIGURACIÓN — EDITAR ESTOS VALORES
============================================================ */
const CONFIG = {
  // Tu número de WhatsApp (con código de país, sin + ni espacios)
  WHATSAPP_NUMBER: "5731327997",

  // ID del Google Sheet publicado (lo encuentras en la URL de tu hoja)
  // Ejemplo: https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
  SHEET_ID: "1O3r548n4hLO5nB-Z5_YdociBlnGmh5mIMktzBbevJZo",

  // Nombre de tu tienda
  STORE_NAME: "Blank Store",

  // Moneda a mostrar
  CURRENCY: "S/. ",

  // Símbolo separador decimal
  DECIMAL_SEP: ".",

  // Columnas del Google Sheet (en orden exacto):
  // A=nombre, B=descripcion, C=precio, D=categoria, E=imagen_url, F=stock, G=emoji
  COLUMNS: {
    name: 0,
    desc: 1,
    price: 2,
    cat: 3,
    img: 4,
    stock: 5,
    emoji: 6,
  },
};

/* ============================================================
ESTADO DE LA APP
============================================================ */
let products = [];
let cart = JSON.parse(localStorage.getItem("wacart") || "[]");
let activeFilter = "all";
let searchQuery = "";
let modalProduct = null;

/* ============================================================
GOOGLE SHEETS → FETCH PRODUCTOS
Requiere que la hoja esté publicada:
Archivo → Compartir → Publicar en la web → CSV
============================================================ */
async function fetchProducts() {
  // DEMO DATA — Reemplaza con tu SHEET_ID real y esta función cargará automáticamente
  // Si tienes tu sheet, descomenta la sección de fetch y borra los datos demo.

  /*// ── DATOS DE DEMOSTRACIÓN ──────────────────────────────────
  const demoData = [
    {
      id: 1,
      name: "Serum Vitamina C",
      desc: "Ilumina y unifica el tono de la piel. Fórmula de absorción rápida con vitamina C al 15%.",
      price: 85000,
      cat: "Skincare",
      img: "",
      emoji: "✨",
      stock: true,
    },
    {
      id: 2,
      name: "Perfume Rose Noir",
      desc: "Fragancia floral amaderada con notas de rosa negra, sándalo y almizcle. 50ml EDP.",
      price: 195000,
      cat: "Perfumes",
      img: "",
      emoji: "🌹",
      stock: true,
    },
    {
      id: 3,
      name: "Labial Matte Velvet",
      desc: "Labial de larga duración con acabado matte aterciopelado. Tono Berry Crush.",
      price: 42000,
      cat: "Maquillaje",
      img: "",
      emoji: "💄",
      stock: true,
    },
    {
      id: 4,
      name: "Crema Facial SPF50",
      desc: "Hidratación intensa con protección solar. Textura ligera no grasa. 60ml.",
      price: 68000,
      cat: "Skincare",
      img: "",
      emoji: "☀️",
      stock: false,
    },
    {
      id: 5,
      name: "Paleta Ojos Sunset",
      desc: "12 sombras en tonos cálidos y ahumados. Larga duración y altamente pigmentadas.",
      price: 95000,
      cat: "Maquillaje",
      img: "",
      emoji: "🎨",
      stock: true,
    },
    {
      id: 6,
      name: "Aceite Capilar Argán",
      desc: "Tratamiento reparador para cabello dañado. Con aceite de argán 100% puro. 100ml.",
      price: 55000,
      cat: "Cabello",
      img: "",
      emoji: "💫",
      stock: true,
    },
    {
      id: 7,
      name: "Perfume Velvet Oud",
      desc: "Fragancia oriental intensa con oud, vainilla y pachulí. 80ml EDP.",
      price: 240000,
      cat: "Perfumes",
      img: "",
      emoji: "🕌",
      stock: true,
    },
    {
      id: 8,
      name: "Mascarilla Carbón",
      desc: "Mascarilla purificante con carbón activado. Limpia poros en profundidad. 100g.",
      price: 38000,
      cat: "Skincare",
      img: "",
      emoji: "🖤",
      stock: true,
    },
    {
      id: 9,
      name: "Bronzer Luminoso",
      desc: "Da un acabado bronceado y luminoso natural. Con perlas iluminadoras. Tono Dorado.",
      price: 72000,
      cat: "Maquillaje",
      img: "",
      emoji: "🌟",
      stock: true,
    },
    {
      id: 10,
      name: "Shampoo Reparador",
      desc: "Fórmula con queratina y proteínas para cabello débil y maltratado. 400ml.",
      price: 48000,
      cat: "Cabello",
      img: "",
      emoji: "💧",
      stock: true,
    },
  ];
  */

  // ── FETCH REAL (Google Sheets) ────────────────────────────
  // Descomenta el bloque de abajo cuando tengas tu SHEET_ID configurado:

  const url = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`;
  const res = await fetch(url);
  const text = await res.text();
  // El JSON viene con prefijo: /*O_o{"version":... — lo limpiamos:
  const json = JSON.parse(
    text.match(
      /google\.visualization\.Query\.setResponse\(([\s\S\w]+)\)/,
    )?.[1] || "{}",
  );
  const rows = json.table?.rows || [];
  const cols = CONFIG.COLUMNS;
  return rows.map((r, i) => ({
    id: i + 1,
    name: r.c[cols.name]?.v || "Producto",
    desc: r.c[cols.desc]?.v || "",
    price: Number(r.c[cols.price]?.v) || 0,
    cat: r.c[cols.cat]?.v || "General",
    img: r.c[cols.img]?.v || "",
    stock: r.c[cols.stock]?.v !== "NO" && r.c[cols.stock]?.v !== false,
    emoji: r.c[cols.emoji]?.v || '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24"><path fill="currentColor" d="M8.422 20.618C10.178 21.54 11.056 22 12 22V12L2.638 7.073l-.04.067C2 8.154 2 9.417 2 11.942v.117c0 2.524 0 3.787.597 4.801c.598 1.015 1.674 1.58 3.825 2.709z"/><path fill="currentColor" d="m17.577 4.432l-2-1.05C13.822 2.461 12.944 2 12 2c-.945 0-1.822.46-3.578 1.382l-2 1.05C4.318 5.536 3.242 6.1 2.638 7.072L12 12l9.362-4.927c-.606-.973-1.68-1.537-3.785-2.641" opacity=".7"/><path fill="currentColor" d="m21.403 7.14l-.041-.067L12 12v10c.944 0 1.822-.46 3.578-1.382l2-1.05c2.151-1.129 3.227-1.693 3.825-2.708c.597-1.014.597-2.277.597-4.8v-.117c0-2.525 0-3.788-.597-4.802" opacity=".5"/><path fill="currentColor" d="m6.323 4.484l.1-.052l1.493-.784l9.1 5.005l4.025-2.011q.205.232.362.498c.15.254.262.524.346.825L17.75 9.964V13a.75.75 0 0 1-1.5 0v-2.286l-3.5 1.75v9.44A3 3 0 0 1 12 22c-.248 0-.493-.032-.75-.096v-9.44l-8.998-4.5c.084-.3.196-.57.346-.824q.156-.266.362-.498l9.04 4.52l3.387-1.693z"/></svg>',
  }));
}

/* ============================================================
RENDER
============================================================ */
function getFiltered() {
  return products.filter((p) => {
    const matchCat = activeFilter === "all" || p.cat === activeFilter;
    const matchSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery) ||
      p.desc.toLowerCase().includes(searchQuery) ||
      p.cat.toLowerCase().includes(searchQuery);
    return matchCat && matchSearch;
  });
}

function renderFilters() {
  const cats = [...new Set(products.map((p) => p.cat))];
  const section = document.getElementById("filterSection");
  // Remove old category buttons (keep 'Todo')
  [
    ...section.querySelectorAll('[data-cat]:not([data-cat="all"])'),
  ].forEach((b) => b.remove());
  cats.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = "filter-btn";
    btn.dataset.cat = cat;
    btn.textContent = cat;
    btn.onclick = () => filterProducts(cat);
    section.appendChild(btn);
  });
}

function formatPrice(n) {
  return CONFIG.CURRENCY + n.toLocaleString("es-CO");
}

function renderProducts() {
  const grid = document.getElementById("productsGrid");
  const list = getFiltered();
  grid.innerHTML = "";

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state"><div class="emoji">🔍</div><h3>Sin resultados</h3><p style="color:var(--text-3);margin-top:8px;font-size:.85rem">Intenta con otro filtro o búsqueda.</p></div>`;
    return;
  }

  list.forEach((p, i) => {
    const inCart = cart.find((c) => c.id === p.id);
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${i * 0.06}s`;

    const imgHtml = p.img
      ? `<img class="card-img" src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
    <div class="card-img-placeholder" style="display:none">${p.emoji || '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24"><path fill="currentColor" d="M8.422 20.618C10.178 21.54 11.056 22 12 22V12L2.638 7.073l-.04.067C2 8.154 2 9.417 2 11.942v.117c0 2.524 0 3.787.597 4.801c.598 1.015 1.674 1.58 3.825 2.709z"/><path fill="currentColor" d="m17.577 4.432l-2-1.05C13.822 2.461 12.944 2 12 2c-.945 0-1.822.46-3.578 1.382l-2 1.05C4.318 5.536 3.242 6.1 2.638 7.072L12 12l9.362-4.927c-.606-.973-1.68-1.537-3.785-2.641" opacity=".7"/><path fill="currentColor" d="m21.403 7.14l-.041-.067L12 12v10c.944 0 1.822-.46 3.578-1.382l2-1.05c2.151-1.129 3.227-1.693 3.825-2.708c.597-1.014.597-2.277.597-4.8v-.117c0-2.525 0-3.788-.597-4.802" opacity=".5"/><path fill="currentColor" d="m6.323 4.484l.1-.052l1.493-.784l9.1 5.005l4.025-2.011q.205.232.362.498c.15.254.262.524.346.825L17.75 9.964V13a.75.75 0 0 1-1.5 0v-2.286l-3.5 1.75v9.44A3 3 0 0 1 12 22c-.248 0-.493-.032-.75-.096v-9.44l-8.998-4.5c.084-.3.196-.57.346-.824q.156-.266.362-.498l9.04 4.52l3.387-1.693z"/></svg>'}</div>`
      : `<div class="card-img-placeholder">${p.emoji || '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24"><path fill="currentColor" d="M8.422 20.618C10.178 21.54 11.056 22 12 22V12L2.638 7.073l-.04.067C2 8.154 2 9.417 2 11.942v.117c0 2.524 0 3.787.597 4.801c.598 1.015 1.674 1.58 3.825 2.709z"/><path fill="currentColor" d="m17.577 4.432l-2-1.05C13.822 2.461 12.944 2 12 2c-.945 0-1.822.46-3.578 1.382l-2 1.05C4.318 5.536 3.242 6.1 2.638 7.072L12 12l9.362-4.927c-.606-.973-1.68-1.537-3.785-2.641" opacity=".7"/><path fill="currentColor" d="m21.403 7.14l-.041-.067L12 12v10c.944 0 1.822-.46 3.578-1.382l2-1.05c2.151-1.129 3.227-1.693 3.825-2.708c.597-1.014.597-2.277.597-4.8v-.117c0-2.525 0-3.788-.597-4.802" opacity=".5"/><path fill="currentColor" d="m6.323 4.484l.1-.052l1.493-.784l9.1 5.005l4.025-2.011q.205.232.362.498c.15.254.262.524.346.825L17.75 9.964V13a.75.75 0 0 1-1.5 0v-2.286l-3.5 1.75v9.44A3 3 0 0 1 12 22c-.248 0-.493-.032-.75-.096v-9.44l-8.998-4.5c.084-.3.196-.57.346-.824q.156-.266.362-.498l9.04 4.52l3.387-1.693z"/></svg>'}</div>`;

    card.innerHTML = `
<div class="card-img-wrap" onclick="openModal(${p.id})">
  ${imgHtml}
  <span class="card-category">${p.cat}</span>
  <span class="card-stock-badge ${p.stock ? "in" : "out"}">${p.stock ? "Disponible" : "Agotado"}</span>
</div>
<div class="card-body" onclick="openModal(${p.id})">
  <div class="card-name">${p.name}</div>
  <div class="card-desc">${p.desc}</div>
</div>
<div class="card-footer">
  <div class="card-price"><small>${CONFIG.CURRENCY}</small>${p.price.toLocaleString("es-CO")}</div>
  <button class="add-btn ${inCart ? "added" : ""}" id="add-${p.id}"
    onclick="addToCart(${p.id})" ${!p.stock ? "disabled" : ""}>
    ${inCart ? "✓ Agregado" : "+ Agregar"}
  </button>
</div>`;
    grid.appendChild(card);
  });
}

/* ============================================================
FILTROS Y BÚSQUEDA
============================================================ */
function filterProducts(cat) {
  activeFilter = cat;
  document
    .querySelectorAll(".filter-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
  renderProducts();
}

document.getElementById("searchInput").addEventListener("input", (e) => {
  searchQuery = e.target.value.toLowerCase().trim();
  renderProducts();
});

/* ============================================================
CARRITO
============================================================ */
function saveCart() {
  localStorage.setItem("wacart", JSON.stringify(cart));
}

function addToCart(id) {
  const p = products.find((x) => x.id === id);
  if (!p || !p.stock) return;
  const existing = cart.find((c) => c.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({
      id: p.id,
      name: p.name,
      price: p.price,
      img: p.img,
      emoji: p.emoji,
      qty: 1,
    });
  }
  saveCart();
  updateCartUI();
  renderProducts();
  const currentTheme = localStorage.getItem("selectedTheme") || "woman";
  const toastType = currentTheme === 'man' ? 'info' : 'pink';
  const toastEmoji = currentTheme === 'man' ? '⚡' : '💗';
  showToast(`${toastEmoji} ${p.name} agregado`, toastType);
}

function removeFromCart(id) {
  cart = cart.filter((c) => c.id !== id);
  saveCart();
  updateCartUI();
  renderProducts();
}

function changeQty(id, delta) {
  const item = cart.find((c) => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  saveCart();
  updateCartUI();
}

function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
  renderProducts();
  showToast("🗑️ Pedido vaciado");
}

function updateCartUI() {
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  const badge = document.getElementById("cartBadge");
  const count = document.getElementById("drawerCount");

  badge.textContent = totalQty;
  badge.classList.toggle("visible", totalQty > 0);
  count.textContent = totalQty ? `(${totalQty})` : "";
  document.getElementById("totalAmount").textContent = formatPrice(total);

  const itemsEl = document.getElementById("drawerItems");
  console.log(itemsEl);
  if (!cart.length) {
    itemsEl.innerHTML = `
<div class="cart-empty">
  <div class="icon"><svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24"><path fill="currentColor" d="M4.083 10.894c.439-2.34.658-3.511 1.491-4.203C6.408 6 7.598 6 9.98 6h4.04c2.383 0 3.573 0 4.407.691c.833.692 1.052 1.862 1.491 4.203l.75 4c.617 3.292.926 4.938.026 6.022S18.12 22 14.771 22H9.23c-3.349 0-5.024 0-5.923-1.084c-.9-1.084-.591-2.73.026-6.022z" opacity=".5"/><path fill="currentColor" d="M9.75 5a2.25 2.25 0 0 1 4.5 0v1c.566 0 1.062.002 1.5.015V5a3.75 3.75 0 1 0-7.5 0v1.015C8.688 6.002 9.184 6 9.75 6zm1.293 10.866C10.165 15.22 9 14.18 9 13.196c0-1.672 1.65-2.297 3-1.005c1.35-1.292 3-.668 3 1.006c0 .984-1.165 2.024-2.043 2.669c-.42.308-.63.462-.957.462c-.328 0-.537-.154-.957-.462"/></svg></div>
  <p>Tu pedido está vacío</p>
  <small>¡Agrega productos del catálogo!</small>
</div>`;
  } else {
    itemsEl.innerHTML = cart
      .map(
        (item) => `
<div class="cart-item">
  <div class="cart-item-img">${
    item.img
      ? `<img src="${item.img}" style="width:100%;height:100%;object-fit:cover;border-radius:10px" onerror="this.outerHTML='${item.emoji || '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24"><path fill="currentColor" d="M8.422 20.618C10.178 21.54 11.056 22 12 22V12L2.638 7.073l-.04.067C2 8.154 2 9.417 2 11.942v.117c0 2.524 0 3.787.597 4.801c.598 1.015 1.674 1.58 3.825 2.709z"/><path fill="currentColor" d="m17.577 4.432l-2-1.05C13.822 2.461 12.944 2 12 2c-.945 0-1.822.46-3.578 1.382l-2 1.05C4.318 5.536 3.242 6.1 2.638 7.072L12 12l9.362-4.927c-.606-.973-1.68-1.537-3.785-2.641" opacity=".7"/><path fill="currentColor" d="m21.403 7.14l-.041-.067L12 12v10c.944 0 1.822-.46 3.578-1.382l2-1.05c2.151-1.129 3.227-1.693 3.825-2.708c.597-1.014.597-2.277.597-4.8v-.117c0-2.525 0-3.788-.597-4.802" opacity=".5"/><path fill="currentColor" d="m6.323 4.484l.1-.052l1.493-.784l9.1 5.005l4.025-2.011q.205.232.362.498c.15.254.262.524.346.825L17.75 9.964V13a.75.75 0 0 1-1.5 0v-2.286l-3.5 1.75v9.44A3 3 0 0 1 12 22c-.248 0-.493-.032-.75-.096v-9.44l-8.998-4.5c.084-.3.196-.57.346-.824q.156-.266.362-.498l9.04 4.52l3.387-1.693z"/></svg>'}'">`
      : item.emoji || '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24"><path fill="currentColor" d="M8.422 20.618C10.178 21.54 11.056 22 12 22V12L2.638 7.073l-.04.067C2 8.154 2 9.417 2 11.942v.117c0 2.524 0 3.787.597 4.801c.598 1.015 1.674 1.58 3.825 2.709z"/><path fill="currentColor" d="m17.577 4.432l-2-1.05C13.822 2.461 12.944 2 12 2c-.945 0-1.822.46-3.578 1.382l-2 1.05C4.318 5.536 3.242 6.1 2.638 7.072L12 12l9.362-4.927c-.606-.973-1.68-1.537-3.785-2.641" opacity=".7"/><path fill="currentColor" d="m21.403 7.14l-.041-.067L12 12v10c.944 0 1.822-.46 3.578-1.382l2-1.05c2.151-1.129 3.227-1.693 3.825-2.708c.597-1.014.597-2.277.597-4.8v-.117c0-2.525 0-3.788-.597-4.802" opacity=".5"/><path fill="currentColor" d="m6.323 4.484l.1-.052l1.493-.784l9.1 5.005l4.025-2.011q.205.232.362.498c.15.254.262.524.346.825L17.75 9.964V13a.75.75 0 0 1-1.5 0v-2.286l-3.5 1.75v9.44A3 3 0 0 1 12 22c-.248 0-.493-.032-.75-.096v-9.44l-8.998-4.5c.084-.3.196-.57.346-.824q.156-.266.362-.498l9.04 4.52l3.387-1.693z"/></svg>'
  }
  </div>
  <div class="cart-item-info">
    <div class="cart-item-name">${item.name}</div>
    <div class="cart-item-price">${formatPrice(item.price)} c/u</div>
    <div class="qty-control">
      <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
      <span class="qty-num">${item.qty}</span>
      <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
    </div>
  </div>
  <button class="remove-btn" onclick="removeFromCart(${item.id})" title="Eliminar">✕</button>
</div>`,
      )
      .join("");
  }

  // WhatsApp link
  const waBtn = document.getElementById("whatsappBtn");
  if (cart.length) {
    const note = document.getElementById("orderNote").value.trim();
    const lines = cart
      .map(
        (c) => `• ${c.name} x${c.qty} — ${formatPrice(c.price * c.qty)}`,
      )
      .join("\n");
    const msg = `¡Hola! Me gustaría hacer el siguiente pedido desde *${CONFIG.STORE_NAME}*:\n\n${lines}\n\n*Total: ${formatPrice(total)}*${note ? `\n\n📝 Nota: ${note}` : ""}\n\n¿Me pueden confirmar disponibilidad y forma de pago? 🙏`;
    waBtn.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    waBtn.onclick = null;
  } else {
    waBtn.href = "#";
    waBtn.onclick = (e) => {
      e.preventDefault();
      showToast("Agrega productos primero");
    };
  }
}

document
  .getElementById("orderNote")
  .addEventListener("input", updateCartUI);

/* ============================================================
DRAWER
============================================================ */
function toggleCart() {
  document.getElementById("drawer").classList.toggle("open");
  document.getElementById("drawerBackdrop").classList.toggle("open");
}

/* ============================================================
MODAL
============================================================ */
function openModal(id) {
  const p = products.find((x) => x.id === id);
  if (!p) return;
  modalProduct = p;

  document.getElementById("modalImg").innerHTML = p.img
    ? `<img src="${p.img}" style="width:100%;height:100%;object-fit:cover" onerror="this.outerHTML='<div class=\'modal-img\'>${p.emoji || '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24"><path fill="currentColor" d="M8.422 20.618C10.178 21.54 11.056 22 12 22V12L2.638 7.073l-.04.067C2 8.154 2 9.417 2 11.942v.117c0 2.524 0 3.787.597 4.801c.598 1.015 1.674 1.58 3.825 2.709z"/><path fill="currentColor" d="m17.577 4.432l-2-1.05C13.822 2.461 12.944 2 12 2c-.945 0-1.822.46-3.578 1.382l-2 1.05C4.318 5.536 3.242 6.1 2.638 7.072L12 12l9.362-4.927c-.606-.973-1.68-1.537-3.785-2.641" opacity=".7"/><path fill="currentColor" d="m21.403 7.14l-.041-.067L12 12v10c.944 0 1.822-.46 3.578-1.382l2-1.05c2.151-1.129 3.227-1.693 3.825-2.708c.597-1.014.597-2.277.597-4.8v-.117c0-2.525 0-3.788-.597-4.802" opacity=".5"/><path fill="currentColor" d="m6.323 4.484l.1-.052l1.493-.784l9.1 5.005l4.025-2.011q.205.232.362.498c.15.254.262.524.346.825L17.75 9.964V13a.75.75 0 0 1-1.5 0v-2.286l-3.5 1.75v9.44A3 3 0 0 1 12 22c-.248 0-.493-.032-.75-.096v-9.44l-8.998-4.5c.084-.3.196-.57.346-.824q.156-.266.362-.498l9.04 4.52l3.387-1.693z"/></svg>'}</div>`
    : `<div style="font-size:5rem;display:flex;align-items:center;justify-content:center;height:100%;background:var(--bg-3)">${p.emoji || '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24"><path fill="currentColor" d="M8.422 20.618C10.178 21.54 11.056 22 12 22V12L2.638 7.073l-.04.067C2 8.154 2 9.417 2 11.942v.117c0 2.524 0 3.787.597 4.801c.598 1.015 1.674 1.58 3.825 2.709z"/><path fill="currentColor" d="m17.577 4.432l-2-1.05C13.822 2.461 12.944 2 12 2c-.945 0-1.822.46-3.578 1.382l-2 1.05C4.318 5.536 3.242 6.1 2.638 7.072L12 12l9.362-4.927c-.606-.973-1.68-1.537-3.785-2.641" opacity=".7"/><path fill="currentColor" d="m21.403 7.14l-.041-.067L12 12v10c.944 0 1.822-.46 3.578-1.382l2-1.05c2.151-1.129 3.227-1.693 3.825-2.708c.597-1.014.597-2.277.597-4.8v-.117c0-2.525 0-3.788-.597-4.802" opacity=".5"/><path fill="currentColor" d="m6.323 4.484l.1-.052l1.493-.784l9.1 5.005l4.025-2.011q.205.232.362.498c.15.254.262.524.346.825L17.75 9.964V13a.75.75 0 0 1-1.5 0v-2.286l-3.5 1.75v9.44A3 3 0 0 1 12 22c-.248 0-.493-.032-.75-.096v-9.44l-8.998-4.5c.084-.3.196-.57.346-.824q.156-.266.362-.498l9.04 4.52l3.387-1.693z"/></svg>'}</div>`;

  document.getElementById("modalCat").textContent = p.cat;
  document.getElementById("modalName").textContent = p.name;
  document.getElementById("modalDesc").textContent = p.desc;
  document.getElementById("modalPrice").textContent = formatPrice(
    p.price,
  );

  const addBtn = document.getElementById("modalAddBtn");
  const inCart = cart.find((c) => c.id === p.id);
  addBtn.textContent = inCart
    ? "✓ Ya en tu pedido — Agregar más"
    : "+ Agregar al pedido";
  addBtn.disabled = !p.stock;
  if (!p.stock) addBtn.textContent = "Agotado";

  document.getElementById("modalBackdrop").classList.add("open");
}

function modalAddToCart() {
  if (!modalProduct) return;
  addToCart(modalProduct.id);
  const addBtn = document.getElementById("modalAddBtn");
  addBtn.textContent = "✓ Ya en tu pedido — Agregar más";
}

function closeModal(e) {
  if (e.target === document.getElementById("modalBackdrop")) {
    document.getElementById("modalBackdrop").classList.remove("open");
  }
}

/* ============================================================
TOASTS
============================================================ */
function showToast(msg, type = "success") {
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.getElementById("toasts").appendChild(el);
  setTimeout(() => {
    el.style.animation = "toastOut 0.35s ease both";
    el.addEventListener("animationend", () => el.remove());
  }, 2800);
}

/* ============================================================
INIT
============================================================ */
async function init() {
  try {
    products = await fetchProducts();
    renderFilters();
    renderProducts();
    updateCartUI();
  } catch (err) {
    document.getElementById("productsGrid").innerHTML = `
<div class="empty-state">
  <div class="emoji">⚠️</div>
  <h3>Error cargando productos</h3>
  <p style="color:var(--text-3);margin-top:8px;font-size:.85rem">Verifica la configuración del Google Sheet.</p>
</div>`;
    console.error(err);
  }
}

// Keyboard close
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("modalBackdrop").classList.remove("open");
    document.getElementById("drawer").classList.remove("open");
    document.getElementById("drawerBackdrop").classList.remove("open");
  }
});

init();

/* ============================================================
   LÓGICA DE TEMAS (HOMBRE / MUJER)
   ============================================================ */

function setTheme(theme) {
  // 1. Aplicar el atributo al body para que el CSS cambie los colores
  document.body.setAttribute('data-theme', theme);

  // 2. Guardar preferencia en localStorage
  localStorage.setItem("selectedTheme", theme);

  // 3. Actualizar estado visual de los botones
  document.querySelectorAll('.switch-btn').forEach(btn => btn.classList.remove('active'));
  if(theme === 'man') {
    document.getElementById('btn-man').classList.add('active');
    showToast("Modo Hombre Activado ⚡", "info");
  } else {
    document.getElementById('btn-woman').classList.add('active');
    showToast("Modo Mujer Activado 💗", "pink");
  }

  // 4. (Opcional) Cambiar textos dinámicos
  updateThemeTexts(theme);
}

function updateThemeTexts(theme) {
  const heroTitle = document.querySelector('.hero h1'); // Si tienes un h1 en el hero
  if (!heroTitle) return;

  if (theme === 'man') {
    heroTitle.innerHTML = 'Domina la<br /><em>Noche</em>';
  } else {
    heroTitle.innerHTML = 'Escoge tus<br /><em>favoritos</em>';
  }
}

// Cargar el tema guardado al iniciar
function loadSavedTheme() {
  const saved = localStorage.getItem("selectedTheme") || "woman";
  setTheme(saved);
}

// Llamamos a la carga del tema dentro de tu función init() existente
// O simplemente al final del archivo:
loadSavedTheme();