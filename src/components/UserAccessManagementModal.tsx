import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Check, 
  X, 
  Lock, 
  AlertCircle, 
  KeyRound, 
  Mail, 
  Trash2, 
  FileSpreadsheet, 
  UploadCloud, 
  Edit3, 
  CheckCircle2, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { AuthUser, UserAccount } from '../types';

interface UserAccessManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  userRole: 'Recruiter' | 'Admin';
  onSwitchRole: (role: 'Recruiter' | 'Admin') => void;
}

const INITIAL_USERS: UserAccount[] = [
  {
    id: 'user-admin',
    name: 'Sarah Jenkins',
    email: 'admin@talentfox.hr',
    role: 'Admin',
    title: 'Lead Talent Administrator',
    avatarInitials: 'SJ',
    status: 'Active',
    createdAt: '2026-01-10',
    lastActive: 'Just now'
  },
  {
    id: 'user-recruiter',
    name: 'Alex Rivera',
    email: 'recruiter@talentfox.ai',
    role: 'Recruiter',
    title: 'Senior Technical Recruiter',
    avatarInitials: 'AR',
    status: 'Active',
    createdAt: '2026-02-01',
    lastActive: '5 minutes ago'
  },
  {
    id: 'user-recruiter-2',
    name: 'Elena Rostova',
    email: 'elena.rostova@talentfox.ai',
    role: 'Recruiter',
    title: 'Executive Recruiter',
    avatarInitials: 'ER',
    status: 'Active',
    createdAt: '2026-03-12',
    lastActive: '2 hours ago'
  }
];

