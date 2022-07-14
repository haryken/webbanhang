  // use express
var express = require("express");
var app = express();
// port 3000
app.listen(3000);
//body parser
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });
//route
var router = express.Router();
// session
const session = require('express-session');
// fetch
const fetch = require('node-fetch');
var session_ ='';
const expressLayouts = require('express-ejs-layouts');
const shortid = require('shortid');
const bcrypt = require('bcrypt');
//console.log(bcrypt.hashSync('123456', 10));
// static file
app.use(express.static('public'));
app.use('/css',express.static(__dirname+'public/css'));
app.use('/js',express.static(__dirname+'public/js'));
app.use('/img',express.static(__dirname+'public/img'));
app.use('/fonts',express.static(__dirname+'public/fonts'));
app.use(express.static('nhanvien'));
app.use('/nhanvien',express.static(__dirname+'nhanvien/'));
app.use('/thukho',express.static(__dirname+'thukho/'));
////cassandra
var assert = require('assert');
var cassandra = require('cassandra-driver')
// connect cassandra
const client = new cassandra.Client({
  contactPoints: ['127.0.0.1:9042'],
  localDataCenter: 'datacenter1'
});
client.connect(function (err, res) {
  console.log("Cassandra connect");
});
//Ensure all queries are executed before exit
///////////function//////////////////////////////////////////
function execute(query, params, callback) {
  return new Promise((resolve, reject) => {
    client.execute(query, params, (err, result) => {
      if(err) {
        reject()
      } else {
        callback(err, result);
        resolve()
      }
    });
  });
}
// cau hinh ejs
app.use(expressLayouts);
app.set("view engine","ejs");

//create session
app.use(session({secret: 'uitisawesome'}));

////////////////////////////////////////////////////////////////render pages////////////////////////////////////////////////////////////////////////////////
//                                                                                                                                                      ////
//                                                                                                                                                      ///
///////////////////////////////////////////////////////////////////////Đăng nhập đăng xuất////////////////////////////////////////////////////////////////

/////////////// Đăng nhập //////////////
// render login page
app.get("/",function(req,res) {
  if(req.session.user) {
    res.redirect('/home');
  }
else {
  app.set('layout','./layouts/login');
    res.render("login",{error:''});
  }
});
// post to login
app.post("/",function(req,res){
  var query = 'SELECT * FROM store.account WHERE username=? and state=? ALLOW FILTERING';
  var q2 = execute(query, [req.body.username,'true'], function(err,result) {
    if(err){
      assert.ifError(err);
    }else {
      if(result.rows.length>0){
        if(bcrypt.compareSync(req.body.password,result.rows[0].pass)) {
         // Passwords match
         req.session.user =  result.rows[0];
         console.log('username' + result.rows[0].name);
         console.log('dang nhap thanh cong');
         if(result.rows[0].vaitro==1){
           app.set('layout','./layouts/nhanvien');
         }else if (result.rows[0].vaitro==2) {
             app.set('layout','./layouts/thukho');
         }else if (result.rows[0].vaitro==3) {
             app.set('layout','./layouts/quanly');
         }else if (result.rows[0].vaitro==4) {
           app.set('layout','./layouts/ketoan');

         }
        res.redirect('/home');
         console.log("match");
        } else {
          console.log("Sai username");
          app.set('layout','./layouts/login');
            res.render("login",{error:'Wrong username or password!'});
        }
      }
      else {
        console.log("Sai username");
        app.set('layout','./layouts/login');
          res.render("login",{error:'Wrong username or password!'});
      }
    }
  });
});
/////////////// Kết thúc Đăng nhập //////

/////////////// Đăng xuất//////////////
app.get('/logout',function(req,res){
	req.session.destroy(function(err) {
		if(err) {
			console.log(err);
		} else {
			res.redirect('/');
		}
	});
});
///////////////Kết thúc Đăng xuất////////////
app.get("/reset",function(req,res) {
  if(req.session.user){
      res.render("reset",{user: req.session.user,error:''});
  }else {
      res.redirect('/');
  }
});
app.post("/reset",function(req,res){
  var query = 'SELECT * FROM store.account WHERE username=? and state=? ALLOW FILTERING';
  var q2 = execute(query, [req.session.user.username,'true'], function(err,result) {
    if(err){
      assert.ifError(err);
    }else {
      if(result.rows.length>0){
        if(bcrypt.compareSync(req.body.password,result.rows[0].pass)) {
          var query ='update  store.account SET pass=? where username=?';
          execute(query,[bcrypt.hashSync(req.body.newpass, 10),req.session.user.username],function(err,result){
              res.render("reset",{user: req.session.user,error:'Thành công'});
          });
        } else {
          res.render("reset",{user: req.session.user,error:'Sai mật khẩu'});
        }
      }
    }
  });
});
/////////////////////////////////////////////////////////////////////// kết thúc Đăng nhập đăng xuất//////////////////////


