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
	recaptchaLoadTimeoutId;

	constructor(siteKey, scriptId = 'google-recaptcha-script') {
		this.siteKey = siteKey;
		this.listeners = new Listeners();
		this.script = new ScriptLoader({
			src: 'https://www.google.com/recaptcha/api.js?render=' + siteKey + '&onload=onRecaptchaLoaded',
			id: scriptId,
			async: true,
			defer: true,
			onCreateScript: () => {
				this.recaptchaLoadTimeoutId = setTimeout(() => {
					 this.listeners.triggerEvent('recaptchaLoadError', 'Failed to load');
				}, 10000)

				window.onRecaptchaLoaded = this.onRecaptchaLoaded.bind(this) 
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

		await this.script.loadScript().catch((e) => {
			this.cleanRecaptcha();
			this.status = 'error';

			if (retryOnFail) {
				this.init(false);
			}
		});

		return this.getInstanceAsync();
	}

	cleanRecaptcha() {
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

	onRecaptchaLoaded() {
		clearTimeout(this.recaptchaLoadTimeoutId); // clear failed to load timeout

		this.instance = window.grecaptcha;
		this.status = 'loaded';
		this.listeners.triggerEvent('recaptchaLoaded');
	}

	async getToken(action) {
		const token = await this.instance.execute(this.siteKey, { action });

		return token;
	}

	execute(action, retryOnFail = false) {
		return new Promise((resolve, reject) => {
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
			}

			const _loadPromise = () => new Promise((resolve, reject) => {
				this.listeners.addEventListener('recaptchaLoadError', (error) => {
					// timeout error 
					reject(error);
				})

				this.listeners.addEventListener('recaptchaLoaded', () => {
					resolve(); 
				})
			})

			let error;
			if (this.status === 'initial') {
				error = new Error('Please init recaptcha before execute');
			}

			if (!this.instance && this.status === 'error') {
				error = new Error('Recaptcha script load error');
			}

			if (error) reject(error);

			if (!this.instance) {
				_loadPromise()
					.then(() => {
						_execute();
					})
					.catch((e) =>{
						// timeout error
						// throwing an error instead of retry, as the user will have to wait too much
						 reject(e)
					})
			} else {
				_execute();
			}
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