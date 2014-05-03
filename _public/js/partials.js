angular.module('partials', [])
.run(['$templateCache', function($templateCache) {
  return $templateCache.put('/partials/addresses.html', [
'',
'<h1 class="page-header">Addresses</h1>',
'<p>',
'  These are your Reddcoin addresses for sending payments.',
'  Always check the amount and the receiving address before sending coins.',
'</p>',''].join("\n"));
}])
.run(['$templateCache', function($templateCache) {
  return $templateCache.put('/partials/dashboard.html', [
'',
'<h1 class="page-header">Dashboard</h1>',''].join("\n"));
}])
.run(['$templateCache', function($templateCache) {
  return $templateCache.put('/partials/initialize.html', [
'',
'<h1><img src="reddcoin_logo.png" width="64" style="bottom: 5px;" class="reddcoin-icon">{{ loadingStatus }}</h1>',
'<p>{{ loadingStatusError }}</p>',''].join("\n"));
}])
.run(['$templateCache', function($templateCache) {
  return $templateCache.put('/partials/nav.html', [
'',
'<ul class="nav nav-sidebar">',
'  <li ng-class="getClass(\'/dashboard\')"><a ng-href="#/dashboard">Dashboard</a></li>',
'  <li ng-class="getClass(\'/send\')"><a ng-href="#/send">Send</a></li>',
'  <li ng-class="getClass(\'/receive\')"><a ng-href="#/receive">Receive</a></li>',
'  <li ng-class="getClass(\'/transactions\')"><a ng-href="#/transactions">Transactions</a></li>',
'  <li ng-class="getClass(\'/addresses\')"><a ng-href="#/addresses">Addresses</a></li>',
'</ul>',''].join("\n"));
}])
.run(['$templateCache', function($templateCache) {
  return $templateCache.put('/partials/receive.html', [
'',
'<h1 class="page-header">Receive</h1>',
'<p>',
'  These are your Reddcoin addresses for receiving payments.',
'  You may want to give a different one to each sender so you can keep track of who is paying you.',
'</p>',
'<table class="table">',
'  <thead>',
'    <tr>',
'      <th>Label</th>',
'      <th>Balance</th>',
'      <th>Address</th>',
'    </tr>',
'  </thead>',
'  <tbody>',
'    <tr ng-repeat="account in wallet.accounts">',
'      <td>{{ account.label }}<em ng-show="account.label==\'\'">Blank</em></td>',
'      <td>{{ account.balance }}</td>',
'      <td>{{ account.address }}</td>',
'    </tr>',
'  </tbody>',
'</table>',''].join("\n"));
}])
.run(['$templateCache', function($templateCache) {
  return $templateCache.put('/partials/send.html', [
'',
'<h1 class="page-header">Send</h1>',
'<p>',
'  You can send Reddcoin to any address from here, or choose one from your address list.',
'  Always check the amount and the receiving address before sending coins.',
'</p><hr>',
'<form class="form-horizontal">',
'  <div class="form-group">',
'    <label class="col-sm-3 control-label">Address</label>',
'    <div class="col-sm-9">',
'      <input ng-model="send.address" class="form-control">',
'    </div>',
'  </div>',
'  <div class="form-group">',
'    <label class="col-sm-3 control-label">Amount</label>',
'    <div class="col-sm-9">',
'      <input ng-model="send.amount" class="form-control">',
'    </div>',
'  </div>',
'  <div class="form-group">',
'    <label class="col-sm-3 control-label">Your Comment</label>',
'    <div class="col-sm-9">',
'      <input ng-model="send.payerComment" class="form-control">',
'    </div>',
'  </div>',
'  <div class="form-group">',
'    <label class="col-sm-3 control-label">Their Comment</label>',
'    <div class="col-sm-9">',
'      <input ng-model="send.payeeComment" class="form-control">',
'    </div>',
'  </div>',
'  <div class="form-group">',
'    <div class="col-sm-9 col-sm-offset-3">',
'      <button ng-click="confirmSend()" class="btn btn-primary pull-right">Send</button>',
'    </div>',
'  </div>',
'</form>',''].join("\n"));
}])
.run(['$templateCache', function($templateCache) {
  return $templateCache.put('/partials/transactions.html', [
'',
'<h1 class="page-header">Transactions</h1>',
'<p>',
'  This is a list of all transactions that have taken place.',
'  Double click on a transaction to bring up more information.',
'</p>',''].join("\n"));
}]);