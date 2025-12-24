import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Download, 
  Plus, 
  Shield, 
  ArrowRight, 
  Trash2, 
  BarChart3, 
  ShoppingCart,
  Users,
  X,
  UserPlus,
  Search,
  Tag
} from 'lucide-react';

const AdminRoles = () => {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pendingUsers, setPendingUsers] = useState(new Set()); // Track users for new role
  const [showUserModal, setShowUserModal] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '' });
  const [selectedRole, setSelectedRole] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  
  const defaultPermissions = {
    globalAdmin: false,
    viewReports: true,
    exportData: true,
    manageProducts: true,
    manageInventory: true,
    deleteProducts: true,
    processOrders: true,
    processRefunds: false,
    managePromotions: false
  };

  const [permissions, setPermissions] = useState(defaultPermissions);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch("http://localhost:5000/roles", {
        headers: { token: localStorage.token }
      });
      const data = await response.json();
      
      if (response.ok && Array.isArray(data)) {
        setRoles(data);
        if (data.length > 0 && !selectedRole) {
          selectRole(data[0]);
        }
      } else {
        console.error("Failed to load roles:", data);
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/admin/customers", {
        headers: { token: localStorage.token }
      });
      const data = await response.json();
      if (Array.isArray(data)) setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("http://localhost:5000/user", {
        headers: { token: localStorage.token }
      });
      const data = await response.json();
      setCurrentUser(data);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  const selectRole = (role) => {
    console.log("Selecting role:", role);
    setSelectedRole(role);
    setFormData({ name: role.name || '', description: role.description || '' });
    setPermissions({ ...defaultPermissions, ...(role.permissions || {}) });
    setPendingUsers(new Set());
  };

  const handleCreateNew = () => {
    setSelectedRole(null);
    setFormData({ name: '', description: '' });
    setPermissions(defaultPermissions);
    setPendingUsers(new Set());
  };

  const handleSave = async () => {
    const roleName = formData?.name?.trim();
    console.log("Attempting to save role:", formData);

    if (!roleName) {
        alert("Role name is required.");
        return;
    }

    try {
      // Validation: Check for duplicate role name
      const nameExists = roles.some(r => 
        r.name.toLowerCase() === roleName.toLowerCase() && 
        (!selectedRole || Number(r.role_id) !== Number(selectedRole.role_id))
      );
      if (nameExists) {
        alert(`The role name "${roleName}" is already taken. Please choose a different name.`);
        return;
      }

      const body = { ...formData, name: roleName, permissions };
      const url = selectedRole 
        ? `http://localhost:5000/roles/${selectedRole.role_id}`
        : "http://localhost:5000/roles";
      
      const method = selectedRole ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", token: localStorage.token },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const savedRole = await response.json();
        
        // If creating a new role, assign the pending users now
        if (!selectedRole && pendingUsers.size > 0) {
            await Promise.all([...pendingUsers].map(userId => 
                fetch(`http://localhost:5000/admin/customers/${userId}/role`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', token: localStorage.token },
                    body: JSON.stringify({ role_id: savedRole.role_id })
                })
            ));
        }

        alert("Role saved successfully");
        fetchRoles();
        fetchUsers();
        selectRole(savedRole); // Select the newly created/updated role
      } else {
        const err = await response.text();
        alert("Failed to save role: " + err);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving role");
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    if (!window.confirm(`Delete role "${selectedRole.name}"?`)) return;

    try {
      const response = await fetch(`http://localhost:5000/roles/${selectedRole.role_id}`, {
        method: "DELETE",
        headers: { token: localStorage.token }
      });

      if (response.ok) {
        alert("Role deleted");
        setSelectedRole(null);
        fetchRoles();
      } else {
        const errorText = await response.text();
        alert("Failed to delete role: " + errorText);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleUserRole = async (user) => {
    // If creating a new role, just toggle in memory
    if (!selectedRole) {
        const newPending = new Set(pendingUsers);
        if (newPending.has(user.user_id)) newPending.delete(user.user_id);
        else newPending.add(user.user_id);
        setPendingUsers(newPending);
        return;
    }

    const newRoleId = Number(user.role_id) === Number(selectedRole.role_id) ? null : selectedRole.role_id;
    try {
        const response = await fetch(`http://localhost:5000/admin/customers/${user.user_id}/role`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', token: localStorage.token },
            body: JSON.stringify({ role_id: newRoleId })
        });
        if (response.ok) {
            fetchUsers(); // Refresh user list to show updated roles
        }
    } catch (err) {
        console.error(err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch("http://localhost:5000/admin/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json", token: localStorage.token },
            body: JSON.stringify({ ...newUserData, role_id: selectedRole ? selectedRole.role_id : null })
        });
        
        if (response.ok) {
            const createdUser = await response.json();
            alert("User created and assigned to role!");
            setIsCreatingUser(false);
            setNewUserData({ name: '', email: '', password: '' });
            // If creating a new role, add this new user to pending list
            if (!selectedRole) {
                setPendingUsers(prev => new Set(prev).add(createdUser.user_id));
            }
            fetchUsers();
        } else {
            const err = await response.json();
            alert("Failed to create user: " + err);
        }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-4 md:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {/* Page Heading & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">User Roles & Permissions</h1>
                <p className="text-slate-500 max-w-2xl">Manage access levels, define capabilities, and ensure your team has the right tools without compromising security.</p>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#e5e7eb] bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm">
                  <Download size={20} />
                  Export
                </button>
                {currentUser?.is_super_admin && (
                  <button onClick={handleCreateNew} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#194cb3] text-white font-medium text-sm hover:bg-[#123680] transition-colors shadow-sm shadow-blue-900/20">
                    <Plus size={20} />
                    Create New Role
                  </button>
                )}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Roles List */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Defined Roles</h3>
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">{roles.length} roles</span>
                </div>

                {/* New Role Card (Visible only when creating) */}
                {!selectedRole && (
                  <div className="group relative p-5 rounded-xl bg-white border-2 border-[#194cb3] shadow-sm cursor-pointer transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div className="p-2 rounded-lg bg-[#194cb3]/10 text-[#194cb3]">
                        <Plus size={24} />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">New Role</h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">Configuring new role...</p>
                    <div className="mt-4 flex items-center text-xs font-medium text-[#194cb3]">
                      <span>Editing now</span>
                      <ArrowRight size={16} className="ml-1" />
                    </div>
                  </div>
                )}

                {roles.map(role => (
                <div 
                  key={role.role_id}
                  onClick={() => selectRole(role)}
                  className={`group relative p-5 rounded-xl bg-white border-2 shadow-sm cursor-pointer transition-all ${Number(selectedRole?.role_id) === Number(role.role_id) ? 'border-[#194cb3]' : 'border-transparent hover:border-slate-300'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg ${Number(selectedRole?.role_id) === Number(role.role_id) ? 'bg-[#194cb3]/10 text-[#194cb3]' : 'bg-slate-100 text-slate-600'}`}>
                      <Shield size={24} />
                    </div>
                    {/* Placeholder for user count */}
                    {/* <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">0 Users</span> */}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{role.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{role.description}</p>
                  {Number(selectedRole?.role_id) === Number(role.role_id) && (
                  <div className="mt-4 flex items-center text-xs font-medium text-[#194cb3]">
                    <span>Editing now</span>
                    <ArrowRight size={16} className="ml-1" />
                  </div>
                  )}
                </div>
                ))}

                {roles.length === 0 && (
                  <div className="p-5 text-center text-slate-500">No roles found. Create one!</div>
                )}
              </div>

              {/* Right Column: Permission Editor */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Role Header Config */}
                <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm p-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Role Name</label>
                      <input 
                        className="text-2xl font-bold bg-transparent border-none p-0 focus:ring-0 text-slate-900 w-full placeholder:text-slate-400 outline-none" 
                        placeholder="Enter role name" 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({...prev, name: val}));
                        }}
                      />
                      <input 
                        className="mt-2 w-full bg-transparent border-b border-transparent hover:border-[#e5e7eb] focus:border-[#194cb3] p-0 pb-1 text-slate-500 text-sm focus:ring-0 transition-colors outline-none" 
                        placeholder="Enter description" 
                        type="text" 
                        value={formData.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(prev => ({...prev, description: val}));
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedRole && currentUser?.is_super_admin && (
                        <button onClick={handleDelete} className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50" title="Delete Role">
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Assigned Users Preview */}
                  <div className="mt-6 pt-6 border-t border-[#e5e7eb] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-slate-700">Assigned Members:</span>
                      <div className="flex -space-x-2">
                        {users.filter(u => selectedRole ? Number(u.role_id) === Number(selectedRole.role_id) : pendingUsers.has(u.user_id)).slice(0, 5).map(u => (
                          <div key={u.user_id} className="size-8 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600" title={u.name}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        ))}
                        {users.filter(u => selectedRole ? Number(u.role_id) === Number(selectedRole.role_id) : pendingUsers.has(u.user_id)).length > 5 && (
                            <div className="size-8 rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-xs text-slate-500">
                                +{users.filter(u => selectedRole ? Number(u.role_id) === Number(selectedRole.role_id) : pendingUsers.has(u.user_id)).length - 5}
                            </div>
                        )}
                      </div>
                    </div>
                    <button onClick={() => setShowUserModal(true)} className="text-sm text-[#194cb3] font-medium hover:underline">Manage Users</button>
                  </div>
                </div>

                {/* Permissions Matrix */}
                <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#e5e7eb] bg-slate-50/50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">Permissions Configuration</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Global Admin Access</span>
                      <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input 
                          className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-300 checked:right-0 checked:border-[#194cb3] transition-all duration-300" 
                          id="global-toggle" 
                          name="toggle" 
                          type="checkbox" 
                          checked={permissions.globalAdmin}
                          onChange={() => togglePermission('globalAdmin')}
                        />
                        <label className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer checked:bg-[#194cb3] transition-colors duration-300" htmlFor="global-toggle" onClick={() => togglePermission('globalAdmin')}></label>
                      </div>
                    </div>
                  </div>

                  {/* Section: Dashboard & Analytics */}
                  <div className="p-6 border-b border-[#e5e7eb]">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mt-1">
                        <BarChart3 size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-slate-900">Dashboard & Analytics</h4>
                        <p className="text-sm text-slate-500 mb-4">Control visibility of sales reports, traffic data, and business overview stats.</p>
                        
                        <div className="space-y-3 pl-1">
                          {/* Permission Item */}
                          <div className="flex items-center justify-between group">
                            <div>
                              <p className="text-sm font-medium text-slate-700">View Sales Reports</p>
                            </div>
                            <button 
                              onClick={() => togglePermission('viewReports')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${permissions.viewReports ? 'bg-[#194cb3]' : 'bg-slate-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${permissions.viewReports ? 'translate-x-6' : 'translate-x-1'}`}></span>
                            </button>
                          </div>
                          <div className="h-px bg-slate-100 w-full"></div>
                          {/* Permission Item */}
                          <div className="flex items-center justify-between group">
                            <div>
                              <p className="text-sm font-medium text-slate-700">Export Data</p>
                            </div>
                            <button 
                              onClick={() => togglePermission('exportData')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${permissions.exportData ? 'bg-[#194cb3]' : 'bg-slate-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${permissions.exportData ? 'translate-x-6' : 'translate-x-1'}`}></span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: Product Management */}
                  <div className="p-6 border-b border-[#e5e7eb]">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg mt-1">
                        <Package size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-slate-900">Product Management</h4>
                        <p className="text-sm text-slate-500 mb-4">Permissions related to creating, editing, deleting, and pricing products.</p>
                        
                        <div className="space-y-3 pl-1">
                          {/* Permission Item */}
                          <div className="flex items-center justify-between group">
                            <div>
                              <p className="text-sm font-medium text-slate-700">Create/Edit Products</p>
                            </div>
                            <button 
                              onClick={() => togglePermission('manageProducts')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${permissions.manageProducts ? 'bg-[#194cb3]' : 'bg-slate-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${permissions.manageProducts ? 'translate-x-6' : 'translate-x-1'}`}></span>
                            </button>
                          </div>
                          <div className="h-px bg-slate-100 w-full"></div>
                          {/* Permission Item */}
                          <div className="flex items-center justify-between group">
                            <div>
                              <p className="text-sm font-medium text-slate-700">Manage Inventory Levels</p>
                            </div>
                            <button 
                              onClick={() => togglePermission('manageInventory')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${permissions.manageInventory ? 'bg-[#194cb3]' : 'bg-slate-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${permissions.manageInventory ? 'translate-x-6' : 'translate-x-1'}`}></span>
                            </button>
                          </div>
                          <div className="h-px bg-slate-100 w-full"></div>
                          {/* Permission Item */}
                          <div className="flex items-center justify-between group">
                            <div>
                              <p className="text-sm font-medium text-slate-700">Delete Products</p>
                              <p className="text-xs text-slate-400">Allows permanent removal of catalog items.</p>
                            </div>
                            <button 
                              onClick={() => togglePermission('deleteProducts')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${permissions.deleteProducts ? 'bg-[#194cb3]' : 'bg-slate-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${permissions.deleteProducts ? 'translate-x-6' : 'translate-x-1'}`}></span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: Orders & Finance */}
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg mt-1">
                        <ShoppingCart size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-slate-900">Orders & Finance</h4>
                        <p className="text-sm text-slate-500 mb-4">Handling customer orders, processing refunds, and accessing payment details.</p>
                        
                        <div className="space-y-3 pl-1">
                          {/* Permission Item */}
                          <div className="flex items-center justify-between group">
                            <div>
                              <p className="text-sm font-medium text-slate-700">Process Orders</p>
                            </div>
                            <button 
                              onClick={() => togglePermission('processOrders')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${permissions.processOrders ? 'bg-[#194cb3]' : 'bg-slate-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${permissions.processOrders ? 'translate-x-6' : 'translate-x-1'}`}></span>
                            </button>
                          </div>
                          <div className="h-px bg-slate-100 w-full"></div>
                          {/* Permission Item */}
                          <div className="flex items-center justify-between group">
                            <div>
                              <p className="text-sm font-medium text-slate-700">Process Refunds</p>
                              <p className="text-xs text-slate-400">Ability to refund payments to original payment methods.</p>
                            </div>
                            <button 
                              onClick={() => togglePermission('processRefunds')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${permissions.processRefunds ? 'bg-[#194cb3]' : 'bg-slate-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${permissions.processRefunds ? 'translate-x-6' : 'translate-x-1'}`}></span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: Marketing */}
                  <div className="p-6 border-t border-[#e5e7eb]">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mt-1">
                        <Tag size={24} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-slate-900">Marketing & Promotions</h4>
                        <p className="text-sm text-slate-500 mb-4">Manage discount codes and promotional campaigns.</p>
                        <div className="space-y-3 pl-1">
                          {/* Permission Item */}
                          <div className="flex items-center justify-between group">
                            <div>
                              <p className="text-sm font-medium text-slate-700">Manage Promotions</p>
                            </div>
                            <button 
                              onClick={() => togglePermission('managePromotions')}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${permissions.managePromotions ? 'bg-[#194cb3]' : 'bg-slate-200'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition shadow-sm ${permissions.managePromotions ? 'translate-x-6' : 'translate-x-1'}`}></span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sticky Action Footer */}
                  <div className="px-6 py-4 bg-slate-50/80 border-t border-[#e5e7eb] flex items-center justify-end gap-3 sticky bottom-0 backdrop-blur-sm">
                    <button onClick={() => selectRole(selectedRole)} className="px-5 py-2.5 rounded-lg border border-[#e5e7eb] bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSave} className="px-5 py-2.5 rounded-lg bg-[#194cb3] text-white font-medium text-sm hover:bg-[#123680] transition-colors shadow-md shadow-blue-500/20">
                      {selectedRole ? 'Save Changes' : 'Create Role'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Manage Users Modal */}
          {showUserModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900">
                            {isCreatingUser ? 'Create New User' : `Manage Users for ${selectedRole ? selectedRole.name : 'New Role'}`}
                        </h3>
                        <button onClick={() => { setShowUserModal(false); setIsCreatingUser(false); setUserSearchTerm(''); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1">
                        {isCreatingUser ? (
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" value={newUserData.name} onChange={e => setNewUserData({...newUserData, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input required type="email" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" value={newUserData.email} onChange={e => setNewUserData({...newUserData, email: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input required type="password" className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-indigo-500 focus:border-indigo-500" value={newUserData.password} onChange={e => setNewUserData({...newUserData, password: e.target.value})} />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setIsCreatingUser(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">Cancel</button>
                                    <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700">Create & Assign</button>
                                </div>
                            </form>
                        ) : (
                        <>
                        <button 
                            onClick={() => setIsCreatingUser(true)}
                            className="w-full mb-4 py-3 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium border border-indigo-100"
                        >
                            <UserPlus size={18} />
                            Create New User
                        </button>
                        
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by name or email..." 
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                value={userSearchTerm}
                                onChange={(e) => setUserSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            {users.filter(u => u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase())).map(user => {
                                const isAssigned = selectedRole ? Number(user.role_id) === Number(selectedRole.role_id) : pendingUsers.has(user.user_id);
                                return (
                                <div key={user.user_id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{user.name} {user.user_id === 1 && "(You)"}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleToggleUserRole(user)}
                                        className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                                            isAssigned
                                            ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                        }`}
                                    >
                                        {isAssigned ? 'Remove' : 'Assign'}
                                    </button>
                                </div>
                            )})}
                            {users.filter(u => u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || u.email.toLowerCase().includes(userSearchTerm.toLowerCase())).length === 0 && (
                                <p className="text-center text-gray-500 py-4">No users found.</p>
                            )}
                        </div>
                        </>
                        )}
                    </div>
                    <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                        <button onClick={() => { setShowUserModal(false); setIsCreatingUser(false); setUserSearchTerm(''); }} className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">Done</button>
                    </div>
                </div>
            </div>
          )}
    </div>
  );
};

export default AdminRoles;