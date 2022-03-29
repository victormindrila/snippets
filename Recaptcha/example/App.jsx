import { render } from 'react-dom';
import RecaptchaComponent from './RecaptchaComponent';
import recaptcha from '../';

const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

const url = '#';

const App = () => {
    const handlePostApiWithRHeaders = async () => {
        const res = await (await fetch(url, {
            method: 'POST',
            headers: {
                ...defaultHeaders,
                // post request will be awaited until recaptcha is available
                ...(await recaptcha.getRecaptchaHeaders('action name'))
            },
            body: JSON.stringify({ user: 'john@doe.com' })
        })).json()
    }

    const handlePostApi = async () => {
        const token = await recaptcha.execute('action name', true);
        // will be executed after recaptcha executes
        const res = await (await fetch(url, {
            method: 'POST',
            headers: {
                ...defaultHeaders,
                'g-recaptcha-response': token

            },
            body: JSON.stringify({ user: 'john@doe.com' })
        })).json()
    }

    return (
        <div>
            <RecaptchaComponent />
            <button onClick={handlePostApiWithRHeaders}>Post api with recaptcha headers</button>
            <button onClick={handlePostApi}>Post api</button>
        </div>
    )
}


render(<App />, document.getElementById('root'));