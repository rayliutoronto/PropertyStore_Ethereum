App = {
  web3Provider: null,
  contracts: {},
  account: undefined,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    // Is there an injected web3 instance?
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
    } else {
      // If no injected web3 instance is detected, fall back to Ganache
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web3 = new Web3(App.web3Provider);

    App.checkLogin();

    return App.initContract();
  },

  checkLogin: function() {
    App.account = web3.eth.accounts[0];

    setInterval(function(){
      var acc = web3.eth.accounts[0];
      if(acc != App.account){
        window.location.reload(true);
      }
    }, 1000);
  },

  initContract: function() {
    $.getJSON('Properties.json', function(data) {
      // Get the necessary contract artifact file and instantiate it with truffle-contract
      var PropertiesArtifact = data;
      App.contracts.Properties = TruffleContract(PropertiesArtifact);
    
      // Set the provider for our contract
      App.contracts.Properties.setProvider(App.web3Provider);
    
      if(App.account != undefined){
        // retrieve my properties
        App.loadMyProperties();
        App.watchEvent();
      }
    });

    return App.bindEvents();
  },

  loadMyProperties: function() {
    var propertiesInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
    
      var account = accounts[0];

      App.contracts.Properties.deployed().then(function(instance) {
        propertiesInstance = instance;
        
        return propertiesInstance.listAllMyProperties({from: account});
      }).then(function(properties) {
        $(".login").addClass("hidden");
        $(".nav").removeClass("hidden");

        var propertiesRow = $('#propertiesRow');
        
        propertiesRow.removeClass("hidden");
        propertiesRow.children(".alert").removeClass("hidden");
        propertiesRow.children(".property").remove();

        if(properties[0].length > 0){
          propertiesRow.children(".alert").addClass("hidden");

          for (i = 0; i < properties[0].length; i++) {
            var propertyTemplate = $('#propertyTemplate').clone();

            propertyTemplate.find('.panel-title').text(web3.toAscii(properties[1][i]));
            propertyTemplate.find('.property-desc').text(web3.toAscii(properties[2][i]));
            propertyTemplate.find('.property-creator').text(properties[0][i].substring(0, 10) + "...");
            propertyTemplate.find('.clipboard-creator').attr("data-clipboard-text", properties[0][i]);
            propertyTemplate.find('.property-owner').parents("span").addClass("hidden");
            propertyTemplate.find('.property-status').text(web3.toDecimal(properties[4][i]) == 0 ? "On Hold" : web3.toDecimal(properties[4][i]) == 1 ? "On Sale" : "Offered");
            propertyTemplate.find('.property-price').text(web3.fromWei(web3.toDecimal(properties[6][i])));
            propertyTemplate.find('.property-sellingto').text(properties[5][i].substring(0, 10) + "...");
            propertyTemplate.find('.clipboard-sellingto').attr("data-clipboard-text", properties[5][i]);

            if(web3.toDecimal(properties[4][i]) == 0){
              propertyTemplate.find('.btn-sell').removeClass("hidden");
              propertyTemplate.find('.property-price').parents("span").addClass("hidden");
              propertyTemplate.find('.property-sellingto').parents("span").addClass("hidden");
            }else if(properties[4][i] == 1){
              propertyTemplate.find('.btn-cancelsell').removeClass("hidden");
              propertyTemplate.find('.property-price').parents("span").removeClass("hidden");
              propertyTemplate.find('.property-sellingto').parents("span").addClass("hidden");
            }else{
              propertyTemplate.find('.btn-confirm').removeClass("hidden");
              propertyTemplate.find('.property-price').parents("span").removeClass("hidden");
              propertyTemplate.find('.property-sellingto').parents("span").removeClass("hidden");
            }

            propertyTemplate.find('.view').attr('data-id', web3.toAscii(properties[3][i]));
            propertyTemplate.find('.viewOnly').remove();
            propertyTemplate.find('.btn-sell').attr('data-id', web3.toAscii(properties[3][i]));
            propertyTemplate.find('.btn-cancelsell').attr('data-id', web3.toAscii(properties[3][i]));
            propertyTemplate.find('.btn-confirm').attr('data-id', web3.toAscii(properties[3][i]));

            propertyTemplate.find('.btn-ownershistory').attr('data-id', web3.toAscii(properties[3][i]));

            propertiesRow.append(propertyTemplate.html());
          }
        }
    }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  loadBuyableProperties: function() {
    var propertiesInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
    
      var account = accounts[0];
    
      App.contracts.Properties.deployed().then(function(instance) {
        propertiesInstance = instance;
    
       return propertiesInstance.listAllBuyableProperties({from: account});
      }).then(function(properties) {
        var propertiesRow = $('#buyablePropertiesRow');

        propertiesRow.children(".alert").removeClass("hidden");
        propertiesRow.children(".property").remove();

        if(properties[0].length > 0){
          propertiesRow.children(".alert").addClass("hidden");

          for (i = 0; i < properties[0].length; i++) {
            var propertyTemplate = $('#propertyTemplate').clone();

            propertyTemplate.find('.panel-title').text(web3.toAscii(properties[1][i]));
            propertyTemplate.find('.property-desc').text(web3.toAscii(properties[2][i]));
            propertyTemplate.find('.property-creator').text(properties[0][i].substring(0, 10) + "...");
            propertyTemplate.find('.clipboard-creator').attr("data-clipboard-text", properties[0][i]);
            propertyTemplate.find('.property-owner').text(properties[4][i].substring(0, 10) + "...");
            propertyTemplate.find('.clipboard-owner').attr("data-clipboard-text", properties[4][i]);
            propertyTemplate.find('.property-status').parents("span").addClass("hidden");
            propertyTemplate.find('.property-price').text(web3.fromWei(web3.toDecimal(properties[5][i])));
            propertyTemplate.find('.property-sellingto').parents("span").addClass("hidden");
            
            propertyTemplate.find('.view').remove();
            propertyTemplate.find('.btn-buy').removeClass("hidden");
            propertyTemplate.find('.btn-buy').attr('data-id', web3.toAscii(properties[3][i])).attr('data-price', web3.fromWei(web3.toDecimal(properties[5][i])));

            propertyTemplate.find('.btn-ownershistory').attr('data-id', web3.toAscii(properties[3][i]));
    
            propertiesRow.append(propertyTemplate.html());
          }
        }
    }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  bindEvents: function() {
    $(document).on('click', '#sellModal .btn-primary', App.handleSell);
    $('#sellModal').on('shown.bs.modal', function(e){
      $('#sellModal #inputPrice').val('');
      $('#sellModal .btn-primary').attr('data-id', $(e.relatedTarget).data('id'));
    });

    $(document).on('click', '#buyModal .btn-primary', App.handleBuy);
    $('#buyModal').on('shown.bs.modal', function(e){
      $('#buyModal #inputPass').val('');
      $('#buyModal .btn-primary').attr('data-id', $(e.relatedTarget).data('id'));
      $('#buyModal .btn-primary').attr('data-price', $(e.relatedTarget).data('price'));
    });

    $(document).on('click', '#confirmModal .btn-primary', App.handleConfirm);
    $('#confirmModal').on('shown.bs.modal', function(e){
      $('#confirmModal #inputPass').val('');
      $('#confirmModal .btn-primary').attr('data-id', $(e.relatedTarget).data('id'));
    });    

    $(document).on('click', '#viewModal .btn-primary', App.handleView);
    $('#viewModal').on('shown.bs.modal', function(e){
      $('#viewModal #inputPass').val('');
      $('#viewModal .btn-primary').attr('data-id', $(e.relatedTarget).data('id'));
    });       

    $(document).on('click', '.btn-cancelsell', App.handleCancelSell);
    $(document).on('click', '.myproperties', App.handleTab);
    $(document).on('click', '.propertymarket', App.handleTab);
    $(document).on('click', '.registerproperty', App.handleTab);

    $('#ownersModal').on('shown.bs.modal', App.handleHistory);

    $(document).on('click', '#registerPropertyRow .btn-primary', App.handleRegister);

    new ClipboardJS('.clipboard');
  },

  watchEvent: function() {
    var eventListener = function(result) {
      console.log(result);
    };

    App.contracts.Properties.deployed().then(function(instance) {
      propertiesInstance = instance;
  
      propertiesInstance.Register().watch(function(e, result){
        eventListener(result);
      });

      propertiesInstance.Sell().watch(function(e, result){
        eventListener(result);
      });

      propertiesInstance.CancelSell().watch(function(e, result){
        eventListener(result);
      });

      propertiesInstance.Offer().watch(function(e, result){
        eventListener(result);
      });

      propertiesInstance.Transfer().watch(function(e, result){
        eventListener(result);
      });
    })
  },

  handleRegister: function() {
    var name = $("#registerPropertyRow #inputName").val();
    var desc = $("#registerPropertyRow #inputDesc").val();
    var file = document.getElementById("inputFile").files[0];
    var pass = $("#registerPropertyRow #inputPass").val();

    var reader = new FileReader();
    reader.onload = function(e) {
      console.log(e.target.result);
      var hash = SHA256(e.target.result).substring(0, 32);
      console.log(hash);

      // check if hash is occupied by other user
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
      
        var account = accounts[0];
      
        App.contracts.Properties.deployed().then(function(instance) {
          propertiesInstance = instance;
      
          return propertiesInstance.getOwner(hash, {from: account});
        }).then(function(owner){
          if(owner != "0x" && owner != "0x0000000000000000000000000000000000000000" && owner != account) {
            console.log("hash was occupied by another user");
          }else{
            var encrypted = cryptico.encrypt(e.target.result, cryptico.publicKeyString(cryptico.generateRSAKey(pass, 512)));
            console.log(encrypted.cipher);

            $.post('http://localhost:8080/api/upload/' + hash, {originalname: file.name, type: file.type, content: encrypted.cipher}, function(data){
              var propertiesInstance;
      
              web3.eth.getAccounts(function(error, accounts) {
                if (error) {
                  console.log(error);
                }
              
                var account = accounts[0];
              
                App.contracts.Properties.deployed().then(function(instance) {
                  propertiesInstance = instance;
              
                  propertiesInstance.register(name, desc, hash, {from: account});
                }).catch(function(err) {
                  console.log(err.message);
                });
          
                //nav to my properties
                
              });
            });
          }
        }).catch(function(err) {
          console.log(err.message);
        });        
      });
    };

    reader.readAsDataURL(file);
  },

  handleHistory: function(e) {
    var propertyId = $(e.relatedTarget).data('id');

    $('#ownersModal .modal-body #loader').removeClass("hidden");
    $('#ownersModal .modal-body .content').empty();
    
    web3.eth.getBlockNumber(function(e, r){
      var latest = r;

      for(var i = 2957638; i <= latest; i++){
        web3.eth.getBlock(i, true, function(e, r){
          for(var j = 0; r.transactions && j < r.transactions.length; j++){
            if(r.transactions[j].to == App.contracts.Properties.address){
              if(r.transactions[j].input == ('0xdec4b4b8' + web3.padLeft(web3.toHex(propertyId).substring(2), 64))){
                $('#ownersModal .modal-body .content').append('<i class="fa fa-angle-double-down" style="font-size:24px"></i><br/>');
                $('#ownersModal .modal-body .content').append('<span><i class="fa fa-address-card-o"></i> ' + r.transactions[j].from + '</span><br/>');
                $('#ownersModal .modal-body .content').append('<span><i class="fa fa-calendar-check-o"></i>   ' + new Date(r.timestamp * 1000) + '</span><br/>');
              }
            }
          }

          if(r.number == latest) {
            $('#ownersModal .modal-body #loader').addClass("hidden");
          }
        });
      }
    });
  },

  handleTab: function() {
    event.preventDefault();

    if(!$(event.target).parent("li").hasClass("active")){
      if($(event.target).parent("li").hasClass("myproperties")){
        $(event.target).parent("li").addClass("active");
        $(".propertymarket").removeClass("active");
        $('.registerproperty').removeClass("active");

        $("#propertiesRow").removeClass("hidden");
        $("#buyablePropertiesRow").addClass("hidden");
        $("#registerPropertyRow").addClass("hidden");

        App.loadMyProperties();
      }else if($(event.target).parent("li").hasClass("propertymarket")){
        $(event.target).parent("li").addClass("active");
        $(".myproperties").removeClass("active");
        $('.registerproperty').removeClass("active");

        $("#propertiesRow").addClass("hidden");
        $("#buyablePropertiesRow").removeClass("hidden");
        $("#registerPropertyRow").addClass("hidden");

        App.loadBuyableProperties();
      }else if($(event.target).parent("li").hasClass("registerproperty")){
        $(event.target).parent("li").addClass("active");
        $(".myproperties").removeClass("active");
        $(".propertymarket").removeClass("active");

        $("#propertiesRow").addClass("hidden");
        $("#buyablePropertiesRow").addClass("hidden");
        $("#registerPropertyRow").removeClass("hidden");
      }
    }
  },

  handleSell: function(event) {
    event.preventDefault();

    var propertyId = $(event.target).data('id');
    var price = parseFloat($(event.target).parents(".modal").find("#inputPrice").val());

    var propertiesInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
    
      var account = accounts[0];
    
      App.contracts.Properties.deployed().then(function(instance) {
        propertiesInstance = instance;
    
        return propertiesInstance.initiateSale(propertyId,web3.toWei(price,"ether"),0,{from:account});
      }).then(function(result) {
        //update page
        //$(event.target)
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  handleCancelSell: function(event) {
    event.preventDefault();

    var propertyId = $(event.target).data('id');

    var propertiesInstance;

    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
    
      var account = accounts[0];
    
      App.contracts.Properties.deployed().then(function(instance) {
        propertiesInstance = instance;
    
        return propertiesInstance.cancelSale(propertyId,{from:account});
      }).then(function(result) {
        //update page
        //$(event.target)
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  handleBuy: function(event) {
    event.preventDefault();

    var propertyId = $(event.target).data('id');
    var price = parseFloat($(event.target).data('price'));
    var pass = $(event.target).parents(".modal").find("#inputPass").val();

    var propertiesInstance;

    var privateKey = cryptico.generateRSAKey(pass, 512);
    var publicKey = cryptico.publicKeyString(privateKey);

    $.post('http://localhost:8080/api/upload/' + propertyId + "pk", {originalname: "pk", content: publicKey}, function(data){
      web3.eth.getAccounts(function(error, accounts) {
        if (error) {
          console.log(error);
        }
      
        var account = accounts[0];
      
        App.contracts.Properties.deployed().then(function(instance) {
          propertiesInstance = instance;
      
          return propertiesInstance.offer(propertyId,{from:account, value:web3.toWei(price,"ether")});
        }).then(function(result) {
          //update page
          //$(event.target)
        }).catch(function(err) {
          console.log(err.message);
        });
      });    
    });
  },

  handleConfirm: function(event) {
    var id = $(event.target).data('id');
    var pass = $(event.target).parents(".modal").find("#inputPass").val();

    // check if hash is occupied by current user
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
    
      var account = accounts[0];
    
      App.contracts.Properties.deployed().then(function(instance) {
        propertiesInstance = instance;
    
        return propertiesInstance.getOwner(id, {from: account});
      }).then(function(owner){
        if(owner != account) {
          console.log("hash was occupied by another user");
        }else{
          $.get('http://localhost:8080/api/upload/' + id, function(data){
            var privateKey = cryptico.generateRSAKey(pass, 512);
            var decrypted = cryptico.decrypt(data.content, privateKey);

            if(decrypted.status == 'failure') {
              return console.log('wrong pass phrase, can not be confirmed');
            }

            $.get('http://localhost:8080/api/upload/' + id + 'pk', function(pkdata){
              var encrypted = cryptico.encrypt(decrypted.plaintext, pkdata.content);

              $.post('http://localhost:8080/api/upload/' + id, {originalname: data.originalname, type: data.type, content: encrypted.cipher}, function(data){
                var propertiesInstance;
      
                web3.eth.getAccounts(function(error, accounts) {
                  if (error) {
                    console.log(error);
                  }
                
                  var account = accounts[0];
                
                  App.contracts.Properties.deployed().then(function(instance) {
                    propertiesInstance = instance;
                
                    propertiesInstance.completeSale(id, {from: account});
                  }).catch(function(err) {
                    console.log(err.message);
                  });
            
                  //nav to my properties
                  
                });
              });              
            });
          });
        }
      }).catch(function(err) {
        console.log(err.message);
      });        
    });
  },

  handleView: function(event){
    var id = $(event.target).data('id');
    var pass = $(event.target).parents(".modal").find("#inputPass").val();

    $.get('http://localhost:8080/api/upload/' + id, function(data){
      var privateKey = cryptico.generateRSAKey(pass, 512);
      var decrypted = cryptico.decrypt(data.content, privateKey);

      if(decrypted.status == 'failure') {
        return console.log('wrong pass phrase, can not be confirmed');
      }

      var arr = decrypted.plaintext.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
      while(n--){
          u8arr[n] = bstr.charCodeAt(n);
      }
      saveAs(new Blob([u8arr], {type:mime}), data.originalname);  
    });
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
