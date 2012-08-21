Ti.include('request.js');
Ti.include('request_count_limiter.js');

var AuthModule = {};

	(function() {

		var self = AuthModule;

		/* Private Variables *****/
		var clientId;
		var clientSecret;
		var redirectUri;
		var authServer;

		var osname       = Ti.Platform.getOsname();
		var TIME_RESERVE = 120; // sec
		var ui           = { open: false };
		var xhr;

		/* Public Methods *****/

		self.init = function(opts) {
			Ti.API.info('AuthModule.init()');
			clientId     = opts.client_id;
			clientSecret = opts.client_secret;
			redirectUri  = opts.redirect_uri;
			authServer   = opts.auth_server_url;

			return self;
		}

		self.authorize = function(callback) {
			Ti.API.info("AuthModule.authorize()");

			if(!Ti.App.Properties.getString('access_token')) {
				Ti.API.info("No access token saved.");
				getGrantCode(getGrantCodeUrl());
			} else if(isAccessTokenExpired()) {
				Ti.API.info("Access token expired.");
				if(isRefreshTokenRovoked()) {
					getGrantCode(getGrantCodeUrl());
				} else {
					refreshAccessToken();
				}
			} else {
				Ti.API.info("Access token expires in = " + accessTokenExpireIn());
				callback(getRequestHeader());
			}
		}

		self.isAuthPopupOpen = function() {
			Ti.API.info("AuthModule.isAuthPopupOpen()");
			var res = ui.open;
			Ti.API.info("AuthModule.isAuthPopupOpen() return " + res);
			return res;
		}

		/* Private Methods *****/

		var processRequests = function() {
			Ti.API.info('AuthModule.processRequests()');
		}

		var extract = function(what, hash) {
			Ti.API.info('AuthModule.extract()');
			var regex = new RegExp(what + '=(\\w+)', '');
			var match = hash.match(regex);
			return !!match && match[1];
		}

		var toSeconds = function(ms) {
			Ti.API.info('AuthModule.toSeconds()');
			return parseInt((ms / 1000).toFixed());
		}

		var isAccessTokenExpired = function() {
			Ti.API.info('AuthModule.isAccessTokenExpired()');
			var res = false;
			if(accessTokenExpireIn() <= 0) {
				res = true;
			}
			Ti.API.info('AuthModule.isAccessTokenExpired() return ' + res);
			return res;
		}

		var isRefreshTokenRovoked = function() {
			Ti.API.info('AuthModule.isRefreshTokenRovoked()');
			var res = Ti.App.Properties.getBool('refresh_token_revoked', false);
			Ti.API.info('AuthModule.isRefreshTokenRovoked() return ' + res);
			return res;
		}

		var accessTokenExpireIn = function() {
			Ti.API.info('AuthModule.accessTokenExpireIn()');
			var res = Ti.App.Properties.getDouble('expires_in') - toSeconds(new Date().valueOf());
			Ti.API.info('AuthModule.accessTokenExpireIn() return ' + res);
			return res;
		}

		var getGrantCodeUrl = function() {
			Ti.API.info('AuthModule.getGrantCodeUrl()');
			var url = String.format(authServer + 'oauth/authorize?response_type=code&client_id=%s&redirect_uri=%s',
				clientId,
				encodeURIComponent(redirectUri));
			Ti.API.info('AuthModule.getGrantCodeUrl() return ' + url);
			return url;
		}

		var initAuthPopup = function(url) {
			Ti.API.info('AuthModule.initAuthPopup()');
			ui = {};
			ui.authWin = Ti.UI.createWindow({
				navBarHidden: false,
				title: L('authorizing'),
				backgroundColor: 'white',
			});
			ui.view = createView();
			ui.closeLabel = createCloseLabel();
			ui.webView = createWebView(url);

			if(osname == 'android') {
				ui.webView.addEventListener('load', function(e) {
					extractGrantCode(e);
				});
			} else {
				ui.webView.addEventListener('error', function(e) {
					extractGrantCode(e);
				});
			}

			return false;
		}

		var showAuthPopup = function() {
			Ti.API.info('AuthModule.showAuthPopup()');
			ui.authWin.open();
			ui.view.add(ui.closeLabel);
			ui.view.add(ui.webView);
			ui.authWin.add(ui.view);
			ui.open = true;

			return false;
		}

		var closeAuthPopup = function() {
			Ti.API.info('AuthModule.closeAuthPopup()');
			ui.authWin.close();
			ui.open = false;

			return false;
		}

		var extractGrantCode = function(e) {
			Ti.API.info('AuthModule.extractGrantCode()');
			if(osname == 'android') {
				if(extract("code", e.url)) {
					grantCodeCallback(extract("code", e.url));
				}
			} else {
				if(extract("code", e.message)) {
					grantCodeCallback(extract("code", e.message));
				}
			}

			return false;
		}

		var getGrantCode = function(url) {
			Ti.API.info('AuthModule.getGrantCode()');
			initAuthPopup(url);

			showAuthPopup();

			return false;
		}

		var grantCodeCallback = function(grantCode) {
			Ti.API.info('AuthModule.grantCodeCallback()');
			getAccessToken(grantCode);

			return false;
		}

		var getAccessToken = function(grantCode) {
			Ti.API.info('AuthModule.getAccessToken()');
			if(!xhr) {
				xhr = Ti.Network.createHTTPClient();
			};

			dataToPost = getAccessTokenDataToPost(grantCode);

			xhr.open('POST',  authServer + 'oauth/token');

			xhr.onload = function(e) {
				accessTokenCallback(xhr.responseText);
			};

			xhr.onerror = function(e) {
				alert('error');
			};

			xhr.send(dataToPost);

			return false;
		}

		var refreshAccessToken = function() {
			Ti.API.info('AuthModule.refreshAccessToken()');
			if(!xhr) {
				xhr = Ti.Network.createHTTPClient();
			}

			dataToPost = getRefreshAccessTokenDataToPost();

			xhr.open('POST', authServer + 'oauth/token');

			xhr.onload = function(e) {
				Ti.App.Properties.setBool('refresh_token_revoked', true);
				accessTokenCallback(xhr.responseText);
			}

			xhr.onerror = function(e) {
				/* TODO: handle error */
				//getGrantCode(getGrantCodeUrl());
			}

			xhr.send(dataToPost);
		}

		var accessTokenCallback = function(responseText) {
			Ti.API.info('AuthModule.accessTokenCallback(): ' + responseText);
			closeAuthPopup();
			/* TODO: add "try catch" block */
			var responseHash = JSON.parse(responseText);
			Ti.App.Properties.setString('access_token', responseHash.access_token);
			Ti.App.Properties.setString('refresh_token', responseHash.refresh_token);
			Ti.App.Properties.setDouble('expires_in', toSeconds(new Date().valueOf()) + responseHash.expires_in - TIME_RESERVE);

			setRequestHeader();
			self.authorize(callbackFunc, extraData);
		}

		var getAccessTokenDataToPost = function(grantCode) {
			Ti.API.info('AuthModule.getAccessTokenDataToPost()');
			var result = {
				code:          grantCode,
				client_id:     clientId,
				client_secret: clientSecret,
				redirect_uri:  redirectUri,
				grant_type:    'authorization_code'
			}
			Ti.API.info('return ' + JSON.stringify(result));
			return result;
		}

		var getRequestHeader = function() {
			Ti.API.info('AuthModule.getRequestHeader()');
			return {
				requestHeader: {
					value: 'Bearer ' + Ti.App.Properties.getString('access_token'),
					name:  'Authorization'
				}
			}
		}

		var getRefreshAccessTokenDataToPost = function() {
			Ti.API.info('AuthModule.getRefreshAccessTokenDataToPost()');
			var result = {
				client_id:     clientId,
				client_secret: clientSecret,
				refresh_token: Ti.App.Properties.getString('refresh_token'),
				grant_type:    'refresh_token',
				redirect_uri:  redirectUri
			}
			Ti.API.info('return ' + JSON.stringify(result));
			return result;
		}

		var createView = function() {
			Ti.API.info('AuthModule.createView()');
			return Ti.UI.createView({
				top: 5,
				height: 450,
				border: 10,
				zIndex: -1,
				width: Ti.UI.FILL,
				heigth: Ti.UI.FILL
			});
		}

		var createCloseLabel = function() {
			Ti.API.info('AuthModule.createCloseLabel()');
			return Ti.UI.createLabel({
				textAlign: 'right',
				font: {
					fontWeight: 'bold',
					fontSize: 12
				},
				text: '(X)',
				top: 5,
				right: 20
			});
		}

		var createWebView = function(url) {
			Ti.API.info('AuthModule.createWebView()');
			return Ti.UI.createWebView({
				top: 25,
				width: Ti.UI.FILL,
				height: Ti.UI.FILL,
				url: url
			});
		}
	})();
