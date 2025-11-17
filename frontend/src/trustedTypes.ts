// Trusted Types policy for Vite development and Firebase
if (typeof window !== 'undefined' && window.trustedTypes) {
  try {
    window.trustedTypes.createPolicy('default', {
      createScriptURL: (string: string) => string,
      createHTML: (string: string) => string,
      createScript: (string: string) => string,
    });
  } catch (e) {
    // Policy already exists
  }
  
  // Firebase and Google Auth policies
  const policies = [
    'firebase-js-sdk#jsl',
    'firebase-js-sdk#load_esm', 
    'gapi#gapi',
    'goog#html'
  ];
  
  policies.forEach(policyName => {
    try {
      window.trustedTypes.createPolicy(policyName, {
        createScriptURL: (string: string) => string,
        createHTML: (string: string) => string,
        createScript: (string: string) => string,
      });
    } catch (e) {
      // Policy may already exist
    }
  })
}
