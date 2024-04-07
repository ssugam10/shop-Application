const Product = require('../models/product');
const mongodb = require('mongodb');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;
  const product = new Product(title,price,description,imageUrl,null,req.user._id);
  //When retrieving data, the object id is converted to a string for us, hence req.user._id is a string
  product.save()
  .then(result => {
    //console.log(result);
    console.log('Created Product');
    res.redirect('/admin/products');
  })
  .catch(err => {
    console.log(err);
  });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if(!editMode){
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
  .then(product => {
    if(!product){
      return res.redirect('/');
    }
    res.render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: editMode,
      product: product
    });
  })
  .catch(err => {
    console.log(err);
  });

};

exports.postEditProduct = (req, res, next) =>{
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedImageUrl = req.body.imageUrl;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.description;
  const product = new Product(updatedTitle,updatedPrice,updatedDesc,updatedImageUrl,prodId);
  product.save()
  .then(result => { //this then block handles any success responses from product.save() promise above
    console.log('UPDATED PRODUCT!');
    res.redirect('/admin/products');
  })
  .catch(err => { //catches errors for both promises: findByPk() and save()
    console.log(err);
  });
  
};

exports.postDeleteProduct = (req, res, next) =>{
  const productId = req.body.productId;
  Product.deleteById(productId)
  .then(() => {
    console.log('DESTROYED PRODUCT');
    res.redirect('/admin/products');  //we redirect here to make sure we redirect only once the deletion succeeds
  })
  .catch(err => {
    console.log(err);
  });
};

exports.getProducts = (req, res, next) => {
  Product.fetchAll()
  .then(products => {
    res.render('admin/products', {
      prods: products,
      pageTitle: 'Admin Products',
      path: '/admin/products'
    });
  })
  .catch(err => {
    console.log(err);
  });
};
