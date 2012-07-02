var AuthModule = {};

	(function() {

		/*
		 * ===================================================================
		 * PUBLIC METHODS
		 * ===================================================================
		 */
		AuthModule.init = function(data) {
			AuthModule.clientId = data.client_id;
			AuthModule.clientSecret = data.client_secret;
			AuthModule.redirectUri = data.redirect_uri;
			AuthModule.authServer = data.auth_server_url;

			AuthModule.xhr = null;
			AuthModule.osname = Ti.Platform.getOsname();
		};

		AuthModule.authorize = function(authSuccessCallback, opts) {
			if(!Ti.App.Properties.getString('access_token')) {
				Ti.API.debug('No access token.');
				/* There's no access token yet. */
				/* User has to login and get grant code */
				AuthModule.openAuthorizationCodePopup(authSuccessCallback);
			} else if(AuthModule.isAccessTokenExpired()) {
				Ti.API.debug('Access token expired.');
				/* TODO: does not work as expected */
				/* There's an existing access token but it's expired */
				/* let's send refresh token and get new access_token */
				AuthModule.getAccessTokenWithRefreshToken(authSuccessCallback);
			} else {
				Ti.API.debug('Access token not expired. Ready to go.');
				/* There's an existing access token, and it's not expired */
				authSuccessCallback(true, opts);
			};
		};
		
		AuthModule.sendRequest = function(opts) {
			AuthModule.authorize(AuthModule.send, opts);
		};

		/*
		 * ===================================================================
		 * PRIVATE METHODS
		 * ===================================================================
		 */

		AuthModule.extract = function(what, hash) {
			var regex = new RegExp(what + '=(\\w+)', '');
			var match = hash.match(regex);
			return !!match && match[1];
		};

		AuthModule.send = function(success, opts) {
			if(success) {
				opts.xhr.setRequestHeader('Authorization', 'Bearer ' + Ti.App.Properties.getString('access_token'));
				opts.xhr.send(opts.data);
			};
		};

		AuthModule.openAuthorizationCodePopup = function(authSuccessCallback) {
			window = Ti.UI.createWindow({
				fullscreen: true,
			});
			var transform = Ti.UI.create2DMatrix().scale(0);
			view = Ti.UI.createView({
				top: 5,
				height: 450,
				border: 10,
				backgroundColor: 'white',
				borderColor: '#aaa',
				borderRadius: 20,
				borderWidth: 5,
				zIndex: -1,
				transform: transform,
				width: Ti.UI.FILL
			});
			closeLabel = Ti.UI.createLabel({
				textAlign: 'right',
				font: {
					fontWeight: 'bold',
					fontSize: '12pt'
				},
				text: '(X)',
				top: 5,
				right: 20
			});
			var url = String.format(AuthModule.authServer + 'oauth/authorize?response_type=code&client_id=%s&redirect_uri=%s',
				AuthModule.clientId,
				encodeURIComponent(AuthModule.redirectUri))

			window.open();
			webView = Ti.UI.createWebView({
				top: 25,
				width: Ti.UI.FILL,
				url: url
			});

			/* Let's look for grant code */
			webView.addEventListener('load', function(e) {
				if(AuthModule.extract("code", e.url)) {
					AuthModule.saveGrantCode(AuthModule.extract("code", e.url), authSuccessCallback);
				};
			});
			/* iPhone got error on redirection */
			webView.addEventListener('error', function(e) {
				if(AuthModule.extract("code", e.message)) {
					AuthModule.saveGrantCode(AuthModule.extract("code", e.message), authSuccessCallback);
				};
			});
        	view.add(webView);

        	/* TODO */
        	//closeLabel.addEventListener('click', destroyAuthUI);
        	view.add(closeLabel);

        	window.add(view);

        	var animation = Ti.UI.createAnimation();
        	animation.transform = Ti.UI.create2DMatrix();
        	animation.duration = 500;
        	view.animate(animation);
		};

		/* This method is called when user gets grand from auth server */
		AuthModule.gotGrantCallback = function(success,  authSuccessCallback) {
			if(success) {
				AuthModule.getAccessAndRefreshTokens(authSuccessCallback);
			} else {
				authSuccessCallback(false, 1000);
			};
		};

		/* This method is called when user gets access_token and refresh_token from auth server */
		AuthModule.gotTokensCallback = function(success, responseHash, authSuccessCallback) {
			if(success) {
				/* Save access token */
				Ti.App.Properties.setString('access_token', responseHash.access_token);
				/* Save refresh token */
				Ti.App.Properties.setString('refresh_token', responseHash.refresh_token);
				/* Set absolutely expires_in for access_token */
				Ti.App.Properties.setDouble('expires_in', new Date().valueOf() + responseHash.expires_in * 1000);
				/* Try to authorize user again with her access_token */
				AuthModule.authorize(authSuccessCallback);
			} else {
				authSuccessCallback(false, 1001);
			};
		};

		AuthModule.saveGrantCode = function(code,  authSuccessCallback) {
			Ti.App.Properties.setString('grant_code', code);
			Ti.API.debug('Setting grant_code to ' + code);
			AuthModule.gotGrantCallback(true, authSuccessCallback);
		};

		AuthModule.isAccessTokenExpired = function() {
			return (new Date().valueOf() > Ti.App.Properties.getDouble('expires_in'));
		};

		AuthModule.getAccessAndRefreshTokens = function(authSuccessCallback) {
			if(!AuthModule.xhr) {
				AuthModule.xhr = Ti.Network.createHTTPClient();
			};
			dataToPost = {
				code: Ti.App.Properties.getString('grant_code'),
				client_id: AuthModule.clientId,
				client_secret: AuthModule.clientSecret,
				redirect_uri: AuthModule.redirectUri,
				grant_type: 'authorization_code'
			};
			Ti.App.Properties.setString('grant_code', undefined);
			AuthModule.xhr.open('POST',  AuthModule.authServer + 'oauth/token');
			AuthModule.xhr.onload = function(e) {
				AuthModule.gotTokensCallback(true, JSON.parse(AuthModule.xhr.responseText),  authSuccessCallback);
			};
			AuthModule.xhr.onerror = function(e) {
				authSuccessCallback(false, AuthModule.xhr.status);
			};
			AuthModule.xhr.send(dataToPost);
		};

		AuthModule.getAccessTokenWithRefreshToken = function(authSuccessCallback) {
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
				var responseHash = JSON.parse(AuthModule.xhr.responseText);
				alert(AuthModule.xhr.responseText);
				/* Save new access token */
				Ti.App.Properties.setString('access_token', responseHash.access_token);
				/* Set absolutely expires_in for new access_token */
				Ti.App.Properties.setDouble('expires_in', new Date().valueOf() + responseHash.expires_in);
				/* Try to authorize user again with her new access_token */
				AuthModule.authorize(authSuccessCallback);
			};
			AuthModule.xhr.onerror = function(e) {
				Ti.API.debug(AuthModule.xhr.responseText);
				Ti.App.Properties.setString('access_token', undefined);
				Ti.App.Properties.setString('refresh_token', undefined);
				Ti.App.Properties.setDouble('expires_in', undefined);
				AuthModule.openAuthorizationCodePopup(authSuccessCallback);
			};
			AuthModule.xhr.send(dataToPost);
		};
	})();