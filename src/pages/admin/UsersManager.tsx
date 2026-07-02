import React, { useState, useEffect } from 'react';
import { supabase, Profile } from '../../lib/supabase';
import { Mail, User } from 'lucide-react';

export function UsersManager() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data) setUsers(data as Profile[]);
    setIsLoading(false);
  };

  if (isLoading) return <div>Loading users...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-zinc-900">Manage Users</h2>
      </div>

      <div className="bg-white shadow-sm border border-zinc-200 rounded-lg overflow-hidden">
        <ul className="divide-y divide-zinc-200">
          {users.map((profile) => (
            <li key={profile.id} className="p-4 sm:p-6 hover:bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500">
                  <User className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-zinc-900">{profile.full_name || 'No Name Provided'}</p>
                  <p className="text-sm text-zinc-500 flex items-center mt-1">
                    <Mail className="h-3 w-3 mr-1" /> {profile.email}
                  </p>
                </div>
              </div>
              <div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                  ${profile.role === 'admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-zinc-100 text-zinc-800'}
                `}>
                  {profile.role}
                </span>
                <p className="text-xs text-zinc-400 mt-2 text-right">
                  Joined: {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