/////////////////////////////////////////////////////////////////////// Trang chủ//////////////////////////////////////////

///home page
app.get("/home",function(req,res) {
    if(req.session.user){
      if(req.session.user.vaitro ==1){
        var query ='select * from store.item';
        execute(query,[],function(err,result){
            var  results = result.rows;
            var  length = result.rows.length;
            app.set('layout','./layouts/nhanvien');
            res.render("nhanvien/home",{products: results,length: length});
        });
      }else if (req.session.user.vaitro ==2) {
        var query ='select * from store.item';
        execute(query,[],function(err,result){
            var  results = result.rows;
            app.set('layout','./layouts/thukho');
            var  length = result.rows.length;
            res.render("thukho/home",{products: results,length: length});
        });
      }else if (req.session.user.vaitro ==3) {
        var query ='select * from store.item';
        execute(query,[],function(err,result){
            var  results = result.rows;
            var  length = result.rows.length;
            app.set('layout','./layouts/quanly');
            res.render("thukho/home",{products: results,length: length});
        });
      }else if (req.session.user.vaitro ==4) {
        execute("select *from store.bill", [], function(err,result) {
              var results = result.rows;
              var length = result.rows.length;
              app.set('layout','./layouts/ketoan');
              res.render("ketoan/orders",{products: results,length:length,date:''});
          });
      }
    }else {
        res.redirect('/');
    }
  });
