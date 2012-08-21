# titanium-oauth2-client

Oauth 2.0 Client Module for Titanium Appcelerator Applications

**titanium-oauth2-client** makes it really easy to integrate oauth 2.0 client into your Titanium Appcelerator application. It was tested with [Doorkeeper](https://github.com/applicake/doorkeeper) - awesome oauth provider for your Rails app, but it is still in development state (so expect some things to be broken). **Every help by contributors is cheerfully welcome!**

**titanium-oauth-2-client** is sponsored and used by [OrganisedMinds](http://organisedminds.com) - A super useful flexible tool for collaborating in teams and projects across geographic locations. Why don't you sign up there? It's free!

![OragnisedMinds logo](http://heidi-demo.organisedminds.com/images/OrganisedMinds.png)

## What is Oauth 2.0?

You can start here:
http://oauth.net/2/

and get complete specification here:
http://tools.ietf.org/html/draft-ietf-oauth-v2-28

This project is suited for [Doorkeeper](https://github.com/applicake/doorkeeper) OAuth 2.0 provider for Ruby on Rails.

## How to use it?

#### Getting module

```
git clone git://github.com/OrganisedMinds/titanium-oauth2-client.git /your-project/Resources/lib/oauth_adapter
```

#### Make a request to you API

```javascript
Ti.include('lib/auth_module.js');

/* Init Auth Module */
Ti.App.authModule = AuthModule.init({
  client_id:       "your_client_id",
  client_secret:   "your_client_secret",
  redirect_uri:    "http://your_redirect_uri:3000/",
  auth_server_url: "http://your_auth_server_url:3000/"
});

/* Create a request to your resource server */
var updateMyName = new Request({
	method: 'PUT',
	url:    'http://your_resource_server_url/personal/details',
	ext:    {
	  first_name: "Vito",
	  last_name:  "Corleone"
	}
});

/* Set your own onload and onerror methods */
updateMyName.xhr.onload = function(e) {
  // do something
  /* Set request as done */
  updateMyName.setAsDone();
}
updateMyName.xhr.error = function(e) {
  // do something
  /* Set request as done */
  updateMyName.setAsDone();
}

/* Send the request (this will start max. 3 clients and it will queue all other request till user is authorized */
RequestCountLimiter.add(updateMyName);
RequestCountLimiter.checkState();
```
## Contributing to titanium-oauth2-client

* Be sure you have Doorkeeper running and you registered your app
* Check out the latest develop to make sure the feature hasn’t been implemented or the bug hasn’t been fixed yet.
* Check out the issue tracker to make sure someone already hasn’t requested it and/or contributed it.
* Fork the project
* Start feature/bugfix branch
* Commit and push until you are happy with your contribution.
* Make a new pull request to OrganisedMinds develop branch

## Additional information

#### License
Copyright © 2012 Jiří Chára. See LICENSE.txt for further details.
