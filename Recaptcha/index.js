import { Listeners } from './utils/Listeners';
import { ScriptLoader } from './utils/ScriptLoader';

/**
 * WIP
 * recpatcha singleton
 * TODO: add TS, pass recaptcha key in init method, extract hardcoded values
 */
class Recaptcha {
	siteKey = null;
	instance = null;
	status = 'initial'; // initial, loading, loaded, error
	script = null;
	listeners = null;
	fnPromises = [];

	constructor(siteKey, scriptId = 'google-recaptcha-script') {
		this.siteKey = siteKey;
		this.listeners = new Listeners();
		this.script = new ScriptLoader({
			src: 'https://www.google.com/recaptcha/api.js?render=' + siteKey + '&onload=onRecaptchaLoaded',
			id: scriptId,
			async: true,
			defer: true,
			onCreateScript: () => {
				window.onRecaptchaLoaded = this.onRecaptchaLoaded.bind(this);
			}
		});
	}

	getInstanceAsync() {
		return new Promise((resolve, reject) => {
			if (this.status === 'loaded') {
				resolve(this.instance);
			} else {
				this.listeners.addEventListener('recaptchaLoaded', () => {
					resolve(this.instance);
				});
			}
		});
	}

	async init(retryOnFail = false) {
		if (this.instance || this.status !== 'initial') return;

		this.status = 'loading';

		await this.script.loadScript().catch((e) => {
			this.cleanRecaptcha();
			this.status = 'error';
			this.listeners.triggerEvent('recaptchaLoadError', e);

			if (retryOnFail) {
				this.init(false);
			}
		});

		return this.getInstanceAsync();
	}

	cleanRecaptcha() {
		this.rejectAllPendingActions();

		this.instance = null;
		this.status = 'initial';
		this.script.cleanScript();

		// clean other scripts
		const scripts = document.getElementsByTagName('script');
		for (let i = 0; i < scripts.length; i++) {
			if (scripts[i].src.includes('recaptcha')) {
				scripts[i].remove();
			}
		}
	}

	resolveAllPendingActions() {
		while (this.fnPromises.length > 0) {
			const fnPromise = this.fnPromises.shift();
			fnPromise.resolve();
		}
	}

	rejectAllPendingActions() {
		while (this.fnPromises.length > 0) {
			const fnPromise = this.fnPromises.shift();
			fnPromise.reject();
		}
	}

	onRecaptchaLoaded() {
		this.instance = window.grecaptcha;
		this.status = 'loaded';
		this.listeners.triggerEvent('recaptchaLoaded');
		this.resolveAllPendingActions();
	}

	async getToken(action) {
		const token = await this.instance.execute(this.siteKey, { action });

		return token;
	}

	execute(action, retryOnFail = false) {
		return new Promise((resolve, reject) => {
			let error;
			if (this.status === 'initial') {
				error = new Error('Please init recaptcha before execute');
			}
			if (!this.instance && this.status === 'error') {
				error = new Error('Recaptcha script load error');
			}
			if (error) {
				reject(error);
				return;
			}

			let _scriptLoadPromise;
			if (this.instance) {
				_scriptLoadPromise = Promise.resolve();
			} else {
				_scriptLoadPromise = new Promise((resolve, reject) => {
					setTimeout(() => reject('Recaptcha script load timeout'), 10000);

					this.fnPromises.push({
						resolve,
						reject
					});
				});
			}

			const _execute = () => {
				this.getToken(action)
					.then((token) => {
						resolve(token);
					})
					.catch((e) => {
						if (retryOnFail) {
							this.execute(action, false);
						} else {
							reject(e);
						}
					});
			};

			_scriptLoadPromise
				.then(() => {
					_execute();
				})
				.catch((e) => {
					// timeout error
					// throwing an error instead of retry, as the user will have to wait too much
					reject(e);
				});
		});
	}

	async getRecaptchaHeaders(action, retryOnFail = false) {
		// predefined headers to be appended to api calls
		return {
			'g-recaptcha-response': await this.execute(action, retryOnFail)
		};
	}
}

export default new Recaptcha('recaptcha key');