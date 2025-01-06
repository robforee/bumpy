import { exchangeCodeForTokens } from '@/src/app/actions/auth-actions';
import ClientCallback from './ClientCallback';

export default async function OAuth2Callback({ searchParams }) {
  console.log(' [OAuth2Callback] Processing callback:', {
    hasCode: !!searchParams.code,
    hasError: !!searchParams.error,
    timestamp: new Date().toISOString()
  });

  const code = searchParams.code;
  const error = searchParams.error;
  
  if (error) {
    return <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p>{error}</p>
    </div>;
  }

  if (!code) {
    return <div className="text-center">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p>No code provided</p>
    </div>;
  }

  const result = await exchangeCodeForTokens(code);
  return <ClientCallback result={result} />;
}
