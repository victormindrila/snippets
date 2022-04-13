import { init as recaptchaInit } from '../';

const RecaptchaComponent = () => {
    const [instance, setInstance] = useState(null);
    const [token, setToken] = useState(token);

    useEffect(() => {
        // injects recaptcha script
        // returns the recaptcha instance
        recaptchaInit({
            siteKey: recaptchaSiteKey,
            retryOnFail: true,
            src:
                'https://www.google.com/recaptcha/api.js?render=' +
                recaptchaSiteKey +
                '&onload=onRecaptchaLoaded',
            id: 'recaptcha-script',
            async: true,
            defer: true
        }).then((instance) => {
            setInstance(instance);
        }).catch((error) => console.log(error));
    }, [])

    useEffect(() => {
        let interval = setInterval(() => {
            instance.execute('homePage').then((token) => setToken(token))
        }, [9000])

        return () => {
            clearInterval(interval);
        }
    }, [instance])

    return null;
}

export default RecaptchaComponent;