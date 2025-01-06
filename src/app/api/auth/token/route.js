import { getAdminAuth } from '@/src/lib/firebase/adminApp';

export async function POST(request) {
  try {
    // Get ID token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({
        success: false,
        error: 'unauthorized',
        error_description: 'No ID token provided'
      }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    console.log('Verifying ID token:', JSON.stringify({
      hasIdToken: !!idToken,
      idTokenPreview: idToken ? `${idToken.substring(0, 8)}...` : 'none'
    }, null, 2));

    // Verify ID token
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(idToken);
    console.log('Decoded token:', JSON.stringify({
      uid: decodedToken.uid,
      email: decodedToken.email
    }, null, 2));

    const { code } = await request.json();
    console.log('Token exchange request:', JSON.stringify({
      hasCode: !!code,
      codePreview: code ? `${code.substring(0, 8)}...` : 'none'
    }, null, 2));
    
    const tokenParams = new URLSearchParams({
      client_id: process.env.NEXT_PUBLIC__GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
      code: code
    });

    console.log('Token request params:', JSON.stringify({
      clientId: process.env.NEXT_PUBLIC__GOOGLE_CLIENT_ID?.slice(0, 8) + '...',
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      clientSecretPreview: process.env.GOOGLE_CLIENT_SECRET ? 
        process.env.GOOGLE_CLIENT_SECRET.slice(0, 4) + '...' : 'none',
      redirectUri: process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI
    }, null, 2));

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: tokenParams.toString()
    });

    const tokens = await response.json();
    console.log('Google token response:', JSON.stringify({
      status: response.status,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      hasError: !!tokens.error,
      error: tokens.error,
      errorDescription: tokens.error_description
    }, null, 2));
    
    if (!response.ok) {
      return Response.json({
        success: false,
        error: tokens.error,
        error_description: tokens.error_description
      }, { status: response.status });
    }

    return Response.json({
      success: true,
      tokens: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope
      }
    });
  } catch (error) {
    console.error('Token exchange error:', JSON.stringify({
      error: error.message,
      stack: error.stack
    }, null, 2));
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
