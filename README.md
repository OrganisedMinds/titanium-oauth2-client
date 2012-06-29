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

#### Use it in you app.js

```javascript
Ti.include('lib/oauth_adapter/auth_module.js');

(function() {
  /* Initialize AuthModule */
  AuthModule.init({
    client_id: <YOUR_CLIENT_ID>,
    client_secret: <YOUR_CLIENT_SECRET>),
    redirect_uri: <REDIRECT_URI>,
    resource_server_url: <YOUR_RESOURCE_SERVER_URL> // with slash on the end
  });
  /* It will call main function with true parameter when user is authorized */
  AuthModule.authorize(main);
  
  function main(success, err) {
    /* If user is authorized */
    if(success) {
      // Do what ever you want! User has access to your resource server
    } else {
      // User is not allowed to access resources server
      alert(err);
    }
  };
})();
```

#### Make a request to you API

```javascript
/* Create a client */
var xhr = Ti.Network.createHTTPClient();

xhr.open('PUT', 'http://yourapi.com/personal/details/');
/* Prepare for response */
xhr.onload = function() {
  /* tada! */
};
xhr.onerror = function() {
  /* when things go wrong */
};

/* Update your name for instance */
data = {
  first_name: "Vito",
  last_name: "Corleone"
};

/* This will send request to your API including access_token */
AuthModule.sendRequest({xhr: xhr, data: data});

/* If you want to call your own function which interacts with protected
 * resources, than do easily like this:
 */

function doSomethingOnApi(success, err) {
  if(success) {
    // you have permitions
  } else {
    // you have no permitions
    alert(err);
  }
};
/* You can than call it like this: */
AuthModule.authorize(doSomethingOnApi);
```

Variable err will be filled up with standard HTTP status code of failure.
http://en.wikipedia.org/wiki/List_of_HTTP_status_codes
or
* 1000 = cannot get grant code
* 1001 = cannot get access token and refresh token
We gona improve error handling soon.

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
