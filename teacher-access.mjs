// Use the same ASCII wire format in the browser and the function.
export function teacherAuthorization(code) {
  const bytes = new TextEncoder().encode(code);
  const token = btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  return 'Bearer ' + token;
}

export function teacherSecretIssue(code) {
  if (!code) return 'TEACHER_ACCESS_CODE_MISSING';
  if (code.length > 256) return 'TEACHER_ACCESS_CODE_TOO_LONG';
  if (/\p{Cc}/u.test(code)) return 'TEACHER_ACCESS_CODE_CONTROL_CHARACTER';
  if (Array.from(code.trim()).length < 16) return 'TEACHER_ACCESS_CODE_TOO_SHORT';
  return null;
}
