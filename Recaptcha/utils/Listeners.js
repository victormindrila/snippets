export class Listeners {
	listeners = {};

	addEventListener(eventName, callback) {
		if (!this.listeners[eventName]) {
			this.listeners[eventName] = [];
		}
		this.listeners[eventName].push(callback);
	}

	triggerEvent(eventName) {
		if (this.listeners[eventName]) {
			this.listeners[eventName].forEach((callback) => {
				callback();
			});
		}
	}
}