function validateProduct(data) {
    const errors = [];
    if (!data.name) errors.push('name is required');
    if (!data.sku) errors.push('sku is required');
    if (!data.unit) errors.push('unit is required');
    if (data.cost_price === undefined || data.cost_price < 0) errors.push('valid cost_price is required');
    if (data.qty_on_hand === undefined || data.qty_on_hand < 0) errors.push('valid qty_on_hand is required');
    return errors;
}

function validateReceipt(data) {
    const errors = [];
    if (!data.supplier) errors.push('supplier is required');
    if (!Array.isArray(data.lines) || data.lines.length === 0) errors.push('lines must be a non-empty array');
    (data.lines || []).forEach((line, i) => {
        if (!line.product_id) errors.push(`lines[${i}]: product_id is required`);
        if (!line.qty || line.qty <= 0) errors.push(`lines[${i}]: qty must be > 0`);
    });
    return errors;
}

function validateDelivery(data) {
    const errors = [];
    if (!data.customer) errors.push('customer is required');
    if (!Array.isArray(data.lines) || data.lines.length === 0) errors.push('lines must be a non-empty array');
    (data.lines || []).forEach((line, i) => {
        if (!line.product_id) errors.push(`lines[${i}]: product_id is required`);
        if (!line.qty || line.qty <= 0) errors.push(`lines[${i}]: qty must be > 0`);
    });
    return errors;
}

module.exports = { validateProduct, validateReceipt, validateDelivery };