/////////////////////////////////////////////////////////////////////// kết thúc Trang chủ//////////////////////////
////////////////////////////////////////////////Nhân Viên  bán hàng//////////////////////////////////////////////////////
app.post("/nhanvien",function (req,res) {
  app.set('layout','./layouts/nhanvien');
  console.log(req.body.submit);
    if(req.body.submit=='view'){
      res.render("nhanvien/product",{id:req.body.id,
                                        amount:req.body.acmount, color:req.body.color,
                                        company:req.body.company, discount:req.body.discount,
                                         info:req.body.info,name:req.body.name,picture:req.body.picture
                                         ,price:req.body.price, size:req.body.size, type:req.body.type,state:req.body.state});}
    else if (req.body.submit=='add') {
          var query = "insert into store.cart (id,username,name,price,picture,discount,info,type,company,color,size,state,amount) values (?,?,?,?,?,?,?,?,?,?,?,?,?)"
          const params = [req.body.id,
                          req.session.user.username,
                           req.body.name,
                           req.body.price,
                           req.body.picture,
                           req.body.discount,
                           req.body.info,
                           req.body.type,
                           req.body.company,
                           req.body.color,
                           req.body.size,
                           req.body.state,
                           req.body.amount];
          client.execute(query, params, { prepare: true }, function (err) {
            assert.ifError(err);
              res.redirect('/nhanviencart');
          });}
    else if (req.body.submit=='delete') {
      var query ="delete from store.cart where id =? and username=?"
      const params =[req.body.id,req.session.user.username]
      client.execute(query, params, { prepare: true }, function (err) {
        assert.ifError(err);
          res.redirect('/nhanviencart');
      });}
    else if (req.body.submit=='finish') {
      var id = shortid.generate();
      var query = "insert into store.customer (phone,email,name) values (?,?,?)"
      const params = [req.body.phone,
                       req.body.email,
                       req.body.name];
      client.execute(query, params, { prepare: true }, function (err) {
        assert.ifError(err);
      });
      var query1 = "insert into store.bill (id,username,phone,date,cost,ht,shipingadd,state,paid) values (?,?,?,?,?,?,?,?,?)"
      const params1 = [id,
                      req.session.user.username,
                       req.body.phone,
                       req.body.date,
                       req.body.cost,
                       req.body.ht,
                       req.body.shipingadd,
                      'false',
                      'false'];
      client.execute(query1, params1, { prepare: true }, function (err) {
        assert.ifError(err);
      });
      var query = "select *from store.cart where username = ? allow filtering"
      var q2 = execute(query, [req.session.user.username], function(err,result) {
        var  results = result.rows;
        for (var i = 0; i < result.rows.length; i++) {
          var query = "insert into store.billdetail (idbill,id,username,name,price,picture,discount,info,type,company,color,size,state,amount) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
          const params = [id,
                            result.rows[i].id,
                            req.session.user.username,
                            result.rows[i].name,
                            result.rows[i].price,
                            result.rows[i].picture,
                            result.rows[i].discount,
                            result.rows[i].info,
                            result.rows[i].type,
                            result.rows[i].company,
                            result.rows[i].color,
                            result.rows[i].size,
                            result.rows[i].state,
                            result.rows[i].amount];
          client.execute(query, params, { prepare: true }, function (err) {
            assert.ifError(err);
          });
        }
      });

      execute("select *from store.cart where username = ? allow filtering", [req.session.user.username], function(err,result) {
        var  results = result.rows;
        var length = result.rows.length;
        console.log(result.rows.length);
        res.render("nhanvien/finish",{name:req.body.name, phone:req.body.phone,
                                  email:req.body.email, date: req.body.date,
                                   shipingadd:req.body.shipingadd, id:id, cost:req.body.cost ,
                                    products: results, length: length,ht: req.body.ht})
      });}
    else if (req.body.submit=='undo') {
      var query ="delete from store.bill where id=?"
      const params =[req.body.id]
      client.execute(query, params, { prepare: true }, function (err) {
        assert.ifError(err);
        res.redirect('/nhanvienoders');
      });
      execute("select *from store.billdetail", [], function(err,result) {
        for (var i = 0; i < result.rows.length; i++) {
            console.log(result.rows[i].id);
            console.log(req.body.id);
            client.execute("delete from store.billdetail  where idbill=? and id=?", [req.body.id,result.rows[i].id], { prepare: true }, function (err) {
              assert.ifError(err);;
            });
          }
        });}
    else if (req.body.submit=='orders') {
        execute("select *from store.billdetail where idbill =? allow filtering", [req.body.id], function(err,result) {
          res.render("nhanvien/orderdetail",{phone:req.body.phone,
                                            date: req.body.date,
                                            state: req.body.state,
                                            shipingadd:req.body.shipingadd,
                                            id:req.body.id,
                                            username: req.body.username,
                                            cost:req.body.cost,
                                            ht: req.body.ht,
                                            paid: req.body.paid,
                                            products: result.rows,
                                            length: result.rows.length})
          });}
    else if (req.body.submit=='search') {
        var query ='select * from store.item where type =? and company=? allow filtering';
        execute(query,[req.body.type,req.body.company],function(err,result){
              var results = result.rows;
              var length = result.rows.length;
                res.render("nhanvien/search",{products: results,length: length});
        });}
    else if (req.body.submit=='searchbar') {
        if(req.body.type =='0'){
          execute("select *from store.bill where phone=? allow filtering", [req.body.val], function(err,result) {
                var results = result.rows;
                var length = result.rows.length;
                res.render("nhanvien/orders",{products: results,length:length,date:req.body.date});
            });
        }else if (req.body.type =='1') {
          var query ='select * from store.item where id=?';
          execute(query,[req.body.val],function(err,result){
                var results = result.rows;
                var length = result.rows.length;
                  res.render("nhanvien/search",{products: results,length: length});
          });
        }
      }
    else if (req.body.submit=='ordersday') {
        execute("select *from store.bill where date=? allow filtering", [req.body.date], function(err,result) {
              var results = result.rows;
              var length = result.rows.length;
              res.render("nhanvien/orders",{products: results,length:length,date:req.body.date});
          });
      }
});
//Category
app.get("/nhanviencategory",function(req,res) {
  app.set('layout','./layouts/nhanvien');
  if(req.session.user){
    if(req.session.user.vaitro ==1 || req.session.user.vaitro == 3){
      res.render("nhanvien/category",{ken: req.session.user.vaitro});
    }
  }else {
      res.redirect('/');
  }
});
//Laptops
app.get("/nhanvienlaptops",function(req,res) {
  app.set('layout','./layouts/nhanvien');
  if(req.session.user){
    var query ='select * from store.item where type =? allow filtering';
    execute(query,['laptops'],function(err,result){
          var results = result.rows;
          var length = result.rows.length;
          if(req.session.user.vaitro ==1){
            res.render("nhanvien/laptops",{products: results,length: length});
          }
    });
  }else {
      res.redirect('/');
  }
});
//smartphones
app.get("/nhanviensmartphones",function(req,res) {
  app.set('layout','./layouts/nhanvien');
  if(req.session.user){
    var query ='select * from store.item where type =? allow filtering';
    execute(query,['phones'],function(err,result){
          var results = result.rows;
          var length = result.rows.length;
          if(req.session.user.vaitro ==1){
            res.render("nhanvien/smartphones",{products: results,length: length});
          }
    });
  }else {
      res.redirect('/');
  }
});
//cameras
app.get("/nhanviencameras",function(req,res) {
  app.set('layout','./layouts/nhanvien');
  if(req.session.user){
    var query ='select * from store.item where type =? allow filtering';
    execute(query,['cameras'],function(err,result){
          var results = result.rows;
          var length = result.rows.length;
          if(req.session.user.vaitro ==1){
            res.render("nhanvien/cameras",{products: results,length: length});
          }
    });
  }else {
      res.redirect('/');
  }
});
//Accessories
app.get("/nhanvienaccessories",function(req,res) {
  app.set('layout','./layouts/nhanvien');
  if(req.session.user){
    var query ='select * from store.item where type =? allow filtering';
    execute(query,['accessories'],function(err,result){
          var results = result.rows;
          var length = result.rows.length;
          if(req.session.user.vaitro ==1){
            res.render("nhanvien/accessories",{products: results,length: length});
          }
    });
  }else {
      res.redirect('/');
  }
});
////checkout
app.get("/nhanviencheckout",function(req,res) {
  app.set('layout','./layouts/nhanvien');
  if(req.session.user){
    if(req.session.user.vaitro ==1){
      var query = "select *from store.cart where username = ? allow filtering"
      var q2 = execute(query, [req.session.user.username], function(err,result) {
        var  results = result.rows;
        var  length = result.rows.length;
        var cost= 0;
        res.render("nhanvien/checkout",{products: results,length: length,cost:cost});
      });
    }
  }else {
      res.redirect('/');
  }
});
// cart
app.get("/nhanviencart",function(req,res) {
  app.set('layout','./layouts/nhanvien');
    if(req.session.user){
      if(req.session.user.vaitro ==1){
        var query = "select *from store.cart where username = ? allow filtering"
        var q2 = execute(query, [req.session.user.username], function(err,result) {
          var  results = result.rows;
          var  length = result.rows.length;
          res.render("nhanvien/cart",{products: results, length: length});
        });
      }
    }else {
        res.redirect('/');
    }
  });
