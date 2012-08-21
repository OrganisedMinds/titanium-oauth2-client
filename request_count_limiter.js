var RequestCountLimiter = {};

(function() {

	var self         = RequestCountLimiter;
	var requests     = new Array();
	var stack        = new Array();
	var maxInstances = 3;

	self.add = function(request) {
		Ti.API.info("RequestCountLimiter.add()");
		if(isFull()) {
			pushToStack(request);
		} else {
			pushToLoop(request);
		}
	}

	self.checkState = function() {
		Ti.API.info("RequestCountLimiter.checkState()");
		if(!isDone()) {
			setTimeout(function() {
				emptyFinished();
				startWaitingRequests();
				self.checkState();
			}, 1000);
		}
		return false;
	}

	var isFull = function() {
		Ti.API.info("RequestCountLimiter.isFull()");
		return requests.length > maxInstances;
	}

	var isDone = function() {
		Ti.API.info("RequestCountLimiter.isDone()");
		var res = (requests.length == 0 && stack.length == 0);
		Ti.API.info("RequestCountLimiter.isDone() return " + res);
		return res;
	}

	
	var pushToStack = function(request) {
		Ti.API.info("RequestCountLimiter.pushToStack()");
		stack.push(request);

		return false;
	}

	var pushToLoop = function(request) {
		Ti.API.info("RequestCountLimiter.pushToLoop()");
		requests.push(request);
		if(isAuthPopupOpen()) {
			Ti.App.authorize(request.send);
		} else {
			request.wait();
		}

		return false;
	}

	var isAuthPopupOpen = function() {
		Ti.API.info("RequestCountLimiter.isAuthPopupOpen()");
		return Ti.App.authModule.isAuthPopupOpen();
	}

	var emptyFinished = function() {
		Ti.API.info("RequestCountLimiter.emptyFinished()");
		for(var i in requests) {
			if(requests[i].isDone()) {
				requests.splice(i, 1);
				if(stack.length > 0) {
					self.add(stack.pop());
				}
			}
		}

		return false;
	}

	var startWaitingRequests = function() {
		Ti.API.info("RequestCountLimiter.startWaitingRequests()");
		for(var i in requests) {
			if(requests[i].isWaiting()) {
				if(!isAuthPopupOpen()) {
					Ti.App.authorize(requests[i].send);
				}
			}
		}
	}

	return self;
})();