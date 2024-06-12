const fs = require("fs");
const path = require("path");

require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_KEY);

const PDFDocument = require("pdfkit");

const Product = require("../models/product");
const Order = require("../models/order");

const ITEMS_PER_PAGE = 1;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((number) => {
      totalItems = number;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((number) => {
      totalItems = number;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPrevPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .cleanCart()
    .then((result) => {
      return req.user.populate("cart.items.productId");
    })
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      //console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.changeQty = (req, res, next) => {
  const updatedVal = req.body.updatedValue;
  const prodId = req.params.productId;

  if (updatedVal > 0) {
    req.user.cart.items.forEach((item, idx, arr) => {
      if (arr[idx].productId.toString() === prodId.toString()) {
        arr[idx].quantity = updatedVal;
      }
    });
  } else {
    const updatedCart = req.user.cart.items.filter((item) => {
      return item.productId.toString() !== prodId.toString();
    });
    req.user.cart.items = updatedCart;
  }

  req.user
    .save()
    .then((result) => {
      if (updatedVal > 0) {
        res.status(200).json({ message: "Successfully changed quantity!" });
      } else {
        res
          .status(200)
          .json({ message: "Product removed. Redirecting...", redirect: true });
      }
    })
    .catch((err) => {
      res
        .status(500)
        .json({ message: "Failed to update the product quantity" });
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      //console.log(result);
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      products = user.cart.items;
      products.forEach((p) => {
        total += +p.quantity * +p.productId.price;
      });
      // Old code Max video: Didn't work

      // return stripe.checkout.sessions.create({

      //  payment_method_types: ["card"],

      //  line_items: products.map((p) => {

      //      return {

      //          name: p.productId.title,

      //          description: p.productId.description,

      //          price: p.productId.price * 100, // Price in cents

      //          currency: "eur",

      //          quantity: p.quantity,

      //      };

      //  }),

      //     success_url: req.protocol + "://" + req.get("host") + "/checkout/success",// => http://localhost:3000

      //     cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",

      // });
      return stripe.checkout.sessions.create({
        line_items: products.map((p) => {
          return {
            price_data: {
              currency: "eur",

              unit_amount: parseInt(Math.ceil(p.productId.price * 100)),

              product_data: {
                name: p.productId.title,

                description: p.productId.description,
              },
            },

            quantity: p.quantity,
          };
        }),

        mode: "payment",

        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success", // => http://localhost:3000,

        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        pageTitle: "Checkout",

        path: "/checkout",

        products: products,

        totalSum: total.toFixed(2),

        sessionId: session.id,
      });
    })

    .catch((err) => {
      const error = new Error(err);

      error.httpStatusCode = 500;

      return next(error);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  let totalPrice = 0;
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        //console.log("product price: ",i.productId.price);
        totalPrice += i.quantity * i.productId.price;
        return { quantity: i.quantity, product: { ...i.productId._doc } }; //i.productId has alot of metadata, _doc is the field that stores all the data which is intended to be fetched
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user._id,
        },
        products: products,
        totalPrice: totalPrice,
      });
      //console.log(totalPrice);
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  let totalPrice = 0;
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items.map((i) => {
        //console.log("product price: ",i.productId.price);
        totalPrice += i.quantity * i.productId.price;
        return { quantity: i.quantity, product: { ...i.productId._doc } }; //i.productId has alot of metadata, _doc is the field that stores all the data which is intended to be fetched
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user._id,
        },
        products: products,
        totalPrice: totalPrice,
      });
      //console.log(totalPrice);
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error("No roder found"));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Not Authorized"));
      }
      const invoiceName = "invoice-" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      //set headers
      res.setHeader("Content-type", "application/pdf");
      res.setHeader(
        "Content-disposition",
        'inline; filename="' + invoiceName + '"'
      );

      //this code create a PDF file on the fly
      let pdfDoc = new PDFDocument();
      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      pdfDoc.fontSize(30).text("INVOICE", 20, 30);
      pdfDoc.fontSize(30).text("LOGO", 20, 30, { align: "right" });
      pdfDoc.text("_______________________________");
      pdfDoc.text(" ");
      pdfDoc.fontSize(14).text("Invoice# " + "XXXX", 20, 110);
      pdfDoc.fontSize(14).text("Invoice Date: " + "XX-XXX-XXXX");
      pdfDoc.fontSize(14).text("Invoice To: " + "Lorem ipsum dolor sit");
      pdfDoc.fontSize(30).text("_______________________________", 20, 140);
      pdfDoc.fontSize(14).text(" ");

      pdfDoc
        .fontSize(16)
        .text(
          "   ITEM                  DESCRIPTION                       Qty               AMOUNT",
          20,
          175
        );

      pdfDoc.fontSize(30).text("_______________________________", 20, 170);
      let item = 1;
      let fsize = 14;
      let ystart = 210;
      let xstart = 40;
      let yinc = fsize + 20;
      let ycoord = ystart + (item - 1) * yinc;
      order.products.forEach((prod) => {
        pdfDoc.fontSize(fsize).text(" " + item, xstart, ycoord);
        pdfDoc.fontSize(fsize).text(prod.product.title, xstart + 120, ycoord);
        pdfDoc.fontSize(fsize).text(prod.quantity, xstart + 330, ycoord);
        pdfDoc.fontSize(fsize).text(prod.product.price, xstart + 430, ycoord);
        item++;
        ycoord = ystart + (item - 1) * fsize;
      });
      pdfDoc.fontSize(30).text("_______________________________", 20, ycoord);
      pdfDoc
        .fontSize(20)
        .text(" Total: $" + order.totalPrice, 400, ycoord + 40);
      pdfDoc
        .fontSize(30)
        .text("_______________________________", 20, ycoord + 40);
      pdfDoc.end();
    })
    .catch((err) => next(err));
};
