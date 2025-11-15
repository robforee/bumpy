import { exchangeCodeForTokens } from '@/src/app/actions/auth-actions';
import ClientCallback from './ClientCallback';

export default async function OAuth2Callback({ searchParams }) {
  console.log('🔄 [OAuth2Callback] Processing callback:', {
    hasCode: !!searchParams.code,
    hasError: !!searchParams.error,
    hasState: !!searchParams.state,
    timestamp: new Date().toISOString()
  });

  const code = searchParams.code;
  const error = searchParams.error;
  const state = searchParams.state;

  // Parse state to get service info
  let service = null;
  if (state) {
    try {
      const stateObj = JSON.parse(state);
      service = stateObj.service;
      console.log('📦 [OAuth2Callback] Service from state:', service);
    } catch (e) {
      console.error('❌ [OAuth2Callback] Failed to parse state:', e);
    }
  }

  if (error) {
    return <div className="text-center p-8">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h1>
      <p className="text-gray-700">{error}</p>
      <a href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">
        Return to Dashboard
      </a>
    </div>;
  }

  if (!code) {
    return <div className="text-center p-8">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Authentication Error</h1>
      <p className="text-gray-700">No authorization code provided</p>
      <a href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline">
        Return to Dashboard
      </a>
    </div>;
  }

  const result = await exchangeCodeForTokens(code);
  return <ClientCallback result={result} service={service} />;
}
