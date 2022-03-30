import { render } from 'react-dom';
import { useReducerThunk } from '../useReducerThunk';

const reducer = (state, action) => {
    switch (action.type) {
        case "loading":
            return {
                ...state,
                loading: action.payload
            };
        case "addTodos":
            return {
                ...state,
                todos: [...action.payload],
                loading: false
            };
        default:
            return state;
    }
};

const initialState = {
    todos: [],
    loading: false
};

const loadingTodos = (payload) => {
    return {
        type: 'loading',
        payload
    }
}

const fetchTodos = () => async (dispatch) => {
    dispatch(loadingTodos(true));

    const todos = await (
        await fetch("https://jsonplaceholder.typicode.com/todos")
    ).json();

    dispatch(loadingTodos(false));

    dispatch({
        type: "addTodos",
        payload: todos
    });
};

const Todos = ({ items }) => todos.map((todo) => (
    <p>{JSON.stringify(todo)}</p>
))


const App = () => {
    const [{ todos, loading }, dispatch] = useReducerThunk(reducer, initialState);

    const handleButtonClick = () => {
        dispatch(fetchTodos())
    }

    if (loading) {
        return <p>loading</p>;
    }
    
    return (
        <div className="App">
            <button onClick={handleButtonClick}>fetch todos</button>
            <Todos items={todos} />
        </div>
    );
}

render(<App />, document.getElementById('root')); 
