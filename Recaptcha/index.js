// WIP 
// recaptcha singleton

import { Listeners } from './Listeners'; 
import { ScriptLoader } from './ScriptLoader';

class Recaptcha {
	siteKey = null;
	instance = null;
	status = 'initial'; // initial, loading, loaded, error
	script = null;
	listeners = null;

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

		const scripts = document.getElementsByTagName('script');
		for (let i = 0; i < scripts.length; i++) {
			if (scripts[i].src.includes('recaptcha')) {
				scripts[i].remove();
			}
		}
	}

	onRecaptchaLoaded() {
		this.instance = window.grecaptcha;
		this.status = 'loaded';
		this.listeners.triggerEvent('recaptchaLoaded');
	}

	async getToken(action) {
		const token = await this.instance.execute(this.siteKey, { action });

		return token;
	}

	execute(action, retryOnFail = false) {
		if (this.status === 'initial') {
			throw new Error('Please init recaptcha before execute');
		}

		if (this.status === 'error') {
			throw new Error('Recaptcha script load error');
		}

		if (!this.instance) {
			throw new Error('Recaptcha not yet loaded');
		}

		return new Promise((resolve, reject) => {
			this.getToken(action)
				.then((token) => {
					resolve(token);
				})
				.catch((e) => {
					if (retryOnFail) {
						this.execute(action);
					} else {
						reject(e);
					}
				});
		});
	}

	async getRecaptchaHeaders(action, retryOnFail = false) {
		return {
			'g-recaptcha-response': await this.execute(action, retryOnFail)
		};
	}
}

export default new Recaptcha('site key');