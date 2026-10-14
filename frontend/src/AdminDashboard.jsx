import { useEffect, useState } from 'react'

function AdminDashboard() {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [invoiceLoadingId, setInvoiceLoadingId] = useState(null)
    const [invoiceConfirmId, setInvoiceConfirmId] = useState(null)
    const [invoiceNotice, setInvoiceNotice] = useState(null)

    const totalBookings = bookings.length

    const pendingBookings = bookings.filter(
        (booking) => booking.status === 'pending'
    ).length

    const confirmedBookings = bookings.filter(
        (booking) => booking.status === 'confirmed'
    ).length

    const cancelledBookings = bookings.filter(
        (booking) => booking.status === 'cancelled'
    ).length

    const completedBookings = bookings.filter(
        (booking) => booking.status === 'completed'
    ).length

    const filteredBookings = bookings.filter((booking) => {
        const search = searchTerm.toLowerCase().trim()

        const matchesSearch =
            !search ||
            booking.name.toLowerCase().includes(search) ||
            booking.phone.includes(search) ||
            booking.registration.toLowerCase().includes(search) ||
            booking.service.toLowerCase().includes(search)

        const matchesStatus =
            statusFilter === 'all' ||
            booking.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const formatDate = (date) => {
        if (!date) return '-'

        return new Date(date).toLocaleDateString('en-AU', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    }

    const formatTime = (time) => {
        if (!time) return '-'

        const [hours, minutes] = time.split(':')
        const date = new Date()

        date.setHours(Number(hours), Number(minutes), 0, 0)

        return date.toLocaleTimeString('en-AU', {
            hour: 'numeric',
            minute: '2-digit',
        })
    }

    const updateBookingStatus = async (id, status) => {
        try {
            const token = localStorage.getItem('garage_staff_token')

            const response = await fetch(
                `http://localhost:5000/api/bookings/${id}/status`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ status }),
                }
            )

            const data = await response.json()

            if (data.success) {
                setBookings((currentBookings) =>
                    currentBookings.map((booking) =>
                        booking.id === id
                            ? { ...booking, status: data.booking.status }
                            : booking
                    )
                )
            } else {
                alert(data.message)
            }
        } catch (error) {
            console.error('Failed to update booking status:', error)
            alert('Unable to update booking status.')
        }
    }


    const sendInvoice = async (id) => {
        const token = localStorage.getItem('garage_staff_token')

        if (!token) {
            setInvoiceNotice({
                type: 'error',
                message: 'Please log in again to continue.',
            })
            return
        }

        setInvoiceLoadingId(id)

        try {
            const response = await fetch(
                `http://localhost:5000/api/bookings/${id}/invoice`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data.message || 'Unable to send invoice.'
                )
            }

            setInvoiceNotice({
                type: 'success',
                message: `Invoice ${data.invoiceNumber} was emailed successfully.`,
            })
        } catch (error) {
            setInvoiceNotice({
                type: 'error',
                message: error.message || 'Unable to send invoice.',
            })
        } finally {
            setInvoiceLoadingId(null)
        }
    }


    const fetchBookings = async () => {
        try {
            setLoading(true)
            setError('')

            const token = localStorage.getItem('garage_staff_token')

            const response = await fetch(
                'http://localhost:5000/api/bookings',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            )
            const data = await response.json()

            if (data.success) {
                setBookings(data.bookings)
            } else {
                setError('Unable to load bookings.')
            }
        } catch (error) {
            console.error('Failed to load bookings:', error)
            setError('Unable to connect to the booking server.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBookings()
    }, [])

    return (
        <section className="admin-dashboard">

            {invoiceNotice && (
                <div
                    className={`invoice-notice ${invoiceNotice.type}`}
                    role="status"
                    aria-live="polite"
                >
                    <span>
                        {invoiceNotice.type === 'success' ? '✓' : '⚠'}
                    </span>

                    <p>{invoiceNotice.message}</p>

                    <button
                        type="button"
                        onClick={() => setInvoiceNotice(null)}
                        aria-label="Dismiss notification"
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="admin-header">
                <div>
                    <p className="eyebrow">STAFF PORTAL</p>
                    <h1>Booking Dashboard</h1>
                    <p>
                        View and manage customer service bookings.
                    </p>
                </div>

                <div className="booking-summary">
                    <div className="summary-card">
                        <strong>{totalBookings}</strong>
                        <span>Total</span>
                    </div>

                    <div className="summary-card">
                        <strong>{pendingBookings}</strong>
                        <span>Pending</span>
                    </div>

                    <div className="summary-card">
                        <strong>{confirmedBookings}</strong>
                        <span>Confirmed</span>
                    </div>

                    <div className="summary-card">
                        <strong>{cancelledBookings}</strong>
                        <span>Cancelled</span>
                    </div>


                    <div className="summary-card">
                        <strong>{completedBookings}</strong>
                        <span>Completed</span>
                    </div>

                </div>
            </div>

            {loading && (
                <p className="dashboard-message">
                    Loading bookings...
                </p>
            )}

            {error && (
                <p className="dashboard-error">
                    {error}
                </p>
            )}

            {!loading && !error && bookings.length === 0 && (
                <p className="dashboard-message">
                    No bookings found.
                </p>
            )}

            {!loading && !error && bookings.length > 0 && (
                <>
                    <div className="booking-controls">
                        <input
                            type="text"
                            placeholder="Search customer, phone, registration..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="booking-search"
                        />

                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="booking-filter"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>

                        <button
                            type="button"
                            className="refresh-button"
                            onClick={fetchBookings}
                            disabled={loading}
                        >
                            Refresh
                        </button>
                    </div>

                    <div className="bookings-table-container">
                        <table className="bookings-table">
                            <thead>
                                <tr>
                                    <th>Customer</th>
                                    <th>Phone</th>
                                    <th>Registration</th>
                                    <th>Service</th>
                                    <th>Date</th>
                                    <th>Time</th>
                                    <th>Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredBookings.map((booking) => (
                                    <tr key={booking.id}>
                                        <td>{booking.name}</td>
                                        <td>{booking.phone}</td>
                                        <td>{booking.registration}</td>
                                        <td>{booking.service}</td>
                                        <td>{formatDate(booking.appointment_date)}</td>
                                        <td>{formatTime(booking.appointment_time)}</td>
                                        <td>
                                            <div className="booking-actions">
                                                <span className={`status ${booking.status}`}>
                                                    {booking.status}
                                                </span>

                                                {booking.status === 'pending' && (
                                                    <>
                                                        <button
                                                            className="confirm-button"
                                                            onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                                        >
                                                            Confirm
                                                        </button>

                                                        <button
                                                            className="cancel-button"
                                                            onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}


                                                {booking.status === 'confirmed' && (
                                                    <button
                                                        className="confirm-button"
                                                        onClick={() => updateBookingStatus(booking.id, 'completed')}
                                                    >
                                                        Mark Completed
                                                    </button>
                                                )}


                                                {booking.status === 'completed' && (
                                                    <button
                                                        className="confirm-button"
                                                        onClick={() => setInvoiceConfirmId(booking.id)}
                                                        disabled={invoiceLoadingId === booking.id}
                                                    >
                                                        {invoiceLoadingId === booking.id
                                                            ? 'Sending...'
                                                            : 'Generate & Send Invoice'}
                                                    </button>
                                                )}


                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredBookings.length === 0 && (
                        <p className="dashboard-message">
                            No bookings match your search or filter.
                        </p>
                    )}


                    {invoiceConfirmId !== null && (
                        <div className="invoice-modal-overlay">
                            <div
                                className="invoice-modal"
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="invoice-modal-title"
                            >
                                <div className="invoice-modal-icon">✉</div>

                                <h2 id="invoice-modal-title">Send provisional invoice?</h2>

                                <p>
                                    You are about to email a provisional invoice to:
                                </p>

                                <p className="invoice-modal-customer">
                                    {bookings.find(
                                        (booking) => booking.id === invoiceConfirmId
                                    )?.name}
                                </p>

                                <p className="invoice-modal-note">
                                    The invoice uses hypothetical prices. Please verify
                                    the details before sending. Each booking can have only
                                    one invoice record.
                                </p>

                                <div className="invoice-modal-actions">
                                    <button
                                        type="button"
                                        className="invoice-modal-cancel"
                                        onClick={() => setInvoiceConfirmId(null)}
                                        disabled={invoiceLoadingId !== null}
                                    >
                                        Go Back
                                    </button>

                                    <button
                                        type="button"
                                        className="confirm-button"
                                        onClick={async () => {
                                            const id = invoiceConfirmId
                                            setInvoiceConfirmId(null)
                                            await sendInvoice(id)
                                        }}
                                        disabled={invoiceLoadingId !== null}
                                    >
                                        Confirm & Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </>
            )}
        </section>
    )
}

export default AdminDashboard
