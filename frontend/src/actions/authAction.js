import axios from 'axios';
import { browserHistory } from 'react-router';
import querystring from 'query-string';
import store from '../store';
import { setToken, removeToken, getToken } from '../utils/token';

export function getEmail(data) {
	localStorage.setItem('email', data);
	return (dispatch) => {
		dispatch({ type: 'USER_EMAIL', payload: data });
	};
}

export function checkVerificationCode(data) {
	return (dispatch) => {
		dispatch({ type: 'CHECK_VERIFICATION_CODE_PENDING' });
		axios
			.get(`/verify?${querystring.stringify(data)}`)
			.then((response) => {
				dispatch({
					type: 'CHECK_VERIFICATION_CODE_FULFILLED',
					payload: { ...response.data, ...data },
				});
			})
			.catch((error) => {
				dispatch({
					type: 'CHECK_VERIFICATION_CODE_REJECTED',
					payload: error.response.data,
				});
			});
	};
}

export function verifyVerificationCode(data) {
	return (dispatch) => {
		dispatch({ type: 'VERIFY_VERIFICATION_CODE_PENDING' });
		axios
			.post('/verify', data)
			.then((response) => {
				dispatch({
					type: 'VERIFY_VERIFICATION_CODE_FULFILLED',
					payload: response.data,
				});
			})
			.catch((error) => {
				dispatch({
					type: 'VERIFY_VERIFICATION_CODE_REJECTED',
					payload: error.response.data,
				});
			});
	};
}

export const performLogin = (values) => {
	// 演示登录系统 - Demo Login System
	const DEMO_ACCOUNTS = [
		{
			email: 'admin@demo.com',
			password: 'Admin123!',
			role: 'admin',
			name: 'Demo Admin',
			id: 1
		},
		{
			email: 'user@demo.com',
			password: 'User123!',
			role: 'user',
			name: 'Demo User',
			id: 2
		}
	];
	
	// 检查是否是演示账号
	const demoAccount = DEMO_ACCOUNTS.find(
		account => account.email === values.email && account.password === values.password
	);
	
	if (demoAccount) {
		// 模拟成功登录响应
		const mockToken = `demo_token_${demoAccount.id}_${Date.now()}`;
		const mockResponse = {
			data: {
				token: mockToken,
				user: {
					id: demoAccount.id,
					email: demoAccount.email,
					username: demoAccount.name,
					role: demoAccount.role
				}
			}
		};
		
		// 存储演示用户信息
		localStorage.setItem('demo_user', JSON.stringify(demoAccount));
		localStorage.setItem('is_demo_mode', 'true');
		
		storeLoginResult(mockToken);
		return Promise.resolve(mockResponse);
	}
	
	// 如果不是演示账号，尝试真实登录
	return axios.post('/login', values).then((res) => {
		localStorage.removeItem('is_demo_mode');
		localStorage.removeItem('demo_user');
		storeLoginResult(res.data.token);
		return res;
	});
};

export const performGoogleLogin = (values) =>
	axios.post('/login/google', values).then((res) => {
		return res;
	});

export const storeLoginResult = (token) => {
	if (token) {
		setTokenInApp(token, true);
		store.dispatch({
			type: 'VERIFY_TOKEN_FULFILLED',
			payload: token,
		});
	}
};

export const performSignup = (values) => axios.post('/signup', values);
export const performGoogleSignup = (values) =>
	axios.post('/signup/google', values);

const setTokenInApp = (token, setInStore = false) => {
	axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
	if (setInStore) {
		setToken(token);
	}
};

const clearTokenInApp = (router, path = '/') => {
	axios.defaults.headers.common['Authorization'] = {};
	removeToken();
	localStorage.removeItem('deposit_initial_display');
	router.push(path);
};

export function verifyToken(token) {
	return (dispatch) => {
		dispatch({ type: 'VERIFY_TOKEN_PENDING' });
		setTokenInApp(token);
		dispatch({
			type: 'VERIFY_TOKEN_FULFILLED',
			payload: token,
		});
	};
}

export const logout = (message = '') => (dispatch) => {
	dispatch({
		type: 'LOGOUT',
		payload: {
			message,
		},
	});
	requestLogout();
	clearTokenInApp(browserHistory, '/login');
};

export const requestLogout = () => axios.get('/logout');

export const setLogoutMessage = (message = '') => ({
	type: 'SET_LOGOUT_MESSAGE',
	payload: {
		message,
	},
});

export function loadToken() {
	let token = getToken();
	return {
		type: 'LOAD_TOKEN',
		payload: token,
	};
}

export const requestVerificationEmail = (data) =>
	axios.get(`/verify?${querystring.stringify({ ...data, resend: true })}`);

export const requestResetPassword = (values) => {
	const qs = querystring.stringify(values);
	return axios.get(`/reset-password?${qs}`);
};

export const resetPassword = (data) => axios.post('/reset-password', data);

export const storeAdminKey = (data) =>
	axios.put('/admin/network-credentials', data);

export const adminSignup = (data) => axios.post('/admin/signup', data);

export const adminLogIn = (data) => axios.post('/login ', data);
