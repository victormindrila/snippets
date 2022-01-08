import { Dispatch, Reducer, ReducerAction, ReducerState, useReducer } from 'react';

const deserialize = (json: string | null): any => {
	if (!json) return null;
	let value: any;
	try {
		value = JSON.parse(json);
	} catch (error) {
		value = null;
	}

	return value;
};

const serialize = (data: any): string => {
	return JSON.stringify(data);
};

/**
 * 
 * @returns true if localStorage is available
 */
const testLs = (): boolean => {
	const test = 'test';
	try {
		localStorage.setItem(test, test);
		localStorage.removeItem(test);
		return true;
	} catch (e) {
		return false;
	}
};

const persistReducer = <S extends unknown, A extends unknown>(reducer: Reducer<any, any>, key?: string) => (
	state: S,
	action: A
): S => {
	const newState = reducer(state, action);
	testLs() && localStorage.setItem(key || 'state', serialize(newState));
	return newState;
};

const useReducerPersisted = <R extends Reducer<any, any>, I>(
	reducer: R,
	initialState: I,
	key?: string
): [ReducerState<R>, Dispatch<ReducerAction<R>>] => {
	const [ state, dispatch ] = useReducer(
		persistReducer<ReducerState<R>, ReducerAction<R>>(reducer, key),
		initialState,
		(initialState) => {
			const persistedState = testLs() && deserialize(localStorage.getItem(key || 'state'));

			return persistedState || initialState;
		}
	);

	return [ state, dispatch ];
};

export default useReducerPersisted;