//Order
app.get("/nhanvienoders",function(req,res) {
  app.set('layout','./layouts/nhanvien');
  if(req.session.user){
    if(req.session.user.vaitro ==1){
      execute("select *from store.bill where username=? allow filtering", [req.session.user.username], function(err,result) {
            var results = result.rows;
            var length = result.rows.length;
            res.render("nhanvien/orders",{products: results,length:length,date:''});
        });
    }
  }else {
      res.redirect('/');
  }
});
//account pages
app.get("/nhanvienaccount",function(req,res) {
  app.set('layout','./layouts/nhanvien');
  if(req.session.user){
    if(req.session.user.vaitro ==1){
      res.render("account",{user: req.session.user});
    }
  }else {
      res.redirect('/');
  }
});
//search
app.post("/nhanviensearch",function(req,res) {
  app.set('layout','./layouts/nhanvien');
    if(req.session.user){
      if(req.session.user.vaitro ==1){
        res.render("nhanvien/search",{ken: req.session.user.vaitro});
      }
    }else {
        res.redirect('/');
    }
  });
////////////////////////////////////////////////kết thúc nhân viên bán hàng//////////////////////////////////////////

////////////////////////////////////////////////// THủ Kho ///////////////////////////////////////////////////////////////////////////
app.post("/thukho",function (req,res) {
  if(req.session.user.vaitro ==2){
    app.set('layout','./layouts/thukho');
  }else if (req.session.user.vaitro ==3) {
    app.set('layout','./layouts/quanly');
  }
  if(req.session.user.vaitro ==2 || req.session.user.vaitro ==3){
    console.log(req.body.submit);
    if(req.body.submit=='view'){
      res.render("thukho/product",{   id:req.body.id,
                                        amount:req.body.acmount,
                                        color:req.body.color,
                                        company:req.body.company,
                                        discount:req.body.discount,
                                        info:req.body.info,
                                        name:req.body.name,
                                        picture:req.body.picture,
                                        price:req.body.price,
                                        size:req.body.size,
                                        type:req.body.type,
                                        state:req.body.state});}
    else if (req.body.submit=='view2') {
      res.render("thukho/product0",{   id:req.body.id,
                                        amount:req.body.acmount,
                                        color:req.body.color,
                                        company:req.body.company,
                                        discount:req.body.discount,
                                        info:req.body.info,
                                        name:req.body.name,
                                        picture:req.body.picture,
                                        price:req.body.price,
                                        size:req.body.size,
                                        type:req.body.type,
                                        state:req.body.state,
                                      vaitro:req.body.vaitro});
    }
    else if (req.body.submit=='add') {
          var query = "insert into store.cart (id,username,name,price,picture,discount,info,type,company,color,size,state,amount) values (?,?,?,?,?,?,?,?,?,?,?,?,?)"
          const params = [req.body.id,
                          req.session.user.username,
                           req.body.name,
                           req.body.price,
                           req.body.picture,
                           req.body.discount,
                           req.body.info,
                           req.body.type,
                           req.body.company,
                           req.body.color,
                           req.body.size,
                           req.body.state,
                           req.body.amount];
          client.execute(query, params, { prepare: true }, function (err) {
            assert.ifError(err);
          });
        res.redirect('/cart');}
    else if (req.body.submit=='delete') {
      var query ="delete from store.cart where id =? and username=?"
      const params =[req.body.id,req.session.user.username]
      client.execute(query, params, { prepare: true }, function (err) {
        assert.ifError(err);
          res.redirect('/cart');
      });}
    else if (req.body.submit=='orders') {
      execute("select *from store.billdetail where idbill =? allow filtering", [req.body.id], function(err,result) {
        res.render("thukho/orderdetail",{phone:req.body.phone,
                                          vaitro: req.body.vaitro,
                                          date: req.body.date,
                                          state: req.body.state,
                                          shipingadd:req.body.shipingadd,
                                          id:req.body.id,
                                          username: req.body.username,
                                          cost:req.body.cost,
                                          ht: req.body.ht,
                                          products: result.rows,
                                          length: result.rows.length})
        });}
    else if (req.body.submit=='sporders') {
          execute("select *from store.supplierorderdetail where idbill =? allow filtering", [req.body.id], function(err,result) {
            res.render("thukho/supplierorderdetail",{company:req.body.company,
                                              date: req.body.date,
                                              state: req.body.state,
                                              id:req.body.id,
                                              username: req.body.username,
                                              cost:req.body.cost,
                                              products: result.rows,
                                              length: result.rows.length,
                                              vaitro:req.body.vaitro})
            });}
    else if (req.body.submit=='search') {
        var query ='select * from store.item where type =? and company=? allow filtering';
        execute(query,[req.body.type,req.body.company],function(err,result){
              var results = result.rows;
              var length = result.rows.length;
                res.render("thukho/search",{products: results,length: length,vaitro:req.session.user.vaitro});
        });}
    else if (req.body.submit=='searchbar') {
            if(req.body.type =='0'){
              execute("select *from store.bill where phone=? allow filtering", [req.body.val], function(err,result) {
                var results = result.rows;
                var length = result.rows.length;
                res.render("thukho/orders",{products: results,length:length,date:req.body.date,vaitro:req.session.user.vaitro});
                });
            }else if (req.body.type =='1') {
              var query ='select * from store.item where id=?';
              execute(query,[req.body.val],function(err,result){
                    var results = result.rows;
                    var length = result.rows.length;
                      res.render("thukho/search",{products: results,length: length,vaitro:req.session.user.vaitro});
              });
            }
          }
    else if (req.body.submit=='finish') {
        var id = shortid.generate();
        var query1 = "insert into store.supplierorder (id,username,company,date,cost) values (?,?,?,?,?)"
        const params1 = [id,
                        req.session.user.username,
                         req.body.company,
                         req.body.date,
                         req.body.cost];
        client.execute(query1, params1, { prepare: true }, function (err) {
          assert.ifError(err);
        });
        var query = "select *from store.cart where username = ? allow filtering"
        var q2 = execute(query, [req.session.user.username], function(err,result) {
          var  results = result.rows;
          for (var i = 0; i < result.rows.length; i++) {
            var query = "insert into store.supplierorderdetail (idbill,id,username,name,price,picture,discount,info,type,company,color,size,state,amount) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
            const params = [id,
                              result.rows[i].id,
                              req.session.user.username,
                              result.rows[i].name,
                              result.rows[i].price,
                              result.rows[i].picture,
                              result.rows[i].discount,
                              result.rows[i].info,
                              result.rows[i].type,
                              result.rows[i].company,
                              result.rows[i].color,
                              result.rows[i].size,
                              result.rows[i].state,
                              result.rows[i].amount];
            client.execute(query, params, { prepare: true }, function (err) {
              assert.ifError(err);
            });
          }
        });

        execute("select *from store.cart where username = ? allow filtering", [req.session.user.username], function(err,result) {
          var  results = result.rows;
          var length = result.rows.length;
          console.log(result.rows.length);
          res.render("thukho/finish",{company:req.body.company,
                                      date: req.body.date,
                                      id:id,
                                      cost:req.body.cost,
                                      products: results,
                                      length: length})
        });}
    else if (req.body.submit=='custom') {
        var query ='select * from store.item where id =?';
        execute(query,[req.body.id],function(err,result){
              var results = result.rows[0];
              res.render("thukho/custom",{product:results});
        });}
    else if (req.body.submit=='save') {
          if(req.body.picture==""){
            var picture = req.body.pictureO;
          }else {
            var picture = "/img/"+req.body.picture;
          }
          var query ="update  store.item SET color=?,company=?,discount=?,info=?,name=?,picture=?,price=?,size=?,state=?,type=?  where id =?"
          const params =[req.body.color,
                        req.body.company,
                        req.body.discount,
                        req.body.info,
                        req.body.name,
                        picture,
                        req.body.price,
                        req.body.size,
                        req.body.state,
                        req.body.type,
                        req.body.id]
          client.execute(query, params, { prepare: true }, function (err) {
            assert.ifError(err);
            var query ='select * from store.item where id =?';
            execute(query,[req.body.id],function(err,result){
                  var results = result.rows[0];
                  res.render("thukho/product",{ id:results.id,
                                                name:results.name,
                                                amount:results.amount,
                                                color:results.color,
                                                company:results.company,
                                                discount:results.discount,
                                                info:results.info,
                                                picture:results.picture,
                                                price:results.price,
                                                size:results.size,
                                                type:results.type,
                                                state:results.state});
            });
          });}
    else if (req.body.submit=='add_product') {
        picture = '/img/'+req.body.picture;
        var id = shortid.generate();
        var query ="insert into store.item (id,color,company,discount,info,name,picture,price,size,state,type) values(?,?,?,?,?,?,?,?,?,?,?)"
        const params =[id,
                      req.body.color,
                      req.body.company,
                      req.body.discount,
                      req.body.info,
                      req.body.name,
                      picture,
                      req.body.price,
                      req.body.size,
                      req.body.state,
                      req.body.type]
        client.execute(query, params, { prepare: true }, function (err) {
          assert.ifError(err);
          var query ='select * from store.item where id =?';
          execute(query,[id],function(err,result){
                var results = result.rows[0];
                res.render("thukho/product",{ id:results.id,
                                              name:results.name,
                                              amount:results.amount,
                                              color:results.color,
                                              company:results.company,
                                              discount:results.discount,
                                              info:results.info,
                                              picture:results.picture,
                                              price:results.price,
                                              size:results.size,
                                              type:results.type,
                                              state:results.state});
          });
        });}
    else if (req.body.submit=='ordersday') {
        execute("select *from store.bill where date=? allow filtering", [req.body.date], function(err,result) {
              var results = result.rows;
              var length = result.rows.length;
              res.render("thukho/orders",{products: results,length:length,date:req.body.date,vaitro:req.session.user.vaitro});
          });}
    else if (req.body.submit=='spordersday') {
              execute("select *from store.supplierorder where date=? allow filtering", [req.body.date], function(err,result) {
                    var results = result.rows;
                    var length = result.rows.length;
                    res.render("thukho/sporders",{products: results,length:length,date:req.body.date});
                });}
    else if (req.body.submit=='ordersfinish') {
        execute("update store.bill SET state ='true' where id=?", [req.body.id], function(err,result) {
          execute("select *from store.billdetail where idbill =? allow filtering", [req.body.id], function(err,result) {
            res.render("thukho/orderdetail",{phone:req.body.phone,
                                              date: req.body.date,
                                              state: 'true',
                                              shipingadd:req.body.shipingadd,
                                              id:req.body.id,
                                              username: req.body.username,
                                              cost:req.body.cost,
                                              ht: req.body.ht,
                                              products: result.rows,
                                              length: result.rows.length})
            });
          });
      }
    else if (req.body.submit=='spordersfinish') {
          execute("update store.supplierorder SET state ='true' where id=?", [req.body.id], function(err,result) {
            execute("select *from store.supplierorderdetail where idbill =? allow filtering", [req.body.id], function(err,result) {
              res.render("thukho/supplierorderdetail",{company:req.body.company,
                                                date: req.body.date,
                                                state: 'true',
                                                id:req.body.id,
                                                username: req.body.username,
                                                cost:req.body.cost,
                                                products: result.rows,
                                                length: result.rows.length})
              });
            });
        }
  }
});
//Category
app.get("/category",function(req,res) {
  if(req.session.user.vaitro ==2){
      app.set('layout','./layouts/thukho');
    }else if (req.session.user.vaitro ==3) {
      app.set('layout','./layouts/quanly');
    }
  if(req.session.user){
    if (req.session.user.vaitro ==2 ||req.session.user.vaitro ==3) {
      res.render("thukho/category",{ken: req.session.user.vaitro});
    }
  }else {
      res.redirect('/');
  }
});
//Laptops
app.get("/laptops",function(req,res) {
  if(req.session.user.vaitro ==2){
      app.set('layout','./layouts/thukho');
    }else if (req.session.user.vaitro ==3) {
      app.set('layout','./layouts/quanly');
    }
  if(req.session.user){
    var query ='select * from store.item where type =? allow filtering';
    execute(query,['laptops'],function(err,result){
          var results = result.rows;
          var length = result.rows.length;
          if (req.session.user.vaitro ==2  ||req.session.user.vaitro ==3) {
            res.render("thukho/laptops",{products: results,length: length});
          }
    });
  }else {
      res.redirect('/');
  }
});
//smartphones
app.get("/smartphones",function(req,res) {
  if(req.session.user.vaitro ==2){
      app.set('layout','./layouts/thukho');
    }else if (req.session.user.vaitro ==3) {
      app.set('layout','./layouts/quanly');
    }
  if(req.session.user){
    var query ='select * from store.item where type =? allow filtering';
    execute(query,['phones'],function(err,result){
          var results = result.rows;
          var length = result.rows.length;
          if (req.session.user.vaitro ==2 ||req.session.user.vaitro ==3) {
            res.render("thukho/smartphones",{products: results,length: length});
          }
    });
  }else {
      res.redirect('/');
  }
});
//cameras
app.get("/cameras",function(req,res) {
  if(req.session.user.vaitro ==2){
      app.set('layout','./layouts/thukho');
    }else if (req.session.user.vaitro ==3) {
      app.set('layout','./layouts/quanly');
    }
  if(req.session.user){
    var query ='select * from store.item where type =? allow filtering';
    execute(query,['cameras'],function(err,result){
          var results = result.rows;
          var length = result.rows.length;
          if (req.session.user.vaitro ==2 ||req.session.user.vaitro ==3) {
            res.render("thukho/cameras",{products: results,length: length});
          }
    });
  }else {
      res.redirect('/');
  }
});
//Accessories
app.get("/accessories",function(req,res) {
  if(req.session.user.vaitro ==2){
      app.set('layout','./layouts/thukho');
    }else if (req.session.user.vaitro ==3) {
      app.set('layout','./layouts/quanly');
    }
  if(req.session.user){
    var query ='select * from store.item where type =? allow filtering';
    execute(query,['accessories'],function(err,result){
          var results = result.rows;
          var length = result.rows.length;
          if (req.session.user.vaitro ==2 ||req.session.user.vaitro ==3) {
            res.render("thukho/accessories",{products: results,length: length});
          }
    });
  }else {
      res.redirect('/');
  }
});
////checkout
app.get("/checkout",function(req,res) {
  if(req.session.user.vaitro ==2){
      app.set('layout','./layouts/thukho');
    }else if (req.session.user.vaitro ==3) {
      app.set('layout','./layouts/quanly');
    }
  if(req.session.user){
    if(req.session.user.vaitro ==2 ||req.session.user.vaitro ==3){
      var query = "select *from store.cart where username = ? allow filtering"
      var q2 = execute(query, [req.session.user.username], function(err,result) {
        var  results = result.rows;
        var  length = result.rows.length;
        var cost= 0;
        res.render("thukho/checkout",{products: results,length: length,cost:cost});
      });
    }
  }else {
      res.redirect('/');
  }
});
// cart
app.get("/cart",function(req,res) {
  if(req.session.user.vaitro ==2){
      app.set('layout','./layouts/thukho');
    }else if (req.session.user.vaitro ==3) {
      app.set('layout','./layouts/quanly');
    }
    if(req.session.user){
      if (req.session.user.vaitro ==2 ||req.session.user.vaitro ==3) {
        var query = "select *from store.cart where username = ? allow filtering"
        var q2 = execute(query,[req.session.user.username] , function(err,result) {
          var  results = result.rows;
          var  length = result.rows.length;
          res.render("thukho/cart",{products: results, length: length});
        });
      }
    }else {
        res.redirect('/');
    }
  });
