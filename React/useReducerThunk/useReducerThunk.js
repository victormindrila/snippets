import { useReducer } from 'react';

/**
 * thunk pattern for React.useReducer hook
 * 
 * @param {Reducer} reducer
 * @param {ReducerState} initialState 
 * @returns {[ReducerState, Dispatch]} state and async dispatch
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