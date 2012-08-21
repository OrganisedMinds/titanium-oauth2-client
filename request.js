var Request = function(opts) {

	Ti.API.info('Request()');

	var self = this;
	self.xhr = Ti.Network.createHTTPClient();

	var ext       = opts.ext;
	var waiting   = false;
	var done      = false;
	var method    = opts.method;
	var url       = opts.url;

	self.wait = function() {
		Ti.API.info('Request.wait()');
		waiting = true;
		return false;
	}

	self.isWaiting = function() {
		Ti.API.info('Request.isWaiting() ' + waiting);
		return waiting;
	}

	self.isDone = function() {
		Ti.API.info('Request.isDone() ' + done);
		return done;
	}

	self.setAsDone = function() {
		Ti.API.info('Request.setDone()');
		done = true;

		return false;
	}

	self.send = function(opts) {
		Ti.API.info('Request.send()');
		self.xhr.open(method, url);
		self.xhr.setRequestHeader(opts.requestHeader.name, opts.requestHeader.value);
		self.xhr.send(ext);

		return false;
	}

	return self;
}