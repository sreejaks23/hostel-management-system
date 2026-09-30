import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiPlus, FiCreditCard, FiDollarSign, FiCalendar, FiCheck } from "react-icons/fi";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import Badge from "../components/Badge.jsx";
import Modal from "../components/Modal.jsx";
import Pagination from "../components/Pagination.jsx";
import StripeCheckout from "../components/StripeCheckout.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const PAGE_SIZE = 10;

const emptyInvoice = {
  residentId: "",
  from: "",
  to: "",
  dueDate: "",
  roomFee: 0,
  utilities: 0,
  services: 0,
  discount: 0,
  lateFee: 0,
};

const Billing = () => {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "staff";
  const [invoices, setInvoices] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [residents, setResidents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyInvoice);
  const [detail, setDetail] = useState(null);
  const [payAmount, setPayAmount] = useState("");

  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({ numberOfInstallments: 3, startDate: "", intervalDays: 30 });

  const [checkoutSecret, setCheckoutSecret] = useState(null);

  const fetchInvoices = async (targetPage = page) => {
    setLoading(true);
    try {
      const { data } = await api.get("/billing/invoices", { params: { page: targetPage, limit: PAGE_SIZE } });
      setInvoices(data.invoices);
      setTotal(data.total);
      setPage(targetPage);
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchResidents = async () => {
    if (!isStaff) return;
    try {
      const { data } = await api.get("/residents", { params: { limit: 100 } });
      setResidents(data.residents);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchInvoices(1);
    fetchResidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const items = [
      { description: "Room fee", category: "room_fee", amount: Number(form.roomFee) || 0 },
      { description: "Utilities", category: "utility", amount: Number(form.utilities) || 0 },
      { description: "Additional services", category: "service", amount: Number(form.services) || 0 },
    ].filter((i) => i.amount > 0);

    try {
      await api.post("/billing/invoices", {
        residentId: form.residentId,
        billingPeriod: { from: form.from, to: form.to },
        items,
        discount: Number(form.discount) || 0,
        lateFee: Number(form.lateFee) || 0,
        dueDate: form.dueDate,
      });
      toast.success("Invoice created");
      setShowCreate(false);
      setForm(emptyInvoice);
      fetchInvoices(1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create invoice");
    }
  };

  const openDetail = async (inv) => {
    try {
      const { data } = await api.get(`/billing/invoices/${inv._id}`);
      setDetail(data);
    } catch {
      toast.error("Failed to load invoice");
    }
  };

  const refreshDetail = async () => {
    if (!detail) return;
    const { data } = await api.get(`/billing/invoices/${detail.invoice._id}`);
    setDetail(data);
  };

  const recordPayment = async () => {
    if (!payAmount || Number(payAmount) <= 0) return toast.error("Enter a valid amount");
    try {
      const { data } = await api.post(`/billing/invoices/${detail.invoice._id}/pay`, {
        amount: Number(payAmount),
        method: "cash",
      });
      toast.success("Payment recorded");
      setDetail({ invoice: data.invoice, payments: [data.payment, ...detail.payments] });
      setPayAmount("");
      fetchInvoices(page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record payment");
    }
  };

  const payOnline = async () => {
    try {
      const { data } = await api.post(`/billing/invoices/${detail.invoice._id}/create-payment-intent`);
      setCheckoutSecret(data.clientSecret);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start online payment");
    }
  };

  const onCheckoutSuccess = async () => {
    setCheckoutSecret(null);
    await refreshDetail();
    fetchInvoices(page);
  };

  const createPaymentPlan = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(`/billing/invoices/${detail.invoice._id}/payment-plan`, {
        numberOfInstallments: Number(planForm.numberOfInstallments),
        startDate: planForm.startDate || undefined,
        intervalDays: Number(planForm.intervalDays),
      });
      toast.success("Payment plan created");
      setShowPlanForm(false);
      setDetail({ ...detail, invoice: data.invoice });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create payment plan");
    }
  };

  const payInstallment = async (installmentId) => {
    try {
      const { data } = await api.post(`/billing/invoices/${detail.invoice._id}/installments/${installmentId}/pay`, {
        method: "cash",
      });
      toast.success("Installment marked as paid");
      setDetail({ invoice: data.invoice, payments: [data.payment, ...detail.payments] });
      fetchInvoices(page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to record installment payment");
    }
  };

  const balanceDue = detail ? detail.invoice.total - detail.invoice.amountPaid : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-500 text-sm">{isStaff ? "Manage invoices and payments" : "View your invoices and pay online"}</p>
        </div>
        {isStaff && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <FiPlus /> New Invoice
          </button>
        )}
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">Invoice #</th>
                {isStaff && <th className="py-2 pr-4">Resident</th>}
                <th className="py-2 pr-4">Due Date</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Paid</th>
                <th className="py-2 pr-4">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id} className="border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50" onClick={() => openDetail(inv)}>
                  <td className="py-3 pr-4 font-medium text-gray-700">{inv.invoiceNumber}</td>
                  {isStaff && <td className="py-3 pr-4 text-gray-500">{inv.resident?.firstName} {inv.resident?.lastName}</td>}
                  <td className="py-3 pr-4 text-gray-500">{new Date(inv.dueDate).toDateString()}</td>
                  <td className="py-3 pr-4">${inv.total?.toFixed(2)}</td>
                  <td className="py-3 pr-4">${inv.amountPaid?.toFixed(2)}</td>
                  <td className="py-3 pr-4"><Badge status={inv.status} /></td>
                  <td className="py-3 pr-4 text-gray-600">View</td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={isStaff ? 7 : 6} className="py-8 text-center text-gray-400">No invoices yet.</td></tr>
              )}
            </tbody>
          </table>
          <Pagination page={page} limit={PAGE_SIZE} total={total} onPageChange={fetchInvoices} />
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Invoice" wide>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select required className="input sm:col-span-2" value={form.residentId} onChange={(e) => setForm({ ...form, residentId: e.target.value })}>
            <option value="">Select resident...</option>
            {residents.map((r) => (
              <option key={r._id} value={r._id}>{r.firstName} {r.lastName}</option>
            ))}
          </select>
          <div>
            <label className="label">Billing Period From</label>
            <input required type="date" className="input" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} />
          </div>
          <div>
            <label className="label">Billing Period To</label>
            <input required type="date" className="input" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input required type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Room Fee</label>
            <input type="number" className="input" value={form.roomFee} onChange={(e) => setForm({ ...form, roomFee: e.target.value })} />
          </div>
          <div>
            <label className="label">Utilities</label>
            <input type="number" className="input" value={form.utilities} onChange={(e) => setForm({ ...form, utilities: e.target.value })} />
          </div>
          <div>
            <label className="label">Additional Services</label>
            <input type="number" className="input" value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} />
          </div>
          <div>
            <label className="label">Discount</label>
            <input type="number" className="input" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          </div>
          <div>
            <label className="label">Late Fee</label>
            <input type="number" className="input" value={form.lateFee} onChange={(e) => setForm({ ...form, lateFee: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary sm:col-span-2 mt-2">Create Invoice</button>
        </form>
      </Modal>

      <Modal
        open={!!detail}
        onClose={() => {
          setDetail(null);
          setCheckoutSecret(null);
          setShowPlanForm(false);
        }}
        title={detail?.invoice?.invoiceNumber}
        wide
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge status={detail.invoice.status} />
              <p className="text-sm text-gray-500">Due {new Date(detail.invoice.dueDate).toDateString()}</p>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {detail.invoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="py-1.5 text-gray-600">{item.description}</td>
                    <td className="py-1.5 text-right text-gray-700">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-1.5">Total</td>
                  <td className="py-1.5 text-right">${detail.invoice.total.toFixed(2)}</td>
                </tr>
                <tr className="text-green-700">
                  <td className="py-1.5">Paid</td>
                  <td className="py-1.5 text-right">${detail.invoice.amountPaid.toFixed(2)}</td>
                </tr>
                <tr className="font-semibold text-red-600">
                  <td className="py-1.5">Balance Due</td>
                  <td className="py-1.5 text-right">${balanceDue.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            {checkoutSecret ? (
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Enter card details</p>
                <StripeCheckout
                  clientSecret={checkoutSecret}
                  onSuccess={onCheckoutSuccess}
                  onCancel={() => setCheckoutSecret(null)}
                />
              </div>
            ) : (
              balanceDue > 0 && (
                <div className="flex flex-col sm:flex-row gap-2">
                  {isStaff ? (
                    <>
                      <input type="number" placeholder="Amount" className="input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                      <button onClick={recordPayment} className="btn-primary whitespace-nowrap"><FiDollarSign /> Record Payment</button>
                      <button onClick={() => setShowPlanForm(!showPlanForm)} className="btn-outline whitespace-nowrap">
                        <FiCalendar /> Payment Plan
                      </button>
                    </>
                  ) : (
                    <button onClick={payOnline} className="btn-primary whitespace-nowrap"><FiCreditCard /> Pay Online</button>
                  )}
                </div>
              )
            )}

            {isStaff && showPlanForm && (
              <form onSubmit={createPaymentPlan} className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-3">
                <div>
                  <label className="label text-xs">Installments</label>
                  <input
                    type="number"
                    min={2}
                    max={12}
                    className="input"
                    value={planForm.numberOfInstallments}
                    onChange={(e) => setPlanForm({ ...planForm, numberOfInstallments: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label text-xs">Start Date</label>
                  <input
                    type="date"
                    className="input"
                    value={planForm.startDate}
                    onChange={(e) => setPlanForm({ ...planForm, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label text-xs">Days Between</label>
                  <input
                    type="number"
                    className="input"
                    value={planForm.intervalDays}
                    onChange={(e) => setPlanForm({ ...planForm, intervalDays: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn-primary col-span-3">Split into Installments</button>
              </form>
            )}

            {detail.invoice.installments?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Payment Plan</p>
                <div className="space-y-1">
                  {detail.invoice.installments.map((inst) => (
                    <div key={inst._id} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                      <div>
                        <p className="text-gray-700">{inst.description}</p>
                        <p className="text-xs text-gray-400">Due {new Date(inst.dueDate).toDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-700">${inst.amount.toFixed(2)}</span>
                        {inst.status === "paid" ? (
                          <Badge status="paid" />
                        ) : isStaff ? (
                          <button onClick={() => payInstallment(inst._id)} className="btn-outline text-xs px-2 py-1">
                            <FiCheck size={12} /> Mark Paid
                          </button>
                        ) : (
                          <Badge status="pending" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Payment History</p>
              <div className="space-y-1">
                {detail.payments?.map((p) => (
                  <div key={p._id} className="flex justify-between text-xs bg-gray-50 rounded px-3 py-2">
                    <span className="capitalize">{p.method} • {p.status}</span>
                    <span>${p.amount.toFixed(2)} {p.paidAt ? `on ${new Date(p.paidAt).toDateString()}` : ""}</span>
                  </div>
                ))}
                {detail.payments?.length === 0 && <p className="text-xs text-gray-400">No payments yet.</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Billing;
