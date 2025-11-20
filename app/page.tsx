import { redirect } from 'next/navigation';

export default function Page() {
  // Default redirect to login page
  // Auth will be handled by login page and dashboard layout
  redirect('/login');
}
