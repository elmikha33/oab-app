import { redirect } from 'next/navigation';

export default function Home() {
  // Redireciona imediatamente para /dashboard
  redirect('/dashboard');
}