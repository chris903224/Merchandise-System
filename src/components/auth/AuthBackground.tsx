// src/components/auth/AuthBackground.tsx

const CAMPUS_BACKGROUND_URL = '/background-images/campus.png';

export default function AuthBackground() {
  return (
    <img
      src={CAMPUS_BACKGROUND_URL}
      alt=""
      className="auth-experience__background"
      aria-hidden="true"
    />
  );
}