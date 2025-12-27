import { useState } from "react";
import { SignIn } from "../components/SignIn";
import { SignUp } from "../components/SignUp";

export function Authentication() {
  const [isSignUp, setIsSignUp] = useState(false); // false = Sign In, true = Sign Up

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      {/* Toggle Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setIsSignUp(false)}
          className={`px-4 py-2 rounded-md font-medium transition ${
            !isSignUp
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setIsSignUp(true)}
          className={`px-4 py-2 rounded-md font-medium transition ${
            isSignUp
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Render either Sign In or Sign Up */}
      {isSignUp ? (
        <SignUp onClose={() => setIsSignUp(false)} />
      ) : (
        <SignIn onClose={() => setIsSignUp(true)} />
      )}
    </div>
  );
}
