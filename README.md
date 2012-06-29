= titanium-oauth2-client

Oauth 2.0 Client Module for Titanium Appcelerator Applications


titanium-oauth-2-client is still in development and it is sponsored and used by OrganisedMinds (http://organisedminds.com) - A super useful flexible tool for collaborating in teams and projects across geographic locations. Why don't you sign up there? It's free!

http://heidi-demo.organisedminds.com/images/OrganisedMinds.png

== How to use?

Getting module

	# git clone git://github.com/JiriChara/titanium-oauth2-client.git /your-project/Resources/lib/oauth_adapter

Setup in you app.js

	Ti.include('lib/oauth_adapter/auth_module.js');
	
	(function() {
		/* Initialize AuthModule */
		AuthModule.init(<YOUR_CLIENT_ID>, <REDIRECT_URI>, <YOUR_CLIENT_SECRET>);
		/* It will call main function with true parameter when user is authorized */
		AuthModule.authorize(main);
		
		function main(success) {
			/* If user is authorized */
			if(success) {
				// User has now an access to resources server
				// Do what ever you want
			} else {
				// User is not allowed to access resources server
			}
		};
	})();

