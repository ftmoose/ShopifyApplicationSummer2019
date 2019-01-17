var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var cartItemSchema = new Schema({
    product_id: { type: ObjectId, ref: 'Product', required: true },
    cart_id: { type: ObjectId, ref: 'Cart', required: true },
    qty: { type: Number, required: true },
    total: { type: String, required: true },
});

module.exports = mongoose.model('CartItem', cartItemSchema);