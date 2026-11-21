(function (root) {
  "use strict";

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

  const domain = Object.freeze({
    itemUnitPrice,
    itemQuantity,
    itemTotal,
    itemDisplayName,
  });
  if (typeof module !== "undefined" && module.exports) module.exports = domain;
  else root.EstalagemDomain = domain;
})(globalThis);
