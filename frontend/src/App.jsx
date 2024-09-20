import { Navigate, Route, Routes } from "react-router-dom";

import HomePage from "./pages/home/HomePage";
import SignUpPage from "./pages/auth/signup/SignUpPage";
import LoginPage from "./pages/auth/login/LoginPage";
import NotificationPage from "./pages/notification/NotificationPage";
import ProfilePage from "./pages/profile/ProfilePage";

import Sidebar from "./components/common/SideBar";
import RightPanel from "./components/common/RightPanel";

import { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import LoadingSpinner from "./components/common/LoadingSpinner";

function App() {
	const { data:authUser, isLoading } = useQuery({
		/*
			we use querykey to give a unique anme to our query and refer to it later
			이렇게 작성해두면 다른곳에 전체 코드를 쓸 필요 없이 queryKey: ['authUser']로 data:authUser를 쓸 수 있음 
		*/
		queryKey: ['authUser'], 
		queryFn: async () => {
			try {
				const res = await fetch("api/auth/auth-check");
				const data = await res.json();
				if (data.error) return null;
				if(!res.ok) {
					throw new Error(data.error || "Something went wrong");
				}
				console.log("auth user: ", data);
				return data;
			} catch (error) {
				throw error;
			}
		},
		// NOTE: 계속 401(Unauthorized)에러가 나와서 추가함
		retry: false, // 처음 인증을 체크하고, 실패 시 재시도 하지 않음.
	});

	if(isLoading) {
		return (
			<div className="h-screen flex justify-center items-center">
				<LoadingSpinner size="lg" />
			</div>
		)
	};

	
  return (
    <div className='flex max-w-6xl mx-auto'>
			{ authUser && <Sidebar />}
			<Routes>
				<Route path='/' element={authUser ? <HomePage /> : <Navigate to='/login' /> } />
				<Route path='/signup' element={!authUser ? <SignUpPage /> : <Navigate to='/' /> } />
				<Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to='/' /> } />
				<Route path='/notifications' element={authUser ? <NotificationPage /> : <Navigate to='/login' /> } />
				<Route path='/profile/:username' element={authUser ? <ProfilePage /> : <Navigate to='/login' /> } />
			</Routes>
			{ authUser && <RightPanel />}
			<Toaster />
		</div>
  )
}

export default App
