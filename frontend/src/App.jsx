import { useState } from 'react'
import './App.css'
import AdminDashboard from './AdminDashboard'

function App() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    registration: '',
    service: '',
    date: '',
    time: '',
  })

  const [submitted, setSubmitted] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))

    setSubmitted(false)
  }

  const handleSubmit = async (event) => {
  event.preventDefault()

  try {
    const response = await fetch('http://localhost:5000/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (data.success) {
      setSubmitted(true)
    } else {
      alert(data.message)
    }
  } catch (error) {
    console.error('Booking submission failed:', error)
    alert('Unable to connect to the booking server.')
  }
}

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <span className="brand-icon">🔧</span>
          <span>Garage Booking</span>
        </div>

        <nav>
          <a href="#home">Home</a>
          <a href="#services">Services</a>
          <a href="#booking">Book a Service</a>
        </nav>
      </header>

      <main>
        <section id="home" className="hero">
          <div className="hero-content">
            <p className="eyebrow">PROFESSIONAL AUTO CARE</p>

            <h1>
              Your Car.
              <br />
              Our Care.
            </h1>

            <p className="hero-text">
              Book your vehicle service quickly and easily with our
              professional garage booking system.
            </p>

            <a href="#booking" className="primary-button">
              Book a Service
            </a>
          </div>

          <div className="hero-card">
            <div className="car-icon">🚗</div>

            <h2>Reliable Vehicle Service</h2>

            <p>
              Keep your vehicle running safely with professional garage
              services.
            </p>
          </div>
        </section>

        <section id="services" className="services">
          <p className="eyebrow">OUR SERVICES</p>

          <h2>What can we help you with?</h2>

          <div className="service-grid">
            <div className="service-card">
              <span>🛠️</span>

              <h3>General Service</h3>

              <p>
                Routine vehicle inspection and maintenance.
              </p>
            </div>

            <div className="service-card">
              <span>🛞</span>

              <h3>Tyres & Wheels</h3>

              <p>
                Tyre inspection, replacement and wheel services.
              </p>
            </div>

            <div className="service-card">
              <span>🔩</span>

              <h3>Mechanical Repairs</h3>

              <p>
                Professional diagnosis and mechanical repairs.
              </p>
            </div>
          </div>
        </section>

        <section id="booking" className="booking">
          <div className="booking-header">
            <p className="eyebrow">ONLINE BOOKING</p>

            <h2>Book Your Vehicle Service</h2>

            <p>
              Tell us a little about your vehicle and preferred
              service time.
            </p>
          </div>

          <form
            className="booking-form"
            onSubmit={handleSubmit}
          >
            <div className="form-group">
              <label htmlFor="name">
                Customer Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                Phone Number
              </label>

              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registration">
                Vehicle Registration
              </label>

              <input
                id="registration"
                name="registration"
                type="text"
                placeholder="e.g. ABC-123"
                value={formData.registration}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="service">
                Service Required
              </label>

              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select a service
                </option>

                <option value="General Service">
                  General Service
                </option>

                <option value="Tyres & Wheels">
                  Tyres & Wheels
                </option>

                <option value="Mechanical Repairs">
                  Mechanical Repairs
                </option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date">
                Preferred Date
              </label>

              <input
                id="date"
                name="date"
                type="date"
                min={today}
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">
                Preferred Time
              </label>

              <input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button booking-button"
            >
              Submit Booking
            </button>

            {submitted && (
              <div className="booking-success">
                <strong>Booking details captured.</strong>

                <span>
                  We are ready to connect this form to the
                  garage booking API.
                </span>
              </div>
            )}
          </form>
        </section>
      </main>

      <AdminDashboard />

      <footer>
        <p>
          © 2026 Garage Booking System. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

export default App