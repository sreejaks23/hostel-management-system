import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiPlus } from "react-icons/fi";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Pagination from "../components/Pagination.jsx";

const PAGE_SIZE = 10;
const emptyForm = { name: "", email: "", password: "", phone: "", role: "staff" };

const Users = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchUsers = async (targetPage = page) => {
    setLoading(true);
    try {
      const { data } = await api.get("/users", { params: { page: targetPage, limit: PAGE_SIZE } });
      setUsers(data.users);
      setTotal(data.total);
      setPage(targetPage);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/users", form);
      toast.success("User created");
      setShowCreate(false);
      setForm(emptyForm);
      fetchUsers(1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user");
    }
  };

  const toggleActive = async (u) => {
    try {
      await api.put(`/users/${u._id}`, { isActive: !u.isActive });
      toast.success(`User ${u.isActive ? "deactivated" : "activated"}`);
      fetchUsers(page);
    } catch {
      toast.error("Failed to update user");
    }
  };

  const changeRole = async (u, role) => {
    try {
      await api.put(`/users/${u._id}`, { role });
      toast.success("Role updated");
      fetchUsers(page);
    } catch {
      toast.error("Failed to update role");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm">Manage user accounts and roles</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <FiPlus /> New Staff/Admin User
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 pr-4 font-medium text-gray-700">{u.name}</td>
                  <td className="py-3 pr-4 text-gray-500">{u.email}</td>
                  <td className="py-3 pr-4">
                    <select className="input py-1 text-xs" value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                      <option value="resident">Resident</option>
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-3 pr-4"><Badge status={u.isActive ? "occupied" : "inactive"} /></td>
                  <td className="py-3 pr-4">
                    <button onClick={() => toggleActive(u)} className="text-gray-600 hover:underline text-xs">
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} limit={PAGE_SIZE} total={total} onPageChange={fetchUsers} />
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Staff/Admin User">
        <form onSubmit={handleCreate} className="space-y-3">
          <input required placeholder="Full Name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder="Email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required placeholder="Phone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input required type="password" minLength={6} placeholder="Password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="btn-primary w-full">Create User</button>
        </form>
      </Modal>
    </div>
  );
};

export default Users;
