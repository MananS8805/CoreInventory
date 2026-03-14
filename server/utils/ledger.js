function getTotalStock(product) {
    if (product.stock_by_location) {
        return Object.values(product.stock_by_location).reduce((sum, qty) => sum + qty, 0);
    }
    return product.qty_on_hand || 0; // fallback for old structure
}

function checkLowStock(store) {
    return store.products.filter(p => {
        const totalStock = getTotalStock(p);
        return totalStock <= p.min_stock && totalStock > 0;
    });
}

function checkOutOfStock(store) {
    return store.products.filter(p => getTotalStock(p) === 0);
}

module.exports = { checkLowStock, checkOutOfStock, getTotalStock };