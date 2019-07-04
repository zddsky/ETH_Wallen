App ={
  cancelScrypt:false,
  activeWallet:null,
  provider:null,
  contract:null,

  init:function() {
    App.initLoadKey();
    App.initMnemonic();
    App.initLoadJson();
  },


setupWallet:function (wallet) {

  App.provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");
  App.activeWallet =wallet.connect(App.provider);

  var inputWalletAddress = $('#wallet-address');
  inputWalletAddress.val(wallet.address);

  showWallet();
  App.refreshUI();

  $('#save-keystore').click(App.exportkeystore);
  $('#wallet-submit-refresh').click(App.refreshUI)

  App.setupSendEther();
  App.initToken();
  App.setupSendToken();
},

setupSendToken:function () {
  var inputTargetAddress =  $('#wallet-token-send-target-address');
  var inputAmount =  $('#wallet-token-send-amount');
  var submit =   $('#wallet-token-submit-send');

  submit.click(function () {
    var targetAddress = ethers.utils.getAddress(inputTargetAddress.val());
    var amount = inputAmount.val();
    let contracntWithSiger = App.contract.connect(App.activeWallet);

    function check() {
      try{
        ethers.utils.getAddress(targetAddress.val());
      }catch(error){
        submit.addClass('disable');
        return;
      }
      submit.removeClass('disable');
    }

    inputTargetAddress.on("input",check);

    // App.contract.estimate.transfer(targetAddress,amount)
    // .then(function (gas) {
    //   console.log("gas :"+ gas) ;
    //       });

      contracntWithSiger.transfer(targetAddress,amount).then(function (tx) {
        console.log(tx);
        inputTargetAddress.val('');
        inputAmount.val('');
        App.refreshToken();

        App.addActivity('<Token sent:' + tx.hash.substring(0,20) + '……');

      },function (error) {
        console.log(error);
        alert(error);

    });
  });
},

setupSendEther:function () {
  var inputTargetAddress =  $('#wallet-send-target-address');
  var inputAmount =  $('#wallet-send-amount');
  var submit =   $('#wallet-submit-send');

  function check() {
    try{
      ethers.utils.getAddress(inputTargetAddress.val());
      ethers.utils.parseEther(inputAmount.val());
    }catch(error){
      submit.addClass('disable');
      return;
    }
    submit.removeClass('disable');
  }

  inputTargetAddress.on("input",check);
  inputAmount.on("input",check);

  submit.click(function () {
    if (submit.hasClass('disable')){ return;}
    var targetAddr = ethers.utils.getAddress(inputTargetAddress.val());
    var amountWei = ethers.utils.parseEther(inputAmount.val());

    App.activeWallet.sendTransaction({
      to:targetAddr,
      value:amountWei,
    }).then(function (tx) {
       App.addActivity('Transation sent:' + tx.hash.substring(0,20) + '……');
       alert("Success");
       inputTargetAddress.val('');
       inputAmount.val('');
       submit.addClass('disable');
       App.refreshUI();
    }, function (error) {
      alert("Error");
    });
  });
},


refreshUI:function () {
  var inputBalance = $('#wallet-balance');
  App.activeWallet.getBalance("pending").then(function (balance) {
    inputBalance.val(balance);
    App.addActivity('balance:' + balance);
  });

  var inputTransactionCount = $('#wallet-transation-count');
  App.activeWallet.getTransactionCount('pending').then(function (count) {
    inputTransactionCount.val(count);
    App.addActivity('<TransactionCount : ' + count);
  });
},

initToken:function () {
  $.getJSON("TutorialToken.json",function (data) {
    const address = data.networks["5777"].address;

    App.contract = new ethers.Contract(address,data.abi,App.provider);
    console.log("contract:" + App.contract);

    App.refreshToken();
  });
},

refreshToken:function () {
  var tokenBalance = $('#wallet-token-balance');

  App.contract.balanceOf(App.activeWallet.address).then(function(balance){
    tokenBalance.val(balance);
    // App.addActivity('<Token balance: '+ balance);
  });
},




addActivity:function (message) {
  var activity = $('#wallet-activity');
  activity.append("</br>"+message);
},


exportkeystore:function () {
  var pwd = $('#save-keystore-file-pwd');
  showLoading('导出私钥...');
  App.cancelScrypt =false;

  App.activeWallet.encrypt(pwd.val(),App.updateLoading).then(
    function (json) {
      showWallet();

      var blob = new Blob([json],{type:"text/plain;charset=uft-8"});
      saveAs(blob,"keystore.json");
    }
  );
},


updateLoading:function (progress) {
  $("#loading-status").val(parseInt(progress * 100) + '%');
  return App.cancelScrypt;
},

initLoadJson: function() {
    setupDropFile(function(json, password) {
        if (ethers.utils.getJsonWalletAddress(json)) {
            showLoading('解密账号...');
            App.cancelScrypt = false;

            ethers.Wallet.fromEncryptedJson(json, password, App.updateLoading).then(function(wallet) {
                App.setupWallet(wallet);
            }, function(error) {
                if (error.message === 'invalid password') {
                    alert('Wrong Password');
                } else {
                  alert('解密账号发生错误...');
                  console.log(error);
                }
                showAccout();
            });
        } else {
            alert('Unknown JSON wallet format');
        }
    });
  },

  initLoadKey:function(){
    var pk= ethers.utils.randomBytes(32);
    let randomNum = ethers.utils.bigNumberify(pk);

    var inputPrivatekey = $('#select-privatekey');
    inputPrivatekey.val(randomNum._hex);

    var submit = $('#select-submit-privatekey');
    submit.click(function(){
       var privateKey = inputPrivatekey.val();

       if (privateKey.substring(0, 2) !== '0x') { privateKey = '0x' + privateKey; }

       var wallet = new ethers.Wallet(privateKey);
       console.log(wallet);
       App.setupWallet(wallet);
    });
  },

  initMnemonic:function(){
    var rand = ethers.utils.randomBytes(16);
    var mnemonic =ethers.utils.HDNode.entropyToMnemonic(rand);

    var inputPhrase = $('#select-mnemonic-phrase');
    inputPhrase.val(mnemonic);

    function check() {
      if (ethers.utils.HDNode.isValidMnemonic(inputPhrase.val())){
         submit.removeClass('disable');
      }else {
        submit.addClass('disable');
      }
    }

    inputPhrase.on("input",check);

    var submit = $('#select-submit-mnemonic');
    var inputPath = $('#select-mnemonic-path');

    submit.click(function(){
      if(submit.hasClass('disable')) {return;}
      var wallet = ethers.Wallet.fromMnemonic(inputPhrase.val(),inputPath.val());
      console.log();
      App.setupWallet(wallet);
    });

  }
},

App.init();
