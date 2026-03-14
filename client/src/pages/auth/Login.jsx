import { SignIn } from '@clerk/clerk-react';

export default function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-700 via-sky-600 to-teal-500 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/20 bg-white/90 shadow-2xl backdrop-blur dark:bg-gray-900/70">
        <div className="bg-white/80 p-6 text-center dark:bg-gray-900/80">
          <h1 className="text-3xl font-extrabold tracking-tight text-indigo-700 dark:text-indigo-300">CoreInventory</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Smart stock, fast decisions. Sign in with email OTP or password.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-6 p-6 items-start">
          <div className="flex-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Inventory KPIs</h2>
            <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
              <li>• Live low-stock alerts</li>
              <li>• Fast item search + drill-down</li>
              <li>• Bulk SKU import & audit trail</li>
              <li>• Receipt and delivery validation</li>
            </ul>
          </div>
          <div className="flex-1 flex justify-center">
            <SignIn
              signUpUrl="/signup"
              fallbackRedirectUrl="/"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none border-0 bg-transparent',
                }
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
