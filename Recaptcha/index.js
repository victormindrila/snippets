import { ScriptLoader } from './utils/ScriptLoader';
import mitt from 'mitt';

/**
 * WIP
 * recpatcha singleton
 * TODO: add TS, pass recaptcha key in init method, extract hardcoded values
 */
class Recaptcha {
	siteKey = null;
	instance = null;
	/**
	 * @states initial, loading, loaded, error
	 */
	status = 'initial';
	script = null;
	emitter = null;
	fnPromises = [];

	constructor(siteKey, scriptId = 'google-recaptcha-script') {
		this.handleOnCreateScript = this.handleOnCreateScript.bind(this);
		this.handleRecaptchaLoadError = this.handleRecaptchaLoadError.bind(this);
		this.handleRecaptchaLoad = this.handleRecaptchaLoad.bind(this);

		this.siteKey = siteKey;
		this.emitter = mitt();
		this.script = new ScriptLoader({
			src:
				'https://www.google.com/recaptcha/api.js?render=' + siteKey + '&onload=onRecaptchaLoaded',
			id: scriptId,
			async: true,
			defer: true,
			onCreateScript: this.handleOnCreateScript
		});

		this.emitter.on('recaptchaLoaded', this.handleRecaptchaLoad);
		this.emitter.on('recaptchaLoadError', this.handleRecaptchaLoadError);
	}

	handleOnCreateScript() {
		window.onRecaptchaLoaded = () => {
			this.emitter.emit('recaptchaLoaded')
		};
	}

	handleRecaptchaLoadError(e) {
		this.status = 'error';
		this.rejectAllPendingActions();
		this.cleanRecaptcha();
		this.emitter.off('recaptchaLoadError', this.handleRecaptchaLoadError);
	}

	handleRecaptchaLoad(e) {
		this.instance = window.grecaptcha;
		this.status = 'loaded';
		this.resolveAllPendingActions();
		this.emitter.off('recaptchaLoaded', this.handleRecaptchaLoad);
	}

	getInstanceAsync() {
		return new Promise((resolve, reject) => {
			const resolveImmediately = () => {
				resolve(this.instance);
			};

			const resolveAsync = () => {
				resolve(this.instance);
				this.emitter.off('recaptchaLoaded', resolveAsync);
			};

			if (this.status === 'loaded') {
				resolveImmediately();
			} else {
				this.emitter.on('recaptchaLoaded', resolveAsync);
			}
		});
	}

	async init(retryOnFail = false) {
		if (!this.instance && this.status === 'initial') {
			this.status = 'loading';

			await this.script.loadScript().catch((e) => {
				if (retryOnFail) {
					return this.init(false);
				} else {
					this.emitter.emit('recaptchaLoadError', e);
					return Promise.reject(e);
				}
			});
		}

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