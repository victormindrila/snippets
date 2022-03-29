import recaptcha from '../'; 

const RecaptchaComponent = () => {
    const [instance, setInstance] = useState(null); 
    const [token, setToken] = useState(token); 

    useEffect(() => {
        // injects recaptcha script
        // returns the recaptcha instance
        recaptcha.init(true).then((instance) => {
            setInstance(instance); 
        }); 
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