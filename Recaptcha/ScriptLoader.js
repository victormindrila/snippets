class ScriptLoader {
	scriptElementRef = null;
	src = null;
	id = null;
	async = true;
	defer = true;
	onCreateScript = () => undefined;
	status = 'loading';

	constructor({ src, id, async = true, defer = true, onCreateScript = () => undefined }) {
		this.src = src;
		this.id = id;
		this.async = async;
		this.defer = defer;
		this.onCreateScript = onCreateScript;
	}

	createAndAppendScript() {
		const script = document.createElement('script');
		script.src = this.src;
		script.async = this.async;
		script.defer = this.defer;
		script.id = this.id;
		document.body.appendChild(script);
		return script;
	}

	loadScript() {
		let script;
		let loadPromise;

		script = document.getElementById(this.id);
		if (!script) {
			script = this.createAndAppendScript();
			this.onCreateScript();

			loadPromise = new Promise((resolve, reject) => {
				script.addEventListener('load', (e) => {
					this.status = 'loaded';
					script.setAttribute('data-status', 'loaded');
					resolve(e);
				});

				script.addEventListener('error', (e) => {
					this.status = 'error';
					script.setAttribute('data-status', 'loaded');
					reject(e);
				});
			});
		} else {
			loadPromise = Promise.resolve();
			this.status = script.getAttribute('data-status');
		}
		this.scriptRef = script;

		return loadPromise;
	}

	cleanScript() {
		if (this.script && this.script.scriptElementRef) {
			this.script.scriptElementRef.remove();
		}
	}
}