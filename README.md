# 2019 Shopify Intern Application Challenge (Summer)

### Contents
* [Prerequisites](#prerequisites)
* [Installing](#installing)
* [Interfacing with the API](#api)
    * [Shops](#shops)
    * [Orders](#orders)
    * [Products](#products)
    * [Line Items](#line-items)
* [Tests](#tests)
* [Known Issues](#known-issues)

## Getting Started

Follow these instructions to get a copy of my project running on your local machine.

### Prerequisites

For this to work you'll need to have the following installed:
* [NodeJS (npm)](https://nodejs.org/en/download/) - NPM is a package manager for NodeJS, it comes preinstalled with NodeJS
* [MongoDB](https://docs.mongodb.com/manual/installation/) - No-SQL, document-oriented database program
    * [Install guide for MacOS](https://treehouse.github.io/installation-guides/mac/mongo-mac.html)
    * [Install guide for Windows](https://treehouse.github.io/installation-guides/windows/mongo-windows.html)

### Installing

*This install guide is tailored towards Mac users, some steps may vary on Windows or Linux*

***Before starting** make sure you have mongodb running on localhost:27017.*


#### Cloning

Start by cloning the repo into a directory of your choice

```
git clone https://github.com/rammom/ShopifyApplicationSummer2019.git
```

#### Installing dependencies

Move into the repository and install all dependencies

```
cd ../app/
npm install
```

#### Last step

Run the app

```
npm start
```

That's it! Checkout the app on http://localhost:3000
(Although you won't see much since there's not client interface) :)

## API

The app's api is build with graphql.  [Graphiql](https://github.com/graphql/graphiql) is enabled by default, you can make all api calls and queries from there.

If you have the application running locally, visit localhost:3000/graphql to run queries or mutations

### Product

```
type ProductObject {
    _id: String!
    title: String!
    price: Float!
    inventory_count: Int!
}
```

Queries:
```
getProductById(product_id: String!): ProductObject
getProductByTitle(product_title: String!): [ProductObject]
getAllProducts(filter_no_inventory: Boolean!): [ProductObject]
```

Mutations:
```
createProduct(title: String!, price: Float!, inventory_count: Int!): ProductObject
```

### Cart

```
type CartObject {
    _id: String!
    items: [String]!
    total: Float!
    completed: Boolean
}
```

Queries:
```
getCart(cart_id: String!): CartObject
```

Mutations:
```
createCart: CartObject
addProductToCart(product_id: String!, cart_id: String!, qty: Int!): CartObject
removeProductFromCart(product_id: String!, cart_id: String!, qty: Int!): CartObject
completeCart(cart_id: String!): CartObject
```





