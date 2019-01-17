var { buildSchema } = require('graphql');
var Cart = require('../models/Cart');
var CartItem = require('../models/CartItem');
var Product = require('../models/Product');

var lib = require('../lib/lib');

var schema = buildSchema(`

    type CartObject {
        _id: String!
        items: [String]!
        total: Float!
        completed: Boolean
    }

    type CartItemObject {
        _id: String!
        product_id: String!
        qty: Int!
        total: Float!
    }

    type ProductObject {
        _id: String!
        title: String!
        price: Float!
        inventory_count: Int!
    }

    type Query {
        getCart(cart_id: String!): CartObject
        getProductById(product_id: String!): ProductObject
        getProductByTitle(product_title: String!): [ProductObject]
        getAllProducts(filter_no_inventory: Boolean!): [ProductObject]
    }

    type Mutation {
        createCart: CartObject 
        createProduct(title: String!, price: Float!, inventory_count: Int!): ProductObject
        addProductToCart(product_id: String!, cart_id: String!, qty: Int!): CartObject
        removeProductFromCart(product_id: String!, cart_id: String!, qty: Int!): CartObject
        completeCart(cart_id: String!): CartObject
    }

`);

var root = {
    /**
     * @params  cart_id -> unique cart identifier
     * @returns CartObject
     * @description Get a specific cart details by it's id
     */
    getCart: async ({ cart_id }) => {
        let cart = null
        await Cart.findById(cart_id)
                .populate('items')
                .then((crt) => {
                    if (!crt) throw new Error(`404 Couldn't find cart`);
                    cart = crt;
                })
                .catch((err) => {
                    throw err;
                });
        return {
            items: cart.items.map(x => x.toString()),
            total: cart.total,
            completed: false,
            _id: cart._id.toString()
        };
    },



    /**
     * @params  product_id -> unique product identifier
     * @returns ProductObject
     * @description Get a specific product details by it's id
     */
    getProductById: async ({ product_id }) => {
        let product = null;
        await Product.findById(product_id)
                    .exec()
                    .then((prod) => {
                        if (!prod) throw new Error(`product (${product_id}) does not exist`);
                        product = prod;
                    })
                    .catch((err) => {
                        throw err;
                    });
        return {
            title: product.title,
            price: product.price,
            inventory_count: product.inventory_count,
            _id: product._id.toString()
        };
    },



    /**
     * @params  product_title -> non-unique title of product
     * @returns Array of ProductObjects
     * @description Get all products with given title
     */
    getProductByTitle: async ({ product_title }) => {
        let products = [];
        await Product.find({ title: product_title })
                    .exec()
                    .then((prods) => {
                        products = prods;
                    })
                    .catch((err) => {
                        throw err;
                    });
        return products.map((p) => {
            return {
                title: p.title,
                price: p.price,
                inventory_count: p.inventory_count,
                _id: p._id.toString()
            };
        });
    },



    /**
     * @params  filter_no_inventory -> if true, only returns products with inventory
     * @returns Array of ProductObjects
     * @description Gets all products, or gets all products with inventory
     */
    getAllProducts: async ({ filter_no_inventory }) => {
        let products = [];
        let query = (filter_no_inventory) ? { inventory_count: { $gt: 0 } } : {};
        await Product.find(query)
                    .exec()
                    .then((prods) => {
                        products = prods;
                    })
                    .catch((err) => {
                        throw err;
                    });
        return products.map((p) => {
            return {
                title: p.title,
                price: p.price,
                inventory_count: p.inventory_count,
                _id: p._id.toString()
            };
        });
    },



    /**
     * @params
     * @returns CartObject
     * @description Creates a new blank cart (no items, not completed and total of 0)
     */
    createCart: async () => {
        let cart = new Cart({
            items: [],
            total: '0',
            completed: false
        });
        await cart.save();
        return {
            _id: cart._id.toString(),
            items: cart.items.map(x => x.toString()),
            total: cart.total,
            completed: cart.completed
        };
    },



    /**
     * @params  title -> title of new product
     *          price -> price of new product
     *          inventory_count -> total inventory of new product
     * @returns ProductObject
     * @description Creates a new product with given title, price and inventory
     */
    createProduct: async ({ title, price, inventory_count }) => {
        let product = new Product({
            title,
            price,
            inventory_count
        });
        await product.save();
        return {
            title: product.title,
            price: product.price,
            inventory_count: product.inventory_count,
            _id: product._id.toString()
        };
    },



    /**
     * @params  product_id -> id of product to be removed
     *          cart_id -> id of cart to remove product from
     *          qty -> amount of the given product to be removed from the given cart
     * @returns CartObject
     * @description removes a certain amount of product from a given cart, if the amount to be removed > amount in cart an error is returned
     */
    removeProductFromCart: async ({ product_id, cart_id, qty }) => {
        // check for non natural qty
        if (qty <= 0) throw new Error(`quantity (${qty}) has to be greater than 0`);

        // get cart
        let cart = null;
        await Cart.findById(cart_id)
            .populate('items')
            .exec()
            .then((crt) => {
                if (!crt) throw new Error(`invalid cart id (${cart_id})`);
                cart = crt;
            })
            .catch((err) => {
                throw err;
            });

        // get cart item
        let cart_item = null;
        await CartItem.find({ product_id, cart_id })
            .populate('product_id')
            .exec()
            .then((crt_items) => {
                if (crt_items.length) {
                    cart_item = crt_items[0];
                    cart_item.qty -= qty;
                    cart_item.total = lib.addToTotal(cart_item.total, -1 * cart_item.product_id.price * qty)
                }
                else {
                    throw new Error(`product does not belong to cart`);
                }
            })
            .catch((err) => {
                throw err;
            });
        // check new cart item qty
        if (cart_item.qty <= 0){
            // remove cart item from cart
            let index = -1;
            for (let i = 0; i < cart.items.length; i++){
                // find corresponding cart item
                if (cart.items[i]._id.toString() == cart_item._id.toString()){
                    index = i;
                }
            }
            cart.items.splice(index, 1);
            cart.total = lib.addToTotal(cart.total, -1 * (qty + cart_item.qty) * cart_item.product_id.price);
            // delete cart item
            cart_item.remove();
        } 
        else {
            cart_item.save();

            // update local cart's item
            let index = -1;
            for (let i = 0; i < cart.items.length; i++) {
                // find corresponding cart item
                if (cart.items[i]._id.toString() == cart_item._id.toString()) {
                    index = i;
                }
            }
            cart.items[index] = cart_item
            cart.total = lib.addToTotal(cart.total, -1 * qty * cart_item.product_id.price);
        }

        // update cart total & save
        cart.save();

        return {
            // converting item product_ids back to an _id
            items: cart.items.map(x => {x.product_id = x.product_id._id; return x.toString()}),
            total: cart.total,
            completed: cart.completed,
            _id: cart._id.toString()
        }

    },



    /**
     * @params  product_id -> id of product to be removed
     *          cart_id -> id of cart to remove product from
     *          qty -> amount of the given product to be removed from the given cart
     * @returns CartObject
     * @description adds a certain amount of product to a given cart
     */
    addProductToCart: async ({ product_id, cart_id, qty }) => {
        // check for non natural qty
        if (qty <= 0) throw new Error(`quantity (${qty}) has to be greater than 0`);

        // get cart
        let cart = null;
        await Cart.findById(cart_id)
            .populate('items')
            .exec()
            .then((crt) => {
                if (!crt) throw new Error(`invalid cart id (${cart_id})`);
                cart = crt;
            })
            .catch((err) => {
                throw err;
            });
        // get product
        let product = null;
        await Product.findById(product_id)
            .exec()
            .then((prod) => {
                if (!prod) throw new Error(`invalid product id (${product_id})`);
                product = prod;
            })
            .catch((err) => {
                throw err;
            });
        // get cart item if available
        let cart_item = null;
        await CartItem.find({ product_id, cart_id })
            .exec()
            .then((crt_items) => {
                if (crt_items.length) {
                    cart_item = crt_items[0];
                    cart_item.qty += qty;
                    cart_item.total = lib.addToTotal(cart_item.total, product.price * qty)
                }
            })
            .catch((err) => {
                throw err;
            });
        // create cart item if not available
        let new_cart_item = false;
        if (!cart_item) {
            new_cart_item = true;
            let total = lib.addToTotal('0', product.price * qty);
            cart_item = new CartItem({
                product_id,
                cart_id,
                qty,
                total
            });
        }
        // save cart item (new or updated)
        cart_item.save();

        // add cart item to cart (new)
        if (new_cart_item) {
            cart.items.push(cart_item);
        }
        // update cart total
        cart.total = lib.addToTotal(cart.total, product.price * qty);
        // save cart
        cart.save();

        return {
            items: cart.items.map(x => x.toString()),
            total: cart.total,
            completed: cart.completed,
            _id: cart._id.toString()
        }
    },


    
    /**
     * @params  cart_id -> id of cart to remove product from
     * @returns CartObject
     * @description 'completes' if it is valid.  A valid cart has products with enough inventory
     */
    completeCart: async ({ cart_id }) => {
        // get the cart
        let cart = null;
        await Cart.findById(cart_id)
                .exec()
                .then((crt) => {
                    if (!crt) throw new Error(`invalid cart id (${cart_id})`);
                    cart = crt;
                })
                .catch((err) => {
                    throw err;
                });

        // make sure cart isn't already completed
        if (cart.completed) throw new Error(`cart (${cart._id}) is already completed`);
        
        // check if all products have enough inventory
        let cart_items = [];
        for (let i = 0; i < cart.items.length; i++){
            await CartItem.findById(cart.items[i])
                        .populate('product_id')
                        .exec()
                        .then((crt_item) => {
                            if (!crt_item) throw new Error(`cart contains non-existing item`);
                            if (crt_item.product_id.inventory_count < crt_item.qty){
                                throw new Error(`insufficient inventory for ${crt_item.product_id.title} (${crt_item.product_id}): inventory count (${crt_item.product_id.inventory_count}) / cart qty (${crt_item.qty})`);
                            }
                            cart_items.push(crt_item);
                        })
                        .catch((err) => {
                            throw err;
                        });
        }

        // update product inventories
        for (let i = 0; i < cart_items.length; i++){
            await Product.findById(cart_items[i].product_id._id)
                        .exec()
                        .then(async (prod) => {
                            if (!prod) throw new Error(`art contains non-existing product`);
                            prod.inventory_count -= cart_items[i].qty;
                            await prod.save();
                        })
                        .catch((err) => {
                            throw err;
                        });
        }

        // 'complete' the cart
        cart.completed = true;
        cart.save();   

        return {
            items: cart.items.map(x => x.toString()),
            total: cart.total,
            completed: cart.completed,
            _id: cart._id.toString()
        }
    }
}

module.exports = { schema, root }