(function () {
  const STORAGE_KEY = "estalagem-pdv-state-v4";
  const SESSION_KEY = "estalagem-pdv-session-v1";
  const LOGIN_GUARD_KEY = "estalagem-pdv-login-guard-v1";
  const MAX_LOGIN_ATTEMPTS = 3;
  const LOGIN_LOCK_MS = 5 * 60 * 1000;
  const supabaseSettings = window.ESTALAGEM_SUPABASE || {};
  const hasSupabaseConfig = Boolean(supabaseSettings.url && supabaseSettings.anonKey);
  const supabaseClient = hasSupabaseConfig && window.supabase
    ? window.supabase.createClient(supabaseSettings.url, supabaseSettings.anonKey)
    : null;

  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const dateFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
  const fullDateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const roleViews = {
    balanca: ["balanca", "caixa"],
    caixa: ["caixa", "fiado"],
    admin: ["balanca", "caixa", "fiado", "relatorios", "config"]
  };
  const roleNames = {
    balanca: "Balança",
    caixa: "Caixa",
    admin: "Admin"
  };

  const initialState = {
    commandMax: 100,
    selectedCommand: null,
    selectedOrders: [],
    selectedClientId: null,
    selectedCheckoutClientId: null,
    showCommandFocus: false,
    showClientForm: false,
    editingClientId: null,
    returnToCheckoutAfterClient: false,
    productMoveSelected: null,
    selectedReportCompany: null,
    selectedSalesPaymentFilter: "Todos",
    openDebtEntryIds: [],
    schedules: [],
    activeDiscount: null,
    manualDiscount: 0,
    lastAction: null,
    pendingRemoval: null,
    pendingPayments: [],
    cashStart: 0,
    cashStartByDate: {},
    buffetPrice: 43,
    pixKey: "",
    cieloIntegration: {
      enabled: false,
      mode: "remote",
      terminalLogicalNumber: "DEMONSTRACAO",
      supportedMethods: ["Débito", "Crédito", "Voucher refeição", "Voucher benefícios"]
    },
    products: [
      { id: id(), name: "Refri lata", price: 6, front: true, category: "bebidas" },
      { id: id(), name: "Refri 600 ml", price: 8, front: true, category: "bebidas" },
      { id: id(), name: "Suco 300 ml", price: 7, front: true, category: "bebidas" },
      { id: id(), name: "Marmitex P", price: 20, front: true, category: "principal" },
      { id: id(), name: "Marmitex M", price: 25, front: true, category: "principal" },
      { id: id(), name: "Marmitex G", price: 30, front: true, category: "principal" }
    ],
    orders: [],
    clients: [],
    companies: [
      { id: id(), name: "Empresa de exemplo A", discount: 5, logo: "" },
      { id: id(), name: "Empresa de exemplo B", discount: 5, logo: "" }
    ],
    accessUsers: [
      { id: "balanca", name: "Balança", role: "balanca", pin: "0000" },
      { id: "caixa", name: "Caixa", role: "caixa", pin: "0000" },
      { id: "admin", name: "Admin", role: "admin", pin: "0000" }
    ],
    sales: [],
    removedScheduleIds: [],
    itemRemovals: [],
    orderAdjustments: [],
    removedOrderItemIds: [],
    cancelledSaleIds: [],
    cancelledClientEntryIds: []
  };

  let state = loadState();
  let currentAccess = loadSession();
  let remoteLoaded = false;
  let remoteSaving = false;
  let remoteSavePending = false;
  let remotePolling = false;
  let remotePollTimer = null;
  let remoteChannel = null;
  let remoteRefreshNeedsClients = false;
  let normalizedRemoteAvailable = null;
  let localRevision = 0;
  let lastLocalChangeAt = 0;
  let localPendingSync = false;
  let remoteSyncTimer = null;
  let remoteRefreshTimer = null;
  let clientsPendingSync = false;
  let salesPendingSync = false;
  let lastSyncedClientsJson = "";
  let lastClientPollAt = 0;
  const REMOTE_POLL_MS = 2500;
  const CLIENT_POLL_MS = 8000;
  const LOCAL_REMOTE_PROTECTION_MS = 900;
  const openMenuCategories = new Set();

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  function id() {
    return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function normalizeCieloIntegration(config) {
    const current = config || {};
    return {
      enabled: Boolean(current.enabled),
      mode: current.mode || "remote",
      terminalLogicalNumber: String(current.terminalLogicalNumber || initialState.cieloIntegration.terminalLogicalNumber || "").replace(/\s+/g, ""),
      supportedMethods: Array.isArray(current.supportedMethods) && current.supportedMethods.length
        ? current.supportedMethods
        : cloneData(initialState.cieloIntegration.supportedMethods)
    };
  }

  const productCategories = {
    principal: "Marmitex e feijoada",
    bebidas: "Bebidas",
    doces: "Doces",
    outros: "Outros"
  };
  const paymentMethods = ["Dinheiro", "Débito", "Crédito", "Pix", "Voucher refeição", "Voucher benefícios", "Fiado"];
  const salesPaymentFilters = ["Todos", "Dinheiro", "Pix", "Débito", "Crédito", "Voucher refeição", "Voucher benefícios"];
  const cieloPaymentMethods = ["Débito", "Crédito", "Voucher refeição", "Voucher benefícios"];

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const raw = String(reader.result || "");
        const image = new Image();
        image.onload = () => {
          const maxSize = 220;
          const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
          const width = Math.max(1, Math.round(image.width * ratio));
          const height = Math.max(1, Math.round(image.height * ratio));
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext("2d");
          if (!context) {
            resolve(raw);
            return;
          }
          context.clearRect(0, 0, width, height);
          context.drawImage(image, 0, 0, width, height);
          const keepsTransparency = /image\/(png|webp)/i.test(file.type);
          resolve(keepsTransparency ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.82));
        };
        image.onerror = () => resolve(raw);
        image.src = raw;
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function inferProductCategory(name) {
    const text = normalizeText(name);
    if (text.includes("marmitex") || text.includes("feijoada")) return "principal";
    if (text.includes("refri") || text.includes("suco") || text.includes("agua") || text.includes("coca") || text.includes("bebida") || text.includes("caipirinha")) return "bebidas";
    if (text.includes("doce") || text.includes("sobremesa") || text.includes("bolo") || text.includes("pudim")) return "doces";
    return "outros";
  }

  function isWednesdayOrSaturday() {
    const day = new Date().getDay();
    return day === 3 || day === 6;
  }

  function isMarmitex(product) {
    return normalizeText(product.name).includes("marmitex");
  }

  function isFeijoada(product) {
    return normalizeText(product.name).includes("feijoada");
  }

  function frontMenuProducts() {
    return state.products.filter((product) => {
      if (isMarmitex(product)) return true;
      if (isFeijoada(product)) return isWednesdayOrSaturday();
      return false;
    });
  }

  function categoryMenuProducts(category) {
    return state.products.filter((product) => {
      if (frontMenuProducts().some((frontProduct) => frontProduct.id === product.id)) return false;
      return (product.category || inferProductCategory(product.name)) === category;
    });
  }

  function productCategory(product) {
    return product.category || inferProductCategory(product.name);
  }

  function isCandyProduct(product) {
    return productCategory(product) === "doces";
  }

  function itemUnitPrice(item) {
    return Number(item.unitPrice || item.price || 0);
  }

  function itemQuantity(item) {
    return Math.max(1, Number(item.quantity || 1));
  }

  function itemTotal(item) {
    return itemUnitPrice(item) * itemQuantity(item);
  }

  function itemDisplayName(item) {
    const quantity = itemQuantity(item);
    return quantity > 1 ? `${quantity}x ${item.name}` : item.name;
  }

  function findGroupedOrderItem(order, product) {
    if (!order || !isCandyProduct(product)) return null;
    return order.items.find((item) => item.productId === product.id && item.groupedQuantity);
  }

  function addProductToOrder(order, product, context) {
    const now = new Date().toISOString();
    const existing = findGroupedOrderItem(order, product);
    if (existing) {
      existing.quantity = itemQuantity(existing) + 1;
      existing.price = itemTotal(existing);
      existing.updatedAt = now;
    } else {
      order.items.push({
        id: id(),
        productId: product.id,
        name: product.name,
        price: Number(product.price || 0),
        unitPrice: Number(product.price || 0),
        quantity: 1,
        groupedQuantity: isCandyProduct(product),
        updatedAt: now
      });
    }
    order.updatedAt = now;
    const quantity = existing ? itemQuantity(existing) : 1;
    const quantityText = isCandyProduct(product) && quantity > 1 ? ` (${quantity} un.)` : "";
    setLastAction(`${product.name}${quantityText} adicionado na comanda ${order.command}.`, context);
  }

  function changeGroupedItemQuantity(order, itemId, delta, context) {
    const item = order && order.items.find((entry) => entry.id === itemId);
    if (!item || !item.groupedQuantity) return;
    const nextQuantity = itemQuantity(item) + delta;
    if (nextQuantity <= 0) {
      requestOrderItemRemoval(order, itemId, context);
      return;
    }
    item.quantity = nextQuantity;
    item.price = itemTotal(item);
    item.updatedAt = new Date().toISOString();
    order.updatedAt = item.updatedAt;
    resetCheckoutAfterOrderChange(order.id);
    setLastAction(`${item.name}: ${nextQuantity} un. na comanda ${order.command}.`, context);
    saveState();
    render();
  }

  function productButton(product, actionAttr) {
    const image = product.image
      ? `<img class="quick-product-image" src="${escapeHtml(product.image)}" alt="" />`
      : "";
    const category = productCategory(product);
    return `
      <button class="quick-product ${image ? "has-image" : ""} category-${category}" ${actionAttr}="${product.id}">
        ${image}
        <span>${product.name}</span>
        <strong>${money.format(product.price)}</strong>
      </button>
    `;
  }

  function menuCategoryMarkup(category, actionAttr) {
    const products = categoryMenuProducts(category);
    if (!products.length) return "";
    const open = openMenuCategories.has(category) ? " open" : "";
    return `
      <details class="menu-category category-${category}" data-menu-category="${category}"${open}>
        <summary class="menu-category-title">${productCategories[category]}</summary>
        <div class="quick-products category-products">
          ${products.map((product) => productButton(product, actionAttr)).join("")}
        </div>
      </details>
    `;
  }

  function menuProductsMarkup(actionAttr) {
    const front = frontMenuProducts();
    return `
      ${front.map((product) => productButton(product, actionAttr)).join("")}
      ${["bebidas", "doces", "outros"].map((category) => menuCategoryMarkup(category, actionAttr)).join("")}
    `;
  }

  function wireMenuCategoryToggles(container) {
    container.querySelectorAll("[data-menu-category]").forEach((details) => {
      details.addEventListener("toggle", () => {
        if (details.open) {
          openMenuCategories.add(details.dataset.menuCategory);
        } else {
          openMenuCategories.delete(details.dataset.menuCategory);
        }
      });
    });
  }

  function isoFromLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function isoFromSaoPauloDate(date = new Date()) {
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).formatToParts(date);
      const value = (type) => parts.find((part) => part.type === type).value;
      return `${value("year")}-${value("month")}-${value("day")}`;
    } catch (_error) {
      return isoFromLocalDate(date);
    }
  }

  function todayIso() {
    return isoFromSaoPauloDate(new Date());
  }

  function daysAgoIso(days) {
    return addDaysIso(todayIso(), -days);
  }

  function addDaysIso(iso, days) {
    const [year, month, day] = String(iso || todayIso()).slice(0, 10).split("-").map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + days);
    return isoFromLocalDate(date);
  }

  function normalizeDateIso(value) {
    return String(value || todayIso()).slice(0, 10);
  }

  function currentMonthRange() {
    const [year, month] = todayIso().split("-").map(Number);
    const start = isoFromLocalDate(new Date(year, month - 1, 1));
    const end = isoFromLocalDate(new Date(year, month, 0));
    return { start, end };
  }

  function normalizeAccessUsers(users) {
    const allowedRoles = new Set(Object.keys(roleViews));
    const savedUsers = Array.isArray(users) && users.length ? users : initialState.accessUsers;
    return savedUsers.filter((user) => allowedRoles.has(user.role));
  }

  function normalizeProducts(products) {
    return (products && products.length ? products : initialState.products).map((product) => ({
      ...product,
      category: product.category || inferProductCategory(product.name),
      image: product.image || ""
    }));
  }

  function normalizeRuntimeState(data) {
    data.products = normalizeProducts(data.products);
    data.orders = (Array.isArray(data.orders) ? data.orders : []).map((order) => ({
      ...order,
      command: Number(order.command),
      items: (Array.isArray(order.items) ? order.items : []).map((item) => ({
        ...item,
        quantity: itemQuantity(item),
        unitPrice: itemUnitPrice(item),
        price: itemTotal(item)
      }))
    }));
    data.clients = (Array.isArray(data.clients) ? data.clients : []).map((client) => ({
      ...client,
      entries: Array.isArray(client.entries) ? client.entries : []
    }));
    data.companies = Array.isArray(data.companies) && data.companies.length ? data.companies : initialState.companies;
    data.sales = (Array.isArray(data.sales) ? data.sales : []).map((sale) => ({
      ...sale,
      payments: (Array.isArray(sale.payments) ? sale.payments : []).map((payment) => ({
        id: payment.id || id(),
        ...payment
      }))
    }));
    data.itemRemovals = Array.isArray(data.itemRemovals) ? data.itemRemovals : [];
    data.orderAdjustments = Array.isArray(data.orderAdjustments) ? data.orderAdjustments : [];
    data.removedOrderItemIds = Array.isArray(data.removedOrderItemIds) ? data.removedOrderItemIds : [];
    data.pendingPayments = Array.isArray(data.pendingPayments) ? data.pendingPayments : [];
    data.selectedOrders = Array.isArray(data.selectedOrders) ? data.selectedOrders : [];
    data.openDebtEntryIds = Array.isArray(data.openDebtEntryIds) ? data.openDebtEntryIds : [];
    data.schedules = Array.isArray(data.schedules) ? data.schedules : [];
    data.removedScheduleIds = Array.isArray(data.removedScheduleIds) ? data.removedScheduleIds : [];
    data.cancelledSaleIds = Array.isArray(data.cancelledSaleIds) ? data.cancelledSaleIds : [];
    data.cancelledClientEntryIds = Array.isArray(data.cancelledClientEntryIds) ? data.cancelledClientEntryIds : [];
    data.cashStartByDate = data.cashStartByDate && typeof data.cashStartByDate === "object" ? data.cashStartByDate : {};
    if (!Object.keys(data.cashStartByDate).length && Number(data.cashStart || 0)) {
      data.cashStartByDate[todayIso()] = Number(data.cashStart || 0);
    }
    data.cieloIntegration = normalizeCieloIntegration(data.cieloIntegration);
    return data;
  }

  function loadState() {
    try {
      const loaded = { ...initialState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
      normalizeRuntimeState(loaded);
      loaded.accessUsers = normalizeAccessUsers(loaded.accessUsers);
      loaded.buffetPrice = Number(loaded.buffetPrice || initialState.buffetPrice);
      applyCancellations(loaded);
      applyRemovedOrderItems(loaded);
      return loaded;
    } catch {
      return cloneData(initialState);
    }
  }

  function clientsJson() {
    return JSON.stringify(state.clients || []);
  }

  function markClientsSynced() {
    lastSyncedClientsJson = clientsJson();
    clientsPendingSync = false;
  }

  function scheduleRemoteSync(delay = 80) {
    if (!supabaseClient || !currentAccess || !remoteLoaded) return;
    if (remoteSyncTimer) clearTimeout(remoteSyncTimer);
    remoteSyncTimer = setTimeout(() => {
      remoteSyncTimer = null;
      syncRemoteState();
    }, delay);
  }

  function saveState(options = {}) {
    localRevision += 1;
    lastLocalChangeAt = Date.now();
    localPendingSync = true;
    if (options.clientsChanged || clientsJson() !== lastSyncedClientsJson) clientsPendingSync = true;
    if (options.salesChanged) salesPendingSync = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    scheduleRemoteSync();
  }

  function saveLocalState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function stateForRemote() {
    const copy = cloneData(state);
    delete copy.accessUsers;
    delete copy.selectedCommand;
    delete copy.selectedOrders;
    delete copy.selectedClientId;
    delete copy.selectedCheckoutClientId;
    delete copy.showCommandFocus;
    delete copy.editingClientId;
    delete copy.returnToCheckoutAfterClient;
    delete copy.productMoveSelected;
    delete copy.selectedReportCompany;
    delete copy.selectedSalesPaymentFilter;
    delete copy.openDebtEntryIds;
    delete copy.activeDiscount;
    delete copy.manualDiscount;
    delete copy.lastAction;
    delete copy.pendingRemoval;
    delete copy.pendingPayments;
    delete copy.showClientForm;
    return copy;
  }

  function mergeById(remoteList, localList, choose = (_remote, local) => local) {
    const merged = new Map();
    (Array.isArray(remoteList) ? remoteList : []).forEach((item) => {
      if (item && item.id) merged.set(item.id, item);
    });
    (Array.isArray(localList) ? localList : []).forEach((item) => {
      if (!item || !item.id) return;
      merged.set(item.id, merged.has(item.id) ? choose(merged.get(item.id), item) : item);
    });
    return Array.from(merged.values());
  }

  function mergeIdList(first, second) {
    return Array.from(new Set([...(Array.isArray(first) ? first : []), ...(Array.isArray(second) ? second : [])]));
  }

  function applyCancellations(data) {
    const cancelledSaleIds = new Set(data.cancelledSaleIds || []);
    const cancelledClientEntryIds = new Set(data.cancelledClientEntryIds || []);
    data.sales = (Array.isArray(data.sales) ? data.sales : []).filter((sale) => sale && !cancelledSaleIds.has(sale.id));
    data.clients = (Array.isArray(data.clients) ? data.clients : []).map((client) => ({
      ...client,
      entries: (Array.isArray(client.entries) ? client.entries : []).filter((entry) => entry && !cancelledClientEntryIds.has(entry.id))
    }));
    return data;
  }

  function applyRemovedOrderItems(data) {
    const removedItemIds = new Set(data.removedOrderItemIds || []);
    if (!removedItemIds.size) return data;
    data.orders = (Array.isArray(data.orders) ? data.orders : [])
      .map((order) => ({
        ...order,
        items: (Array.isArray(order.items) ? order.items : []).filter((item) => item && !removedItemIds.has(item.id))
      }))
      .filter((order) => order.status !== "open" || order.items.length);
    return data;
  }

  function orderTimestamp(order) {
    return String(order.updatedAt || order.closedAt || order.createdAt || "");
  }

  function mergeOrderItems(firstItems, secondItems) {
    return mergeById(firstItems || [], secondItems || [], (remoteItem, localItem) => {
      const remoteTime = orderTimestamp(remoteItem);
      const localTime = orderTimestamp(localItem);
      return localTime >= remoteTime ? localItem : remoteItem;
    });
  }

  function mergeOpenOrdersByCommand(openOrders) {
    const byCommand = new Map();
    const duplicateIds = [];
    (Array.isArray(openOrders) ? openOrders : []).forEach((order) => {
      if (!order || order.status !== "open") return;
      const command = Number(order.command);
      const current = byCommand.get(command);
      if (!current) {
        byCommand.set(command, { ...order, command, items: Array.isArray(order.items) ? order.items : [] });
        return;
      }
      if (current.id === order.id) {
        byCommand.set(command, {
          ...current,
          ...order,
          command,
          items: mergeOrderItems(current.items, order.items)
        });
        return;
      }
      const currentTime = orderTimestamp(current);
      const nextTime = orderTimestamp(order);
      const primary = currentTime && nextTime && nextTime < currentTime ? order : current;
      const secondary = primary.id === current.id ? order : current;
      duplicateIds.push(secondary.id);
      byCommand.set(command, {
        ...primary,
        command,
        status: "open",
        items: mergeOrderItems(primary.items, secondary.items),
        updatedAt: new Date().toISOString()
      });
    });
    return { orders: Array.from(byCommand.values()).sort((a, b) => a.command - b.command), duplicateIds };
  }

  function saleClosesOrder(sale, order) {
    if (!sale || !order || order.status !== "open") return false;
    const saleCommands = (sale.orders || []).map((saleOrder) => Number(saleOrder.command));
    if (!saleCommands.includes(Number(order.command))) return false;
    const saleAt = String(sale.createdAt || sale.closedAt || "");
    const orderAt = orderTimestamp(order);
    return !saleAt || !orderAt || orderAt <= saleAt;
  }

  function saleAlreadyClosedOrder(sales, order) {
    return (Array.isArray(sales) ? sales : []).some((sale) => saleClosesOrder(sale, order));
  }

  function mergeOrdersForSync(remoteOrders, localOrders) {
    const merged = mergeById(remoteOrders, localOrders, (remoteOrder, localOrder) => {
      if (isTerminalOrderStatus(remoteOrder.status) && !isTerminalOrderStatus(localOrder.status)) return remoteOrder;
      if (isTerminalOrderStatus(localOrder.status) && !isTerminalOrderStatus(remoteOrder.status)) return localOrder;
      return localOrder;
    });
    const closed = merged.filter((order) => order && order.status !== "open");
    const open = mergeOpenOrdersByCommand(merged.filter((order) => order && order.status === "open")).orders;
    return closed.concat(open);
  }

  function mergeClientsForSync(remoteClients, localClients, cancelledClientEntryIds = []) {
    const cancelledEntries = new Set(cancelledClientEntryIds);
    return mergeById(remoteClients, localClients, (remoteClient, localClient) => ({
      ...remoteClient,
      ...localClient,
      entries: mergeById(remoteClient.entries, localClient.entries).filter((entry) => !cancelledEntries.has(entry.id))
    })).map((client) => ({
      ...client,
      entries: (Array.isArray(client.entries) ? client.entries : []).filter((entry) => !cancelledEntries.has(entry.id))
    }));
  }

  function mergeOperationalState(remoteData, localData) {
    const remote = remoteData || {};
    const local = localData || {};
    const cancelledSaleIds = mergeIdList(remote.cancelledSaleIds, local.cancelledSaleIds);
    const cancelledClientEntryIds = mergeIdList(remote.cancelledClientEntryIds, local.cancelledClientEntryIds);
    const removedScheduleIds = mergeIdList(remote.removedScheduleIds, local.removedScheduleIds);
    const cancelledSales = new Set(cancelledSaleIds);
    const removedSchedules = new Set(removedScheduleIds);
    return applyRemovedOrderItems(applyCancellations({
      ...local,
      commandMax: remote.commandMax || local.commandMax,
      products: Array.isArray(remote.products) && remote.products.length ? remote.products : local.products,
      companies: Array.isArray(remote.companies) && remote.companies.length ? remote.companies : local.companies,
      buffetPrice: remote.buffetPrice || local.buffetPrice,
      cashStartByDate: { ...(remote.cashStartByDate || {}), ...(local.cashStartByDate || {}) },
      pixKey: typeof remote.pixKey === "string" ? remote.pixKey : local.pixKey,
      cieloIntegration: normalizeCieloIntegration(remote.cieloIntegration || local.cieloIntegration),
      orders: mergeOrdersForSync(remote.orders, local.orders),
      clients: mergeClientsForSync(remote.clients, local.clients, cancelledClientEntryIds),
      sales: mergeById(remote.sales, local.sales).filter((sale) => sale && !cancelledSales.has(sale.id)),
      schedules: mergeById(remote.schedules, local.schedules).filter((schedule) => schedule && !removedSchedules.has(schedule.id)),
      itemRemovals: mergeById(remote.itemRemovals, local.itemRemovals),
      orderAdjustments: mergeById(remote.orderAdjustments, local.orderAdjustments),
      removedOrderItemIds: mergeIdList(remote.removedOrderItemIds, local.removedOrderItemIds),
      removedScheduleIds,
      cancelledSaleIds,
      cancelledClientEntryIds
    }));
  }

  function mergeRemoteState(data) {
    const protectLocal = localPendingSync || Date.now() - lastLocalChangeAt < LOCAL_REMOTE_PROTECTION_MS;
    if (protectLocal) {
      data = mergeOperationalState(data || {}, stateForRemote());
    }
    const cancelledSaleIds = mergeIdList(state.cancelledSaleIds, data && data.cancelledSaleIds);
    const cancelledClientEntryIds = mergeIdList(state.cancelledClientEntryIds, data && data.cancelledClientEntryIds);
    const removedScheduleIds = mergeIdList(state.removedScheduleIds, data && data.removedScheduleIds);
    const mergedSales = mergeById((data && data.sales) || [], state.sales || []);
    const mergedClients = mergeClientsForSync((data && data.clients) || [], state.clients || [], cancelledClientEntryIds);
    const mergedItemRemovals = mergeById((data && data.itemRemovals) || [], state.itemRemovals || []);
    const mergedOrderAdjustments = mergeById((data && data.orderAdjustments) || [], state.orderAdjustments || []);
    state = {
      ...state,
      ...(data || {}),
      sales: mergedSales,
      clients: mergedClients,
      itemRemovals: mergedItemRemovals,
      orderAdjustments: mergedOrderAdjustments,
      accessUsers: state.accessUsers,
      selectedCommand: state.selectedCommand,
      selectedOrders: state.selectedOrders,
      selectedClientId: state.selectedClientId,
      selectedCheckoutClientId: state.selectedCheckoutClientId,
      showCommandFocus: state.showCommandFocus,
      productMoveSelected: state.productMoveSelected,
      selectedReportCompany: state.selectedReportCompany,
      selectedSalesPaymentFilter: state.selectedSalesPaymentFilter,
      openDebtEntryIds: state.openDebtEntryIds,
      activeDiscount: state.activeDiscount,
      lastAction: state.lastAction,
      pendingRemoval: state.pendingRemoval,
      pendingPayments: state.pendingPayments,
      showClientForm: state.showClientForm
    };
    state.cancelledSaleIds = cancelledSaleIds;
    state.cancelledClientEntryIds = cancelledClientEntryIds;
    state.removedScheduleIds = removedScheduleIds;
    normalizeRuntimeState(state);
    const removedSchedules = new Set(state.removedScheduleIds);
    state.schedules = (state.schedules || []).filter((schedule) => schedule && !removedSchedules.has(schedule.id));
    applyRemovedOrderItems(state);
    state.buffetPrice = Number(state.buffetPrice || initialState.buffetPrice);
    state.pixKey = String(state.pixKey || "");
    state.cieloIntegration = normalizeCieloIntegration(state.cieloIntegration);
    state.manualDiscount = Number(state.manualDiscount || 0);
    applyCancellations(state);
    const openOrderIds = new Set(state.orders.filter((order) => order.status === "open").map((order) => order.id));
    state.selectedOrders = state.selectedOrders.filter((orderId) => openOrderIds.has(orderId));
    if (state.pendingRemoval && !openOrderIds.has(state.pendingRemoval.orderId)) state.pendingRemoval = null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  async function loadRemoteState() {
    if (!supabaseClient || !currentAccess) return;
    const remoteData = await fetchRemoteRestaurantData();
    if (remoteData === null) {
      $("#authError").textContent = "Falha ao carregar dados do restaurante.";
      return;
    }
    if (remoteData && Object.keys(remoteData).length) {
      mergeRemoteState(remoteData);
    } else {
      await syncRemoteState(true);
    }
    markClientsSynced();
    salesPendingSync = false;
    remoteLoaded = true;
  }

  async function fetchRemoteRestaurantData() {
    const normalized = await fetchNormalizedRestaurantData();
    if (normalized) return normalized;
    return {};
  }

  function isMissingTableError(error) {
    return !!error && (
      error.code === "42P01" ||
      error.code === "PGRST205" ||
      String(error.message || "").toLowerCase().includes("does not exist") ||
      String(error.message || "").toLowerCase().includes("not found")
    );
  }

  function normalizedMetaFromState(data) {
    return {
      removedOrderItemIds: data.removedOrderItemIds || [],
      removedScheduleIds: data.removedScheduleIds || [],
      cancelledSaleIds: data.cancelledSaleIds || [],
      cancelledClientEntryIds: data.cancelledClientEntryIds || [],
      cieloIntegration: normalizeCieloIntegration(data.cieloIntegration)
    };
  }

  function stateFromNormalizedRows(rows) {
    const settings = rows.settings || {};
    const meta = settings.meta || {};
    const products = (rows.products || []).map((product) => ({
      id: product.id,
      name: product.name,
      price: Number(product.price || 0),
      front: product.front,
      category: product.category,
      image: product.image || ""
    }));
    const companies = (rows.companies || []).map((company) => ({
      id: company.id,
      name: company.name,
      discount: Number(company.discount || 0),
      logo: company.logo || ""
    }));
    let orders = (rows.orders || []).map((row) => ({
      ...(row.payload || {}),
      id: row.id,
      command: Number(row.command_number),
      status: row.status,
      createdAt: (row.payload && row.payload.createdAt) || row.created_at,
      closedAt: row.closed_at || (row.payload && row.payload.closedAt),
      updatedAt: row.updated_at || (row.payload && row.payload.updatedAt)
    }));
    const sales = (rows.sales || []).map((row) => ({
      ...(row.payload || {}),
      id: row.id,
      date: normalizeDateIso((row.payload && row.payload.date) || row.sale_date || row.created_at),
      createdAt: (row.payload && row.payload.createdAt) || row.created_at
    }));
    orders = orders.filter((order) => !saleAlreadyClosedOrder(sales, order));
    const clients = (rows.clients || []).map((row) => ({
      ...(row.payload || {}),
      id: row.id,
      name: row.name,
      phone: row.phone || "",
      note: row.note || ""
    }));
    return normalizeRuntimeState({
      ...stateForRemote(),
      commandMax: Number(settings.command_max || state.commandMax || initialState.commandMax),
      buffetPrice: Number(settings.buffet_price || state.buffetPrice || initialState.buffetPrice),
      cashStartByDate: settings.cash_start_by_date || state.cashStartByDate || {},
      pixKey: settings.pix_key || "",
      cieloIntegration: normalizeCieloIntegration(meta.cieloIntegration || state.cieloIntegration),
      products: products.length ? products : state.products,
      companies: companies.length ? companies : state.companies,
      orders,
      sales,
      clients,
      itemRemovals: (rows.itemRemovals || []).map((row) => ({ ...(row.payload || {}), id: row.id, date: normalizeDateIso(row.removal_date || (row.payload && row.payload.date)) })),
      orderAdjustments: (rows.orderAdjustments || []).map((row) => ({ ...(row.payload || {}), id: row.id, date: row.adjustment_date })),
      schedules: [],
      removedOrderItemIds: meta.removedOrderItemIds || [],
      removedScheduleIds: meta.removedScheduleIds || [],
      cancelledSaleIds: meta.cancelledSaleIds || [],
      cancelledClientEntryIds: meta.cancelledClientEntryIds || []
    });
  }

  async function fetchNormalizedRestaurantData() {
    const settingsResult = await supabaseClient
      .from("pdv_settings")
      .select("id, command_max, buffet_price, cash_start_by_date, pix_key, meta, updated_at")
      .eq("id", "main")
      .maybeSingle();
    if (settingsResult.error) {
      normalizedRemoteAvailable = false;
      if (!isMissingTableError(settingsResult.error)) console.warn("Falha ao buscar configurações normalizadas", settingsResult.error);
      return null;
    }
    normalizedRemoteAvailable = true;
    const since = daysAgoIso(120);
    const [
      productsResult,
      companiesResult,
      ordersResult,
      salesResult,
      clientsResult,
      removalsResult,
      adjustmentsResult
    ] = await Promise.all([
      supabaseClient.from("pdv_products").select("*").eq("active", true).order("position", { ascending: true }),
      supabaseClient.from("pdv_companies").select("*").eq("active", true).order("name", { ascending: true }),
      supabaseClient.from("pdv_orders").select("*").eq("status", "open").order("command_number", { ascending: true }),
      supabaseClient.from("pdv_sales").select("*").eq("cancelled", false).gte("sale_date", since).order("sale_date", { ascending: false }),
      supabaseClient.from("pdv_clients").select("*").eq("active", true).order("name", { ascending: true }),
      supabaseClient.from("pdv_item_removals").select("*").gte("removal_date", since).order("created_at", { ascending: false }),
      supabaseClient.from("pdv_order_adjustments").select("*").gte("adjustment_date", since).order("created_at", { ascending: false })
    ]);
    const failed = [productsResult, companiesResult, ordersResult, salesResult, clientsResult, removalsResult, adjustmentsResult]
      .find((result) => result.error);
    if (failed) {
      console.warn("Falha ao buscar dados normalizados", failed.error);
      return null;
    }
    return stateFromNormalizedRows({
      settings: settingsResult.data || {},
      products: productsResult.data || [],
      companies: companiesResult.data || [],
      orders: ordersResult.data || [],
      sales: salesResult.data || [],
      clients: clientsResult.data || [],
      itemRemovals: removalsResult.data || [],
      orderAdjustments: adjustmentsResult.data || []
    });
  }

  async function fetchLegacyRestaurantState() {
    const { data, error } = await supabaseClient
      .from("restaurant_state")
      .select("data, updated_at")
      .eq("id", "main")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn("Falha ao buscar estado do restaurante", error);
      return null;
    }
    return data && data.data ? data.data : {};
  }

  function orderFromRow(row) {
    return {
      ...(row.payload || {}),
      id: row.id,
      command: Number(row.command_number),
      status: row.status,
      createdAt: (row.payload && row.payload.createdAt) || row.created_at,
      closedAt: row.closed_at || (row.payload && row.payload.closedAt),
      updatedAt: row.updated_at || (row.payload && row.payload.updatedAt)
    };
  }

  function saleFromRow(row) {
    return {
      ...(row.payload || {}),
      id: row.id,
      date: normalizeDateIso((row.payload && row.payload.date) || row.sale_date || row.created_at),
      createdAt: (row.payload && row.payload.createdAt) || row.created_at
    };
  }

  function clientFromRow(row) {
    return {
      ...(row.payload || {}),
      id: row.id,
      name: row.name,
      phone: row.phone || "",
      note: row.note || ""
    };
  }

  function removalFromRow(row) {
    return {
      ...(row.payload || {}),
      id: row.id,
      date: normalizeDateIso(row.removal_date || (row.payload && row.payload.date))
    };
  }

  async function fetchRemoteOpenOrders() {
    const { data, error } = await supabaseClient
      .from("pdv_orders")
      .select("id, command_number, status, payload, created_at, closed_at, updated_at")
      .eq("status", "open")
      .order("command_number", { ascending: true });
    if (error) {
      console.warn("Falha ao buscar comandas abertas", error);
      return null;
    }
    normalizedRemoteAvailable = true;
    return (data || []).map(orderFromRow);
  }

  async function fetchRemoteOpenOrdersByCommands(commands) {
    const commandNumbers = Array.from(new Set((commands || []).map(Number).filter(Boolean)));
    if (!commandNumbers.length) return [];
    const { data, error } = await supabaseClient
      .from("pdv_orders")
      .select("id, command_number, status, payload, created_at, closed_at, updated_at")
      .eq("status", "open")
      .in("command_number", commandNumbers);
    if (error) {
      console.warn("Falha ao buscar comandas abertas por número", error);
      return null;
    }
    return (data || []).map(orderFromRow);
  }

  async function closeRemoteDuplicateOrders(orderIds) {
    const ids = Array.from(new Set((orderIds || []).filter(Boolean)));
    if (!ids.length || !supabaseClient || !currentAccess) return;
    const { error } = await supabaseClient
      .from("pdv_orders")
      .update({
        status: "cancelled",
        closed_at: new Date().toISOString(),
        updated_by: currentAccess.id,
        updated_at: new Date().toISOString()
      })
      .in("id", ids)
      .eq("status", "open");
    if (error) console.warn("Falha ao arquivar comandas duplicadas", error);
    else notifyRemoteStateChanged();
  }

  async function closeRemoteOpenOrdersForClosedOrders(closedOrders) {
    const orders = (closedOrders || []).filter((order) => order && isTerminalOrderStatus(order.status));
    if (!orders.length) return;
    const remoteOpenOrders = await fetchRemoteOpenOrdersByCommands(orders.map((order) => order.command));
    if (!remoteOpenOrders || !remoteOpenOrders.length) return;
    const staleIds = [];
    remoteOpenOrders.forEach((remoteOrder) => {
      const closedSameCommand = orders
        .filter((order) => Number(order.command) === Number(remoteOrder.command))
        .sort((a, b) => orderTimestamp(b).localeCompare(orderTimestamp(a)))[0];
      if (!closedSameCommand || remoteOrder.id === closedSameCommand.id) return;
      const remoteOpenedAt = orderTimestamp(remoteOrder);
      const closedAt = orderTimestamp(closedSameCommand);
      if (!remoteOpenedAt || !closedAt || remoteOpenedAt <= closedAt) staleIds.push(remoteOrder.id);
    });
    await closeRemoteDuplicateOrders(staleIds);
  }

  function isTerminalOrderStatus(status) {
    return status === "closed" || status === "cancelled";
  }

  async function fetchRemoteOrdersByIds(ids) {
    const uniqueIds = Array.from(new Set((ids || []).filter(Boolean)));
    if (!uniqueIds.length) return [];
    const { data, error } = await supabaseClient
      .from("pdv_orders")
      .select("id, command_number, status, payload, created_at, closed_at, updated_at")
      .in("id", uniqueIds);
    if (error) {
      console.warn("Falha ao conferir status remoto das comandas", error);
      return null;
    }
    return data || [];
  }

  async function fetchRemoteClients() {
    const { data, error } = await supabaseClient
      .from("pdv_clients")
      .select("id, name, phone, note, payload")
      .eq("active", true)
      .order("name", { ascending: true });
    if (error) {
      console.warn("Falha ao buscar clientes/fiados", error);
      return null;
    }
    return (data || []).map(clientFromRow);
  }

  async function fetchRemoteReportData(start, end) {
    if (!supabaseClient || !currentAccess || !start || !end) return false;
    const nextEnd = addDaysIso(end, 1);
    try {
      let [salesResult, clientsResult, removalsResult] = await Promise.all([
        supabaseClient
          .from("pdv_sales")
          .select("id, sale_date, payload, created_at")
          .eq("cancelled", false)
          .gte("sale_date", start)
          .lt("sale_date", nextEnd)
          .order("sale_date", { ascending: false }),
        supabaseClient
          .from("pdv_clients")
          .select("id, name, phone, note, payload")
          .eq("active", true)
          .order("name", { ascending: true }),
        supabaseClient
          .from("pdv_item_removals")
          .select("id, removal_date, payload, created_at")
          .gte("removal_date", start)
          .lt("removal_date", nextEnd)
          .order("created_at", { ascending: false })
      ]);
      if (!salesResult.error && !(salesResult.data || []).length) {
        salesResult = await supabaseClient
          .from("pdv_sales")
          .select("id, sale_date, payload, created_at")
          .eq("cancelled", false)
          .gte("created_at", `${daysAgoIso(30)}T00:00:00`)
          .order("created_at", { ascending: false })
          .limit(1000);
      }
      if (!salesResult.error) {
        const createdSalesResult = await supabaseClient
          .from("pdv_sales")
          .select("id, sale_date, payload, created_at")
          .eq("cancelled", false)
          .gte("created_at", `${start}T00:00:00`)
          .lt("created_at", `${nextEnd}T00:00:00`)
          .order("created_at", { ascending: false });
        if (!createdSalesResult.error && (createdSalesResult.data || []).length) {
          salesResult.data = mergeById(salesResult.data || [], createdSalesResult.data || [], (_first, second) => second);
        }
      }
      const failed = [salesResult, clientsResult, removalsResult].find((result) => result.error);
      if (failed) {
        console.warn("Falha ao buscar relatório por período", failed.error);
        return false;
      }
      state.sales = mergeById(state.sales || [], (salesResult.data || []).map(saleFromRow), (_local, remote) => remote);
      state.clients = mergeById(state.clients || [], (clientsResult.data || []).map(clientFromRow), (_local, remote) => remote);
      state.itemRemovals = mergeById(state.itemRemovals || [], (removalsResult.data || []).map(removalFromRow), (_local, remote) => remote);
      applyCancellations(state);
      saveLocalState();
      return true;
    } catch (error) {
      console.warn("Falha ao carregar relatório do Supabase", error);
      return false;
    }
  }

  function mergeRemoteOpenOrders(openOrders) {
    const localClosedOrders = state.orders.filter((order) => order.status !== "open");
    const localOpenOrders = state.orders.filter((order) => order.status === "open");
    const staleOpenIds = [];
    const freshRemoteOpenOrders = (openOrders || []).filter((order) => {
      if (saleAlreadyClosedOrder(state.sales, order)) {
        staleOpenIds.push(order.id);
        return false;
      }
      const closedSameCommand = localClosedOrders
        .filter((closedOrder) => isTerminalOrderStatus(closedOrder.status) && Number(closedOrder.command) === Number(order.command))
        .sort((a, b) => orderTimestamp(b).localeCompare(orderTimestamp(a)))[0];
      if (!closedSameCommand) return true;
      const closedAt = orderTimestamp(closedSameCommand);
      const openedAt = orderTimestamp(order);
      const stale = openedAt && closedAt && openedAt <= closedAt;
      if (stale) staleOpenIds.push(order.id);
      return !stale;
    });
    const mergedOpen = mergeOpenOrdersByCommand(freshRemoteOpenOrders.concat(localOpenOrders));
    state.orders = [...localClosedOrders, ...mergedOpen.orders];
    applyRemovedOrderItems(state);
    const openOrderIds = new Set(state.orders.filter((order) => order.status === "open").map((order) => order.id));
    state.selectedOrders = state.selectedOrders.filter((orderId) => openOrderIds.has(orderId));
    if (state.pendingRemoval && !openOrderIds.has(state.pendingRemoval.orderId)) state.pendingRemoval = null;
    if (staleOpenIds.length) closeRemoteDuplicateOrders(staleOpenIds);
    if (mergedOpen.duplicateIds.length) saveState();
    else saveLocalState();
  }

  function orderRow(order) {
    const now = new Date().toISOString();
    const payload = { ...order, updatedAt: order.updatedAt || now };
    return {
      id: order.id,
      command_number: order.command,
      status: order.status || "open",
      payload,
      created_at: order.createdAt || now,
      closed_at: order.closedAt || null,
      updated_by: currentAccess.id,
      updated_at: now
    };
  }

  async function persistNormalizedState(data, configOnly = false, options = {}) {
    const now = new Date().toISOString();
    const settingsResult = await supabaseClient.from("pdv_settings").upsert({
      id: "main",
      command_max: Number(data.commandMax || 100),
      buffet_price: Number(data.buffetPrice || 43),
      cash_start_by_date: data.cashStartByDate || {},
      pix_key: data.pixKey || "",
      meta: normalizedMetaFromState(data),
      updated_by: currentAccess.id,
      updated_at: now
    });
    if (settingsResult.error) throw settingsResult.error;
    normalizedRemoteAvailable = true;
    if (configOnly) {
      const productRows = (data.products || []).map((product, index) => ({
        id: product.id,
        name: product.name,
        price: Number(product.price || 0),
        category: product.category || inferProductCategory(product.name),
        front: product.front !== false,
        image: product.image || "",
        position: index,
        active: true,
        updated_by: currentAccess.id,
        updated_at: now
      }));
      if (productRows.length) {
        const result = await supabaseClient.from("pdv_products").upsert(productRows);
        if (result.error) throw result.error;
      }
      const activeProductsResult = await supabaseClient.from("pdv_products").select("id").eq("active", true);
      if (activeProductsResult.error) throw activeProductsResult.error;
      const activeProductIds = new Set((productRows || []).map((product) => product.id));
      const removedProductIds = (activeProductsResult.data || [])
        .map((product) => product.id)
        .filter((productId) => !activeProductIds.has(productId));
      if (removedProductIds.length) {
        const result = await supabaseClient
          .from("pdv_products")
          .update({ active: false, updated_by: currentAccess.id, updated_at: now })
          .in("id", removedProductIds);
        if (result.error) throw result.error;
      }
      const companyRows = (data.companies || []).map((company) => ({
        id: company.id,
        name: company.name,
        discount: Number(company.discount || 0),
        logo: company.logo || "",
        active: true,
        updated_by: currentAccess.id,
        updated_at: now
      }));
      if (companyRows.length) {
        const result = await supabaseClient.from("pdv_companies").upsert(companyRows);
        if (result.error) throw result.error;
      }
      return true;
    }
    const recentOrderLimit = daysAgoIso(2);
    let orderRows = (data.orders || [])
      .filter((order) => order.status === "open" || String(order.closedAt || order.createdAt || "").slice(0, 10) >= recentOrderLimit)
      .map(orderRow);
    let duplicateOpenOrderIds = [];
    const localOpenOrders = (data.orders || []).filter((order) => order.status === "open");
    const remoteOpenByCommand = await fetchRemoteOpenOrdersByCommands(localOpenOrders.map((order) => order.command));
    if (remoteOpenByCommand) {
      const collapsed = mergeOpenOrdersByCommand(remoteOpenByCommand.concat(localOpenOrders));
      duplicateOpenOrderIds = collapsed.duplicateIds;
      data.orders = (data.orders || []).filter((order) => order.status !== "open").concat(collapsed.orders);
      state.orders = (state.orders || []).filter((order) => order.status !== "open").concat(collapsed.orders);
      const openIdsByCommand = new Map(collapsed.orders.map((order) => [Number(order.command), order.id]));
      state.selectedOrders = Array.from(new Set(state.selectedOrders.map((selectedId) => {
        const selectedOrder = localOpenOrders.find((order) => order.id === selectedId);
        return selectedOrder ? openIdsByCommand.get(Number(selectedOrder.command)) || selectedId : selectedId;
      })));
      orderRows = data.orders
        .filter((order) => order.status === "open" || String(order.closedAt || order.createdAt || "").slice(0, 10) >= recentOrderLimit)
        .map(orderRow);
    }
    if (orderRows.length) {
      const remoteOrderRows = await fetchRemoteOrdersByIds(orderRows.map((order) => order.id));
      if (remoteOrderRows) {
        const remoteById = new Map(remoteOrderRows.map((order) => [order.id, order]));
        orderRows = orderRows.filter((order) => {
          const remoteOrder = remoteById.get(order.id);
          if (!remoteOrder) return true;
          return !(order.status === "open" && isTerminalOrderStatus(remoteOrder.status));
        });
      }
    }
    if (orderRows.length) {
      const result = await supabaseClient.from("pdv_orders").upsert(orderRows);
      if (result.error) throw result.error;
    }
    if (duplicateOpenOrderIds.length) await closeRemoteDuplicateOrders(duplicateOpenOrderIds);
    await closeRemoteOpenOrdersForClosedOrders((data.orders || []).filter((order) => order.status !== "open"));
    const recentSaleLimit = daysAgoIso(14);
    const saleRows = options.syncSales ? (data.sales || []).filter((sale) => normalizeDateIso(sale.date || sale.createdAt) >= recentSaleLimit).map((sale) => ({
      id: sale.id,
      sale_date: normalizeDateIso(sale.date || sale.createdAt),
      payload: sale,
      cancelled: (data.cancelledSaleIds || []).includes(sale.id),
      created_at: sale.createdAt || now,
      updated_by: currentAccess.id,
      updated_at: now
    })) : [];
    if (saleRows.length) {
      const result = await supabaseClient.from("pdv_sales").upsert(saleRows);
      if (result.error) throw result.error;
    }
    if (options.syncClients && Array.isArray(data.clients) && data.clients.length) {
      const remoteClients = await fetchRemoteClients();
      if (remoteClients) {
        data.clients = mergeClientsForSync(remoteClients, data.clients, data.cancelledClientEntryIds || []);
      }
    }
    const clientRows = options.syncClients ? (data.clients || []).filter((client) => client.entries && client.entries.length).map((client) => ({
      id: client.id,
      name: client.name,
      phone: client.phone || "",
      note: client.note || "",
      payload: client,
      active: true,
      updated_by: currentAccess.id,
      updated_at: now
    })) : [];
    if (clientRows.length) {
      const result = await supabaseClient.from("pdv_clients").upsert(clientRows);
      if (result.error) throw result.error;
    }
    const removalRows = (data.itemRemovals || []).map((entry) => ({
      id: entry.id,
      removal_date: entry.date || todayIso(),
      payload: entry,
      created_at: entry.createdAt || now,
      updated_by: currentAccess.id
    }));
    if (removalRows.length) {
      const result = await supabaseClient.from("pdv_item_removals").upsert(removalRows);
      if (result.error) throw result.error;
    }
    const adjustmentRows = (data.orderAdjustments || []).map((entry) => ({
      id: entry.id,
      adjustment_date: entry.date || todayIso(),
      payload: entry,
      created_at: entry.createdAt || now,
      updated_by: currentAccess.id
    }));
    if (adjustmentRows.length) {
      const result = await supabaseClient.from("pdv_order_adjustments").upsert(adjustmentRows);
      if (result.error) throw result.error;
    }
    return true;
  }

  async function ensureRemoteStateReady() {
    if (!supabaseClient || !currentAccess) return false;
    if (remoteLoaded) return true;
    const remoteData = await fetchRemoteRestaurantData();
    if (remoteData === null) return false;
    if (!Object.keys(remoteData).length) {
      remoteLoaded = true;
      await syncRemoteState(true);
      return true;
    }
    remoteLoaded = true;
    return true;
  }

  async function syncRemoteState(force = false) {
    if (!supabaseClient || !currentAccess || (!remoteLoaded && !force)) return;
    if (remoteSaving) {
      remoteSavePending = true;
      return;
    }
    remoteSaving = true;
    const syncRevision = localRevision;
    const syncClients = clientsPendingSync || force;
    const syncSales = salesPendingSync || force;
    const localData = stateForRemote();
    try {
      try {
        await persistNormalizedState(localData, false, { syncClients, syncSales });
        if (syncRevision === localRevision) {
          localPendingSync = false;
          if (syncClients) markClientsSynced();
          if (syncSales) salesPendingSync = false;
        }
        notifyRemoteStateChanged();
        return;
      } catch (error) {
        console.warn("Falha ao sincronizar tabelas normalizadas", error);
        remoteSavePending = true;
        if (currentAccess) {
          const context = currentAccess.role === "balanca" ? "balanca" : "caixa";
          setLastAction("Falha ao salvar no Supabase. Tentando sincronizar novamente...", context);
        }
        return;
      }
      const remoteData = await fetchRemoteRestaurantData();
      if (remoteData === null) {
        return;
      }
      const mergedData = mergeOperationalState(remoteData, localData);
      const { error } = await supabaseClient
        .from("restaurant_state")
        .upsert({
          id: "main",
          data: mergedData,
          updated_by: currentAccess.id,
          updated_at: new Date().toISOString()
        });
      if (error) console.warn("Falha ao sincronizar Supabase", error);
      else {
        if (syncRevision === localRevision) {
          localPendingSync = false;
          mergeRemoteState(mergedData);
        }
        notifyRemoteStateChanged();
      }
    } finally {
      remoteSaving = false;
      if (remoteSavePending) {
        remoteSavePending = false;
        setTimeout(() => syncRemoteState(true), 350);
      }
    }
  }

  async function refreshRemoteState(options = {}) {
    if (!supabaseClient || !currentAccess || remoteSaving || remotePolling) return;
    if (localPendingSync || Date.now() - lastLocalChangeAt < LOCAL_REMOTE_PROTECTION_MS) return;
    remotePolling = true;
    try {
      const openOrders = await fetchRemoteOpenOrders();
      if (openOrders === null) {
        return;
      }
      mergeRemoteOpenOrders(openOrders);
      if (options.forceClients || Date.now() - lastClientPollAt >= CLIENT_POLL_MS) {
        const clients = await fetchRemoteClients();
        lastClientPollAt = Date.now();
        if (clients) {
          state.clients = mergeClientsForSync(clients, state.clients || [], state.cancelledClientEntryIds || []);
          saveLocalState();
        }
      }
      renderCommands();
      renderBalancePreview();
      renderOpenOrders();
      renderOrderEditor();
      renderCheckout();
      renderClients();
      renderSelectedClient();
    } finally {
      remotePolling = false;
    }
  }

  function scheduleRemoteRefresh(delay = 120, options = {}) {
    if (!supabaseClient || !currentAccess) return;
    remoteRefreshNeedsClients = remoteRefreshNeedsClients || !!options.forceClients;
    if (remoteRefreshTimer) clearTimeout(remoteRefreshTimer);
    remoteRefreshTimer = setTimeout(() => {
      const forceClients = remoteRefreshNeedsClients;
      remoteRefreshNeedsClients = false;
      remoteRefreshTimer = null;
      refreshRemoteState({ forceClients });
    }, delay);
  }

  function startRemotePolling() {
    if (!supabaseClient || remotePollTimer) return;
    refreshRemoteState();
    remotePollTimer = setInterval(refreshRemoteState, REMOTE_POLL_MS);
  }

  function stopRemotePolling() {
    if (!remotePollTimer) return;
    clearInterval(remotePollTimer);
    remotePollTimer = null;
  }

  async function saveConfigState() {
    if (!supabaseClient || !currentAccess) {
      saveState();
      return;
    }
    const ready = await ensureRemoteStateReady();
    if (!ready) {
      alert("Não foi possível sincronizar com o banco agora. As configurações não foram salvas para os outros aparelhos.");
      return;
    }
    const remoteData = await fetchRemoteRestaurantData();
    if (remoteData === null) {
      alert("Falha ao conferir comandas antes de salvar. Tente novamente em alguns segundos.");
      return;
    }
    const configData = stateForRemote();
    try {
      await persistNormalizedState(configData, true);
      notifyRemoteStateChanged();
      render();
      return;
    } catch (error) {
      alert(`Falha ao salvar configurações: ${error.message || error}`);
      return;
    }
    const merged = {
      ...remoteData,
      commandMax: configData.commandMax,
      products: configData.products,
      companies: configData.companies,
      buffetPrice: configData.buffetPrice,
      pixKey: configData.pixKey,
      removedOrderItemIds: mergeIdList(remoteData.removedOrderItemIds, configData.removedOrderItemIds),
      cancelledSaleIds: mergeIdList(remoteData.cancelledSaleIds, configData.cancelledSaleIds),
      cancelledClientEntryIds: mergeIdList(remoteData.cancelledClientEntryIds, configData.cancelledClientEntryIds)
    };
    applyRemovedOrderItems(merged);
    applyCancellations(merged);
    remoteSaving = true;
    const result = await supabaseClient
      .from("restaurant_state")
      .upsert({
        id: "main",
        data: merged,
        updated_by: currentAccess.id,
        updated_at: new Date().toISOString()
      });
    remoteSaving = false;
    if (result.error) {
      alert(`Falha ao salvar configurações: ${result.error.message}`);
      return;
    }
    mergeRemoteState(merged);
    render();
  }

  function subscribeRemoteState() {
    if (!supabaseClient || remoteChannel) return;
    remoteChannel = supabaseClient
      .channel("restaurant-state")
      .on("broadcast", { event: "state_changed" }, () => {
        scheduleRemoteRefresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pdv_orders" }, () => {
        scheduleRemoteRefresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pdv_clients" }, () => {
        scheduleRemoteRefresh(250, { forceClients: true });
      })
      .subscribe();
  }

  function notifyRemoteStateChanged() {
    if (!remoteChannel) return;
    remoteChannel.send({
      type: "broadcast",
      event: "state_changed",
      payload: { at: new Date().toISOString() }
    });
  }

  async function loadSupabaseProfile(userId) {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("user_id, display_name, role, active")
      .eq("user_id", userId)
      .single();
    if (error || !data || !data.active) return null;
    return { id: data.user_id, name: data.display_name, role: data.role, mode: "supabase" };
  }

  async function logAudit(action, context = {}) {
    if (!supabaseClient || !currentAccess) return;
    await supabaseClient.from("audit_logs").insert({
      user_id: currentAccess.id,
      action,
      context
    });
  }

  function loadSession() {
    try {
      const user = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (!user || !roleViews[user.role]) return null;
      if (supabaseClient && user.mode !== "supabase") return null;
      return user;
    } catch {
      return null;
    }
  }

  function saveSession(user) {
    currentAccess = user;
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }

  function loadLoginGuard() {
    try {
      const guard = JSON.parse(localStorage.getItem(LOGIN_GUARD_KEY) || "{}");
      if (!guard.lockedUntil || Date.now() >= guard.lockedUntil) {
        return { attempts: 0, lockedUntil: 0 };
      }
      return guard;
    } catch {
      return { attempts: 0, lockedUntil: 0 };
    }
  }

  function saveLoginGuard(guard) {
    localStorage.setItem(LOGIN_GUARD_KEY, JSON.stringify(guard));
  }

  function clearLoginGuard() {
    localStorage.removeItem(LOGIN_GUARD_KEY);
  }

  function loginLockMessage(lockedUntil) {
    const remainingSeconds = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000));
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `Muitas tentativas. Aguarde ${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")} para tentar novamente.`;
  }

  function canTryLogin() {
    const guard = loadLoginGuard();
    if (guard.lockedUntil && Date.now() < guard.lockedUntil) {
      $("#authError").textContent = loginLockMessage(guard.lockedUntil);
      return false;
    }
    return true;
  }

  function registerFailedLogin() {
    const guard = loadLoginGuard();
    const attempts = guard.attempts + 1;
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      const lockedUntil = Date.now() + LOGIN_LOCK_MS;
      saveLoginGuard({ attempts: 0, lockedUntil });
      $("#authError").textContent = loginLockMessage(lockedUntil);
      return;
    }
    saveLoginGuard({ attempts, lockedUntil: 0 });
    $("#authError").textContent = `Dados inválidos. Tentativas restantes: ${MAX_LOGIN_ATTEMPTS - attempts}.`;
  }

  function canAccess(view) {
    if (!currentAccess) return false;
    return (roleViews[currentAccess.role] || []).includes(view);
  }

  function parseMoney(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits ? Number(digits) / 100 : 0;
  }

  function setMoneyInput(input, value) {
    input.value = value ? money.format(value) : "";
  }

  function wireMoneyInput(selector) {
    const input = $(selector);
    input.addEventListener("input", () => setMoneyInput(input, parseMoney(input.value)));
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function formatDate(iso) {
    if (!iso) return "";
    const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
    return fullDateFmt.format(new Date(year, month - 1, day));
  }

  function commandOrder(number) {
    return state.orders.find((order) => order.command === number && order.status === "open");
  }

  function selectedOrders() {
    return state.orders.filter((order) => state.selectedOrders.includes(order.id));
  }

  function orderTotal(order) {
    return order.items.reduce((sum, item) => sum + itemTotal(item), 0);
  }

  function paymentMethodOptions(selected) {
    return paymentMethods.map((method) => `<option value="${method}" ${method === selected ? "selected" : ""}>${method}</option>`).join("");
  }

  function percentValue(value) {
    const parsed = Number(String(value || "").replace(",", "."));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  function activeCompany() {
    return state.companies.find((company) => company.name === state.activeDiscount || company.id === state.activeDiscount);
  }

  function discountAmount(subtotal) {
    const company = activeCompany();
    const companyDiscount = company ? subtotal * (company.discount / 100) : 0;
    return Math.min(subtotal, companyDiscount + Number(state.manualDiscount || 0));
  }

  function emvField(idValue, value) {
    const text = String(value || "");
    return `${idValue}${String(text.length).padStart(2, "0")}${text}`;
  }

  function crc16(payload) {
    let crc = 0xffff;
    for (let index = 0; index < payload.length; index += 1) {
      crc ^= payload.charCodeAt(index) << 8;
      for (let bit = 0; bit < 8; bit += 1) {
        crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
        crc &= 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
  }

  function pixPayload(amount) {
    const key = String(state.pixKey || "").trim();
    if (!key || !amount) return "";
    const merchantAccount = emvField("00", "br.gov.bcb.pix") + emvField("01", key);
    const payload =
      emvField("00", "01") +
      emvField("26", merchantAccount) +
      emvField("52", "0000") +
      emvField("53", "986") +
      emvField("54", amount.toFixed(2)) +
      emvField("58", "BR") +
      emvField("59", "RESTAURANTE ESTALAGEM".slice(0, 25)) +
      emvField("60", "BRASIL".slice(0, 15)) +
      emvField("62", emvField("05", "***"));
    const withCrc = `${payload}6304`;
    return withCrc + crc16(withCrc);
  }

  function isCieloPaymentMethod(method) {
    return cieloPaymentMethods.includes(method);
  }

  function cieloSaleReference() {
    const commands = selectedOrders().map((order) => order.command).sort((a, b) => a - b);
    return commands.length ? `ESTALAGEM-${todayIso()}-${commands.join("-")}` : `ESTALAGEM-${Date.now()}`;
  }

  function cieloPaymentRequest(method, amount) {
    const orders = selectedOrders();
    return {
      amount: Number(amount || 0),
      method,
      saleReference: cieloSaleReference(),
      terminalLogicalNumber: state.cieloIntegration.terminalLogicalNumber,
      commands: orders.map((order) => order.command),
      orders: orders.map((order) => ({
        id: order.id,
        command: order.command,
        total: orderTotal(order)
      }))
    };
  }

  async function requestCieloPayment(method, amount) {
    if (!supabaseClient) throw new Error("Supabase indisponivel.");
    if (!isCieloPaymentMethod(method)) throw new Error("Forma de pagamento fora da Cielo.");
    const { data, error } = await supabaseClient.functions.invoke("cielo-payment", {
      body: cieloPaymentRequest(method, amount)
    });
    if (error) throw error;
    return data;
  }

  function checkoutTotalRaw() {
    const subtotal = selectedOrders().reduce((sum, order) => sum + orderTotal(order), 0);
    return Math.max(0, subtotal - discountAmount(subtotal));
  }

  function paidTotal() {
    return state.pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  function paidOverage() {
    return Math.max(0, paidTotal() - checkoutTotalRaw());
  }

  function changeGivenValue() {
    const raw = $("#changeGiven").value;
    if (!raw || !raw.trim()) return paidOverage();
    return Math.min(paidOverage(), parseMoney(raw));
  }

  function keptChangeValue(changeGiven = changeGivenValue()) {
    return Math.max(0, paidOverage() - changeGiven);
  }

  function remainingTotal() {
    return Math.max(0, checkoutTotalRaw() - paidTotal());
  }

  function getOrCreateOrder(command) {
    let order = commandOrder(command);
    if (!order) {
      const now = new Date().toISOString();
      order = { id: id(), command, status: "open", items: [], createdAt: now, updatedAt: now };
      state.orders.push(order);
    }
    return order;
  }

  function setLastAction(message, context) {
    state.lastAction = { message, context, at: new Date().toISOString() };
  }

  function canFullyEditOrders() {
    return !!currentAccess && (currentAccess.role === "balanca" || currentAccess.role === "admin");
  }

  function canRemoveOrderItems() {
    return !!currentAccess && ["balanca", "caixa", "admin"].includes(currentAccess.role);
  }

  function resetCheckoutAfterOrderChange(orderId) {
    const openOrderIds = new Set(state.orders.filter((entry) => entry.status === "open").map((entry) => entry.id));
    state.selectedOrders = state.selectedOrders.filter((idValue) => openOrderIds.has(idValue));
    if (!orderId || state.selectedOrders.includes(orderId)) {
      state.pendingPayments = [];
      state.activeDiscount = null;
      state.manualDiscount = 0;
    }
  }

  function isAdmin() {
    return !!currentAccess && currentAccess.role === "admin";
  }

  function isWeightMeal(item) {
    const text = normalizeText(item && item.name);
    return text.includes("peso") && !text.includes("vontade");
  }

  function renderActionFeedback(selector, context) {
    const box = $(selector);
    const action = state.lastAction;
    if (!action || action.context !== context) {
      box.classList.remove("visible");
      box.textContent = "";
      return;
    }
    box.textContent = action.message;
    box.classList.add("visible");
  }

  function registerItemRemoval(order, item, context, reason) {
    if (context !== "caixa") return;
    const entry = {
      id: id(),
      date: todayIso(),
      createdAt: new Date().toISOString(),
      command: order.command,
      itemName: item.name,
      itemPrice: item.price,
      reason,
      userId: currentAccess ? currentAccess.id : null,
      userName: currentAccess ? currentAccess.name : "Sem usuário",
      role: currentAccess ? currentAccess.role : null
    };
    state.itemRemovals.push(entry);
    logAudit("order_item_removed", entry);
  }

  function requestOrderItemRemoval(order, itemId, context) {
    if (!canRemoveOrderItems()) return;
    if (context !== "caixa") {
      removeOrderItem(order, itemId, context);
      return;
    }
    const item = order.items.find((entry) => entry.id === itemId);
    if (!item) return;
    state.pendingRemoval = { orderId: order.id, itemId };
    renderRemovalModal();
  }

  function removeOrderItem(order, itemId, context, reason = "") {
    if (!canRemoveOrderItems()) return;
    const currentOrder = state.orders.find((entry) => entry.id === order.id) || order;
    const item = currentOrder.items.find((entry) => entry.id === itemId);
    if (!item) return;
    registerItemRemoval(currentOrder, item, context, reason);
    if (!state.removedOrderItemIds.includes(item.id)) state.removedOrderItemIds.push(item.id);
    currentOrder.items = currentOrder.items.filter((entry) => entry.id !== itemId);
    currentOrder.updatedAt = new Date().toISOString();
    if (!currentOrder.items.length) {
      currentOrder.status = "cancelled";
      currentOrder.closedAt = currentOrder.updatedAt;
    }
    resetCheckoutAfterOrderChange(currentOrder.id);
    const message = reason
      ? `${item.name} removido da comanda ${currentOrder.command}. Motivo registrado.`
      : `${item.name} removido da comanda ${currentOrder.command}.`;
    setLastAction(message, context);
    saveState();
    render();
  }

  function addItemToSelected(name, price) {
    if (!canFullyEditOrders()) return;
    if (!state.selectedCommand) {
      alert("Selecione uma comanda primeiro.");
      return;
    }
    const order = getOrCreateOrder(state.selectedCommand);
    addProductToOrder(order, { id: "", name, price, category: "outros" }, "balanca");
    setLastAction(`${name} adicionado na comanda ${order.command}.`, "balanca");
    saveState();
    render();
    logAudit("order_item_added", { command: order.command, name, price });
  }

  function replaceWeightWithBuffet(order, itemId) {
    if (!currentAccess || !["caixa", "balanca", "admin"].includes(currentAccess.role)) return;
    const item = order && order.items.find((entry) => entry.id === itemId);
    if (!item || !isWeightMeal(item)) return;
    const adjustment = {
      id: id(),
      date: todayIso(),
      createdAt: new Date().toISOString(),
      command: order.command,
      itemId: item.id,
      fromName: item.name,
      fromPrice: item.price,
      toName: "Refeição à vontade",
      toPrice: state.buffetPrice,
      userId: currentAccess.id,
      userName: currentAccess.name,
      role: currentAccess.role
    };
    item.name = adjustment.toName;
    item.price = adjustment.toPrice;
    item.updatedAt = adjustment.createdAt;
    order.updatedAt = adjustment.createdAt;
    state.orderAdjustments.push(adjustment);
    state.pendingPayments = [];
    const actionContext = currentAccess.role === "balanca" ? "balanca" : "caixa";
    setLastAction(`Comanda ${order.command}: refeição por peso trocada por à vontade.`, actionContext);
    saveState();
    logAudit("weight_meal_replaced_with_buffet", adjustment);
    render();
  }

  function closeSelectedOrders(extra = {}) {
    const orders = selectedOrders();
    if (!orders.length) return;
    const subtotal = orders.reduce((sum, order) => sum + orderTotal(order), 0);
    const discount = discountAmount(subtotal);
    const total = Math.max(0, subtotal - discount);
    const company = activeCompany();
    const payments = state.pendingPayments.length
      ? state.pendingPayments
      : [{ id: id(), method: $("#paymentMethod").value, amount: total }];
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const sale = {
      id: id(),
      createdAt: new Date().toISOString(),
      date: todayIso(),
      orders: orders.map((order) => ({
        command: order.command,
        items: order.items,
        total: orderTotal(order)
      })),
      subtotal,
      total,
      discountCompany: company ? company.name : null,
      discountPercent: company ? company.discount : 0,
      manualDiscount: Number(state.manualDiscount || 0),
      discount,
      payments,
      change: extra.changeGiven || 0,
      changeDue: Math.max(0, totalPaid - total),
      keptChange: extra.keptChange || 0,
      forgiven: extra.forgiven || 0
    };

    const fiadoPayment = payments.find((payment) => payment.method === "Fiado");
    if (fiadoPayment) {
      const clientId = state.selectedCheckoutClientId || $("#checkoutClient").value;
      const client = state.clients.find((item) => item.id === clientId);
      if (!client) {
        alert("Selecione ou cadastre o cliente do fiado.");
        return;
      }
      client.entries.push({
        id: id(),
        type: "debt",
        amount: fiadoPayment.amount,
        date: todayIso(),
        origin: "Comanda",
        saleId: sale.id,
        orders: sale.orders
      });
    }

    orders.forEach((order) => {
      const now = new Date().toISOString();
      order.status = "closed";
      order.closedAt = now;
      order.updatedAt = now;
    });
    state.sales.push(sale);
    logAudit("sale_closed", { saleId: sale.id, total: sale.total, commands: sale.orders.map((order) => order.command) });
    state.selectedOrders = [];
    state.pendingPayments = [];
    state.activeDiscount = null;
    state.manualDiscount = 0;
    $("#paymentAmount").value = "";
    $("#manualDiscountAmount").value = "";
    $("#changeGiven").value = "";
    saveState({ clientsChanged: !!fiadoPayment, salesChanged: true });
    render();
  }

  function clientBalance(client) {
    return client.entries.reduce((sum, entry) => {
      return sum + (entry.type === "debt" ? entry.amount : -entry.amount);
    }, 0);
  }

  function renderTopbar() {
    $("#todayLabel").textContent = dateFmt.format(new Date());
  }

  function renderBuffetButton() {
    $("#addBuffetBtn").textContent = `À vontade ${money.format(state.buffetPrice)}`;
  }

  function firstAllowedView() {
    return (roleViews[currentAccess && currentAccess.role] || ["balanca"])[0] || "balanca";
  }

  function activateView(view) {
    const target = canAccess(view) ? view : firstAllowedView();
    $$(".tab").forEach((item) => item.classList.toggle("active", item.dataset.view === target));
    $$(".view").forEach((item) => item.classList.toggle("active", item.id === `view-${target}`));
  }

  function renderSecurity() {
    document.body.classList.toggle("supabase-enabled", !!supabaseClient);
    document.body.classList.toggle("locked", !currentAccess);
    document.body.classList.toggle("role-balanca", !!currentAccess && currentAccess.role === "balanca");
    $("#currentUserLabel").textContent = currentAccess ? `Perfil: ${currentAccess.name}` : "";
    $$(".tab").forEach((tab) => {
      tab.hidden = currentAccess ? !canAccess(tab.dataset.view) : true;
    });
    if (!currentAccess) return;
    const active = $(".tab.active");
    if (!active || !canAccess(active.dataset.view)) activateView(firstAllowedView());
  }

  function renderCommands() {
    const box = $("#availableCommands");
    box.innerHTML = "";
    let available = 0;
    let openCount = 0;
    for (let number = 1; number <= state.commandMax; number += 1) {
      const open = commandOrder(number);
      if (open) openCount += 1;
      else available += 1;
      const btn = document.createElement("button");
      btn.className = "command-btn" + (open ? " open" : "") + (state.selectedCommand === number ? " selected" : "");
      btn.innerHTML = `<strong>${number}</strong>${open ? `<span>${open.items.length} item(ns)</span>` : ""}`;
      btn.title = open ? `Comanda aberta — ${money.format(orderTotal(open))}` : "Comanda disponível";
      btn.addEventListener("click", () => {
        state.selectedCommand = number;
        state.showCommandFocus = true;
        render();
      });
      box.appendChild(btn);
    }
    $("#availableCount").textContent = `${available} livres · ${openCount} abertas`;
    if ($("#selectedCommandLabel")) $("#selectedCommandLabel").textContent = state.selectedCommand ? `Comanda ${state.selectedCommand}` : "Selecione";
  }

  function renderFrontProducts() {
    const box = $("#frontProducts");
    if (!box) return;
    box.innerHTML = menuProductsMarkup("data-add-product");
    wireMenuCategoryToggles(box);
    box.querySelectorAll("[data-add-product]").forEach((btn) => btn.addEventListener("click", () => {
      const product = state.products.find((item) => item.id === btn.dataset.addProduct);
      if (!product) return;
      if (!state.selectedCommand) {
        alert("Selecione uma comanda primeiro.");
        return;
      }
      const order = getOrCreateOrder(state.selectedCommand);
      addProductToOrder(order, product, "balanca");
      saveState();
      render();
      logAudit("order_item_added", { command: order.command, name: product.name, price: product.price });
    }));
  }

  function renderBalancePreview() {
    if (!$("#balanceOrderPreview")) return;
    renderActionFeedback("#balanceFeedback", "balanca");
    const box = $("#balanceOrderPreview");
    const order = state.selectedCommand ? commandOrder(state.selectedCommand) : null;
    if (!order || !order.items.length) {
      box.innerHTML = '<div class="empty">A comanda selecionada ainda não tem itens.</div>';
      return;
    }
    const canReplace = currentAccess && ["caixa", "balanca", "admin"].includes(currentAccess.role);
    box.innerHTML = order.items.map((item) => `
      <div class="line-item">
        <span>${itemDisplayName(item)}</span>
        <strong>${money.format(itemTotal(item))}</strong>
        <div class="line-item-actions">
          ${item.groupedQuantity ? `<button class="qty-action" data-balance-qty="${item.id}" data-delta="-1" type="button">−</button><span class="qty-pill">${itemQuantity(item)}</span><button class="qty-action" data-balance-qty="${item.id}" data-delta="1" type="button">+</button>` : ""}
          ${canReplace && isWeightMeal(item) ? `<button class="replace-meal" data-balance-replace-weight="${item.id}">Trocar por à vontade</button>` : ""}
          <button class="remove-item" data-order="${order.id}" data-item="${item.id}">×</button>
        </div>
      </div>
    `).join("") + `<div class="line-item"><strong>Total</strong><strong>${money.format(orderTotal(order))}</strong></div>`;
    box.querySelectorAll(".remove-item").forEach((btn) => btn.addEventListener("click", () => {
      requestOrderItemRemoval(order, btn.dataset.item, "balanca");
    }));
    box.querySelectorAll("[data-balance-replace-weight]").forEach((btn) => btn.addEventListener("click", () => {
      replaceWeightWithBuffet(order, btn.dataset.balanceReplaceWeight);
    }));
    box.querySelectorAll("[data-balance-qty]").forEach((btn) => btn.addEventListener("click", () => {
      changeGroupedItemQuantity(order, btn.dataset.balanceQty, Number(btn.dataset.delta), "balanca");
    }));
  }

  function renderCommandFocusModal() {
    const modal = $("#commandFocusModal");
    if (!modal) return;
    const order = state.selectedCommand ? commandOrder(state.selectedCommand) : null;
    if (!state.showCommandFocus || !state.selectedCommand) {
      modal.classList.add("hidden");
      return;
    }
    $("#commandFocusTitle").textContent = `Comanda ${state.selectedCommand}`;
    renderActionFeedback("#commandFocusFeedback", "balanca");
    $("#commandFocusTotal").textContent = money.format(order ? orderTotal(order) : 0);
    const itemsBox = $("#commandFocusItems");
    if (!order || !order.items.length) {
      itemsBox.innerHTML = '<div class="empty">A comanda selecionada ainda não tem itens.</div>';
    } else {
      const canReplace = currentAccess && ["caixa", "balanca", "admin"].includes(currentAccess.role);
      itemsBox.innerHTML = order.items.map((item) => `
        <div class="line-item">
          <span>${itemDisplayName(item)}</span>
          <strong>${money.format(itemTotal(item))}</strong>
          <div class="line-item-actions">
            ${item.groupedQuantity ? `<button class="qty-action" data-focus-qty="${item.id}" data-delta="-1" type="button">−</button><span class="qty-pill">${itemQuantity(item)}</span><button class="qty-action" data-focus-qty="${item.id}" data-delta="1" type="button">+</button>` : ""}
            ${canReplace && isWeightMeal(item) ? `<button class="replace-meal" data-focus-replace-weight="${item.id}">Trocar por à vontade</button>` : ""}
            <button class="remove-item" data-focus-item="${item.id}">×</button>
          </div>
        </div>
      `).join("");
      itemsBox.querySelectorAll("[data-focus-item]").forEach((btn) => btn.addEventListener("click", () => {
        requestOrderItemRemoval(order, btn.dataset.focusItem, "balanca");
      }));
      itemsBox.querySelectorAll("[data-focus-replace-weight]").forEach((btn) => btn.addEventListener("click", () => {
        replaceWeightWithBuffet(order, btn.dataset.focusReplaceWeight);
      }));
      itemsBox.querySelectorAll("[data-focus-qty]").forEach((btn) => btn.addEventListener("click", () => {
        changeGroupedItemQuantity(order, btn.dataset.focusQty, Number(btn.dataset.delta), "balanca");
      }));
    }
    const productsBox = $("#commandFocusProducts");
    productsBox.innerHTML = menuProductsMarkup("data-focus-product");
    wireMenuCategoryToggles(productsBox);
    productsBox.querySelectorAll("[data-focus-product]").forEach((btn) => btn.addEventListener("click", () => {
      const product = state.products.find((item) => item.id === btn.dataset.focusProduct);
      if (!product) return;
      const order = getOrCreateOrder(state.selectedCommand);
      addProductToOrder(order, product, "balanca");
      saveState();
      render();
      logAudit("order_item_added", { command: order.command, name: product.name, price: product.price });
    }));
    modal.classList.remove("hidden");
  }

  function renderOpenOrders() {
    const box = $("#openOrders");
    const open = state.orders.filter((order) => order.status === "open").sort((a, b) => a.command - b.command);
    if (!open.length) {
      box.innerHTML = '<div class="empty">Nenhuma comanda em aberto.</div>';
      return;
    }
    box.innerHTML = "";
    open.forEach((order) => {
      const btn = document.createElement("button");
      btn.className = "order-card" + (state.selectedOrders.includes(order.id) ? " selected" : "");
      btn.innerHTML = `<div><strong>Comanda ${order.command}</strong><span>${order.items.length} item(ns)</span></div><span>${order.items.map((item) => itemDisplayName(item)).slice(0, 3).join(", ")}</span><strong class="order-card-total">${money.format(orderTotal(order))}</strong>`;
      btn.addEventListener("click", () => {
        state.selectedOrders = state.selectedOrders.includes(order.id)
          ? state.selectedOrders.filter((idValue) => idValue !== order.id)
          : [...state.selectedOrders, order.id];
        state.pendingPayments = [];
        saveLocalState();
        render();
      });
      box.appendChild(btn);
    });
  }

  function renderCheckoutOrderPreview(order) {
    const box = $("#checkoutOrderPreview");
    renderActionFeedback("#checkoutFeedback", "caixa");
    if (!order || !order.items.length) {
      box.innerHTML = '<div class="empty">A comanda selecionada ainda não tem itens.</div>';
      return;
    }
    const canRemove = canRemoveOrderItems();
    const canReplace = currentAccess && ["caixa", "balanca", "admin"].includes(currentAccess.role);
    box.innerHTML = order.items.map((item) => `
      <div class="line-item">
        <span>${itemDisplayName(item)}</span>
        <strong>${money.format(itemTotal(item))}</strong>
        <div class="line-item-actions">
          ${item.groupedQuantity ? `<button class="qty-action" data-checkout-qty="${item.id}" data-delta="-1" type="button">−</button><span class="qty-pill">${itemQuantity(item)}</span><button class="qty-action" data-checkout-qty="${item.id}" data-delta="1" type="button">+</button>` : ""}
          ${canReplace && isWeightMeal(item) ? `<button class="replace-meal" data-replace-weight="${item.id}">Trocar por à vontade</button>` : ""}
          ${canRemove ? `<button class="remove-item" data-checkout-item="${item.id}">×</button>` : ""}
        </div>
      </div>
    `).join("") + `<div class="line-item"><strong>Total</strong><strong>${money.format(orderTotal(order))}</strong></div>`;
    box.querySelectorAll("[data-checkout-item]").forEach((btn) => btn.addEventListener("click", () => {
      requestOrderItemRemoval(order, btn.dataset.checkoutItem, "caixa");
    }));
    box.querySelectorAll("[data-replace-weight]").forEach((btn) => btn.addEventListener("click", () => {
      replaceWeightWithBuffet(order, btn.dataset.replaceWeight);
    }));
    box.querySelectorAll("[data-checkout-qty]").forEach((btn) => btn.addEventListener("click", () => {
      changeGroupedItemQuantity(order, btn.dataset.checkoutQty, Number(btn.dataset.delta), "caixa");
    }));
  }

  function renderRemovalModal() {
    const modal = $("#removalModal");
    if (!modal) return;
    const pending = state.pendingRemoval;
    const order = pending ? state.orders.find((entry) => entry.id === pending.orderId) : null;
    const item = order ? order.items.find((entry) => entry.id === pending.itemId) : null;
    if (!pending || !order || !item) {
      modal.classList.add("hidden");
      $("#removalReason").value = "";
      $("#removalError").textContent = "";
      return;
    }
    $("#removalModalText").textContent = `Comanda ${order.command} - ${item.name} (${money.format(item.price)})`;
    $("#removalError").textContent = "";
    modal.classList.remove("hidden");
    setTimeout(() => $("#removalReason").focus(), 0);
  }

  function renderOrderEditor() {
    const box = $("#orderProducts");
    const hint = $("#orderAddHint");
    const orders = selectedOrders();
    if (orders.length !== 1) {
      hint.textContent = orders.length > 1 ? "Selecione apenas uma comanda para adicionar itens." : "Selecione uma comanda em aberto.";
      box.innerHTML = "";
      $("#checkoutOrderPreview").innerHTML = "";
      renderActionFeedback("#checkoutFeedback", "caixa");
      return;
    }
    const order = orders[0];
    const canAddProducts = currentAccess && ["caixa", "balanca", "admin"].includes(currentAccess.role);
    hint.textContent = canAddProducts
      ? `Comanda ${order.command} selecionada.`
      : `Comanda ${order.command}: selecione outra permissão para adicionar itens.`;
    renderCheckoutOrderPreview(order);
    if (!canAddProducts) {
      box.innerHTML = "";
      return;
    }
    box.innerHTML = menuProductsMarkup("data-add-open-product");
    wireMenuCategoryToggles(box);
    box.querySelectorAll("[data-add-open-product]").forEach((btn) => btn.addEventListener("click", () => {
      const product = state.products.find((item) => item.id === btn.dataset.addOpenProduct);
      if (!product) return;
      addProductToOrder(order, product, "caixa");
      resetCheckoutAfterOrderChange(order.id);
      saveState();
      render();
      logAudit("open_order_item_added", { command: order.command, name: product.name, price: product.price });
    }));
  }

  function renderCheckout() {
    const subtotal = selectedOrders().reduce((sum, order) => sum + orderTotal(order), 0);
    const total = checkoutTotalRaw();
    const company = activeCompany();
    $("#checkoutTotal").textContent = money.format(total);
    const discount = discountAmount(subtotal);
    const discountParts = [];
    if (state.activeDiscount) discountParts.push(company ? company.name : state.activeDiscount);
    if (state.manualDiscount) discountParts.push(`crédito/desconto de ${money.format(state.manualDiscount)}`);
    if (state.manualDiscount && !$("#manualDiscountAmount").value) setMoneyInput($("#manualDiscountAmount"), state.manualDiscount);
    $("#discountStatus").textContent = discount
      ? `${discountParts.join(" + ")}: desconto de ${money.format(discount)}`
      : "Nenhum desconto aplicado.";
    renderDiscountButtons();
    const hasFiado = $("#paymentMethod").value === "Fiado" || state.pendingPayments.some((p) => p.method === "Fiado");
    $("#fiadoSelectBox").classList.toggle("visible", hasFiado);
    $$(".discount-btn").forEach((btn) => {
      btn.disabled = hasFiado;
      btn.title = hasFiado ? "Desconto de empresa não se aplica ao fiado." : "";
    });
    const overage = paidOverage();
    $("#changeBox").classList.toggle("visible", overage > 0);
    $("#keepChangeBtn").classList.toggle("visible", overage > 0);
    $("#changeDue").textContent = money.format(overage);
    if (overage > 0 && !$("#changeGiven").value) setMoneyInput($("#changeGiven"), overage);
    if (!overage) $("#changeGiven").value = "";
    $("#checkoutSummary").textContent = `Pago: ${money.format(paidTotal())} | Restante: ${money.format(remainingTotal())}`;
    renderPaymentList();
    renderClientOptions();
  }

  function pixCheckoutAmount() {
    const modalInput = $("#pixModalAmountInput");
    if (!$("#pixModal").classList.contains("hidden") && modalInput.value.trim() !== "") return parseMoney(modalInput.value);
    if (document.activeElement === modalInput) return 0;
    return parseMoney($("#paymentAmount").value) || remainingTotal() || checkoutTotalRaw();
  }

  function renderPixModal() {
    const hint = $("#pixModalHint");
    const image = $("#pixModalQrImage");
    const copy = $("#pixModalCopyCode");
    const amount = pixCheckoutAmount();
    if ($("#pixModalAmountInput") && !$("#pixModalAmountInput").value && amount) setMoneyInput($("#pixModalAmountInput"), amount);
    if (!amount) {
      hint.textContent = "Selecione uma comanda para gerar o Pix.";
      copy.value = "";
      image.removeAttribute("src");
      return;
    }
    if (!state.pixKey) {
      hint.textContent = "Admin: configure a chave Pix em Configurações.";
      copy.value = "";
      image.removeAttribute("src");
      return;
    }
    const code = pixPayload(amount);
    copy.value = code;
    hint.textContent = "Mostre este QR Code para o cliente pagar no Pix.";
    image.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(code)}`;
  }

  function renderDebtPixBox() {
    const isPix = $("#debtPaymentMethod").value === "Pix";
    const box = $("#debtPixBox");
    const hint = $("#debtPixHint");
    const image = $("#debtPixQrImage");
    const copy = $("#debtPixCopyCode");
    const amount = parseMoney($("#debtPaymentAmount").value);
    box.classList.remove("visible");
    if (!isPix) return;
    $("#debtPixAmountLabel").textContent = money.format(amount);
    if (!amount) {
      hint.textContent = "Informe o valor recebido para gerar o Pix.";
      copy.value = "";
      image.removeAttribute("src");
      return;
    }
    if (!state.pixKey) {
      hint.textContent = "Admin: configure a chave Pix em Configurações.";
      copy.value = "";
      image.removeAttribute("src");
      return;
    }
    const code = pixPayload(amount);
    copy.value = code;
    hint.textContent = "Mostre este QR Code para o cliente pagar no Pix.";
    image.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(code)}`;
  }

  function openPixModal() {
    if ($("#paymentMethod").value !== "Pix") $("#paymentMethod").value = "Pix";
    setMoneyInput($("#pixModalAmountInput"), parseMoney($("#paymentAmount").value) || remainingTotal() || checkoutTotalRaw());
    renderPixModal();
    $("#pixModal").classList.remove("hidden");
    setTimeout(() => $("#pixModalAmountInput").select(), 0);
  }

  function closePixModal() {
    $("#pixModal").classList.add("hidden");
  }

  function renderDiscountButtons() {
    const hasFiado = $("#paymentMethod").value === "Fiado" || state.pendingPayments.some((p) => p.method === "Fiado");
    $("#discountRow").innerHTML = state.companies.map((company) => `
      <button class="discount-btn logo-discount ${company.name === state.activeDiscount || company.id === state.activeDiscount ? "active" : ""}" data-company="${company.id}" aria-label="Aplicar desconto ${company.name} de ${company.discount}%">
        ${company.logo ? `<img src="${company.logo}" alt="${company.name}" />` : `<strong>${company.name}</strong>`}
        <span>-${company.discount}%</span>
      </button>
    `).join("") + '<button class="ghost" id="removeDiscountBtn" type="button">Sem desconto</button>';
    $$("#discountRow .discount-btn").forEach((btn) => {
      btn.disabled = hasFiado;
      btn.title = hasFiado ? "Desconto de empresa não se aplica ao fiado." : "";
    });
  }

  function renderPaymentList() {
    const box = $("#paymentList");
    if (!state.pendingPayments.length) {
      box.innerHTML = '<div class="empty">Sem divisões adicionadas. Ao fechar, o sistema usa o valor restante automaticamente.</div>';
      return;
    }
    box.innerHTML = state.pendingPayments.map((payment) => `
      <div class="payment-chip">
        <span>${payment.method}</span>
        <strong>${money.format(payment.amount)}</strong>
        <button class="chip-x" data-payment="${payment.id}">×</button>
      </div>
    `).join("");
    box.querySelectorAll(".chip-x").forEach((btn) => btn.addEventListener("click", () => {
      state.pendingPayments = state.pendingPayments.filter((payment) => payment.id !== btn.dataset.payment);
      saveLocalState();
      render();
    }));
  }

  function renderClients() {
    const search = ($("#clientSearch").value || "").toLowerCase();
    const box = $("#clientList");
    const clients = state.clients
      .filter((client) => search ? true : clientBalance(client) > 0)
      .filter((client) => !search || `${client.name} ${client.phone}`.toLowerCase().includes(search))
      .sort((a, b) => a.name.localeCompare(b.name));
    box.innerHTML = clients.map((client) => `
      <button class="client-card ${client.id === state.selectedClientId ? "active" : ""}" data-client="${client.id}">
        <strong>${client.name}</strong>
        <span>${client.note || "Sem identificação"} | ${money.format(clientBalance(client))}</span>
      </button>
    `).join("") || '<div class="empty">Nenhum cliente encontrado.</div>';
    box.querySelectorAll(".client-card").forEach((btn) => btn.addEventListener("click", () => {
      state.selectedClientId = btn.dataset.client;
      saveLocalState();
      render();
    }));
  }

  function renderClientForm() {
    const modal = $("#clientFormModal");
    $("#clientForm").classList.toggle("editing", !!state.editingClientId);
    $("#clientForm").classList.remove("collapsed");
    if (modal) modal.classList.toggle("hidden", !state.showClientForm);
    if ($("#clientFormTitle")) $("#clientFormTitle").textContent = state.editingClientId ? "Editar cliente" : "Novo cliente";
    $("#newClientBtn").textContent = state.showClientForm ? "Cancelar" : "Novo cliente";
    $("#saveClientBtn").textContent = state.editingClientId ? "Salvar alterações" : "Salvar cliente";
  }

  function renderSelectedClient() {
    const client = state.clients.find((item) => item.id === state.selectedClientId);
    const modal = $("#clientDetailModal");
    if (modal) modal.classList.toggle("hidden", !client);
    $("#selectedClientTitle").textContent = client ? client.name : "Selecione um cliente";
    $("#clientBalance").textContent = `Saldo: ${money.format(client ? clientBalance(client) : 0)}`;
    $("#whatsappBtn").disabled = !client || !client.phone;
    $("#openDebtDetailBtn").disabled = !client;
    $("#editClientBtn").disabled = !client;
    const history = $("#debtHistory");
    if (!client) {
      history.innerHTML = '<div class="empty">Escolha um cliente para ver o histórico.</div>';
      return;
    }
    if (!client.entries.length) {
      history.innerHTML = '<div class="empty">Cliente sem movimentações.</div>';
      return;
    }
    history.innerHTML = client.entries.slice().reverse().map((entry) => {
      const label = entry.type === "debt" ? "Fiado lançado" : `Pagamento recebido (${entry.method})`;
      const isOpen = state.openDebtEntryIds.includes(entry.id);
      const detail = entry.orders ? entry.orders.map((order) => `
        <div class="history-detail">
          <strong>Comanda ${order.command} - ${formatDate(entry.date)}</strong>
          ${order.items.map((item) => `<div>${escapeHtml(item.name)} - ${money.format(item.price)}</div>`).join("")}
        </div>
      `).join("") : "";
      const reverseAction = isAdmin() && entry.type === "debt" && entry.saleId
        ? `<button class="warn small-action history-action" data-reverse-debt="${entry.id}" type="button">Estornar comanda</button>`
        : "";
      return `
        <details class="history-item" data-debt-entry="${entry.id}" ${isOpen ? "open" : ""}>
          <summary>${label}: ${money.format(entry.amount)}</summary>
          <span>${formatDate(entry.date)} ${entry.origin ? "| " + entry.origin : ""}</span>
          ${detail}
          ${reverseAction}
        </details>
      `;
    }).join("");
    history.querySelectorAll("[data-debt-entry]").forEach((details) => details.addEventListener("toggle", () => {
      const entryId = details.dataset.debtEntry;
      const ids = new Set(state.openDebtEntryIds);
      if (details.open) ids.add(entryId);
      else ids.delete(entryId);
      state.openDebtEntryIds = Array.from(ids);
      saveLocalState();
    }));
    history.querySelectorAll("[data-reverse-debt]").forEach((btn) => btn.addEventListener("click", () => {
      reverseClientOrderDebt(client.id, btn.dataset.reverseDebt);
    }));
  }

  function clientDebtWhatsappMessage(client) {
    return `Olá, ${client.name}. Tudo bem? Sua conta no Restaurante Estalagem está em ${money.format(clientBalance(client))}.`;
  }

  function selectedDebtDetailClient() {
    return state.clients.find((item) => item.id === state.selectedClientId);
  }

  function debtDetailRange() {
    const start = $("#debtDetailStart").value || daysAgoIso(7);
    const end = $("#debtDetailEnd").value || todayIso();
    return start <= end ? { start, end } : { start: end, end: start };
  }

  function debtDetailEntries(client, start, end) {
    return (client.entries || [])
      .filter((entry) => inRange(entry.date, start, end))
      .slice()
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }

  function debtDetailTotals(entries) {
    return entries.reduce((totals, entry) => {
      if (entry.type === "debt") totals.debt += Number(entry.amount || 0);
      if (entry.type === "payment") totals.paid += Number(entry.amount || 0);
      return totals;
    }, { debt: 0, paid: 0 });
  }

  function debtDetailTextLines(client, start, end) {
    const entries = debtDetailEntries(client, start, end);
    const totals = debtDetailTotals(entries);
    const lines = [
      "Restaurante Estalagem",
      `Detalhamento do fiado - ${client.name}`,
      `Periodo: ${formatDate(start)} ate ${formatDate(end)}`,
      ""
    ];

    if (!entries.length) {
      lines.push("Nenhuma movimentacao de fiado nesse periodo.");
    }

    entries.forEach((entry) => {
      if (entry.type === "payment") {
        lines.push(`${formatDate(entry.date)} - Pagamento recebido: ${money.format(entry.amount)} em ${entry.method}`);
        lines.push("");
        return;
      }
      lines.push(`${formatDate(entry.date)} - Fiado lancado: ${money.format(entry.amount)}`);
      if (entry.orders && entry.orders.length) {
        entry.orders.forEach((order) => {
          lines.push(`Comanda ${order.command}`);
          (order.items || []).forEach((item) => {
            lines.push(`- ${item.name}: ${money.format(item.price)}`);
          });
        });
      } else {
        lines.push("- Fiado antigo/sem detalhamento de comanda");
      }
      lines.push("");
    });

    lines.push(`Total fiado do periodo: ${money.format(totals.debt)}`);
    lines.push(`Total pago no periodo: ${money.format(totals.paid)}`);
    lines.push(`Saldo atual: ${money.format(clientBalance(client))}`);
    return lines;
  }

  function renderDebtDetailPreview() {
    const client = selectedDebtDetailClient();
    const preview = $("#debtDetailPreview");
    if (!client) {
      preview.innerHTML = '<div class="empty">Selecione um cliente.</div>';
      return;
    }
    const { start, end } = debtDetailRange();
    const entries = debtDetailEntries(client, start, end);
    const totals = debtDetailTotals(entries);
    $("#debtDetailClientName").textContent = `${client.name} | ${formatDate(start)} até ${formatDate(end)}`;
    const body = entries.map((entry) => {
      if (entry.type === "payment") {
        return `
          <div class="debt-detail-day">
            <h3>${formatDate(entry.date)} - Pagamento recebido</h3>
            <div class="debt-detail-line"><span>${escapeHtml(entry.method)}</span><strong>${money.format(entry.amount)}</strong></div>
          </div>
        `;
      }
      const orderBlocks = entry.orders && entry.orders.length
        ? entry.orders.map((order) => `
          <div>
            <strong>Comanda ${order.command}</strong>
            ${(order.items || []).map((item) => `
              <div class="debt-detail-line">
                <span>${escapeHtml(item.name)}</span>
                <strong>${money.format(item.price)}</strong>
              </div>
            `).join("")}
          </div>
        `).join("")
        : '<div class="debt-detail-line"><span>Fiado antigo/sem detalhamento de comanda</span><strong></strong></div>';
      return `
        <div class="debt-detail-day">
          <h3>${formatDate(entry.date)} - Fiado lançado: ${money.format(entry.amount)}</h3>
          ${orderBlocks}
        </div>
      `;
    }).join("");
    preview.innerHTML = `
      <div class="debt-detail-header">
        <strong>Restaurante Estalagem</strong>
        <span>${escapeHtml(client.name)}</span>
        <span>Período: ${formatDate(start)} até ${formatDate(end)}</span>
      </div>
      ${body || '<div class="empty">Nenhuma movimentação de fiado nesse período.</div>'}
      <div class="debt-detail-total">
        <div class="debt-detail-line"><span>Total fiado do período</span><strong>${money.format(totals.debt)}</strong></div>
        <div class="debt-detail-line"><span>Total pago no período</span><strong>${money.format(totals.paid)}</strong></div>
        <div class="debt-detail-line"><span>Saldo atual</span><strong>${money.format(clientBalance(client))}</strong></div>
      </div>
    `;
  }

  function openDebtDetailModal() {
    const client = selectedDebtDetailClient();
    if (!client) return alert("Selecione um cliente.");
    if (!$("#debtDetailStart").value) $("#debtDetailStart").value = daysAgoIso(7);
    if (!$("#debtDetailEnd").value) $("#debtDetailEnd").value = todayIso();
    renderDebtDetailPreview();
    $("#debtDetailModal").classList.remove("hidden");
  }

  function closeDebtDetailModal() {
    $("#debtDetailModal").classList.add("hidden");
  }

  function wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
    const words = String(text || "").split(" ");
    let line = "";
    words.forEach((word) => {
      const testLine = line ? `${line} ${word}` : word;
      if (context.measureText(testLine).width > maxWidth && line) {
        context.fillText(line, x, y);
        y += lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    });
    if (line) {
      context.fillText(line, x, y);
      y += lineHeight;
    }
    return y;
  }

  function downloadDebtDetailImage() {
    const client = selectedDebtDetailClient();
    if (!client) return;
    const { start, end } = debtDetailRange();
    const lines = debtDetailTextLines(client, start, end);
    const canvas = document.createElement("canvas");
    const width = 900;
    const padding = 48;
    const lineHeight = 28;
    const height = Math.max(620, padding * 2 + lines.length * lineHeight + 80);
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#2f6d2f";
    context.fillRect(0, 0, width, 96);
    context.fillStyle = "#ffffff";
    context.font = "700 30px Arial";
    context.fillText("Restaurante Estalagem", padding, 42);
    context.font = "600 18px Arial";
    context.fillText(`Detalhamento do fiado - ${client.name}`, padding, 72);
    context.fillStyle = "#182018";
    context.font = "16px Arial";
    let y = 128;
    lines.slice(2).forEach((line) => {
      const strong = line.startsWith("Total ") || line.startsWith("Saldo atual") || line.includes("Fiado lancado") || line.includes("Pagamento recebido");
      context.font = strong ? "700 17px Arial" : "16px Arial";
      context.fillStyle = strong ? "#182018" : "#4f5d50";
      y = wrapCanvasText(context, line, padding, y, width - padding * 2, lineHeight);
      if (!line) y += 8;
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `detalhamento-fiado-${client.name.replace(/\s+/g, "-").toLowerCase()}-${start}-${end}.png`;
    link.click();
  }

  function sendDebtDetailWhatsapp() {
    const client = selectedDebtDetailClient();
    if (!client || !client.phone) return alert("Cliente sem telefone cadastrado.");
    const { start, end } = debtDetailRange();
    const text = encodeURIComponent(`Olá, ${client.name}. Segue o detalhamento do fiado do período ${formatDate(start)} até ${formatDate(end)}. Saldo atual: ${money.format(clientBalance(client))}.`);
    window.open(`https://wa.me/55${client.phone}?text=${text}`, "_blank");
  }

  function scheduleTypeLabel(type) {
    return {
      debt: "Fiado de cliente",
      cash: "Resumo do caixa",
      accountant: "Relatório mensal"
    }[type] || "Tarefa";
  }

  function scheduleFrequencyLabel(schedule) {
    if (schedule.frequency === "daily") return `Todos os dias às ${schedule.time}`;
    if (schedule.frequency === "weekly") {
      const names = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
      return `Toda ${names[Number(schedule.weekday || 0)]} às ${schedule.time}`;
    }
    return `Todo dia ${schedule.monthDay || 1} às ${schedule.time}`;
  }

  function scheduleRange(schedule) {
    const today = todayIso();
    if (schedule.frequency === "daily") return { start: today, end: today };
    if (schedule.frequency === "weekly") return { start: daysAgoIso(6), end: today };
    const date = new Date();
    return { start: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`, end: today };
  }

  function monthLastDay(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function isScheduleDue(schedule, now = new Date()) {
    if (!schedule || schedule.active === false) return false;
    const today = todayIso();
    if (schedule.lastDoneDate === today) return false;
    if (schedule.frequency === "daily") return true;
    if (schedule.frequency === "weekly") return now.getDay() === Number(schedule.weekday || 0);
    const wantedDay = Math.min(Number(schedule.monthDay || 1), monthLastDay(now));
    return now.getDate() === wantedDay;
  }

  function scheduleClientName(schedule) {
    if (schedule.type !== "debt") return "";
    const client = state.clients.find((item) => item.id === schedule.clientId);
    return client ? client.name : "Cliente não encontrado";
  }

  function renderScheduleClientOptions() {
    const select = $("#scheduleClient");
    if (!select) return;
    const current = select.value;
    const clients = state.clients.slice().sort((a, b) => a.name.localeCompare(b.name));
    select.innerHTML = clients.map((client) => `<option value="${client.id}">${escapeHtml(client.name)}</option>`).join("") || '<option value="">Nenhum cliente cadastrado</option>';
    if (clients.some((client) => client.id === current)) select.value = current;
  }

  function renderScheduleFrequencyFields() {
    const type = $("#scheduleType").value;
    const frequency = $("#scheduleFrequency").value;
    $("#scheduleClient").style.display = type === "debt" ? "" : "none";
    $("#scheduleWeekday").style.display = frequency === "weekly" ? "" : "none";
    $("#scheduleMonthDay").style.display = frequency === "monthly" ? "" : "none";
  }

  function scheduleCard(schedule, due = false) {
    const clientName = scheduleClientName(schedule);
    return `
      <div class="schedule-card">
        <strong>${escapeHtml(schedule.name || scheduleTypeLabel(schedule.type))}</strong>
        <span>${scheduleTypeLabel(schedule.type)}${clientName ? " | " + escapeHtml(clientName) : ""}</span>
        <span>${scheduleFrequencyLabel(schedule)}${schedule.lastDoneDate ? " | feito em " + formatDate(schedule.lastDoneDate) : ""}</span>
        <div class="schedule-actions${due ? " due-actions" : ""}">
          <button class="secondary small-action" data-run-schedule="${schedule.id}" type="button">${due ? "Preparar agora" : "Preparar"}</button>
          <button class="primary small-action" data-done-schedule="${schedule.id}" type="button">Concluir hoje</button>
          ${due ? "" : `<button class="warn small-action" data-delete-schedule="${schedule.id}" type="button">Remover</button>`}
        </div>
      </div>
    `;
  }

  function bindScheduleActions(container) {
    container.querySelectorAll("[data-run-schedule]").forEach((btn) => btn.addEventListener("click", () => runSchedule(btn.dataset.runSchedule)));
    container.querySelectorAll("[data-done-schedule]").forEach((btn) => btn.addEventListener("click", () => completeSchedule(btn.dataset.doneSchedule)));
    container.querySelectorAll("[data-delete-schedule]").forEach((btn) => btn.addEventListener("click", () => deleteSchedule(btn.dataset.deleteSchedule)));
  }

  function renderAgenda() {
    if (!$("#scheduleList")) return;
    renderScheduleClientOptions();
    renderScheduleFrequencyFields();
    const dueSchedules = state.schedules.filter((schedule) => isScheduleDue(schedule));
    $("#scheduleDueCount").textContent = dueSchedules.length;
    $("#scheduleTotalCount").textContent = state.schedules.length;
    $("#scheduleDueList").innerHTML = dueSchedules.map((schedule) => scheduleCard(schedule, true)).join("") || '<div class="empty">Nenhuma tarefa pendente agora.</div>';
    $("#scheduleList").innerHTML = state.schedules.map((schedule) => scheduleCard(schedule)).join("") || '<div class="empty">Nenhuma tarefa programada.</div>';
    bindScheduleActions($("#scheduleDueList"));
    bindScheduleActions($("#scheduleList"));
  }

  function saveScheduleFromForm() {
    const type = $("#scheduleType").value;
    const frequency = $("#scheduleFrequency").value;
    const clientId = $("#scheduleClient").value;
    if (type === "debt" && !clientId) return alert("Selecione um cliente.");
    const name = $("#scheduleName").value.trim() || scheduleTypeLabel(type);
    state.schedules.push({
      id: id(),
      name,
      type,
      clientId: type === "debt" ? clientId : "",
      frequency,
      weekday: Number($("#scheduleWeekday").value || 5),
      monthDay: Math.max(1, Math.min(31, Number($("#scheduleMonthDay").value || 30))),
      time: $("#scheduleTime").value || "15:00",
      active: true,
      lastDoneDate: ""
    });
    $("#scheduleName").value = "";
    saveState();
    renderAgenda();
  }

  function runSchedule(scheduleId) {
    const schedule = state.schedules.find((item) => item.id === scheduleId);
    if (!schedule) return;
    if (schedule.type === "accountant") {
      generateAccountantPdf();
      return;
    }
    const { start, end } = scheduleRange(schedule);
    if (schedule.type === "debt") {
      const client = state.clients.find((item) => item.id === schedule.clientId);
      if (!client) return alert("Cliente não encontrado.");
      state.selectedClientId = client.id;
      $("#debtDetailStart").value = start;
      $("#debtDetailEnd").value = end;
      saveLocalState();
      render();
      openDebtDetailModal();
      return;
    }
    $("#reportStart").value = start;
    $("#reportEnd").value = end;
    renderReports();
    if (schedule.type === "cash") generateCashSummary();
  }

  function completeSchedule(scheduleId) {
    const schedule = state.schedules.find((item) => item.id === scheduleId);
    if (!schedule) return;
    schedule.lastDoneDate = todayIso();
    saveState();
    renderAgenda();
  }

  function deleteSchedule(scheduleId) {
    const schedule = state.schedules.find((item) => item.id === scheduleId);
    if (!schedule) return;
    if (!confirm(`Remover a tarefa "${schedule.name}"?`)) return;
    if (!state.removedScheduleIds.includes(schedule.id)) state.removedScheduleIds.push(schedule.id);
    state.schedules = state.schedules.filter((item) => item.id !== scheduleId);
    saveState();
    renderAgenda();
  }

  function reverseClientOrderDebt(clientId, entryId) {
    if (!isAdmin()) return;
    const client = state.clients.find((item) => item.id === clientId);
    const entry = client && client.entries.find((item) => item.id === entryId);
    if (!client || !entry || entry.type !== "debt") return;
    const commands = (entry.orders || []).map((order) => "Comanda " + order.command).join(", ");
    const ok = confirm(`Estornar ${money.format(entry.amount)} do cliente ${client.name}${commands ? " (" + commands + ")" : ""}?`);
    if (!ok) return;
    if (!state.cancelledClientEntryIds.includes(entry.id)) state.cancelledClientEntryIds.push(entry.id);
    if (entry.saleId && !state.cancelledSaleIds.includes(entry.saleId)) state.cancelledSaleIds.push(entry.saleId);
    client.entries = client.entries.filter((item) => item.id !== entry.id);
    if (entry.saleId) state.sales = state.sales.filter((sale) => sale.id !== entry.saleId);
    logAudit("client_order_debt_reversed", {
      clientId: client.id,
      clientName: client.name,
      entryId: entry.id,
      saleId: entry.saleId || null,
      amount: entry.amount,
      commands: (entry.orders || []).map((order) => order.command)
    });
    saveState({ clientsChanged: true, salesChanged: true });
    render();
  }

  function removeFiadoDebtForSale(saleId) {
    state.clients.forEach((client) => {
      (client.entries || []).forEach((entry) => {
        if (entry.saleId === saleId && !state.cancelledClientEntryIds.includes(entry.id)) {
          state.cancelledClientEntryIds.push(entry.id);
        }
      });
      client.entries = (client.entries || []).filter((entry) => entry.saleId !== saleId);
    });
  }

  function updateSalePaymentMethod(saleId, paymentId, method) {
    if (!isAdmin()) return;
    const sale = state.sales.find((item) => item.id === saleId);
    const payment = sale && sale.payments.find((item) => item.id === paymentId);
    if (!sale || !payment || !paymentMethods.includes(method)) return;
    const oldMethod = payment.method;
    if (oldMethod === method) return;
    if (oldMethod === "Fiado" || method === "Fiado") {
      alert("Para corrigir venda envolvendo Fiado, cancele ou reabra a venda e lance novamente com o cliente correto.");
      render();
      return;
    }
    payment.method = method;
    sale.correctedAt = new Date().toISOString();
    sale.correctedBy = currentAccess ? currentAccess.name : "Admin";
    logAudit("sale_payment_method_updated", {
      saleId: sale.id,
      paymentId: payment.id,
      from: oldMethod,
      to: method,
      amount: payment.amount
    });
    saveState({ salesChanged: true });
    render();
  }

  function cancelSale(saleId, reopen = false) {
    if (!isAdmin()) return;
    const sale = state.sales.find((item) => item.id === saleId);
    if (!sale) return;
    const commands = sale.orders.map((order) => "Comanda " + order.command).join(", ");
    const action = reopen ? "cancelar e reabrir" : "cancelar";
    const ok = confirm(`Deseja ${action} a venda de ${money.format(sale.total)} (${commands})?`);
    if (!ok) return;
    if (!state.cancelledSaleIds.includes(sale.id)) state.cancelledSaleIds.push(sale.id);
    removeFiadoDebtForSale(sale.id);
    state.sales = state.sales.filter((item) => item.id !== sale.id);
    if (reopen) {
      sale.orders.forEach((order) => {
        const hasOpenCommand = state.orders.some((entry) => entry.status === "open" && entry.command === order.command);
        if (hasOpenCommand) return;
        state.orders.push({
          id: id(),
          command: order.command,
          status: "open",
          items: cloneData(order.items || []),
          createdAt: new Date().toISOString(),
          reopenedFromSaleId: sale.id
        });
      });
    }
    logAudit(reopen ? "sale_cancelled_and_reopened" : "sale_cancelled", {
      saleId: sale.id,
      total: sale.total,
      commands: sale.orders.map((order) => order.command)
    });
    saveState({ clientsChanged: true, salesChanged: true });
    render();
  }

  function renderClientOptions() {
    const select = $("#checkoutClient");
    select.innerHTML = state.clients.map((client) => `<option value="${client.id}">${client.name} - ${money.format(clientBalance(client))}</option>`).join("");
    if (state.selectedCheckoutClientId && state.clients.some((client) => client.id === state.selectedCheckoutClientId)) {
      select.value = state.selectedCheckoutClientId;
    } else if (select.value) {
      state.selectedCheckoutClientId = select.value;
    }
  }

  function renderProducts() {
    const productList = $("#productList");
    if (productList && productList.contains(document.activeElement)) return;
    $("#commandMax").value = state.commandMax;
    setMoneyInput($("#buffetPrice"), state.buffetPrice);
    $("#pixKey").value = state.pixKey || "";
    productList.innerHTML = state.products.map((product, index) => `
      <div class="product-row ${state.productMoveSelected === product.id ? "move-selected" : ""}" draggable="true" data-product-row="${product.id}">
        <div class="drag-handle" title="Arrastar">☰</div>
        <div class="product-image-preview">
          ${product.image ? `<img src="${escapeHtml(product.image)}" alt="" />` : `<span>Imagem</span>`}
        </div>
        <div class="product-edit-fields">
          <input value="${escapeHtml(product.name)}" data-product-name="${product.id}" aria-label="Nome do produto" />
          <input value="${money.format(product.price)}" data-product-price="${product.id}" inputmode="numeric" aria-label="Valor do produto" />
          <select data-product-category="${product.id}" aria-label="Categoria do produto">
            ${Object.entries(productCategories).map(([value, label]) => `<option value="${value}" ${(product.category || inferProductCategory(product.name)) === value ? "selected" : ""}>${label}</option>`).join("")}
          </select>
          <input class="product-image-input" data-product-image="${product.id}" type="file" accept="image/*" aria-label="Imagem do produto" />
        </div>
        <button class="secondary small-action" data-product-save="${product.id}" type="button">Salvar</button>
        <button class="remove-item" data-product="${product.id}">×</button>
      </div>
    `).join("");
    productList.querySelectorAll("[data-product-price]").forEach((input) => {
      input.addEventListener("input", () => setMoneyInput(input, parseMoney(input.value)));
    });
    productList.querySelectorAll("[data-product-save]").forEach((btn) => btn.addEventListener("click", async () => {
      const product = state.products.find((item) => item.id === btn.dataset.productSave);
      if (!product) return;
      const nameInput = $(`[data-product-name="${product.id}"]`);
      const priceInput = $(`[data-product-price="${product.id}"]`);
      const categoryInput = $(`[data-product-category="${product.id}"]`);
      const imageInput = $(`[data-product-image="${product.id}"]`);
      const name = nameInput.value.trim();
      const price = parseMoney(priceInput.value);
      if (!name || !price) return alert("Informe nome e valor do produto.");
      product.name = name;
      product.price = price;
      product.category = categoryInput.value || inferProductCategory(name);
      if (imageInput && imageInput.files && imageInput.files[0]) {
        product.image = await fileToDataUrl(imageInput.files[0]);
      }
      await saveConfigState();
      btn.blur();
      render();
    }));
    productList.querySelectorAll("[data-product-row]").forEach((row) => {
      row.addEventListener("click", async (event) => {
        if (event.target.closest("button, input, select, label, .product-image-preview")) return;
        const clickedId = row.dataset.productRow;
        if (!state.productMoveSelected) {
          state.productMoveSelected = clickedId;
          saveLocalState();
          render();
          return;
        }
        if (state.productMoveSelected === clickedId) {
          state.productMoveSelected = null;
          saveLocalState();
          render();
          return;
        }
        const from = state.products.findIndex((product) => product.id === state.productMoveSelected);
        const to = state.products.findIndex((product) => product.id === clickedId);
        if (from >= 0 && to >= 0) {
          const [moved] = state.products.splice(from, 1);
          state.products.splice(to, 0, moved);
        }
        state.productMoveSelected = null;
        await saveConfigState();
        render();
      });
      row.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", row.dataset.productRow);
        row.classList.add("dragging");
      });
      row.addEventListener("dragend", () => row.classList.remove("dragging"));
      row.addEventListener("dragover", (event) => event.preventDefault());
      row.addEventListener("drop", async (event) => {
        event.preventDefault();
        const draggedId = event.dataTransfer.getData("text/plain");
        const targetId = row.dataset.productRow;
        if (!draggedId || draggedId === targetId) return;
        const from = state.products.findIndex((product) => product.id === draggedId);
        const to = state.products.findIndex((product) => product.id === targetId);
        if (from < 0 || to < 0) return;
        const [dragged] = state.products.splice(from, 1);
        state.products.splice(to, 0, dragged);
        await saveConfigState();
        render();
      });
    });
    productList.querySelectorAll(".remove-item").forEach((btn) => btn.addEventListener("click", async () => {
      state.products = state.products.filter((product) => product.id !== btn.dataset.product);
      await saveConfigState();
      btn.blur();
      render();
    }));
  }

  function renderCompanies() {
    $("#companyList").innerHTML = state.companies.map((company) => `
      <div class="company-row">
        <div class="company-logo-preview">
          ${company.logo ? `<img src="${company.logo}" alt="${company.name}" />` : `<span>Sem imagem</span>`}
        </div>
        <input value="${company.name}" data-company-name="${company.id}" aria-label="Nome da empresa" />
        <input value="${String(company.discount).replace(".", ",")}" data-company-discount="${company.id}" inputmode="decimal" aria-label="Desconto da empresa" />
        <label class="file-label small-file">
          Imagem
          <input type="file" accept="image/*" data-company-logo="${company.id}" />
        </label>
        <button class="remove-item" data-company-remove="${company.id}">×</button>
      </div>
    `).join("") || '<div class="empty">Nenhuma empresa cadastrada.</div>';
    $("#companyList").querySelectorAll("[data-company-name]").forEach((input) => input.addEventListener("change", async () => {
      const company = state.companies.find((item) => item.id === input.dataset.companyName);
      if (!company) return;
      const oldName = company.name;
      company.name = input.value.trim() || company.name;
      if (state.activeDiscount === oldName) state.activeDiscount = company.name;
      state.sales.forEach((sale) => {
        if (sale.discountCompany === oldName) sale.discountCompany = company.name;
      });
      await saveConfigState();
      render();
    }));
    $("#companyList").querySelectorAll("[data-company-discount]").forEach((input) => input.addEventListener("change", async () => {
      const company = state.companies.find((item) => item.id === input.dataset.companyDiscount);
      if (!company) return;
      company.discount = percentValue(input.value);
      await saveConfigState();
      render();
    }));
    $("#companyList").querySelectorAll("[data-company-logo]").forEach((input) => input.addEventListener("change", async () => {
      const company = state.companies.find((item) => item.id === input.dataset.companyLogo);
      if (!company || !input.files || !input.files[0]) return;
      company.logo = await readImageFile(input.files[0]);
      await saveConfigState();
      render();
    }));
    $("#companyList").querySelectorAll("[data-company-remove]").forEach((btn) => btn.addEventListener("click", async () => {
      const company = state.companies.find((item) => item.id === btn.dataset.companyRemove);
      state.companies = state.companies.filter((item) => item.id !== btn.dataset.companyRemove);
      if (company && (state.activeDiscount === company.name || state.activeDiscount === company.id)) state.activeDiscount = null;
      await saveConfigState();
      render();
    }));
  }

  function reportRange() {
    const start = $("#reportStart").value || todayIso();
    const end = $("#reportEnd").value || start;
    return { start, end };
  }

  function reportCashStart(start = reportRange().start) {
    const byDate = state.cashStartByDate || {};
    return Number(byDate[start] || 0);
  }

  function setReportCashStart(value, start = reportRange().start) {
    state.cashStartByDate = state.cashStartByDate || {};
    state.cashStartByDate[start] = Number(value || 0);
    state.cashStart = state.cashStartByDate[start];
  }

  function inRange(date, start, end) {
    const normalized = normalizeDateIso(date);
    return normalized >= start && normalized <= end;
  }

  function salesInReportRange() {
    const { start, end } = reportRange();
    return state.sales.filter((sale) => inRange(sale.date || sale.createdAt, start, end));
  }

  function debtPaymentsInReportRange(start, end) {
    return state.clients.flatMap((client) => (
      (client.entries || [])
        .filter((entry) => entry.type === "payment" && inRange(entry.date, start, end))
        .map((entry) => ({ ...entry, client, source: "debt-payment" }))
    ));
  }

  function receivedPaymentsInReportRange(sales, start, end) {
    const salePayments = sales.flatMap((sale) => (
      sale.payments.map((payment) => ({ ...payment, sale, source: "sale" }))
    ));
    return salePayments.concat(debtPaymentsInReportRange(start, end));
  }

  function reportSummary(sales = salesInReportRange()) {
    const { start, end } = reportRange();
    const payments = receivedPaymentsInReportRange(sales, start, end);
    const byMethod = (method) => payments.filter((payment) => payment.method === method).reduce((sum, payment) => sum + payment.amount, 0);
    const cashReceived = byMethod("Dinheiro");
    const changeGiven = sales.reduce((sum, sale) => sum + (sale.change || 0), 0);
    const cashDrawer = cashReceived - changeGiven;
    const cashStart = reportCashStart(start);
    const cashFinal = cashStart + cashDrawer;
    return {
      totalSold: sales.reduce((sum, sale) => sum + sale.total, 0),
      dinheiro: cashDrawer,
      pix: byMethod("Pix"),
      debito: byMethod("Débito"),
      credito: byMethod("Crédito"),
      voucher: byMethod("Voucher refeição"),
      cashStart,
      cashReceived,
      cashDrawer,
      changeGiven,
      cashFinal
    };
  }

  function pdfText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\u00a0/g, " ");
  }

  function pdfEscape(value) {
    return pdfText(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  function pdfLine(text, x, y, size = 12, font = "F1") {
    return `0 0 0 rg 0 0 0 RG BT /${font} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${pdfEscape(text)}) Tj ET\n`;
  }

  function downloadPdfReport(filename, title, subtitle, rows, extraLine = "") {
    const safeRows = rows.map((row) => [pdfText(row[0]), pdfText(row[1])]);
    let stream = "";
    const titleY = title === "Restaurante Estalagem" ? 782 : 764;
    if (title !== "Restaurante Estalagem") stream += pdfLine("Restaurante Estalagem", 48, 792, 11);
    stream += pdfLine(title, 48, titleY, 20, "F2");
    stream += pdfLine(subtitle, 48, titleY - 24, 11);
    if (extraLine) stream += pdfLine(extraLine, 48, titleY - 42, 11, "F2");
    stream += "0.93 0.96 0.91 rg 44 690 507 28 re f\n";
    stream += pdfLine("Descricao", 58, 700, 11, "F2");
    stream += pdfLine("Valor", 430, 700, 11, "F2");
    let y = 662;
    safeRows.forEach((row, index) => {
      if (index === safeRows.length - 1) stream += "0.97 0.98 0.96 rg 44 " + (y - 8) + " 507 26 re f\n";
      stream += pdfLine(row[0], 58, y, 12, index === safeRows.length - 1 ? "F2" : "F1");
      stream += pdfLine(row[1], 430, y, 12, index === safeRows.length - 1 ? "F2" : "F1");
      y -= 30;
    });
    stream += pdfLine(`Gerado em ${fullDateFmt.format(new Date())}`, 48, 48, 9);

    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
      "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
      `<< /Length ${stream.length} >>\nstream\n${stream}endstream`
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function eachDateInRange(start, end) {
    const dates = [];
    const [startYear, startMonth, startDay] = start.split("-").map(Number);
    const [endYear, endMonth, endDay] = end.split("-").map(Number);
    const current = new Date(startYear, startMonth - 1, startDay);
    const last = new Date(endYear, endMonth - 1, endDay);
    while (current <= last) {
      dates.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  function paymentDate(payment) {
    return payment.sale ? payment.sale.date : payment.date;
  }

  function accountantDayTotals(payments, date) {
    const byMethod = (method) => payments
      .filter((payment) => paymentDate(payment) === date && payment.method === method)
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const debito = byMethod("Débito");
    const credito = byMethod("Crédito");
    const voucher = byMethod("Voucher refeição");
    return { debito, credito, voucher, total: debito + credito + voucher };
  }

  function addTotals(first, second) {
    first.debito += second.debito;
    first.credito += second.credito;
    first.voucher += second.voucher;
    first.total += second.total;
    return first;
  }

  function accountantPdfRows(start, end) {
    const sales = state.sales.filter((sale) => inRange(sale.date, start, end));
    const payments = receivedPaymentsInReportRange(sales, start, end)
      .filter((payment) => ["Débito", "Crédito", "Voucher refeição"].includes(payment.method));
    const rows = [];
    let week = { debito: 0, credito: 0, voucher: 0, total: 0 };
    let total = { debito: 0, credito: 0, voucher: 0, total: 0 };
    eachDateInRange(start, end).forEach((date, index, dates) => {
      const day = accountantDayTotals(payments, date);
      if (day.total > 0) rows.push({ label: formatDate(date), ...day, kind: "day" });
      addTotals(week, day);
      addTotals(total, day);
      const closesWeek = (index + 1) % 7 === 0;
      const isLast = index === dates.length - 1;
      if (closesWeek || isLast) {
        if (week.total > 0) rows.push({ label: `Subtotal semana ${Math.floor(index / 7) + 1}`, ...week, kind: "week" });
        week = { debito: 0, credito: 0, voucher: 0, total: 0 };
      }
    });
    rows.push({ label: "Total do período", ...total, kind: "total" });
    return rows;
  }

  function downloadAccountantPdf(filename, start, end, rows) {
    const columnX = { date: 48, debito: 194, credito: 284, voucher: 374, total: 478 };
    const pages = [];
    let stream = "";
    let y = 788;
    const newPage = () => {
      if (stream) pages.push(stream + pdfLine(`Gerado em ${fullDateFmt.format(new Date())}`, 48, 42, 8));
      stream = "";
      y = 788;
      stream += pdfLine("Restaurante Estalagem", 48, y, 18, "F2");
      y -= 22;
      stream += pdfLine(`Periodo de vendas: ${formatDate(start)} ate ${formatDate(end)}`, 48, y, 10);
      y -= 18;
      stream += pdfLine("Maquina Cielo", 48, y, 10, "F2");
      y -= 30;
      stream += "0.93 0.96 0.91 rg 44 " + (y - 8) + " 507 24 re f\n";
      stream += pdfLine("Dia", columnX.date, y, 9, "F2");
      stream += pdfLine("Debito", columnX.debito, y, 9, "F2");
      stream += pdfLine("Credito", columnX.credito, y, 9, "F2");
      stream += pdfLine("Voucher", columnX.voucher, y, 9, "F2");
      stream += pdfLine("Total", columnX.total, y, 9, "F2");
      y -= 24;
    };
    newPage();
    rows.forEach((row) => {
      if (y < 72) newPage();
      if (row.kind === "week") stream += "0.97 0.98 0.96 rg 44 " + (y - 7) + " 507 22 re f\n";
      if (row.kind === "total") stream += "0.90 0.95 0.88 rg 44 " + (y - 7) + " 507 24 re f\n";
      const font = row.kind === "day" ? "F1" : "F2";
      const size = row.kind === "total" ? 8.5 : 9;
      stream += pdfLine(row.label, columnX.date, y, size, font);
      stream += pdfLine(money.format(row.debito), columnX.debito, y, size, font);
      stream += pdfLine(money.format(row.credito), columnX.credito, y, size, font);
      stream += pdfLine(money.format(row.voucher), columnX.voucher, y, size, font);
      stream += pdfLine(money.format(row.total), columnX.total, y, size, font);
      y -= row.kind === "day" ? 19 : 23;
    });
    pages.push(stream + pdfLine(`Gerado em ${fullDateFmt.format(new Date())}`, 48, 42, 8));

    const objects = [
      "<< /Type /Catalog /Pages 2 0 R >>",
      "",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"
    ];
    const pageIds = [];
    pages.forEach((pageStream) => {
      const pageId = objects.length + 1;
      const contentId = objects.length + 2;
      pageIds.push(pageId);
      objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
      objects.push(`<< /Length ${pageStream.length} >>\nstream\n${pageStream}endstream`);
    });
    objects[1] = `<< /Type /Pages /Kids [${pageIds.map((pageId) => `${pageId} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const blob = new Blob([pdf], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function generateAccountantPdf() {
    const { start, end } = reportRange();
    await fetchRemoteReportData(start, end);
    downloadAccountantPdf(`relatorio-mensal-${start}-${end}.pdf`, start, end, accountantPdfRows(start, end));
  }

  async function refreshReportPeriod() {
    const { start, end } = reportRange();
    await fetchRemoteReportData(start, end);
    renderReports();
    renderRemovalReport(reportRemovals());
  }

  async function generateCashSummary() {
    const { start, end } = reportRange();
    await fetchRemoteReportData(start, end);
    const summary = reportSummary();
    const summaryTotal = summary.dinheiro + summary.pix + summary.debito + summary.credito + summary.voucher;
    const rows = [
      ["Dinheiro", money.format(summary.dinheiro)],
      ["Pix", money.format(summary.pix)],
      ["Débito", money.format(summary.debito)],
      ["Crédito", money.format(summary.credito)],
      ["Voucher refeição", money.format(summary.voucher)],
      ["Total", money.format(summaryTotal)]
    ];
    $("#cashSummaryModalPeriod").textContent = `Período: ${formatDate(start)} até ${formatDate(end)}`;
    $("#cashSummaryModalBody").innerHTML = rows.map((row, index) => `
      <div class="summary-row${index === rows.length - 1 ? " total" : ""}">
        <span>${row[0]}</span>
        <strong>${row[1]}</strong>
      </div>
    `).join("");
    $("#cashSummaryModal").classList.remove("hidden");
  }

  function renderReports() {
    const { start, end } = reportRange();
    const sales = salesInReportRange();
    const payments = receivedPaymentsInReportRange(sales, start, end);
    const salePayments = sales.flatMap((sale) => sale.payments.map((payment) => ({ ...payment, sale })));
    const byMethod = (method) => payments.filter((payment) => payment.method === method).reduce((sum, payment) => sum + payment.amount, 0);
    const bySaleMethod = (method) => salePayments.filter((payment) => payment.method === method).reduce((sum, payment) => sum + payment.amount, 0);
    const pendingDebt = state.clients.reduce((sum, client) => sum + Math.max(0, clientBalance(client)), 0);
    const cashReceived = byMethod("Dinheiro");
    const changeGiven = sales.reduce((sum, sale) => sum + (sale.change || 0), 0);
    const cashDrawer = cashReceived - changeGiven;
    const cashStart = reportCashStart(start);
    const cashFinal = cashStart + cashDrawer;
    const totalDiscounts = sales.reduce((sum, sale) => sum + sale.discount, 0);
    const forgiven = sales.reduce((sum, sale) => sum + (sale.forgiven || 0), 0);
    const keptChange = sales.reduce((sum, sale) => sum + (sale.keptChange || 0), 0);
    $("#cashStartDisplay").textContent = money.format(cashStart);
    if (document.activeElement !== $("#cashStart")) setMoneyInput($("#cashStart"), cashStart);
    const cards = [
      ["Vendas fechadas", sales.length],
      ["Total vendido", money.format(sales.reduce((sum, sale) => sum + sale.total, 0))],
      ["Dinheiro", money.format(cashDrawer)],
      ["Pix", money.format(byMethod("Pix"))],
      ["Débito", money.format(byMethod("Débito"))],
      ["Crédito", money.format(byMethod("Crédito"))],
      ["Voucher refeição", money.format(byMethod("Voucher refeição"))],
      ["Fiado lançado", money.format(bySaleMethod("Fiado"))],
      ["Fiado pendente", money.format(pendingDebt)],
      ["Caixa inicial", money.format(cashStart)],
      ["Caixa final", money.format(cashFinal)],
      ["Troco deixado", money.format(keptChange)],
      ["Diferença abonada", money.format(forgiven)],
      ["Descontos empresas", money.format(totalDiscounts)],
      ...state.companies.map((company) => ({
        label: `Clientes ${company.name}`,
        value: sales.filter((sale) => sale.discountCompany === company.name).length,
        company: company.name
      }))
    ];
    $("#reportCards").innerHTML = cards.map((card) => {
      const label = Array.isArray(card) ? card[0] : card.label;
      const value = Array.isArray(card) ? card[1] : card.value;
      const company = Array.isArray(card) ? "" : card.company;
      if (!company) return `<div class="metric-card"><span>${label}</span><strong>${value}</strong></div>`;
      const active = state.selectedReportCompany === company ? " active" : "";
      return `<button class="metric-card metric-button${active}" data-report-company="${company}"><span>${label}</span><strong>${value}</strong></button>`;
    }).join("");
    $("#reportCards").querySelectorAll("[data-report-company]").forEach((card) => card.addEventListener("click", () => {
      state.selectedReportCompany = state.selectedReportCompany === card.dataset.reportCompany ? null : card.dataset.reportCompany;
      renderCompanyReport(sales);
      $("#reportCards").querySelectorAll("[data-report-company]").forEach((item) => {
        item.classList.toggle("active", item.dataset.reportCompany === state.selectedReportCompany);
      });
    }));
    renderCompanyReport(sales);
    const activeSalesFilter = salesPaymentFilters.includes(state.selectedSalesPaymentFilter) ? state.selectedSalesPaymentFilter : "Todos";
    state.selectedSalesPaymentFilter = activeSalesFilter;
    const salesForFilter = activeSalesFilter === "Todos"
      ? sales
      : sales.filter((sale) => sale.payments.some((payment) => payment.method === activeSalesFilter));
    const tabButtons = salesPaymentFilters.map((method) => {
      const count = method === "Todos"
        ? sales.length
        : sales.filter((sale) => sale.payments.some((payment) => payment.method === method)).length;
      const active = method === activeSalesFilter ? " active" : "";
      return `<button class="sales-tab${active}" data-sales-payment-filter="${method}" type="button"><span>${method}</span><strong>${count}</strong></button>`;
    }).join("");
    const saleRows = salesForFilter.slice().reverse().map((sale) => `
      <div class="sale-row">
        <div class="sale-row-main">
          <strong>${formatDate(sale.date)} - ${money.format(sale.total)}</strong>
          <span>${sale.orders.map((order) => "Comanda " + order.command).join(", ")}</span>
        </div>
        <span class="sale-payment-line">${sale.payments.map((payment) => `${payment.method} ${money.format(payment.amount)}`).join(" + ")}${sale.change ? " | Troco " + money.format(sale.change) : ""}${sale.keptChange ? " | Troco deixado " + money.format(sale.keptChange) : ""}${sale.discountCompany ? " | " + sale.discountCompany : ""}</span>
        ${isAdmin() ? `
          <details class="sale-admin-tools">
            <summary>Corrigir venda</summary>
            <div class="admin-sale-actions">
              ${sale.payments.map((payment) => `
                <label>
                  <span>${money.format(payment.amount)}</span>
                  <select data-sale-payment="${sale.id}" data-payment-id="${payment.id}">
                    ${paymentMethodOptions(payment.method)}
                  </select>
                </label>
              `).join("")}
              <button class="warn small-action" data-cancel-sale="${sale.id}" type="button">Cancelar venda</button>
              <button class="secondary small-action" data-reopen-sale="${sale.id}" type="button">Cancelar e reabrir</button>
            </div>
          </details>
        ` : ""}
      </div>
    `).join("");
    $("#salesTable").innerHTML = `
      <div class="sales-tabs">${tabButtons}</div>
      <div class="sales-list">${saleRows || '<div class="empty">Nenhuma venda nesse período.</div>'}</div>
    `;
    $("#salesTable").querySelectorAll("[data-sales-payment-filter]").forEach((btn) => btn.addEventListener("click", () => {
      state.selectedSalesPaymentFilter = btn.dataset.salesPaymentFilter;
      renderReports();
    }));
    $("#salesTable").querySelectorAll("[data-sale-payment]").forEach((select) => select.addEventListener("change", () => {
      updateSalePaymentMethod(select.dataset.salePayment, select.dataset.paymentId, select.value);
    }));
    $("#salesTable").querySelectorAll("[data-cancel-sale]").forEach((btn) => btn.addEventListener("click", () => {
      cancelSale(btn.dataset.cancelSale, false);
    }));
    $("#salesTable").querySelectorAll("[data-reopen-sale]").forEach((btn) => btn.addEventListener("click", () => {
      cancelSale(btn.dataset.reopenSale, true);
    }));
  }

  function renderRemovalReport(removals) {
    if (!$("#removalTable")) return;
    $("#removalTable").innerHTML = removals.slice().reverse().map((entry) => `
      <div class="sale-row removal-row">
        <strong>${formatDate(entry.date)} - Comanda ${entry.command} - ${money.format(entry.itemPrice)}</strong>
        <span>${entry.itemName} | Removido por ${entry.userName || "usuário"} | Motivo: ${entry.reason}</span>
      </div>
    `).join("") || '<div class="empty">Nenhum item removido nesse período.</div>';
  }

  function renderCompanyReport(sales) {
    const box = $("#companyReportDetail");
    if (!box) return;
    if (!state.selectedReportCompany) {
      box.innerHTML = '<div class="empty">Clique em uma empresa nos cards acima para ver o detalhamento.</div>';
      return;
    }
    const companySales = sales.filter((sale) => sale.discountCompany === state.selectedReportCompany);
    if (!companySales.length) {
      box.innerHTML = `<div class="empty">Nenhuma venda com desconto ${state.selectedReportCompany} nesse período.</div>`;
      return;
    }
    const subtotal = companySales.reduce((sum, sale) => sum + sale.subtotal, 0);
    const discount = companySales.reduce((sum, sale) => sum + sale.discount, 0);
    const total = companySales.reduce((sum, sale) => sum + sale.total, 0);
    box.innerHTML = `
      <div class="company-report-summary">
        <div><span>Empresa</span><strong>${state.selectedReportCompany}</strong></div>
        <div><span>Clientes</span><strong>${companySales.length}</strong></div>
        <div><span>Sem desconto</span><strong>${money.format(subtotal)}</strong></div>
        <div><span>Desconto aplicado</span><strong>${money.format(discount)}</strong></div>
        <div><span>Valor real pago</span><strong>${money.format(total)}</strong></div>
      </div>
      <div class="sales-table">
        ${companySales.slice().reverse().map((sale) => `
          <div class="sale-row">
            <strong>${formatDate(sale.date)} - ${money.format(sale.total)}</strong>
            <span>Sem desconto: ${money.format(sale.subtotal)} | Desconto: ${money.format(sale.discount)} | ${sale.orders.map((order) => "Comanda " + order.command).join(", ")}</span>
          </div>
        `).join("")}
      </div>
    `;
  }

  function reportRemovals() {
    const { start, end } = reportRange();
    return (state.itemRemovals || []).filter((entry) => inRange(entry.date, start, end));
  }

  function renderSafely(name, callback) {
    try {
      callback();
    } catch (error) {
      console.error(`Falha ao atualizar ${name}`, error);
    }
  }

  function render() {
    normalizeRuntimeState(state);
    renderSafely("topo", renderTopbar);
    renderSafely("segurança", renderSecurity);
    renderSafely("botão à vontade", renderBuffetButton);
    renderSafely("comandas", renderCommands);
    renderSafely("produtos da balança", renderFrontProducts);
    renderSafely("prévia da balança", renderBalancePreview);
    renderSafely("comanda destacada", renderCommandFocusModal);
    renderSafely("comandas do caixa", renderOpenOrders);
    renderSafely("editor de comanda", renderOrderEditor);
    renderSafely("caixa", renderCheckout);
    renderSafely("clientes", renderClients);
    renderSafely("formulário de cliente", renderClientForm);
    renderSafely("histórico do cliente", renderSelectedClient);
    renderSafely("pix do fiado", renderDebtPixBox);
    renderSafely("produtos", renderProducts);
    renderSafely("empresas", renderCompanies);
    renderSafely("relatórios", renderReports);
    renderSafely("auditoria", () => renderRemovalReport(reportRemovals()));
    renderSafely("modal de remoção", renderRemovalModal);
  }

  function bindEvents() {
    if (!$("#clientFormModal")) {
      const clientForm = $("#clientForm");
      const modal = document.createElement("div");
      const card = document.createElement("div");
      const title = document.createElement("h2");
      modal.className = "modal hidden";
      modal.id = "clientFormModal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "clientFormTitle");
      card.className = "modal-card";
      title.id = "clientFormTitle";
      title.textContent = "Novo cliente";
      card.appendChild(title);
      card.appendChild(clientForm);
      modal.appendChild(card);
      document.body.appendChild(modal);
    }

    if (!$("#cancelClientBtn")) {
      const cancelClient = document.createElement("button");
      cancelClient.className = "secondary";
      cancelClient.id = "cancelClientBtn";
      cancelClient.type = "button";
      cancelClient.textContent = "Cancelar";
      $("#clientForm").appendChild(cancelClient);
    }

    $$(".tab").forEach((tab) => tab.addEventListener("click", () => {
      if (!canAccess(tab.dataset.view)) return;
      activateView(tab.dataset.view);
      if (tab.dataset.view === "relatorios") refreshReportPeriod();
    }));

    $("#cancelRemovalBtn").addEventListener("click", () => {
      state.pendingRemoval = null;
      renderRemovalModal();
    });

    $("#confirmRemovalBtn").addEventListener("click", () => {
      const reason = $("#removalReason").value.trim();
      if (!reason) {
        $("#removalError").textContent = "Informe o motivo da remoção.";
        return;
      }
      const pending = state.pendingRemoval;
      const order = pending ? state.orders.find((entry) => entry.id === pending.orderId) : null;
      if (!pending || !order) {
        state.pendingRemoval = null;
        renderRemovalModal();
        return;
      }
      state.pendingRemoval = null;
      $("#removalError").textContent = "";
      removeOrderItem(order, pending.itemId, "caixa", reason);
    });

    $("#closeCommandFocusBtn").addEventListener("click", () => {
      state.showCommandFocus = false;
      saveLocalState();
      renderCommandFocusModal();
    });
    $("#commandFocusModal").addEventListener("click", (event) => {
      if (event.target.id !== "commandFocusModal") return;
      state.showCommandFocus = false;
      saveLocalState();
      renderCommandFocusModal();
    });
    $("#closePixModalBtn").addEventListener("click", closePixModal);
    $("#pixModal").addEventListener("click", (event) => {
      if (event.target.id === "pixModal") closePixModal();
    });
    $("#copyPixModalBtn").addEventListener("click", async () => {
      const code = $("#pixModalCopyCode").value;
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        $("#pixModalHint").textContent = "Código Pix copiado.";
      } catch {
        $("#pixModalCopyCode").select();
        $("#pixModalHint").textContent = "Selecionei o código. Copie manualmente.";
      }
    });

    $("#loginBtn").addEventListener("click", async () => {
      if (!canTryLogin()) return;
      if (!supabaseClient) {
        $("#authError").textContent = "Supabase não carregou. Verifique a internet, aguarde alguns segundos e recarregue a página.";
        return;
      }
      const email = $("#loginEmail").value.trim();
      const password = $("#loginPassword").value;
      if (!email || !password) {
        $("#authError").textContent = "Informe e-mail e senha.";
        return;
      }
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error || !data.user) {
        registerFailedLogin();
        return;
      }
      const profile = await loadSupabaseProfile(data.user.id);
      if (!profile) {
        await supabaseClient.auth.signOut();
        registerFailedLogin();
        return;
      }
      clearLoginGuard();
      $("#authError").textContent = "";
      $("#loginEmail").value = "";
      $("#loginPassword").value = "";
      saveSession(profile);
      await loadRemoteState();
      subscribeRemoteState();
      startRemotePolling();
      activateView(firstAllowedView());
      render();
      await logAudit("login", { role: profile.role });
    });

    $("#loginPassword").addEventListener("keydown", (event) => {
      if (event.key === "Enter") $("#loginBtn").click();
    });

    $("#logoutBtn").addEventListener("click", async () => {
      if (supabaseClient) {
        await logAudit("logout", { role: currentAccess && currentAccess.role });
        await supabaseClient.auth.signOut();
        if (remoteChannel) {
          await supabaseClient.removeChannel(remoteChannel);
          remoteChannel = null;
        }
        stopRemotePolling();
        remoteLoaded = false;
      }
      saveSession(null);
      render();
    });

    ["#scaleValue", "#paymentAmount", "#manualDiscountAmount", "#debtPaymentAmount", "#productPrice", "#cashStart", "#changeGiven", "#buffetPrice", "#pixModalAmountInput"].forEach(wireMoneyInput);

    $("#addMealBtn").addEventListener("click", () => {
      const value = parseMoney($("#scaleValue").value);
      if (!value) return alert("Informe o valor que apareceu na balança.");
      addItemToSelected("Refeição por peso", value);
      $("#scaleValue").value = "";
    });

    $("#addBuffetBtn").addEventListener("click", () => addItemToSelected("Refeição à vontade", state.buffetPrice));

    $$(".number-pad button").forEach((btn) => btn.addEventListener("click", () => {
      const input = $("#scaleValue");
      const key = btn.dataset.key;
      let digits = input.value.replace(/\D/g, "");
      if (key === "clear") digits = "";
      if (key === "back") digits = digits.slice(0, -1);
      if (/^\d$/.test(key)) digits += key;
      input.value = digits ? money.format(Number(digits) / 100) : "";
    }));

    $("#clearSelectionBtn").addEventListener("click", () => {
      state.selectedOrders = [];
      state.pendingPayments = [];
      state.activeDiscount = null;
      state.manualDiscount = 0;
      saveLocalState();
      render();
    });

    $("#discountRow").addEventListener("click", (event) => {
      const remove = event.target.closest("#removeDiscountBtn");
      const discount = event.target.closest(".discount-btn");
      if (remove) {
        state.activeDiscount = null;
        state.manualDiscount = 0;
        $("#manualDiscountAmount").value = "";
        state.pendingPayments = [];
        saveLocalState();
        render();
        return;
      }
      if (!discount) return;
      if ($("#paymentMethod").value === "Fiado" || state.pendingPayments.some((p) => p.method === "Fiado")) return;
      const company = state.companies.find((item) => item.id === discount.dataset.company);
      state.activeDiscount = company ? company.name : null;
      state.pendingPayments = [];
      saveLocalState();
      render();
    });

    $("#applyManualDiscountBtn").addEventListener("click", () => {
      const subtotal = selectedOrders().reduce((sum, order) => sum + orderTotal(order), 0);
      const amount = parseMoney($("#manualDiscountAmount").value);
      if (!selectedOrders().length) return alert("Selecione uma comanda.");
      if (!amount) return alert("Informe o valor do desconto.");
      state.manualDiscount = Math.min(amount, subtotal);
      state.pendingPayments = [];
      saveLocalState();
      render();
    });

    $("#clearManualDiscountBtn").addEventListener("click", () => {
      state.manualDiscount = 0;
      $("#manualDiscountAmount").value = "";
      state.pendingPayments = [];
      saveLocalState();
      render();
    });

    $("#paymentMethod").addEventListener("change", () => {
      if ($("#paymentMethod").value === "Fiado") state.activeDiscount = null;
      renderCheckout();
      if ($("#paymentMethod").value === "Pix") openPixModal();
    });

    $("#checkoutClient").addEventListener("change", () => {
      state.selectedCheckoutClientId = $("#checkoutClient").value;
      saveLocalState();
      renderClientOptions();
    });

    $("#pixModalAmountInput").addEventListener("input", renderPixModal);

    $("#debtPaymentMethod").addEventListener("change", renderDebtPixBox);
    $("#debtPaymentAmount").addEventListener("input", renderDebtPixBox);

    $("#copyDebtPixBtn").addEventListener("click", async () => {
      const code = $("#debtPixCopyCode").value;
      if (!code) return;
      try {
        await navigator.clipboard.writeText(code);
        $("#debtPixHint").textContent = "Código Pix copiado.";
      } catch {
        $("#debtPixCopyCode").select();
        $("#debtPixHint").textContent = "Selecionei o código. Copie manualmente.";
      }
    });

    $("#addPaymentBtn").addEventListener("click", () => {
      const amount = parseMoney($("#paymentAmount").value) || remainingTotal();
      if (!selectedOrders().length) return alert("Selecione uma comanda.");
      if (!amount) return alert("Não há valor restante para adicionar.");
      if ($("#paymentMethod").value === "Fiado") state.activeDiscount = null;
      state.pendingPayments.push({ id: id(), method: $("#paymentMethod").value, amount });
      $("#paymentAmount").value = "";
      saveLocalState();
      render();
    });

    $("#closePaymentBtn").addEventListener("click", () => {
      if (!selectedOrders().length) return alert("Selecione uma comanda.");
      if (!state.pendingPayments.length) {
        const method = $("#paymentMethod").value;
        state.pendingPayments.push({ id: id(), method, amount: checkoutTotalRaw() });
      }
      if (paidTotal() < checkoutTotalRaw()) return alert("Ainda existe valor restante. Adicione outra forma ou abone a diferença.");
      closeSelectedOrders({ changeGiven: changeGivenValue() });
    });

    $("#forgiveDiffBtn").addEventListener("click", () => {
      const rest = remainingTotal();
      if (!rest) return;
      closeSelectedOrders({ forgiven: rest, changeGiven: changeGivenValue() });
    });

    $("#keepChangeBtn").addEventListener("click", () => {
      if (!selectedOrders().length) return alert("Selecione uma comanda.");
      if (!state.pendingPayments.length) return alert("Adicione o pagamento recebido primeiro.");
      const keptChange = keptChangeValue(0);
      if (!keptChange) return;
      closeSelectedOrders({ changeGiven: 0, keptChange });
    });

    $("#saveClientBtn").addEventListener("click", () => {
      const name = $("#clientName").value.trim();
      if (!name) return alert("Informe o nome do cliente.");
      const editing = state.clients.find((item) => item.id === state.editingClientId);
      const client = editing || { id: id(), name: "", phone: "", note: "", entries: [] };
      const shouldReturnToCheckout = state.returnToCheckoutAfterClient;
      client.name = name;
      client.phone = $("#clientPhone").value.replace(/\D/g, "");
      client.note = $("#clientNote").value.trim();
      if (!editing) state.clients.push(client);
      if (shouldReturnToCheckout) state.selectedCheckoutClientId = client.id;
      else state.selectedClientId = client.id;
      state.showClientForm = false;
      state.editingClientId = null;
      state.returnToCheckoutAfterClient = false;
      $("#clientName").value = "";
      $("#clientPhone").value = "";
      $("#clientNote").value = "";
      saveState({ clientsChanged: true });
      render();
    });

    $("#newClientBtn").addEventListener("click", () => {
      state.editingClientId = null;
      state.returnToCheckoutAfterClient = false;
      state.showClientForm = !state.showClientForm;
      $("#clientName").value = "";
      $("#clientPhone").value = "";
      $("#clientNote").value = "";
      saveLocalState();
      renderClientForm();
      if (state.showClientForm) setTimeout(() => $("#clientName").focus(), 0);
    });

    $("#cancelClientBtn").addEventListener("click", () => {
      state.showClientForm = false;
      state.editingClientId = null;
      state.returnToCheckoutAfterClient = false;
      $("#clientName").value = "";
      $("#clientPhone").value = "";
      $("#clientNote").value = "";
      saveLocalState();
      renderClientForm();
    });

    $("#clientFormModal").addEventListener("click", (event) => {
      if (event.target.id !== "clientFormModal") return;
      state.showClientForm = false;
      state.editingClientId = null;
      state.returnToCheckoutAfterClient = false;
      saveLocalState();
      renderClientForm();
    });
    $("#closeClientDetailBtn").addEventListener("click", () => {
      state.selectedClientId = null;
      saveLocalState();
      render();
    });
    $("#clientDetailModal").addEventListener("click", (event) => {
      if (event.target.id !== "clientDetailModal") return;
      state.selectedClientId = null;
      saveLocalState();
      render();
    });

    $("#newClientFromCheckoutBtn").addEventListener("click", () => {
      state.editingClientId = null;
      state.returnToCheckoutAfterClient = true;
      state.showClientForm = true;
      saveLocalState();
      renderClientForm();
      setTimeout(() => $("#clientName").focus(), 0);
    });

    $("#clientSearch").addEventListener("input", renderClients);

    $("#editClientBtn").addEventListener("click", () => {
      const client = state.clients.find((item) => item.id === state.selectedClientId);
      if (!client) return;
      state.editingClientId = client.id;
      state.showClientForm = true;
      $("#clientName").value = client.name;
      $("#clientPhone").value = client.phone;
      $("#clientNote").value = client.note || "";
      saveLocalState();
      renderClientForm();
      setTimeout(() => $("#clientName").focus(), 0);
    });

    $("#payDebtBtn").addEventListener("click", () => {
      const client = state.clients.find((item) => item.id === state.selectedClientId);
      const amount = parseMoney($("#debtPaymentAmount").value);
      if (!client || !amount) return;
      client.entries.push({ id: id(), type: "payment", amount, method: $("#debtPaymentMethod").value, date: todayIso(), origin: "Abatimento" });
      $("#debtPaymentAmount").value = "";
      saveState({ clientsChanged: true });
      render();
      renderDebtPixBox();
    });

    $("#whatsappBtn").addEventListener("click", () => {
      const client = state.clients.find((item) => item.id === state.selectedClientId);
      if (!client || !client.phone) return;
      const text = encodeURIComponent(clientDebtWhatsappMessage(client));
      window.open(`https://wa.me/55${client.phone}?text=${text}`, "_blank");
    });

    $("#openDebtDetailBtn").addEventListener("click", openDebtDetailModal);
    $("#closeDebtDetailBtn").addEventListener("click", closeDebtDetailModal);
    $("#debtDetailModal").addEventListener("click", (event) => {
      if (event.target.id === "debtDetailModal") closeDebtDetailModal();
    });
    $("#debtDetailStart").addEventListener("change", renderDebtDetailPreview);
    $("#debtDetailEnd").addEventListener("change", renderDebtDetailPreview);
    $("#downloadDebtImageBtn").addEventListener("click", downloadDebtDetailImage);
    $("#sendDebtWhatsappBtn").addEventListener("click", sendDebtDetailWhatsapp);
    if ($("#saveScheduleBtn")) $("#saveScheduleBtn").addEventListener("click", saveScheduleFromForm);
    if ($("#scheduleType")) $("#scheduleType").addEventListener("change", renderScheduleFrequencyFields);
    if ($("#scheduleFrequency")) $("#scheduleFrequency").addEventListener("change", renderScheduleFrequencyFields);

    $("#saveProductBtn").addEventListener("click", async () => {
      const name = $("#productName").value.trim();
      const price = parseMoney($("#productPrice").value);
      const category = $("#productCategory").value || inferProductCategory(name);
      if (!name || !price) return alert("Informe nome e valor do produto.");
      const imageInput = $("#productImage");
      const image = imageInput && imageInput.files && imageInput.files[0]
        ? await fileToDataUrl(imageInput.files[0])
        : "";
      state.products.push({ id: id(), name, price, front: true, category, image });
      $("#productName").value = "";
      $("#productPrice").value = "";
      $("#productCategory").value = "outros";
      if (imageInput) imageInput.value = "";
      await saveConfigState();
      render();
    });

    $("#saveCompanyBtn").addEventListener("click", async () => {
      const name = $("#companyName").value.trim();
      const discount = percentValue($("#companyDiscount").value || 5);
      if (!name) return alert("Informe o nome da empresa.");
      const logo = await readImageFile($("#companyLogo").files && $("#companyLogo").files[0]);
      state.companies.push({ id: id(), name, discount, logo });
      $("#companyName").value = "";
      $("#companyDiscount").value = "";
      $("#companyLogo").value = "";
      await saveConfigState();
      render();
    });

    $("#saveCommandMaxBtn").addEventListener("click", async () => {
      state.commandMax = Number($("#commandMax").value || 100);
      await saveConfigState();
      render();
    });

    $("#saveBuffetPriceBtn").addEventListener("click", async () => {
      const price = parseMoney($("#buffetPrice").value);
      if (!price) return alert("Informe o valor da refeição à vontade.");
      state.buffetPrice = price;
      await saveConfigState();
      render();
    });

    $("#savePixKeyBtn").addEventListener("click", async () => {
      state.pixKey = $("#pixKey").value.trim();
      await saveConfigState();
      render();
    });

    $("#saveCashStartBtn").addEventListener("click", () => {
      setReportCashStart(parseMoney($("#cashStart").value));
      setLastAction(`Caixa inicial salvo para ${formatDate(reportRange().start)}.`, "relatorios");
      saveState();
      renderReports();
    });

    $("#reportStart").addEventListener("change", refreshReportPeriod);
    $("#reportEnd").addEventListener("change", refreshReportPeriod);
    $("#generateAccountantPdfBtn").addEventListener("click", generateAccountantPdf);
    $("#generateCashSummaryBtn").addEventListener("click", generateCashSummary);
    $("#closeCashSummaryBtn").addEventListener("click", () => $("#cashSummaryModal").classList.add("hidden"));
    $("#cashSummaryModal").addEventListener("click", (event) => {
      if (event.target.id === "cashSummaryModal") $("#cashSummaryModal").classList.add("hidden");
    });
    $("#reportStart").value = todayIso();
    $("#reportEnd").value = todayIso();
  }

  async function bootstrap() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "APP_UPDATED" && !sessionStorage.getItem("estalagem-pdv-reloaded-v57")) {
          sessionStorage.setItem("estalagem-pdv-reloaded-v57", "1");
          window.location.reload();
        }
      });
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("./sw.js").then((registration) => registration.update());
      });
    }
    document.body.classList.toggle("supabase-enabled", !!supabaseClient);
    window.addEventListener("focus", refreshRemoteState);
    window.addEventListener("online", refreshRemoteState);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refreshRemoteState();
    });
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      if (data.session && data.session.user) {
        const profile = await loadSupabaseProfile(data.session.user.id);
        if (profile) {
          saveSession(profile);
          await loadRemoteState();
          subscribeRemoteState();
          startRemotePolling();
        } else {
          await supabaseClient.auth.signOut();
          saveSession(null);
        }
      } else {
        saveSession(null);
        remoteLoaded = false;
      }
    }
    bindEvents();
    render();
  }

  bootstrap();
})();
