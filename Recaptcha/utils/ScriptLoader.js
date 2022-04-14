export class ScriptLoader {
	scriptElementRef = null;
	src = null;
	id = null;
	async = true;
	defer = true;
	onCreateScript = () => undefined;
	status = 'loading';

	createAndAppendScript() {
		const script = document.createElement('script');
		script.src = this.src;
		script.async = this.async;
		script.defer = this.defer;
		script.id = this.id;
		document.body.appendChild(script);
		return script;
	}

	loadScript({ src, id, async = true, defer = true, onCreateScript = () => undefined }) {
		this.src = src;
		this.id = id;
		this.async = async;
		this.defer = defer;
		this.onCreateScript = onCreateScript;

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
		this.scriptElementRef = script;

		return loadPromise;
	}

	cleanScript() {
		if (this.scriptElementRef) {
			this.scriptElementRef.remove();
			this.src = null;
			this.id = null;
			this.async = true;
			this.defer = true;
		}
	}
}