//Order
app.get("/oders",function(req,res) {
  if(req.session.user.vaitro ==2){
      app.set('layout','./layouts/thukho');
    }else if (req.session.user.vaitro ==3) {
      app.set('layout','./layouts/quanly');
    }
  if(req.session.user){
    if (req.session.user.vaitro ==2 ||req.session.user.vaitro ==3) {
      execute("select *from store.bill", [], function(err,result) {
            var results = result.rows;
            var length = result.rows.length;
            res.render("thukho/orders",{products: results,length:length,date:'',vaitro:req.session.user.vaitro});
        });
    }
  }else {
      res.redirect('/');
  }
});
//Ordersuplier
app.get("/spoders",function(req,res) {
  if(req.session.user.vaitro ==2){
      app.set('layout','./layouts/thukho');
    }else if (req.session.user.vaitro ==3) {
      app.set('layout','./layouts/quanly');
    }
  if(req.session.user){
    if (req.session.user.vaitro ==2 ||req.session.user.vaitro ==3||req.session.user.vaitro ==4) {
      execute("select *from store.supplierorder", [], function(err,result) {
            var results = result.rows;
            var length = result.rows.length;
            res.render("thukho/sporders",{products: results,length:length,date:'',vaitro:req.session.user.vaitro});
        });
    }
  }else {
      res.redirect('/');
  }
});
//producmanagerment
app.get("/productmanagerment",function(req,res) {
  if(req.session.user.vaitro ==2){
      app.set('layout','./layouts/thukho');
    }else if (req.session.user.vaitro ==3) {
      app.set('layout','./layouts/quanly');
    }
  if(req.session.user.vaitro ==2){
      app.set('layout','./layouts/thukho');
    }else if (req.session.user.vaitro ==3) {
      app.set('layout','./layouts/quanly');
    }
  if(req.session.user){
    if (req.session.user.vaitro ==2 ||req.session.user.vaitro ==3) {
      res.render("thukho/productmanagerment",{ken: req.session.user.vaitro});
    }
  }else {
      res.redirect('/');
  }
});
//account pages
app.get("/account",function(req,res) {
  if(req.session.user.vaitro ==2){
      app.set('layout','./layouts/thukho');
    }else if (req.session.user.vaitro ==3) {
      app.set('layout','./layouts/quanly');
    }
  if(req.session.user){
      res.render("account",{user: req.session.user});
  }else {
      res.redirect('/');
  }
});
//search
app.post("/search",function(req,res) {
  if(req.session.user.vaitro ==2){
      app.set('layout','./layouts/thukho');
    }else if (req.session.user.vaitro ==3) {
      app.set('layout','./layouts/quanly');
    }
    if(req.session.user){
      if (req.session.user.vaitro ==2 ||req.session.user.vaitro ==3) {
        app.set('layout','./layouts/thukho');
        res.render("thukho/search",{ken: req.session.user.vaitro});
      }
    }else {
        res.redirect('/');
    }
  });
