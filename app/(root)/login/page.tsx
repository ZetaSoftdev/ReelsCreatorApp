"use client";
import { motion } from "framer-motion";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaGoogle } from "react-icons/fa";
import { signIn } from "@/auth";
import { login, loginWithCredentials } from "@/lib/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useLogoContext } from "@/context/LogoContext";

// Loading fallback for Suspense
const LoginFormLoading = () => (
  <div className="flex justify-center items-center min-h-screen">
    <p>Loading...</p>
  </div>
);

const LoginForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { branding } = useLogoContext();

    // Clear user data from localStorage when the page loads
    // especially if there's a logout parameter
    useEffect(() => {
        const clearUserData = () => {
            try {
                // Clear all potential user data from localStorage
                localStorage.removeItem('userData');
                localStorage.removeItem('clipsList');
                localStorage.removeItem('subtitlesList');
                localStorage.removeItem('processedClips');
                localStorage.removeItem('uploadedVideo');
                
                // Also clear sessionStorage just to be safe
                sessionStorage.clear();
                
                console.log("Cleared all user data from storage");
            } catch (error) {
                console.error("Error clearing storage:", error);
            }
        };
        
        // Always clear data on login page load
        clearUserData();
        
        // Check if this is coming from a logout
        const isLogout = searchParams.get('logout') === 'true';
        if (isLogout) {
            console.log("User logged out successfully");
        }
    }, [searchParams]);

    // Check if user is already logged in
    useEffect(() => {
        async function checkSession() {
            try {
                // Add cache-busting timestamp to prevent stale data
                const response = await fetch('/api/auth/session?ts=' + Date.now());
                const session = await response.json();
                
                if (session && session.user) {
                    // Redirect based on role from the server session
                    if (session.user.role === "ADMIN") {
                        router.push("/admin/dashboard");
                    } else {
                        router.push("/dashboard/home");
                    }
                    return;
                }
            } catch (err) {
                console.error("Error checking authentication:", err);
            } finally {
                setCheckingAuth(false);
            }
        }
        
        checkSession();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!email || !password) {
            setError("Please fill in all fields");
            setLoading(false);
            return;
        }

        try {
            const result = await loginWithCredentials(email, password);
            
            if (!result.success) {
                setError(result.error || "Failed to login");
                setLoading(false);
                return;
            }
            
            // Redirect based on role returned from server
            if (result.user) {
                console.log("Login successful, redirecting based on role:", result.user.role);
                
                // Add a timestamp to prevent caching and force a full page reload
                const timestamp = Date.now();
                
                // Use window.location.href instead of router.push() to force a full page reload
                if (result.user.role === "ADMIN") {
                    window.location.href = `/admin/dashboard?ts=${timestamp}`;
                } else {
                    window.location.href = `/dashboard/home?ts=${timestamp}`;
                }
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("An unexpected error occurred");
            setLoading(false);
        }
    };

    // Show loading state while checking auth
    if (checkingAuth) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen p-6">

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className=" p-8 rounded-xl shadow-2xl border border-gray-300/50 w-full max-w-md"
            >
                {/* Header */}
                <h1 className="text-2xl font-bold text-center">Log in to {branding.siteName}</h1>
                <p className="text-gray-400 text-center mt-2">
                    Create shareable clips in minutes. Free forever. No credit card required.
                </p>

                {/* Error message */}
                {error && (
                    <div className="mt-4 p-2 bg-red-100 text-red-600 rounded-lg text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    {/* Input Fields */}
                    <div className="mt-6 space-y-4">
                        {/* Email Input */}
                        <div className="flex items-center p-3 rounded-lg border border-gray-300/90">
                            <svg className="w-5 h-5 text-gray-600 mr-3" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 14H4V8l8 5 8-5zm-8-7L4 6h16z"
                                ></path>
                            </svg>
                            <input
                                type="email"
                                placeholder="Enter email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-transparent outline-none"
                                required
                            />
                        </div>

                        {/* Password Input */}
                        <div className="flex items-center p-3 rounded-lg border border-gray-300/90">
                            <svg className="w-5 h-5 text-gray-600 mr-3" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M21 10h-8.35C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H13l2 2 2-2 2 2 4-4.04zM7 15c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3"
                                ></path>
                            </svg>
                            <input
                                type="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-transparent outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 bg-purple-200 text-black font-bold py-3 rounded-lg shadow-lg hover:bg-purple-300 disabled:opacity-50"
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>

                {/* Already Have an Account? */}
                <p className="text-gray-500 text-center mt-4">
                Don't have an account?{" "}
                    <Link href="/sign-up" className="text-gray-800 hover:underline">
                        Create an account
                    </Link>
                </p>

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-center items-center text-sm">
                        <span className="bg-white px-2 text-center text-gray-600">or</span>
                    </div>
                </div>

                {/* Google Signup */}
                <button
                    className="w-full flex items-center justify-center bg-white text-black font-medium py-3 rounded-lg border border-gray-200 hover:shadow-md hover:border-gray-300"
                    onClick={() => login()}
                >
                    <FaGoogle className="mr-2" />
                    Login with Google
                </button>

                {/* ⭐ User Ratings */}
                <div className="mt-6 text-center flex justify-between items-center">
                <div className="flex -space-x-3">
                            <Image src="/azeem.jpg" width={45} height={45} className="rounded-full" alt="User 1" />
                            <Image src="/azeeem.jpg" width={45} height={45} className="rounded-full" alt="User 2" />
                            <Image src="/hasnain.jpg" width={45} height={45} className="rounded-full" alt="User 3" />
                        </div>
                    <div className="flex flex-col justify-center">
                        <div className="flex justify-center space-x-1 text-yellow-400">
                        {Array(5)
                            .fill(0)
                            .map((_, i) => (
                                <svg key={i} className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                                    ></path>
                                </svg>
                            ))}
                        <span className="text-gray-800 text-sm font-semibold">
                            4.9/5
                        </span>
                        </div>
                        <div>
                        <p className="text-gray-400">Used by +200,000 Creators</p>
                        </div>
                        
                    </div>
                    
                </div>

                {/* Terms & Privacy */}
                <p className="text-gray-600 text-base text-center mt-4">
                    By continuing, you agree to our{" "}
                    <Link href="/privacy" className="text-black hover:underline">
                        privacy policy
                    </Link>{" "}
                    and{" "}
                    <Link href="/terms" className="text-black hover:underline">
                        terms of service
                    </Link>.
                </p>
            </motion.div>
        </div>
    );
};

// Export a wrapper component with Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormLoading />}>
      <LoginForm />
    </Suspense>
  );
}
