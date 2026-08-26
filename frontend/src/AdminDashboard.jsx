import { useEffect, useState } from 'react'

function AdminDashboard() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/bookings')
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

        <div className="booking-count">
          <strong>{bookings.length}</strong>
          <span>Total Bookings</span>
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
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.name}</td>
                  <td>{booking.phone}</td>
                  <td>{booking.registration}</td>
                  <td>{booking.service}</td>
                  <td>{booking.appointment_date}</td>
                  <td>{booking.appointment_time}</td>
                  <td>
                    <span className={`status ${booking.status}`}>
                      {booking.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default AdminDashboard