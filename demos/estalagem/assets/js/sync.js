(function (root) {
  const copy = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  function canonical(value) {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
    return value;
  }
  const same = (first, second) => JSON.stringify(canonical(first)) === JSON.stringify(canonical(second));

  // Apply only the edits made since the confirmed base, preserving independent remote edits.
  function merge(base, local, remote, field = '') {
    if (same(local, base)) return copy(remote);
    if (same(remote, base) || same(local, remote)) return copy(local);
    if (local === undefined) return undefined;
    if (field === 'updatedAt') return String(local || '') > String(remote || '') ? local : remote;
    if (Array.isArray(local) && Array.isArray(remote)) {
      const previous = Array.isArray(base) ? base : [];
      if ([...previous, ...local, ...remote].every(value => value && typeof value === 'object' && value.id)) {
        const byId = list => new Map(list.map(value => [value.id, value]));
        const old = byId(previous), ours = byId(local), theirs = byId(remote);
        const result = [];
        for (const id of new Set([...theirs.keys(), ...ours.keys()])) {
          const value = merge(old.get(id), ours.get(id), theirs.get(id), field);
          if (value !== undefined) result.push(value);
        }
        return result;
      }
      if ([...previous, ...local, ...remote].every(value => typeof value === 'string')) {
        const removed = new Set(previous.filter(value => !local.includes(value)));
        return [...new Set([...remote.filter(value => !removed.has(value)), ...local.filter(value => !previous.includes(value))])];
      }
    }
    if (local && remote && typeof local === 'object' && typeof remote === 'object' && !Array.isArray(local) && !Array.isArray(remote)) {
      const result = {};
      // Each quantity click has its own id, so equal totals from two devices are not mistaken for the same edit.
      const grouped = local.quantityChanges && remote.quantityChanges;
      if (!grouped && (local.quantityChanges || remote.quantityChanges)) {
        const legacy = local.quantityChanges ? remote : local;
        const modern = local.quantityChanges ? local : remote;
        if (base && !same(legacy.quantity, base.quantity) && !same(modern.quantityChanges, base.quantityChanges)) {
          throw new Error("Quantidade alterada por uma versão antiga em outro aparelho. Atualize o aplicativo e confira a comanda.");
        }
      }
      for (const key of new Set([...Object.keys(remote), ...Object.keys(local)])) {
        if (grouped && (key === 'quantity' || key === 'price')) continue;
        const value = merge(base && base[key], local[key], remote[key], key);
        if (value !== undefined) result[key] = value;
      }
      if (grouped) {
        result.quantity = Number(result.quantityBase || 0) + Object.values(result.quantityChanges).reduce((sum, change) => sum + Number(change), 0);
        if (!Number.isFinite(result.quantity) || result.quantity < 1) throw new Error("A quantidade foi reduzida em dois aparelhos. Confira a comanda antes de remover a última unidade.");
        result.price = Number(result.unitPrice) * result.quantity;
      }
      return result;
    }
    const labels = {method: 'forma de pagamento', amount: 'valor', price: 'valor do item', unitPrice: 'valor do item', quantity: 'quantidade', status: 'situação da comanda', name: 'nome'};
    const values = ['string', 'number'].includes(typeof local) && ['string', 'number'].includes(typeof remote)
      ? ` Neste aparelho: ${local}; online: ${remote}.` : '';
    throw new Error(`Conflito em ${labels[field] || 'um registro'}: alterado em outro aparelho.${values} Revise a alteração local pendente.`);
  }
  const collections = ['orders', 'sales', 'clients', 'itemRemovals', 'orderAdjustments'];
  function packBaseline(baseline, current) {
    const packed = {version: 1, values: {}, records: {}};
    for (const [key, value] of Object.entries(baseline)) {
      if (collections.includes(key)) {
        const currentById = new Map((current[key] || []).map(record => [record.id, record]));
        packed.records[key] = value.map(record => same(record, currentById.get(record.id)) ? record.id : copy(record));
      } else if (!['products', 'companies', 'schedules'].includes(key)) packed.values[key] = copy(value);
    }
    return packed;
  }
  function unpackBaseline(packed, current) {
    if (packed.version !== 1 || !packed.records) return copy(packed);
    const baseline = copy(packed.values);
    for (const [kind, records] of Object.entries(packed.records)) {
      const byId = new Map((current[kind] || []).map(record => [record.id, record]));
      baseline[kind] = records.map(record => typeof record === 'string' ? copy(byId.get(record)) : copy(record)).filter(Boolean);
    }
    return baseline;
  }
  function validateQuantities(value) {
    if (!value || typeof value !== 'object') return;
    if (value.quantityChanges) {
      const quantity = Number(value.quantityBase || 0) + Object.values(value.quantityChanges).reduce((sum, change) => sum + Number(change), 0);
      if (!Number.isFinite(quantity) || quantity !== Number(value.quantity)) {
        throw new Error("Quantidade alterada por uma versão antiga em outro aparelho. Atualize os aparelhos e confira a comanda antes de continuar.");
      }
    }
    for (const child of Object.values(value)) validateQuantities(child);
  }
  function checkedMerge(base, local, remote, field) {
    // Validate before fast paths too: an older app may preserve operation ids but change only the total.
    validateQuantities(local);
    validateQuantities(remote);
    return merge(base, local, remote, field);
  }
  const api = {same, merge: checkedMerge, packBaseline, unpackBaseline};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EstalagemSync = api;
})(typeof window !== 'undefined' ? window : globalThis);
