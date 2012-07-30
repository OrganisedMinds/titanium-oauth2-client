 var AuthModule = {};

	(function() {
		
		var that = AuthModule;

		var ERROR_GRANT_CODE   = 1000;
		var ERROR_ACCESS_TOKEN = 1001;

		var TIME_RESERVE       = 10; // sec

		/*
		 * ===================================================================
		 * PUBLIC METHODS
		 * ===================================================================
		 */
		that.init = function(opts) {
			that.clientId     = opts.client_id;
			that.clientSecret = opts.client_secret;
			that.redirectUri  = opts.redirect_uri;
			that.authServer   = opts.auth_server_url;

			that.xhr = null;
			that.osname = Ti.Platform.getOsname();
		};

		that.authorize = function(authSuccessCallback, opts) {

			that.opts = opts;

			if(!Ti.App.Properties.getString('access_token')) {
				Ti.API.debug('No access token.');
				/* There's no access token yet. */
				/* User has to login and get grant code */
				that.openAuthorizationCodePopup(authSuccessCallback);
			} else if(isAccessTokenExpired()) {
				Ti.API.debug('Access token expired.');
				Ti.API.debug('expires_in = ' + Ti.App.Properties.getDouble('expires_in') + ' sec');
				var timeNow = (toSeconds(new Date().valueOf()));
				Ti.API.debug('Time now is ' + timeNow + ' sec');
				Ti.API.debug('Access token expired for ' + (Ti.App.Properties.getDouble('expires_in') - timeNow) + ' sec');
				/* There's an existing access token but it's expired */
				/* let's send refresh token and get new access_token */
				that.getAccessTokenWithRefreshToken(authSuccessCallback);
			} else {
				Ti.API.debug('Access token not expired.');
				Ti.API.debug('access_token = ' + Ti.App.Properties.getString('access_token'));
				Ti.API.debug('refresh_token = ' + Ti.App.Properties.getString('refresh_token'));
				var timeNow = (new Date().valueOf() / 1000).toFixed();
				Ti.API.debug('expires_in = ' + Ti.App.Properties.getDouble('expires_in') + ' sec');
				Ti.API.debug('Time now is ' + timeNow + ' sec');
				Ti.API.debug('Access token still valid for ' + (Ti.App.Properties.getDouble('expires_in') - timeNow) + ' sec');
				/* There's an existing access token, and it's not expired */
				authSuccessCallback(true, AuthModule.opts);
			};
		};

		/*
		 * ===================================================================
		 * PRIVATE METHODS
		 * ===================================================================
		 */

		var extract = function(what, hash) {
			var regex = new RegExp(what + '=(\\w+)', '');
			var match = hash.match(regex);
			return !!match && match[1];
		};

		/* This method is called when user gets grand from auth server */
		var gotGrantCallback = function(success,  authSuccessCallback) {
			Ti.API.debug('gotgrantCallback()');
			if(success) {
				getAccessAndRefreshTokens(authSuccessCallback);
			} else {
				authSuccessCallback(false, ERROR_GRANT_CODE);
			};
		};

		/* This method is called when user gets access_token and refresh_token from auth server */
		var gotTokensCallback = function(success, responseHash, authSuccessCallback) {
			Ti.API.debug('gotTokensCallback()');
			if(success) {
				/* Save access token */
				Ti.App.Properties.setString('access_token', responseHash.access_token);
				/* Save refresh token */
				Ti.App.Properties.setString('refresh_token', responseHash.refresh_token);
				/* Set absolutely expires_in for access_token */
				Ti.App.Properties.setDouble('expires_in', toSeconds(new Date().valueOf()) + responseHash.expires_in - TIME_RESERVE);
				Ti.API.debug("expires_in = " + Ti.App.Properties.getDouble('expires_in'));
				/* Try to authorize user again with her access_token */
				that.authorize(authSuccessCallback);
			} else {
				authSuccessCallback(false, ERROR_ACCESS_TOKEN);
			};
		};

		/* Save grant code and call gotGrantCallback() */
		var saveGrantCode = function(code,  authSuccessCallback) {
			Ti.API.debug('saveGrantCode()');
			Ti.App.Properties.setString('grant_code', code);
			Ti.API.debug('Setting grant_code to ' + code);
			gotGrantCallback(true, authSuccessCallback);
		};

		/* Check if access token is still valid */
		var isAccessTokenExpired = function() {
			Ti.API.debug('isAccessTokenExpired()');
			return (toSeconds(new Date().valueOf()) > Ti.App.Properties.getDouble('expires_in'));
		};
		
		var toSeconds = function(ms) {
			Ti.API.debug('toSeconds()');
			return parseInt((ms / 1000).toFixed());
		};

		var getAccessAndRefreshTokens = function(authSuccessCallback) {
			Ti.API.debug('getAccessAndRefreshTokens()');
			if(!that.xhr) {
				that.xhr = Ti.Network.createHTTPClient();
			};
			dataToPost = {
				code: Ti.App.Properties.getString('grant_code'),
				client_id: AuthModule.clientId,
				client_secret: AuthModule.clientSecret,
				redirect_uri: AuthModule.redirectUri,
				grant_type: 'authorization_code'
			};
			Ti.API.debug('dataToPost = ' + JSON.stringify(dataToPost));
			Ti.App.Properties.setString('grant_code', undefined);
			that.xhr.open('POST',  that.authServer + 'oauth/token');
			that.xhr.onload = function(e) {
				gotTokensCallback(true, JSON.parse(AuthModule.xhr.responseText),  authSuccessCallback);
			};
			that.xhr.onerror = function(e) {
				authSuccessCallback(false, ERROR_ACCESS_TOKEN);
			};
			that.xhr.send(dataToPost);
		};

		AuthModule.getAccessTokenWithRefreshToken = function(authSuccessCallback) {
			Ti.API.debug('Refreshing access token.');
			if(!AuthModule.xhr) {
				AuthModule.xhr = Ti.Network.createHTTPClient();
			};
			dataToPost = {
				client_id: AuthModule.clientId,
				client_secret: AuthModule.clientSecret,
				refresh_token: Ti.App.Properties.getString('refresh_token'),
				grant_type: 'refresh_token',
				redirect_uri: AuthModule.redirectUri
			};
			AuthModule.xhr.open('POST', AuthModule.authServer + 'oauth/token');

			AuthModule.xhr.onload = function(e) {
				Ti.API.debug('responseText =' + AuthModule.xhr.responseText);
				var responseHash = JSON.parse(AuthModule.xhr.responseText);
 				/* Save new access token */
				Ti.App.Properties.setString('access_token', responseHash.access_token);
				Ti.API.debug("Setting access_token to " + responseHash.access_token);
				/* Save new access token */
				Ti.App.Properties.setString('refresh_token', responseHash.refresh_token);
				Ti.API.debug("Setting refresh_token to " + responseHash.refresh_token);
				/* Set absolutely expires_in for new access_token */
				Ti.App.Properties.setDouble('expires_in', toSeconds(new Date().valueOf()) + responseHash.expires_in);
				Ti.API.debug("Setting expires_in to " + toSeconds(new Date().valueOf()) + responseHash.expires_in);
				/* Try to authorize user again with her new access_token */
				AuthModule.authorize(authSuccessCallback);
			};
			AuthModule.xhr.onerror = function(e) {
				Ti.API.debug(AuthModule.xhr.responseText);
				Ti.App.Properties.setString('access_token', undefined);
				Ti.App.Properties.setString('refresh_token', undefined);
				Ti.App.Properties.setDouble('expires_in', null);
				AuthModule.openAuthorizationCodePopup(authSuccessCallback);
			};
			AuthModule.xhr.send(dataToPost);
		};
	
		AuthModule.openAuthorizationCodePopup = function(authSuccessCallback) {
			var authWin = Ti.UI.createWindow({
				navBarHidden: false,
				title: L('authorizing'),
				backgroundColor: 'white',
			});
			view = Ti.UI.createView({
				top: 5,
				height: 450,
				border: 10,
				zIndex: -1,
				width: Ti.UI.FILL,
				heigth: Ti.UI.FILL
			});
			closeLabel = Ti.UI.createLabel({
				textAlign: 'right',
				font: {
					fontWeight: 'bold',
					fontSize: 12
				},
				text: '(X)',
				top: 5,
				right: 20
			});
			var url = String.format(AuthModule.authServer + 'oauth/authorize?response_type=code&client_id=%s&redirect_uri=%s',
				AuthModule.clientId,
				encodeURIComponent(AuthModule.redirectUri))

			authWin.open();
			webView = Ti.UI.createWebView({
				top: 25,
				width: Ti.UI.FILL,
				height: Ti.UI.FILL,
				url: url
			});

			/* Let's look for grant code */
			webView.addEventListener('load', function(e) {
				if(extract("code", e.url)) {
					view.remove(webView);
					loader = Ti.UI.createLabel({
						text: L('loading')
					});
					view.add(loader);
					saveGrantCode(extract("code", e.url), authSuccessCallback);
				};
			});
			/* iPhone got error on redirection */
			webView.addEventListener('error', function(e) {
				if(extract("code", e.message)) {
					saveGrantCode(extract("code", e.message), authSuccessCallback);
				};
			});
        	view.add(webView);

        	/* TODO */
        	//closeLabel.addEventListener('click', destroyAuthUI);
        	view.add(closeLabel);

        	authWin.add(view);

        	var animation = Ti.UI.createAnimation();
        	animation.transform = Ti.UI.create2DMatrix();
        	animation.duration = 500;
        	view.animate(animation);
		};
	})();