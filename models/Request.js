const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    itemTitle: { type: String, required: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, default: '' },
    buyerPhone: { type: String, default: '' },
    message: { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    status: { type: String, enum: ['Pending', 'Attempted', 'Completed'], default: 'Pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', requestSchema);
