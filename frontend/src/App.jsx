import { useEffect, useRef, useState } from 'react'
import './App.css'
import AdminDashboard from './AdminDashboard'

function EmailVerification() {
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('Verifying your email address...')
  const verificationStarted = useRef(false)

  useEffect(() => {
    if (verificationStarted.current) {
      return
    }

    verificationStarted.current = true

    const verifyEmail = async () => {
      const params = new URLSearchParams(window.location.search)
      const token = params.get('token')

      if (!token) {
        setStatus('error')
        setMessage('This verification link is invalid or incomplete.')
        return
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/auth/verify-email?token=${encodeURIComponent(token)}`
        )

        const data = await response.json()

        if (data.success) {
          setStatus('success')
          setMessage(data.message)
        } else {
          setStatus('error')
          setMessage(data.message || 'Unable to verify your email address.')
        }
      } catch (error) {
        console.error('Email verification failed:', error)
        setStatus('error')
        setMessage(
          'Unable to connect to the verification server. Please try again later.'
        )
      }
    }

    verifyEmail()
  }, [])

  return (
    <div className="verification-page">
      <div className="verification-card">
        <div className="verification-icon">
          {status === 'verifying' && '✉️'}
          {status === 'success' && '✓'}
          {status === 'error' && '⚠️'}
        </div>

        <p className="eyebrow">GARAGE BOOKING SYSTEM</p>

        <h1>
          {status === 'verifying' && 'Verifying Your Email'}
          {status === 'success' && 'Email Verified'}
          {status === 'error' && 'Verification Unsuccessful'}
        </h1>

        <p className="verification-message">
          {message}
        </p>

        {status === 'success' && (
          <div className="verification-success">
            <strong>Your staff account is now verified.</strong>
            <span>
              You can continue to the staff login page.
            </span>
          </div>
        )}

        {status === 'error' && (
          <div className="verification-error">
            <span>
              The verification link may be invalid or expired.
            </span>
          </div>
        )}

        {status === 'success' && (
          <a href="/login" className="primary-button verification-button">
            Go to Staff Login
          </a>
        )}

        {status === 'error' && (
          <a href="/" className="primary-button verification-button">
            Return to Home
          </a>
        )}
      </div>
    </div>
  )
}

function StaffRegistration() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
  })

  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))

    setStatus('idle')
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (formData.password !== formData.confirm_password) {
      setStatus('error')
      setMessage('Passwords do not match.')
      return
    }

    if (formData.password.length < 8) {
      setStatus('error')
      setMessage('Password must be at least 8 characters long.')
      return
    }

    setStatus('submitting')
    setMessage('Creating your staff account...')

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: formData.full_name,
            email: formData.email,
            password: formData.password,
          }),
        }
      )

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setMessage(
          data.message ||
          'Registration successful. Please check your email to verify your account.'
        )

        setFormData({
          full_name: '',
          email: '',
          password: '',
          confirm_password: '',
        })
      } else {
        setStatus('error')
        setMessage(
          data.message || 'Unable to create your staff account.'
        )
      }
    } catch (error) {
      console.error('Staff registration failed:', error)
      setStatus('error')
      setMessage(
        'Unable to connect to the registration server. Please try again later.'
      )
    }
  }

  return (
    <div className="verification-page">
      <div className="verification-card registration-card">
        <div className="verification-icon">🔐</div>

        <p className="eyebrow">GARAGE BOOKING SYSTEM</p>

        <h1>Create Staff Account</h1>

        <p className="verification-message">
          Register for staff access to the garage booking management system.
        </p>

        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="registration-form-group">
            <label htmlFor="full_name">Full Name</label>

            <input
              id="full_name"
              name="full_name"
              type="text"
              placeholder="Enter your full name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="registration-form-group">
            <label htmlFor="email">Email Address</label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="registration-form-group">
            <label htmlFor="password">Password</label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={handleChange}
              minLength="8"
              required
            />
          </div>

          <div className="registration-form-group">
            <label htmlFor="confirm_password">Confirm Password</label>

            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              placeholder="Re-enter your password"
              value={formData.confirm_password}
              onChange={handleChange}
              minLength="8"
              required
            />
          </div>

          <button
            type="submit"
            className="primary-button verification-button"
            disabled={status === 'submitting'}
          >
            {status === 'submitting'
              ? 'Creating Account...'
              : 'Create Staff Account'}
          </button>
        </form>

        {status === 'success' && (
          <div className="verification-success">
            <strong>Registration successful.</strong>

            <span>
              Please check your email and click the verification link
              to activate your staff account.
            </span>
          </div>
        )}

        {status === 'error' && (
          <div className="verification-error">
            <span>{message}</span>
          </div>
        )}

        {status === 'success' && (
          <a href="/" className="secondary-link">
            Return to Home
          </a>
        )}
      </div>
    </div>
  )
}

function StaffLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))

    setStatus('idle')
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setStatus('submitting')
    setMessage('Signing you in...')

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      )

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('garage_staff_token', data.token)
        localStorage.setItem(
          'garage_staff_user',
          JSON.stringify(data.staff)
        )

        setStatus('success')
        setMessage('Login successful. Redirecting to the staff dashboard...')

        window.location.href = '/admin'
      } else {
        setStatus('error')
        setMessage(
          data.message || 'Unable to sign in. Please check your details.'
        )
      }
    } catch (error) {
      console.error('Staff login failed:', error)

      setStatus('error')
      setMessage(
        'Unable to connect to the login server. Please try again later.'
      )
    }
  }

  return (
    <div className="verification-page">
      <div className="verification-card login-card">
        <div className="verification-icon">🔐</div>

        <p className="eyebrow">GARAGE BOOKING SYSTEM</p>

        <h1>Staff Login</h1>

        <p className="verification-message">
          Sign in to access the garage booking management system.
        </p>

        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="registration-form-group">
            <label htmlFor="login-email">Email Address</label>

            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="registration-form-group">
            <label htmlFor="login-password">Password</label>

            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="primary-button verification-button"
            disabled={status === 'submitting'}
          >
            {status === 'submitting'
              ? 'Signing In...'
              : 'Sign In'}
          </button>
        </form>

        {status === 'error' && (
          <div className="verification-error">
            <span>{message}</span>
          </div>
        )}

        <a href="/register" className="secondary-link">
          Create Staff Account
        </a>
      </div>
    </div>
  )
}

function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    registration: '',
    service: '',
    date: '',
    time: '',
  })

  const [bookingStatus, setBookingStatus] = useState('idle')
  const [bookingMessage, setBookingMessage] = useState('')


  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const [contactStatus, setContactStatus] = useState('idle')
  const [contactMessage, setContactMessage] = useState('')


  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))

    setBookingStatus('idle')
    setBookingMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setBookingStatus('submitting')
    setBookingMessage('Submitting your booking...')

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
        const emailFailed = data.message
          ?.toLowerCase()
          .includes('email could not be sent')

        setBookingStatus(emailFailed ? 'warning' : 'success')
        setBookingMessage(
          data.message || 'Your booking was submitted successfully.'
        )
      } else {
        setBookingStatus('error')
        setBookingMessage(
          data.message || 'Unable to submit your booking.'
        )
      }
    } catch (error) {
      console.error('Booking submission failed:', error)
      setBookingStatus('error')
      setBookingMessage(
        'Unable to connect to the booking server. Please try again later.'
      )
    }
  }


  const handleContactChange = (event) => {
    const { name, value } = event.target

    setContactFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }))

    setContactStatus('idle')
    setContactMessage('')
  }

  const handleContactSubmit = async (event) => {
    event.preventDefault()

    setContactStatus('submitting')
    setContactMessage('Sending your enquiry...')

    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactFormData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setContactStatus('success')
        setContactMessage(data.message)
        setContactFormData({
          name: '',
          email: '',
          message: '',
        })
      } else {
        setContactStatus('error')
        setContactMessage(
          data.message || 'Unable to send your enquiry.'
        )
      }
    } catch (error) {
      console.error('Contact enquiry failed:', error)
      setContactStatus('error')
      setContactMessage(
        'Unable to connect to the server. Please try again later.'
      )
    }
  }


  const today = new Date().toISOString().split('T')[0]

  const currentPath = window.location.pathname

  if (currentPath === '/verify-email') {
    return <EmailVerification />
  }

  if (currentPath === '/register') {
    return <StaffRegistration />
  }

  if (currentPath === '/login') {
    return <StaffLogin />
  }

  if (currentPath === '/admin') {
    return <AdminDashboard />
  }

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
          <a href="#contact">Contact</a>
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
              <label htmlFor="email">
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email address"
                value={formData.email}
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
              disabled={bookingStatus === 'submitting'}
            >
              {bookingStatus === 'submitting'
                ? 'Submitting Booking...'
                : 'Submit Booking'}
            </button>

            {bookingStatus !== 'idle' && (
              <div

                className={
                  bookingStatus === 'error'
                    ? 'booking-error'
                    : bookingStatus === 'warning'
                      ? 'booking-warning'
                      : bookingStatus === 'submitting'
                        ? 'booking-submitting'
                        : 'booking-success'
                }

                role={bookingStatus === 'error' ? 'alert' : 'status'}
                aria-live="polite"
              >
                {bookingStatus === 'submitting' && (
                  <strong>Submitting booking...</strong>
                )}

                {bookingStatus === 'success' && (
                  <strong>Booking submitted successfully.</strong>
                )}

                {bookingStatus === 'warning' && (
                  <strong>Booking saved — email notification issue.</strong>
                )}

                {bookingStatus === 'error' && (
                  <strong>Booking unsuccessful.</strong>
                )}

                <span>{bookingMessage}</span>
              </div>
            )}
          </form>
        </section>


        <section id="contact" className="booking">
          <div className="booking-header">
            <p className="eyebrow">GET IN TOUCH</p>
            <h2>Contact Us</h2>
            <p>Have a question? Send us an enquiry.</p>
          </div>

          <form className="booking-form" onSubmit={handleContactSubmit}>
            <div className="form-group">
              <label htmlFor="contact-name">Your Name</label>
              <input
                id="contact-name"
                name="name"
                type="text"
                value={contactFormData.name}
                onChange={handleContactChange}
                maxLength={100}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-email">Email Address</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                value={contactFormData.email}
                onChange={handleContactChange}
                maxLength={254}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact-message">Your Message</label>
              <textarea
                id="contact-message"
                name="message"
                rows={5}
                value={contactFormData.message}
                onChange={handleContactChange}
                maxLength={3000}
                required
              />
            </div>

            <button
              type="submit"
              className="primary-button booking-button"
              disabled={contactStatus === 'submitting'}
            >
              {contactStatus === 'submitting'
                ? 'Sending Enquiry...'
                : 'Send Enquiry'}
            </button>

            {contactStatus !== 'idle' && (
              <div
                className={
                  contactStatus === 'error'
                    ? 'booking-error'
                    : contactStatus === 'success'
                      ? 'booking-success'
                      : 'booking-submitting'
                }
                role={contactStatus === 'error' ? 'alert' : 'status'}
                aria-live="polite"
              >
                <span>{contactMessage}</span>
              </div>
            )}
          </form>
        </section>


      </main>

      <footer>
        <p>
          © 2026 Garage Booking System. All rights reserved.
        </p>
      </footer>
    </div>
  )
}

export default App