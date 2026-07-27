import { Amplify } from "aws-amplify";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "eu-west-3_pT9kj0dDZ",
      userPoolClientId: "59mtaokatu9i8d3smkuec4m8ij",
      loginWith: {
        oauth: {
          domain: "eu-west-3fiwiobcs8.auth.eu-west-3.amazoncognito.com",
          scopes: ["email", "openid", "phone", "profile"],
          redirectSignIn: ["https://www.ech-ry.com/"],
          redirectSignOut: ["https://www.ech-ry.com/logout"],
          responseType: "code",
        },
      },
    },
  },
});
