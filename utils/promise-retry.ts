
interface Props<K> {
    promiseFn: (isRetry?: boolean) => Promise<K>;
    shouldRetry: (error?: any) => boolean;
    retryTimes?: number;
    delay?: number;
    isRetry?: boolean;
}

const wait = (delay: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, delay));

/**
 * Retries a promise for a defined number of times until it is successfully resolved.
 */

const promiseRetry = async <T>({
    promiseFn,
    shouldRetry,
    retryTimes = 2,
    delay = 0,
    isRetry = false
}: Props<T>): Promise<T> => {
    try {
        return await promiseFn(isRetry);
    } catch (e) {
        if (shouldRetry(e) && retryTimes > 1) {
            if (delay > 0) await wait(delay);

            return promiseRetry({
                promiseFn,
                shouldRetry,
                retryTimes: retryTimes - 1,
                delay,
                isRetry: true
            });
        }

        return Promise.reject(e);
    }
};