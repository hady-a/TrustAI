import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { userAPI } from "../../lib/api"

interface User {
    id: string
    name: string
    email: string
    role: "ADMIN" | "USER"
    isActive: boolean
    createdAt: string
}

export default function AdminUsers() {
    const navigate = useNavigate()
    const [searchTerm, setSearchTerm] = useState("")
    const [filterRole, setFilterRole] = useState<"ALL" | "ADMIN" | "USER">("ALL")
    const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
    const [users, setUsers] = useState<User[]>([])
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<Partial<User> | null>(null)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "USER" as const })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await userAPI.getAll()
            setUsers(response.data.data)
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch users")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter((user) => {
        const matchesSearch =
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = filterRole === "ALL" || user.role === filterRole
        const matchesStatus =
            filterStatus === "ALL" ||
            (filterStatus === "ACTIVE" ? user.isActive : !user.isActive)
        return matchesSearch && matchesRole && matchesStatus
    })

    const handleEdit = (user: User) => {
        setEditingId(user.id)
        setEditData({ ...user })
    }

    const handleSaveEdit = async (userId: string) => {
        if (editData) {
            try {
                const response = await userAPI.update(userId, {
                    name: editData.name,
                    role: editData.role,
                    isActive: editData.isActive,
                })
                setUsers(users.map((u) => (u.id === userId ? response.data.data : u)))
                setEditingId(null)
                setEditData(null)
                setSuccessMessage("User updated successfully!")
                setTimeout(() => setSuccessMessage(null), 3000)
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to update user")
            }
        }
    }

    const handleDelete = async (userId: string) => {
        if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            try {
                await userAPI.delete(userId)
                setUsers(users.filter((u) => u.id !== userId))
                setSuccessMessage("User deleted successfully!")
                setTimeout(() => setSuccessMessage(null), 3000)
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to delete user")
            }
        }
    }

    const handleAddUser = async () => {
        if (newUser.name && newUser.email && newUser.password) {
            try {
                const response = await userAPI.create({
                    name: newUser.name,
                    email: newUser.email,
                    password: newUser.password,
                    role: newUser.role,
                })
                setUsers([...users, response.data.data])
                setNewUser({ name: "", email: "", password: "", role: "USER" })
                setShowAddForm(false)
                setSuccessMessage("User created successfully!")
                setTimeout(() => setSuccessMessage(null), 3000)
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to create user")
            }
        } else {
            setError("Please fill in all fields")
        }
    }

    const adminCount = users.filter((u) => u.role === "ADMIN").length
    const activeCount = users.filter((u) => u.isActive).length

    return (
        <div className="min-h-screen bg-stone-50 dark:from-[#0B0F19] dark:via-[#1a1f3a] dark:to-[#0B0F19] dark:bg-gradient-to-br relative overflow-hidden pt-8 pb-12 px-6">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div
                    className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, 30, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, -30, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                    {/* Messages */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 font-semibold flex items-center gap-3"
                            >
                                <span className="text-lg">⚠️</span> {error}
                            </motion.div>
                        )}
                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-semibold flex items-center gap-3"
                            >
                                <span className="text-lg">✓</span> {successMessage}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Header Section with Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mb-12"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-2">Users</h2>
                                <p className="text-gray-400">Manage system users and permissions</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="relative group px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
                            >
                                <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="inline-block mr-2">
                                    +
                                </motion.span>
                                Add New User
                            </motion.button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="backdrop-blur-xl bg-gradient-to-br from-blue-900/40 to-cyan-900/20 border border-cyan-500/30 rounded-2xl p-6"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm font-semibold mb-1">Total Users</p>
                                        <p className="text-4xl font-black text-white">{users.length}</p>
                                    </div>
                                    <span className="text-5xl">👥</span>
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.25 }}
                                className="backdrop-blur-xl bg-gradient-to-br from-emerald-900/40 to-teal-900/20 border border-emerald-500/30 rounded-2xl p-6"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm font-semibold mb-1">Active</p>
                                        <p className="text-4xl font-black text-white">{activeCount}</p>
                                    </div>
                                    <span className="text-5xl">✓</span>
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="backdrop-blur-xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/30 rounded-2xl p-6"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-400 text-sm font-semibold mb-1">Admins</p>
                                        <p className="text-4xl font-black text-white">{adminCount}</p>
                                    </div>
                                    <span className="text-5xl">⚙️</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Filters and Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.35 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-purple-900/30 to-indigo-900/20 border border-purple-500/30 rounded-2xl p-6 mb-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</motion.span>
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 focus:bg-white/10 transition-all backdrop-blur-xl"
                                />
                            </div>

                            {/* Role Filter */}
                            <select
                                title="Filter users by role"
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value as any)}
                                className="px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-500/60 focus:bg-white/10 transition-all backdrop-blur-xl"
                            >
                                <option value="ALL">All Roles</option>
                                <option value="ADMIN">Admin Only</option>
                                <option value="USER">User Only</option>
                            </select>

                            {/* Status Filter */}
                            <select
                                title="Filter users by status"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-500/60 focus:bg-white/10 transition-all backdrop-blur-xl"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active Only</option>
                                <option value="INACTIVE">Inactive Only</option>
                            </select>
                        </div>
                    </motion.div>

                    {/* Add User Form */}
                    <AnimatePresence>
                        {showAddForm && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="backdrop-blur-xl bg-gradient-to-br from-cyan-900/40 to-blue-900/20 border border-cyan-500/40 rounded-2xl p-8 mb-12 shadow-2xl"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black text-white">Create New User</h3>
                                    <motion.button
                                        whileHover={{ scale: 1.15, rotate: 90 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => setShowAddForm(false)}
                                        className="text-gray-400 hover:text-cyan-400 transition-all text-3xl font-bold"
                                    >
                                        ✕
                                    </motion.button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60 focus:bg-white/10 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            placeholder="john@example.com"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60 focus:bg-white/10 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                            className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/60 focus:bg-white/10 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-300 mb-2">Role</label>
                                        <select
                                            title="Select user role for new user"
                                            value={newUser.role}
                                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                                            className="w-full px-4 py-3 bg-white/5 border border-cyan-500/30 rounded-xl text-white focus:outline-none focus:border-cyan-500/60 focus:bg-white/10 transition-all"
                                        >
                                            <option value="USER">User</option>
                                            <option value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleAddUser}
                                        className="px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:shadow-green-600/50 transition-all"
                                    >
                                        ✓ Create User
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setShowAddForm(false)
                                            setNewUser({ name: "", email: "", password: "", role: "USER" })
                                        }}
                                        className="px-8 py-3 rounded-xl font-bold bg-gray-700/50 text-gray-200 hover:bg-gray-700 hover:shadow-lg transition-all"
                                    >
                                        Cancel
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center py-24">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
                            />
                        </div>
                    )}

                    {/* Users Grid */}
                    {!loading && (
                        <>
                            {filteredUsers.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-24"
                                >
                                    <div className="text-6xl mb-4">🔍</div>
                                    <p className="text-xl font-semibold text-gray-400">No users found</p>
                                    <p className="text-gray-500 mt-2">Try adjusting your filters or search terms</p>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <AnimatePresence mode="popLayout">
                                        {filteredUsers.map((user, index) => (
                                            <motion.div
                                                key={user.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                                whileHover={{ y: -5 }}
                                                className="backdrop-blur-xl bg-gradient-to-br from-white/5 to-white/5 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-500/60 transition-all hover:shadow-2xl hover:shadow-purple-500/10"
                                            >
                                                <div className="flex items-start justify-between mb-6">
                                                    <div className="flex items-center gap-4 flex-1">
                                                        <motion.div
                                                            animate={{ scale: [1, 1.05, 1] }}
                                                            transition={{ duration: 2, repeat: Infinity }}
                                                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-cyan-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                                                        >
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </motion.div>
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-bold text-white">{user.name}</h3>
                                                            <p className="text-sm text-gray-400">{user.email}</p>
                                                            <p className="text-xs text-gray-500 mt-1">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <motion.span
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                                                        className={`text-2xl ${user.isActive ? "opacity-100" : "opacity-40"}`}
                                                    >
                                                        {user.role === "ADMIN" ? "⚙️" : "👤"}
                                                    </motion.span>
                                                </div>

                                                {editingId === user.id ? (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-400 mb-2 block">Role</label>
                                                            <select
                                                                title="Select user role for editing"
                                                                value={editData?.role || user.role}
                                                                onChange={(e) => setEditData({ ...editData, role: e.target.value as User["role"] })}
                                                                className="w-full px-4 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/60 focus:bg-white/10 transition-all"
                                                            >
                                                                <option value="USER">User</option>
                                                                <option value="ADMIN">Admin</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs font-semibold text-gray-400 mb-2 block">Status</label>
                                                            <select
                                                                title="Select user status for editing"
                                                                value={editData?.isActive ? "Active" : "Inactive"}
                                                                onChange={(e) => setEditData({ ...editData, isActive: e.target.value === "Active" })}
                                                                className="w-full px-4 py-2 bg-white/5 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/60 focus:bg-white/10 transition-all"
                                                            >
                                                                <option value="Active">Active</option>
                                                                <option value="Inactive">Inactive</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                                        <div className="bg-white/5 rounded-lg p-3 border border-purple-500/20">
                                                            <p className="text-xs font-semibold text-gray-400 mb-1">Role</p>
                                                            <p className="text-sm font-bold text-white">{user.role}</p>
                                                        </div>
                                                        <div className="bg-white/5 rounded-lg p-3 border border-purple-500/20">
                                                            <p className="text-xs font-semibold text-gray-400 mb-1">Status</p>
                                                            <motion.span
                                                                animate={{ scale: [1, 1.1, 1] }}
                                                                transition={{ duration: 2, repeat: Infinity }}
                                                                className={`text-xs font-bold px-2 py-1 rounded-lg inline-block ${
                                                                    user.isActive
                                                                        ? "bg-green-500/20 text-green-300"
                                                                        : "bg-red-500/20 text-red-300"
                                                                }`}
                                                            >
                                                                {user.isActive ? "🟢 Active" : "🔴 Inactive"}
                                                            </motion.span>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex gap-3 pt-6 border-t border-purple-500/20">
                                                    {editingId === user.id ? (
                                                        <>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleSaveEdit(user.id)}
                                                                className="flex-1 px-4 py-2 rounded-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm hover:shadow-lg transition-all"
                                                            >
                                                                ✓ Save
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => {
                                                                    setEditingId(null)
                                                                    setEditData(null)
                                                                }}
                                                                className="flex-1 px-4 py-2 rounded-lg font-bold bg-gray-700/50 text-gray-200 text-sm hover:bg-gray-700 transition-all"
                                                            >
                                                                Cancel
                                                            </motion.button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleEdit(user)}
                                                                className="flex-1 px-4 py-2 rounded-lg font-bold bg-purple-600/50 text-purple-200 text-sm hover:bg-purple-600 transition-all"
                                                            >
                                                                ✏️ Edit
                                                            </motion.button>
                                                            <motion.button
                                                                whileHover={{ scale: 1.05 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                onClick={() => handleDelete(user.id)}
                                                                className="flex-1 px-4 py-2 rounded-lg font-bold bg-red-600/50 text-red-200 text-sm hover:bg-red-600 transition-all"
                                                            >
                                                                🗑️ Delete
                                                            </motion.button>
                                                        </>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
    )
}
