const mongoose = require("mongoose");
const Product = require("./product");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  password: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },
  resetToken: {
    type: String,
  },
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

userSchema.methods.addToCart = function (product) {
  //console.log(this.cart);
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({ productId: product._id, quantity: newQuantity });
  }

  const updatedCart = {
    items: updatedCartItems,
  };

  this.cart = updatedCart;
  return this.save();
};

userSchema.methods.removeFromCart = function (productId) {
  const updatedCartItems = this.cart.items.filter((p) => {
    return p.productId.toString() != productId.toString();
  });

  this.cart.items = updatedCartItems;
  return this.save();
};

userSchema.methods.clearCart = function () {
  this.cart = { items: [] };
  return this.save();
};

userSchema.methods.cleanCart = function () {
  //clean all the products that were deleted by admin
  const currCartProductIds = this.cart.items.map((i) => {
    return i.productId;
  });

  return Product.find({
    _id: { $in: currCartProductIds },
  }).then((actualProducts) => {
    const updatedUserCartItems = this.cart.items.filter((item) => {
      const findIdx = actualProducts.findIndex((prod) => {
        return prod._id.toString() === item.productId.toString();
      });
      if (findIdx >= 0) return true;
      return false;
    });

    const updatedCart = {
      items: updatedUserCartItems,
    };

    this.cart = updatedCart;

    return this.save();
  });
};

module.exports = mongoose.model("User", userSchema);
