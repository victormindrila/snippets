import { useReducer } from 'react';

/**
 * thunk pattern for React.useReducer hook
 * 
 * @param {*} reducer
 * @param {*} initialState 
 * @returns state and async dispatch
 * @usage
 * ```
 * 
 * const asyncAction = async (dispatch) => {
 *  dispatch({ type: 'LOADING', payload: true });
 *  await fetch(url).then(data => data.json()).then(data => dispatch({ type: 'ADD_TODOS', payload: data}))
 *  dispatch({ type: 'LOADING', payload: true });
 * }
 * 
 * 
 * const App = () => {
 *  const [ state, dispatch ] = useReducerThunk(reducer, initialState);
 * 
 *  return <button onClick={asyncAction}>Load todos</button>
 * }
 * 
 * ```
 * 
 * TODO: add TS
 * 
 */

const useReducerThunk = (reducer, initialState) => {
	const [ state, dispatch ] = useReducer(reducer, initialState);

	const tweakedDispatch = (action) => {
		if (typeof action === 'function') {
			action(dispatch);
		} else {
			dispatch(action);
		}
	};

	return [ state, tweakedDispatch ]
};

export default useReducerThunk;