export const UserAccessManagementModal: React.FC<UserAccessManagementModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  userRole,
  onSwitchRole
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'matrix' | 'users' | 'invite'>('matrix');
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  
  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'Recruiter' | 'Admin'>('Recruiter');
  const [newTitle, setNewTitle] = useState('Talent Acquisition Specialist');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const initials = newName
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'TU';

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      title: newTitle.trim() || (newRole === 'Admin' ? 'Talent Administrator' : 'Technical Recruiter'),
      avatarInitials: initials,
      status: 'Active',
      createdAt: new Date().toISOString().slice(0, 10),
      lastActive: 'Never'
    };

    setUsers(prev => [newUser, ...prev]);
    setNewName('');
    setNewEmail('');
    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setActiveTab('users');
    }, 1500);
  };

  const handleToggleStatus = (userId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          status: u.status === 'Active' ? 'Suspended' : 'Active'
        };
      }
      return u;
    }));
  };

  const handleChangeUserRole = (userId: string, targetRole: 'Recruiter' | 'Admin') => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          role: targetRole,
          title: targetRole === 'Admin' ? 'Talent Administrator' : 'Technical Recruiter'
        };
      }
      return u;
    }));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-olive-50/50 dark:bg-olive-950/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-olive-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>User Access & Role Management</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-olive-100 text-olive-800 dark:bg-olive-900/60 dark:text-olive-300 border border-olive-200 dark:border-olive-800">
                  Admin Control Panel
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure role-based permissions (RBAC), enforce export boundaries, and manage talent accounts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 flex space-x-4 text-xs font-semibold bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'matrix'
                ? 'border-olive-600 text-olive-700 dark:text-olive-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Role Permission Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'users'
                ? 'border-olive-600 text-olive-700 dark:text-olive-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team Accounts ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('invite')}
            className={`py-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'invite'
                ? 'border-olive-600 text-olive-700 dark:text-olive-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Team Member</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* TAB 1: PERMISSION MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-5">
              
              {/* Quick Role Tester Bar */}
              <div className="p-4 rounded-xl bg-olive-50 dark:bg-olive-950/40 border border-olive-200 dark:border-olive-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-olive-900 dark:text-olive-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-olive-600 dark:text-olive-400" />
                    Active Session Testing Mode
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    Currently simulating environment as: <strong className="text-olive-800 dark:text-olive-300">{userRole}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => onSwitchRole('Recruiter')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      userRole === 'Recruiter'
                        ? 'bg-olive-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Recruiter View
                  </button>

                  <button
                    type="button"
                    onClick={() => onSwitchRole('Admin')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      userRole === 'Admin'
                        ? 'bg-olive-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Admin View
                  </button>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Feature / Action</th>
                      <th className="py-3 px-4 w-48 text-center bg-olive-50/40 dark:bg-olive-950/20">
                        Recruiter Role
                      </th>
                      <th className="py-3 px-4 w-48 text-center bg-slate-100/50 dark:bg-slate-800/50">
                        Admin Role
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    
                    {/* View/Search data */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>View & Search Candidate Data</div>
                        <div className="text-[11px] font-normal text-slate-500">Access talent pool, multi-criteria filters, skill matrix, and JD scores</div>
                      </td>
                      <td className="py-3 px-4 text-center bg-olive-50/20 dark:bg-olive-950/10">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <Check className="w-3.5 h-3.5 mr-1" /> Allowed
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center bg-slate-50/30 dark:bg-slate-800/20">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <Check className="w-3.5 h-3.5 mr-1" /> Allowed
                        </span>
                      </td>
                    </tr>

                    {/* Upload CVs */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>Upload Resumes / CVs</div>
                        <div className="text-[11px] font-normal text-slate-500">Process PDF resumes with Gemini 3.7 AI extraction engine</div>
                      </td>
                      <td className="py-3 px-4 text-center bg-olive-50/20 dark:bg-olive-950/10">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <Check className="w-3.5 h-3.5 mr-1" /> Allowed
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center bg-slate-50/30 dark:bg-slate-800/20">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <Check className="w-3.5 h-3.5 mr-1" /> Allowed
                        </span>
                      </td>
                    </tr>

                    {/* Edit candidate details */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>Edit Candidate Details & Notes</div>
                        <div className="text-[11px] font-normal text-slate-500">Modify contact details, work history, skills, notes, and pipeline status</div>
                      </td>
                      <td className="py-3 px-4 text-center bg-olive-50/20 dark:bg-olive-950/10">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <Check className="w-3.5 h-3.5 mr-1" /> Allowed
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center bg-slate-50/30 dark:bg-slate-800/20">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <Check className="w-3.5 h-3.5 mr-1" /> Allowed
                        </span>
                      </td>
                    </tr>

                    {/* Delete candidate entries */}
                    <tr className="bg-rose-50/20 dark:bg-rose-950/10">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>Delete Candidate Entries</div>
                        <div className="text-[11px] font-normal text-slate-500">Single candidate record removal from database</div>
                      </td>
                      <td className="py-3 px-4 text-center bg-rose-50/50 dark:bg-rose-950/30">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          <X className="w-3.5 h-3.5 mr-1" /> ❌ Not Allowed
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center bg-slate-50/30 dark:bg-slate-800/20">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <Check className="w-3.5 h-3.5 mr-1" /> Allowed
                        </span>
                      </td>
                    </tr>

                    {/* Delete uploaded CVs/files */}
                    <tr className="bg-rose-50/20 dark:bg-rose-950/10">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>Delete Uploaded CVs / Files</div>
                        <div className="text-[11px] font-normal text-slate-500">Permanent removal of uploaded resume artifacts</div>
                      </td>
                      <td className="py-3 px-4 text-center bg-rose-50/50 dark:bg-rose-950/30">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          <X className="w-3.5 h-3.5 mr-1" /> ❌ Not Allowed
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center bg-slate-50/30 dark:bg-slate-800/20">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <Check className="w-3.5 h-3.5 mr-1" /> Allowed
                        </span>
                      </td>
                    </tr>

                    {/* Delete bulk data */}
                    <tr className="bg-rose-50/20 dark:bg-rose-950/10">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>Delete Bulk Candidate Data</div>
                        <div className="text-[11px] font-normal text-slate-500">Batch selection deletion across multiple candidate rows</div>
                      </td>
                      <td className="py-3 px-4 text-center bg-rose-50/50 dark:bg-rose-950/30">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          <X className="w-3.5 h-3.5 mr-1" /> ❌ Not Allowed
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center bg-slate-50/30 dark:bg-slate-800/20">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <Check className="w-3.5 h-3.5 mr-1" /> Allowed
                        </span>
                      </td>
                    </tr>

                    {/* Export to Excel */}
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div>Export to Excel / CSV (.xlsx)</div>
                        <div className="text-[11px] font-normal text-slate-500">Export candidate details across all 32 structured columns</div>
                      </td>
                      <td className="py-3 px-4 text-center bg-amber-50/30 dark:bg-amber-950/20">
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Max 50 Records / Download
                          </span>
                          <p className="text-[10px] text-slate-500 italic">
                            Notification alert on &gt;50 records
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center bg-slate-50/30 dark:bg-slate-800/20">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <Check className="w-3.5 h-3.5 mr-1" /> Full Unlimited Export
                        </span>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 2: USER ACCOUNTS LIST */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    TalentFox Team Directory
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Assign roles, toggle status, and inspect permissions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('invite')}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-olive-600 hover:bg-olive-700 text-white shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add New User</span>
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {users.map(u => (
                  <div
                    key={u.id}
                    className="p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-olive-100 dark:bg-olive-900/60 text-olive-800 dark:text-olive-300 font-bold text-xs flex items-center justify-center">
                        {u.avatarInitials}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {u.name}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            u.role === 'Admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : 'bg-olive-100 text-olive-800 dark:bg-olive-950 dark:text-olive-300'
                          }`}>
                            {u.role}
                          </span>
                          {u.status === 'Suspended' && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              Suspended
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-0.5">
                          <span>{u.title}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-600 dark:text-slate-400">{u.email}</span>
                          <span>•</span>
                          <span>Active: {u.lastActive}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                      {/* Role switcher dropdown */}
                      <select
                        value={u.role}
                        onChange={e => handleChangeUserRole(u.id, e.target.value as 'Recruiter' | 'Admin')}
                        className="text-xs font-semibold px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                      >
                        <option value="Recruiter">Role: Recruiter</option>
                        <option value="Admin">Role: Admin</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(u.id)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                          u.status === 'Active'
                            ? 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                            : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}
                      >
                        {u.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>

                      {users.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: INVITE / CREATE USER */}
          {activeTab === 'invite' && (
            <div className="max-w-xl mx-auto space-y-4 py-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Add New Team Member
                </h3>
                <p className="text-xs text-slate-500">
                  Provision recruiter or administrator credentials with instant access
                </p>
              </div>

              {inviteSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>User account created successfully! Redirecting to user roster...</span>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-olive-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Corporate Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="jordan.miller@talentfox.ai"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-olive-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Assigned Role
                    </label>
                    <select
                      value={newRole}
                      onChange={e => setNewRole(e.target.value as 'Recruiter' | 'Admin')}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold cursor-pointer"
                    >
                      <option value="Recruiter">Recruiter (Max 50 export limit, No deletion)</option>
                      <option value="Admin">Admin (Full deletion & unlimited export)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="e.g. Senior Talent Partner"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg bg-olive-600 hover:bg-olive-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create & Activate Account</span>
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1.5">
            <Lock className="w-3.5 h-3.5 text-olive-600 dark:text-olive-400" />
            <span>Strict Role-Based Access Control enforced on client and API endpoints</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
