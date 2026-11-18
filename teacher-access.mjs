// Use the same ASCII wire format in the browser and the function.
export function teacherAuthorization(code) {
  const bytes = new TextEncoder().encode(code);
  const token = btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  return 'Bearer ' + token;
}

export function validTeacherSecret(code) {
  return typeof code === 'string' && code.length <= 256
    && Array.from(code.trim()).length >= 16 && !/\p{Cc}/u.test(code);
}