///////////////////////////////////////////////////////////////kết thúc thủ kho////////////////////////////////////////////////////


//////////////////////////////////////////////////////////////Kế toán//////////////////////////////////////////////////////////////
app.post("/ketoan",function (req,res) {
  app.set('layout','./layouts/ketoan');
  console.log(req.body.submit);
    if (req.body.submit=='orders') {
      execute("select *from store.billdetail where idbill =? allow filtering", [req.body.id], function(err,result) {
        res.render("ketoan/orderdetail",{phone:req.body.phone,
                                          date: req.body.date,
                                          state: req.body.paid,
                                          shipingadd:req.body.shipingadd,
                                          id:req.body.id,
                                          username: req.body.username,
                                          cost:req.body.cost,
                                          ht: req.body.ht,
                                          products: result.rows,
                                          length: result.rows.length})
        });}
    else if (req.body.submit=='ordersday') {
        execute("select *from store.bill where date=? allow filtering", [req.body.date], function(err,result) {
              var results = result.rows;
              var length = result.rows.length;
              res.render("ketoan/orders",{products: results,length:length,date:req.body.date});
          });}
    else if (req.body.submit=='ordersfinish') {
        execute("update store.bill SET paid ='true' where id=?", [req.body.id], function(err,result) {
          execute("select *from store.billdetail where idbill =? allow filtering", [req.body.id], function(err,result) {
            res.render("ketoan/orderdetail",{phone:req.body.phone,
                                              date: req.body.date,
                                              state: 'true',
                                              shipingadd:req.body.shipingadd,
                                              id:req.body.id,
                                              username: req.body.username,
                                              cost:req.body.cost,
                                              ht: req.body.ht,
                                              products: result.rows,
                                              length: result.rows.length})
            });
          });
      }
    else if (req.body.submit=='searchbar') {
              if(req.body.type =='0'){
                execute("select *from store.bill where phone=? allow filtering", [req.body.val], function(err,result) {
                  var results = result.rows;
                  var length = result.rows.length;
                  res.render("ketoan/orders",{products: results,length:length,date:req.body.date});
                  });
              }
            }
});
//Order
app.get("/ketoanoders",function(req,res) {
  if(req.session.user){
    if (req.session.user.vaitro ==4) {
      execute("select *from store.bill", [], function(err,result) {
            var results = result.rows;
            var length = result.rows.length;
            app.set('layout','./layouts/ketoan');
            res.render("ketoan/orders",{products: results,length:length,date:''});
        });
    }
  }else {
      res.redirect('/');
  }
});
//////////////////////////////////////////////////////////////Kết thúc Kế toán/////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////Quản lý//////////////////////////////////////////////////////////////
//account producmanagerment
app.post("/quanly",function(req,res){
  app.set('layout','./layouts/quanly');
  if(req.body.submit=='custom'){
    execute("select *from store.account where username=?", [req.body.username], function(err,result) {
          res.render("quanly/customaccount",{account: result.rows[0]});
      });}
  else if (req.body.submit=='save') {
    if(req.body.pass==""){
      var password = req.body.password;
    }else {
      var password =bcrypt.hashSync(req.body.pass, 10);
    }
    var query ="update  store.account SET mail=?,name=?,phone=?,state=?,pass=?,vaitro=? where username =?"
    const params =[req.body.mail,
                  req.body.name,
                  req.body.phone,
                  req.body.state,
                  password,
                  req.body.vaitro,
                  req.body.username]
    client.execute(query, params, { prepare: true }, function (err) {
      res.redirect("/accountmanagement");
    });}
  else if (req.body.submit=='add'){
    var query ="insert into store.account (mail,name,pass,phone,username,vaitro,state) values (?,?,?,?,?,?,?)"
    const params =[req.body.mail,
                  req.body.name,
                  bcrypt.hashSync(req.body.pass, 10),
                  req.body.phone,
                  req.body.username,
                  req.body.vaitro,
                  req.body.state]
    client.execute(query, params, { prepare: true }, function (err) {
      res.redirect("/accountmanagement");
    });
  }
});
app.get("/accountmanagement",function(req,res) {
  app.set('layout','./layouts/quanly');
  if(req.session.user){
    if (req.session.user.vaitro ==3) {
      execute("select *from store.account", [], function(err,result) {
            var results = result.rows;
            var length = result.rows.length;
            res.render("quanly/accountmanagement",{products: results,length:length,vaitro:req.session.user.vaitro});
        });
    }
  }else {
      res.redirect('/');
  }
});
app.get("/create",function(req,res) {
  app.set('layout','./layouts/quanly');
  if(req.session.user){
    if (req.session.user.vaitro ==3) {
      res.render('quanly/newaccount');
    }
  }else {
      res.redirect('/');
  }
});
//////////////////////////////////////////////////////////////Kết thúc quản lý/////////////////////////////////////////////////////
