import { SignUp } from '@clerk/clerk-react';

export default function Signup() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-cyan-500 to-indigo-700 flex items-center justify-center px-4 py-12">
      <SignUp
        signInUrl="/login"
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
