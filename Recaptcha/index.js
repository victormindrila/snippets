import { ScriptLoader } from './utils/ScriptLoader';
import mitt from 'mitt';

// TODO: import from utils when converting to TS
const promiseRetry = async ({
	promiseFn,
	shouldRetry = () => true,
	retries = 2,
	delay = 0,
	isRetry = false
}) => {
	try {
		return await promiseFn(isRetry);
	} catch (error) {
		if (shouldRetry(error) && retries > 1) {
			if (delay > 0) await new Promise((resolve, reject) => setTimeout(resolve, delay));
			return promiseRetry({
				promiseFn,
				shouldRetry,
				retries: retries - 1,
				delay,
				isRetry: true
			});
		}

		throw error;
	}
};

/**
 * WIP
 * recpatcha singleton
 * TODO: add TS, extract hardcoded values
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

	constructor() {
		this.handleOnCreateScript = this.handleOnCreateScript.bind(this);
		this.handleRecaptchaLoadError = this.handleRecaptchaLoadError.bind(this);
		this.handleRecaptchaLoad = this.handleRecaptchaLoad.bind(this);
		this.onRecaptchaLoadedCb = this.onRecaptchaLoadedCb.bind(this);

		this.emitter = mitt();
		this.script = new ScriptLoader();
	}

	onRecaptchaLoadedCb() {
		this.emitter.emit('recaptchaLoaded');
	}

	handleOnCreateScript() {
		window.onRecaptchaLoaded = this.onRecaptchaLoadedCb;
	}

	subscribe() {
		this.emitter.on('recaptchaLoaded', this.handleRecaptchaLoad);
		this.emitter.on('recaptchaLoadError', this.handleRecaptchaLoadError);
	}

	unsubscribe() {
		this.emitter.off('recaptchaLoaded', this.handleRecaptchaLoad);
		this.emitter.off('recaptchaLoadError', this.handleRecaptchaLoadError);
	}

	handleRecaptchaLoadError(e) {
		this.status = 'error';
		this.rejectAllPendingActions();
		this.cleanRecaptcha();
		this.unsubscribe();
	}

	handleRecaptchaLoad(e) {
		this.instance = window.grecaptcha;
		this.status = 'loaded';
		this.resolveAllPendingActions();
		this.unsubscribe();
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

	async init({ siteKey, src, id, async, defer, retryOnFail = false }) {
		if (this.instance) {
			return this.instance;
		}

		if (!siteKey) {
			throw new Error('Please provide a recaptcha site key');
		}

		this.siteKey = siteKey;

		if (this.status === 'initial') {
			this.status = 'loading';
			this.subscribe();

			await promiseRetry({
				promiseFn: (isRetry) => {
					if (isRetry) {
						this.cleanRecaptcha();
					}
					return this.script.loadScript({
						retryOnFail,
						src,
						id,
						async,
						defer,
						onCreateScript: this.handleOnCreateScript
					});
				},
				shouldRetry: (e) => retryOnFail && e.type === 'error',
				retries: 2,
				delay: 500
			}).catch((error) => {
				this.emitter.emit('recaptchaLoadError', error);
				throw error;
			});
		}

		if (this.status === 'loading') {
			await new Promise((resolve, reject) => {
				this.fnPromises.push({
					resolve: () => {
						resolve(this.instance);
					},
					reject
				});
			}).catch((error) => {
				throw error;
			});
		}

		return this.getInstanceAsync();
	}

	cleanRecaptcha() {
		this.rejectAllPendingActions();

		this.instance = null;
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

const recaptchaInstance = new Recaptcha();

export const init = async (props) => {
	if (typeof props !== 'object') {
		throw new Error('Please provide an object as init props');
	}
	return recaptchaInstance.init(props);
};

export default recaptchaInstance;