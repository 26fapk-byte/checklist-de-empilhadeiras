export async function registerBiometric(): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    console.log('WebAuthn not supported');
    return false;
  }

  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array(32),
        rp: {
          name: 'LogiCheck',
          id: window.location.hostname
        },
        user: {
          id: new Uint8Array(16),
          name: 'user@logicheck.com',
          displayName: 'User'
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }
        ],
        timeout: 60000,
        attestation: 'direct',
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          residentKey: 'required'
        }
      }
    } as any);

    if (credential) {
      localStorage.setItem('biometric_registered', 'true');
      return true;
    }
  } catch (error) {
    console.error('Erro ao registrar biométrico:', error);
  }

  return false;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    return false;
  }

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: new Uint8Array(32),
        timeout: 60000,
        rpId: window.location.hostname,
        userVerification: 'preferred'
      }
    } as any);

    return !!assertion;
  } catch (error) {
    console.error('Erro na autenticação biométrica:', error);
    return false;
  }
}

export function isBiometricAvailable(): boolean {
  return (
    !!window.PublicKeyCredential &&
    localStorage.getItem('biometric_registered') === 'true'
  );
}
