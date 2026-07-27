import { AuthProviderProps } from "react-oidc-context";

const cognitoAuthConfig: AuthProviderProps = {
  authority: process.env.NEXT_PUBLIC_COGNITO_DOMAIN!,      
  client_id: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,   
  redirect_uri: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI!, 
  response_type: "code",                                    
  scope: process.env.NEXT_PUBLIC_COGNITO_SCOPES!,      
};

export default cognitoAuthConfig;
