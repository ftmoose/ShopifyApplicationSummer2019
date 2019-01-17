var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = mongoose.Schema.Types.ObjectId;

var cartSchema = new Schema({
    items: [{ type: ObjectId, ref: 'CartItem' }],
    total: { type: String, required: true },
    completed: { type: Boolean, required: true }
});

module.exports = mongoose.model('Cart', cartSchema);