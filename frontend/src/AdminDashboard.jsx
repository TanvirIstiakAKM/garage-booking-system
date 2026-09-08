import { useEffect, useState } from 'react'

function AdminDashboard() {
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

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
                </>
            )}
        </section>
    )
}

export default AdminDashboard
