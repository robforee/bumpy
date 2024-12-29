'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { firebaseApp } from '@/src/lib/firebase/clientApp';

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user || user.uid !== 'CtAyzps80VXRzna32Kdy0NHYcPe2') {
        router.push('/');
        return;
      }

      try {
        // Fetch all user tokens
        const tokensSnapshot = await getDocs(collection(db, 'user_tokens'));
        const usersList = tokensSnapshot.docs.map(doc => ({
          id: doc.id,
          email: doc.data().userEmail,
          lastUpdate: doc.data().__last_token_update,
        }));
        setUsers(usersList);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  const handleRemoveUser = async (userId, userEmail) => {
    if (!confirm(`Are you sure you want to remove ${userEmail}?`)) {
      return;
    }

    try {
      // Delete user data from all collections
      await Promise.all([
        deleteDoc(doc(db, 'user_tokens', userId)),
        deleteDoc(doc(db, 'user_profiles', userId)),
        deleteDoc(doc(db, 'authorized_scopes', userId))
      ]);

      // Update UI
      setUsers(users.filter(user => user.id !== userId));
    } catch (err) {
      console.error('Error removing user:', err);
      alert(`Error removing user: ${err.message}`);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
console.log('me')
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="bg-white shadow rounded-lg">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.lastUpdate ? new Date(user.lastUpdate).toLocaleString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => handleRemoveUser(user.id, user.email)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Remove User
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
