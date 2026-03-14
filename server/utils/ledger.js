function checkLowStock(store) {
    return store.products.filter(p => p.qty_on_hand <= p.min_stock && p.qty_on_hand > 0);
}

function checkOutOfStock(store) {
    return store.products.filter(p => p.qty_on_hand === 0);
}

module.exports = { checkLowStock, checkOutOfStock };